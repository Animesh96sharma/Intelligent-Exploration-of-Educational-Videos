
import argparse
import json
import logging
import os
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("asr")


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass
class Segment:
    """One transcript segment with start/end timestamps."""
    start: float          # seconds (float, e.g. 12.34)
    end: float            # seconds
    start_timestamp: str  # human-readable HH:MM:SS
    end_timestamp: str    # human-readable HH:MM:SS
    text: str
    confidence: float     # 0.0 – 1.0  (1 - no_speech_prob)

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def seconds_to_hms(seconds: float) -> str:
    """Convert float seconds → 'HH:MM:SS.mmm' string."""
    total_ms = int(round(seconds * 1000))
    ms = total_ms % 1000
    total_s = total_ms // 1000
    h = total_s // 3600
    m = (total_s % 3600) // 60
    s = total_s % 60
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def check_ffmpeg() -> None:
    """Raise a clear error if FFmpeg is not installed."""
    result = subprocess.run(
        ["/home/umwise2526studentproj/Desktop/chapter_llama/ffmpeg/ffmpeg-7.0.2-amd64-static/ffmpeg", "-version"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if result.returncode != 0:
        log.error("FFmpeg not found. Install it: https://ffmpeg.org/download.html")
        sys.exit(1)


def extract_audio(video_path: Path, cache_dir: Path) -> Path:

    cache_dir.mkdir(parents=True, exist_ok=True)
    wav_path = cache_dir / (video_path.stem + "_audio.wav")

    if wav_path.exists():
        log.info(f"Using cached audio: {wav_path.name}")
        return wav_path

    log.info(f"Extracting audio from '{video_path.name}' → '{wav_path.name}' …")
    t0 = time.time()
    cmd = [
        "/home/umwise2526studentproj/Desktop/chapter_llama/ffmpeg/ffmpeg-7.0.2-amd64-static/ffmpeg", "-y",
        "-i", str(video_path),
        "-vn",               # no video
        "-ac", "1",          # mono
        "-ar", "16000",      # 16 kHz
        "-acodec", "pcm_s16le",
        str(wav_path),
    ]
    result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if result.returncode != 0:
        log.error(f"FFmpeg failed:\n{result.stderr.decode()}")
        sys.exit(1)

    elapsed = time.time() - t0
    size_mb = wav_path.stat().st_size / 1_048_576
    log.info(f"Audio extracted in {elapsed:.1f}s  ({size_mb:.1f} MB)")
    return wav_path


# ---------------------------------------------------------------------------
# Transcription
# ---------------------------------------------------------------------------
def transcribe(
    wav_path: Path,
    model_size: str = "medium",
    device: str = "auto",
    language: Optional[str] = None,
) -> tuple[list[Segment], dict]:
    """
    Transcribe a WAV file using openai-whisper.

    Returns:
        segments  – list of Segment objects
        info      – metadata dict (language, duration, etc.)
    """
    try:
        import whisper
    except ImportError:
        log.error(
            "openai-whisper is not installed.\n"
            "Run:  pip install openai-whisper"
        )
        sys.exit(1)

    import torch

    # ---- Device ---------------------------------------------------------------
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"

    # fp16 only works on GPU; on CPU it must be False
    use_fp16 = device == "cuda"
    log.info(f"Device: {device}  |  fp16: {use_fp16}  |  Model: {model_size}")

    # ---- Load model -----------------------------------------------------------
    log.info("Loading Whisper model (downloads on first run) …")
    t0 = time.time()
    model = whisper.load_model(model_size, device=device)
    log.info(f"Model loaded in {time.time() - t0:.1f}s")

    # ---- Run transcription ----------------------------------------------------
    log.info(f"Transcribing '{wav_path.name}' …")
    t0 = time.time()

    result = model.transcribe(
        str(wav_path),
        language=language,                  # None = auto-detect
        fp16=use_fp16,                      # faster on GPU, must be False on CPU
        verbose=False,                      # suppress per-segment console spam
        condition_on_previous_text=False,   # prevents hallucination loops on long videos
        task="transcribe",                  # 'transcribe' keeps original language
                                            # use 'translate' to force English output
    )

    # ---- Parse output ---------------------------------------------------------
    segments: list[Segment] = []
    for seg in result["segments"]:
        segments.append(Segment(
            start=round(seg["start"], 3),
            end=round(seg["end"], 3),
            start_timestamp=seconds_to_hms(seg["start"]),
            end_timestamp=seconds_to_hms(seg["end"]),
            text=seg["text"].strip(),
            # no_speech_prob close to 1.0 means Whisper thinks there's no speech
            confidence=round(max(0.0, 1.0 - seg.get("no_speech_prob", 0.0)), 3),
        ))

    elapsed = time.time() - t0
    duration = segments[-1].end if segments else 0.0
    realtime_factor = elapsed / duration if duration > 0 else 0.0

    detected_lang = result.get("language", language or "unknown")

    log.info(
        f"Transcription done in {elapsed:.1f}s  "
        f"(video: {duration:.0f}s,  real-time factor: {realtime_factor:.2f}x)"
    )
    log.info(f"Detected language: '{detected_lang}'")

    metadata = {
        "language": detected_lang,
        "duration_seconds": round(duration, 3),
        "model": model_size,
        "device": device,
        "fp16": use_fp16,
        "processing_time_seconds": round(elapsed, 2),
        "realtime_factor": round(realtime_factor, 3),
        "num_segments": len(segments),
    }
    return segments, metadata


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
def save_json(
    segments: list[Segment],
    metadata: dict,
    output_path: Path,
) -> None:
    """Save transcript to a structured JSON file."""
    output = {
        "metadata": metadata,
        "segments": [s.to_dict() for s in segments],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    log.info(f"Transcript saved → {output_path}")


def print_summary(segments: list[Segment], n: int = 5) -> None:
    """Print first N segments to console for a quick sanity check."""
    print("\n" + "─" * 70)
    print(f"  TRANSCRIPT PREVIEW  (first {min(n, len(segments))} segments)")
    print("─" * 70)
    for seg in segments[:n]:
        print(f"  [{seg.start_timestamp} → {seg.end_timestamp}]  {seg.text}")
    if len(segments) > n:
        print(f"  … {len(segments) - n} more segments in the JSON file")
    print("─" * 70 + "\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run(
    video_path: str,
    model_size: str = "medium",
    device: str = "auto",
    language: Optional[str] = None,
    output_path: Optional[str] = None,
    cache_dir: Optional[str] = None,
    keep_audio: bool = False,
) -> list[Segment]:
    check_ffmpeg()

    video = Path(video_path).resolve()
    if not video.exists():
        log.error(f"Video file not found: {video}")
        sys.exit(1)

    # Defaults
    cache = Path(cache_dir) if cache_dir else video.parent / ".asr_cache"
    out   = Path(output_path) if output_path else video.parent / (video.stem + "_transcript.json")

    log.info(f"Input  : {video}")
    log.info(f"Output : {out}")

    # Step 1: Extract audio
    wav = extract_audio(video, cache)

    # Step 2: Transcribe
    segments, metadata = transcribe(wav, model_size, device, language)

    # Step 3: Save
    save_json(segments, metadata, out)
    print_summary(segments)

    # Optional cleanup
    if not keep_audio:
        wav.unlink(missing_ok=True)
        log.info("Extracted WAV removed (use --keep-audio to keep it)")

    return segments


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Transcribe any video to a timestamped JSON using Whisper.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--video", required=True,
        help="Path to the input video file (.mp4, .mkv, .avi, .webm, …)",
    )
    parser.add_argument(
        "--model", default="medium",
        choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        help=(
            "Whisper model size. Speed vs accuracy guide:\n"
            "  tiny    – very fast, lower accuracy (~1 GB VRAM)\n"
            "  base    – fast,  okay accuracy  (~1 GB VRAM)\n"
            "  small   – good balance           (~2 GB VRAM)\n"
            "  medium  – recommended default    (~5 GB VRAM)\n"
            "  large-v3– best accuracy          (~10 GB VRAM)"
        ),
    )
    parser.add_argument(
        "--device", default="auto", choices=["auto", "cuda", "cpu"],
        help="Inference device. 'auto' picks CUDA if available.",
    )
    parser.add_argument(
        "--language", default=None,
        help="ISO-639-1 language code (e.g. 'en'). Skip for auto-detection.",
    )
    parser.add_argument(
        "--output", default=None,
        help="Output JSON path. Defaults to <video_name>_transcript.json.",
    )
    parser.add_argument(
        "--cache-dir", default=None,
        help="Directory to store extracted WAV cache.",
    )
    parser.add_argument(
        "--keep-audio", action="store_true",
        help="Keep the extracted WAV file after transcription.",
    )
    args = parser.parse_args()

    run(
        video_path=args.video,
        model_size=args.model,
        device=args.device,
        language=args.language,
        output_path=args.output,
        cache_dir=args.cache_dir,
        keep_audio=args.keep_audio,
    )
