"""
backend/app/main.py

FastAPI application entry point.
Run: uvicorn backend.app.main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.summaries import router as summaries_router

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(summaries_router)


@app.get("/")
def root():
    return {
        "status": "running",
        "docs":   "http://localhost:8000/docs",
        "endpoints": [
            "GET  /api/videos",
            "GET  /api/summaries/{video_id}",
            "GET  /api/summaries/{video_id}/chapters",
            "GET  /api/summaries/{video_id}/chapters/{chapter_index}",
            "GET  /api/summaries/{video_id}/timeline",
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