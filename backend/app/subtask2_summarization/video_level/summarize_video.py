"""
backend/app/subtask2_summarization/video_level/summarize_video.py

Aggregates chapter summaries → full video summary.
Implements BOTH extractive (TF-IDF TextRank) and abstractive (LLM) summarization.
"""
import json
import math
import logging
import re
from collections import Counter
from pathlib import Path
from typing import Optional

from backend.app.config import CHAPTER_SUM_DIR, VIDEO_SUM_DIR
from backend.app.common.utils.llm_client import call_llm, parse_json_response

logger = logging.getLogger(__name__)

# ── Video-level LLM prompt ────────────────────────────────────────────────────

VIDEO_PROMPT = """You are an expert educational content analyst.

Below are summaries of all chapters from a lecture titled: "{video_title}"
Speaker: {speaker} | Domain: {domain} | Duration: {duration_minutes} min | Chapters: {num_chapters}

Chapter summaries:
{chapters_text}

Return ONLY a JSON object with no markdown or extra text:
{{
  "summary_short": "2-3 sentence overview of the entire lecture",
  "summary_medium": "One detailed paragraph covering all major topics",
  "summary_long": "3-4 paragraph comprehensive summary of the full lecture",
  "key_concepts": ["5-8 most important concepts across all chapters"],
  "learning_objectives": ["3-5 overall learning objectives for the full video"],
  "prerequisites": ["topics a viewer should know before watching"],
  "topic_progression": "How topics build on each other throughout the video",
  "difficulty_level": "beginner | intermediate | advanced",
  "domain_tags": ["subject domain tags"],
  "has_code_examples": false,
  "has_mathematical_content": false,
  "has_diagrams": false
}}"""

PREREQUISITE_PROMPT = """Given this video summary, determine if this video is a prerequisite for, 
or requires, any of the other videos in this list.

Current video: "{title_current}"
Key concepts: {concepts_current}

Other videos:
{other_videos}

Return ONLY JSON:
{{
  "is_prerequisite_for": ["video_ids this video should be watched BEFORE"],
  "requires": ["video_ids that should be watched BEFORE this video"],
  "difficulty_rank": 1
}}
difficulty_rank: 1=most beginner, higher numbers = more advanced"""


# ── Extractive summarization (TF-IDF TextRank) ───────────────────────────────

def _tokenize(text: str) -> list[str]:
    stopwords = {
        "the","a","an","and","or","but","in","on","at","to","for","of","with",
        "is","are","was","were","be","been","being","have","has","had","do","does",
        "did","will","would","could","should","may","might","shall","this","that",
        "these","those","it","its","we","they","he","she","you","i","our","their",
        "from","by","as","so","if","then","than","when","while","after","before",
        "also","each","which","who","whom","all","some","any","both","about"
    }
    tokens = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return [t for t in tokens if t not in stopwords]


def extractive_summary(text: str, n_sentences: int = 5) -> str:
    """
    TF-IDF based extractive summarization.
    Scores each sentence by average TF-IDF of its words and picks top N.
    """
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.split()) > 5]
    if len(sentences) <= n_sentences:
        return text

    # Build TF-IDF
    doc_tokens = [_tokenize(s) for s in sentences]
    all_tokens = [t for tokens in doc_tokens for t in tokens]
    tf = Counter(all_tokens)
    n_docs = len(sentences)

    # IDF: log(N / df)
    df = Counter()
    for tokens in doc_tokens:
        for t in set(tokens):
            df[t] += 1
    idf = {t: math.log(n_docs / (df[t] + 1)) for t in df}

    # Score sentences
    scores = []
    for tokens in doc_tokens:
        if not tokens:
            scores.append(0.0)
            continue
        score = sum(tf[t] * idf.get(t, 0) for t in tokens) / len(tokens)
        scores.append(score)

    # Pick top N sentences preserving original order
    top_indices = sorted(
        sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:n_sentences]
    )
    return " ".join(sentences[i] for i in top_indices)


# ── Helpers ───────────────────────────────────────────────────────────────────

def format_chapters_for_prompt(chapters: list[dict]) -> str:
    lines = []
    for ch in chapters:
        lines.append(
            f"Chapter {ch['chapter_index']}: {ch['title']}\n"
            f"  Duration: {ch.get('duration_seconds', 0) // 60} min\n"
            f"  Summary: {ch.get('summary_medium', ch.get('summary_short', 'N/A'))}\n"
            f"  Key Concepts: {', '.join(ch.get('key_concepts', []))}"
        )
    return "\n\n".join(lines)


def build_chapter_timeline(chapters: list[dict]) -> list[dict]:
    return [
        {
            "chapter_index": ch["chapter_index"],
            "title":         ch["title"],
            "start_time":    ch["start_time"],
            "end_time":      ch["end_time"],
            "summary_short": ch.get("summary_short", ""),
            "key_concepts":  ch.get("key_concepts", []),
            "difficulty_level": ch.get("difficulty_level", "intermediate"),
            "has_visuals":   ch.get("has_visuals", False),
        }
        for ch in chapters
    ]


# ── Main summarization ────────────────────────────────────────────────────────

def summarize_video(chapter_data: dict) -> dict:
    video_id   = chapter_data["video_id"]
    chapters   = chapter_data["chapter_summaries"]
    dur_mins   = chapter_data.get("duration", 0) // 60

    logger.info(f"Summarizing video: {video_id} ({len(chapters)} chapters, {dur_mins} min)")

    # Build extractive summary from all chapter transcripts combined
    # (we use the chapter summaries as a proxy since we don't re-read transcripts here)
    all_chapter_text = " ".join(
        ch.get("summary_long", ch.get("summary_medium", "")) for ch in chapters
    )
    extractive = extractive_summary(all_chapter_text, n_sentences=6)

    # Build abstractive summary via LLM
    chapters_text = format_chapters_for_prompt(chapters)
    prompt = VIDEO_PROMPT.format(
        video_title=chapter_data["video_title"],
        speaker=chapter_data.get("speaker", "Unknown"),
        domain=chapter_data.get("domain", "Unknown"),
        duration_minutes=dur_mins,
        num_chapters=len(chapters),
        chapters_text=chapters_text
    )

    raw = call_llm(prompt)
    if raw is None:
        return {"video_id": video_id, "error": "LLM call failed"}

    parsed = parse_json_response(raw)
    if parsed is None:
        return {"video_id": video_id, "error": "JSON parse failed"}

    output = {
        "video_id":          video_id,
        "video_title":       chapter_data["video_title"],
        "speaker":           chapter_data.get("speaker", "Unknown"),
        "domain":            chapter_data.get("domain", "Unknown"),
        "duration":          chapter_data.get("duration", 0),
        "total_chapters":    len(chapters),
        "chapter_timeline":  build_chapter_timeline(chapters),
        "extractive_summary": extractive,
        **parsed
    }

    out_path = VIDEO_SUM_DIR / f"{video_id}_video_summary.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved → {out_path}")
    return output


def run_all(limit: Optional[int] = None) -> list[dict]:
    files = sorted(CHAPTER_SUM_DIR.glob("*_chapter_summaries.json"))
    if limit:
        files = files[:limit]
    if not files:
        logger.warning(f"No chapter summary files in {CHAPTER_SUM_DIR}")
        return []

    results = []
    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        results.append(summarize_video(data))

    logger.info(f"Done. {len(results)} video summaries generated.")
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    files = sorted(CHAPTER_SUM_DIR.glob("*_chapter_summaries.json"))
    if files:
        with open(files[0]) as f:
            summarize_video(json.load(f))
    else:
        print(f"No chapter summary files in {CHAPTER_SUM_DIR}. Run summarize_chapters.py first.")