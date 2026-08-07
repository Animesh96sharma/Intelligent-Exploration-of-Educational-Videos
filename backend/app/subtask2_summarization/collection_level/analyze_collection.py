"""
backend/app/subtask2_summarization/collection_level/analyze_collection.py

Collection-level analysis:
  - Common concept detection
  - Unique concept per video
  - Similarity-based relationship mapping
  - Prerequisite / difficulty ordering via LLM
  - Collection overview summary
  - Pairwise comparison for related videos
"""
import json
import re
import logging
import numpy as np
from pathlib import Path
from typing import Optional

from backend.app.config import (
    VIDEO_SUM_DIR, EMBED_DIR, COLLECTION_DIR,
    SIMILARITY_THRESHOLD, COMMON_CONCEPT_MIN, MAX_PAIRWISE_COMPARE
)
from backend.app.common.utils.llm_client import call_llm, parse_json_response

logger = logging.getLogger(__name__)

# ── Prompts ───────────────────────────────────────────────────────────────────

COLLECTION_OVERVIEW_PROMPT = """You are an expert educational content curator.

You have a collection of {num_videos} educational lecture videos:

{video_overviews}

Common concepts shared across multiple videos: {common_concepts}

Return ONLY JSON with no markdown:
{{
  "collection_summary": "3-4 sentence overview of what this collection covers",
  "main_themes": ["3-5 overarching themes across the collection"],
  "suggested_viewing_order": [
    {{"video_id": "...", "reason": "..."}}
  ],
  "difficulty_progression": "How difficulty progresses across the collection",
  "knowledge_gaps": ["Topics mentioned but not deeply covered"],
  "target_audience": "Who benefits most from this collection"
}}"""

COMPARISON_PROMPT = """Compare these two educational lecture videos:

VIDEO A: {title_a}
Summary: {summary_a}
Key Concepts: {concepts_a}

VIDEO B: {title_b}
Summary: {summary_b}
Key Concepts: {concepts_b}

Return ONLY JSON:
{{
  "shared_topics": ["topics covered in both videos"],
  "unique_to_a": ["important topics only in video A"],
  "unique_to_b": ["important topics only in video B"],
  "perspective_differences": "How the two videos approach overlapping topics differently",
  "complementarity": "How watching both videos together is more valuable than either alone",
  "recommendation": "Which to watch first and why"
}}"""

PREREQUISITE_PROMPT = """You are an educational curriculum expert.

Given these lecture videos, determine the recommended viewing order and prerequisite relationships.

Videos:
{video_list}

Return ONLY JSON:
{{
  "ordered_curriculum": [
    {{"video_id": "...", "position": 1, "reason": "why this order"}}
  ],
  "prerequisite_pairs": [
    {{"prerequisite": "video_id", "requires_first": "video_id", "reason": "..."}}
  ],
  "difficulty_ranking": [
    {{"video_id": "...", "rank": 1, "level": "beginner"}}
  ]
}}
position 1 = watch first. difficulty rank 1 = easiest."""


# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_concepts(raw) -> list[str]:
    """Normalize concept lists — handles string, list, or list-of-comma-strings."""
    if not raw:
        return []
    if isinstance(raw, list):
        concepts = []
        for item in raw:
            if isinstance(item, str) and "," in item:
                concepts.extend([c.strip() for c in item.split(",")])
            else:
                concepts.append(str(item).strip())
        return [c.lower() for c in concepts if c.strip()]
    if isinstance(raw, str):
        return [c.strip().lower() for c in raw.split(",") if c.strip()]
    return []


def cosine_similarity(a: list, b: list) -> float:
    va, vb = np.array(a, dtype=np.float32), np.array(b, dtype=np.float32)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-10))


# ── Step 1: Load video summaries ──────────────────────────────────────────────

def load_all_video_summaries() -> list[dict]:
    files = sorted(VIDEO_SUM_DIR.glob("*_video_summary.json"))
    videos = []
    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            videos.append(json.load(f))
    logger.info(f"Loaded {len(videos)} video summaries")
    return videos


# ── Step 2: Common concepts ───────────────────────────────────────────────────

def find_common_concepts(videos: list[dict]) -> dict:
    concept_to_videos: dict[str, list[str]] = {}
    for video in videos:
        vid_id = video["video_id"]
        for concept in extract_concepts(video.get("key_concepts", [])):
            concept_to_videos.setdefault(concept, [])
            if vid_id not in concept_to_videos[concept]:
                concept_to_videos[concept].append(vid_id)

    common = {
        c: vids for c, vids in concept_to_videos.items()
        if len(vids) >= COMMON_CONCEPT_MIN
    }
    common_sorted = dict(sorted(common.items(), key=lambda x: len(x[1]), reverse=True))
    logger.info(f"Found {len(common_sorted)} common concepts")
    return common_sorted


# ── Step 3: Unique concepts ───────────────────────────────────────────────────

def find_unique_concepts(videos: list[dict], common_concepts: dict) -> dict:
    unique = {}
    for video in videos:
        vid_id = video["video_id"]
        all_c  = extract_concepts(video.get("key_concepts", []))
        unique[vid_id] = {
            "video_title":     video["video_title"],
            "unique_concepts": [c for c in all_c if c not in common_concepts]
        }
    return unique


# ── Step 4: Relationship map from embeddings ──────────────────────────────────

def build_relationship_map(videos: list[dict]) -> list[dict]:
    emb_path = EMBED_DIR / "video_embeddings.json"
    if not emb_path.exists():
        logger.warning("Video embeddings not found — run build_embeddings.py first.")
        return []

    with open(emb_path) as f:
        embeddings = json.load(f)

    ids = list(embeddings.keys())
    relationships = []

    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            vid_a, vid_b = ids[i], ids[j]
            sim = cosine_similarity(
                embeddings[vid_a]["embedding"],
                embeddings[vid_b]["embedding"]
            )
            if sim >= SIMILARITY_THRESHOLD:
                relationships.append({
                    "video_a":    vid_a,
                    "title_a":    embeddings[vid_a]["video_title"],
                    "video_b":    vid_b,
                    "title_b":    embeddings[vid_b]["video_title"],
                    "similarity": round(sim, 4),
                    "relationship": "related"
                })

    relationships.sort(key=lambda x: x["similarity"], reverse=True)
    logger.info(f"Found {len(relationships)} related pairs (threshold={SIMILARITY_THRESHOLD})")
    return relationships


# ── Step 5: Prerequisite & difficulty ordering ────────────────────────────────

def detect_prerequisites(videos: list[dict]) -> dict:
    video_list = "\n".join(
        f"- {v['video_id']}: {v['video_title']} | Domain: {v.get('domain','?')} | "
        f"Difficulty: {v.get('difficulty_level','?')} | "
        f"Concepts: {', '.join(extract_concepts(v.get('key_concepts',[]))[:5])}"
        for v in videos
    )
    prompt = PREREQUISITE_PROMPT.format(video_list=video_list)
    logger.info("Detecting prerequisites and difficulty ordering...")
    raw = call_llm(prompt)
    if raw is None:
        return {"error": "LLM call failed"}
    parsed = parse_json_response(raw)
    return parsed or {"error": "JSON parse failed"}


# ── Step 6: Collection overview ───────────────────────────────────────────────

def generate_collection_overview(videos: list[dict], common_concepts: dict) -> dict:
    overviews = "\n\n".join(
        f"ID: {v['video_id']} | Title: {v['video_title']}\n"
        f"Domain: {v.get('domain','?')} | Duration: {v.get('duration',0)//60}min\n"
        f"Summary: {v.get('summary_short','N/A')}\n"
        f"Key concepts: {', '.join(extract_concepts(v.get('key_concepts',[]))[:6])}"
        for v in videos
    )
    top_common = list(common_concepts.keys())[:15]
    prompt = COLLECTION_OVERVIEW_PROMPT.format(
        num_videos=len(videos),
        video_overviews=overviews,
        common_concepts=", ".join(top_common) if top_common else "None detected"
    )
    logger.info("Generating collection overview...")
    raw = call_llm(prompt)
    if raw is None:
        return {"error": "LLM call failed"}
    return parse_json_response(raw) or {"error": "JSON parse failed"}


# ── Step 7: Pairwise comparisons ──────────────────────────────────────────────

def compare_two_videos(video_a: dict, video_b: dict) -> dict:
    prompt = COMPARISON_PROMPT.format(
        title_a=video_a["video_title"],
        summary_a=video_a.get("summary_medium", video_a.get("summary_short", "")),
        concepts_a=", ".join(extract_concepts(video_a.get("key_concepts", []))),
        title_b=video_b["video_title"],
        summary_b=video_b.get("summary_medium", video_b.get("summary_short", "")),
        concepts_b=", ".join(extract_concepts(video_b.get("key_concepts", [])))
    )
    raw = call_llm(prompt)
    if raw is None:
        return {"error": "LLM call failed"}
    return parse_json_response(raw) or {"error": "JSON parse failed"}


# ── Main runner ───────────────────────────────────────────────────────────────

def run_collection_analysis() -> dict:
    videos          = load_all_video_summaries()
    common_concepts = find_common_concepts(videos)
    unique_concepts = find_unique_concepts(videos, common_concepts)
    relationships   = build_relationship_map(videos)
    prerequisites   = detect_prerequisites(videos)
    overview        = generate_collection_overview(videos, common_concepts)

    video_map = {v["video_id"]: v for v in videos}
    comparisons = []
    for rel in relationships[:MAX_PAIRWISE_COMPARE]:
        logger.info(f"Comparing: {rel['title_a']} ↔ {rel['title_b']}")
        comp = compare_two_videos(video_map[rel["video_a"]], video_map[rel["video_b"]])
        comparisons.append({
            "video_a":    rel["video_a"],
            "video_b":    rel["video_b"],
            "title_a":    rel["title_a"],
            "title_b":    rel["title_b"],
            "similarity": rel["similarity"],
            "comparison": comp
        })

    result = {
        "total_videos":         len(videos),
        "collection_overview":  overview,
        "common_concepts":      common_concepts,
        "unique_concepts":      unique_concepts,
        "video_relationships":  relationships,
        "prerequisites":        prerequisites,
        "pairwise_comparisons": comparisons
    }

    out_path = COLLECTION_DIR / "collection_analysis.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    logger.info(f"\nCollection analysis saved → {out_path}")
    logger.info(f"  Common concepts:  {len(common_concepts)}")
    logger.info(f"  Related pairs:    {len(relationships)}")
    logger.info(f"  Comparisons done: {len(comparisons)}")
    return result


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    run_collection_analysis()