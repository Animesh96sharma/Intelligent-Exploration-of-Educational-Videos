"""
backend/app/subtask2_summarization/chapter_level/summarize_chapters.py

Generates short/medium/long summaries for every chapter.
Handles ANY transcript length via automatic chunking.
"""
import json
import logging
from pathlib import Path
from typing import Optional

from backend.app.config import INPUT_DIR, CHAPTER_SUM_DIR, CHUNK_CHAR_LIMIT
from backend.app.common.utils.llm_client import call_llm, parse_json_response, summarize_long_text

logger = logging.getLogger(__name__)

# ── Prompt ────────────────────────────────────────────────────────────────────

CHAPTER_PROMPT = """You are an expert educational content analyst specializing in lecture summarization.

Analyze this lecture chapter and return ONLY a valid JSON object — no markdown, no explanation.

Chapter Title: {title}
Visual Content (frame captions):
{frame_captions}

Transcript:
{transcript}

Return exactly this JSON structure:
{{
  "summary_short": "1-2 sentence summary capturing the core message",
  "summary_medium": "One paragraph (4-6 sentences) covering all main ideas",
  "summary_long": "Detailed 2-3 paragraph summary covering all key points, examples, and conclusions",
  "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "learning_objectives": ["After this chapter, students will be able to ..."],
  "has_visuals": true,
  "visual_description": "Brief description of visual content shown (diagrams, code, formulas, etc.)",
  "difficulty_level": "beginner",
  "estimated_read_time_seconds": 90
}}

"""


# ── Core functions ────────────────────────────────────────────────────────────

def prepare_transcript(chapter: dict) -> str:
    """
    Prepare transcript for LLM. If transcript is very long,
    create a compressed version using chunk summarization first.
    """
    transcript = chapter.get("transcript", "")
    if len(transcript) <= CHUNK_CHAR_LIMIT:
        return transcript
    # Long transcript: pre-summarize before sending to chapter prompt
    logger.info(f"  Long transcript ({len(transcript)} chars) — pre-summarizing chunks first")
    return summarize_long_text(transcript, context_label=chapter.get("title", "chapter"))


def summarize_chapter(chapter: dict) -> dict:
    """Generate a full structured summary for one chapter."""
    frame_captions_text = "\n".join(
        f"- {cap}" for cap in chapter.get("frame_captions", [])
    ) or "No frame captions available."

    transcript = prepare_transcript(chapter)

    prompt = CHAPTER_PROMPT.format(
        title=chapter["title"],
        frame_captions=frame_captions_text,
        transcript=transcript
    )

    logger.info(f"  Summarizing: '{chapter['title']}'")
    raw = call_llm(prompt)

    if raw is None:
        logger.error(f"  LLM failed for '{chapter['title']}'")
        return {**_base_fields(chapter), "error": "LLM call failed"}

    parsed = parse_json_response(raw)
    if parsed is None:
        return {**_base_fields(chapter), "error": "JSON parse failed", "raw_llm_output": raw[:500]}

    return {**_base_fields(chapter), **parsed}


def _base_fields(chapter: dict) -> dict:
    return {
        "chapter_id":       chapter["chapter_id"],
        "chapter_index":    chapter["chapter_index"],
        "title":            chapter["title"],
        "start_time":       chapter["start_time"],
        "end_time":         chapter["end_time"],
        "duration_seconds": chapter["end_time"] - chapter["start_time"],
    }

# For the first structure of code uncomment below function and remove "normalize_video_json"

# def process_video_file(json_path: Path) -> dict:
#     """Load a video JSON, summarize all chapters, save output."""
#     with open(json_path, "r", encoding="utf-8") as f:
#         video_data = json.load(f)

#     video_id = video_data["video_id"]
#     chapters  = video_data["chapters"]

#     logger.info(f"\n{'='*60}")
#     logger.info(f"Video: {video_id} — {video_data['video_title']}")
#     logger.info(f"Chapters: {len(chapters)} | Duration: {video_data['duration']//60} min")
#     logger.info(f"{'='*60}")

#     summaries = [summarize_chapter(ch) for ch in chapters]

#     output = {
#         "video_id":          video_id,
#         "video_title":       video_data["video_title"],
#         "speaker":           video_data.get("speaker", "Unknown"),
#         "domain":            video_data.get("domain", "Unknown"),
#         "duration":          video_data["duration"],
#         "total_chapters":    len(summaries),
#         "chapter_summaries": summaries
#     }

#     out_path = CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json"
#     with open(out_path, "w", encoding="utf-8") as f:
#         json.dump(output, f, indent=2, ensure_ascii=False)

#     logger.info(f"Saved → {out_path}")
#     return output

def normalize_video_json(json_path: Path, raw_data: dict) -> dict:
    """
    Converts any input JSON format into the standard internal format.
    
    Supports:
      1. Mock format  — has top-level video_id, video_title, chapters
      2. Student A format — has metadata{} + chapters[]
      3. Partial format — has some fields missing, fills defaults
    """

    # ── Format 1: already has top-level video_id ──────────────────────────
    if "video_id" in raw_data and "chapters" in raw_data:
        return raw_data   # already correct format, return as-is

    # ── Format 2: Student A format with metadata block ────────────────────
    if "metadata" in raw_data and "chapters" in raw_data:
        meta = raw_data["metadata"]

        # Derive video_id from the filename (e.g. tib_av_00000_720p → tib_av_00000)
        stem = json_path.stem                          # e.g. tib_av_00000_720p_chapters
        video_id = stem.split("_chapters")[0]          # strip trailing _chapters if present
        video_id = video_id.replace("_transcripts", "").replace("_captions", "")

        # Try to get duration from metadata
        duration = int(meta.get("video_duration_seconds", 0))

        # Normalize each chapter — Student A chapters already have
        # chapter_id, chapter_index, title, start_time, end_time,
        # transcript, frame_captions, keywords
        chapters = raw_data["chapters"]

        return {
            "video_id":    video_id,
            "video_title": _title_from_path(json_path),
            "video_url":   f"https://av.tib.eu/media/{video_id}",
            "duration":    duration if duration > 0 else _estimate_duration(chapters),
            "language":    meta.get("language", "en"),
            "speaker":     meta.get("speaker", "Unknown"),
            "domain":      meta.get("domain", "Unknown"),
            "chapters":    chapters
        }

    # ── Format 3: Unknown — log warning and skip ──────────────────────────
    logger.error(
        f"Unrecognized JSON format in {json_path.name}. "
        f"Expected 'video_id'+'chapters' or 'metadata'+'chapters' at top level. "
        f"Top-level keys found: {list(raw_data.keys())}"
    )
    raise ValueError(f"Cannot parse {json_path.name} — unrecognized format")


def _title_from_path(json_path: Path) -> str:
    """Generate a human-readable title from the filename."""
    stem = json_path.stem
    # Remove common suffixes
    for suffix in ["_chapters", "_transcripts", "_captions", "_720p", "_1080p"]:
        stem = stem.replace(suffix, "")
    # Convert underscores to spaces and title-case
    return stem.replace("_", " ").title()


def _estimate_duration(chapters: list) -> int:
    """Estimate video duration from the last chapter's end_time."""
    if not chapters:
        return 0
    return max(ch.get("end_time", 0) for ch in chapters)

def process_video_file(json_path: Path) -> dict:
    """
    Load a video JSON, summarize chapters, save output.
    Handles both formats:
      - Mock format: {"video_id": "...", "video_title": "...", "chapters": [...]}
      - Student A format: {"metadata": {...}, "chapters": [...]}
    """
    with open(json_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # ── Normalize to a common structure ──────────────────────────────────────
    video_data = normalize_video_json(json_path, raw_data)

    video_id = video_data["video_id"]
    chapters  = video_data["chapters"]

    logger.info(f"\n{'='*60}")
    logger.info(f"Video: {video_id} — {video_data['video_title']}")
    logger.info(f"Chapters: {len(chapters)} | Duration: {video_data['duration']//60} min")
    logger.info(f"{'='*60}")

    summaries = [summarize_chapter(ch) for ch in chapters]

    output = {
        "video_id":          video_id,
        "video_title":       video_data["video_title"],
        "speaker":           video_data.get("speaker", "Unknown"),
        "domain":            video_data.get("domain", "Unknown"),
        "duration":          video_data["duration"],
        "total_chapters":    len(summaries),
        "chapter_summaries": summaries
    }

    out_path = CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved → {out_path}")
    return output

def run_all(limit: Optional[int] = None) -> list[dict]:
    """Process all video JSON files in INPUT_DIR."""
    files = sorted(INPUT_DIR.glob("*.json"))
    if limit:
        files = files[:limit]
    if not files:
        logger.warning(f"No JSON files found in {INPUT_DIR}")
        return []

    results = []
    for path in files:
        # Skip if already processed (cache)
        out = CHAPTER_SUM_DIR / f"{path.stem.split('_chapters')[0]}_chapter_summaries.json"
        # Use video_id from filename prefix
        vid_id = path.stem
        cached = CHAPTER_SUM_DIR / f"{vid_id}_chapter_summaries.json"
        if cached.exists():
            logger.info(f"Skipping {vid_id} — already summarized (delete file to reprocess)")
            with open(cached) as f:
                results.append(json.load(f))
            continue
        results.append(process_video_file(path))

    logger.info(f"\nDone. {len(results)} videos processed.")
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    files = sorted(INPUT_DIR.glob("*.json"))
    if files:
        process_video_file(files[0])
    else:
        print(f"No input files found in {INPUT_DIR}")