# """
# backend/app/api/summaries.py

# REST API endpoints for the summarization system.
# All endpoints Student C needs to build the frontend.

# Run with: uvicorn backend.app.main:app --reload
# Base URL:  http://localhost:8000
# """
# import json
# import logging
# from pathlib import Path
# from typing import Optional

# from fastapi import APIRouter, HTTPException, Query
# from pydantic import BaseModel
# # from backend.app.config import COLLECTION_DIR

# from backend.app.config import (
#     CHAPTER_SUM_DIR, VIDEO_SUM_DIR, EMBED_DIR, COLLECTION_DIR, INPUT_DIR
# )

# logger = logging.getLogger(__name__)
# router = APIRouter(prefix="/api", tags=["summaries"])


# # ── Pydantic request models ───────────────────────────────────────────────────

# class CompareRequest(BaseModel):
#     video_id_a: str
#     video_id_b: str


# class SummarizeRequest(BaseModel):
#     video_id: str
#     force_reprocess: bool = False


# # ── Helper ────────────────────────────────────────────────────────────────────

# def _load_json(path: Path) -> dict:
#     if not path.exists():
#         raise HTTPException(status_code=404, detail=f"Data not found: {path.name}")
#     with open(path, "r", encoding="utf-8") as f:
#         return json.load(f)


# def _all_video_ids() -> list[str]:
#     return [p.stem.replace("_video_summary", "") for p in sorted(VIDEO_SUM_DIR.glob("*_video_summary.json"))]


# # ── Video list ────────────────────────────────────────────────────────────────

# @router.get("/videos")
# def list_videos():
#     """
#     List all videos that have been processed.
#     Returns lightweight metadata — no embeddings, no full summaries.
#     """
#     video_ids = _all_video_ids()
#     results = []
#     for vid_id in video_ids:
#         path = VIDEO_SUM_DIR / f"{vid_id}_video_summary.json"
#         try:
#             data = _load_json(path)
#             results.append({
#                 "video_id":       data["video_id"],
#                 "video_title":    data["video_title"],
#                 "speaker":        data.get("speaker", "Unknown"),
#                 "domain":         data.get("domain", "Unknown"),
#                 "duration":       data.get("duration", 0),
#                 "total_chapters": data.get("total_chapters", 0),
#                 "difficulty_level": data.get("difficulty_level", "unknown"),
#                 "domain_tags":    data.get("domain_tags", []),
#             })
#         except Exception as e:
#             logger.warning(f"Could not load {vid_id}: {e}")
#     return {"total": len(results), "videos": results}


# # ── Single video summary ──────────────────────────────────────────────────────

# @router.get("/summaries/{video_id}")
# def get_video_summary(
#     video_id: str,
#     level: Optional[str] = Query(None, description="short | medium | long — returns only that level")
# ):
#     """
#     Get the full video-level summary for a single video.
#     Optional ?level=short|medium|long to get just one summary level.
#     """
#     data = _load_json(VIDEO_SUM_DIR / f"{video_id}_video_summary.json")

#     if level:
#         key = f"summary_{level}"
#         if key not in data:
#             raise HTTPException(status_code=400, detail=f"Invalid level '{level}'. Use: short, medium, long")
#         return {
#             "video_id":    video_id,
#             "video_title": data["video_title"],
#             "level":       level,
#             "summary":     data[key]
#         }

#     return data


# # ── Chapter summaries for a video ────────────────────────────────────────────

# @router.get("/summaries/{video_id}/chapters")
# def get_chapter_summaries(video_id: str):
#     """Get all chapter summaries for a video (used for timeline view)."""
#     data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
#     return data


# @router.get("/summaries/{video_id}/chapters/{chapter_index}")
# def get_single_chapter(video_id: str, chapter_index: int):
#     """Get summary for one specific chapter."""
#     data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
#     chapters = data.get("chapter_summaries", [])
#     for ch in chapters:
#         if ch["chapter_index"] == chapter_index:
#             return ch
#     raise HTTPException(status_code=404, detail=f"Chapter {chapter_index} not found in {video_id}")


# # ── Timeline data (optimized for frontend) ────────────────────────────────────

# @router.get("/summaries/{video_id}/timeline")
# def get_timeline(video_id: str):
#     """
#     Get lightweight timeline data optimized for the frontend timeline view.
#     Returns chapter markers with timestamps and short summaries only.
#     """
#     data = _load_json(VIDEO_SUM_DIR / f"{video_id}_video_summary.json")
#     return {
#         "video_id":        video_id,
#         "video_title":     data["video_title"],
#         "duration":        data.get("duration", 0),
#         "chapter_timeline": data.get("chapter_timeline", [])
#     }


# # ── Collection analysis ───────────────────────────────────────────────────────

# @router.get("/collection/analysis")
# def get_collection_analysis():
#     """Get the full collection-level analysis (common concepts, relationships, overview)."""
#     return _load_json(COLLECTION_DIR / "collection_analysis.json")


# @router.get("/collection/overview")
# def get_collection_overview():
#     """Get just the high-level collection overview (lighter payload)."""
#     data = _load_json(COLLECTION_DIR / "collection_analysis.json")
#     return {
#         "total_videos":        data["total_videos"],
#         "collection_overview": data["collection_overview"],
#         "common_concepts":     data["common_concepts"],
#         "video_relationships": data["video_relationships"],
#         "prerequisites":       data.get("prerequisites", {})
#     }


# @router.get("/collection/similarity-matrix")
# def get_similarity_matrix():
#     """Get pairwise cosine similarity matrix between all videos."""
#     return _load_json(EMBED_DIR / "video_similarity_matrix.json")


# @router.get("/collection/relationships")
# def get_video_relationships():
#     """Get list of related video pairs above similarity threshold."""
#     data = _load_json(COLLECTION_DIR / "collection_analysis.json")
#     return {
#         "threshold":   0.35,
#         "relationships": data.get("video_relationships", [])
#     }


# # ── Pairwise comparison ───────────────────────────────────────────────────────

# @router.post("/collection/compare")
# def compare_videos(req: CompareRequest):
#     """
#     Compare two specific videos.
#     First checks cached pairwise_comparisons, falls back to running LLM comparison.
#     """
#     # Check cache first
#     collection = _load_json(COLLECTION_DIR / "collection_analysis.json")
#     for cached in collection.get("pairwise_comparisons", []):
#         if (
#             (cached["video_a"] == req.video_id_a and cached["video_b"] == req.video_id_b) or
#             (cached["video_a"] == req.video_id_b and cached["video_b"] == req.video_id_a)
#         ):
#             return {"source": "cache", "comparison": cached}

#     # Not cached — run live comparison
#     try:
#         from backend.app.subtask2_summarization.collection_level.analyze_collection import compare_two_videos
#         video_a = _load_json(VIDEO_SUM_DIR / f"{req.video_id_a}_video_summary.json")
#         video_b = _load_json(VIDEO_SUM_DIR / f"{req.video_id_b}_video_summary.json")
#         result  = compare_two_videos(video_a, video_b)
#         return {
#             "source": "live",
#             "video_a": req.video_id_a,
#             "video_b": req.video_id_b,
#             "comparison": result
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ── Search ────────────────────────────────────────────────────────────────────

# @router.get("/search")
# def search_videos(
#     q: str = Query(..., description="Search query"),
#     limit: int = Query(10, description="Max results to return")
# ):
#     """
#     Simple keyword search across video titles, summaries, and key concepts.
#     Returns ranked results with match highlights.
#     """
#     q_lower = q.lower()
#     results = []

#     for vid_id in _all_video_ids():
#         try:
#             data = _load_json(VIDEO_SUM_DIR / f"{vid_id}_video_summary.json")
#         except HTTPException:
#             continue

#         score = 0
#         matches = []

#         # Title match (highest weight)
#         if q_lower in data["video_title"].lower():
#             score += 10
#             matches.append(f"Title: {data['video_title']}")

#         # Key concept match
#         for concept in data.get("key_concepts", []):
#             if q_lower in concept.lower():
#                 score += 5
#                 matches.append(f"Concept: {concept}")

#         # Summary match
#         summary = data.get("summary_medium", "")
#         if q_lower in summary.lower():
#             score += 2
#             # Find context around match
#             idx = summary.lower().find(q_lower)
#             context = summary[max(0, idx-50):idx+100]
#             matches.append(f"Summary: ...{context}...")

#         # Domain tag match
#         for tag in data.get("domain_tags", []):
#             if q_lower in tag.lower():
#                 score += 3
#                 matches.append(f"Domain: {tag}")

#         if score > 0:
#             results.append({
#                 "video_id":    vid_id,
#                 "video_title": data["video_title"],
#                 "domain":      data.get("domain", ""),
#                 "score":       score,
#                 "matches":     matches[:3]
#             })

#     results.sort(key=lambda x: x["score"], reverse=True)
#     return {"query": q, "total": len(results), "results": results[:limit]}


# # ── Search within a video's chapters ─────────────────────────────────────────

# @router.get("/search/{video_id}/chapters")
# def search_chapters(video_id: str, q: str = Query(..., description="Search query")):
#     """Search within a single video's chapters."""
#     q_lower = q.lower()
#     data    = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
#     results = []

#     for ch in data.get("chapter_summaries", []):
#         score = 0
#         if q_lower in ch["title"].lower():
#             score += 10
#         for concept in ch.get("key_concepts", []):
#             if q_lower in concept.lower():
#                 score += 5
#         if q_lower in ch.get("summary_medium", "").lower():
#             score += 2
#         if score > 0:
#             results.append({
#                 "chapter_index": ch["chapter_index"],
#                 "title":         ch["title"],
#                 "start_time":    ch["start_time"],
#                 "score":         score,
#                 "summary_short": ch.get("summary_short", "")
#             })

#     results.sort(key=lambda x: x["score"], reverse=True)
#     return {"video_id": video_id, "query": q, "results": results}


# # ── Evaluation report ─────────────────────────────────────────────────────────

# @router.get("/evaluation/report")
# def get_evaluation_report():
#     """Get the evaluation metrics report (ROUGE, concept coverage, LLM quality scores)."""
#     path = COLLECTION_DIR / "evaluation_report.json"
#     if not path.exists():
#         raise HTTPException(
#             status_code=404,
#             detail="Evaluation report not found. Run summarization_metrics.py first."
#         )
#     return _load_json(path)

# @router.get("/summaries/{video_id}/visual-summary")
# def get_video_visual_summary(video_id: str):
#     data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
#     if "video_visual_summary" not in data:
#         raise HTTPException(
#             status_code=404,
#             detail="Visual integration not yet run for this video. Run visual_textual_integration.py first."
#         )
#     return {
#         "video_id": video_id,
#         "video_visual_summary": data["video_visual_summary"]
#     }


# @router.get("/summaries/{video_id}/chapters/{chapter_index}/visual-integration")
# def get_chapter_visual_integration(video_id: str, chapter_index: int):
#     data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
#     for ch in data.get("chapter_summaries", []):
#         if ch["chapter_index"] == chapter_index:
#             if "visual_integration" not in ch:
#                 raise HTTPException(status_code=404, detail="Visual integration not available for this chapter.")
#             return {
#                 "video_id":      video_id,
#                 "chapter_index": chapter_index,
#                 "title":         ch["title"],
#                 **ch["visual_integration"]
#             }
#     raise HTTPException(status_code=404, detail=f"Chapter {chapter_index} not found")


# HUMAN_EVAL_DIR = COLLECTION_DIR.parent / "human_evaluation"


# @router.get("/evaluation/human/packet")
# def get_human_evaluation_packet():
#     path = HUMAN_EVAL_DIR / "evaluation_packet.json"
#     if not path.exists():
#         raise HTTPException(status_code=404, detail="No evaluation packet generated yet. Run human_evaluation.py first.")
#     return _load_json(path)


# @router.get("/evaluation/human/report")
# def get_human_evaluation_report():
#     path = HUMAN_EVAL_DIR / "human_evaluation_report.json"
#     if not path.exists():
#         raise HTTPException(
#             status_code=404,
#             detail="No human evaluation responses analyzed yet. Collect responses then run: human_evaluation.py analyze"
#         )
#     return _load_json(path)


"""
backend/app/api/summaries.py

REST API endpoints for the summarization system.
All endpoints Student C needs to build the frontend.

Run with: uvicorn backend.app.main:app --reload --port 8001
Base URL:  http://localhost:8001
"""
import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from backend.app.config import (
    CHAPTER_SUM_DIR, VIDEO_SUM_DIR, EMBED_DIR, COLLECTION_DIR, FRAMES_DIR
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["summaries"])

HUMAN_EVAL_DIR = COLLECTION_DIR.parent / "human_evaluation"


# ── Models ────────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    video_id_a: str
    video_id_b: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_json(path: Path) -> dict:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Data not found: {path.name}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _all_video_ids() -> list[str]:
    ids = []
    for path in sorted(VIDEO_SUM_DIR.glob("*_video_summary.json")):
        try:
            with open(path) as f:
                data = json.load(f)
            if "video_id" in data:
                ids.append(data["video_id"])
        except Exception:
            pass
    return ids


# ── Videos list ───────────────────────────────────────────────────────────────

@router.get("/videos")
def list_videos():
    results = []
    for vid_id in _all_video_ids():
        try:
            data = _load_json(VIDEO_SUM_DIR / f"{vid_id}_video_summary.json")
            results.append({
                "video_id":         data["video_id"],
                "video_title":      data["video_title"],
                "speaker":          data.get("speaker", "Unknown"),
                "domain":           data.get("domain", "Unknown"),
                "duration":         data.get("duration", 0),
                "total_chapters":   data.get("total_chapters", 0),
                "difficulty_level": data.get("difficulty_level", "unknown"),
                "domain_tags":      data.get("domain_tags", []),
            })
        except Exception as e:
            logger.warning(f"Could not load {vid_id}: {e}")
    return {"total": len(results), "videos": results}


# ── Video summary ─────────────────────────────────────────────────────────────

@router.get("/summaries/{video_id}")
def get_video_summary(
    video_id: str,
    level: Optional[str] = Query(None, description="short | medium | long")
):
    data = _load_json(VIDEO_SUM_DIR / f"{video_id}_video_summary.json")
    if level:
        key = f"summary_{level}"
        if key not in data:
            raise HTTPException(status_code=400, detail=f"Invalid level '{level}'. Use: short, medium, long")
        return {"video_id": video_id, "video_title": data["video_title"], "level": level, "summary": data[key]}
    return data


# ── Chapter summaries ─────────────────────────────────────────────────────────

@router.get("/summaries/{video_id}/chapters")
def get_chapter_summaries(video_id: str):
    return _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")


@router.get("/summaries/{video_id}/chapters/{chapter_index}")
def get_single_chapter(video_id: str, chapter_index: int):
    data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
    for ch in data.get("chapter_summaries", []):
        if ch["chapter_index"] == chapter_index:
            return ch
    raise HTTPException(status_code=404, detail=f"Chapter {chapter_index} not found")


# ── Timeline ──────────────────────────────────────────────────────────────────

@router.get("/summaries/{video_id}/timeline")
def get_timeline(video_id: str):
    data = _load_json(VIDEO_SUM_DIR / f"{video_id}_video_summary.json")
    return {
        "video_id":         video_id,
        "video_title":      data["video_title"],
        "duration":         data.get("duration", 0),
        "chapter_timeline": data.get("chapter_timeline", [])
    }


# ── Frame images ──────────────────────────────────────────────────────────────

# @router.get("/summaries/{video_id}/chapters/{chapter_index}/frames")
# def get_chapter_frames(video_id: str, chapter_index: int, request: Request):
#     """
#     Returns URLs to the actual .jpg frame images for a chapter.
#     Student C uses these as <img src> for visual content preview.
#     Requires: data/processed/subtask1_segmentation/frames/ populated by Student A.
#     """
#     data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
    
#     for ch in data.get("chapter_summaries", []):
#         if ch["chapter_index"] == chapter_index:
#             frame_paths = ch.get("frame_paths", [])
#             base_url = str(request.base_url).rstrip("/")
            
#             # Build URLs for frames
#             frame_urls = []
#             for fp in frame_paths:
#                 if not fp:
#                     continue
#                 try:
#                     # If it's an absolute path, try to make it relative
#                     fp_path = Path(fp)
#                     if FRAMES_DIR in fp_path.parents or str(FRAMES_DIR) in str(fp_path):
#                         rel = fp_path.relative_to(FRAMES_DIR)
#                         frame_urls.append(f"{base_url}/frames/{rel}")
#                     elif fp.startswith("http"):
#                         # Already a URL
#                         frame_urls.append(fp)
#                     else:
#                         # Try to use as-is or make it relative
#                         frame_urls.append(f"{base_url}/frames/{fp_path.name}")
#                 except Exception as e:
#                     logger.warning(f"Could not process frame path {fp}: {e}")
#                     frame_urls.append(fp)
            
#             return {
#                 "video_id": video_id,
#                 "chapter_index": chapter_index,
#                 "title": ch.get("title", ""),
#                 "frame_urls": frame_urls,
#                 "frame_count": len(frame_urls),
#                 "slide_count": ch.get("slide_count", 0)
#             }
    
#     raise HTTPException(status_code=404, detail=f"Chapter {chapter_index} not found")

# In backend/app/api/summaries.py

@router.get("/summaries/{video_id}/chapters/{chapter_index}/frames")
def get_chapter_frames(video_id: str, chapter_index: int, request: Request):
    """
    Returns URLs to the actual .jpg frame images for a chapter.
    Student C uses these as <img src> for visual content preview.
    Requires: data/processed/subtask1_segmentation/frames/ populated by Student A.
    """
    data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
    
    for ch in data.get("chapter_summaries", []):
        if ch["chapter_index"] == chapter_index:
            frame_paths = ch.get("frame_paths", [])
            base_url = str(request.base_url).rstrip("/")
            
            # Build URLs for frames
            frame_urls = []
            for fp in frame_paths:
                if not fp:
                    continue
                try:
                    # If it's an absolute path, convert to relative
                    fp_path = Path(fp)
                    
                    # Check if it's an absolute path containing FRAMES_DIR
                    if str(FRAMES_DIR) in str(fp_path) or FRAMES_DIR in fp_path.parents:
                        rel = fp_path.relative_to(FRAMES_DIR)
                        frame_urls.append(f"{base_url}/frames/{rel}")
                    elif fp.startswith("http"):
                        # Already a URL
                        frame_urls.append(fp)
                    else:
                        # Already relative, use as-is
                        frame_urls.append(f"{base_url}/frames/{fp}")
                except Exception as e:
                    logger.warning(f"Could not process frame path {fp}: {e}")
                    # Try to extract just the filename
                    try:
                        filename = Path(fp).name
                        frame_urls.append(f"{base_url}/frames/{filename}")
                    except:
                        frame_urls.append(fp)
            
            return {
                "video_id": video_id,
                "chapter_index": chapter_index,
                "title": ch.get("title", ""),
                "frame_urls": frame_urls,
                "frame_count": len(frame_urls),
                "slide_count": ch.get("slide_count", 0)
            }
    
    raise HTTPException(status_code=404, detail=f"Chapter {chapter_index} not found")


# ── Visual integration ────────────────────────────────────────────────────────

@router.get("/summaries/{video_id}/visual-summary")
def get_video_visual_summary(video_id: str):
    data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
    if "video_visual_summary" not in data:
        raise HTTPException(
            status_code=404,
            detail="Visual integration not yet run. Run visual_textual_integration.py first."
        )
    return {"video_id": video_id, "video_visual_summary": data["video_visual_summary"]}


@router.get("/summaries/{video_id}/chapters/{chapter_index}/visual-integration")
def get_chapter_visual_integration(video_id: str, chapter_index: int):
    data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
    for ch in data.get("chapter_summaries", []):
        if ch["chapter_index"] == chapter_index:
            if "visual_integration" not in ch:
                raise HTTPException(status_code=404, detail="Visual integration not available for this chapter.")
            return {
                "video_id":      video_id,
                "chapter_index": chapter_index,
                "title":         ch["title"],
                **ch["visual_integration"]
            }
    raise HTTPException(status_code=404, detail=f"Chapter {chapter_index} not found")


# ── Collection analysis ───────────────────────────────────────────────────────

@router.get("/collection/analysis")
def get_collection_analysis():
    return _load_json(COLLECTION_DIR / "collection_analysis.json")


@router.get("/collection/overview")
def get_collection_overview():
    data = _load_json(COLLECTION_DIR / "collection_analysis.json")
    return {
        "total_videos":        data["total_videos"],
        "collection_overview": data["collection_overview"],
        "common_concepts":     data["common_concepts"],
        "video_relationships": data["video_relationships"],
        "prerequisites":       data.get("prerequisites", {})
    }


@router.get("/collection/similarity-matrix")
def get_similarity_matrix():
    return _load_json(EMBED_DIR / "video_similarity_matrix.json")


@router.get("/collection/relationships")
def get_video_relationships():
    data = _load_json(COLLECTION_DIR / "collection_analysis.json")
    return {"threshold": 0.35, "relationships": data.get("video_relationships", [])}


# ── Pairwise comparison ───────────────────────────────────────────────────────

@router.post("/collection/compare")
def compare_videos(req: CompareRequest):
    collection = _load_json(COLLECTION_DIR / "collection_analysis.json")
    for cached in collection.get("pairwise_comparisons", []):
        if {cached["video_a"], cached["video_b"]} == {req.video_id_a, req.video_id_b}:
            return {"source": "cache", "comparison": cached}
    try:
        from backend.app.subtask2_summarization.collection_level.analyze_collection import compare_two_videos
        video_a = _load_json(VIDEO_SUM_DIR / f"{req.video_id_a}_video_summary.json")
        video_b = _load_json(VIDEO_SUM_DIR / f"{req.video_id_b}_video_summary.json")
        result = compare_two_videos(video_a, video_b)
        return {"source": "live", "video_a": req.video_id_a, "video_b": req.video_id_b, "comparison": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Search ────────────────────────────────────────────────────────────────────

@router.get("/search")
def search_videos(q: str = Query(...), limit: int = Query(10)):
    q_lower = q.lower()
    results = []
    for vid_id in _all_video_ids():
        try:
            data = _load_json(VIDEO_SUM_DIR / f"{vid_id}_video_summary.json")
        except HTTPException:
            continue
        score, matches = 0, []
        if q_lower in data["video_title"].lower():
            score += 10
            matches.append(f"Title: {data['video_title']}")
        for concept in data.get("key_concepts", []):
            if q_lower in concept.lower():
                score += 5
                matches.append(f"Concept: {concept}")
                break
        summary = data.get("summary_medium", "")
        if q_lower in summary.lower():
            score += 2
            idx = summary.lower().find(q_lower)
            matches.append(f"Summary: ...{summary[max(0,idx-50):idx+100]}...")
        for tag in data.get("domain_tags", []):
            if q_lower in tag.lower():
                score += 3
                matches.append(f"Domain: {tag}")
                break
        if score > 0:
            results.append({
                "video_id": vid_id, "video_title": data["video_title"],
                "domain": data.get("domain", ""), "score": score, "matches": matches[:3]
            })
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"query": q, "total": len(results), "results": results[:limit]}


@router.get("/search/{video_id}/chapters")
def search_chapters(video_id: str, q: str = Query(...)):
    q_lower = q.lower()
    data = _load_json(CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json")
    results = []
    for ch in data.get("chapter_summaries", []):
        score = 0
        if q_lower in ch["title"].lower():
            score += 10
        for concept in ch.get("key_concepts", []):
            if q_lower in concept.lower():
                score += 5
                break
        if q_lower in ch.get("summary_medium", "").lower():
            score += 2
        if score > 0:
            results.append({
                "chapter_index": ch["chapter_index"],
                "title":         ch["title"],
                "start_time":    ch["start_time"],
                "end_time":      ch["end_time"],
                "score":         score,
                "summary_short": ch.get("summary_short", ""),
                "frame_paths":   ch.get("frame_paths", [])
            })
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"video_id": video_id, "query": q, "results": results}


# ── Evaluation ────────────────────────────────────────────────────────────────

@router.get("/evaluation/report")
def get_evaluation_report():
    path = COLLECTION_DIR / "evaluation_report.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Run summarization_metrics.py first.")
    return _load_json(path)


@router.get("/evaluation/human/packet")
def get_human_evaluation_packet():
    path = HUMAN_EVAL_DIR / "evaluation_packet.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Run human_evaluation.py first.")
    return _load_json(path)


@router.get("/evaluation/human/report")
def get_human_evaluation_report():
    path = HUMAN_EVAL_DIR / "human_evaluation_report.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Collect responses then run: human_evaluation.py analyze")
    return _load_json(path)