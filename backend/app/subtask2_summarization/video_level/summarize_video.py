"""
subtask2_summarization/video_level/summarize_video.py

Aggregates chapter-level summaries into a full video summary.
Requires chapter summaries to be already generated.
"""

import json
import re
import time
import logging
from pathlib import Path
from typing import Optional

import ollama

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL     = "mistral"
DATA_ROOT = Path(__file__).resolve().parents[4] / "data" / "processed"
INPUT_DIR = DATA_ROOT / "subtask2_summarization" / "chapter_summaries"
OUTPUT_DIR = DATA_ROOT / "subtask2_summarization" / "video_summaries"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ── Prompt ────────────────────────────────────────────────────────────────────
VIDEO_SUMMARY_PROMPT = """You are an expert educational content analyst.

Below are summaries of all chapters from a lecture video titled: "{video_title}"
Speaker: {speaker}
Domain: {domain}
Total Duration: {duration_minutes} minutes
Number of Chapters: {num_chapters}

Chapter Summaries:
{chapter_summaries_text}

Create a comprehensive video-level summary. Return ONLY a JSON object with no markdown or extra text:
{{
  "summary_short": "2-3 sentence overview of the entire video",
  "summary_medium": "One detailed paragraph covering all major topics in the video",
  "summary_long": "3-4 paragraph comprehensive summary of the full lecture",
  "key_concepts": ["list of 5-8 most important concepts across all chapters"],
  "learning_objectives": ["3-5 overall learning objectives for the entire video"],
  "prerequisites": ["list of topics a viewer should know before watching"],
  "topic_progression": "Brief description of how topics build on each other throughout the video",
  "difficulty_level": "beginner | intermediate | advanced",
  "domain_tags": ["list of subject domain tags"],
  "has_code_examples": true,
  "has_mathematical_content": true,
  "has_diagrams": true
}}"""


# ── Core Functions ────────────────────────────────────────────────────────────

def call_llm(prompt: str, retries: int = 3) -> Optional[str]:
    for attempt in range(retries):
        try:
            response = ollama.chat(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            return response["message"]["content"].strip()
        except Exception as e:
            logger.warning(f"LLM attempt {attempt + 1} failed: {e}")
            time.sleep(2 ** attempt)
    return None


def parse_json_response(raw: str) -> Optional[dict]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    logger.error(f"Could not parse JSON:\n{raw[:300]}")
    return None


def format_chapters_for_prompt(chapter_summaries: list[dict]) -> str:
    """Build a readable multi-chapter text block for the prompt."""
    lines = []
    for ch in chapter_summaries:
        lines.append(
            f"Chapter {ch['chapter_index']}: {ch['title']}\n"
            f"  Duration: {ch.get('duration_seconds', 0) // 60} min\n"
            f"  Summary: {ch.get('summary_medium', ch.get('summary_short', 'N/A'))}\n"
            f"  Key Concepts: {', '.join(ch.get('key_concepts', []))}"
        )
    return "\n\n".join(lines)


def summarize_video(chapter_summary_data: dict) -> dict:
    """
    Generate a full video summary from pre-computed chapter summaries.
    """
    video_id       = chapter_summary_data["video_id"]
    video_title    = chapter_summary_data["video_title"]
    chapters       = chapter_summary_data["chapter_summaries"]
    duration_mins  = chapter_summary_data.get("duration", 0) // 60

    chapters_text  = format_chapters_for_prompt(chapters)

    prompt = VIDEO_SUMMARY_PROMPT.format(
        video_title=video_title,
        speaker=chapter_summary_data.get("speaker", "Unknown"),
        domain=chapter_summary_data.get("domain", "Unknown"),
        duration_minutes=duration_mins,
        num_chapters=len(chapters),
        chapter_summaries_text=chapters_text
    )

    logger.info(f"Generating video-level summary for: {video_id}")
    raw = call_llm(prompt)

    if raw is None:
        logger.error(f"LLM failed for video {video_id}")
        return {"video_id": video_id, "error": "LLM call failed"}

    parsed = parse_json_response(raw)
    if parsed is None:
        return {"video_id": video_id, "error": "JSON parse failed", "raw": raw}

    # Build chapter timeline (lightweight, for visualization layer)
    chapter_timeline = [
        {
            "chapter_index": ch["chapter_index"],
            "title":         ch["title"],
            "start_time":    ch["start_time"],
            "end_time":      ch["end_time"],
            "summary_short": ch.get("summary_short", ""),
            "key_concepts":  ch.get("key_concepts", [])
        }
        for ch in chapters
    ]

    output = {
        "video_id":        video_id,
        "video_title":     video_title,
        "speaker":         chapter_summary_data.get("speaker", "Unknown"),
        "domain":          chapter_summary_data.get("domain", "Unknown"),
        "duration":        chapter_summary_data.get("duration", 0),
        "total_chapters":  len(chapters),
        "chapter_timeline": chapter_timeline,
        **parsed
    }

    out_path = OUTPUT_DIR / f"{video_id}_video_summary.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved video summary → {out_path}")
    return output


# def run_all(limit: Optional[int] = None) -> list[dict]:
#     files = sorted(INPUT_DIR.glob("*_chapter_summaries.json"))
#     if limit:
#         files = files[:limit]

#     results = []
#     for path in files:
#         with open(path, "r", encoding="utf-8") as f:
#             data = json.load(f)
#         result = summarize_video(data)
#         results.append(result)

#     logger.info(f"\nDone. Processed {len(results)} videos.")
#     return results

def run_all(limit: Optional[int] = None) -> list[dict]:
    """Process all chapter summary files to create video summaries."""
    # ✅ USE THE EXISTING INPUT_DIR (defined at top)
    files = sorted(INPUT_DIR.glob("*_chapter_summaries.json"))
    
    logger.info(f"INPUT_DIR = {INPUT_DIR}")
    logger.info(f"Found {len(files)} chapter summary files")
    
    if limit:
        files = files[:limit]
        logger.info(f"Limited to first {limit} files")
    
    results = []
    for path in files:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            result = summarize_video(data)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to process {path.name}: {e}")
            continue
    
    logger.info(f"\nDone. Processed {len(results)} videos.")
    return results

if __name__ == "__main__":
    files = sorted(INPUT_DIR.glob("*_chapter_summaries.json"))
    if not files:
        print(f"No chapter summary files found in {INPUT_DIR}")
        print("Run summarize_chapters.py first.")
    else:
        with open(files[0]) as f:
            data = json.load(f)
        summarize_video(data)