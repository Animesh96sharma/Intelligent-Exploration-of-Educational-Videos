"""
backend/app/config.py
Central configuration — all paths, model names, and thresholds live here.
"""
from pathlib import Path

# ── Project root (two levels above this file) ─────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]

# ── Data directories ──────────────────────────────────────────────────────────
DATA_DIR        = ROOT / "data" / "processed"
INPUT_DIR       = DATA_DIR / "subtask1_segmentation" / "chapters"

ST2_DIR         = DATA_DIR / "subtask2_summarization"
CHAPTER_SUM_DIR = ST2_DIR / "chapter_summaries"
VIDEO_SUM_DIR   = ST2_DIR / "video_summaries"
EMBED_DIR       = ST2_DIR / "embeddings"
COLLECTION_DIR  = ST2_DIR / "collection_analysis"

# ── LLM settings ──────────────────────────────────────────────────────────────
LLM_MODEL          = "mistral"          # swap to "llama3.1" if available
LLM_MAX_RETRIES    = 3
LLM_RETRY_DELAY    = 2                  # seconds between retries

# ── Chunking — handles ANY transcript length ─────────────────────────────────
# Mistral context ≈ 8000 tokens. 1 token ≈ 4 chars.
CHUNK_CHAR_LIMIT   = 12_000            # max chars per LLM call
CHUNK_OVERLAP      = 500               # overlap between chunks to preserve context

# ── Embedding model ───────────────────────────────────────────────────────────
EMBED_MODEL        = "all-MiniLM-L6-v2"   # fast CPU model; swap to "all-mpnet-base-v2" for higher quality

# ── Collection analysis ───────────────────────────────────────────────────────
SIMILARITY_THRESHOLD   = 0.35          # min cosine similarity to call two videos "related"
COMMON_CONCEPT_MIN     = 2             # concept must appear in N+ videos to be "common"
MAX_PAIRWISE_COMPARE   = 5             # max video pairs to run LLM comparison on

# Ensure output dirs exist at import time
for _d in [CHAPTER_SUM_DIR, VIDEO_SUM_DIR, EMBED_DIR, COLLECTION_DIR]:
    _d.mkdir(parents=True, exist_ok=True)