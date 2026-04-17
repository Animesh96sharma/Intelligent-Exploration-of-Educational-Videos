"""
subtask2_summarization/embeddings/build_embeddings.py

Builds semantic embeddings for chapters and videos using Sentence-BERT.
These embeddings are used for collection-level similarity analysis.
"""

import json
import logging
import numpy as np
from pathlib import Path
from typing import Optional

from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "all-MiniLM-L6-v2"   # fast, good quality; swap for "all-mpnet-base-v2" for higher quality
DATA_ROOT  = Path(__file__).resolve().parents[4] / "data" / "processed"
VIDEO_SUMMARIES_DIR  = DATA_ROOT / "subtask2_summarization" / "video_summaries"
CHAPTER_SUMMARIES_DIR = DATA_ROOT / "subtask2_summarization" / "chapter_summaries"
OUTPUT_DIR = DATA_ROOT / "subtask2_summarization" / "embeddings"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_model() -> SentenceTransformer:
    logger.info(f"Loading embedding model: {MODEL_NAME}")
    return SentenceTransformer(MODEL_NAME)


def embed_texts(model: SentenceTransformer, texts: list[str]) -> np.ndarray:
    """Return a (N, D) float32 numpy array of embeddings."""
    return model.encode(texts, show_progress_bar=True, convert_to_numpy=True)


def build_chapter_embeddings(model: SentenceTransformer) -> dict:
    """
    For every video, embed each chapter's medium summary.
    Output structure:
      {
        "tib_001": {
          "video_title": ...,
          "chapters": [
            {"chapter_id": ..., "title": ..., "embedding": [...]}
          ]
        }
      }
    """
    files = sorted(CHAPTER_SUMMARIES_DIR.glob("*_chapter_summaries.json"))
    all_embeddings = {}

    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        video_id = data["video_id"]
        chapters = data["chapter_summaries"]

        texts = [
            f"{ch['title']}. {ch.get('summary_medium', ch.get('summary_short', ''))}"
            for ch in chapters
        ]

        logger.info(f"Embedding {len(texts)} chapters for video: {video_id}")
        embeddings = embed_texts(model, texts)

        all_embeddings[video_id] = {
            "video_title": data["video_title"],
            "chapters": [
                {
                    "chapter_id":    ch["chapter_id"],
                    "chapter_index": ch["chapter_index"],
                    "title":         ch["title"],
                    "key_concepts":  ch.get("key_concepts", []),
                    "embedding":     embeddings[i].tolist()
                }
                for i, ch in enumerate(chapters)
            ]
        }

    out_path = OUTPUT_DIR / "chapter_embeddings.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_embeddings, f, indent=2)

    logger.info(f"Saved chapter embeddings → {out_path}")
    return all_embeddings


def build_video_embeddings(model: SentenceTransformer) -> dict:
    """
    Embed each video's overall medium summary.
    Output structure:
      {
        "tib_001": {"video_title": ..., "embedding": [...], "domain": ..., "key_concepts": [...]}
      }
    """
    files = sorted(VIDEO_SUMMARIES_DIR.glob("*_video_summary.json"))
    video_records = []
    video_ids = []

    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        video_ids.append(data["video_id"])
        video_records.append(data)

    texts = [
        f"{r['video_title']}. {r.get('summary_medium', r.get('summary_short', ''))}"
        for r in video_records
    ]

    logger.info(f"Embedding {len(texts)} videos")
    embeddings = embed_texts(model, texts)

    all_video_embeddings = {}
    for i, (vid_id, record) in enumerate(zip(video_ids, video_records)):
        all_video_embeddings[vid_id] = {
            "video_title":   record["video_title"],
            "domain":        record.get("domain", "Unknown"),
            "key_concepts":  record.get("key_concepts", []),
            "domain_tags":   record.get("domain_tags", []),
            "embedding":     embeddings[i].tolist()
        }

    out_path = OUTPUT_DIR / "video_embeddings.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_video_embeddings, f, indent=2)

    logger.info(f"Saved video embeddings → {out_path}")
    return all_video_embeddings


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def compute_similarity_matrix(video_embeddings: dict) -> dict:
    """
    Compute pairwise cosine similarity between all videos.
    Returns a matrix dict for use in collection analysis and visualization.
    """
    ids = list(video_embeddings.keys())
    vecs = np.array([video_embeddings[vid]["embedding"] for vid in ids])

    n = len(ids)
    matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            matrix[i][j] = cosine_similarity(vecs[i], vecs[j])

    result = {
        "video_ids": ids,
        "video_titles": [video_embeddings[vid]["video_title"] for vid in ids],
        "similarity_matrix": matrix.tolist()
    }

    out_path = OUTPUT_DIR / "video_similarity_matrix.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    logger.info(f"Saved similarity matrix → {out_path}")
    return result


def run_all():
    model = load_model()
    chapter_embeddings = build_chapter_embeddings(model)
    video_embeddings   = build_video_embeddings(model)
    similarity_matrix  = compute_similarity_matrix(video_embeddings)

    logger.info("\nEmbedding Summary:")
    logger.info(f"  Videos embedded:  {len(video_embeddings)}")
    logger.info(f"  Chapter embeddings built for all videos")
    logger.info(f"  Similarity matrix: {len(similarity_matrix['video_ids'])}x{len(similarity_matrix['video_ids'])}")

    return {
        "chapter_embeddings": chapter_embeddings,
        "video_embeddings":   video_embeddings,
        "similarity_matrix":  similarity_matrix
    }


if __name__ == "__main__":
    run_all()