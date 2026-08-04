"""
metadata_extraction.py — Fast metadata extraction via Ollama
=============================================================
Combines two sources:
  1. Slide captions JSON (first few slides) — best source for title/author/org
     since names are written on the title slide even if never spoken aloud.
  2. Transcript segments (head + sample) — best source for topics/domain/keywords.

One single Ollama call. Runs in ~10-20 seconds.
"""

import json
import argparse
import time
import urllib.request
import urllib.error
from pathlib import Path


OLLAMA_URL    = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.2:latest"

HEAD_SEGMENTS    = 15    # first N transcript segments (intro speech)
SAMPLE_SEGMENTS  = 20    # evenly sampled from the rest
HEAD_SLIDES      = 6     # first N slide captions (title slide area)
MAX_CHARS        = 6000  # hard cap on total prompt text


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

PROMPT_TEMPLATE = """\
You are a metadata extraction assistant for educational video transcripts.
Extract metadata from the sources below and return ONLY valid JSON.
No markdown fences, no explanation — raw JSON only.

SLIDE TEXT (from first slides — most reliable for title/author/organization):
{slide_text}

TRANSCRIPT EXCERPTS (head + sample — use for topics/domain/keywords):
{transcript_excerpts}

Rules:
- Prefer slide text for title, author, and organization.
- If author is not spoken but a name appears on a slide, use that.
- Author may be listed as: lecturer, instructor, presenter, professor, speaker, researcher.
- Organization may be a university, company, lab, department, or institute.
- If a field is truly unknown, use an empty string or empty list.
- NEVER use generic words like "Lecturer", "Professor", "Speaker", "University", "Institution".
- Return empty string for author and organization if the real name is not found.
- For domain: be broad and consistent. Prefer the parent field over sub-topics.
  e.g. if content covers embeddings, transformers, CNNs — domain is "Machine Learning" not "Embeddings".
  e.g. if content covers proofs, induction, sets — domain is "Mathematics" not "Mathematical Induction".
- Domain should be the same for videos that are clearly part of the same course or series.

Return exactly this JSON schema:
{{
  "title": "<video or lecture title>",
  "author": "<exact full name only if clearly stated — empty string if not found>",
  "organization": "<exact institution name only if clearly visible — empty string if not found>",
  "domain": "<subject area, e.g. Machine Learning, Finance, Biology>",
  "description": "<2-3 sentence summary of the whole video>",
  "main_topics": ["<topic>", "<topic>", "<topic>"],
  "keywords": ["<keyword>", "<keyword>", "<keyword>"],
  "entities": [
    {{"text": "<name>", "label": "<person|organization|technology|product|location>", "mentions": 1}}
  ],
  "language": "<ISO 639-1 code, e.g. en>"
}}"""


# ---------------------------------------------------------------------------
# Ollama helpers
# ---------------------------------------------------------------------------

def check_ollama() -> bool:
    try:
        urllib.request.urlopen("http://localhost:11434", timeout=3)
        return True
    except Exception:
        return False


def check_model(model: str) -> bool:
    try:
        r = urllib.request.urlopen("http://localhost:11434/api/tags", timeout=5)
        d = json.loads(r.read().decode())
        return any(model in m["name"] for m in d.get("models", []))
    except Exception:
        return False


def call_ollama(prompt: str, model: str, num_predict: int = 700) -> str:
    payload = json.dumps({
        "model":  model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": num_predict,
            "num_ctx":     4096,
        },
    }).encode()
    req = urllib.request.Request(
        OLLAMA_URL, data=payload,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode()).get("response", "")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Ollama unreachable: {e}. Run: ollama serve")


def parse_json(text: str) -> dict | None:
    text = text.strip()
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return None


# ---------------------------------------------------------------------------
# Build inputs
# ---------------------------------------------------------------------------

def build_slide_text(slides: list[dict]) -> str:
    """
    Take captions from the first HEAD_SLIDES slides.
    These are the title/intro slides most likely to show author/org.
    Also pull any video_metadata already extracted by frame_captioner.
    """
    lines = []
    for s in slides[:HEAD_SLIDES]:
        cap = s.get("caption", "").strip()
        if cap and cap != "[NO SLIDE]":
            ts = s.get("slide_start_str") or s.get("timestamp", "")
            lines.append(f"[{ts}] {cap}")
    return "\n".join(lines)


def build_transcript_sample(segments: list[dict]) -> str:
    """First HEAD_SEGMENTS + SAMPLE_SEGMENTS evenly spaced, capped at MAX_CHARS."""
    head   = segments[:HEAD_SEGMENTS]
    rest   = segments[HEAD_SEGMENTS:]

    if len(rest) > SAMPLE_SEGMENTS:
        step   = len(rest) / SAMPLE_SEGMENTS
        sample = [rest[int(i * step)] for i in range(SAMPLE_SEGMENTS)]
    else:
        sample = rest

    lines, total = [], 0
    for s in head + sample:
        text = s.get("text", "").strip()
        if not text:
            continue
        line = f"[{s.get('start', 0):.0f}s] {text}"
        if total + len(line) > MAX_CHARS:
            break
        lines.append(line)
        total += len(line)

    return "\n".join(lines)


def enrich_mention_counts(segments: list[dict], video_meta: dict) -> dict:
    """Count how often each entity name appears in the full transcript."""
    full_text = " ".join(s.get("text", "") for s in segments).lower()
    for ent in video_meta.get("entities", []):
        name = ent.get("text", "")
        if name:
            ent["mentions"] = full_text.count(name.lower())
    video_meta.get("entities", []).sort(
        key=lambda e: e.get("mentions", 0), reverse=True
    )
    return video_meta


def merge_frame_captioner_metadata(video_meta: dict, captions_data: dict) -> dict:
    fc_meta = captions_data.get("video_metadata", {})

    # Title: always prefer exact slide text from vision model
    fc_title = fc_meta.get("title", "").strip()
    if fc_title:
        video_meta["title"] = fc_title   # overwrite unconditionally

    # Author + org: prefer vision if non-empty
    for field in ("author", "organization"):
        fc_val  = fc_meta.get(field, "").strip()
        llm_val = video_meta.get(field, "").strip()
        if fc_val and not llm_val:
            video_meta[field] = fc_val
        elif fc_val and llm_val and len(fc_val) > len(llm_val):
            video_meta[field] = fc_val

    return video_meta


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Fast video metadata extraction using slide captions + transcript"
    )
    parser.add_argument("--transcript", required=True,
                        help="Transcript JSON path (from asr.py)")
    parser.add_argument("--captions",   default=None,
                        help="Slide captions JSON path (from frame_captioning.py) — "
                             "optional but strongly recommended for author/title detection")
    parser.add_argument("--output",     required=True,
                        help="Output metadata JSON path")
    parser.add_argument("--model",      default=DEFAULT_MODEL,
                        help=f"Ollama model (default: {DEFAULT_MODEL})")
    args = parser.parse_args()

    # ------------------------------------------------------------------ checks
    if not check_ollama():
        raise RuntimeError("Ollama is not running. Start it with: ollama serve")
    if not check_model(args.model):
        raise RuntimeError(
            f"Model '{args.model}' not found.\n"
            f"Run: ollama pull {args.model}"
        )

    # ---------------------------------------------------------- load inputs
    print("Loading transcript …")
    with open(args.transcript, "r", encoding="utf-8") as f:
        transcript_data = json.load(f)
    segments: list[dict] = transcript_data.get("segments", [])
    duration = segments[-1].get("end", 0.0) if segments else 0.0
    print(f"  {len(segments)} segments  |  duration: {duration:.0f}s")

    captions_data: dict = {}
    slides: list[dict]  = []
    if args.captions and Path(args.captions).exists():
        print("Loading slide captions …")
        with open(args.captions, "r", encoding="utf-8") as f:
            captions_data = json.load(f)
        slides = captions_data.get("slides", [])
        print(f"  {len(slides)} slides loaded  "
              f"(using first {min(HEAD_SLIDES, len(slides))} for author/title)")
    else:
        print("  No captions file provided — author/title detection may be less accurate")

    # ---------------------------------------------------------- build inputs
    slide_text          = build_slide_text(slides)
    transcript_excerpts = build_transcript_sample(segments)

    if not slide_text:
        slide_text = "(no slide captions available)"

    # --------------------------------------------------------- single LLM call
    prompt = PROMPT_TEMPLATE.format(
        slide_text          = slide_text,
        transcript_excerpts = transcript_excerpts,
    )

    print(f"Using model : {args.model}")
    print("Extracting metadata (single Ollama call) …")
    t0      = time.time()
    raw     = call_ollama(prompt, args.model)
    elapsed = time.time() - t0
    print(f"  Done in {elapsed:.1f}s")

    video_meta = parse_json(raw)
    if not video_meta:
        print("  [warn] Could not parse JSON — saving raw response as fallback")
        video_meta = {"raw_response": raw, "error": "parse failed"}
    else:
        # Prefer frame captioner's vision-based title/author if available
        video_meta = merge_frame_captioner_metadata(video_meta, captions_data)
        # Enrich entity mention counts from full transcript
        video_meta = enrich_mention_counts(segments, video_meta)

    # ----------------------------------------------------------------- output
    output = {
        "source_metadata": transcript_data.get("metadata", {}),
        "video_metadata":  video_meta,
        "entities":        video_meta.get("entities", []),
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Saved metadata → {output_path}")
    for field in ("title", "author", "organization", "domain", "language"):
        val = video_meta.get(field, "")
        if val:
            print(f"  {field:<14}: {val}")
    if video_meta.get("main_topics"):
        print(f"  main_topics   : {', '.join(video_meta['main_topics'])}")


if __name__ == "__main__":
    main()