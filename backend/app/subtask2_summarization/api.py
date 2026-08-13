"""
Subtask 2 API - Multi-Level Video Summarization
Serves summarization data to the frontend.

Run: uvicorn backend.app.subtask2_summarization.api:app --host 0.0.0.0 --port 8001
Docs: http://localhost:8001/docs
"""
import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config — adjust these paths to match your project layout
# ---------------------------------------------------------------------------

BASE_DIR = Path("/home/umwise2526studentproj/Group3ProjectWork/project/aryan/data/processed/subtask2_summarization")
FRAMES_DIR = Path("/home/umwise2526studentproj/Group3ProjectWork/project/aryan/data/processed/subtask1_segmentation/frames")

CHAPTER_SUM_DIR  = BASE_DIR / "chapter_summaries"
VIDEO_SUM_DIR    = BASE_DIR / "video_summaries"
EMBED_DIR        = BASE_DIR / "embeddings"
COLLECTION_DIR   = BASE_DIR / "collection_analysis"

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("subtask2_api")

app = FastAPI(
    title="Subtask 2 - Multi-Level Video Summarization API",
    description="Serves video summaries, chapter summaries, collection analysis, and comparisons.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://137.248.121.127:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount frames directory for image serving ──────────────────────────────
if FRAMES_DIR.exists():
    app.mount("/frames", StaticFiles(directory=str(FRAMES_DIR)), name="frames")
    log.info(f"Serving frames from: {FRAMES_DIR}")
else:
    log.warning(f"FRAMES_DIR not found: {FRAMES_DIR}")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_json(path: Path, video_id: str, label: str) -> dict:
    """Load a JSON file or raise a clean 404."""
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{label} not found for '{video_id}'. Run the summarization pipeline first."
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def list_video_ids() -> list[str]:
    """Return all video IDs that have a video summary file."""
    if not VIDEO_SUM_DIR.exists():
        return []
    return sorted(
        p.name.replace("_video_summary.json", "")
        for p in VIDEO_SUM_DIR.glob("*_video_summary.json")
    )


def hms(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600:02d}:{(s % 3600) // 60:02d}:{s % 60:02d}"


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class VideoSummaryResponse(BaseModel):
    video_id: str
    video_title: str
    speaker: str
    domain: str
    duration: int
    total_chapters: int
    difficulty_level: str
    domain_tags: list[str]
    has_chapter_summaries: bool
    has_visual_integration: bool


class VideoListResponse(BaseModel):
    status: str
    total: int
    videos: list[VideoSummaryResponse]


class StatusResponse(BaseModel):
    status: str
    version: str
    videos_processed: int
    port: int
    endpoints: list[str]


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class CompareRequest(BaseModel):
    video_id_a: str
    video_id_b: str

# ---------------------------------------------------------------------------
# Health Endpoints
# ---------------------------------------------------------------------------

@app.get("/status", response_model=StatusResponse, tags=["Health"])
def status():
    """Check the API is running."""
    return StatusResponse(
        status="ok",
        version="1.0.0",
        videos_processed=len(list_video_ids()),
        port=8001,
        endpoints=[
            "GET /status",
            "GET /videos",
            "GET /summary/{video_id}",
            "GET /summary/{video_id}/chapters",
            "GET /summary/{video_id}/timeline",
            "GET /summary/{video_id}/visual",
            "GET /summary/{video_id}/chapters/{chapter_index}/frames",
            "GET /collection/analysis",
            "GET /collection/overview",
            "GET /collection/similarity",
            "GET /collection/relationships",
            "POST /collection/compare",
            "GET /search",
            "GET /evaluation",
        ],
    )

# ---------------------------------------------------------------------------
# Video Endpoints
# ---------------------------------------------------------------------------

@app.get("/videos", response_model=VideoListResponse, tags=["Videos"])
def list_videos():
    """List all processed videos with a brief summary of each."""
    ids = list_video_ids()
    summaries = []

    for vid in ids:
        video_path = VIDEO_SUM_DIR / f"{vid}_video_summary.json"
        chapter_path = CHAPTER_SUM_DIR / f"{vid}_chapter_summaries.json"
        
        has_chapter_summaries = chapter_path.exists()
        has_visual_integration = False
        
        if video_path.exists():
            try:
                data = load_json(video_path, vid, "Video summary")
                
                if chapter_path.exists():
                    try:
                        ch_data = load_json(chapter_path, vid, "Chapter summaries")
                        has_visual_integration = "video_visual_summary" in ch_data
                    except:
                        pass
                
                summaries.append(VideoSummaryResponse(
                    video_id=vid,
                    video_title=data.get("video_title", vid),
                    speaker=data.get("speaker", "Unknown"),
                    domain=data.get("domain", "Unknown"),
                    duration=data.get("duration", 0),
                    total_chapters=data.get("total_chapters", 0),
                    difficulty_level=data.get("difficulty_level", "unknown"),
                    domain_tags=data.get("domain_tags", []),
                    has_chapter_summaries=has_chapter_summaries,
                    has_visual_integration=has_visual_integration
                ))
            except Exception as e:
                log.warning(f"Could not load {vid}: {e}")
                continue

    return VideoListResponse(status="ok", total=len(summaries), videos=summaries)


@app.get("/summary/{video_id}", tags=["Summaries"])
def get_video_summary(
    video_id: str,
    level: Optional[str] = Query(None, description="short | medium | long")
):
    """Get the full video-level summary for a video."""
    path = VIDEO_SUM_DIR / f"{video_id}_video_summary.json"
    data = load_json(path, video_id, "Video summary")

    if level:
        key = f"summary_{level}"
        if key not in data:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid level '{level}'. Use: short, medium, long"
            )
        return {
            "status": "ok",
            "video_id": video_id,
            "video_title": data.get("video_title", "Unknown"),
            "level": level,
            "summary": data[key]
        }

    return {
        "status": "ok",
        "video_id": video_id,
        **data
    }


@app.get("/summary/{video_id}/chapters", tags=["Summaries"])
def get_chapter_summaries(video_id: str):
    """Get all chapter summaries for a video."""
    path = CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json"
    data = load_json(path, video_id, "Chapter summaries")
    
    chapters = data.get("chapter_summaries", [])
    for ch in chapters:
        ch.pop("frame_captions", None)
        ch.pop("transcript", None)
        ch.pop("raw_llm_output", None)
    
    return {
        "status": "ok",
        "video_id": video_id,
        "video_title": data.get("video_title", "Unknown"),
        "total_chapters": len(chapters),
        "chapter_summaries": chapters
    }


@app.get("/summary/{video_id}/chapters/{chapter_index}", tags=["Summaries"])
def get_single_chapter(video_id: str, chapter_index: int):
    """Get summary for one specific chapter."""
    path = CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json"
    data = load_json(path, video_id, "Chapter summaries")
    
    chapters = data.get("chapter_summaries", [])
    for ch in chapters:
        if ch.get("chapter_index") == chapter_index:
            ch.pop("frame_captions", None)
            ch.pop("transcript", None)
            ch.pop("raw_llm_output", None)
            return {
                "status": "ok",
                "video_id": video_id,
                "chapter": ch
            }
    
    raise HTTPException(
        status_code=404,
        detail=f"Chapter {chapter_index} not found for '{video_id}'."
    )


@app.get("/summary/{video_id}/chapters/{chapter_index}/frames", tags=["Summaries"])
def get_chapter_frames(video_id: str, chapter_index: int, request: Request):
    """Get frame images for a specific chapter."""
    path = CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json"
    data = load_json(path, video_id, "Chapter summaries")
    
    for ch in data.get("chapter_summaries", []):
        if ch.get("chapter_index") == chapter_index:
            frame_paths = ch.get("frame_paths", [])
            base_url = str(request.base_url).rstrip("/")
            
            frame_urls = []
            for fp in frame_paths:
                if not fp:
                    continue
                try:
                    fp_path = Path(fp)
                    if FRAMES_DIR in fp_path.parents or str(FRAMES_DIR) in str(fp_path):
                        rel = fp_path.relative_to(FRAMES_DIR)
                        frame_urls.append(f"{base_url}/frames/{rel}")
                    elif fp.startswith("http"):
                        frame_urls.append(fp)
                    else:
                        frame_urls.append(f"{base_url}/frames/{fp_path.name}")
                except Exception:
                    frame_urls.append(f"{base_url}/frames/{Path(fp).name}")
            
            return {
                "status": "ok",
                "video_id": video_id,
                "chapter_index": chapter_index,
                "title": ch.get("title", ""),
                "frame_urls": frame_urls,
                "frame_count": len(frame_urls)
            }
    
    raise HTTPException(status_code=404, detail=f"Chapter {chapter_index} not found")


@app.get("/summary/{video_id}/timeline", tags=["Summaries"])
def get_timeline(video_id: str):
    """Get lightweight timeline data for frontend."""
    path = VIDEO_SUM_DIR / f"{video_id}_video_summary.json"
    data = load_json(path, video_id, "Video summary")
    
    return {
        "status": "ok",
        "video_id": video_id,
        "video_title": data.get("video_title", "Unknown"),
        "duration": data.get("duration", 0),
        "duration_formatted": hms(data.get("duration", 0)),
        "chapter_timeline": data.get("chapter_timeline", [])
    }


@app.get("/summary/{video_id}/visual", tags=["Summaries"])
def get_visual_summary(video_id: str):
    """Get visual-textual integration summary."""
    path = CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json"
    data = load_json(path, video_id, "Chapter summaries")
    
    if "video_visual_summary" not in data:
        raise HTTPException(
            status_code=404,
            detail=f"Visual integration not run for '{video_id}'."
        )
    
    return {
        "status": "ok",
        "video_id": video_id,
        "video_visual_summary": data["video_visual_summary"]
    }

# ---------------------------------------------------------------------------
# Collection Endpoints
# ---------------------------------------------------------------------------

@app.get("/collection/analysis", tags=["Collection"])
def get_collection_analysis():
    """Get the full collection-level analysis."""
    path = COLLECTION_DIR / "collection_analysis.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Collection analysis not found. Run analyze_collection.py first."
        )
    data = load_json(path, "collection", "Collection analysis")
    return {"status": "ok", **data}


@app.get("/collection/overview", tags=["Collection"])
def get_collection_overview():
    """Get just the high-level collection overview."""
    path = COLLECTION_DIR / "collection_analysis.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Collection analysis not found. Run analyze_collection.py first."
        )
    data = load_json(path, "collection", "Collection analysis")
    
    return {
        "status": "ok",
        "total_videos": data.get("total_videos", 0),
        "collection_overview": data.get("collection_overview", {}),
        "common_concepts": data.get("common_concepts", {}),
        "video_relationships": data.get("video_relationships", [])
    }


@app.get("/collection/similarity", tags=["Collection"])
def get_similarity_matrix():
    """Get pairwise cosine similarity matrix."""
    path = EMBED_DIR / "video_similarity_matrix.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Similarity matrix not found. Run build_embeddings.py first."
        )
    data = load_json(path, "similarity", "Similarity matrix")
    return {"status": "ok", **data}


@app.get("/collection/relationships", tags=["Collection"])
def get_video_relationships():
    """Get list of related video pairs."""
    path = COLLECTION_DIR / "collection_analysis.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Collection analysis not found. Run analyze_collection.py first."
        )
    data = load_json(path, "collection", "Collection analysis")
    
    return {
        "status": "ok",
        "threshold": 0.35,
        "total_relationships": len(data.get("video_relationships", [])),
        "relationships": data.get("video_relationships", [])
    }


@app.post("/collection/compare", tags=["Collection"])
def compare_videos(req: CompareRequest):
    """Compare two specific videos."""
    collection_path = COLLECTION_DIR / "collection_analysis.json"
    if collection_path.exists():
        try:
            collection = load_json(collection_path, "collection", "Collection analysis")
            for cached in collection.get("pairwise_comparisons", []):
                if ((cached["video_a"] == req.video_id_a and cached["video_b"] == req.video_id_b) or
                    (cached["video_a"] == req.video_id_b and cached["video_b"] == req.video_id_a)):
                    return {
                        "status": "ok",
                        "source": "cache",
                        "comparison": cached
                    }
        except:
            pass
    
    try:
        from backend.app.subtask2_summarization.collection_level.analyze_collection import compare_two_videos
        
        video_a_path = VIDEO_SUM_DIR / f"{req.video_id_a}_video_summary.json"
        video_b_path = VIDEO_SUM_DIR / f"{req.video_id_b}_video_summary.json"
        
        video_a = load_json(video_a_path, req.video_id_a, "Video summary")
        video_b = load_json(video_b_path, req.video_id_b, "Video summary")
        
        result = compare_two_videos(video_a, video_b)
        
        return {
            "status": "ok",
            "source": "live",
            "video_a": req.video_id_a,
            "video_b": req.video_id_b,
            "comparison": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Comparison failed: {str(e)}"
        )

# ---------------------------------------------------------------------------
# Search Endpoints
# ---------------------------------------------------------------------------

@app.get("/search", tags=["Search"])
def search_videos(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Max results")
):
    """Search across videos."""
    q_lower = q.lower()
    results = []

    for vid_id in list_video_ids():
        try:
            path = VIDEO_SUM_DIR / f"{vid_id}_video_summary.json"
            data = load_json(path, vid_id, "Video summary")
        except HTTPException:
            continue

        score = 0
        matches = []

        if q_lower in data.get("video_title", "").lower():
            score += 10
            matches.append(f"Title: {data['video_title']}")

        for concept in data.get("key_concepts", []):
            if q_lower in concept.lower():
                score += 5
                matches.append(f"Concept: {concept}")

        summary = data.get("summary_medium", "")
        if q_lower in summary.lower():
            score += 2
            idx = summary.lower().find(q_lower)
            context = summary[max(0, idx-50):idx+100]
            matches.append(f"Summary: ...{context}...")

        for tag in data.get("domain_tags", []):
            if q_lower in tag.lower():
                score += 3
                matches.append(f"Domain: {tag}")

        if score > 0:
            results.append({
                "video_id": vid_id,
                "video_title": data.get("video_title", "Unknown"),
                "domain": data.get("domain", ""),
                "score": score,
                "matches": matches[:3]
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "status": "ok",
        "query": q,
        "total": len(results),
        "results": results[:limit]
    }


@app.get("/search/{video_id}/chapters", tags=["Search"])
def search_chapters(
    video_id: str,
    q: str = Query(..., description="Search query")
):
    """Search within a video's chapters."""
    q_lower = q.lower()
    path = CHAPTER_SUM_DIR / f"{video_id}_chapter_summaries.json"
    data = load_json(path, video_id, "Chapter summaries")
    
    results = []
    for ch in data.get("chapter_summaries", []):
        score = 0
        if q_lower in ch.get("title", "").lower():
            score += 10
        for concept in ch.get("key_concepts", []):
            if q_lower in concept.lower():
                score += 5
        if q_lower in ch.get("summary_medium", "").lower():
            score += 2
        if score > 0:
            results.append({
                "chapter_index": ch.get("chapter_index"),
                "title": ch.get("title"),
                "start_time": ch.get("start_time"),
                "score": score,
                "summary_short": ch.get("summary_short", "")
            })
    
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "status": "ok",
        "video_id": video_id,
        "query": q,
        "total": len(results),
        "results": results
    }

# ---------------------------------------------------------------------------
# Evaluation Endpoints
# ---------------------------------------------------------------------------

@app.get("/evaluation", tags=["Evaluation"])
def get_evaluation():
    """Get evaluation metrics report."""
    path = COLLECTION_DIR / "evaluation_report.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Evaluation report not found. Run summarization_metrics.py first."
        )
    data = load_json(path, "evaluation", "Evaluation report")
    return {"status": "ok", **data}


@app.get("/evaluation/human/packet", tags=["Evaluation"])
def get_human_evaluation_packet():
    """Get human evaluation packet."""
    HUMAN_EVAL_DIR = BASE_DIR.parent / "human_evaluation"
    path = HUMAN_EVAL_DIR / "evaluation_packet.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Evaluation packet not found. Run human_evaluation.py first."
        )
    data = load_json(path, "human_eval", "Human evaluation packet")
    return {"status": "ok", **data}


@app.get("/evaluation/human/report", tags=["Evaluation"])
def get_human_evaluation_report():
    """Get human evaluation report."""
    HUMAN_EVAL_DIR = BASE_DIR.parent / "human_evaluation"
    path = HUMAN_EVAL_DIR / "human_evaluation_report.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Human evaluation report not found."
        )
    data = load_json(path, "human_eval_report", "Human evaluation report")
    return {"status": "ok", **data}


# ---------------------------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------------------------

@app.get("/", tags=["Root"])
def root():
    """Root endpoint with API information."""
    return {
        "status": "running",
        "service": "Subtask 2 - Multi-Level Video Summarization API",
        "version": "1.0.0",
        "port": 8001,
        "docs": "http://localhost:8001/docs",
        "videos_processed": len(list_video_ids()),
        "endpoints": {
            "Health": ["GET /status"],
            "Videos": [
                "GET /videos",
                "GET /summary/{video_id}",
                "GET /summary/{video_id}/chapters",
                "GET /summary/{video_id}/chapters/{chapter_index}",
                "GET /summary/{video_id}/chapters/{chapter_index}/frames",
                "GET /summary/{video_id}/timeline",
                "GET /summary/{video_id}/visual"
            ],
            "Collection": [
                "GET /collection/analysis",
                "GET /collection/overview",
                "GET /collection/similarity",
                "GET /collection/relationships",
                "POST /collection/compare"
            ],
            "Search": [
                "GET /search?q=...",
                "GET /search/{video_id}/chapters?q=..."
            ],
            "Evaluation": [
                "GET /evaluation",
                "GET /evaluation/human/packet",
                "GET /evaluation/human/report"
            ]
        }
    }


# ---------------------------------------------------------------------------
# Run with: uvicorn backend.app.subtask2_summarization.api:app --host 0.0.0.0 --port 8001
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("  Subtask 2 - Multi-Level Video Summarization API")
    print("="*60)
    print(f"  Data directory: {BASE_DIR}")
    print(f"  Videos found:   {len(list_video_ids())}")
    print("="*60)
    print("\n  Starting server at http://localhost:8001")
    print("  API Docs at http://localhost:8001/docs")
    print("\n  Press Ctrl+C to stop\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)