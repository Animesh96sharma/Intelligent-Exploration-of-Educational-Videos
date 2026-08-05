import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import mimetypes

# ---------------------------------------------------------------------------
# Config — adjust these paths to match your project layout
# ---------------------------------------------------------------------------

BASE_DIR        = Path("/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation")
TRANSCRIPTS_DIR = BASE_DIR / "transcripts"
CAPTIONS_DIR    = BASE_DIR / "captions"
CHAPTERS_DIR    = BASE_DIR / "chapters"
METADATA_DIR    = Path("/home/umwise2526studentproj/Group3ProjectWork/data/processed/metadata/subtask1_segmentation")
VIDEOS_DIR      = Path("/home/umwise2526studentproj/Group3ProjectWork/project/bhavik/data/raw/videos")

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

FRAMES_DIR = Path("/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/frames")
FRAMES_DIR.mkdir(parents=True, exist_ok=True)

# Serve frame images as static files
app.mount("/frames", StaticFiles(directory=str(FRAMES_DIR)), name="frames")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://137.248.121.127:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/videos/{video_id}/frames", tags=["Videos"])
def get_frames(video_id: str):
    """
    Get all saved slide frames for a video with their captions.
    Images accessible at /frames/{video_id}/slide_XXXX_XXXs.jpg
    """
    frames_path = FRAMES_DIR / video_id
    captions_path = CAPTIONS_DIR / f"{video_id}_captions.json"

    if not frames_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No frames found for '{video_id}'. Re-run frame captioning with --save-frames."
        )

    # Load captions to attach caption text to each frame
    captions_map = {}
    if captions_path.exists():
        data   = json.loads(captions_path.read_text(encoding="utf-8"))
        slides = data.get("slides", [])
        for s in slides:
            fp = s.get("frame_path", "")
            if fp:
                captions_map[Path(fp).name] = {
                    "caption":    s.get("caption", ""),
                    "slide_id":   s.get("slide_id"),
                    "start":      s.get("slide_start"),
                    "end":        s.get("slide_end"),
                    "start_str":  s.get("slide_start_str"),
                    "end_str":    s.get("slide_end_str"),
                }

    frames = []
    for img in sorted(frames_path.glob("*.jpg")):
        info = captions_map.get(img.name, {})
        frames.append({
            "filename":  img.name,
            "url":       f"/frames/{video_id}/{img.name}",
            "full_url":  f"http://137.248.121.127:8000/frames/{video_id}/{img.name}",
            **info,
        })

    return {
        "status":     "ok",
        "video_id":   video_id,
        "num_frames": len(frames),
        "frames":     frames,
    }

@app.get("/videos/{video_id}/stream", tags=["Videos"])
def stream_video(video_id: str, request: Request):
    """
    Stream a video file with range request support (seek/scrub in browser).
    """
    from fastapi import Request

    # Try common extensions
    video_path = None
    for ext in (".mp4", ".mkv", ".avi", ".webm", ".mov"):
        candidate = VIDEOS_DIR / f"{video_id}{ext}"
        if candidate.exists():
            video_path = candidate
            break

    if not video_path:
        raise HTTPException(
            status_code=404,
            detail=f"Video file not found for '{video_id}'."
        )

    file_size  = video_path.stat().st_size
    media_type = mimetypes.guess_type(str(video_path))[0] or "video/mp4"

    # Handle range requests — needed for seeking in browser/frontend
    range_header = request.headers.get("range")

    if range_header:
        # Parse range: "bytes=start-end"
        range_val   = range_header.strip().lower().replace("bytes=", "")
        start_str, _, end_str = range_val.partition("-")
        start = int(start_str) if start_str else 0
        end   = int(end_str)   if end_str   else file_size - 1
        end   = min(end, file_size - 1)

        chunk_size = end - start + 1

        def iter_file():
            with open(video_path, "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining > 0:
                    data = f.read(min(1024 * 1024, remaining))  # 1MB chunks
                    if not data:
                        break
                    yield data
                    remaining -= len(data)

        return StreamingResponse(
            iter_file(),
            status_code=206,
            media_type=media_type,
            headers={
                "Content-Range":  f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges":  "bytes",
                "Content-Length": str(chunk_size),
            },
        )

        # No range header — stream the whole file
    def iter_whole():
        with open(video_path, "rb") as f:
            while chunk := f.read(1024 * 1024):  # 1MB chunks
                yield chunk

    return StreamingResponse(
        iter_whole(),
        media_type=media_type,
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges":  "bytes",
        },
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
            "GET /videos/{video_id}/stream",
            "GET /videos/{video_id}/transcript",
            "GET /videos/{video_id}/captions",
            "GET /videos/{video_id}/chapters",
            "GET /videos/{video_id}/metadata",
            "GET /videos/{video_id}/frames",
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
                if isinstance(domain, list):
                    domain = ", ".join(domain)
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