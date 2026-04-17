"""
subtask2_summarization/chapter_level/summarize_chapters.py

Generates short / medium / long summaries for each chapter
using a locally-running Ollama model (Mistral or Llama 3.1).
"""
from subtask2_summarization.utils.chunking import chunk_transcript, combine_chunk_summaries
from subtask2_summarization.utils.error_handling import robust_json_parse, retry_on_failure
import json
import re
import time
import logging
from pathlib import Path
from typing import Optional

import ollama

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
MODEL         = "mistral"          # switch to "llama3.1" if you have it pulled
# DATA_ROOT     = Path(__file__).resolve().parents[4] / "data" / "processed"
# INPUT_DIR     = DATA_ROOT / "subtask1_segmentation" / "chapters"
# OUTPUT_DIR    = DATA_ROOT / "subtask2_summarization" / "chapter_summaries"
# OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Config ────────────────────────────────────────────────────────────────────
MODEL = "mistral"  # switch to "phi3:3.8b-mini-4k-instruct-q4_0" for smaller GPU

# Get project root (intelligent-video-exploration/)
PROJECT_ROOT = Path(__file__).resolve().parents[4]

# Input: JSON files from subtask1 (located in backend/app/subtask1_segmentation/chapters/)
INPUT_DIR = PROJECT_ROOT / "backend" / "app" / "subtask1_segmentation" / "chapters"

# Output: Save chapter summaries to data/processed/subtask2_summarization/chapter_summaries/
OUTPUT_DIR = PROJECT_ROOT / "data" / "processed" / "subtask2_summarization" / "chapter_summaries"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# For debugging - print the paths so you know they're correct
print(f"📁 INPUT_DIR = {INPUT_DIR}")
print(f"📁 OUTPUT_DIR = {OUTPUT_DIR}")
print(f"Exists: {INPUT_DIR.exists()}")


# ── Prompt ────────────────────────────────────────────────────────────────────
CHAPTER_PROMPT = """You are an expert educational content analyst specializing in lecture summarization.

Analyze the following lecture chapter and return a JSON object. 
Return ONLY the JSON — no markdown, no code fences, no explanation.

Chapter Title: {title}
Visual Content (frame captions): {frame_captions}
Transcript: {transcript}

Return this exact JSON structure:
{{
  "summary_short": "1-2 sentence summary capturing the core message",
  "summary_medium": "One paragraph (4-6 sentences) covering main ideas",
  "summary_long": "Detailed 2-3 paragraph summary covering all key points, examples, and conclusions",
  "key_concepts": ["concept1", "concept2", "concept3"],
  "learning_objectives": ["After this chapter, students will be able to ..."],
  "has_visuals": true,
  "visual_description": "Brief description of the visual content shown (diagrams, code, formulas, etc.)",
  "difficulty_level": "beginner | intermediate | advanced",
  "estimated_read_time_seconds": 60
}}"""


# ── Core Functions ────────────────────────────────────────────────────────────

# def call_llm(prompt: str, retries: int = 3) -> Optional[str]:
#     """Call Ollama with retry logic."""
#     for attempt in range(retries):
#         try:
#             response = ollama.chat(
#                 model=MODEL,
#                 messages=[{"role": "user", "content": prompt}]
#             )
#             return response["message"]["content"].strip()
#         except Exception as e:
#             logger.warning(f"LLM attempt {attempt + 1} failed: {e}")
#             time.sleep(2 ** attempt)
#     return None

@retry_on_failure(max_retries=3)
def call_llm(prompt: str) -> Optional[str]:
    """Call Ollama with retry logic."""
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"].strip()

# def parse_json_response(raw: str) -> Optional[dict]:
# """Robustly parse LLM JSON output even if it has minor formatting issues."""
# try:
#     return json.loads(raw)
# except json.JSONDecodeError:
#     # Try to extract JSON block if LLM wrapped it in markdown
#     match = re.search(r"\{.*\}", raw, re.DOTALL)
#     if match:
#         try:
#             return json.loads(match.group())
#         except json.JSONDecodeError:
#             pass
# logger.error(f"Could not parse JSON from response:\n{raw[:300]}")
# return None

def parse_json_response(raw: str) -> Optional[dict]:
    """Robustly parse LLM JSON output."""
    return robust_json_parse(raw)


# def summarize_chapter(chapter: dict) -> dict:
    """
    Generate a full summary for a single chapter.
    Returns the chapter dict enriched with summarization fields.
    """
    frame_captions_text = "\n".join(
        f"- {cap}" for cap in chapter.get("frame_captions", [])
    ) or "No frame captions available."

    prompt = CHAPTER_PROMPT.format(
        title=chapter["title"],
        frame_captions=frame_captions_text,
        transcript=chapter["transcript"]
    )

    logger.info(f"  Summarizing chapter: '{chapter['title']}'")
    raw = call_llm(prompt)

    if raw is None:
        logger.error(f"  LLM failed for chapter '{chapter['title']}'")
        return {**chapter, "summarization_error": "LLM call failed"}

    parsed = parse_json_response(raw)
    if parsed is None:
        return {**chapter, "summarization_error": "JSON parse failed", "raw_llm_output": raw}

    return {
        "chapter_id":       chapter["chapter_id"],
        "chapter_index":    chapter["chapter_index"],
        "title":            chapter["title"],
        "start_time":       chapter["start_time"],
        "end_time":         chapter["end_time"],
        "duration_seconds": chapter["end_time"] - chapter["start_time"],
        **parsed
    }

def summarize_chapter(chapter: dict) -> dict:
    """
    Generate a full summary for a single chapter.
    Handles long transcripts by chunking.
    """
    transcript = chapter.get("transcript", "")
    
    # Check if transcript is long (>6000 chars ≈ 1500 tokens)
    if len(transcript) > 6000:
        logger.info(f"  Chapter '{chapter['title']}' is long ({len(transcript)} chars), using chunked processing")
        
        # Split into chunks
        chunks = chunk_transcript(transcript, max_chars=5000, overlap=300)
        
        # Summarize each chunk
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            chunk_prompt = f"""
            Summarize the following segment (part {i+1}/{len(chunks)}) of the lecture chapter titled "{chapter['title']}".
            
            Content: {chunk}
            
            Provide a concise paragraph covering the key points of this segment only.
            """
            chunk_summary = call_llm(chunk_prompt)
            if chunk_summary:
                chunk_summaries.append(chunk_summary)
        
        # Combine chunk summaries
        if chunk_summaries:
            combined_summary = combine_chunk_summaries(chunk_summaries, chapter['title'], call_llm)
            if combined_summary:
                # Use the combined summary as the transcript for the main prompt
                chapter_for_prompt = chapter.copy()
                chapter_for_prompt['transcript'] = combined_summary
                chapter = chapter_for_prompt
            else:
                # If combination fails, fall back to first chunk summary
                logger.warning(f"  Chunk combination failed for '{chapter['title']}', using first chunk summary")
                chapter_for_prompt = chapter.copy()
                chapter_for_prompt['transcript'] = chunk_summaries[0] if chunk_summaries else transcript[:3000]
                chapter = chapter_for_prompt
        else:
            # If all chunk summarization failed, fall back to truncated original
            logger.warning(f"  Chunk summarization failed for '{chapter['title']}', using truncated transcript")
            chapter_for_prompt = chapter.copy()
            chapter_for_prompt['transcript'] = transcript[:4000]  # Truncate to fit context
            chapter = chapter_for_prompt
    
    # Prepare frame captions text
    frame_captions_text = "\n".join(
        f"- {cap}" for cap in chapter.get("frame_captions", [])
    ) or "No frame captions available."
    
    # Build the main prompt
    prompt = CHAPTER_PROMPT.format(
        title=chapter["title"],
        frame_captions=frame_captions_text,
        transcript=chapter.get("transcript", "")  # Use possibly modified transcript
    )
    
    logger.info(f"  Summarizing chapter: '{chapter['title']}'")
    raw = call_llm(prompt)
    
    if raw is None:
        logger.error(f"  LLM failed for chapter '{chapter['title']}'")
        # Return a fallback summary dictionary instead of error
        return {
            "chapter_id": chapter.get("chapter_id", "unknown"),
            "chapter_index": chapter.get("chapter_index", 0),
            "title": chapter.get("title", "Unknown"),
            "start_time": chapter.get("start_time", 0),
            "end_time": chapter.get("end_time", 0),
            "duration_seconds": chapter.get("end_time", 0) - chapter.get("start_time", 0),
            "summary_short": f"Summary generation failed for {chapter.get('title', 'this chapter')}. Please try again.",
            "summary_medium": "The LLM call failed during summarization. This could be due to network issues or Ollama service problems.",
            "summary_long": "Unable to generate summary due to LLM service failure. Check that Ollama is running and the model is loaded.",
            "key_concepts": [],
            "learning_objectives": [],
            "has_visuals": bool(chapter.get("frame_captions")),
            "visual_description": "Unable to analyze visuals due to LLM failure.",
            "difficulty_level": "intermediate",
            "estimated_read_time_seconds": 60,
            "summarization_error": "LLM call failed"
        }
    
    parsed = parse_json_response(raw)
    if parsed is None:
        logger.error(f"  JSON parse failed for chapter '{chapter['title']}'")
        # Return a fallback with the raw output for debugging
        return {
            "chapter_id": chapter.get("chapter_id", "unknown"),
            "chapter_index": chapter.get("chapter_index", 0),
            "title": chapter.get("title", "Unknown"),
            "start_time": chapter.get("start_time", 0),
            "end_time": chapter.get("end_time", 0),
            "duration_seconds": chapter.get("end_time", 0) - chapter.get("start_time", 0),
            "summary_short": f"JSON parsing failed for {chapter.get('title', 'this chapter')}.",
            "summary_medium": "The LLM output could not be parsed as valid JSON.",
            "summary_long": f"Raw LLM output (first 500 chars): {raw[:500]}",
            "key_concepts": [],
            "learning_objectives": [],
            "has_visuals": bool(chapter.get("frame_captions")),
            "visual_description": "Unable to parse visual information.",
            "difficulty_level": "intermediate",
            "estimated_read_time_seconds": 60,
            "summarization_error": "JSON parse failed",
            "raw_llm_output": raw
        }
    
    # Success - return the parsed summary
    return {
        "chapter_id": chapter.get("chapter_id", "unknown"),
        "chapter_index": chapter.get("chapter_index", 0),
        "title": chapter.get("title", "Unknown"),
        "start_time": chapter.get("start_time", 0),
        "end_time": chapter.get("end_time", 0),
        "duration_seconds": chapter.get("end_time", 0) - chapter.get("start_time", 0),
        **parsed
    }

def summarize_all_chapters(video_data: dict) -> list[dict]:
    """Summarize every chapter in a video."""
    video_id = video_data["video_id"]
    chapters  = video_data["chapters"]
    logger.info(f"Processing {len(chapters)} chapters for video '{video_id}'")

    summaries = []
    for chapter in chapters:
        summary = summarize_chapter(chapter)
        summaries.append(summary)

    return summaries


def process_video_file(json_path: Path) -> dict:
    """Load a video JSON, summarize all chapters, save output."""
    with open(json_path, "r", encoding="utf-8") as f:
        video_data = json.load(f)

    video_id = video_data["video_id"]
    logger.info(f"\n{'='*60}")
    logger.info(f"Processing video: {video_id} — {video_data['video_title']}")
    logger.info(f"{'='*60}")

    chapter_summaries = summarize_all_chapters(video_data)

    output = {
        "video_id":      video_id,
        "video_title":   video_data["video_title"],
        "speaker":       video_data.get("speaker", "Unknown"),
        "domain":        video_data.get("domain", "Unknown"),
        "duration":      video_data["duration"],
        "total_chapters": len(chapter_summaries),
        "chapter_summaries": chapter_summaries
    }

    out_path = OUTPUT_DIR / f"{video_id}_chapter_summaries.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved chapter summaries → {out_path}")
    return output


# def run_all(limit: Optional[int] = None) -> list[dict]:
#     """Process all video JSON files in the input directory."""
#     files = sorted(INPUT_DIR.glob("*.json"))
#     if limit:
#         files = files[:limit]

#     all_results = []
#     for path in files:
#         result = process_video_file(path)
#         all_results.append(result)

#     logger.info(f"\nDone. Processed {len(all_results)} videos.")
#     return all_results

# def run_all(limit: Optional[int] = None) -> list[dict]:
#     """Process all video JSON files in the input directory."""
#     # Get ALL JSON files from the correct directory
#     input_dir = Path("backend/app/subtask1_segmentation/chapters/")
    
#     # Check if directory exists
#     if not input_dir.exists():
#         logger.error(f"Input directory not found: {input_dir}")
#         logger.info(f"Looking for files in: {input_dir.absolute()}")
#         return []
    
#     # Get all JSON files
#     files = sorted(input_dir.glob("*.json"))
    
#     # Log what we found
#     logger.info(f"Found {len(files)} JSON files in {input_dir}")
#     for f in files:
#         logger.info(f"  - {f.name}")
    
#     # Apply limit if specified
#     if limit and limit > 0:
#         files = files[:limit]
#         logger.info(f"Limited to first {limit} files")
    
#     if not files:
#         logger.warning(f"No JSON files found in {input_dir}")
#         return []
    
#     all_results = []
#     for i, path in enumerate(files):
#         logger.info(f"\nProcessing file {i+1}/{len(files)}: {path.name}")
#         try:
#             result = process_video_file(path)
#             all_results.append(result)
#         except Exception as e:
#             logger.error(f"Failed to process {path.name}: {e}")
#             # Continue with next file instead of stopping
#             continue
    
#     logger.info(f"\nDone. Processed {len(all_results)} out of {len(files)} videos.")
#     return all_results

def run_all(limit: Optional[int] = None) -> list[dict]:
    """Process all video JSON files in the input directory."""
    # ✅ USE THE EXISTING INPUT_DIR VARIABLE (defined at top of file)
    # INPUT_DIR is already: DATA_ROOT / "subtask1_segmentation" / "chapters"
    # and DATA_ROOT is: Path(__file__).resolve().parents[4] / "data" / "processed"
    
    files = sorted(INPUT_DIR.glob("*.json"))
    
    # Log what we found
    logger.info(f"INPUT_DIR = {INPUT_DIR}")
    logger.info(f"Found {len(files)} JSON files")
    for f in files:
        logger.info(f"  - {f.name}")
    
    # Apply limit if specified
    if limit and limit > 0:
        files = files[:limit]
        logger.info(f"Limited to first {limit} files")
    
    if not files:
        logger.warning(f"No JSON files found in {INPUT_DIR}")
        return []
    
    all_results = []
    for i, path in enumerate(files):
        logger.info(f"\nProcessing file {i+1}/{len(files)}: {path.name}")
        try:
            result = process_video_file(path)
            all_results.append(result)
        except Exception as e:
            logger.error(f"Failed to process {path.name}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    logger.info(f"\nDone. Processed {len(all_results)} out of {len(files)} videos.")
    return all_results

# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Quick test: process only the first video file
    files = sorted(INPUT_DIR.glob("*.json"))
    if not files:
        print(f"No JSON files found in {INPUT_DIR}")
    else:
        process_video_file(files[0])