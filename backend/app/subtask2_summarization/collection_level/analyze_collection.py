"""
subtask2_summarization/collection_level/analyze_collection.py

Collection-level analysis:
  - Detects shared topics across videos
  - Highlights differences / unique content
  - Maps relationships (prerequisites, difficulty progression)
  - Generates a collection overview summary via LLM
"""

import json
import re
import time
import logging
import numpy as np
from pathlib import Path
from typing import Optional

import ollama

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL     = "mistral"
DATA_ROOT = Path(__file__).resolve().parents[4] / "data" / "processed"
SUMMARIES_DIR   = DATA_ROOT / "subtask2_summarization" / "video_summaries"
EMBEDDINGS_DIR  = DATA_ROOT / "subtask2_summarization" / "embeddings"
OUTPUT_DIR      = DATA_ROOT / "subtask2_summarization" / "collection_analysis"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ✅ FIX 1: Lowered from 0.60 → 0.35 so related videos are actually detected
SIMILARITY_THRESHOLD = 0.35


# ── Helpers ───────────────────────────────────────────────────────────────────

def call_llm(prompt: str, retries: int = 3) -> Optional[str]:
    for attempt in range(retries):
        try:
            response = ollama.chat(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            return response["message"]["content"].strip()
        except Exception as e:
            logger.warning(f"LLM attempt {attempt + 1} failed: {e}")
            time.sleep(2 ** attempt)
    return None


def parse_json_response(raw: str) -> Optional[dict]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return None


def cosine_similarity(a: list, b: list) -> float:
    va, vb = np.array(a), np.array(b)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-10))


# ✅ FIX 2: Robust concept extractor handles both list and comma-string formats
def extract_concepts(raw_concepts) -> list[str]:
    """
    LLMs sometimes return concepts as:
      - a proper list: ["machine learning", "bias"]
      - a single comma-separated string: "machine learning, bias, loss function"
      - a list with one giant string: ["machine learning, bias, loss function"]

    This function normalises all three into a clean lowercase list.
    """
    if not raw_concepts:
        return []

    # If it's a list, flatten any comma-joined elements inside it
    if isinstance(raw_concepts, list):
        concepts = []
        for item in raw_concepts:
            if isinstance(item, str) and "," in item:
                # e.g. ["machine learning, bias, loss function"]
                concepts.extend([c.strip() for c in item.split(",")])
            else:
                concepts.append(str(item).strip())
        return [c.lower() for c in concepts if c]

    # If it's already a plain string
    if isinstance(raw_concepts, str):
        return [c.strip().lower() for c in raw_concepts.split(",") if c.strip()]

    return []


# ── Step 1: Load all video summaries ─────────────────────────────────────────

def load_all_video_summaries() -> list[dict]:
    files = sorted(SUMMARIES_DIR.glob("*_video_summary.json"))
    videos = []
    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            videos.append(json.load(f))
    logger.info(f"Loaded {len(videos)} video summaries")
    return videos


# ── Step 2: Find common concepts across videos ────────────────────────────────

def find_common_concepts(videos: list[dict]) -> dict:
    """
    Count concept frequency across all videos.
    Concepts appearing in 2+ videos are 'common'.
    """
    concept_to_videos = {}

    for video in videos:
        vid_id = video["video_id"]
        # ✅ Use robust extractor instead of simple list cast
        concepts = extract_concepts(video.get("key_concepts", []))
        for concept in concepts:
            concept_to_videos.setdefault(concept, [])
            if vid_id not in concept_to_videos[concept]:
                concept_to_videos[concept].append(vid_id)

    common = {
        concept: video_ids
        for concept, video_ids in concept_to_videos.items()
        if len(video_ids) >= 2
    }

    common_sorted = dict(
        sorted(common.items(), key=lambda x: len(x[1]), reverse=True)
    )

    logger.info(f"Found {len(common_sorted)} common concepts across videos")
    return common_sorted


# ── Step 3: Find unique content per video ─────────────────────────────────────

def find_unique_concepts(videos: list[dict], common_concepts: dict) -> dict:
    """Concepts that appear in only one video."""
    unique = {}
    for video in videos:
        vid_id = video["video_id"]
        # ✅ Use robust extractor here too
        all_concepts = extract_concepts(video.get("key_concepts", []))
        unique_for_this = [c for c in all_concepts if c not in common_concepts]
        unique[vid_id] = {
            "video_title":     video["video_title"],
            "unique_concepts": unique_for_this
        }
    return unique


# ── Step 4: Similarity-based relationship mapping ─────────────────────────────

def build_relationship_map(videos: list[dict]) -> list[dict]:
    emb_path = EMBEDDINGS_DIR / "video_embeddings.json"
    if not emb_path.exists():
        logger.warning("Video embeddings not found. Run build_embeddings.py first.")
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
            # ✅ Now uses 0.35 threshold — will catch ML↔Neural Networks (0.446)
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
    logger.info(f"Found {len(relationships)} related video pairs (threshold={SIMILARITY_THRESHOLD})")
    return relationships


# ── Step 5: LLM-powered collection overview ───────────────────────────────────

COLLECTION_OVERVIEW_PROMPT = """You are an expert educational content curator.

You have a collection of {num_videos} educational lecture videos.
Here is a brief overview of each:

{video_overviews}

Common concepts appearing across multiple videos:
{common_concepts}

Generate a comprehensive collection-level analysis. Return ONLY JSON with no markdown:
{{
  "collection_summary": "3-4 sentence overview of what this video collection covers as a whole",
  "main_themes": ["3-5 overarching themes across the collection"],
  "suggested_viewing_order": [
    {{"video_id": "...", "reason": "why to watch this first/next"}}
  ],
  "difficulty_progression": "Description of how difficulty progresses across the collection",
  "knowledge_gaps": ["Topics that are mentioned but not deeply covered in any video"],
  "target_audience": "Who would benefit most from this collection"
}}"""


def generate_collection_overview(videos: list[dict], common_concepts: dict) -> dict:
    overviews = "\n\n".join(
        f"Video ID: {v['video_id']}\n"
        f"Title: {v['video_title']}\n"
        f"Domain: {v.get('domain', 'N/A')}\n"
        f"Summary: {v.get('summary_short', 'N/A')}\n"
        f"Key Concepts: {', '.join(extract_concepts(v.get('key_concepts', [])))}"
        for v in videos
    )

    top_common = list(common_concepts.keys())[:15]

    prompt = COLLECTION_OVERVIEW_PROMPT.format(
        num_videos=len(videos),
        video_overviews=overviews,
        common_concepts=", ".join(top_common) if top_common else "None detected"
    )

    logger.info("Generating collection overview via LLM...")
    raw = call_llm(prompt)
    if raw is None:
        return {"error": "LLM call failed"}
    parsed = parse_json_response(raw)
    return parsed or {"error": "JSON parse failed", "raw": raw}


# ── Step 6: Compare two specific videos ───────────────────────────────────────

COMPARISON_PROMPT = """You are an expert educational content analyst.

Compare these two lecture videos:

VIDEO A: {title_a}
Summary: {summary_a}
Key Concepts: {concepts_a}

VIDEO B: {title_b}
Summary: {summary_b}
Key Concepts: {concepts_b}

Return ONLY JSON:
{{
  "shared_topics": ["topics covered in both videos"],
  "unique_to_a": ["topics only in video A"],
  "unique_to_b": ["topics only in video B"],
  "perspective_differences": "How the two videos approach similar topics differently",
  "complementarity": "How these videos complement each other",
  "recommendation": "Which to watch first and why"
}}"""


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


# ── Main Runner ───────────────────────────────────────────────────────────────

def run_collection_analysis() -> dict:
    videos          = load_all_video_summaries()
    common_concepts = find_common_concepts(videos)
    unique_concepts = find_unique_concepts(videos, common_concepts)
    relationships   = build_relationship_map(videos)
    overview        = generate_collection_overview(videos, common_concepts)

    video_map   = {v["video_id"]: v for v in videos}
    comparisons = []
    for rel in relationships[:5]:
        logger.info(f"Comparing: {rel['title_a']} vs {rel['title_b']}")
        comp = compare_two_videos(
            video_map[rel["video_a"]],
            video_map[rel["video_b"]]
        )
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
        "pairwise_comparisons": comparisons
    }

    out_path = OUTPUT_DIR / "collection_analysis.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    logger.info(f"\nCollection analysis saved → {out_path}")
    return result


if __name__ == "__main__":
    result = run_collection_analysis()
    print(f"\nAnalysis complete:")
    print(f"  Common concepts found: {len(result['common_concepts'])}")
    print(f"  Related video pairs:   {len(result['video_relationships'])}")
    print(f"  Pairwise comparisons:  {len(result['pairwise_comparisons'])}")