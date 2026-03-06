import json
import os

def load_stubs(json_path="stub_data.json"):
    """
    Load the video dataset from stub_data.json and return structured data
    ready for the Streamlit dashboard.
    """

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"JSON file not found at: {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    videos = data.get("videos", [])
    similarities = data.get("similarities", [])
    shared_topics = data.get("shared_topics", {})

    # -----------------------------
    # Preprocess videos
    # -----------------------------
    for idx, video in enumerate(videos):

        # Ensure topics exist for timeline visualization
        if "topics" not in video or not video["topics"]:
            video["topics"] = [
                {
                    "start": ch["start"],
                    "end": ch["end"],
                    "topic": ch["title"]
                }
                for ch in video.get("chapters", [])
            ]

        # Ensure transcript exists for search feature
        if "transcript" not in video or not video["transcript"]:
            transcript = []
            for ch in video.get("chapters", []):
                transcript.append({"start": ch["start"], "text": ch.get("summary_short", "")})
            video["transcript"] = transcript

        # Add short title for UI labels (avoid duplicate names)
        short_title = video["title"][:20]
        video["short_title"] = short_title

    # -----------------------------
    # Ensure similarities is a square matrix
    # -----------------------------
    n = len(videos)
    if len(similarities) != n or any(len(row) != n for row in similarities):
        raise ValueError("Similarity matrix must be square and match number of videos.")

    return {
        "videos": videos,
        "similarities": similarities,
        "shared_topics": shared_topics
    }