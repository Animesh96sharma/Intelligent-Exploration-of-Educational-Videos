"""
Handles very long transcripts by splitting into manageable chunks.
"""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


def chunk_transcript(transcript: str, max_chars: int = 8000, overlap: int = 500) -> List[str]:
    """
    Split long transcript into overlapping chunks.
    
    Args:
        transcript: The full transcript text
        max_chars: Maximum characters per chunk (approx 2000 tokens)
        overlap: Characters to overlap between chunks for context
    
    Returns:
        List of transcript chunks
    """
    if len(transcript) <= max_chars:
        return [transcript]
    
    chunks = []
    start = 0
    
    while start < len(transcript):
        end = min(start + max_chars, len(transcript))
        
        # Try to break at a sentence boundary
        if end < len(transcript):
            # Look for period, question mark, exclamation, or newline
            for i in range(min(end + 200, len(transcript)), end, -1):
                if i < len(transcript) and transcript[i-1] in '.!?\n':
                    end = i
                    break
        
        chunks.append(transcript[start:end])
        start = end - overlap if end < len(transcript) else end
    
    logger.info(f"Split transcript of length {len(transcript)} into {len(chunks)} chunks")
    return chunks


def combine_chunk_summaries(chunk_summaries: List[str], chapter_title: str, call_llm_func) -> str:
    """
    Combine multiple chunk summaries into one coherent summary.
    Always returns a string (fallback to joining chunks if LLM fails).
    """
    if not chunk_summaries:
        return "No content available."
    
    if len(chunk_summaries) == 1:
        return chunk_summaries[0]
    
    combined = "\n\n---\n\n".join(chunk_summaries)
    
    prompt = f"""Combine these {len(chunk_summaries)} segment summaries into a single coherent chapter summary for "{chapter_title}".

Segment summaries:
{combined}

Return a single, flowing summary (2-3 paragraphs) that covers all key points without repetition.
"""
    
    result = call_llm_func(prompt)
    
    # If LLM fails, just join the chunks with newlines
    if result is None:
        logger.warning(f"LLM combination failed for '{chapter_title}', using simple concatenation")
        return "\n\n".join(chunk_summaries)
    
    return result