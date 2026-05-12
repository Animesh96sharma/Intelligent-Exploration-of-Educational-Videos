"""
scripts/run_subtask2.py

Full Subtask 2 pipeline runner.

Usage:
    python -m scripts.run_subtask2                    # run full pipeline
    python -m scripts.run_subtask2 --step chapters    # one step only
    python -m scripts.run_subtask2 --limit 1          # test with 1 video
    python -m scripts.run_subtask2 --step evaluate    # run evaluation

Steps: chapters → videos → embeddings → collection → evaluate
"""
import sys
import argparse
import logging
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

STEPS = ["chapters", "videos", "embeddings", "collection", "evaluate", "all"]


def banner(title: str):
    logger.info("\n" + "="*60)
    logger.info(f"  {title}")
    logger.info("="*60)


def run_chapters(limit):
    from backend.app.subtask2_summarization.chapter_level.summarize_chapters import run_all
    banner("STEP 1 — Chapter-Level Summarization")
    results = run_all(limit=limit)
    logger.info(f"  Chapter summaries done: {len(results)} videos")


def run_videos(limit):
    from backend.app.subtask2_summarization.video_level.summarize_video import run_all
    banner("STEP 2 — Video-Level Summarization")
    results = run_all(limit=limit)
    logger.info(f"  Video summaries done: {len(results)} videos")


def run_embeddings():
    from backend.app.subtask2_summarization.embeddings.build_embeddings import run_all
    banner("STEP 3 — Building Semantic Embeddings")
    result = run_all()
    logger.info(f"  Embeddings done: {len(result['video_embeddings'])} videos")


def run_collection():
    from backend.app.subtask2_summarization.collection_level.analyze_collection import run_collection_analysis
    banner("STEP 4 — Collection-Level Analysis")
    result = run_collection_analysis()
    logger.info(f"  Common concepts:  {len(result.get('common_concepts', {}))}")
    logger.info(f"  Related pairs:    {len(result.get('video_relationships', []))}")


def run_evaluate():
    from backend.app.subtask2_summarization.evaluation.summarization_metrics import evaluate_video_summaries
    banner("STEP 5 — Evaluation Metrics")
    result = evaluate_video_summaries()
    agg = result.get("aggregate", {})
    logger.info(f"  Videos evaluated:     {agg.get('total_videos_evaluated', 0)}")
    logger.info(f"  Avg concept coverage: {agg.get('avg_concept_coverage', 0):.1%}")
    logger.info(f"  Avg coherence score:  {agg.get('avg_coherence_score', 0):.1f}/5")


def main():
    parser = argparse.ArgumentParser(description="Subtask 2 — Multi-Level Video Summarization Pipeline")
    parser.add_argument("--step", choices=STEPS, default="all", help="Which step to run")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of videos (for testing)")
    args = parser.parse_args()

    logger.info("\n" + "="*60)
    logger.info("  SUBTASK 2: Multi-Level Video Summarization")
    logger.info("="*60)
    if args.limit:
        logger.info(f"  Running with limit: {args.limit} video(s)")

    step = args.step

    if step in ("all", "chapters"):
        run_chapters(args.limit)

    if step in ("all", "videos"):
        run_videos(args.limit)

    if step in ("all", "embeddings"):
        run_embeddings()

    if step in ("all", "collection"):
        run_collection()

    if step in ("all", "evaluate"):
        run_evaluate()

    logger.info("\n" + "="*60)
    logger.info("  Pipeline complete!")
    logger.info("="*60)
    logger.info("Output locations:")
    logger.info("  data/processed/subtask2_summarization/chapter_summaries/")
    logger.info("  data/processed/subtask2_summarization/video_summaries/")
    logger.info("  data/processed/subtask2_summarization/embeddings/")
    logger.info("  data/processed/subtask2_summarization/collection_analysis/")
    logger.info("")
    logger.info("Start API server:")
    logger.info("  uvicorn backend.app.main:app --reload --port 8000")
    logger.info("  Then open: http://localhost:8000/docs")


if __name__ == "__main__":
    main()