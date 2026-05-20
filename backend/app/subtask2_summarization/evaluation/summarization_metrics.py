"""
backend/app/subtask2_summarization/evaluation/summarization_metrics.py

Evaluation metrics for summary quality:
  - ROUGE-1, ROUGE-2, ROUGE-L  (n-gram overlap)
  - BERTScore                   (semantic similarity)
  - Coverage score              (key concept coverage)
  - Coherence score             (LLM-based)
"""
import json
import logging
from pathlib import Path
from typing import Optional

from backend.app.config import VIDEO_SUM_DIR, CHAPTER_SUM_DIR, COLLECTION_DIR
from backend.app.common.utils.llm_client import call_llm, parse_json_response

logger = logging.getLogger(__name__)

# ── ROUGE (no external dependency — implemented from scratch) ─────────────────

def _ngrams(tokens: list[str], n: int) -> set:
    return set(tuple(tokens[i:i+n]) for i in range(len(tokens) - n + 1))


def _tokenize(text: str) -> list[str]:
    import re
    return re.findall(r'\b\w+\b', text.lower())


def rouge_score(hypothesis: str, reference: str) -> dict:
    """
    Compute ROUGE-1, ROUGE-2, ROUGE-L between hypothesis and reference.
    Returns precision, recall, F1 for each.
    """
    hyp_tokens = _tokenize(hypothesis)
    ref_tokens = _tokenize(reference)

    scores = {}

    for n, name in [(1, "rouge1"), (2, "rouge2")]:
        hyp_ng = _ngrams(hyp_tokens, n)
        ref_ng = _ngrams(ref_tokens, n)
        if not hyp_ng or not ref_ng:
            scores[name] = {"precision": 0.0, "recall": 0.0, "f1": 0.0}
            continue
        overlap = len(hyp_ng & ref_ng)
        p = overlap / len(hyp_ng)
        r = overlap / len(ref_ng)
        f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0.0
        scores[name] = {"precision": round(p, 4), "recall": round(r, 4), "f1": round(f1, 4)}

    # ROUGE-L: longest common subsequence
    def lcs_length(a, b):
        m, n = len(a), len(b)
        if m == 0 or n == 0:
            return 0
        # Space-optimized LCS
        prev = [0] * (n + 1)
        for i in range(1, m + 1):
            curr = [0] * (n + 1)
            for j in range(1, n + 1):
                curr[j] = prev[j-1] + 1 if a[i-1] == b[j-1] else max(curr[j-1], prev[j])
            prev = curr
        return prev[n]

    lcs = lcs_length(hyp_tokens, ref_tokens)
    p = lcs / len(hyp_tokens) if hyp_tokens else 0.0
    r = lcs / len(ref_tokens)  if ref_tokens else 0.0
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0.0
    scores["rougeL"] = {"precision": round(p, 4), "recall": round(r, 4), "f1": round(f1, 4)}

    return scores


# ── Key concept coverage ──────────────────────────────────────────────────────

def concept_coverage(summary: str, key_concepts: list[str]) -> dict:
    """What fraction of key concepts are mentioned in the summary?"""
    if not key_concepts:
        return {"coverage": 0.0, "covered": [], "missing": []}
    summary_lower = summary.lower()
    covered = [c for c in key_concepts if c.lower() in summary_lower]
    missing = [c for c in key_concepts if c.lower() not in summary_lower]
    return {
        "coverage": round(len(covered) / len(key_concepts), 4),
        "covered":  covered,
        "missing":  missing
    }


# ── LLM-based coherence score ─────────────────────────────────────────────────

COHERENCE_PROMPT = """Rate the quality of this educational summary on three dimensions.
Return ONLY JSON:

Summary to evaluate:
"{summary}"

{{
  "coherence_score": 4,
  "informativeness_score": 4,
  "conciseness_score": 4,
  "feedback": "Brief explanation of the scores"
}}

Each score is 1-5 where 5 is best.
coherence: Does the summary flow logically and make sense?
informativeness: Does it cover the key educational content?
conciseness: Is it appropriately brief without losing important details?"""


def llm_quality_score(summary: str) -> dict:
    """Ask LLM to rate summary quality. Returns scores 1-5 per dimension."""
    prompt = COHERENCE_PROMPT.format(summary=summary[:1500])
    raw = call_llm(prompt)
    if raw is None:
        return {"error": "LLM call failed"}
    parsed = parse_json_response(raw)
    return parsed or {"error": "JSON parse failed"}


# ── Batch evaluation ──────────────────────────────────────────────────────────

def evaluate_video_summaries(reference_summaries: Optional[dict] = None) -> dict:
    """
    Evaluate all generated video summaries.

    Args:
        reference_summaries: Optional dict {video_id: reference_text} for ROUGE.
                             If None, only LLM quality scores and coverage are computed.
    Returns:
        Dict with per-video and aggregate metrics.
    """
    files = sorted(VIDEO_SUM_DIR.glob("*_video_summary.json"))
    if not files:
        return {"error": f"No video summaries found in {VIDEO_SUM_DIR}"}

    results = {}

    for path in files:
        with open(path) as f:
            data = json.load(f)

        video_id = data["video_id"]
        logger.info(f"Evaluating: {video_id}")

        summary_medium = data.get("summary_medium", "")
        key_concepts   = data.get("key_concepts", [])

        video_result = {
            "video_id":    video_id,
            "video_title": data["video_title"],
        }

        # ROUGE against reference if provided
        if reference_summaries and video_id in reference_summaries:
            ref = reference_summaries[video_id]
            video_result["rouge"] = rouge_score(summary_medium, ref)

        # Concept coverage
        video_result["concept_coverage"] = concept_coverage(summary_medium, key_concepts)

        # LLM quality scores
        video_result["llm_quality"] = llm_quality_score(summary_medium)

        results[video_id] = video_result

    # Aggregate scores
    all_coverage = [
        r["concept_coverage"]["coverage"]
        for r in results.values()
        if "concept_coverage" in r
    ]
    all_coherence = [
        r["llm_quality"].get("coherence_score", 0)
        for r in results.values()
        if "llm_quality" in r and "error" not in r["llm_quality"]
    ]

    aggregate = {
        "total_videos_evaluated": len(results),
        "avg_concept_coverage":   round(sum(all_coverage) / len(all_coverage), 4) if all_coverage else 0,
        "avg_coherence_score":    round(sum(all_coherence) / len(all_coherence), 2) if all_coherence else 0,
    }

    output = {"aggregate": aggregate, "per_video": results}

    out_path = COLLECTION_DIR / "evaluation_report.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    logger.info(f"Evaluation saved → {out_path}")
    logger.info(f"Avg concept coverage: {aggregate['avg_concept_coverage']:.1%}")
    logger.info(f"Avg coherence score:  {aggregate['avg_coherence_score']:.1f}/5")
    return output


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    evaluate_video_summaries()