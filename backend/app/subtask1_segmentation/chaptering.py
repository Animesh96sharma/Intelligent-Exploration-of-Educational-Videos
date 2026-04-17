import argparse
import json
import logging
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("chaptering")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
OLLAMA_URL    = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.1:8b"


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass
class Chapter:
    chapter_id:     str
    chapter_index:  int
    title:          str
    start_time:     float          # seconds
    end_time:       float          # seconds
    transcript:     str            # full speech text for this chapter
    frame_captions: list[str]      # visual captions that fall in this chapter
    keywords:       list[str]      # key terms extracted by LLM

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def seconds_to_hms(seconds: float) -> str:
    total_s = int(seconds)
    h = total_s // 3600
    m = (total_s % 3600) // 60
    s = total_s % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def hms_to_seconds(hms: str) -> float:
    hms = hms.strip()
    parts = hms.split(":")
    try:
        parts = [float(p) for p in parts]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        elif len(parts) == 2:
            return parts[0] * 60 + parts[1]
        return parts[0]
    except ValueError:
        return 0.0


# ---------------------------------------------------------------------------
# Load inputs
# ---------------------------------------------------------------------------
def load_transcript(path: Path) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if "segments" not in data:
        log.error(f"No 'segments' key found in {path}")
        sys.exit(1)
    log.info(f"Loaded {len(data['segments'])} transcript segments")
    return data["segments"]


def load_captions(path: Path) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    caps = data["captions"]
    last_caption = None
    enriched = []

    for c in caps:
        text = c["caption"].strip()
        changed = (text != last_caption and text != "[unchanged slide]")
        enriched.append({
            "timestamp": c["timestamp"],
            "caption": text,
            "slide_changed": changed
        })
        if changed:
            last_caption = text
    return enriched


# ---------------------------------------------------------------------------
# Prompt building  (two-stage: boundaries first, then enrich)
# ---------------------------------------------------------------------------
def build_boundary_prompt(
    transcript_segments: list[dict],
    captions: list[dict],
    video_duration: float,
) -> str:
    """
    Stage 1 prompt: ask the LLM only to find chapter boundaries and titles.

    Key improvements over the old single prompt:
    - Explicitly tells the LLM what a real boundary looks like vs a false one
    - Shows a worked example so the LLM understands the expected reasoning
    - Asks it to justify each boundary (chain-of-thought), then emit JSON
    - Uses a condensed timeline to stay within context limits
    """

    # Build condensed timeline — group transcript into ~30s windows
    # to reduce token count while preserving temporal structure
    timeline_lines = []

    # Add transcript segments
    for seg in transcript_segments:
        timeline_lines.append(
            (seg["start"], "SPEECH", seg["text"].strip())
        )

    # Add only *distinct* visual captions (skip "[unchanged slide]")
    for cap in captions:
        c = cap.get("caption", "").strip()
        if c and c != "[unchanged slide]":
            timeline_lines.append((cap["timestamp"], "VISUAL", c))

    timeline_lines.sort(key=lambda x: x[0])

    content_block = "\n".join(
        f"[{seconds_to_hms(ts)}] [{kind}] {text}"
        for ts, kind, text in timeline_lines
    )

    duration_str = seconds_to_hms(video_duration)
    duration_min = video_duration / 60

    prompt = f"""You are an expert video editor creating chapters for an educational lecture video.

VIDEO DURATION: {duration_str} ({duration_min:.1f} minutes)

YOUR TASK:
Identify the timestamps where the lecturer genuinely transitions to a NEW topic or concept.
Then output a JSON array of chapter boundaries.

WHAT IS A REAL BOUNDARY (use these):
- The speaker explicitly says transition phrases: "Now let's move on to...", "Next we will cover...",
  "That brings us to...", "Let's now look at...", "Moving on...", "The next topic is..."
- A new slide appears AND the speech content changes to a clearly different concept
- The speaker finishes one complete concept and begins another unrelated one
- A new section heading appears on a slide

WHAT IS NOT A BOUNDARY (ignore these):
- The speaker is still elaborating or giving examples of the SAME concept
- A slide changes but the speech continues the same topic
- Short pauses or filler phrases ("So...", "Um...", "Right...")
- Questions and answers that stay on the same topic

CONSTRAINTS:
- First chapter MUST start at 00:00:00
- Minimum chapter length: 3 minutes (unless it is the last chapter)
- Maximum chapter length: 15 minutes
- Aim for {max(3, int(duration_min // 8))} to {min(15, int(duration_min // 4))} chapters total
- Chapter titles: 4–8 words, specific and descriptive (e.g. "Backpropagation Algorithm and Gradient Flow")
  NOT generic (e.g. "Introduction", "Part 1", "Overview")

=== TIMESTAMPED CONTENT ===
{content_block}
=== END OF CONTENT ===

First, briefly identify the transition phrases or visual changes you found (2–3 sentences).
Then output ONLY a valid JSON array in exactly this format, with no markdown or code fences:
[
  {{"start": "HH:MM:SS", "title": "Specific Chapter Title"}},
  {{"start": "HH:MM:SS", "title": "Specific Chapter Title"}}
]"""

    return prompt


def build_keywords_prompt(chapter_transcript: str, chapter_title: str) -> str:
    """
    Stage 2 prompt: given a chapter's transcript, extract keywords.
    Kept separate and small so it runs fast and fits in context easily.
    """
    return f"""Extract the 5 to 8 most important technical keywords or key phrases from this lecture chapter transcript.
These should be specific terms a student would search for or highlight in notes.

Chapter title: {chapter_title}

Transcript:
{chapter_transcript[:3000]}

Respond with ONLY a JSON array of strings. No explanation, no markdown, no code fences.
Example: ["gradient descent", "learning rate", "loss function"]"""


# ---------------------------------------------------------------------------
# Ollama communication
# ---------------------------------------------------------------------------
def check_ollama_running() -> bool:
    try:
        urllib.request.urlopen("http://localhost:11434", timeout=3)
        return True
    except Exception:
        return False


def check_model_available(model: str) -> bool:
    try:
        req = urllib.request.urlopen("http://localhost:11434/api/tags", timeout=5)
        data = json.loads(req.read().decode())
        available = [m["name"] for m in data.get("models", [])]
        return any(model in m for m in available)
    except Exception:
        return False


def call_ollama(
    prompt: str,
    model: str,
    temperature: float = 0.1,
    num_predict: int = 2048,
) -> str:
    """
    Send a prompt to Ollama and return the response text.

    num_predict raised from 1024 → 2048 to avoid cut-off responses
    on longer videos with many chapters.
    """
    payload = json.dumps({
        "model":  model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": num_predict,
            "num_ctx":     32768,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    log.info(f"Calling Ollama ({model}) …")
    t0 = time.time()

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            result = json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        log.error(f"Could not reach Ollama: {e}")
        log.error("Make sure Ollama is running:  ollama serve")
        sys.exit(1)

    elapsed = time.time() - t0
    log.info(f"Ollama responded in {elapsed:.1f}s")
    return result.get("response", "")


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------
def parse_boundary_response(response: str, video_duration: float) -> list[dict]:
    """
    Parse the LLM's boundary response into a list of {start, title} dicts.
    Three fallback strategies handle imperfect LLM output.
    """

    # Strategy 1: direct JSON parse
    try:
        data = json.loads(response.strip())
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    # Strategy 2: extract JSON array from within prose
    match = re.search(r'\[\s*\{.*?\}\s*\]', response, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass

    # Strategy 3: line-by-line HH:MM:SS - Title pattern
    log.warning("JSON parse failed — trying line-by-line fallback")
    pattern = re.compile(r'(\d{1,2}:\d{2}:\d{2})\s*[-–:]\s*(.+)')
    matches = pattern.findall(response)
    if matches:
        return [{"start": m[0], "title": m[1].strip()} for m in matches]

    log.error("Could not parse LLM boundary response.")
    log.error(f"Raw response:\n{response}")
    sys.exit(1)


def parse_keywords_response(response: str) -> list[str]:
    """Parse keyword JSON array from LLM response, with fallback."""
    try:
        data = json.loads(response.strip())
        if isinstance(data, list):
            return [str(k).strip() for k in data if k]
    except json.JSONDecodeError:
        pass

    # Fallback: extract quoted strings
    return re.findall(r'"([^"]+)"', response)


# ---------------------------------------------------------------------------
# Chapter assembly
# ---------------------------------------------------------------------------
def assemble_chapters(
    raw_boundaries: list[dict],
    transcript_segments: list[dict],
    captions: list[dict],
    video_duration: float,
    video_stem: str,
) -> list[Chapter]:
    """
    Convert raw {start, title} boundaries into full Chapter objects by:
    - Enforcing first chapter at 00:00:00
    - Sorting and deduplicating boundaries
    - Collecting transcript text for each chapter window
    - Collecting frame captions for each chapter window
    Keywords are filled in later by a second LLM call.
    """

    # Ensure chapter 1 starts at 0
    if not raw_boundaries or hms_to_seconds(raw_boundaries[0]["start"]) > 5.0:
        raw_boundaries.insert(0, {"start": "00:00:00", "title": "Introduction"})

    # Sort by time
    raw_boundaries.sort(key=lambda x: hms_to_seconds(x["start"]))

    # Deduplicate boundaries that are within 60s of each other
    deduped = [raw_boundaries[0]]
    for b in raw_boundaries[1:]:
        if hms_to_seconds(b["start"]) - hms_to_seconds(deduped[-1]["start"]) >= 60:
            deduped.append(b)
    raw_boundaries = deduped

    chapters = []
    for i, item in enumerate(raw_boundaries):
        start = hms_to_seconds(item["start"])
        end   = hms_to_seconds(raw_boundaries[i + 1]["start"]) \
                if i + 1 < len(raw_boundaries) else video_duration
        title = item.get("title", f"Chapter {i + 1}").strip()

        # Collect transcript text for this time window
        speech_parts = [
            seg["text"].strip()
            for seg in transcript_segments
            if seg["start"] >= start and seg["end"] <= end
        ]
        chapter_transcript = " ".join(speech_parts)

        # Collect frame captions for this time window
        chapter_captions = [
            cap["caption"].strip()
            for cap in captions
            if cap["timestamp"] >= start and cap["timestamp"] <= end
            and cap["caption"].strip()
            and cap["caption"].strip() != "[unchanged slide]"
        ]

        # Build a stable chapter_id from the video stem and index
        chapter_id = f"{video_stem}_ch{i + 1}"

        chapters.append(Chapter(
            chapter_id     = chapter_id,
            chapter_index  = i + 1,
            title          = title,
            start_time     = round(start),
            end_time       = round(end),
            transcript     = chapter_transcript,
            frame_captions = chapter_captions,
            keywords       = [],   # filled in by enrich_keywords()
        ))

    log.info(f"Assembled {len(chapters)} chapters")
    return chapters


def enrich_keywords(
    chapters: list[Chapter],
    model: str,
    temperature: float,
) -> list[Chapter]:
    """
    Second LLM pass: call Ollama once per chapter to extract keywords.
    Uses a short focused prompt so each call is fast (~2–5s).
    """
    log.info("Extracting keywords for each chapter …")
    for ch in chapters:
        if not ch.transcript:
            ch.keywords = []
            continue
        prompt   = build_keywords_prompt(ch.transcript, ch.title)
        response = call_ollama(prompt, model, temperature, num_predict=256)
        ch.keywords = parse_keywords_response(response)
        log.info(f"  Ch{ch.chapter_index} keywords: {ch.keywords}")
    return chapters


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
def save_chapters(chapters: list[Chapter], output_path: Path, metadata: dict) -> None:
    output = {
        "metadata": metadata,
        "chapters": [c.to_dict() for c in chapters],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    log.info(f"Chapters saved → {output_path}")


def print_chapters(chapters: list[Chapter]) -> None:
    print("\n" + "═" * 70)
    print(f"  {'CHAPTERS':^66}")
    print("═" * 70)
    for ch in chapters:
        duration_min = (ch.end_time - ch.start_time) / 60
        print(
            f"  {ch.chapter_index:>2}.  "
            f"[{seconds_to_hms(ch.start_time)} → {seconds_to_hms(ch.end_time)}]  "
            f"({duration_min:.1f} min)  {ch.title}"
        )
        if ch.keywords:
            print(f"        Keywords: {', '.join(ch.keywords)}")
    print("═" * 70 + "\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run(
    transcript_path: str,
    captions_path: str,
    output_path: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.1,
    skip_keywords: bool = False,
) -> list[Chapter]:
    """
    Full chaptering pipeline:
      transcript + captions
        → Stage 1: boundary detection (one LLM call)
        → Stage 2: keyword extraction (one LLM call per chapter)
        → enriched Chapter JSON
    """

    transc_path = Path(transcript_path).resolve()
    caps_path   = Path(captions_path).resolve()
    out         = Path(output_path) if output_path else \
                  transc_path.parent / (transc_path.stem.replace("_transcript", "") + "_chapters.json")
    video_stem  = transc_path.stem.replace("_transcript", "")

    log.info(f"Transcript : {transc_path}")
    log.info(f"Captions   : {caps_path}")
    log.info(f"Output     : {out}")
    log.info(f"Model      : {model}")

    # ---- Check Ollama -----------------------------------------------------------
    if not check_ollama_running():
        log.error(
            "Ollama is not running.\n"
            "Start it: open a terminal and run  ollama serve\n"
            "Then try again."
        )
        sys.exit(1)
    log.info("Ollama is running ✓")

    if not check_model_available(model):
        log.error(
            f"Model '{model}' is not pulled.\n"
            f"Run:  ollama pull {model}"
        )
        sys.exit(1)
    log.info(f"Model '{model}' is available ✓")

    # ---- Load inputs ------------------------------------------------------------
    transcript_segments = load_transcript(transc_path)
    captions            = load_captions(caps_path)
    video_duration      = transcript_segments[-1]["end"] if transcript_segments else 0.0
    log.info(f"Video duration: {seconds_to_hms(video_duration)} ({video_duration:.0f}s)")

    # ---- Stage 1: boundary detection --------------------------------------------
    boundary_prompt = build_boundary_prompt(transcript_segments, captions, video_duration)
    log.info(f"Boundary prompt: ~{len(boundary_prompt) // 4} tokens")
    boundary_response = call_ollama(boundary_prompt, model, temperature, num_predict=2048)
    raw_boundaries    = parse_boundary_response(boundary_response, video_duration)
    log.info(f"LLM found {len(raw_boundaries)} boundaries")

    # ---- Assemble chapters with transcript + captions ---------------------------
    chapters = assemble_chapters(
        raw_boundaries, transcript_segments, captions, video_duration, video_stem
    )

    # ---- Stage 2: keyword extraction --------------------------------------------
    if not skip_keywords:
        chapters = enrich_keywords(chapters, model, temperature)
    else:
        log.info("Skipping keyword extraction (--skip-keywords)")

    # ---- Save -------------------------------------------------------------------
    metadata = {
        "transcript":             str(transc_path),
        "captions":               str(caps_path),
        "model":                  model,
        "temperature":            temperature,
        "video_duration_seconds": round(video_duration, 1),
        "num_chapters":           len(chapters),
    }
    save_chapters(chapters, out, metadata)
    print_chapters(chapters)

    return chapters


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate enriched video chapters from transcript and frame captions using a local LLM.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--transcript", required=True,
                        help="Path to transcript JSON from asr.py")
    parser.add_argument("--captions",   required=True,
                        help="Path to captions JSON from frame_captioning.py")
    parser.add_argument("--output",     default=None,
                        help="Output JSON path. Defaults to <name>_chapters.json")
    parser.add_argument("--model",      default=DEFAULT_MODEL,
                        help="Ollama model name (e.g. llama3.1:8b, llama3.2:latest)")
    parser.add_argument("--temperature", type=float, default=0.1,
                        help="LLM sampling temperature. Keep low (0.0–0.2).")
    parser.add_argument("--skip-keywords", action="store_true",
                        help="Skip the keyword extraction pass (faster, no keywords in output).")
    args = parser.parse_args()

    run(
        transcript_path = args.transcript,
        captions_path   = args.captions,
        output_path     = args.output,
        model           = args.model,
        temperature     = args.temperature,
        skip_keywords   = args.skip_keywords,
    )