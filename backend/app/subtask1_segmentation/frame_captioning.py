import argparse
import json
import logging
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("frame_captioning")


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass
class FrameCaption:
    """Caption for one extracted frame."""
    segment_index: int     # which transcript segment this came from
    timestamp: float       # seconds — the end point of the segment
    timestamp_str: str     # human-readable HH:MM:SS.mmm
    segment_start: float   # original segment start (seconds)
    segment_end: float     # original segment end (seconds)
    speech_text: str       # the transcript text for this segment
    caption: str           # LLaVA generated visual caption
    frame_path: Optional[str] = None  # path to saved frame image (if --save-frames)

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def seconds_to_hms(seconds: float) -> str:
    """Convert float seconds to HH:MM:SS.mmm string."""
    total_ms = int(round(seconds * 1000))
    ms = total_ms % 1000
    total_s = total_ms // 1000
    h = total_s // 3600
    m = (total_s % 3600) // 60
    s = total_s % 60
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def load_transcript(transcript_path: Path) -> list[dict]:
    """
    Load the transcript JSON produced by asr.py.
    Returns the list of segment dicts.
    """
    with open(transcript_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # asr.py saves: { "metadata": {...}, "segments": [...] }
    if "segments" not in data:
        log.error(
            f"Unexpected transcript format in '{transcript_path}'.\n"
            "Expected a JSON with a 'segments' key (output of asr.py)."
        )
        sys.exit(1)

    segments = data["segments"]
    log.info(f"Loaded {len(segments)} transcript segments from '{transcript_path.name}'")
    return segments


# ---------------------------------------------------------------------------
# Frame extraction
# ---------------------------------------------------------------------------
def extract_frame_at(video_path: Path, timestamp_seconds: float):
    """
    Extract a single frame from the video at the given timestamp.

    Uses cv2.CAP_PROP_POS_MSEC to seek to the exact millisecond.
    Returns a PIL Image (RGB) or None if extraction failed.
    """
    try:
        import cv2
        from PIL import Image
        import numpy as np
    except ImportError:
        log.error(
            "Missing packages. Run:\n"
            "  pip install opencv-python Pillow"
        )
        sys.exit(1)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        log.error(f"Could not open video: {video_path}")
        return None

    # Seek to exact timestamp in milliseconds
    cap.set(cv2.CAP_PROP_POS_MSEC, timestamp_seconds * 1000)
    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        log.warning(f"Could not read frame at {seconds_to_hms(timestamp_seconds)}")
        return None

    # OpenCV loads frames as BGR — convert to RGB for LLaVA / PIL
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    return Image.fromarray(frame_rgb)


# ---------------------------------------------------------------------------
# LLaVA model loading  (replaces load_blip2)
# ---------------------------------------------------------------------------
def load_llava(device: str):
    """
    Load LLaVA-1.6-Mistral-7B in 4-bit quantization.

    4-bit quantization keeps VRAM usage to ~5-6 GB, which fits comfortably
    on a 7.6 GB card (e.g. RTX 4060 Ti) while staying fast on GPU.

    First run downloads ~14 GB of model weights — same one-time behaviour
    as Whisper / BLIP-2.  Subsequent runs load from the local HuggingFace
    cache in ~30 seconds.
    """
    try:
        import torch
        from transformers import (
            LlavaNextProcessor,
            LlavaNextForConditionalGeneration,
            BitsAndBytesConfig,
        )
    except ImportError:
        log.error(
            "Missing packages. Run:\n"
            "  pip install transformers torch bitsandbytes accelerate"
        )
        sys.exit(1)

    model_id = "llava-hf/llava-v1.6-mistral-7b-hf"

    log.info(f"Loading LLaVA '{model_id}' in 4-bit quantization (downloads ~14 GB on first run) …")
    t0 = time.time()

    processor = LlavaNextProcessor.from_pretrained(model_id)

    # 4-bit quantization config — keeps VRAM under 6 GB
    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_quant_type="nf4",          # NormalFloat4 — best quality/size tradeoff
        bnb_4bit_use_double_quant=True,      # nested quantization saves a little extra VRAM
    )

    model = LlavaNextForConditionalGeneration.from_pretrained(
        model_id,
        quantization_config=quantization_config,
        device_map="auto",   # splits layers across GPU/CPU as needed
    )
    model.eval()  # inference mode — disables dropout

    log.info(f"LLaVA ready in {time.time() - t0:.1f}s")
    return processor, model


# ---------------------------------------------------------------------------
# Caption generation  (replaces old caption_image)
# ---------------------------------------------------------------------------
def caption_image(image, processor, model, device: str) -> str:
    import torch

    prompt = (
        "[INST] <image>\n"
        "You are analyzing a frame from an educational lecture video. "
        "Describe what you see in detail:\n"
        "- If there is a slide, read and include ALL visible text (titles, bullet points, labels, equations).\n"
        "- If there is a diagram or chart, describe its structure and what it represents.\n"
        "- If code is shown, transcribe it.\n"
        "- If it is a webcam/talking-head shot with no slide, just say: 'Speaker on camera, no slide visible.'\n"
        "Be specific and thorough. Do not summarize or skip any text you can read. [/INST]"
    )

    inputs = processor(
        text=prompt,
        images=image,
        return_tensors="pt",
    ).to(device)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=300,   # was 100 — gives room for full slide content
            do_sample=False,
            temperature=None,     # must be None when do_sample=False
            top_p=None,           # must be None when do_sample=False
            repetition_penalty=1.2,  # discourages the model from looping/repeating lines
        )

    input_len = inputs["input_ids"].shape[1]
    caption = processor.decode(
        output_ids[0][input_len:],
        skip_special_tokens=True,
    ).strip()

    return caption


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------
def run(
    video_path: str,
    transcript_path: str,
    output_path: Optional[str] = None,
    device: str = "auto",
    save_frames: bool = False,
    frames_dir: Optional[str] = None,
) -> list[FrameCaption]:

    import torch

    # ---- Paths ----------------------------------------------------------------
    video  = Path(video_path).resolve()
    transc = Path(transcript_path).resolve()
    out    = Path(output_path) if output_path else \
             video.parent / (video.stem + "_captions.json")

    if not video.exists():
        log.error(f"Video not found: {video}")
        sys.exit(1)
    if not transc.exists():
        log.error(f"Transcript not found: {transc}")
        sys.exit(1)

    # Optional frames directory
    fdir = None
    if save_frames:
        fdir = Path(frames_dir) if frames_dir else \
               video.parent / (video.stem + "_frames")
        fdir.mkdir(parents=True, exist_ok=True)
        log.info(f"Frames will be saved to: {fdir}")

    # Auto device
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"

    log.info(f"Video  : {video}")
    log.info(f"Transc : {transc}")
    log.info(f"Output : {out}")
    log.info(f"Device : {device}")

    # ---- Load inputs ----------------------------------------------------------
    segments = load_transcript(transc)
    processor, model = load_llava(device)   # ← was load_blip2

    # ---- Process each segment -------------------------------------------------
    results: list[FrameCaption] = []
    total   = len(segments)
    t_start = time.time()

    log.info(f"Captioning {total} frames …")

    for i, seg in enumerate(segments):
        seg_start = seg["start"]
        seg_end   = seg["end"]
        speech    = seg["text"]

        # -----------------------------------------------------------------------
        # END POINT CALCULATION
        # We take a frame just before the end of the segment (0.1s buffer).
        # By the end of a segment the slide is fully visible and the speaker
        # has finished discussing it — making it the most informative frame.
        # The 0.1s buffer avoids the exact boundary frame which OpenCV
        # occasionally misreads as the first frame of the next segment.
        #
        # Example: segment runs from 10.0s → 18.0s
        #   exact end    = 18.0s  ← risky boundary
        #   sample point = 18.0 - 0.1 = 17.9s  ← what we use
        # -----------------------------------------------------------------------
        BUFFER = 0.1   # seconds to step back from the exact end
        sample_point = max(seg_start, seg_end - BUFFER)

        # Extract frame at end point
        image = extract_frame_at(video, sample_point)
        if image is None:
            log.warning(f"  [{i+1}/{total}] Skipped — could not extract frame at {seconds_to_hms(sample_point)}")
            continue

        # Optionally save the frame image
        frame_path = None
        if save_frames and fdir is not None:
            frame_path = str(fdir / f"frame_{i:04d}_{sample_point:.1f}s.jpg")
            image.save(frame_path, quality=85)

        # Generate caption
        caption = caption_image(image, processor, model, device)

        results.append(FrameCaption(
            segment_index = i,
            timestamp     = round(sample_point, 3),
            timestamp_str = seconds_to_hms(sample_point),
            segment_start = round(seg_start, 3),
            segment_end   = round(seg_end, 3),
            speech_text   = speech,
            caption       = caption,
            frame_path    = frame_path,
        ))

        # Progress every 10 frames
        if (i + 1) % 10 == 0 or (i + 1) == total:
            elapsed   = time.time() - t_start
            rate      = (i + 1) / elapsed
            remaining = (total - i - 1) / rate if rate > 0 else 0
            log.info(
                f"  [{i+1:>4}/{total}]  {seconds_to_hms(sample_point)}  |  "
                f"\"{caption[:55]}{'…' if len(caption) > 55 else ''}\"  |  "
                f"ETA {remaining:.0f}s"
            )

    # ---- Save JSON ------------------------------------------------------------
    elapsed_total = time.time() - t_start
    output_data = {
        "metadata": {
            "video":                    str(video),
            "transcript":               str(transc),
            "model":                    "llava-hf/llava-v1.6-mistral-7b-hf",  # ← updated
            "device":                   device,
            "num_segments":             total,
            "num_captions":             len(results),
            "processing_time_seconds":  round(elapsed_total, 2),
            "seconds_per_frame":        round(elapsed_total / max(len(results), 1), 2),
        },
        "captions": [r.to_dict() for r in results],
    }

    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    log.info(f"Saved {len(results)} captions → {out}")
    log.info(f"Total time: {elapsed_total:.1f}s  "
             f"({elapsed_total / max(len(results), 1):.1f}s per frame)")

    print_preview(results)
    return results


# ---------------------------------------------------------------------------
# Preview
# ---------------------------------------------------------------------------
def print_preview(results: list[FrameCaption], n: int = 5) -> None:
    """Print first N results as a sanity check."""
    print("\n" + "─" * 80)
    print(f"  PREVIEW — first {min(n, len(results))} captions")
    print("─" * 80)
    for r in results[:n]:
        print(f"  [{r.timestamp_str}]  (segment {r.segment_start}s → {r.segment_end}s, end point = {r.timestamp}s)")
        print(f"    Speech : {r.speech_text[:80]}{'…' if len(r.speech_text) > 80 else ''}")
        print(f"    Caption: {r.caption}")
        print()
    if len(results) > n:
        print(f"  … {len(results) - n} more captions in the JSON file")
    print("─" * 80 + "\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            "Extract one frame per transcript segment (at the end point) "
            "and caption each frame using LLaVA-1.6-Mistral-7B (4-bit quantized)."
        ),
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--video", required=True,
        help="Path to the video file.",
    )
    parser.add_argument(
        "--transcript", required=True,
        help="Path to the transcript JSON produced by asr.py.",
    )
    parser.add_argument(
        "--output", default=None,
        help="Output JSON path. Defaults to <video_name>_captions.json.",
    )
    parser.add_argument(
        "--device", default="auto", choices=["auto", "cuda", "cpu"],
        help="Inference device. 'auto' picks CUDA if available.",
    )
    parser.add_argument(
        "--save-frames", action="store_true",
        help="Save the extracted frame images as .jpg files.",
    )
    parser.add_argument(
        "--frames-dir", default=None,
        help="Directory to save frames (only used with --save-frames).",
    )
    args = parser.parse_args()

    run(
        video_path      = args.video,
        transcript_path = args.transcript,
        output_path     = args.output,
        device          = args.device,
        save_frames     = args.save_frames,
        frames_dir      = args.frames_dir,
    )   