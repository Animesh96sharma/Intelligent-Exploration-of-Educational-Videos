

import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config — adjust these paths to match your project layout
# ---------------------------------------------------------------------------

BASE_DIR        = Path("/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation")
TRANSCRIPTS_DIR = BASE_DIR / "transcripts"
CAPTIONS_DIR    = BASE_DIR / "captions"
CHAPTERS_DIR    = BASE_DIR / "chapters"
METADATA_DIR    = Path("/home/umwise2526studentproj/Group3ProjectWork/data/processed/metadata/subtask1_segmentation")


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("api")

app = FastAPI(
    title="Intelligent Exploration of Educational Videos — API",
    description="Serves pre-processed video analysis data to the frontend.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_json(path: Path, video_id: str, label: str) -> dict:
    """Load a JSON file or raise a clean 404."""
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{label} not found for '{video_id}'. Run the pipeline first."
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def list_video_ids() -> list[str]:
    """Return all video IDs that have at least a transcript file."""
    if not TRANSCRIPTS_DIR.exists():
        return []
    return sorted(
        p.name.replace("_transcripts.json", "")
        for p in TRANSCRIPTS_DIR.glob("*_transcripts.json")
    )


def hms(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600:02d}:{(s % 3600) // 60:02d}:{s % 60:02d}"


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class VideoSummary(BaseModel):
    video_id:     str
    title:        str
    author:       str
    organization: str
    domain:       str
    duration:     str
    has_transcript: bool
    has_captions:   bool
    has_chapters:   bool
    has_metadata:   bool


class VideoListResponse(BaseModel):
    status:     str
    total:      int
    videos:     list[VideoSummary]


class StatusResponse(BaseModel):
    status:   str
    version:  str
    endpoints: list[str]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/status", response_model=StatusResponse, tags=["Health"])
def status():
    """Check the API is running."""
    return StatusResponse(
        status="ok",
        version="2.0.0",
        endpoints=[
            "GET /status",
            "GET /videos",
            "GET /videos/{video_id}",
            "GET /videos/{video_id}/transcript",
            "GET /videos/{video_id}/captions",
            "GET /videos/{video_id}/chapters",
            "GET /videos/{video_id}/metadata",
        ],
    )


@app.get("/videos", response_model=VideoListResponse, tags=["Videos"])
def list_videos():
    """
    List all processed videos with a brief summary of each.
    """
    ids = list_video_ids()
    summaries = []

    for vid in ids:
        transcript_path = TRANSCRIPTS_DIR / f"{vid}_transcripts.json"
        captions_path   = CAPTIONS_DIR    / f"{vid}_captions.json"
        chapters_path   = CHAPTERS_DIR    / f"{vid}_chapters.json"
        metadata_path   = METADATA_DIR    / f"{vid}_metadata.json"

        # Pull what we can from metadata, fall back gracefully
        title = author = organization = domain = duration = ""

        if metadata_path.exists():
            try:
                md      = json.loads(metadata_path.read_text(encoding="utf-8"))
                vm      = md.get("video_metadata", {})
                title        = vm.get("title", "")
                author       = vm.get("author", "")
                organization = vm.get("organization", "")
                domain       = vm.get("domain", "")
            except Exception:
                pass

        if not title and transcript_path.exists():
            try:
                tr       = json.loads(transcript_path.read_text(encoding="utf-8"))
                duration_s = tr.get("metadata", {}).get("duration_seconds", 0)
                duration   = hms(duration_s)
            except Exception:
                pass

        if not duration and transcript_path.exists():
            try:
                tr         = json.loads(transcript_path.read_text(encoding="utf-8"))
                duration_s = tr.get("metadata", {}).get("duration_seconds", 0)
                duration   = hms(duration_s)
            except Exception:
                pass

        summaries.append(VideoSummary(
            video_id     = vid,
            title        = title or vid,
            author       = author,
            organization = organization,
            domain       = domain,
            duration     = duration,
            has_transcript = transcript_path.exists(),
            has_captions   = captions_path.exists(),
            has_chapters   = chapters_path.exists(),
            has_metadata   = metadata_path.exists(),
        ))

    return VideoListResponse(status="ok", total=len(summaries), videos=summaries)


@app.get("/videos/{video_id}", tags=["Videos"])
def get_video(video_id: str):
    """
    Get all processed data for a single video in one response.
    Returns whatever is available — missing outputs are null.
    """
    transcript_path = TRANSCRIPTS_DIR / f"{video_id}_transcripts.json"
    captions_path   = CAPTIONS_DIR    / f"{video_id}_captions.json"
    chapters_path   = CHAPTERS_DIR    / f"{video_id}_chapters.json"
    metadata_path   = METADATA_DIR    / f"{video_id}_metadata.json"

    if not any(p.exists() for p in [transcript_path, captions_path, chapters_path, metadata_path]):
        raise HTTPException(
            status_code=404,
            detail=f"No data found for '{video_id}'. Run the pipeline first."
        )

    def safe_load(path: Path):
        try:
            return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None
        except Exception:
            return None

    return {
        "status":     "ok",
        "video_id":   video_id,
        "metadata":   safe_load(metadata_path),
        "transcript": safe_load(transcript_path),
        "captions":   safe_load(captions_path),
        "chapters":   safe_load(chapters_path),
    }


@app.get("/videos/{video_id}/transcript", tags=["Videos"])
def get_transcript(video_id: str):
    """
    Get the full timestamped transcript for a video.
    Returns segments with start/end times and confidence scores.
    """
    path = TRANSCRIPTS_DIR / f"{video_id}_transcripts.json"
    data = load_json(path, video_id, "Transcript")
    return {"status": "ok", "video_id": video_id, **data}


@app.get("/videos/{video_id}/captions", tags=["Videos"])
def get_captions(video_id: str):
    """
    Get slide captions for a video.
    Returns one caption per detected slide with timestamps.
    """
    path = CAPTIONS_DIR / f"{video_id}_captions.json"
    data = load_json(path, video_id, "Captions")

    # Strip embeddings from response — they're large and not needed by frontend
    slides = data.get("slides", [])
    for s in slides:
        s.pop("embedding", None)

    return {
        "status":         "ok",
        "video_id":       video_id,
        "video_metadata": data.get("video_metadata", {}),
        "num_slides":     len(slides),
        "slides":         slides,
    }


@app.get("/videos/{video_id}/chapters", tags=["Videos"])
def get_chapters(video_id: str):
    """
    Get chapter boundaries and titles for a video.
    Returns chapters with start/end times, titles, keywords, and transcript excerpts.
    """
    path = CHAPTERS_DIR / f"{video_id}_chapters.json"
    data = load_json(path, video_id, "Chapters")

    chapters = data.get("chapters", [])

    return {
        "status":       "ok",
        "video_id":     video_id,
        "num_chapters": len(chapters),
        "metadata":     data.get("metadata", {}),
        "chapters":     chapters,
    }


@app.get("/videos/{video_id}/metadata", tags=["Videos"])
def get_metadata(video_id: str):
    """
    Get extracted metadata for a video.
    Returns title, author, organization, domain, topics, keywords, entities.
    """
    path = METADATA_DIR / f"{video_id}_metadata.json"
    data = load_json(path, video_id, "Metadata")
    return {"status": "ok", "video_id": video_id, **data}


@app.get("/videos/{video_id}/chapters/{chapter_index}", tags=["Videos"])
def get_chapter(video_id: str, chapter_index: int):
    """
    Get a single chapter by index (1-based).
    """
    path = CHAPTERS_DIR / f"{video_id}_chapters.json"
    data = load_json(path, video_id, "Chapters")

    chapters = data.get("chapters", [])
    matches  = [c for c in chapters if c.get("chapter_index") == chapter_index]

    if not matches:
        raise HTTPException(
            status_code=404,
            detail=f"Chapter {chapter_index} not found for '{video_id}'."
        )

    return {"status": "ok", "video_id": video_id, "chapter": matches[0]}