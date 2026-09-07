"""
title_evaluation.py — Chapter Title Quality Evaluation (Option B)
==================================================================
Evaluates predicted chapter titles against the transcript text of each chapter.

Since TIB ground truth only has generic titles like "Chapter 1", we use the
transcript content of each chapter as a soft reference. The idea:
  - A good title should contain words that appear in what was spoken
  - ROUGE/BLEU between the title and the chapter's own transcript measures
    how well the title captures the spoken content

This is a proxy metric — not perfect, but academically defensible as it
measures content relevance of generated titles.

Usage:
  python title_evaluation.py \
    --chapters-dir  /path/to/chapters \
    --transcripts-dir /path/to/transcripts \
    --output /path/to/title_eval_results.json
"""

import argparse
import json
import logging
import re
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("title_eval")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normalize_text(text: str) -> str:
    """Lowercase and remove punctuation."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def hms_to_seconds(hms: str) -> float:
    """Convert HH:MM:SS or MM:SS to float seconds."""
    parts = hms.strip().split(":")
    try:
        parts = [float(p) for p in parts]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        elif len(parts) == 2:
            return parts[0] * 60 + parts[1]
        return float(parts[0])
    except ValueError:
        return 0.0


def install_if_missing(package: str, import_name: str = None) -> None:
    import importlib
    try:
        importlib.import_module(import_name or package)
    except ImportError:
        log.error(f"Package '{package}' not installed. Run: pip install {package}")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Extract chapter transcript from full transcript
# ---------------------------------------------------------------------------

def get_chapter_transcript(
    segments: list[dict],
    chapter_start: float,
    chapter_end: float,
    max_words: int = 200,
) -> str:
    """
    Extract transcript text that falls within a chapter's time range.
    Caps at max_words to avoid overwhelming ROUGE with very long chapters.

    Args:
        segments:       ASR segments from transcript.json
        chapter_start:  Chapter start time in seconds
        chapter_end:    Chapter end time in seconds
        max_words:      Maximum words to include (first N words of the chapter)

    Returns:
        A string of transcript text for this chapter.
    """
    words = []
    for seg in segments:
        seg_start = seg.get("start", 0)
        seg_end   = seg.get("end", 0)

        # Include segment if it overlaps with the chapter window
        if seg_end < chapter_start:
            continue
        if seg_start > chapter_end:
            break

        text = seg.get("text", "").strip()
        if text:
            words.extend(text.split())
            if len(words) >= max_words:
                break

    return " ".join(words[:max_words])


# ---------------------------------------------------------------------------
# ROUGE + BLEU computation
# ---------------------------------------------------------------------------

def compute_rouge_bleu(
    hypothesis: str,
    reference: str,
) -> dict:
    """
    Compute ROUGE-1, ROUGE-2, ROUGE-L and BLEU between a title and its
    chapter transcript.

    Args:
        hypothesis: The predicted chapter title
        reference:  The chapter's transcript text (used as soft reference)

    Returns:
        Dict with rouge1, rouge2, rougeL, bleu scores (all F-measure).
    """
    install_if_missing("rouge_score", "rouge_score")
    install_if_missing("nltk")

    from rouge_score import rouge_scorer as rs_module
    import nltk
    from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

    for resource in ("tokenizers/punkt", "tokenizers/punkt_tab"):
        try:
            nltk.data.find(resource)
        except LookupError:
            nltk.download(resource.split("/")[1], quiet=True)

    scorer   = rs_module.RougeScorer(
        ["rouge1", "rouge2", "rougeL"], use_stemmer=True
    )
    smoothie = SmoothingFunction().method1

    hyp_norm = normalize_text(hypothesis)
    ref_norm = normalize_text(reference)

    if not hyp_norm or not ref_norm:
        return {"rouge1": 0.0, "rouge2": 0.0, "rougeL": 0.0, "bleu": 0.0}

    scores = scorer.score(ref_norm, hyp_norm)

    # BLEU: title tokens vs reference tokens
    ref_tokens = [ref_norm.split()]
    hyp_tokens = hyp_norm.split()
    bleu = sentence_bleu(ref_tokens, hyp_tokens, smoothing_function=smoothie)

    return {
        "rouge1": round(scores["rouge1"].fmeasure, 4),
        "rouge2": round(scores["rouge2"].fmeasure, 4),
        "rougeL": round(scores["rougeL"].fmeasure, 4),
        "bleu":   round(bleu, 4),
    }


# ---------------------------------------------------------------------------
# Evaluate one video
# ---------------------------------------------------------------------------

def evaluate_video(
    video_id:    str,
    chapters:    list[dict],
    segments:    list[dict],
) -> dict:
    """
    Evaluate title quality for all chapters in one video.

    For each chapter:
      1. Extract the transcript text that falls within chapter's time window
      2. Compute ROUGE + BLEU between the predicted title and that transcript
      3. Aggregate across all chapters

    Returns a dict with per-chapter scores and video-level averages.
    """
    chapter_results = []

    for i, ch in enumerate(chapters):
        title      = ch.get("title", "")
        start_time = ch.get("start_time", 0.0)
        end_time   = ch.get("end_time", float("inf"))

        # Get transcript text for this chapter
        chapter_text = get_chapter_transcript(segments, start_time, end_time)

        if not chapter_text:
            log.warning(f"  Chapter {i+1} '{title}' — no transcript text found, skipping")
            continue

        # Compute scores
        scores = compute_rouge_bleu(title, chapter_text)

        chapter_results.append({
            "chapter_index": i + 1,
            "title":         title,
            "start_time":    start_time,
            "end_time":      end_time,
            "transcript_words": len(chapter_text.split()),
            **scores,
        })

        log.info(
            f"  Chapter {i+1:>2}: '{title[:50]}' "
            f"→ R1={scores['rouge1']:.3f} "
            f"R2={scores['rouge2']:.3f} "
            f"RL={scores['rougeL']:.3f} "
            f"BLEU={scores['bleu']:.3f}"
        )

    if not chapter_results:
        return {
            "video_id":      video_id,
            "num_chapters":  0,
            "avg_rouge1":    0.0,
            "avg_rouge2":    0.0,
            "avg_rougeL":    0.0,
            "avg_bleu":      0.0,
            "chapters":      [],
        }

    avg = lambda key: round(
        sum(r[key] for r in chapter_results) / len(chapter_results), 4
    )

    return {
        "video_id":     video_id,
        "num_chapters": len(chapter_results),
        "avg_rouge1":   avg("rouge1"),
        "avg_rouge2":   avg("rouge2"),
        "avg_rougeL":   avg("rougeL"),
        "avg_bleu":     avg("bleu"),
        "chapters":     chapter_results,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(
    chapters_dir:    str,
    transcripts_dir: str,
    output_path:     str,
) -> dict:
    """
    Evaluate title quality across all videos that have both
    a chapters file and a transcript file.
    """
    chap_dir  = Path(chapters_dir)
    trans_dir = Path(transcripts_dir)
    out_path  = Path(output_path)

    chap_files = sorted(chap_dir.glob("*_chapters.json"))
    if not chap_files:
        log.error(f"No chapter files found in '{chap_dir}'")
        sys.exit(1)

    log.info(f"Found {len(chap_files)} chapter files")

    all_results = []
    skipped     = 0

    for chap_file in chap_files:
        video_id   = chap_file.name.replace("_chapters.json", "")
        trans_file = trans_dir / f"{video_id}_transcripts.json"

        if not trans_file.exists():
            log.warning(f"No transcript for '{video_id}' — skipping")
            skipped += 1
            continue

        log.info(f"\nEvaluating: {video_id}")

        # Load chapters
        with open(chap_file, encoding="utf-8") as f:
            chap_data = json.load(f)
        chapters = chap_data.get("chapters", [])

        # Load transcript segments
        with open(trans_file, encoding="utf-8") as f:
            trans_data = json.load(f)
        segments = trans_data.get("segments", [])

        if not chapters:
            log.warning(f"  No chapters found — skipping")
            skipped += 1
            continue

        result = evaluate_video(video_id, chapters, segments)
        all_results.append(result)
        log.info(
            f"  Average → R1={result['avg_rouge1']:.3f} "
            f"R2={result['avg_rouge2']:.3f} "
            f"RL={result['avg_rougeL']:.3f} "
            f"BLEU={result['avg_bleu']:.3f}"
        )

    if not all_results:
        log.error("No videos evaluated.")
        sys.exit(1)

    # ── Aggregate across all videos ────────────────────────────────────────
    def mean(key):
        vals = [r[key] for r in all_results]
        return round(sum(vals) / len(vals), 4) if vals else 0.0

    def std(key):
        vals = [r[key] for r in all_results]
        if len(vals) < 2:
            return 0.0
        m = mean(key)
        return round((sum((v - m) ** 2 for v in vals) / len(vals)) ** 0.5, 4)

    aggregate = {
        "method":      "transcript-as-reference (Option B)",
        "note":        (
            "Titles are evaluated against the transcript text of their own chapter. "
            "This is a proxy metric — a high score means the title words appear in "
            "the spoken content of that chapter. It does not measure whether the "
            "title is the best possible description, only that it is content-relevant."
        ),
        "num_videos":   len(all_results),
        "num_skipped":  skipped,
        "aggregate": {
            "mean_rouge1": mean("avg_rouge1"),
            "std_rouge1":  std("avg_rouge1"),
            "mean_rouge2": mean("avg_rouge2"),
            "std_rouge2":  std("avg_rouge2"),
            "mean_rougeL": mean("avg_rougeL"),
            "std_rougeL":  std("avg_rougeL"),
            "mean_bleu":   mean("avg_bleu"),
            "std_bleu":    std("avg_bleu"),
        },
        "per_video": all_results,
    }

    # ── Print summary ──────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  TITLE QUALITY EVALUATION (transcript-as-reference)")
    print("=" * 65)
    print(f"  Videos evaluated : {len(all_results)}")
    print(f"  Videos skipped   : {skipped}")
    print()
    print(f"  ROUGE-1  : {mean('avg_rouge1'):.3f}  (±{std('avg_rouge1'):.3f})")
    print(f"  ROUGE-2  : {mean('avg_rouge2'):.3f}  (±{std('avg_rouge2'):.3f})")
    print(f"  ROUGE-L  : {mean('avg_rougeL'):.3f}  (±{std('avg_rougeL'):.3f})")
    print(f"  BLEU     : {mean('avg_bleu'):.3f}  (±{std('avg_bleu'):.3f})")
    print()
    print("  PER-VIDEO AVERAGES")
    print(f"  {'Video':<35} {'R1':>6} {'R2':>6} {'RL':>6} {'BLEU':>6}")
    print("  " + "-" * 57)
    for r in all_results:
        print(
            f"  {r['video_id']:<35} "
            f"{r['avg_rouge1']:>6.3f} "
            f"{r['avg_rouge2']:>6.3f} "
            f"{r['avg_rougeL']:>6.3f} "
            f"{r['avg_bleu']:>6.3f}"
        )
    print("=" * 65)

    # ── Save ──────────────────────────────────────────────────────────────
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(aggregate, f, indent=2, ensure_ascii=False)
    log.info(f"\nResults saved → {out_path}")

    return aggregate


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            "Evaluate chapter title quality using transcript content as "
            "soft reference (Option B — no manual annotation required)."
        ),
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--chapters-dir",
        default="/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/chapters",
        help="Directory containing *_chapters.json files",
    )
    parser.add_argument(
        "--transcripts-dir",
        default="/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/transcripts",
        help="Directory containing *_transcripts.json files",
    )
    parser.add_argument(
        "--output",
        default="/home/umwise2526studentproj/Group3ProjectWork/data/processed/evaluation/subtask1_segmentation/title_eval_results.json",
        help="Output JSON path for results",
    )
    args = parser.parse_args()

    run(
        chapters_dir    = args.chapters_dir,
        transcripts_dir = args.transcripts_dir,
        output_path     = args.output,
    )