# """
# evaluation.py — Chapter Segmentation Evaluation Framework
# ==========================================================
# Measures how good your predicted chapters are against manually
# annotated ground truth chapters.

# Metrics:
#   Boundary quality:  Precision, Recall, F1  (with tolerance window)
#   Title quality:     ROUGE-1, ROUGE-2, ROUGE-L, BLEU
#   Ablation support:  compare Full System vs Transcript-Only vs Baseline

# Usage:
#   # Evaluate a single video
#   python evaluation.py
#       --predicted  lecture_chapters.json
#       --groundtruth lecture_groundtruth.json

#   # Evaluate across a whole dataset folder
#   python evaluation.py --dataset-dir ./videos

#   # Run ablation study (all three conditions)
#   python evaluation.py --dataset-dir ./videos --ablation

# Ground truth format (create one per video):
#   {
#     "video_id": "lecture_neural_networks",
#     "video_file": "lecture_neural_networks.mp4",
#     "chapters": [
#       {"start": "00:00:00", "title": "Introduction"},
#       {"start": "00:07:30", "title": "Linear Regression Basics"},
#       ...
#     ]
#   }
# """

# import argparse
# import json
# import logging
# import sys
# from dataclasses import asdict, dataclass
# from pathlib import Path
# from typing import Optional

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s  %(levelname)-8s  %(message)s",
#     datefmt="%H:%M:%S",
# )
# log = logging.getLogger("evaluation")


# # ---------------------------------------------------------------------------
# # Data models
# # ---------------------------------------------------------------------------
# @dataclass
# class BoundaryMetrics:
#     precision:          float
#     recall:             float
#     f1:                 float
#     tolerance_seconds:  float
#     true_positives:     int
#     false_positives:    int
#     false_negatives:    int

#     def to_dict(self) -> dict:
#         return asdict(self)

#     def __str__(self) -> str:
#         return (
#             f"Boundary (tol={self.tolerance_seconds}s):  "
#             f"P={self.precision:.3f}  R={self.recall:.3f}  F1={self.f1:.3f}  "
#             f"(TP={self.true_positives}, FP={self.false_positives}, FN={self.false_negatives})"
#         )


# @dataclass
# class TitleMetrics:
#     rouge1:             float
#     rouge2:             float
#     rougeL:             float
#     bleu:               float
#     avg_title_length:   float

#     def to_dict(self) -> dict:
#         return asdict(self)

#     def __str__(self) -> str:
#         return (
#             f"Title quality:  "
#             f"ROUGE-1={self.rouge1:.3f}  ROUGE-2={self.rouge2:.3f}  "
#             f"ROUGE-L={self.rougeL:.3f}  BLEU={self.bleu:.3f}"
#         )


# @dataclass
# class VideoResult:
#     video_id:               str
#     num_predicted:          int
#     num_groundtruth:        int
#     boundary:               BoundaryMetrics
#     title:                  Optional[TitleMetrics]
#     condition:              str   # "full_system" | "transcript_only" | "baseline"

#     def to_dict(self) -> dict:
#         d = asdict(self)
#         return d

#     def __str__(self) -> str:
#         lines = [
#             f"\n  Video: {self.video_id}  [{self.condition}]",
#             f"  Predicted={self.num_predicted}, GroundTruth={self.num_groundtruth}",
#             f"  {self.boundary}",
#         ]
#         if self.title:
#             lines.append(f"  {self.title}")
#         return "\n".join(lines)


# # ---------------------------------------------------------------------------
# # Helpers
# # ---------------------------------------------------------------------------
# def hms_to_seconds(hms: str) -> float:
#     """Convert HH:MM:SS or MM:SS string to float seconds."""
#     parts = hms.strip().split(":")
#     try:
#         parts = [float(p) for p in parts]
#         if len(parts) == 3:
#             return parts[0] * 3600 + parts[1] * 60 + parts[2]
#         elif len(parts) == 2:
#             return parts[0] * 60 + parts[1]
#         return float(parts[0])
#     except ValueError:
#         return 0.0


# def load_predicted(path: Path) -> list[dict]:
#     """Load chapters JSON produced by chaptering.py"""
#     with open(path, encoding="utf-8") as f:
#         data = json.load(f)
#     if "chapters" not in data:
#         log.error(f"No 'chapters' key in {path}")
#         sys.exit(1)
#     return data["chapters"]


# def load_groundtruth(path: Path) -> dict:
#     """Load a manually annotated ground truth JSON file."""
#     with open(path, encoding="utf-8") as f:
#         data = json.load(f)
#     required = ["video_id", "chapters"]
#     for key in required:
#         if key not in data:
#             log.error(f"Ground truth file {path} is missing key: '{key}'")
#             sys.exit(1)
#     return data


# def install_if_missing(package: str, import_name: Optional[str] = None) -> None:
#     """Try to import a package and give a clear error if missing."""
#     import importlib
#     name = import_name or package
#     try:
#         importlib.import_module(name)
#     except ImportError:
#         log.error(
#             f"Package '{package}' is not installed.\n"
#             f"Run:  pip install {package}"
#         )
#         sys.exit(1)


# # ---------------------------------------------------------------------------
# # Boundary evaluation
# # ---------------------------------------------------------------------------
# def evaluate_boundaries(
#     predicted_starts:    list[float],
#     groundtruth_starts:  list[float],
#     tolerance_seconds:   float = 30.0,
# ) -> BoundaryMetrics:
#     """
#     Compute Precision, Recall, F1 for chapter boundary detection.

#     A predicted boundary is a TRUE POSITIVE if it falls within
#     ±tolerance_seconds of any ground truth boundary.

#     Why tolerance window?
#       Humans annotating boundaries don't always agree to the exact second.
#       A 30-second window means "close enough" — standard in video segmentation.

#     Args:
#         predicted_starts:   List of predicted boundary timestamps (seconds).
#                             Include 0.0 only if you want to evaluate the first boundary.
#         groundtruth_starts: List of ground truth boundary timestamps (seconds).
#         tolerance_seconds:  How close a prediction must be to count as correct.

#     Returns:
#         BoundaryMetrics with P, R, F1 and raw counts.
#     """
#     # Ignore the very first boundary (00:00:00) — always trivially correct
#     pred = sorted([t for t in predicted_starts   if t > 5.0])
#     gt   = sorted([t for t in groundtruth_starts if t > 5.0])

#     matched_pred = set()
#     matched_gt   = set()

#     # Greedy matching: each GT boundary matched to at most one prediction
#     for j, g in enumerate(gt):
#         best_pred_idx  = None
#         best_dist      = float("inf")
#         for i, p in enumerate(pred):
#             if i in matched_pred:
#                 continue
#             dist = abs(p - g)
#             if dist <= tolerance_seconds and dist < best_dist:
#                 best_dist     = dist
#                 best_pred_idx = i
#         if best_pred_idx is not None:
#             matched_pred.add(best_pred_idx)
#             matched_gt.add(j)

#     tp = len(matched_gt)
#     fp = len(pred) - tp
#     fn = len(gt)  - tp

#     precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
#     recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
#     f1        = (2 * precision * recall / (precision + recall)
#                  if (precision + recall) > 0 else 0.0)

#     return BoundaryMetrics(
#         precision         = round(precision, 4),
#         recall            = round(recall,    4),
#         f1                = round(f1,        4),
#         tolerance_seconds = tolerance_seconds,
#         true_positives    = tp,
#         false_positives   = fp,
#         false_negatives   = fn,
#     )


# # ---------------------------------------------------------------------------
# # Title evaluation
# # ---------------------------------------------------------------------------
# def evaluate_titles(
#     predicted_titles:   list[str],
#     groundtruth_titles: list[str],
# ) -> TitleMetrics:
#     """
#     Compute ROUGE and BLEU scores for chapter title quality.

#     Pairs predicted titles with ground truth titles by order.
#     Uses the minimum of predicted/groundtruth count to avoid index errors.

#     ROUGE measures n-gram overlap between predicted and reference titles.
#     BLEU measures precision of n-grams in the prediction vs reference.
#     Both are standard metrics for text generation quality.
#     """
#     install_if_missing("rouge_score", "rouge_score")
#     install_if_missing("nltk")

#     from rouge_score import rouge_scorer as rs_module
#     import nltk
#     from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

#     # Download NLTK tokenizer data silently if not present
#     try:
#         nltk.data.find("tokenizers/punkt")
#     except LookupError:
#         nltk.download("punkt", quiet=True)
#     try:
#         nltk.data.find("tokenizers/punkt_tab")
#     except LookupError:
#         nltk.download("punkt_tab", quiet=True)

#     scorer   = rs_module.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
#     smoothie = SmoothingFunction().method1

#     n = min(len(predicted_titles), len(groundtruth_titles))
#     if n == 0:
#         return TitleMetrics(0.0, 0.0, 0.0, 0.0, 0.0)

#     r1_scores, r2_scores, rL_scores, bleu_scores = [], [], [], []

#     for pred_title, gt_title in zip(predicted_titles[:n], groundtruth_titles[:n]):
#         scores = scorer.score(gt_title, pred_title)
#         r1_scores.append(scores["rouge1"].fmeasure)
#         r2_scores.append(scores["rouge2"].fmeasure)
#         rL_scores.append(scores["rougeL"].fmeasure)

#         ref_tokens  = [gt_title.lower().split()]
#         pred_tokens = pred_title.lower().split()
#         bleu_scores.append(
#             sentence_bleu(ref_tokens, pred_tokens, smoothing_function=smoothie)
#         )

#     avg = lambda lst: round(sum(lst) / len(lst), 4) if lst else 0.0
#     avg_len = round(
#         sum(len(t.split()) for t in predicted_titles) / max(len(predicted_titles), 1), 2
#     )

#     return TitleMetrics(
#         rouge1           = avg(r1_scores),
#         rouge2           = avg(r2_scores),
#         rougeL           = avg(rL_scores),
#         bleu             = avg(bleu_scores),
#         avg_title_length = avg_len,
#     )


# # ---------------------------------------------------------------------------
# # Single video evaluation
# # ---------------------------------------------------------------------------
# def evaluate_video(
#     predicted_chapters:   list[dict],
#     groundtruth_data:     dict,
#     tolerance_seconds:    float = 30.0,
#     condition:            str   = "full_system",
# ) -> VideoResult:
#     """
#     Evaluate predicted chapters for a single video.

#     Args:
#         predicted_chapters: List of chapter dicts from chaptering.py output.
#         groundtruth_data:   Dict loaded from a ground truth JSON file.
#         tolerance_seconds:  Tolerance window for boundary matching.
#         condition:          Label for this run ('full_system', 'transcript_only', 'baseline').

#     Returns:
#         VideoResult with all metrics.
#     """
#     video_id = groundtruth_data["video_id"]

#     # Extract start times
#     pred_starts = [c["start_time"] for c in predicted_chapters]
#     gt_starts   = [hms_to_seconds(c["start"]) for c in groundtruth_data["chapters"]]

#     # Extract titles
#     pred_titles = [c["title"] for c in predicted_chapters]
#     gt_titles   = [c["title"] for c in groundtruth_data["chapters"]]

#     boundary = evaluate_boundaries(pred_starts, gt_starts, tolerance_seconds)
#     title    = evaluate_titles(pred_titles, gt_titles)

#     result = VideoResult(
#         video_id        = video_id,
#         num_predicted   = len(predicted_chapters),
#         num_groundtruth = len(groundtruth_data["chapters"]),
#         boundary        = boundary,
#         title           = title,
#         condition       = condition,
#     )

#     log.info(str(result))
#     return result


# # ---------------------------------------------------------------------------
# # Dataset evaluation
# # ---------------------------------------------------------------------------
# def evaluate_dataset(
#     dataset_dir:        str,
#     tolerance_seconds:  float = 30.0,
#     condition:          str   = "full_system",
#     chapters_suffix:    str   = "_chapters.json",
#     groundtruth_suffix: str   = "_groundtruth.json",
# ) -> dict:
#     """
#     Evaluate across all videos in a folder.

#     Expects files to follow the naming convention:
#       <video_id>_chapters.json      ← predicted (from chaptering.py)
#       <video_id>_groundtruth.json   ← manually annotated

#     Args:
#         dataset_dir:        Folder containing all JSON files.
#         tolerance_seconds:  Boundary matching tolerance.
#         condition:          Label for this evaluation run.
#         chapters_suffix:    Suffix for predicted chapter files.
#         groundtruth_suffix: Suffix for ground truth files.

#     Returns:
#         Dict with per-video results and aggregate statistics.
#     """
#     folder = Path(dataset_dir)
#     gt_files = sorted(folder.glob(f"*{groundtruth_suffix}"))

#     if not gt_files:
#         log.error(
#             f"No ground truth files found in '{folder}'.\n"
#             f"Expected files named: *{groundtruth_suffix}"
#         )
#         sys.exit(1)

#     log.info(f"Found {len(gt_files)} ground truth files in '{folder}'")

#     results: list[VideoResult] = []

#     for gt_path in gt_files:
#         # Derive predicted chapters path from ground truth filename
#         video_id   = gt_path.name.replace(groundtruth_suffix, "")
#         pred_path  = folder / f"{video_id}{chapters_suffix}"

#         if not pred_path.exists():
#             log.warning(f"No predicted chapters found for '{video_id}' — skipping")
#             continue

#         gt_data    = load_groundtruth(gt_path)
#         pred_chaps = load_predicted(pred_path)

#         result = evaluate_video(
#             pred_chaps, gt_data, tolerance_seconds, condition
#         )
#         results.append(result)

#     if not results:
#         log.error("No videos could be evaluated. Check file naming.")
#         sys.exit(1)

#     return aggregate_results(results, condition)


# # ---------------------------------------------------------------------------
# # Aggregate results
# # ---------------------------------------------------------------------------
# def aggregate_results(results: list[VideoResult], condition: str) -> dict:
#     """
#     Compute mean metrics across all evaluated videos.
#     Also computes standard deviation to show consistency.
#     """
#     import statistics

#     f1s        = [r.boundary.f1        for r in results]
#     precisions = [r.boundary.precision for r in results]
#     recalls    = [r.boundary.recall    for r in results]

#     r1s  = [r.title.rouge1 for r in results if r.title]
#     r2s  = [r.title.rouge2 for r in results if r.title]
#     rLs  = [r.title.rougeL for r in results if r.title]
#     blus = [r.title.bleu   for r in results if r.title]

#     def mean(lst):  return round(sum(lst) / len(lst), 4) if lst else 0.0
#     def std(lst):   return round(statistics.stdev(lst), 4) if len(lst) > 1 else 0.0

#     aggregate = {
#         "condition":    condition,
#         "num_videos":   len(results),
#         "boundary": {
#             "mean_f1":        mean(f1s),
#             "mean_precision": mean(precisions),
#             "mean_recall":    mean(recalls),
#             "std_f1":         std(f1s),
#         },
#         "title": {
#             "mean_rouge1": mean(r1s),
#             "mean_rouge2": mean(r2s),
#             "mean_rougeL": mean(rLs),
#             "mean_bleu":   mean(blus),
#         },
#         "per_video": [r.to_dict() for r in results],
#     }

#     # Print summary table
#     print("\n" + "═" * 65)
#     print(f"  EVALUATION RESULTS — {condition.upper()}")
#     print("═" * 65)
#     print(f"  Videos evaluated : {len(results)}")
#     print(f"  Boundary F1      : {mean(f1s):.3f}  (±{std(f1s):.3f})")
#     print(f"  Boundary Prec.   : {mean(precisions):.3f}")
#     print(f"  Boundary Recall  : {mean(recalls):.3f}")
#     if r1s:
#         print(f"  ROUGE-1          : {mean(r1s):.3f}")
#         print(f"  ROUGE-2          : {mean(r2s):.3f}")
#         print(f"  ROUGE-L          : {mean(rLs):.3f}")
#         print(f"  BLEU             : {mean(blus):.3f}")
#     print("═" * 65 + "\n")

#     return aggregate


# # ---------------------------------------------------------------------------
# # Ablation study
# # ---------------------------------------------------------------------------
# def run_ablation(
#     dataset_dir:       str,
#     tolerance_seconds: float = 30.0,
# ) -> dict:
#     """
#     Run all three ablation conditions and compare results side by side.

#     Conditions:
#       1. baseline         — equal-length segments (no intelligence)
#       2. transcript_only  — LLM chaptering without frame captions
#       3. full_system      — LLM chaptering with transcript + captions

#     For conditions 2 and 3 you need to have run chaptering.py separately
#     and saved the output with the right filename suffix:
#       <video_id>_chapters_baseline.json
#       <video_id>_chapters_transcript_only.json
#       <video_id>_chapters.json   (full system, default output)

#     The baseline is computed automatically from ground truth file durations.
#     """
#     folder   = Path(dataset_dir)
#     gt_files = sorted(folder.glob("*_groundtruth.json"))

#     all_results = {}

#     # ---- Baseline: equal-length segments -------------------------------------
#     log.info("Evaluating BASELINE (equal-length segments) …")
#     baseline_results = []
#     for gt_path in gt_files:
#         gt_data    = load_groundtruth(gt_path)
#         video_id   = gt_data["video_id"]
#         gt_starts  = [hms_to_seconds(c["start"]) for c in gt_data["chapters"]]
#         n_gt       = len(gt_data["chapters"])

#         # Infer video duration: last GT boundary + assume 10 min for last chapter
#         video_duration = max(gt_starts) + 600.0

#         # Create equal-length segments matching the number of GT chapters
#         step       = video_duration / n_gt
#         pred_starts = [i * step for i in range(n_gt)]
#         pred_titles = [f"Section {i+1}" for i in range(n_gt)]

#         # Build fake chapter dicts
#         fake_chapters = [
#             {"start_time": t, "title": pred_titles[i]}
#             for i, t in enumerate(pred_starts)
#         ]
#         result = evaluate_video(fake_chapters, gt_data, tolerance_seconds, "baseline")
#         baseline_results.append(result)

#     all_results["baseline"] = aggregate_results(baseline_results, "baseline")

#     # ---- Transcript-only and Full system -------------------------------------
#     for condition, suffix in [
#         ("transcript_only", "_chapters_transcript_only.json"),
#         ("full_system",     "_chapters.json"),
#     ]:
#         log.info(f"Evaluating {condition.upper()} …")
#         results = []
#         for gt_path in gt_files:
#             gt_data  = load_groundtruth(gt_path)
#             video_id = gt_data["video_id"]
#             pred_path = folder / f"{video_id}{suffix}"
#             if not pred_path.exists():
#                 log.warning(f"  Missing {pred_path.name} — skipping {video_id}")
#                 continue
#             pred_chaps = load_predicted(pred_path)
#             result     = evaluate_video(pred_chaps, gt_data, tolerance_seconds, condition)
#             results.append(result)
#         if results:
#             all_results[condition] = aggregate_results(results, condition)

#     # ---- Comparison table ----------------------------------------------------
#     print("\n" + "═" * 70)
#     print(f"  {'ABLATION STUDY — COMPARISON':^66}")
#     print("═" * 70)
#     print(f"  {'Condition':<25} {'F1':>8} {'Precision':>10} {'Recall':>8} {'ROUGE-1':>9}")
#     print("  " + "─" * 64)
#     for cond, res in all_results.items():
#         b = res["boundary"]
#         t = res["title"]
#         print(
#             f"  {cond:<25} "
#             f"{b['mean_f1']:>8.3f} "
#             f"{b['mean_precision']:>10.3f} "
#             f"{b['mean_recall']:>8.3f} "
#             f"{t['mean_rouge1']:>9.3f}"
#         )
#     print("═" * 70 + "\n")

#     return all_results


# # ---------------------------------------------------------------------------
# # Save results
# # ---------------------------------------------------------------------------
# def save_results(results: dict, output_path: Path) -> None:
#     output_path.parent.mkdir(parents=True, exist_ok=True)
#     with open(output_path, "w", encoding="utf-8") as f:
#         json.dump(results, f, indent=2, ensure_ascii=False)
#     log.info(f"Results saved → {output_path}")


# # ---------------------------------------------------------------------------
# # CLI
# # ---------------------------------------------------------------------------
# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(
#         description="Evaluate chapter prediction quality against ground truth annotations.",
#         formatter_class=argparse.ArgumentDefaultsHelpFormatter,
#     )

#     mode = parser.add_mutually_exclusive_group(required=True)
#     mode.add_argument(
#         "--predicted",
#         help="Path to a single predicted chapters JSON (from chaptering.py).",
#     )
#     mode.add_argument(
#         "--dataset-dir",
#         help="Folder containing all predicted and ground truth JSON files.",
#     )

#     parser.add_argument(
#         "--groundtruth",
#         help="Path to a single ground truth JSON (required with --predicted).",
#     )
#     parser.add_argument(
#         "--tolerance", type=float, default=30.0,
#         help="Boundary matching tolerance in seconds.",
#     )
#     parser.add_argument(
#         "--condition", default="full_system",
#         choices=["full_system", "transcript_only", "baseline"],
#         help="Label for this evaluation run.",
#     )
#     parser.add_argument(
#         "--ablation", action="store_true",
#         help="Run all three ablation conditions and compare (requires --dataset-dir).",
#     )
#     parser.add_argument(
#         "--output", default=None,
#         help="Path to save evaluation results JSON.",
#     )
#     args = parser.parse_args()

#     # ---- Single video evaluation
#     if args.predicted:
#         if not args.groundtruth:
#             log.error("--groundtruth is required when using --predicted")
#             sys.exit(1)
#         pred   = load_predicted(Path(args.predicted))
#         gt     = load_groundtruth(Path(args.groundtruth))
#         result = evaluate_video(pred, gt, args.tolerance, args.condition)
#         agg    = aggregate_results([result], args.condition)
#         if args.output:
#             save_results(agg, Path(args.output))

#     # ---- Dataset / ablation evaluation
#     elif args.dataset_dir:
#         if args.ablation:
#             results = run_ablation(args.dataset_dir, args.tolerance)
#         else:
#             results = evaluate_dataset(
#                 args.dataset_dir, args.tolerance, args.condition
#             )
#         out = Path(args.output) if args.output else \
#               Path(args.dataset_dir) / "evaluation_results.json"
#         save_results(results, out)

"""
evaluation.py — Comprehensive Evaluation Framework
====================================================
Evaluates all pipeline outputs against TIB AV-Portal ground truth.

Metrics:
  1. Chapter Boundaries  — Precision, Recall, F1 (with tolerance window)
  2. Chapter Titles      — ROUGE-1, ROUGE-2, ROUGE-L, BLEU
  3. Metadata            — Exact / partial match for title, author, org, domain
  4. Keywords            — Precision, Recall, F1 against TIB keywords
  5. Transcript / ASR    — Word Error Rate (WER) against TIB VTT transcription

Usage:
  # Build ground truth from TIB open data first:
  python evaluation.py --build-groundtruth --jsonl media.jsonl --video-ids tib_av_00000_720p ...

  # Evaluate a single video:
  python evaluation.py --predicted chapters.json --groundtruth gt.json

  # Evaluate all videos in a folder:
  python evaluation.py --dataset-dir ./data/groundtruth

  # Ablation study:
  python evaluation.py --dataset-dir ./data/groundtruth --ablation

Ground truth JSON format (auto-generated by --build-groundtruth):
  {
    "video_id": "tib_av_00000_720p",
    "title": "...",
    "author": "...",
    "organization": "...",
    "keywords": ["...", ...],
    "transcript_vtt": "WEBVTT\\n\\n...",
    "chapters": [
      {"start": "00:00:00", "title": "Chapter 1"},
      ...
    ]
  }
"""

import argparse
import json
import logging
import re
import sys
from dataclasses import asdict, dataclass, field
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
    precision:         float
    recall:            float
    f1:                float
    tolerance_seconds: float
    true_positives:    int
    false_positives:   int
    false_negatives:   int

    def to_dict(self): return asdict(self)
    def __str__(self):
        return (
            f"Boundary (tol={self.tolerance_seconds}s):  "
            f"P={self.precision:.3f}  R={self.recall:.3f}  F1={self.f1:.3f}  "
            f"(TP={self.true_positives}, FP={self.false_positives}, FN={self.false_negatives})"
        )


@dataclass
class TitleMetrics:
    rouge1:           float
    rouge2:           float
    rougeL:           float
    bleu:             float
    avg_title_length: float

    def to_dict(self): return asdict(self)
    def __str__(self):
        return (
            f"Chapter Titles:  "
            f"ROUGE-1={self.rouge1:.3f}  ROUGE-2={self.rouge2:.3f}  "
            f"ROUGE-L={self.rougeL:.3f}  BLEU={self.bleu:.3f}"
        )


@dataclass
class MetadataMetrics:
    title_rouge1:        float   # ROUGE-1 between predicted and GT title
    author_exact:        float   # 1.0 if exact match, 0.5 if partial, 0.0 if missing
    author_partial:      float   # token overlap
    organization_rouge1: float
    domain_match:        float   # 1.0 exact, 0.5 partial
    overall:             float   # mean of all above

    def to_dict(self): return asdict(self)
    def __str__(self):
        return (
            f"Metadata:  "
            f"title_R1={self.title_rouge1:.3f}  "
            f"author={self.author_exact:.3f}  "
            f"org_R1={self.organization_rouge1:.3f}  "
            f"domain={self.domain_match:.3f}  "
            f"overall={self.overall:.3f}"
        )


@dataclass
class KeywordMetrics:
    precision: float
    recall:    float
    f1:        float
    num_predicted:   int
    num_groundtruth: int

    def to_dict(self): return asdict(self)
    def __str__(self):
        return (
            f"Keywords:  "
            f"P={self.precision:.3f}  R={self.recall:.3f}  F1={self.f1:.3f}  "
            f"(pred={self.num_predicted}, gt={self.num_groundtruth})"
        )


@dataclass
class ASRMetrics:
    wer:              float   # Word Error Rate (lower is better)
    cer:              float   # Character Error Rate
    num_words_ref:    int
    num_words_hyp:    int

    def to_dict(self): return asdict(self)
    def __str__(self):
        return (
            f"ASR:  WER={self.wer:.3f}  CER={self.cer:.3f}  "
            f"(ref={self.num_words_ref} words, hyp={self.num_words_hyp} words)"
        )


@dataclass
class VideoResult:
    video_id:        str
    condition:       str
    num_predicted:   int
    num_groundtruth: int
    boundary:        Optional[BoundaryMetrics]   = None
    chapter_titles:  Optional[TitleMetrics]      = None
    metadata:        Optional[MetadataMetrics]   = None
    keywords:        Optional[KeywordMetrics]    = None
    asr:             Optional[ASRMetrics]        = None

    def to_dict(self):
        return {
            "video_id":       self.video_id,
            "condition":      self.condition,
            "num_predicted":  self.num_predicted,
            "num_groundtruth":self.num_groundtruth,
            "boundary":       self.boundary.to_dict()      if self.boundary       else None,
            "chapter_titles": self.chapter_titles.to_dict()if self.chapter_titles else None,
            "metadata":       self.metadata.to_dict()      if self.metadata       else None,
            "keywords":       self.keywords.to_dict()      if self.keywords       else None,
            "asr":            self.asr.to_dict()           if self.asr            else None,
        }

    def __str__(self):
        lines = [f"\n  Video: {self.video_id}  [{self.condition}]",
                 f"  Chapters predicted={self.num_predicted}, gt={self.num_groundtruth}"]
        for attr in ("boundary", "chapter_titles", "metadata", "keywords", "asr"):
            val = getattr(self, attr)
            if val:
                lines.append(f"  {val}")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def hms_to_seconds(hms: str) -> float:
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


def ms_to_hms(ms: int) -> str:
    s = ms // 1000
    return f"{s//3600:02d}:{(s%3600)//60:02d}:{s%60:02d}"


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())


def token_f1(pred: str, ref: str) -> float:
    """Token-level F1 between two strings."""
    pred_tokens = set(normalize_text(pred).split())
    ref_tokens  = set(normalize_text(ref).split())
    if not pred_tokens or not ref_tokens:
        return 0.0
    common    = pred_tokens & ref_tokens
    precision = len(common) / len(pred_tokens)
    recall    = len(common) / len(ref_tokens)
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def install_if_missing(package: str, import_name: Optional[str] = None) -> None:
    import importlib
    name = import_name or package
    try:
        importlib.import_module(name)
    except ImportError:
        log.error(f"Package '{package}' not installed. Run: pip install {package}")
        sys.exit(1)


def load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_predicted_chapters(path: Path) -> list[dict]:
    data = load_json(path)
    if "chapters" not in data:
        log.error(f"No 'chapters' key in {path}")
        sys.exit(1)
    return data["chapters"]


def load_predicted_metadata(video_id: str, metadata_dir: Path) -> dict:
    path = metadata_dir / f"{video_id}_metadata.json"
    if not path.exists():
        return {}
    data = load_json(path)
    return data.get("video_metadata", {})


def load_predicted_transcript(video_id: str, transcripts_dir: Path) -> str:
    path = transcripts_dir / f"{video_id}_transcripts.json"
    if not path.exists():
        return ""
    data  = load_json(path)
    segs  = data.get("segments", [])
    return " ".join(s.get("text", "").strip() for s in segs)


def load_groundtruth(path: Path) -> dict:
    data = load_json(path)
    for key in ["video_id", "chapters"]:
        if key not in data:
            log.error(f"Ground truth {path} missing key: '{key}'")
            sys.exit(1)
    return data


# ---------------------------------------------------------------------------
# 1. Chapter boundary evaluation
# ---------------------------------------------------------------------------

def evaluate_boundaries(
    predicted_starts:   list[float],
    groundtruth_starts: list[float],
    tolerance_seconds:  float = 30.0,
) -> BoundaryMetrics:
    pred = sorted([t for t in predicted_starts   if t > 5.0])
    gt   = sorted([t for t in groundtruth_starts if t > 5.0])

    matched_pred = set()
    matched_gt   = set()

    for j, g in enumerate(gt):
        best_idx, best_dist = None, float("inf")
        for i, p in enumerate(pred):
            if i in matched_pred:
                continue
            dist = abs(p - g)
            if dist <= tolerance_seconds and dist < best_dist:
                best_dist, best_idx = dist, i
        if best_idx is not None:
            matched_pred.add(best_idx)
            matched_gt.add(j)

    tp = len(matched_gt)
    fp = len(pred) - tp
    fn = len(gt)   - tp

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) > 0 else 0.0)

    return BoundaryMetrics(
        precision=round(precision,4), recall=round(recall,4), f1=round(f1,4),
        tolerance_seconds=tolerance_seconds,
        true_positives=tp, false_positives=fp, false_negatives=fn,
    )


# ---------------------------------------------------------------------------
# 2. Chapter title evaluation
# ---------------------------------------------------------------------------

def evaluate_titles(
    predicted_titles:   list[str],
    groundtruth_titles: list[str],
) -> TitleMetrics:
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

    scorer   = rs_module.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
    smoothie = SmoothingFunction().method1

    n = min(len(predicted_titles), len(groundtruth_titles))
    if n == 0:
        return TitleMetrics(0.0, 0.0, 0.0, 0.0, 0.0)

    r1, r2, rL, bleu = [], [], [], []
    for pred, gt in zip(predicted_titles[:n], groundtruth_titles[:n]):
        scores = scorer.score(gt, pred)
        r1.append(scores["rouge1"].fmeasure)
        r2.append(scores["rouge2"].fmeasure)
        rL.append(scores["rougeL"].fmeasure)
        bleu.append(sentence_bleu([gt.lower().split()], pred.lower().split(),
                                  smoothing_function=smoothie))

    avg     = lambda lst: round(sum(lst)/len(lst), 4) if lst else 0.0
    avg_len = round(sum(len(t.split()) for t in predicted_titles) /
                    max(len(predicted_titles), 1), 2)

    return TitleMetrics(
        rouge1=avg(r1), rouge2=avg(r2), rougeL=avg(rL),
        bleu=avg(bleu), avg_title_length=avg_len,
    )


# ---------------------------------------------------------------------------
# 3. Metadata evaluation
# ---------------------------------------------------------------------------

def evaluate_metadata(predicted: dict, groundtruth: dict) -> MetadataMetrics:
    install_if_missing("rouge_score", "rouge_score")
    from rouge_score import rouge_scorer as rs_module
    scorer = rs_module.RougeScorer(["rouge1"], use_stemmer=True)

    def rouge1(pred: str, ref: str) -> float:
        if not pred or not ref:
            return 0.0
        return scorer.score(ref, pred)["rouge1"].fmeasure

    def domain_score(pred, ref) -> float:
        if not pred or not ref:
            return 0.0
        pred_str = pred if isinstance(pred, str) else " ".join(pred)
        ref_str  = ref  if isinstance(ref,  str) else " ".join(ref)
        return token_f1(pred_str, ref_str)

    def author_score(pred: str, ref: str) -> tuple[float, float]:
        """Returns (exact_or_partial, token_f1)."""
        if not pred or not ref:
            return 0.0, 0.0
        pred_n = normalize_text(pred)
        ref_n  = normalize_text(ref)
        if pred_n == ref_n:
            return 1.0, 1.0
        tf1 = token_f1(pred, ref)
        partial = 0.5 if tf1 > 0.5 else 0.0
        return partial, tf1

    pred_title = predicted.get("title", "")
    pred_auth  = predicted.get("author", "")
    pred_org   = predicted.get("organization", "")
    pred_dom   = predicted.get("domain", "")

    gt_title = groundtruth.get("title", "")
    gt_auth  = groundtruth.get("author", "")
    gt_org   = groundtruth.get("organization", "")
    gt_dom   = groundtruth.get("domain", "")

    title_r1         = rouge1(pred_title, gt_title)
    auth_exact, auth_partial = author_score(pred_auth, gt_auth)
    org_r1           = rouge1(pred_org, gt_org)
    dom_match        = domain_score(pred_dom, gt_dom)
    overall          = round((title_r1 + auth_exact + org_r1 + dom_match) / 4, 4)

    return MetadataMetrics(
        title_rouge1        = round(title_r1,    4),
        author_exact        = round(auth_exact,  4),
        author_partial      = round(auth_partial,4),
        organization_rouge1 = round(org_r1,      4),
        domain_match        = round(dom_match,   4),
        overall             = overall,
    )


# ---------------------------------------------------------------------------
# 4. Keyword evaluation
# ---------------------------------------------------------------------------

def evaluate_keywords(
    predicted_keywords:   list[str],
    groundtruth_keywords: list[str],
) -> KeywordMetrics:
    pred_set = {normalize_text(k) for k in predicted_keywords   if k}
    gt_set   = {normalize_text(k) for k in groundtruth_keywords if k}

    if not pred_set or not gt_set:
        return KeywordMetrics(0.0, 0.0, 0.0, len(pred_set), len(gt_set))

    # Token-level matching: a predicted keyword matches if any GT keyword
    # shares >50% token overlap with it
    matched_pred = set()
    matched_gt   = set()
    for p in pred_set:
        for g in gt_set:
            if token_f1(p, g) >= 0.5:
                matched_pred.add(p)
                matched_gt.add(g)

    tp = len(matched_gt)
    fp = len(pred_set) - len(matched_pred)
    fn = len(gt_set)   - tp

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) > 0 else 0.0)

    return KeywordMetrics(
        precision=round(precision,4), recall=round(recall,4), f1=round(f1,4),
        num_predicted=len(pred_set), num_groundtruth=len(gt_set),
    )


# ---------------------------------------------------------------------------
# 5. ASR / transcript evaluation (WER + CER)
# ---------------------------------------------------------------------------

def vtt_to_text(vtt: str) -> str:
    """Extract plain text from WebVTT string."""
    lines  = vtt.splitlines()
    text   = []
    skip   = True
    for line in lines:
        line = line.strip()
        if line.startswith("WEBVTT"):
            continue
        if re.match(r"^\d{2}:\d{2}", line):   # timestamp line
            skip = False
            continue
        if not line:
            skip = True
            continue
        if not skip:
            # Strip VTT tags like <c>, </c>
            clean = re.sub(r"<[^>]+>", "", line).strip()
            if clean:
                text.append(clean)
    return " ".join(text)


def edit_distance(a: list, b: list) -> int:
    """Levenshtein distance between two lists."""
    m, n = len(a), len(b)
    dp   = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[:]
        dp[0] = i
        for j in range(1, n + 1):
            if a[i-1] == b[j-1]:
                dp[j] = prev[j-1]
            else:
                dp[j] = 1 + min(prev[j], dp[j-1], prev[j-1])
    return dp[n]


def evaluate_asr(predicted_text: str, groundtruth_vtt: str) -> ASRMetrics:
    if not predicted_text or not groundtruth_vtt:
        return ASRMetrics(wer=1.0, cer=1.0, num_words_ref=0, num_words_hyp=0)

    ref_text = vtt_to_text(groundtruth_vtt)
    ref_text = normalize_text(ref_text)
    hyp_text = normalize_text(predicted_text)

    ref_words = ref_text.split()
    hyp_words = hyp_text.split()
    ref_chars = list(ref_text.replace(" ", ""))
    hyp_chars = list(hyp_text.replace(" ", ""))

    if not ref_words:
        return ASRMetrics(wer=1.0, cer=1.0, num_words_ref=0, num_words_hyp=len(hyp_words))

    wer = round(edit_distance(hyp_words, ref_words) / len(ref_words), 4)
    cer = round(edit_distance(hyp_chars, ref_chars) / max(len(ref_chars), 1), 4)

    return ASRMetrics(
        wer=wer, cer=cer,
        num_words_ref=len(ref_words),
        num_words_hyp=len(hyp_words),
    )


# ---------------------------------------------------------------------------
# Single video evaluation
# ---------------------------------------------------------------------------

def evaluate_video(
    video_id:        str,
    chapters_path:   Path,
    groundtruth:     dict,
    metadata_dir:    Path,
    transcripts_dir: Path,
    tolerance:       float = 30.0,
    condition:       str   = "full_system",
) -> VideoResult:

    predicted_chapters = load_predicted_chapters(chapters_path)
    predicted_metadata = load_predicted_metadata(video_id, metadata_dir)
    predicted_transcript = load_predicted_transcript(video_id, transcripts_dir)

    gt_chapters  = groundtruth.get("chapters", [])
    pred_starts  = [c.get("start_time", 0) for c in predicted_chapters]
    gt_starts    = [hms_to_seconds(c["start"]) for c in gt_chapters]
    pred_titles  = [c.get("title", "") for c in predicted_chapters]
    gt_titles    = [c.get("title", "") for c in gt_chapters]

    # 1. Boundary
    boundary = evaluate_boundaries(pred_starts, gt_starts, tolerance)

    # 2. Chapter titles (only if GT has real titles, not just "Chapter N")
    chapter_titles = None
    if gt_titles and not all(t.startswith("Chapter ") for t in gt_titles):
        chapter_titles = evaluate_titles(pred_titles, gt_titles)

    # 3. Metadata
    metadata = evaluate_metadata(predicted_metadata, groundtruth)

    # 4. Keywords
    pred_kw = predicted_metadata.get("keywords", [])
    gt_kw   = groundtruth.get("keywords", [])
    keywords = evaluate_keywords(pred_kw, gt_kw) if gt_kw else None

    # 5. ASR
    gt_vtt = groundtruth.get("transcript_vtt", "")
    asr    = evaluate_asr(predicted_transcript, gt_vtt) if gt_vtt else None

    result = VideoResult(
        video_id        = video_id,
        condition       = condition,
        num_predicted   = len(predicted_chapters),
        num_groundtruth = len(gt_chapters),
        boundary        = boundary,
        chapter_titles  = chapter_titles,
        metadata        = metadata,
        keywords        = keywords,
        asr             = asr,
    )

    log.info(str(result))
    return result


# ---------------------------------------------------------------------------
# Dataset evaluation
# ---------------------------------------------------------------------------

def evaluate_dataset(
    dataset_dir:     str,
    metadata_dir:    str,
    transcripts_dir: str,
    tolerance:       float = 30.0,
    condition:       str   = "full_system",
    chapters_dir:    str   = None,
) -> dict:
    gt_folder  = Path(dataset_dir)
    chap_folder = Path(chapters_dir) if chapters_dir else gt_folder
    gt_files   = sorted(gt_folder.glob("*_groundtruth.json"))

    if not gt_files:
        log.error(f"No ground truth files found in '{gt_folder}'")
        sys.exit(1)

    log.info(f"Found {len(gt_files)} ground truth files")
    results = []

    for gt_path in gt_files:
        video_id  = gt_path.name.replace("_groundtruth.json", "")
        chap_path = chap_folder / f"{video_id}_chapters.json"

        if not chap_path.exists():
            log.warning(f"No chapters found for '{video_id}' — skipping")
            continue

        gt = load_groundtruth(gt_path)
        result = evaluate_video(
            video_id        = video_id,
            chapters_path   = chap_path,
            groundtruth     = gt,
            metadata_dir    = Path(metadata_dir),
            transcripts_dir = Path(transcripts_dir),
            tolerance       = tolerance,
            condition       = condition,
        )
        results.append(result)

    if not results:
        log.error("No videos evaluated. Check paths.")
        sys.exit(1)

    return aggregate_results(results, condition)


# ---------------------------------------------------------------------------
# Aggregate
# ---------------------------------------------------------------------------

def aggregate_results(results: list[VideoResult], condition: str) -> dict:
    import statistics

    def mean(lst): return round(sum(lst)/len(lst), 4) if lst else 0.0
    def std(lst):  return round(statistics.stdev(lst), 4) if len(lst) > 1 else 0.0

    f1s   = [r.boundary.f1        for r in results if r.boundary]
    precs = [r.boundary.precision  for r in results if r.boundary]
    recs  = [r.boundary.recall     for r in results if r.boundary]

    r1s   = [r.chapter_titles.rouge1 for r in results if r.chapter_titles]
    blus  = [r.chapter_titles.bleu   for r in results if r.chapter_titles]

    m_overall = [r.metadata.overall        for r in results if r.metadata]
    m_title   = [r.metadata.title_rouge1   for r in results if r.metadata]
    m_author  = [r.metadata.author_exact   for r in results if r.metadata]
    m_org     = [r.metadata.organization_rouge1 for r in results if r.metadata]
    m_domain  = [r.metadata.domain_match   for r in results if r.metadata]

    kw_f1s = [r.keywords.f1        for r in results if r.keywords]
    kw_p   = [r.keywords.precision  for r in results if r.keywords]
    kw_r   = [r.keywords.recall     for r in results if r.keywords]

    wers = [r.asr.wer for r in results if r.asr]
    cers = [r.asr.cer for r in results if r.asr]

    aggregate = {
        "condition":   condition,
        "num_videos":  len(results),
        "boundary": {
            "mean_f1":        mean(f1s),
            "mean_precision": mean(precs),
            "mean_recall":    mean(recs),
            "std_f1":         std(f1s),
        },
        "chapter_titles": {
            "mean_rouge1": mean(r1s),
            "mean_bleu":   mean(blus),
        },
        "metadata": {
            "mean_overall":       mean(m_overall),
            "mean_title_rouge1":  mean(m_title),
            "mean_author_exact":  mean(m_author),
            "mean_org_rouge1":    mean(m_org),
            "mean_domain_match":  mean(m_domain),
        },
        "keywords": {
            "mean_f1":        mean(kw_f1s),
            "mean_precision": mean(kw_p),
            "mean_recall":    mean(kw_r),
        },
        "asr": {
            "mean_wer": mean(wers),
            "mean_cer": mean(cers),
        },
        "per_video": [r.to_dict() for r in results],
    }

    # ── Print summary ─────────────────────────────────────────────────────
    print("\n" + "═" * 65)
    print(f"  EVALUATION RESULTS — {condition.upper()}")
    print("═" * 65)
    print(f"  Videos evaluated   : {len(results)}")
    print()
    print(f"  CHAPTER BOUNDARIES")
    print(f"    F1               : {mean(f1s):.3f}  (±{std(f1s):.3f})")
    print(f"    Precision        : {mean(precs):.3f}")
    print(f"    Recall           : {mean(recs):.3f}")
    if r1s:
        print()
        print(f"  CHAPTER TITLES")
        print(f"    ROUGE-1          : {mean(r1s):.3f}")
        print(f"    BLEU             : {mean(blus):.3f}")
    if m_overall:
        print()
        print(f"  METADATA")
        print(f"    Overall          : {mean(m_overall):.3f}")
        print(f"    Title ROUGE-1    : {mean(m_title):.3f}")
        print(f"    Author match     : {mean(m_author):.3f}")
        print(f"    Org ROUGE-1      : {mean(m_org):.3f}")
        print(f"    Domain match     : {mean(m_domain):.3f}")
    if kw_f1s:
        print()
        print(f"  KEYWORDS")
        print(f"    F1               : {mean(kw_f1s):.3f}")
        print(f"    Precision        : {mean(kw_p):.3f}")
        print(f"    Recall           : {mean(kw_r):.3f}")
    if wers:
        print()
        print(f"  ASR TRANSCRIPT")
        print(f"    WER              : {mean(wers):.3f}  (lower is better)")
        print(f"    CER              : {mean(cers):.3f}")
    print("═" * 65 + "\n")

    return aggregate


# ---------------------------------------------------------------------------
# Ablation study
# ---------------------------------------------------------------------------

def run_ablation(
    dataset_dir:     str,
    metadata_dir:    str,
    transcripts_dir: str,
    chapters_dir:    str,
    tolerance:       float = 30.0,
) -> dict:
    gt_folder  = Path(dataset_dir)
    gt_files   = sorted(gt_folder.glob("*_groundtruth.json"))
    all_results = {}

    # Baseline: equal-length segments
    log.info("Evaluating BASELINE …")
    baseline = []
    for gt_path in gt_files:
        gt      = load_groundtruth(gt_path)
        vid     = gt["video_id"]
        gt_starts = [hms_to_seconds(c["start"]) for c in gt["chapters"]]
        n_gt    = len(gt["chapters"])
        dur     = max(gt_starts) + 600.0
        step    = dur / n_gt
        fake    = [{"start_time": i*step, "title": f"Section {i+1}"} for i in range(n_gt)]

        # Write temp file
        tmp = gt_folder / f"_tmp_{vid}_chapters.json"
        tmp.write_text(json.dumps({"chapters": fake}))
        result = evaluate_video(vid, tmp, gt, Path(metadata_dir),
                                Path(transcripts_dir), tolerance, "baseline")
        tmp.unlink()
        baseline.append(result)
    all_results["baseline"] = aggregate_results(baseline, "baseline")

    # Full system
    for cond, suffix in [
        ("transcript_only", "_chapters_transcript_only.json"),
        ("full_system",     "_chapters.json"),
    ]:
        log.info(f"Evaluating {cond.upper()} …")
        results = []
        chap_folder = Path(chapters_dir)
        for gt_path in gt_files:
            gt  = load_groundtruth(gt_path)
            vid = gt["video_id"]
            cp  = chap_folder / f"{vid}{suffix}"
            if not cp.exists():
                log.warning(f"  Missing {cp.name} — skipping")
                continue
            results.append(evaluate_video(vid, cp, gt, Path(metadata_dir),
                                          Path(transcripts_dir), tolerance, cond))
        if results:
            all_results[cond] = aggregate_results(results, cond)

    # Comparison table
    print("\n" + "═" * 75)
    print(f"  {'ABLATION STUDY':^71}")
    print("═" * 75)
    print(f"  {'Condition':<25} {'Bound.F1':>9} {'Meta':>7} {'KW.F1':>7} {'WER':>7} {'R1':>7}")
    print("  " + "─" * 69)
    for cond, res in all_results.items():
        b  = res["boundary"]
        m  = res["metadata"]
        kw = res["keywords"]
        a  = res["asr"]
        print(
            f"  {cond:<25} "
            f"{b['mean_f1']:>9.3f} "
            f"{m['mean_overall']:>7.3f} "
            f"{kw['mean_f1']:>7.3f} "
            f"{a['mean_wer']:>7.3f} "
            f"{res['chapter_titles'].get('mean_rouge1', 0):>7.3f}"
        )
    print("═" * 75 + "\n")
    return all_results


# ---------------------------------------------------------------------------
# Build ground truth from TIB open data
# ---------------------------------------------------------------------------

def build_groundtruth(
    jsonl_file:  str,
    video_ids:   list[str],
    output_dir:  str,
) -> None:
    """
    Parse TIB open data JSONL and extract ground truth for your videos.
    Extracts: scenes (chapter boundaries), title, author, keywords, VTT transcript.
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Map video_id → numeric TIB id
    id_map = {}
    for vid in video_ids:
        # Extract numeric part: tib_av_00000_720p → 0, tib_av_16257_720p → 16257
        match = re.search(r"tib_av_0*(\d+)", vid)
        if match:
            id_map[int(match.group(1))] = vid

    found = 0
    log.info(f"Scanning {jsonl_file} for {len(id_map)} videos …")

    with open(jsonl_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except Exception:
                continue

            rid = record.get("id")
            if rid not in id_map:
                continue

            video_id = id_map[rid]
            meta     = record.get("metadata", {})
            analysis = record.get("analysisResults", {})

            # Title
            title = meta.get("title", {}).get("value", "")

            # Author (first creator)
            creators = meta.get("creators", [])
            author   = creators[0].get("name", "") if creators else ""

            # Organization (first publisher)
            publishers = meta.get("publishers", [])
            org        = publishers[0].get("name", "") if publishers else ""

            # Keywords
            keywords = [k.get("value", "") for k in meta.get("keywords", [])
                        if k.get("lang", "en") == "en"]
            if not keywords:
                keywords = [k.get("value", "") for k in meta.get("keywords", [])]

            # Domain from subjects
            subjects = meta.get("subjects", [])
            domain   = subjects[0].get("labels", {}).get("en", "") if subjects else ""

            # Scenes → chapter boundaries
            scenes_ms = sorted(analysis.get("scenes", []))
            duration  = record.get("duration", 0)

            chapters = []
            if not scenes_ms or scenes_ms[0] > 1000:
                chapters.append({"start": "00:00:00", "title": "Introduction"})
            for ms in scenes_ms:
                chapters.append({"start": ms_to_hms(ms), "title": f"Chapter {len(chapters)+1}"})

            # VTT transcript (prefer non-automatic, English)
            vtt = ""
            transcriptions = meta.get("transcriptions", [])
            # Prefer manual English
            for t in transcriptions:
                if not t.get("automatic") and t.get("language") in ("en", "eng"):
                    vtt = t.get("vtt", "")
                    break
            # Fall back to automatic English
            if not vtt:
                for t in transcriptions:
                    if t.get("language") in ("en", "eng"):
                        vtt = t.get("vtt", "")
                        break
            # Fall back to any
            if not vtt and transcriptions:
                vtt = transcriptions[0].get("vtt", "")

            gt = {
                "video_id":       video_id,
                "tib_id":         rid,
                "title":          title,
                "author":         author,
                "organization":   org,
                "domain":         domain,
                "keywords":       keywords,
                "duration_ms":    duration,
                "transcript_vtt": vtt,
                "chapters":       chapters,
            }

            out_path = out_dir / f"{video_id}_groundtruth.json"
            out_path.write_text(json.dumps(gt, indent=2, ensure_ascii=False),
                                encoding="utf-8")
            log.info(f"  ✓ {video_id} — {len(chapters)} scenes, "
                     f"{len(keywords)} keywords, VTT={'yes' if vtt else 'no'}")
            found += 1

    log.info(f"\nDone — {found}/{len(id_map)} ground truth files saved to {out_dir}/")


# ---------------------------------------------------------------------------
# Save results
# ---------------------------------------------------------------------------

def save_results(results: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    log.info(f"Results saved → {path}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Comprehensive evaluation: chapters, metadata, keywords, ASR.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    # Mode
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--build-groundtruth", action="store_true",
                      help="Build ground truth files from TIB open data JSONL.")
    mode.add_argument("--predicted",   help="Single predicted chapters JSON.")
    parser.add_argument("--dataset-dir", help="Folder with groundtruth JSON files.")

    # Build GT options
    parser.add_argument("--jsonl",     help="Path to TIB media.jsonl file.")
    parser.add_argument("--video-ids", nargs="+",
                        help="Video IDs to extract (e.g. tib_av_00000_720p).")
    parser.add_argument("--gt-output", default="/home/umwise2526studentproj/Group3ProjectWork/data/groundtruth",
                        help="Where to save ground truth files.")

    # Evaluation options
    parser.add_argument("--groundtruth",     help="Single ground truth JSON.")
    parser.add_argument("--metadata-dir",
                        default="/home/umwise2526studentproj/Group3ProjectWork/data/processed/metadata/subtask1_segmentation")
    parser.add_argument("--transcripts-dir",
                        default="/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/transcripts")
    parser.add_argument("--chapters-dir",
                        default="/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/chapters")
    parser.add_argument("--tolerance",  type=float, default=30.0)
    parser.add_argument("--condition",  default="full_system",
                        choices=["full_system", "transcript_only", "baseline"])
    parser.add_argument("--ablation",   action="store_true")
    parser.add_argument("--output",     default=None)

    args = parser.parse_args()

    # ── Build ground truth ────────────────────────────────────────────────
    if args.build_groundtruth:
        if not args.jsonl or not args.video_ids:
            log.error("--jsonl and --video-ids are required with --build-groundtruth")
            sys.exit(1)
        build_groundtruth(args.jsonl, args.video_ids, args.gt_output)

    # ── Single video ──────────────────────────────────────────────────────
    elif args.predicted:
        if not args.groundtruth:
            log.error("--groundtruth is required with --predicted")
            sys.exit(1)
        vid = Path(args.predicted).stem.replace("_chapters", "")
        gt  = load_groundtruth(Path(args.groundtruth))
        result = evaluate_video(
            video_id        = vid,
            chapters_path   = Path(args.predicted),
            groundtruth     = gt,
            metadata_dir    = Path(args.metadata_dir),
            transcripts_dir = Path(args.transcripts_dir),
            tolerance       = args.tolerance,
            condition       = args.condition,
        )
        agg = aggregate_results([result], args.condition)
        if args.output:
            save_results(agg, Path(args.output))

    # ── Dataset / ablation ────────────────────────────────────────────────
    elif args.dataset_dir:
        if args.ablation:
            results = run_ablation(
                dataset_dir     = args.dataset_dir,
                metadata_dir    = args.metadata_dir,
                transcripts_dir = args.transcripts_dir,
                chapters_dir    = args.chapters_dir,
                tolerance       = args.tolerance,
            )
        else:
            results = evaluate_dataset(
                dataset_dir     = args.dataset_dir,
                metadata_dir    = args.metadata_dir,
                transcripts_dir = args.transcripts_dir,
                chapters_dir    = args.chapters_dir,
                tolerance       = args.tolerance,
                condition       = args.condition,
            )
        out = Path(args.output) if args.output else \
              Path(args.dataset_dir) / "evaluation_results.json"
        save_results(results, out)