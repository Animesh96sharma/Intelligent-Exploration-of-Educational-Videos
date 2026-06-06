"""
slide_captioner.py  –  Ground-truth slide captioning (v4)
==========================================================

CHANGES IN v4
-------------
1.  pHASH DEDUPLICATION  (new step after merge/split)
    When a presenter accidentally skips forward and goes back, the pixel-diff
    detector creates separate SlideRuns for what is really the same visual.
    pHash detects near-identical frames across the whole run list and merges
    them into one canonical run, giving chaptering a clean signal.

2.  CAPTION EMBEDDINGS  (new step before saving)
    Each slide record gets an 'embedding' field — a sentence-transformer
    vector of (caption + first 200 chars of transcript).  chaptering.py uses
    these to score topic-shift boundaries without needing extra LLM calls.

PIPELINE
--------
1.  Scan video at SAMPLE_INTERVAL -> raw SlideRuns (visual change detection)
2.  Merge runs shorter than MIN_SLIDE_DURATION (removes flicker)
3.  Split runs longer than MAX_STATIC_DURATION using transcript boundaries
4.  [NEW] pHash dedup — merge visually identical runs (revisited slides)
5.  Caption one representative frame per run with LLaVA-1.6-Mistral-7B
6.  Attach aggregated transcript text to each run
7.  [NEW] Embed captions with sentence-transformer
8.  Save one JSON record per run

INSTALL
-------
pip install opencv-python Pillow imagehash sentence-transformers
pip install transformers torch bitsandbytes accelerate

USAGE
-----
python slide_captioner.py \\
    --video       lecture.mp4 \\
    --transcript  transcript.json \\
    --output      slide_captions.json \\
    [--sample-interval  1.0] \\
    [--threshold        0.05] \\
    [--min-duration     5.0] \\
    [--max-static      300.0] \\
    [--split-interval  180.0] \\
    [--batch-size       2] \\
    [--phash-threshold  8] \\
    [--skip-embeddings] \\
    [--save-frames]
"""

import argparse
import gc
import json
import logging
import math
import os
import queue
import sys
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("slide_captioner")

# ── tuning knobs ──────────────────────────────────────────────────────────────
SAMPLE_INTERVAL     = 1.0    # seconds between sampled frames during scan
DIFF_THRESHOLD      = 0.05   # pixel-diff (0-1) that counts as a slide change
MIN_SLIDE_DURATION  = 5.0    # merge runs shorter than this (removes flicker)
MAX_STATIC_DURATION = 300.0  # split runs longer than this using transcript (5 min)
SPLIT_INTERVAL      = 180.0  # target sub-segment length when splitting (3 min)
BATCH_SIZE          = 2
PREFETCH_SIZE       = 8
PHASH_THRESHOLD     = 8      # Hamming distance <= this = "same slide"
EMBED_MODEL         = "all-MiniLM-L6-v2"


# ── helpers ───────────────────────────────────────────────────────────────────
def fmt(sec: float) -> str:
    total_ms = int(round(sec * 1000))
    ms = total_ms % 1000
    s  = (total_ms // 1000) % 60
    m  = (total_ms // 60_000) % 60
    h  =  total_ms // 3_600_000
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

def free_ollama_vram() -> None:
    """
    Ask Ollama to unload its model from VRAM before we run.
    Fire-and-forget — silently does nothing if Ollama is not running.
    """
    import urllib.request

    payload = json.dumps({
        "model":      "llama3.2:latest",
        "keep_alive": 0,
    }).encode("utf-8")

    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=5)
        log.info("Ollama model unloaded from VRAM ✓")
    except Exception:
        pass

def load_transcript(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    segs = data.get("segments") or data
    if not isinstance(segs, list):
        log.error("Cannot find 'segments' list in transcript JSON.")
        sys.exit(1)
    log.info(f"Loaded {len(segs)} transcript segments.")
    return segs


# ── frame diffing ─────────────────────────────────────────────────────────────
def frame_diff(a, b) -> float:
    import numpy as np
    sz = (160, 90)
    aa = np.array(a.convert("L").resize(sz), dtype=np.float32)
    bb = np.array(b.convert("L").resize(sz), dtype=np.float32)
    return float(np.mean(np.abs(aa - bb)) / 255.0)


# ── slide run dataclass ───────────────────────────────────────────────────────
@dataclass
class SlideRun:
    slide_id:    int
    start_sec:   float
    end_sec:     float
    rep_sec:     float
    _transcript: str = field(default="", repr=False)
    _split_from: int = field(default=-1, repr=False)


# ── STEP 1 · scan video ───────────────────────────────────────────────────────
def scan_video(video_path: Path, duration: float) -> list[SlideRun]:
    try:
        import cv2
        from PIL import Image
    except ImportError:
        log.error("pip install opencv-python Pillow"); sys.exit(1)

    log.info(
        f"Scanning '{video_path.name}' every {SAMPLE_INTERVAL}s "
        f"(diff threshold={DIFF_THRESHOLD}) ..."
    )
    t0  = time.time()
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        log.error(f"Cannot open video: {video_path}"); sys.exit(1)

    runs: list[SlideRun] = []
    current_start = 0.0
    prev_img      = None
    slide_id      = 0
    checked       = 0
    t             = 0.0

    while t <= duration + SAMPLE_INTERVAL:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ret, frame = cap.read()
        if not ret or frame is None:
            t = round(t + SAMPLE_INTERVAL, 3)
            continue

        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        checked += 1

        if prev_img is None:
            current_start = t
            prev_img = img
            t = round(t + SAMPLE_INTERVAL, 3)
            continue

        diff = frame_diff(prev_img, img)
        if diff > DIFF_THRESHOLD:
            slide_end = round(t, 3)
            rep       = round((current_start + slide_end) / 2.0, 3)
            runs.append(SlideRun(slide_id, current_start, slide_end, rep))
            log.debug(f"  Slide {slide_id}: {fmt(current_start)} -> {fmt(slide_end)} ({slide_end-current_start:.1f}s)")
            slide_id     += 1
            current_start = t

        prev_img = img
        t = round(t + SAMPLE_INTERVAL, 3)

    cap.release()

    if prev_img is not None:
        slide_end = round(duration, 3)
        rep       = round((current_start + slide_end) / 2.0, 3)
        runs.append(SlideRun(slide_id, current_start, slide_end, rep))

    log.info(f"Scan done in {time.time()-t0:.1f}s: {len(runs)} raw runs across {checked} frames.")
    return runs


# ── STEP 2 · merge short runs ─────────────────────────────────────────────────
def merge_short_runs(runs: list[SlideRun], min_dur: float) -> list[SlideRun]:
    if not runs:
        return runs
    log.info(f"Merging runs < {min_dur}s (before: {len(runs)}) ...")

    changed = True
    while changed:
        changed = False
        merged: list[SlideRun] = []
        i = 0
        while i < len(runs):
            r   = runs[i]
            dur = r.end_sec - r.start_sec
            if dur < min_dur:
                if merged:
                    prev = merged[-1]
                    merged[-1] = SlideRun(
                        prev.slide_id, prev.start_sec, r.end_sec,
                        round((prev.start_sec + r.end_sec) / 2.0, 3)
                    )
                    changed = True
                elif i + 1 < len(runs):
                    nxt = runs[i + 1]
                    merged.append(SlideRun(
                        r.slide_id, r.start_sec, nxt.end_sec,
                        round((r.start_sec + nxt.end_sec) / 2.0, 3)
                    ))
                    i += 2
                    changed = True
                    continue
                else:
                    merged.append(r)
            else:
                merged.append(r)
            i += 1
        runs = merged

    for idx, r in enumerate(runs):
        r.slide_id = idx
    log.info(f"After merging: {len(runs)} runs remain.")
    return runs


# ── STEP 3 · split long static runs using transcript ─────────────────────────
def find_transcript_split_points(
    segments: list[dict],
    start_sec: float,
    end_sec:   float,
    split_interval: float,
) -> list[float]:
    duration = end_sec - start_sec
    if duration <= split_interval:
        return []

    window_segs = [s for s in segments if s["start"] >= start_sec and s["end"] <= end_sec]

    if not window_segs:
        splits, t = [], start_sec + split_interval
        while t < end_sec - 30:
            splits.append(round(t, 3))
            t += split_interval
        return splits

    sentence_ends = [
        s["end"] for s in window_segs
        if s.get("text", "").strip() and s["text"].strip()[-1] in ".?!"
    ]
    if not sentence_ends:
        sentence_ends = [s["end"] for s in window_segs]

    splits       = []
    target       = start_sec + split_interval
    search_range = 30.0

    while target < end_sec - split_interval * 0.5:
        candidates = [t for t in sentence_ends if abs(t - target) <= search_range]
        if candidates:
            best = min(candidates, key=lambda t: abs(t - target))
            if (not splits or best - splits[-1] > 60) and best < end_sec - 60:
                splits.append(round(best, 3))
                log.debug(f"    Transcript split at {fmt(best)}")
        else:
            if target < end_sec - 60:
                splits.append(round(target, 3))
        target += split_interval

    return splits


def split_long_runs(
    runs:           list[SlideRun],
    segments:       list[dict],
    max_dur:        float,
    split_interval: float,
) -> list[SlideRun]:
    result: list[SlideRun] = []
    n_split = 0

    for run in runs:
        dur = run.end_sec - run.start_sec
        if dur <= max_dur:
            result.append(run)
            continue

        log.info(
            f"  Long run {run.slide_id}: {fmt(run.start_sec)} -> {fmt(run.end_sec)} "
            f"({dur/60:.1f} min) — splitting by transcript ..."
        )
        split_points = find_transcript_split_points(segments, run.start_sec, run.end_sec, split_interval)

        if not split_points:
            result.append(run)
            continue

        boundaries = [run.start_sec] + split_points + [run.end_sec]
        for i in range(len(boundaries) - 1):
            sub_start = boundaries[i]
            sub_end   = boundaries[i + 1]
            result.append(SlideRun(
                slide_id   = len(result),
                start_sec  = sub_start,
                end_sec    = sub_end,
                rep_sec    = round((sub_start + sub_end) / 2.0, 3),
                _split_from= run.slide_id,
            ))
            log.debug(f"    Sub-run: {fmt(sub_start)} -> {fmt(sub_end)} ({(sub_end-sub_start)/60:.1f} min)")
        n_split += 1

    for idx, r in enumerate(result):
        r.slide_id = idx

    if n_split:
        log.info(f"Split {n_split} long run(s) -> {len(result)} total runs.")
    return result


# ── STEP 4 (NEW) · pHash deduplication ───────────────────────────────────────
def phash_of_frame(video_path: Path, timestamp_sec: float):
    """Return perceptual hash of the frame at timestamp_sec, or None on failure."""
    try:
        import cv2
        import imagehash
        from PIL import Image
    except ImportError:
        return None

    cap = cv2.VideoCapture(str(video_path))
    cap.set(cv2.CAP_PROP_POS_MSEC, timestamp_sec * 1000)
    ret, frame = cap.read()
    cap.release()
    if not ret or frame is None:
        return None
    img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    return imagehash.phash(img, hash_size=16)   # 256-bit hash


def dedup_runs_by_phash(
    runs:       list[SlideRun],
    video_path: Path,
    threshold:  int = PHASH_THRESHOLD,
) -> list[SlideRun]:
    """
    Merge visually identical SlideRuns.

    Handles:
      - Presenter accidentally advances and goes back  (A → B → A again)
      - Same title / agenda slide shown multiple times

    Each run's representative frame is hashed.  If a run's hash is within
    `threshold` Hamming distance of an earlier run's hash, it is merged into
    that earlier run (transcript text is appended, end_sec extended if later).
    """
    try:
        import imagehash   # noqa: F401
    except ImportError:
        log.warning(
            "imagehash not installed — skipping pHash dedup.  "
            "Run:  pip install imagehash"
        )
        return runs

    log.info(f"pHash dedup: comparing {len(runs)} runs (threshold={threshold}) ...")

    canonical_hashes: list            = []
    canonical_runs:   list[SlideRun]  = []

    for run in runs:
        h = phash_of_frame(video_path, run.rep_sec)
        if h is None:
            canonical_hashes.append(None)
            canonical_runs.append(run)
            continue

        matched_idx = None
        for idx, ch in enumerate(canonical_hashes):
            if ch is not None and (h - ch) <= threshold:
                matched_idx = idx
                break

        if matched_idx is not None:
            canon = canonical_runs[matched_idx]
            if run.end_sec > canon.end_sec:
                canon.end_sec = run.end_sec
            if run._transcript and run._transcript not in canon._transcript:
                canon._transcript = (canon._transcript + " " + run._transcript).strip()
            log.info(
                f"  Merged slide {run.slide_id} [{fmt(run.start_sec)}] "
                f"→ canonical slide {canon.slide_id} [{fmt(canon.start_sec)}] "
                f"(hamming={h - canonical_hashes[matched_idx]})"
            )
        else:
            canonical_hashes.append(h)
            canonical_runs.append(run)

    for idx, r in enumerate(canonical_runs):
        r.slide_id = idx

    removed = len(runs) - len(canonical_runs)
    if removed:
        log.info(f"pHash dedup: removed {removed} duplicate run(s) → {len(canonical_runs)} remain.")
    else:
        log.info("pHash dedup: no duplicates found.")

    return canonical_runs


# ── STEP 5 · attach transcripts ──────────────────────────────────────────────
def attach_transcripts(runs: list[SlideRun], segments: list[dict]) -> None:
    for r in runs:
        texts = [
            s["text"].strip()
            for s in segments
            if s["start"] < r.end_sec and s["end"] > r.start_sec
        ]
        r._transcript = " ".join(texts)


# ── STEP 6 · prefetch frames ──────────────────────────────────────────────────
def prefetch_worker(video_path: Path, runs: list[SlideRun],
                    out_queue: queue.Queue, fdir: Optional[Path]) -> None:
    try:
        import cv2
        from PIL import Image
    except ImportError:
        out_queue.put(None); return

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        log.error("Prefetch: cannot open video.")
        out_queue.put(None); return

    for r in runs:
        cap.set(cv2.CAP_PROP_POS_MSEC, r.rep_sec * 1000)
        ret, frame = cap.read()
        img = None
        if ret and frame is not None:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        frame_path = None
        if fdir and img:
            frame_path = str(fdir / f"slide_{r.slide_id:04d}_{r.rep_sec:.1f}s.jpg")
            img.save(frame_path, quality=85)
        out_queue.put((r, img, frame_path))

    cap.release()
    out_queue.put(None)


# ── STEP 7 · LLaVA captioning ────────────────────────────────────────────────
def load_llava(device: str):
    try:
        import torch
        from transformers import LlavaNextProcessor, LlavaNextForConditionalGeneration, BitsAndBytesConfig
    except ImportError:
        log.error("pip install transformers torch bitsandbytes accelerate"); sys.exit(1)

    model_id = "llava-hf/llava-v1.6-mistral-7b-hf"
    log.info(f"Loading LLaVA '{model_id}' in 4-bit ...")
    t0 = time.time()
    processor = LlavaNextProcessor.from_pretrained(model_id)
    processor.tokenizer.pad_token = processor.tokenizer.eos_token

    import torch as _torch
    quant = BitsAndBytesConfig(
        load_in_4bit=True, bnb_4bit_compute_dtype=_torch.float16,
        bnb_4bit_quant_type="nf4", bnb_4bit_use_double_quant=True,
    )
    model = LlavaNextForConditionalGeneration.from_pretrained(
        model_id, quantization_config=quant, device_map="auto"
    )
    model.eval()
    log.info(f"LLaVA ready in {time.time()-t0:.1f}s")
    return processor, model


CAPTION_PROMPT = (
    "[INST] <image>\n"
    "You are a content extractor for educational lecture slides.\n\n"
    "RULES:\n"
    "1. SLIDE or WHITEBOARD - extract: Title, Key points (condensed), Equations/code (exact).\n"
    "2. DIAGRAM / CHART / FIGURE - state: Type, Concept, Key components/axes/labels.\n"
    "3. TALKING HEAD only (no slide) - respond exactly: [NO SLIDE]\n"
    "4. Person + slide (PiP) - ignore person, extract slide only.\n"
    "5. Title card / intro screen - extract text only.\n\n"
    "OUTPUT: 2-4 sentences max. Lead with topic/title. "
    "No visual aesthetics. Do NOT start with 'This image' or 'The slide'. "
    "State content directly. [/INST]"
)


def caption_batch(images: list, processor, model, device: str) -> list[str]:
    import torch

    def _run(imgs):
        inputs = processor(
            text=[CAPTION_PROMPT] * len(imgs), images=imgs,
            return_tensors="pt", padding=True, padding_side="left",
        ).to(device)
        with torch.no_grad():
            outs = model.generate(
                **inputs, max_new_tokens=200, do_sample=False,
                temperature=None, top_p=None, repetition_penalty=1.2,
            )
        inlen = inputs["input_ids"].shape[1]
        caps  = [processor.decode(o[inlen:], skip_special_tokens=True).strip() for o in outs]
        del inputs, outs
        torch.cuda.empty_cache(); gc.collect()
        return caps

    try:
        return _run(images)
    except torch.cuda.OutOfMemoryError:
        log.warning(f"OOM on batch={len(images)}, falling back to single-image")
        torch.cuda.empty_cache(); gc.collect()
        caps = []
        for img in images:
            try:
                caps.extend(_run([img]))
            except torch.cuda.OutOfMemoryError:
                log.error("OOM on single image — skipping")
                torch.cuda.empty_cache(); gc.collect()
                caps.append("[caption failed — OOM]")
        return caps


# ── STEP 8 (NEW) · embed captions ────────────────────────────────────────────
def embed_captions(slides: list[dict], model_name: str = EMBED_MODEL) -> list[dict]:
    """
    Add an 'embedding' field to each slide dict.

    The vector is computed from  (caption + first 200 chars of transcript)
    so it captures both the visual content and the spoken context.
    chaptering.py uses these to score topic-shift boundaries via cosine
    similarity without needing any extra LLM calls per slide.
    """
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        log.warning(
            "sentence-transformers not installed — skipping embeddings.  "
            "Run:  pip install sentence-transformers"
        )
        return slides

    log.info(f"Embedding {len(slides)} slide captions with '{model_name}' ...")
    model = SentenceTransformer(model_name)

    texts = []
    for s in slides:
        cap    = (s.get("caption")    or "").strip()
        transc = (s.get("transcript") or "").strip()[:200]
        texts.append(f"{cap}. {transc}".strip(". "))

    vectors = model.encode(texts, batch_size=64, show_progress_bar=False)
    for s, vec in zip(slides, vectors):
        s["embedding"] = vec.tolist()

    log.info("Embeddings done.")
    return slides


# ── MAIN ──────────────────────────────────────────────────────────────────────
def run(
    video_path:       str,
    transcript_path:  str,
    output_path:      Optional[str] = None,
    device:           str   = "auto",
    save_frames:      bool  = False,
    frames_dir:       Optional[str] = None,
    batch_size:       int   = BATCH_SIZE,
    min_duration:     float = MIN_SLIDE_DURATION,
    max_static:       float = MAX_STATIC_DURATION,
    split_interval:   float = SPLIT_INTERVAL,
    phash_threshold:  int   = PHASH_THRESHOLD,
    skip_embeddings:  bool  = False,
) -> list[dict]:

    import torch
    free_ollama_vram()

    video  = Path(video_path).resolve()
    transc = Path(transcript_path).resolve()
    out    = Path(output_path) if output_path else \
             video.parent / (video.stem + "_slide_captions.json")

    if not video.exists():  log.error(f"Video not found: {video}");      sys.exit(1)
    if not transc.exists(): log.error(f"Transcript not found: {transc}"); sys.exit(1)

    fdir = None
    if save_frames:
        fdir = Path(frames_dir) if frames_dir else video.parent / (video.stem + "_slide_frames")
        fdir.mkdir(parents=True, exist_ok=True)

    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"

    log.info(f"Video          : {video}")
    log.info(f"Transcript     : {transc}")
    log.info(f"Output         : {out}")
    log.info(f"Device         : {device}")
    log.info(f"Min duration   : {min_duration}s")
    log.info(f"Max static     : {max_static}s")
    log.info(f"Split interval : {split_interval}s")
    log.info(f"pHash threshold: {phash_threshold}")

    segments       = load_transcript(transc)
    video_duration = segments[-1]["end"] if segments else 0.0
    log.info(f"Duration       : {fmt(video_duration)}")

    # ── detection pipeline ────────────────────────────────────────────────────
    runs = scan_video(video, video_duration)
    runs = merge_short_runs(runs, min_duration)
    runs = split_long_runs(runs, segments, max_static, split_interval)
    runs = dedup_runs_by_phash(runs, video, phash_threshold)   # ← NEW
    attach_transcripts(runs, segments)

    total = len(runs)
    log.info(f"Captioning {total} slides ...")

    processor, model_obj = load_llava(device)

    frame_queue: queue.Queue = queue.Queue(maxsize=PREFETCH_SIZE)
    prefetch_thread = threading.Thread(
        target=prefetch_worker, args=(video, runs, frame_queue, fdir), daemon=True
    )
    prefetch_thread.start()

    pending_runs:   list[SlideRun] = []
    pending_imgs:   list           = []
    pending_fpaths: list[str]      = []
    results:        list[dict]     = []
    processed = 0
    t_start   = time.time()

    def flush():
        nonlocal processed
        if not pending_imgs:
            return
        captions = caption_batch(pending_imgs, processor, model_obj, device)
        for r, cap, fp in zip(pending_runs, captions, pending_fpaths):
            results.append({
                "slide_id":                     r.slide_id,
                "slide_start":                  r.start_sec,
                "slide_end":                    r.end_sec,
                "slide_start_str":              fmt(r.start_sec),
                "slide_end_str":                fmt(r.end_sec),
                "duration_sec":                 round(r.end_sec - r.start_sec, 3),
                "representative_timestamp":     r.rep_sec,
                "representative_timestamp_str": fmt(r.rep_sec),
                "split_from_slide":             r._split_from,
                "caption":                      cap,
                "transcript":                   r._transcript,
                "frame_path":                   fp or "",
            })
            processed += 1
        elapsed = time.time() - t_start
        rate    = processed / elapsed if elapsed else 1
        log.info(
            f"  [{processed:>4}/{total}]  "
            f"\"{captions[-1][:65]}{'...' if len(captions[-1])>65 else ''}\"  "
            f"ETA {(total-processed)/rate:.0f}s"
        )
        pending_runs.clear(); pending_imgs.clear(); pending_fpaths.clear()

    while True:
        item = frame_queue.get()
        if item is None:
            break
        run_obj, img, fp = item
        if img is None:
            log.warning(f"  Skipped slide {run_obj.slide_id} (frame extraction failed)")
            continue
        pending_runs.append(run_obj)
        pending_imgs.append(img)
        pending_fpaths.append(fp or "")
        if len(pending_imgs) >= batch_size:
            flush()

    flush()
    prefetch_thread.join()

    # ── embed captions ────────────────────────────────────────────────────────
    if not skip_embeddings:
        results = embed_captions(results)   # ← NEW

    elapsed_total = time.time() - t_start
    output_data = {
        "metadata": {
            "video":                    str(video),
            "transcript":               str(transc),
            "model":                    "llava-hf/llava-v1.6-mistral-7b-hf",
            "device":                   device,
            "sample_interval_sec":      SAMPLE_INTERVAL,
            "diff_threshold":           DIFF_THRESHOLD,
            "min_slide_duration_sec":   min_duration,
            "max_static_duration_sec":  max_static,
            "split_interval_sec":       split_interval,
            "phash_threshold":          phash_threshold,
            "batch_size":               batch_size,
            "num_transcript_segments":  len(segments),
            "num_unique_slides":        len(results),
            "processing_time_sec":      round(elapsed_total, 2),
        },
        "slides": results,
    }

    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    log.info(f"Saved {len(results)} slide captions -> {out}")
    _preview(results)
    return results


def _preview(results: list[dict], n: int = 5) -> None:
    sep = "-" * 80
    print(f"\n{sep}\n  PREVIEW -- first {min(n, len(results))} slides\n{sep}")
    for r in results[:n]:
        split_note = f"  [split from slide {r['split_from_slide']}]" if r.get("split_from_slide", -1) >= 0 else ""
        print(f"  Slide {r['slide_id']:>3}  {r['slide_start_str']} -> {r['slide_end_str']}  "
              f"({r['duration_sec']:.1f}s)  rep@{r['representative_timestamp_str']}{split_note}")
        print(f"    Caption   : {r['caption'][:90]}{'...' if len(r['caption'])>90 else ''}")
        print(f"    Transcript: {r['transcript'][:90]}{'...' if len(r['transcript'])>90 else ''}")
        print()
    if len(results) > n:
        print(f"  ... {len(results)-n} more slides in the JSON file")
    print(f"{sep}\n")


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Slide captioning with pHash dedup, transcript splitting, and caption embeddings.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    ap.add_argument("--video",            required=True)
    ap.add_argument("--transcript",       required=True)
    ap.add_argument("--output",           default=None)
    ap.add_argument("--device",           default="auto", choices=["auto", "cuda", "cpu"])
    ap.add_argument("--save-frames",      action="store_true")
    ap.add_argument("--frames-dir",       default=None)
    ap.add_argument("--batch-size",       type=int,   default=BATCH_SIZE)
    ap.add_argument("--sample-interval",  type=float, default=SAMPLE_INTERVAL)
    ap.add_argument("--threshold",        type=float, default=DIFF_THRESHOLD)
    ap.add_argument("--min-duration",     type=float, default=MIN_SLIDE_DURATION)
    ap.add_argument("--max-static",       type=float, default=MAX_STATIC_DURATION)
    ap.add_argument("--split-interval",   type=float, default=SPLIT_INTERVAL)
    ap.add_argument("--phash-threshold",  type=int,   default=PHASH_THRESHOLD,
                    help="Hamming distance threshold for pHash dedup (default 8).")
    ap.add_argument("--skip-embeddings",  action="store_true",
                    help="Skip caption embedding step (chaptering will fall back to time-based split).")
    args = ap.parse_args()

    SAMPLE_INTERVAL     = args.sample_interval
    DIFF_THRESHOLD      = args.threshold
    MIN_SLIDE_DURATION  = args.min_duration
    MAX_STATIC_DURATION = args.max_static
    SPLIT_INTERVAL      = args.split_interval

    run(
        video_path      = args.video,
        transcript_path = args.transcript,
        output_path     = args.output,
        device          = args.device,
        save_frames     = args.save_frames,
        frames_dir      = args.frames_dir,
        batch_size      = args.batch_size,
        min_duration    = args.min_duration,
        max_static      = args.max_static,
        split_interval  = args.split_interval,
        phash_threshold = args.phash_threshold,
        skip_embeddings = args.skip_embeddings,
    )