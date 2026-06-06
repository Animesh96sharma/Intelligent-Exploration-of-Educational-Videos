

import json
import logging
import shutil
import tempfile
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Import your existing modules
# ---------------------------------------------------------------------------
# Adjust these imports to match your actual project structure
from asr import run as run_asr, Segment

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("api")

app = FastAPI(
    title="Intelligent Exploration of Educational Videos — API",
    description=(
        "REST API for video transcript extraction, frame captioning, "
        "and LLM-based chapter segmentation."
    ),
    version="1.0.0",
)

# Allow frontend dev server (e.g. React on localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class SegmentModel(BaseModel):
    start: float
    end: float
    start_timestamp: str
    end_timestamp: str
    text: str
    confidence: float


class TranscriptResponse(BaseModel):
    status: str
    video_name: str
    language: str
    duration_seconds: float
    num_segments: int
    processing_time_seconds: float
    segments: list[SegmentModel]


class CaptionModel(BaseModel):
    timestamp_seconds: float
    timestamp: str
    frame_index: int
    caption: str


class CaptionsResponse(BaseModel):
    status: str
    video_name: str
    num_frames: int
    processing_time_seconds: float
    captions: list[CaptionModel]


class ChapterModel(BaseModel):
    chapter_number: int
    start_seconds: float
    end_seconds: float
    start_timestamp: str
    end_timestamp: str
    title: str
    summary: Optional[str] = None


class ChaptersResponse(BaseModel):
    status: str
    video_name: str
    num_chapters: int
    processing_time_seconds: float
    chapters: list[ChapterModel]


class PipelineResponse(BaseModel):
    status: str
    video_name: str
    total_processing_time_seconds: float
    transcript: TranscriptResponse
    captions: CaptionsResponse
    chapters: ChaptersResponse


class StatusResponse(BaseModel):
    status: str
    version: str
    endpoints: list[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def save_upload(upload: UploadFile, dest_dir: Path) -> Path:
    """Save an uploaded file to a temp directory and return its path."""
    dest = dest_dir / upload.filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return dest


def segments_to_model(segments: list[Segment]) -> list[SegmentModel]:
    return [
        SegmentModel(
            start=s.start,
            end=s.end,
            start_timestamp=s.start_timestamp,
            end_timestamp=s.end_timestamp,
            text=s.text,
            confidence=s.confidence,
        )
        for s in segments
    ]


# ---------------------------------------------------------------------------
# Frame captioning helper
# Swap out the model here — replace with LLaVA or any other VLM
# ---------------------------------------------------------------------------

def extract_frame_captions(
    video_path: Path,
    transcript_segments: Optional[list[Segment]] = None,
    interval_seconds: int = 30,
) -> tuple[list[CaptionModel], float]:
    """
    Extract frames at regular intervals and generate captions.

    Currently uses a placeholder — replace the captioning block below
    with your chosen VLM (LLaVA, BLIP-2, GPT-4o Vision, etc.)
    """
    import subprocess

    t0 = time.time()
    captions: list[CaptionModel] = []

    # Step 1 — get video duration via ffprobe
    probe = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            str(video_path),
        ],
        capture_output=True, text=True,
    )
    duration = float(json.loads(probe.stdout)["format"]["duration"])

    # Step 2 — sample timestamps
    timestamps = list(range(0, int(duration), interval_seconds))

    for i, ts in enumerate(timestamps):
        # Extract frame at timestamp
        frame_path = video_path.parent / f".frame_{ts}.jpg"
        subprocess.run(
            [
                "ffmpeg", "-y", "-ss", str(ts),
                "-i", str(video_path),
                "-vframes", "1", "-q:v", "2",
                str(frame_path),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # ── CAPTIONING BLOCK ──────────────────────────────────────────────
        # Replace everything inside this block with your VLM call.
        #
        # Example with LLaVA (recommended):
        #   caption = llava_caption(frame_path, context_text)
        #
        # Example with BLIP-2:
        #   caption = blip2_caption(frame_path)
        #
        # Example with GPT-4o Vision:
        #   caption = gpt4o_caption(frame_path, context_text)
        #
        # For now we build a transcript-context hint as a placeholder:
        context_text = ""
        if transcript_segments:
            nearby = [
                s.text for s in transcript_segments
                if abs(s.start - ts) < interval_seconds
            ]
            context_text = " ".join(nearby[:3])

        # ── CAPTIONING BLOCK ──────────────────────────────────────────────
        import sys
        sys.path.append("backend/app/subtask1_segmentation")
        from frame_captioning import caption_frame
        caption = caption_frame(frame_path, context_text)
        # ── END CAPTIONING BLOCK ──────────────────────────────────────────

        captions.append(CaptionModel(
            timestamp_seconds=float(ts),
            timestamp=f"{ts // 3600:02d}:{(ts % 3600) // 60:02d}:{ts % 60:02d}",
            frame_index=i,
            caption=caption,
        ))

        # Clean up frame file
        frame_path.unlink(missing_ok=True)

    elapsed = time.time() - t0
    return captions, elapsed


def run_chaptering(
    transcript_segments: list[Segment],
    captions: list[CaptionModel],
    video_name: str,
) -> tuple[list[ChapterModel], float]:
    """
    Run LLM-based chapter boundary prediction.

    Replace the placeholder below with your actual Chapter-Llama
    or LLM chaptering call.
    """
    t0 = time.time()

    # ── CHAPTERING BLOCK ──────────────────────────────────────────────────
    if not transcript_segments:
        return [], 0.0

    from chaptering import predict_chapters
    raw_chapters = predict_chapters(
        transcript_segments=transcript_segments,
        captions=captions,
        model="llama3.2:latest"
    )
    chapters = [
        ChapterModel(
            chapter_number=i + 1,
            start_seconds=c["start"],
            end_seconds=c["end"],
            start_timestamp=c["start_timestamp"],
            end_timestamp=c["end_timestamp"],
            title=c["title"],
            summary=c.get("summary"),
        )
        for i, c in enumerate(raw_chapters)
    ]
    # ── END CHAPTERING BLOCK ─────────────────────────────────────────────

    elapsed = time.time() - t0
    return chapters, elapsed


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/status", response_model=StatusResponse, tags=["Health"])
def status():
    """Check that the API is running."""
    return StatusResponse(
        status="ok",
        version="1.0.0",
        endpoints=[
            "POST /transcript",
            "POST /captions",
            "POST /chapters",
            "POST /pipeline",
            "GET  /status",
        ],
    )


@app.post("/transcript", response_model=TranscriptResponse, tags=["Pipeline"])
async def get_transcript(
    video: UploadFile = File(..., description="Video file (.mp4, .mkv, .avi, …)"),
    model: str = Form("medium", description="Whisper model size"),
    language: Optional[str] = Form(None, description="ISO language code, e.g. 'en'"),
):
    """
    Upload a video and receive a full timestamped transcript.

    Returns segments with start/end times and confidence scores.
    """
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        video_path = save_upload(video, tmp_path)
        transcript_path = tmp_path / "transcript.json"

        try:
            segments = run_asr(
                video_path=str(video_path),
                model_size=model,
                language=language,
                output_path=str(transcript_path),
            )
        except SystemExit:
            raise HTTPException(status_code=500, detail="Transcription failed. Check server logs.")

        # Read metadata written by asr.run
        with open(transcript_path) as f:
            saved = json.load(f)
        meta = saved["metadata"]

        return TranscriptResponse(
            status="ok",
            video_name=video.filename,
            language=meta["language"],
            duration_seconds=meta["duration_seconds"],
            num_segments=meta["num_segments"],
            processing_time_seconds=meta["processing_time_seconds"],
            segments=segments_to_model(segments),
        )


@app.post("/captions", response_model=CaptionsResponse, tags=["Pipeline"])
async def get_captions(
    video: UploadFile = File(..., description="Video file"),
    interval: int = Form(30, description="Frame sampling interval in seconds"),
):
    """
    Upload a video and receive captions for sampled frames.

    Frames are extracted every `interval` seconds. Each caption describes
    the visual content of that frame.
    """
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        video_path = save_upload(video, tmp_path)

        try:
            captions, elapsed = extract_frame_captions(video_path, interval_seconds=interval)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        return CaptionsResponse(
            status="ok",
            video_name=video.filename,
            num_frames=len(captions),
            processing_time_seconds=round(elapsed, 2),
            captions=captions,
        )


@app.post("/chapters", response_model=ChaptersResponse, tags=["Pipeline"])
async def get_chapters(
    video: UploadFile = File(..., description="Video file"),
    model: str = Form("medium", description="Whisper model size"),
    language: Optional[str] = Form(None, description="ISO language code"),
    interval: int = Form(30, description="Frame sampling interval in seconds"),
):
    """
    Upload a video and receive predicted chapter boundaries and titles.

    Internally runs transcription and frame captioning first, then feeds
    both into the chaptering model.
    """
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        video_path = save_upload(video, tmp_path)
        transcript_path = tmp_path / "transcript.json"

        # Step 1 — Transcript
        try:
            segments = run_asr(
                video_path=str(video_path),
                model_size=model,
                language=language,
                output_path=str(transcript_path),
            )
        except SystemExit:
            raise HTTPException(status_code=500, detail="Transcription failed.")

        # Step 2 — Captions
        captions, _ = extract_frame_captions(
            video_path, transcript_segments=segments, interval_seconds=interval
        )

        # Step 3 — Chapters
        chapters, elapsed = run_chaptering(segments, captions, video.filename)

        return ChaptersResponse(
            status="ok",
            video_name=video.filename,
            num_chapters=len(chapters),
            processing_time_seconds=round(elapsed, 2),
            chapters=chapters,
        )


@app.post("/pipeline", response_model=PipelineResponse, tags=["Pipeline"])
async def run_full_pipeline(
    video: UploadFile = File(..., description="Video file"),
    model: str = Form("medium", description="Whisper model size"),
    language: Optional[str] = Form(None, description="ISO language code"),
    interval: int = Form(30, description="Frame sampling interval in seconds"),
):
    """
    Run the complete pipeline in one call: transcript → captions → chapters.

    Returns all three outputs together. Best used when the frontend needs
    everything at once for a full video exploration view.
    """
    t_total = time.time()

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        video_path = save_upload(video, tmp_path)
        transcript_path = tmp_path / "transcript.json"

        # ── Step 1: Transcript ────────────────────────────────────────────
        try:
            segments = run_asr(
                video_path=str(video_path),
                model_size=model,
                language=language,
                output_path=str(transcript_path),
            )
        except SystemExit:
            raise HTTPException(status_code=500, detail="Transcription failed.")

        with open(transcript_path) as f:
            saved = json.load(f)
        meta = saved["metadata"]

        transcript_response = TranscriptResponse(
            status="ok",
            video_name=video.filename,
            language=meta["language"],
            duration_seconds=meta["duration_seconds"],
            num_segments=meta["num_segments"],
            processing_time_seconds=meta["processing_time_seconds"],
            segments=segments_to_model(segments),
        )

        # ── Step 2: Captions ──────────────────────────────────────────────
        captions, cap_elapsed = extract_frame_captions(
            video_path, transcript_segments=segments, interval_seconds=interval
        )
        captions_response = CaptionsResponse(
            status="ok",
            video_name=video.filename,
            num_frames=len(captions),
            processing_time_seconds=round(cap_elapsed, 2),
            captions=captions,
        )

        # ── Step 3: Chapters ──────────────────────────────────────────────
        chapters, chap_elapsed = run_chaptering(segments, captions, video.filename)
        chapters_response = ChaptersResponse(
            status="ok",
            video_name=video.filename,
            num_chapters=len(chapters),
            processing_time_seconds=round(chap_elapsed, 2),
            chapters=chapters,
        )

        total_elapsed = round(time.time() - t_total, 2)

        return PipelineResponse(
            status="ok",
            video_name=video.filename,
            total_processing_time_seconds=total_elapsed,
            transcript=transcript_response,
            captions=captions_response,
            chapters=chapters_response,
        )