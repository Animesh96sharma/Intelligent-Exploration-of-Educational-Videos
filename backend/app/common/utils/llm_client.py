"""
backend/app/common/utils/llm_client.py

Shared LLM utilities:
  - Robust call_llm() with retry logic
  - parse_json_response() handles malformed LLM output
  - chunk_text() splits any-length transcript into safe-size pieces
  - summarize_long_text() merges chunk summaries for very long content
"""
import json
import re
import time
import logging
from typing import Optional

import ollama
from backend.app.config import (
    LLM_MODEL, LLM_MAX_RETRIES, LLM_RETRY_DELAY,
    CHUNK_CHAR_LIMIT, CHUNK_OVERLAP
)

logger = logging.getLogger(__name__)


# ── Core LLM call ─────────────────────────────────────────────────────────────

def call_llm(prompt: str, model: str = LLM_MODEL, retries: int = LLM_MAX_RETRIES) -> Optional[str]:
    """Call Ollama with retry + exponential backoff."""
    for attempt in range(retries):
        try:
            response = ollama.chat(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response["message"]["content"].strip()
        except Exception as e:
            wait = LLM_RETRY_DELAY * (2 ** attempt)
            logger.warning(f"LLM attempt {attempt + 1}/{retries} failed: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    logger.error("All LLM retries exhausted.")
    return None


def parse_json_response(raw: str) -> Optional[dict]:
    """
    Robustly parse LLM JSON output.
    Handles: clean JSON, JSON wrapped in ```json fences, JSON buried in prose.
    """
    if not raw:
        return None
    # Strip markdown fences if present
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to extract first {...} block
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    logger.error(f"Could not parse JSON from LLM output (first 300 chars):\n{raw[:300]}")
    return None


# ── Chunking — handles ANY transcript length ─────────────────────────────────

def chunk_text(text: str, limit: int = CHUNK_CHAR_LIMIT, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Split text into overlapping chunks that fit within the LLM context window.
    Tries to split on sentence boundaries to preserve coherence.
    
    Args:
        text:    Full transcript text (any length)
        limit:   Max characters per chunk
        overlap: Characters of overlap between adjacent chunks
    Returns:
        List of text chunks
    """
    if len(text) <= limit:
        return [text]

    # Split on sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', text)

    chunks = []
    current = []
    current_len = 0

    for sentence in sentences:
        s_len = len(sentence)

        # Single sentence exceeds limit — hard split it
        if s_len > limit:
            if current:
                chunks.append(" ".join(current))
                current = []
                current_len = 0
            # Hard-split the long sentence
            for i in range(0, s_len, limit - overlap):
                chunks.append(sentence[i: i + limit])
            continue

        if current_len + s_len + 1 > limit:
            chunks.append(" ".join(current))
            # Keep overlap sentences at the start of the next chunk
            overlap_sentences = []
            overlap_len = 0
            for s in reversed(current):
                if overlap_len + len(s) < overlap:
                    overlap_sentences.insert(0, s)
                    overlap_len += len(s)
                else:
                    break
            current = overlap_sentences
            current_len = overlap_len

        current.append(sentence)
        current_len += s_len + 1

    if current:
        chunks.append(" ".join(current))

    logger.debug(f"Chunked {len(text)} chars into {len(chunks)} chunks")
    return chunks


def summarize_long_text(text: str, context_label: str = "content") -> str:
    """
    For very long transcripts: summarize each chunk then merge.
    Returns a single merged plain-text summary (not JSON).
    Used as input to the main summarization prompts.
    """
    chunks = chunk_text(text)
    if len(chunks) == 1:
        return text  # short enough, return as-is

    logger.info(f"Long transcript: splitting into {len(chunks)} chunks for '{context_label}'")
    chunk_summaries = []

    for i, chunk in enumerate(chunks):
        prompt = f"""Summarize this portion ({i+1}/{len(chunks)}) of a lecture transcript. 
Be concise but preserve all key concepts, definitions, and examples.

Transcript portion:
{chunk}

Write a clear 3-5 sentence summary:"""
        raw = call_llm(prompt)
        if raw:
            chunk_summaries.append(raw.strip())
        else:
            logger.warning(f"Chunk {i+1} summarization failed, skipping.")

    if not chunk_summaries:
        return text[:CHUNK_CHAR_LIMIT]  # fallback: truncate

    # Merge chunk summaries
    merged_input = "\n\n".join(
        f"Part {i+1}: {s}" for i, s in enumerate(chunk_summaries)
    )
    merge_prompt = f"""Below are summaries of consecutive parts of a lecture on '{context_label}'.
Merge them into one coherent summary that flows naturally and preserves all key ideas.

{merged_input}

Write the merged summary (6-8 sentences):"""

    merged = call_llm(merge_prompt)
    return merged.strip() if merged else " ".join(chunk_summaries)