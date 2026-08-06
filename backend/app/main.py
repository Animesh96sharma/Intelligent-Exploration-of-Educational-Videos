# """
# backend/app/main.py

# FastAPI application entry point.
# Run: uvicorn backend.app.main:app --reload --port 8001
# Docs: http://localhost:8001/docs
# """
# import logging
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from backend.app.api.summaries import router as summaries_router

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
# )

# app = FastAPI(
#     title="Intelligent Video Exploration — Subtask 2 API",
#     description="Multi-level summarization and collection analysis for educational videos.",
#     version="1.0.0"
# )

# # Allow frontend (Student C) to call from any origin during development
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173",
#     "http://137.248.121.127:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(summaries_router)


# @app.get("/")
# def root():
#     return {
#         "status": "running",
#         "docs":   "http://localhost:8001/docs",
#         "endpoints": [
#             "GET  /api/videos",
#             "GET  /api/summaries/{video_id}",
#             "GET  /api/summaries/{video_id}/chapters",
#             "GET  /api/summaries/{video_id}/chapters/{chapter_index}",
#             "GET  /api/summaries/{video_id}/timeline",
#             "GET  /api/collection/analysis",
#             "GET  /api/collection/overview",
#             "GET  /api/collection/similarity-matrix",
#             "GET  /api/collection/relationships",
#             "POST /api/collection/compare",
#             "GET  /api/search?q=...",
#             "GET  /api/search/{video_id}/chapters?q=...",
#             "GET  /api/evaluation/report",
#         ]
#     }
"""
backend/app/main.py

FastAPI application entry point.
Run: uvicorn backend.app.main:app --reload --port 8001
Docs: http://localhost:8001/docs
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.summaries import router as summaries_router
from backend.app.config import FRAMES_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

app = FastAPI(
    title="Intelligent Video Exploration — Subtask 2 API",
    description="Multi-level summarization and collection analysis for educational videos.",
    version="1.0.0"
)

# Allow frontend (Student C) to call from any origin during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://137.248.121.127:5173", "http://137.248.121.127:5174", "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount frames directory for image serving ──────────────────────────────
if FRAMES_DIR.exists():
    app.mount("/frames", StaticFiles(directory=str(FRAMES_DIR)), name="frames")
    logging.info(f"Serving frames from: {FRAMES_DIR}")
else:
    logging.warning(f"FRAMES_DIR not found: {FRAMES_DIR}")

app.include_router(summaries_router)


@app.get("/")
def root():
    return {
        "status": "running",
        "docs":   "http://localhost:8001/docs",
        "frames_mounted": str(FRAMES_DIR) if FRAMES_DIR.exists() else None,
        "endpoints": [
            "GET  /api/videos",
            "GET  /api/summaries/{video_id}",
            "GET  /api/summaries/{video_id}/chapters",
            "GET  /api/summaries/{video_id}/chapters/{chapter_index}",
            "GET  /api/summaries/{video_id}/chapters/{chapter_index}/frames",
            "GET  /api/summaries/{video_id}/timeline",
            "GET  /api/summaries/{video_id}/visual-summary",
            "GET  /api/summaries/{video_id}/chapters/{chapter_index}/visual-integration",
            "GET  /api/collection/analysis",
            "GET  /api/collection/overview",
            "GET  /api/collection/similarity-matrix",
            "GET  /api/collection/relationships",
            "POST /api/collection/compare",
            "GET  /api/search?q=...",
            "GET  /api/search/{video_id}/chapters?q=...",
            "GET  /api/evaluation/report",
        ]
    }