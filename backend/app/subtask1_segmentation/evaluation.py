"""
evaluation.py — Chapter Segmentation Evaluation Framework
==========================================================
Measures how good your predicted chapters are against manually
annotated ground truth chapters.

Metrics:
  Boundary quality:  Precision, Recall, F1  (with tolerance window)
  Title quality:     ROUGE-1, ROUGE-2, ROUGE-L, BLEU
  Ablation support:  compare Full System vs Transcript-Only vs Baseline

Usage:
  # Evaluate a single video
  python evaluation.py
      --predicted  lecture_chapters.json
      --groundtruth lecture_groundtruth.json

  # Evaluate across a whole dataset folder
  python evaluation.py --dataset-dir ./videos

  # Run ablation study (all three conditions)
  python evaluation.py --dataset-dir ./videos --ablation

Ground truth format (create one per video):
  {
    "video_id": "lecture_neural_networks",
    "video_file": "lecture_neural_networks.mp4",
    "chapters": [
      {"start": "00:00:00", "title": "Introduction"},
      {"start": "00:07:30", "title": "Linear Regression Basics"},
      ...
    ]
  }
"""

import argparse
import json
import logging
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("evaluation")


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------
@dataclass
class BoundaryMetrics:
    precision:          float
    recall:             float
    f1:                 float
    tolerance_seconds:  float
    true_positives:     int
    false_positives:    int
    false_negatives:    int

    def to_dict(self) -> dict:
        return asdict(self)

    def __str__(self) -> str:
        return (
            f"Boundary (tol={self.tolerance_seconds}s):  "
            f"P={self.precision:.3f}  R={self.recall:.3f}  F1={self.f1:.3f}  "
            f"(TP={self.true_positives}, FP={self.false_positives}, FN={self.false_negatives})"
        )


@dataclass
class TitleMetrics:
    rouge1:             float
    rouge2:             float
    rougeL:             float
    bleu:               float
    avg_title_length:   float

    def to_dict(self) -> dict:
        return asdict(self)

    def __str__(self) -> str:
        return (
            f"Title quality:  "
            f"ROUGE-1={self.rouge1:.3f}  ROUGE-2={self.rouge2:.3f}  "
            f"ROUGE-L={self.rougeL:.3f}  BLEU={self.bleu:.3f}"
        )


@dataclass
class VideoResult:
    video_id:               str
    num_predicted:          int
    num_groundtruth:        int
    boundary:               BoundaryMetrics
    title:                  Optional[TitleMetrics]
    condition:              str   # "full_system" | "transcript_only" | "baseline"

    def to_dict(self) -> dict:
        d = asdict(self)
        return d

    def __str__(self) -> str:
        lines = [
            f"\n  Video: {self.video_id}  [{self.condition}]",
            f"  Predicted={self.num_predicted}, GroundTruth={self.num_groundtruth}",
            f"  {self.boundary}",
        ]
        if self.title:
            lines.append(f"  {self.title}")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def hms_to_seconds(hms: str) -> float:
    """Convert HH:MM:SS or MM:SS string to float seconds."""
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


def load_predicted(path: Path) -> list[dict]:
    """Load chapters JSON produced by chaptering.py"""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if "chapters" not in data:
        log.error(f"No 'chapters' key in {path}")
        sys.exit(1)
    return data["chapters"]


def load_groundtruth(path: Path) -> dict:
    """Load a manually annotated ground truth JSON file."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    required = ["video_id", "chapters"]
    for key in required:
        if key not in data:
            log.error(f"Ground truth file {path} is missing key: '{key}'")
            sys.exit(1)
    return data


def install_if_missing(package: str, import_name: Optional[str] = None) -> None:
    """Try to import a package and give a clear error if missing."""
    import importlib
    name = import_name or package
    try:
        importlib.import_module(name)
    except ImportError:
        log.error(
            f"Package '{package}' is not installed.\n"
            f"Run:  pip install {package}"
        )
        sys.exit(1)


# ---------------------------------------------------------------------------
# Boundary evaluation
# ---------------------------------------------------------------------------
def evaluate_boundaries(
    predicted_starts:    list[float],
    groundtruth_starts:  list[float],
    tolerance_seconds:   float = 30.0,
) -> BoundaryMetrics:
    """
    Compute Precision, Recall, F1 for chapter boundary detection.

    A predicted boundary is a TRUE POSITIVE if it falls within
    ±tolerance_seconds of any ground truth boundary.

    Why tolerance window?
      Humans annotating boundaries don't always agree to the exact second.
      A 30-second window means "close enough" — standard in video segmentation.

    Args:
        predicted_starts:   List of predicted boundary timestamps (seconds).
                            Include 0.0 only if you want to evaluate the first boundary.
        groundtruth_starts: List of ground truth boundary timestamps (seconds).
        tolerance_seconds:  How close a prediction must be to count as correct.

    Returns:
        BoundaryMetrics with P, R, F1 and raw counts.
    """
    # Ignore the very first boundary (00:00:00) — always trivially correct
    pred = sorted([t for t in predicted_starts   if t > 5.0])
    gt   = sorted([t for t in groundtruth_starts if t > 5.0])

    matched_pred = set()
    matched_gt   = set()

    # Greedy matching: each GT boundary matched to at most one prediction
    for j, g in enumerate(gt):
        best_pred_idx  = None
        best_dist      = float("inf")
        for i, p in enumerate(pred):
            if i in matched_pred:
                continue
            dist = abs(p - g)
            if dist <= tolerance_seconds and dist < best_dist:
                best_dist     = dist
                best_pred_idx = i
        if best_pred_idx is not None:
            matched_pred.add(best_pred_idx)
            matched_gt.add(j)

    tp = len(matched_gt)
    fp = len(pred) - tp
    fn = len(gt)  - tp

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) > 0 else 0.0)

    return BoundaryMetrics(
        precision         = round(precision, 4),
        recall            = round(recall,    4),
        f1                = round(f1,        4),
        tolerance_seconds = tolerance_seconds,
        true_positives    = tp,
        false_positives   = fp,
        false_negatives   = fn,
    )


# ---------------------------------------------------------------------------
# Title evaluation
# ---------------------------------------------------------------------------
def evaluate_titles(
    predicted_titles:   list[str],
    groundtruth_titles: list[str],
) -> TitleMetrics:
    """
    Compute ROUGE and BLEU scores for chapter title quality.

    Pairs predicted titles with ground truth titles by order.
    Uses the minimum of predicted/groundtruth count to avoid index errors.

    ROUGE measures n-gram overlap between predicted and reference titles.
    BLEU measures precision of n-grams in the prediction vs reference.
    Both are standard metrics for text generation quality.
    """
    install_if_missing("rouge_score", "rouge_score")
    install_if_missing("nltk")

    from rouge_score import rouge_scorer as rs_module
    import nltk
    from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

    # Download NLTK tokenizer data silently if not present
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt", quiet=True)
    try:
        nltk.data.find("tokenizers/punkt_tab")
    except LookupError:
        nltk.download("punkt_tab", quiet=True)

    scorer   = rs_module.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
    smoothie = SmoothingFunction().method1

    n = min(len(predicted_titles), len(groundtruth_titles))
    if n == 0:
        return TitleMetrics(0.0, 0.0, 0.0, 0.0, 0.0)

    r1_scores, r2_scores, rL_scores, bleu_scores = [], [], [], []

    for pred_title, gt_title in zip(predicted_titles[:n], groundtruth_titles[:n]):
        scores = scorer.score(gt_title, pred_title)
        r1_scores.append(scores["rouge1"].fmeasure)
        r2_scores.append(scores["rouge2"].fmeasure)
        rL_scores.append(scores["rougeL"].fmeasure)

        ref_tokens  = [gt_title.lower().split()]
        pred_tokens = pred_title.lower().split()
        bleu_scores.append(
            sentence_bleu(ref_tokens, pred_tokens, smoothing_function=smoothie)
        )

    avg = lambda lst: round(sum(lst) / len(lst), 4) if lst else 0.0
    avg_len = round(
        sum(len(t.split()) for t in predicted_titles) / max(len(predicted_titles), 1), 2
    )

    return TitleMetrics(
        rouge1           = avg(r1_scores),
        rouge2           = avg(r2_scores),
        rougeL           = avg(rL_scores),
        bleu             = avg(bleu_scores),
        avg_title_length = avg_len,
    )


# ---------------------------------------------------------------------------
# Single video evaluation
# ---------------------------------------------------------------------------
def evaluate_video(
    predicted_chapters:   list[dict],
    groundtruth_data:     dict,
    tolerance_seconds:    float = 30.0,
    condition:            str   = "full_system",
) -> VideoResult:
    """
    Evaluate predicted chapters for a single video.

    Args:
        predicted_chapters: List of chapter dicts from chaptering.py output.
        groundtruth_data:   Dict loaded from a ground truth JSON file.
        tolerance_seconds:  Tolerance window for boundary matching.
        condition:          Label for this run ('full_system', 'transcript_only', 'baseline').

    Returns:
        VideoResult with all metrics.
    """
    video_id = groundtruth_data["video_id"]

    # Extract start times
    pred_starts = [c["start_time"] for c in predicted_chapters]
    gt_starts   = [hms_to_seconds(c["start"]) for c in groundtruth_data["chapters"]]

    # Extract titles
    pred_titles = [c["title"] for c in predicted_chapters]
    gt_titles   = [c["title"] for c in groundtruth_data["chapters"]]

    boundary = evaluate_boundaries(pred_starts, gt_starts, tolerance_seconds)
    title    = evaluate_titles(pred_titles, gt_titles)

    result = VideoResult(
        video_id        = video_id,
        num_predicted   = len(predicted_chapters),
        num_groundtruth = len(groundtruth_data["chapters"]),
        boundary        = boundary,
        title           = title,
        condition       = condition,
    )

    log.info(str(result))
    return result


# ---------------------------------------------------------------------------
# Dataset evaluation
# ---------------------------------------------------------------------------
def evaluate_dataset(
    dataset_dir:        str,
    tolerance_seconds:  float = 30.0,
    condition:          str   = "full_system",
    chapters_suffix:    str   = "_chapters.json",
    groundtruth_suffix: str   = "_groundtruth.json",
) -> dict:
    """
    Evaluate across all videos in a folder.

    Expects files to follow the naming convention:
      <video_id>_chapters.json      ← predicted (from chaptering.py)
      <video_id>_groundtruth.json   ← manually annotated

    Args:
        dataset_dir:        Folder containing all JSON files.
        tolerance_seconds:  Boundary matching tolerance.
        condition:          Label for this evaluation run.
        chapters_suffix:    Suffix for predicted chapter files.
        groundtruth_suffix: Suffix for ground truth files.

    Returns:
        Dict with per-video results and aggregate statistics.
    """
    folder = Path(dataset_dir)
    gt_files = sorted(folder.glob(f"*{groundtruth_suffix}"))

    if not gt_files:
        log.error(
            f"No ground truth files found in '{folder}'.\n"
            f"Expected files named: *{groundtruth_suffix}"
        )
        sys.exit(1)

    log.info(f"Found {len(gt_files)} ground truth files in '{folder}'")

    results: list[VideoResult] = []

    for gt_path in gt_files:
        # Derive predicted chapters path from ground truth filename
        video_id   = gt_path.name.replace(groundtruth_suffix, "")
        pred_path  = folder / f"{video_id}{chapters_suffix}"

        if not pred_path.exists():
            log.warning(f"No predicted chapters found for '{video_id}' — skipping")
            continue

        gt_data    = load_groundtruth(gt_path)
        pred_chaps = load_predicted(pred_path)

        result = evaluate_video(
            pred_chaps, gt_data, tolerance_seconds, condition
        )
        results.append(result)

    if not results:
        log.error("No videos could be evaluated. Check file naming.")
        sys.exit(1)

    return aggregate_results(results, condition)


# ---------------------------------------------------------------------------
# Aggregate results
# ---------------------------------------------------------------------------
def aggregate_results(results: list[VideoResult], condition: str) -> dict:
    """
    Compute mean metrics across all evaluated videos.
    Also computes standard deviation to show consistency.
    """
    import statistics

    f1s        = [r.boundary.f1        for r in results]
    precisions = [r.boundary.precision for r in results]
    recalls    = [r.boundary.recall    for r in results]

    r1s  = [r.title.rouge1 for r in results if r.title]
    r2s  = [r.title.rouge2 for r in results if r.title]
    rLs  = [r.title.rougeL for r in results if r.title]
    blus = [r.title.bleu   for r in results if r.title]

    def mean(lst):  return round(sum(lst) / len(lst), 4) if lst else 0.0
    def std(lst):   return round(statistics.stdev(lst), 4) if len(lst) > 1 else 0.0

    aggregate = {
        "condition":    condition,
        "num_videos":   len(results),
        "boundary": {
            "mean_f1":        mean(f1s),
            "mean_precision": mean(precisions),
            "mean_recall":    mean(recalls),
            "std_f1":         std(f1s),
        },
        "title": {
            "mean_rouge1": mean(r1s),
            "mean_rouge2": mean(r2s),
            "mean_rougeL": mean(rLs),
            "mean_bleu":   mean(blus),
        },
        "per_video": [r.to_dict() for r in results],
    }

    # Print summary table
    print("\n" + "═" * 65)
    print(f"  EVALUATION RESULTS — {condition.upper()}")
    print("═" * 65)
    print(f"  Videos evaluated : {len(results)}")
    print(f"  Boundary F1      : {mean(f1s):.3f}  (±{std(f1s):.3f})")
    print(f"  Boundary Prec.   : {mean(precisions):.3f}")
    print(f"  Boundary Recall  : {mean(recalls):.3f}")
    if r1s:
        print(f"  ROUGE-1          : {mean(r1s):.3f}")
        print(f"  ROUGE-2          : {mean(r2s):.3f}")
        print(f"  ROUGE-L          : {mean(rLs):.3f}")
        print(f"  BLEU             : {mean(blus):.3f}")
    print("═" * 65 + "\n")

    return aggregate


# ---------------------------------------------------------------------------
# Ablation study
# ---------------------------------------------------------------------------
def run_ablation(
    dataset_dir:       str,
    tolerance_seconds: float = 30.0,
) -> dict:
    """
    Run all three ablation conditions and compare results side by side.

    Conditions:
      1. baseline         — equal-length segments (no intelligence)
      2. transcript_only  — LLM chaptering without frame captions
      3. full_system      — LLM chaptering with transcript + captions

    For conditions 2 and 3 you need to have run chaptering.py separately
    and saved the output with the right filename suffix:
      <video_id>_chapters_baseline.json
      <video_id>_chapters_transcript_only.json
      <video_id>_chapters.json   (full system, default output)

    The baseline is computed automatically from ground truth file durations.
    """
    folder   = Path(dataset_dir)
    gt_files = sorted(folder.glob("*_groundtruth.json"))

    all_results = {}

    # ---- Baseline: equal-length segments -------------------------------------
    log.info("Evaluating BASELINE (equal-length segments) …")
    baseline_results = []
    for gt_path in gt_files:
        gt_data    = load_groundtruth(gt_path)
        video_id   = gt_data["video_id"]
        gt_starts  = [hms_to_seconds(c["start"]) for c in gt_data["chapters"]]
        n_gt       = len(gt_data["chapters"])

        # Infer video duration: last GT boundary + assume 10 min for last chapter
        video_duration = max(gt_starts) + 600.0

        # Create equal-length segments matching the number of GT chapters
        step       = video_duration / n_gt
        pred_starts = [i * step for i in range(n_gt)]
        pred_titles = [f"Section {i+1}" for i in range(n_gt)]

        # Build fake chapter dicts
        fake_chapters = [
            {"start_time": t, "title": pred_titles[i]}
            for i, t in enumerate(pred_starts)
        ]
        result = evaluate_video(fake_chapters, gt_data, tolerance_seconds, "baseline")
        baseline_results.append(result)

    all_results["baseline"] = aggregate_results(baseline_results, "baseline")

    # ---- Transcript-only and Full system -------------------------------------
    for condition, suffix in [
        ("transcript_only", "_chapters_transcript_only.json"),
        ("full_system",     "_chapters.json"),
    ]:
        log.info(f"Evaluating {condition.upper()} …")
        results = []
        for gt_path in gt_files:
            gt_data  = load_groundtruth(gt_path)
            video_id = gt_data["video_id"]
            pred_path = folder / f"{video_id}{suffix}"
            if not pred_path.exists():
                log.warning(f"  Missing {pred_path.name} — skipping {video_id}")
                continue
            pred_chaps = load_predicted(pred_path)
            result     = evaluate_video(pred_chaps, gt_data, tolerance_seconds, condition)
            results.append(result)
        if results:
            all_results[condition] = aggregate_results(results, condition)

    # ---- Comparison table ----------------------------------------------------
    print("\n" + "═" * 70)
    print(f"  {'ABLATION STUDY — COMPARISON':^66}")
    print("═" * 70)
    print(f"  {'Condition':<25} {'F1':>8} {'Precision':>10} {'Recall':>8} {'ROUGE-1':>9}")
    print("  " + "─" * 64)
    for cond, res in all_results.items():
        b = res["boundary"]
        t = res["title"]
        print(
            f"  {cond:<25} "
            f"{b['mean_f1']:>8.3f} "
            f"{b['mean_precision']:>10.3f} "
            f"{b['mean_recall']:>8.3f} "
            f"{t['mean_rouge1']:>9.3f}"
        )
    print("═" * 70 + "\n")

    return all_results


# ---------------------------------------------------------------------------
# Save results
# ---------------------------------------------------------------------------
def save_results(results: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    log.info(f"Results saved → {output_path}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Evaluate chapter prediction quality against ground truth annotations.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--predicted",
        help="Path to a single predicted chapters JSON (from chaptering.py).",
    )
    mode.add_argument(
        "--dataset-dir",
        help="Folder containing all predicted and ground truth JSON files.",
    )

    parser.add_argument(
        "--groundtruth",
        help="Path to a single ground truth JSON (required with --predicted).",
    )
    parser.add_argument(
        "--tolerance", type=float, default=30.0,
        help="Boundary matching tolerance in seconds.",
    )
    parser.add_argument(
        "--condition", default="full_system",
        choices=["full_system", "transcript_only", "baseline"],
        help="Label for this evaluation run.",
    )
    parser.add_argument(
        "--ablation", action="store_true",
        help="Run all three ablation conditions and compare (requires --dataset-dir).",
    )
    parser.add_argument(
        "--output", default=None,
        help="Path to save evaluation results JSON.",
    )
    args = parser.parse_args()

    # ---- Single video evaluation
    if args.predicted:
        if not args.groundtruth:
            log.error("--groundtruth is required when using --predicted")
            sys.exit(1)
        pred   = load_predicted(Path(args.predicted))
        gt     = load_groundtruth(Path(args.groundtruth))
        result = evaluate_video(pred, gt, args.tolerance, args.condition)
        agg    = aggregate_results([result], args.condition)
        if args.output:
            save_results(agg, Path(args.output))

    # ---- Dataset / ablation evaluation
    elif args.dataset_dir:
        if args.ablation:
            results = run_ablation(args.dataset_dir, args.tolerance)
        else:
            results = evaluate_dataset(
                args.dataset_dir, args.tolerance, args.condition
            )
        out = Path(args.output) if args.output else \
              Path(args.dataset_dir) / "evaluation_results.json"
        save_results(results, out)