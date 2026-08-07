"""
backend/app/subtask2_summarization/visual_integration/visual_textual_integration.py

Visual-textual integration combining frame captions, slide captions, and actual images.
"""
import json
import logging
import re
from pathlib import Path
from typing import Optional
from collections import Counter

from backend.app.config import INPUT_DIR, CHAPTER_SUM_DIR, CAPTIONS_DIR, FRAMES_DIR
from backend.app.common.utils.llm_client import call_llm, parse_json_response

logger = logging.getLogger(__name__)

# ── Visual type classification from captions ─────────────────────────────────

VISUAL_TYPE_PATTERNS = {
    "diagram":     [r"\bdiagram\b", r"\bflowchart\b", r"\barchitecture\b", r"\bschematic\b",
                     r"\bpipeline\b", r"\bblock diagram\b", r"\bloop diagram\b"],
    "formula":      [r"\bformula\b", r"\bequation\b", r"\bderivation\b", r"\bmath\b",
                     r"\bnotation\b", r"\btheorem\b", r"\bproof\b"],
    "code":         [r"\bcode\b", r"\bscript\b", r"\bsyntax\b", r"\bsnippet\b", r"\bprogram\b",
                     r"\bpytorch\b", r"\bpython\b"],
    "chart_graph":  [r"\bgraph\b", r"\bchart\b", r"\bplot\b", r"\bcurve\b", r"\bhistogram\b",
                     r"\bscatter\b", r"\bbar chart\b", r"\bheatmap\b", r"\bvisualization\b"],
    "table":        [r"\btable\b", r"\bcomparison table\b", r"\bmatrix\b(?!.*multiplication)"],
    "photo_demo":   [r"\bphoto\b", r"\bimage of\b", r"\bpicture\b", r"\bdemonstration\b",
                     r"\breal-world\b", r"\bscreenshot\b"],
    "text_slide":   [r"\bslide\b", r"\btitle slide\b", r"\bsummary slide\b", r"\bbullet\b",
                     r"\boutline\b", r"\bquote\b"],
}

# ── Compile regex patterns for better performance ──────────────────────────
_COMPILED_PATTERNS = {
    category: [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    for category, patterns in VISUAL_TYPE_PATTERNS.items()
}


def classify_visual_element(caption: str) -> str:
    """Classify a visual element based on its caption text."""
    caption_lower = caption.lower()
    for category, patterns in _COMPILED_PATTERNS.items():
        for pattern in patterns:
            if pattern.search(caption_lower):
                return category
    return "other"


def classify_all_visuals(frame_captions: list[str]) -> dict:
    """Classify all visuals in a list of captions."""
    if not frame_captions:
        return {"types": {}, "dominant_type": "none", "total_visuals": 0}
    
    types = [classify_visual_element(cap) for cap in frame_captions]
    counts = dict(Counter(types))
    dominant = max(counts, key=counts.get) if counts else "none"
    
    return {
        "types":         counts,
        "dominant_type": dominant,
        "total_visuals": len(frame_captions)
    }


# ── Load captions data ────────────────────────────────────────────────────────

def load_captions_for_video(video_id: str) -> dict:
    """Load captions JSON for a video."""
    patterns = [
        f"{video_id}_captions.json",
        f"{video_id}*captions*.json",
    ]
    captions_files = []
    for pattern in patterns:
        captions_files.extend(list(CAPTIONS_DIR.glob(pattern)))
    if not captions_files:
        return {}
    with open(captions_files[0], "r", encoding="utf-8") as f:
        data = json.load(f)
    slides = data.get("slides", [])
    return {slide["slide_id"]: slide for slide in slides}


def get_slide_captions_for_chapter(video_id: str, start_time: float, end_time: float) -> list[dict]:
    """Get slide captions that overlap with a chapter's time range."""
    captions_data = load_captions_for_video(video_id)
    if not captions_data:
        return []
    
    matching_slides = []
    for slide in captions_data.values():
        ts = slide.get("representative_timestamp", slide.get("slide_start", 0))
        if start_time <= ts <= end_time:
            matching_slides.append({
                "caption": slide.get("caption", ""),
                "timestamp": ts,
                "slide_id": slide.get("slide_id", 0),
                "frame_path": slide.get("frame_path", "")
            })
    return matching_slides


# ── Multimodal summary ────────────────────────────────────────────────────────

MULTIMODAL_PROMPT = """You are an expert at describing educational video content that combines speech and visuals.

Chapter title: {title}

Spoken content (transcript excerpt):
{transcript}

Visual content described in frame captions:
{frame_captions}

Slide captions from actual slides:
{slide_captions}

Visual element types detected: {visual_types}

Write ONE sentence (max 30 words) that explicitly connects what the lecturer
was SAYING with what was being SHOWN on screen at the same time.
Use phrasing like "While explaining X, the lecturer displayed Y" or
"The Z diagram illustrated the Q concept being discussed."

Return ONLY the single sentence, no quotes, no JSON, no extra text."""


def generate_multimodal_summary(chapter: dict) -> str:
    """Generate multimodal summary connecting speech and visuals."""
    frame_captions = chapter.get("frame_captions", [])
    if not frame_captions:
        return "No visual content was associated with this chapter."

    visual_classification = classify_all_visuals(frame_captions)
    visual_types_text = ", ".join(
        f"{count} {vtype}" for vtype, count in visual_classification["types"].items()
    )

    prompt = MULTIMODAL_PROMPT.format(
        title=chapter.get("title", ""),
        transcript=chapter.get("transcript", "")[:800],
        frame_captions="\n".join(f"- {c}" for c in frame_captions[:5]),
        slide_captions="No slide captions available",
        visual_types=visual_types_text or "none detected"
    )

    result = call_llm(prompt)
    if result is None:
        return "Multimodal summary generation failed for this chapter."
    return result.strip().strip('"')


def enrich_chapter_with_visual_integration(chapter_input: dict, chapter_summary: dict) -> dict:
    """Enrich chapter with visual integration data."""
    frame_captions = chapter_input.get("frame_captions", [])
    frame_paths = chapter_input.get("frame_paths", [])

    visual_classification = classify_all_visuals(frame_captions)
    multimodal_summary = generate_multimodal_summary(chapter_input)

    return {
        **chapter_summary,
        "visual_integration": {
            "visual_element_types": visual_classification["types"],
            "dominant_visual_type": visual_classification["dominant_type"],
            "total_visual_elements": visual_classification["total_visuals"],
            "frame_paths": frame_paths,
            "multimodal_summary": multimodal_summary
        }
    }


def _derive_id_from_metadata(path: Path, data: dict) -> str:
    if "video_id" in data:
        return data["video_id"]
    stem = path.stem
    return stem.split("_chapters")[0].replace("_transcripts", "").replace("_captions", "")


def process_video_visual_integration(video_id: str) -> dict:
    """Process visual integration for all chapters of a video."""
    # Load input data
    input_files = list(INPUT_DIR.glob("*.json"))
    input_data = None
    for path in input_files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        vid = data.get("video_id") or _derive_id_from_metadata(path, data)
        if vid == video_id:
            input_data = data
            break

    if input_data is None:
        logger.error(f"Could not find input file for video_id={video_id}")
        return {"error": "input not found"}

    # Load chapter summaries
    summary_path = CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json"
    if not summary_path.exists():
        logger.error(f"Chapter summaries not found for {video_id}. Run summarize_chapters.py first.")
        return {"error": "chapter summaries not found"}

    with open(summary_path, "r", encoding="utf-8") as f:
        summary_data = json.load(f)

    # Match input chapters with summary chapters
    input_chapters_by_id = {ch["chapter_id"]: ch for ch in input_data["chapters"]}

    enriched_chapters = []
    for ch_summary in summary_data["chapter_summaries"]:
        ch_id = ch_summary.get("chapter_id")
        ch_input = input_chapters_by_id.get(ch_id)
        if ch_input is None:
            logger.warning(f"No matching input chapter for {ch_id}, skipping visual enrichment")
            enriched_chapters.append(ch_summary)
            continue

        logger.info(f"  Visual integration: '{ch_summary.get('title', ch_id)}'")
        enriched = enrich_chapter_with_visual_integration(ch_input, ch_summary)
        enriched_chapters.append(enriched)

    summary_data["chapter_summaries"] = enriched_chapters

    # Aggregate video-level visual stats
    all_types = Counter()
    total_frames = 0
    for ch in enriched_chapters:
        vi = ch.get("visual_integration", {})
        for vtype, count in vi.get("visual_element_types", {}).items():
            all_types[vtype] += count
        total_frames += len(vi.get("frame_paths", []))

    summary_data["video_visual_summary"] = {
        "total_visual_elements": sum(all_types.values()),
        "visual_type_distribution": dict(all_types),
        "total_frames": total_frames,
        "chapters_with_visuals": sum(1 for ch in enriched_chapters 
                                   if ch.get("visual_integration", {}).get("total_visual_elements", 0) > 0)
    }

    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved visual-textual integration → {summary_path}")
    return summary_data


def run_all(limit: Optional[int] = None) -> list[dict]:
    """Process visual integration for all videos."""
    files = sorted(CHAPTER_SUM_DIR.glob("*_chapter_summaries.json"))
    if limit:
        files = files[:limit]
    if not files:
        logger.warning(f"No chapter summary files found in {CHAPTER_SUM_DIR}")
        return []

    results = []
    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        video_id = data["video_id"]

        if "video_visual_summary" in data:
            logger.info(f"Skipping {video_id} — already has visual integration")
            results.append(data)
            continue

        logger.info(f"\n{'='*60}")
        logger.info(f"Visual-textual integration: {video_id}")
        logger.info(f"{'='*60}")
        result = process_video_visual_integration(video_id)
        results.append(result)

    logger.info(f"\nDone. Visual-textual integration applied to {len(results)} videos.")
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    run_all()