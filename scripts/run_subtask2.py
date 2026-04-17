"""
scripts/run_subtask2.py

Full Subtask 2 pipeline runner.
Run this after subtask 1 has produced chapter JSON files.

Usage:
    python scripts/run_subtask2.py                # process all videos
    python scripts/run_subtask2.py --limit 1      # process only 1 video (for quick testing)
    python scripts/run_subtask2.py --step chapters # run only one step
"""

import sys
import argparse
import logging
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend" / "app"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

STEPS = ["chapters", "videos", "embeddings", "collection"]


# def run_step_chapters(limit):
    # from subtask2_summarization.chapter_level.summarize_chapters import run_all
    # logger.info("\n" + "="*60)
    # logger.info("STEP 1: Chapter-Level Summarization")
    # logger.info("="*60)
    # results = run_all(limit=limit)
    # logger.info(f"Chapter summaries generated for {len(results)} videos")

def run_step_chapters(limit):
    from subtask2_summarization.chapter_level.summarize_chapters import run_all
    logger.info("\n" + "="*60)
    logger.info("STEP 1: Chapter-Level Summarization")
    logger.info("="*60)
    
    # Make sure limit is passed correctly
    if limit and limit > 0:
        logger.info(f"Processing with limit: {limit} videos")
    else:
        logger.info("Processing ALL videos")
    
    results = run_all(limit=limit)
    logger.info(f"Chapter summaries generated for {len(results)} videos")

def run_step_videos(limit):
    from subtask2_summarization.video_level.summarize_video import run_all
    logger.info("\n" + "="*60)
    logger.info("STEP 2: Video-Level Summarization")
    logger.info("="*60)
    results = run_all(limit=limit)
    logger.info(f"Video summaries generated for {len(results)} videos")


def run_step_embeddings():
    from subtask2_summarization.embeddings.build_embeddings import run_all
    logger.info("\n" + "="*60)
    logger.info("STEP 3: Building Semantic Embeddings")
    logger.info("="*60)
    run_all()


def run_step_collection():
    from subtask2_summarization.collection_level.analyze_collection import run_collection_analysis
    logger.info("\n" + "="*60)
    logger.info("STEP 4: Collection-Level Analysis")
    logger.info("="*60)
    result = run_collection_analysis()
    logger.info(f"Collection analysis complete. Common concepts: {len(result.get('common_concepts', {}))}")


def main():
    parser = argparse.ArgumentParser(description="Run Subtask 2: Video Summarization Pipeline")
    parser.add_argument("--step", choices=STEPS + ["all"], default="all",
                        help="Which step to run (default: all)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Limit number of videos (useful for testing)")
    args = parser.parse_args()

    logger.info("="*60)
    logger.info("SUBTASK 2: Multi-Level Video Summarization Pipeline")
    logger.info("="*60)
    if args.limit:
        logger.info(f"Running with limit: {args.limit} video(s)")

    step = args.step

    if step in ("all", "chapters"):
        run_step_chapters(args.limit)

    if step in ("all", "videos"):
        run_step_videos(args.limit)

    if step in ("all", "embeddings"):
        run_step_embeddings()

    if step in ("all", "collection"):
        run_step_collection()

    logger.info("\n" + "="*60)
    logger.info("Pipeline complete!")
    logger.info("="*60)
    logger.info("Output files:")
    logger.info("  data/processed/subtask2_summarization/chapter_summaries/")
    logger.info("  data/processed/subtask2_summarization/video_summaries/")
    logger.info("  data/processed/subtask2_summarization/embeddings/")
    logger.info("  data/processed/subtask2_summarization/collection_analysis/")


if __name__ == "__main__":
    main()