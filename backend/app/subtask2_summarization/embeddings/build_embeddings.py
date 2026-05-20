"""
backend/app/subtask2_summarization/embeddings/build_embeddings.py

Builds Sentence-BERT embeddings for chapters and videos.
Computes pairwise cosine similarity matrix across all videos.
"""
import json
import logging
import numpy as np
from pathlib import Path
from typing import Optional

from sentence_transformers import SentenceTransformer
from backend.app.config import CHAPTER_SUM_DIR, VIDEO_SUM_DIR, EMBED_DIR, EMBED_MODEL

logger = logging.getLogger(__name__)

_model: Optional[SentenceTransformer] = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {EMBED_MODEL}")
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def cosine_similarity(a: list, b: list) -> float:
    va, vb = np.array(a, dtype=np.float32), np.array(b, dtype=np.float32)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-10))


def build_chapter_embeddings() -> dict:
    model = get_model()
    files = sorted(CHAPTER_SUM_DIR.glob("*_chapter_summaries.json"))
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
        logger.info(f"Embedding {len(texts)} chapters for {video_id}")
        embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)

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

    out = EMBED_DIR / "chapter_embeddings.json"
    with open(out, "w") as f:
        json.dump(all_embeddings, f, indent=2)
    logger.info(f"Saved chapter embeddings → {out}")
    return all_embeddings


def build_video_embeddings() -> dict:
    model = get_model()
    files = sorted(VIDEO_SUM_DIR.glob("*_video_summary.json"))
    records, ids = [], []

    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        ids.append(data["video_id"])
        records.append(data)

    texts = [
        f"{r['video_title']}. {r.get('summary_medium', r.get('summary_short', ''))}"
        for r in records
    ]
    logger.info(f"Embedding {len(texts)} videos")
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)

    all_video_embeddings = {}
    for i, (vid_id, record) in enumerate(zip(ids, records)):
        all_video_embeddings[vid_id] = {
            "video_title":  record["video_title"],
            "domain":       record.get("domain", "Unknown"),
            "key_concepts": record.get("key_concepts", []),
            "domain_tags":  record.get("domain_tags", []),
            "embedding":    embeddings[i].tolist()
        }

    out = EMBED_DIR / "video_embeddings.json"
    with open(out, "w") as f:
        json.dump(all_video_embeddings, f, indent=2)
    logger.info(f"Saved video embeddings → {out}")
    return all_video_embeddings


def compute_similarity_matrix(video_embeddings: dict) -> dict:
    ids    = list(video_embeddings.keys())
    titles = [video_embeddings[v]["video_title"] for v in ids]
    vecs   = np.array([video_embeddings[v]["embedding"] for v in ids], dtype=np.float32)

    n = len(ids)
    matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            matrix[i][j] = cosine_similarity(vecs[i].tolist(), vecs[j].tolist())

    result = {
        "video_ids":         ids,
        "video_titles":      titles,
        "similarity_matrix": matrix.tolist()
    }

    out = EMBED_DIR / "video_similarity_matrix.json"
    with open(out, "w") as f:
        json.dump(result, f, indent=2)
    logger.info(f"Saved similarity matrix → {out}")
    return result


def run_all() -> dict:
    chapter_embeddings = build_chapter_embeddings()
    video_embeddings   = build_video_embeddings()
    similarity_matrix  = compute_similarity_matrix(video_embeddings)

    logger.info(f"\nEmbeddings complete:")
    logger.info(f"  Videos:   {len(video_embeddings)}")
    logger.info(f"  Matrix:   {len(similarity_matrix['video_ids'])}x{len(similarity_matrix['video_ids'])}")
    return {
        "chapter_embeddings": chapter_embeddings,
        "video_embeddings":   video_embeddings,
        "similarity_matrix":  similarity_matrix
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    run_all()