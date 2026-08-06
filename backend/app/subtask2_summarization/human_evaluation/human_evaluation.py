"""
backend/app/subtask2_summarization/human_evaluation/human_evaluation.py
"""
import json
import random
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

from backend.app.config import VIDEO_SUM_DIR, CHAPTER_SUM_DIR, COLLECTION_DIR

logger = logging.getLogger(__name__)

HUMAN_EVAL_DIR = COLLECTION_DIR.parent / "human_evaluation"
HUMAN_EVAL_DIR.mkdir(parents=True, exist_ok=True)


def load_all_videos() -> list[dict]:
    files = sorted(VIDEO_SUM_DIR.glob("*_video_summary.json"))
    videos = []
    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            videos.append(json.load(f))
    return videos


def generate_summary_quality_questions(videos: list[dict], n_samples: int = 6) -> list[dict]:
    questions = []
    sample = random.sample(videos, min(n_samples, len(videos)))
    for video in sample:
        questions.append({
            "question_id":    f"summary_quality_{video['video_id']}",
            "type":            "summary_rating",
            "video_id":        video["video_id"],
            "video_title":     video["video_title"],
            "summary_shown":   video.get("summary_medium", ""),
            "instructions": (
                "Read the summary above. Rate it on the following two dimensions "
                "from 1 (very poor) to 5 (excellent)."
            ),
            "rating_dimensions": [
                {"dimension": "informativeness", "question": "Does the summary capture the key content of the video?"},
                {"dimension": "coherence",       "question": "Does the summary read smoothly and make logical sense?"}
            ]
        })
    return questions


def generate_collection_analysis_questions(collection_analysis: dict) -> list[dict]:
    questions = []
    common_concepts = collection_analysis.get("common_concepts", {})
    top_concepts = list(common_concepts.keys())[:5]

    questions.append({
        "question_id": "commonality_accuracy",
        "type":        "expert_rating",
        "content_shown": f"The system identified these common concepts across the video collection: {', '.join(top_concepts) if top_concepts else 'none found'}",
        "instructions": "As a subject expert, rate the accuracy of this commonality detection from 1 (inaccurate) to 5 (highly accurate).",
        "rating_dimensions": [
            {"dimension": "commonality_accuracy", "question": "Are these genuinely shared concepts across the videos?"}
        ]
    })

    comparisons = collection_analysis.get("pairwise_comparisons", [])
    if comparisons:
        sample_comparison = random.choice(comparisons)
        questions.append({
            "question_id":  "difference_usefulness",
            "type":          "expert_rating",
            "content_shown": (
                f"Comparing '{sample_comparison['title_a']}' and '{sample_comparison['title_b']}': "
                f"{sample_comparison['comparison'].get('perspective_differences', 'N/A')}"
            ),
            "instructions": "Rate how useful this difference analysis would be for a student deciding which video to watch, from 1 (not useful) to 5 (very useful).",
            "rating_dimensions": [
                {"dimension": "difference_usefulness", "question": "Would this comparison help a student make a decision?"}
            ]
        })

    return questions


def generate_task_based_evaluation(videos: list[dict]) -> list[dict]:
    if len(videos) < 2:
        logger.warning("Need at least 2 videos for task-based evaluation; using what's available.")

    tasks = []

    target_video = random.choice(videos)
    target_chapter = None
    chapter_path = CHAPTER_SUM_DIR / f"{target_video['video_id']}_chapter_summaries.json"
    if chapter_path.exists():
        with open(chapter_path) as f:
            ch_data = json.load(f)
        if ch_data["chapter_summaries"]:
            target_chapter = random.choice(ch_data["chapter_summaries"])

    tasks.append({
        "task_id":   "task_1_find_information",
        "task_type": "find_specific_information",
        "instructions": (
            f"Using the system, find which chapter of the video "
            f"'{target_video['video_title']}' discusses the concept: "
            f"'{target_chapter['key_concepts'][0] if target_chapter and target_chapter.get('key_concepts') else 'a key topic'}'."
        ),
        "ground_truth_video_id":   target_video["video_id"],
        "ground_truth_chapter_id": target_chapter["chapter_id"] if target_chapter else None,
        "metrics_to_record": ["success (yes/no)", "time_seconds", "num_clicks_or_searches"]
    })

    if len(videos) >= 2:
        pair = random.sample(videos, 2)
        tasks.append({
            "task_id":   "task_2_compare_videos",
            "task_type": "compare_related_videos",
            "instructions": (
                f"Compare '{pair[0]['video_title']}' and '{pair[1]['video_title']}'. "
                f"Identify one topic covered in both, and one topic unique to each."
            ),
            "video_ids": [pair[0]["video_id"], pair[1]["video_id"]],
            "metrics_to_record": ["success (yes/no)", "time_seconds", "answer_correctness (1-5)"]
        })

    tasks.append({
        "task_id":   "task_3_explore_by_topic",
        "task_type": "explore_collection_by_topic",
        "instructions": (
            "Without being told which video to use, find all videos in the collection "
            "that relate to a topic of your choice (e.g. 'machine learning', 'databases'). "
            "List the videos you found."
        ),
        "metrics_to_record": ["num_relevant_videos_found", "time_seconds", "precision_estimate"]
    })

    return tasks


def generate_satisfaction_survey() -> dict:
    return {
        "survey_id": "post_session_satisfaction",
        "instructions": "After completing all tasks, please rate your experience.",
        "questions": [
            {"id": "ease_of_use",        "text": "The system was easy to use.", "scale": "1 (strongly disagree) to 5 (strongly agree)"},
            {"id": "summary_quality",    "text": "The summaries were clear and useful.", "scale": "1-5"},
            {"id": "comparison_value",   "text": "The video comparison features helped me understand differences between videos.", "scale": "1-5"},
            {"id": "search_effectiveness","text": "I was able to find what I was looking for efficiently.", "scale": "1-5"},
            {"id": "overall_satisfaction","text": "Overall, I am satisfied with this system.", "scale": "1-5"},
            {"id": "qualitative_feedback","text": "What did you like most, and what would you improve?", "scale": "open text"}
        ]
    }


def generate_evaluation_packet() -> dict:
    videos = load_all_videos()
    if not videos:
        logger.error("No processed videos found. Run the summarization pipeline first.")
        return {"error": "no videos processed yet"}

    collection_path = COLLECTION_DIR / "collection_analysis.json"
    collection_analysis = {}
    if collection_path.exists():
        with open(collection_path) as f:
            collection_analysis = json.load(f)

    packet = {
        "generated_at":   datetime.now().isoformat(),
        "instructions_for_facilitator": (
            "Recruit 4-7 participants (students, educators, or researchers). "
            "For each participant: (1) have them complete the 3 tasks below while you "
            "time them and record success/failure, (2) have them rate the summary quality "
            "questions, (3) have them complete the satisfaction survey at the end. "
            "Record all responses using the response_template.json structure."
        ),
        "summary_quality_questions":   generate_summary_quality_questions(videos),
        "collection_analysis_questions": generate_collection_analysis_questions(collection_analysis),
        "tasks": generate_task_based_evaluation(videos),
        "satisfaction_survey": generate_satisfaction_survey()
    }

    out_path = HUMAN_EVAL_DIR / "evaluation_packet.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(packet, f, indent=2, ensure_ascii=False)

    _generate_readable_packet(packet)

    logger.info(f"Evaluation packet saved → {out_path}")
    return packet


def _generate_readable_packet(packet: dict):
    lines = []
    lines.append("=" * 70)
    lines.append("HUMAN EVALUATION SESSION — INTELLIGENT VIDEO EXPLORATION SYSTEM")
    lines.append("=" * 70)
    lines.append("")
    lines.append(packet["instructions_for_facilitator"])
    lines.append("")

    lines.append("-" * 70)
    lines.append("PART 1: TASK-BASED EVALUATION")
    lines.append("-" * 70)
    for task in packet["tasks"]:
        lines.append(f"\n{task['task_id'].upper()}")
        lines.append(f"Instructions: {task['instructions']}")
        lines.append(f"Record: {', '.join(task['metrics_to_record'])}")

    lines.append("\n" + "-" * 70)
    lines.append("PART 2: SUMMARY QUALITY RATINGS")
    lines.append("-" * 70)
    for q in packet["summary_quality_questions"]:
        lines.append(f"\nVideo: {q['video_title']}")
        lines.append(f"Summary shown: \"{q['summary_shown'][:200]}...\"")
        for dim in q["rating_dimensions"]:
            lines.append(f"  Rate {dim['dimension']} (1-5): {dim['question']}")

    lines.append("\n" + "-" * 70)
    lines.append("PART 3: COLLECTION ANALYSIS EXPERT FEEDBACK")
    lines.append("-" * 70)
    for q in packet["collection_analysis_questions"]:
        lines.append(f"\n{q['content_shown']}")
        for dim in q["rating_dimensions"]:
            lines.append(f"  Rate {dim['dimension']} (1-5): {dim['question']}")

    lines.append("\n" + "-" * 70)
    lines.append("PART 4: SATISFACTION SURVEY")
    lines.append("-" * 70)
    for q in packet["satisfaction_survey"]["questions"]:
        lines.append(f"  [{q['id']}] {q['text']} ({q['scale']})")

    out_path = HUMAN_EVAL_DIR / "evaluation_packet_readable.txt"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    logger.info(f"Readable packet saved → {out_path}")


def generate_response_template() -> dict:
    packet_path = HUMAN_EVAL_DIR / "evaluation_packet.json"
    if not packet_path.exists():
        logger.error("Run generate_evaluation_packet() first.")
        return {}

    with open(packet_path) as f:
        packet = json.load(f)

    template = {
        "participant_id":   "P1",
        "participant_role":  "student | educator | researcher",
        "session_date":      "YYYY-MM-DD",
        "task_responses": [
            {
                "task_id": task["task_id"],
                "success": None,
                "time_seconds": None,
                "notes": ""
            }
            for task in packet["tasks"]
        ],
        "summary_quality_responses": [
            {
                "question_id": q["question_id"],
                "informativeness_score": None,
                "coherence_score": None
            }
            for q in packet["summary_quality_questions"]
        ],
        "collection_analysis_responses": [
            {
                "question_id": q["question_id"],
                "score": None
            }
            for q in packet["collection_analysis_questions"]
        ],
        "satisfaction_responses": {
            q["id"]: None for q in packet["satisfaction_survey"]["questions"]
        }
    }

    out_path = HUMAN_EVAL_DIR / "response_template.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(template, f, indent=2, ensure_ascii=False)

    logger.info(f"Response template saved → {out_path}")
    logger.info("Copy this file once per participant: response_P1.json, response_P2.json, etc.")
    return template


def analyze_responses(response_files: Optional[list[str]] = None) -> dict:
    if response_files:
        paths = [HUMAN_EVAL_DIR / f for f in response_files]
    else:
        paths = sorted(HUMAN_EVAL_DIR.glob("response_*.json"))

    if not paths:
        logger.warning(
            "No response files found. Expected files named response_P1.json, response_P2.json, etc. "
            "in data/processed/subtask2_summarization/human_evaluation/"
        )
        return {"error": "no responses found", "n_participants": 0}

    all_responses = []
    for path in paths:
        with open(path) as f:
            all_responses.append(json.load(f))

    n = len(all_responses)
    logger.info(f"Analyzing {n} participant responses")

    task_stats = {}
    for resp in all_responses:
        for task in resp.get("task_responses", []):
            tid = task["task_id"]
            task_stats.setdefault(tid, {"successes": 0, "total": 0, "times": []})
            task_stats[tid]["total"] += 1
            if task.get("success"):
                task_stats[tid]["successes"] += 1
            if task.get("time_seconds") is not None:
                task_stats[tid]["times"].append(task["time_seconds"])

    task_summary = {}
    for tid, stats in task_stats.items():
        task_summary[tid] = {
            "success_rate":       round(stats["successes"] / stats["total"], 3) if stats["total"] else 0,
            "avg_time_seconds":   round(sum(stats["times"]) / len(stats["times"]), 1) if stats["times"] else None,
            "n_responses":        stats["total"]
        }

    info_scores, coh_scores = [], []
    for resp in all_responses:
        for sq in resp.get("summary_quality_responses", []):
            if sq.get("informativeness_score") is not None:
                info_scores.append(sq["informativeness_score"])
            if sq.get("coherence_score") is not None:
                coh_scores.append(sq["coherence_score"])

    collection_scores = []
    for resp in all_responses:
        for ca in resp.get("collection_analysis_responses", []):
            if ca.get("score") is not None:
                collection_scores.append(ca["score"])

    satisfaction_keys = ["ease_of_use", "summary_quality", "comparison_value",
                          "search_effectiveness", "overall_satisfaction"]
    satisfaction_aggregates = {}
    for key in satisfaction_keys:
        vals = [
            resp["satisfaction_responses"].get(key)
            for resp in all_responses
            if resp.get("satisfaction_responses", {}).get(key) is not None
        ]
        satisfaction_aggregates[key] = round(sum(vals) / len(vals), 2) if vals else None

    qualitative_feedback = [
        resp["satisfaction_responses"].get("qualitative_feedback", "")
        for resp in all_responses
        if resp.get("satisfaction_responses", {}).get("qualitative_feedback")
    ]

    report = {
        "n_participants":            n,
        "task_performance":          task_summary,
        "summary_quality": {
            "avg_informativeness": round(sum(info_scores) / len(info_scores), 2) if info_scores else None,
            "avg_coherence":       round(sum(coh_scores) / len(coh_scores), 2) if coh_scores else None,
            "n_ratings":           len(info_scores)
        },
        "collection_analysis_expert_rating": {
            "avg_score": round(sum(collection_scores) / len(collection_scores), 2) if collection_scores else None,
            "n_ratings": len(collection_scores)
        },
        "satisfaction": satisfaction_aggregates,
        "qualitative_feedback": qualitative_feedback
    }

    out_path = HUMAN_EVAL_DIR / "human_evaluation_report.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    logger.info(f"Human evaluation report saved → {out_path}")
    logger.info(f"  Participants: {n}")
    logger.info(f"  Avg informativeness: {report['summary_quality']['avg_informativeness']}")
    logger.info(f"  Avg coherence: {report['summary_quality']['avg_coherence']}")
    logger.info(f"  Avg satisfaction: {satisfaction_aggregates.get('overall_satisfaction')}")

    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "analyze":
        analyze_responses()
    elif len(sys.argv) > 1 and sys.argv[1] == "template":
        generate_response_template()
    else:
        generate_evaluation_packet()
        generate_response_template()
        print("\nNext steps:")
        print("1. Open: data/processed/subtask2_summarization/human_evaluation/evaluation_packet_readable.txt")
        print("2. Run sessions with 4-7 real participants using that document")
        print("3. Copy response_template.json to response_P1.json, response_P2.json, etc. and fill in")
        print("4. Run: python -m backend.app.subtask2_summarization.human_evaluation.human_evaluation analyze")