"""
chaptering.py  –  Hybrid slide-boundary + LLM chapter detection (v3)
=====================================================================

CHANGES IN v3
-------------
1.  SEMANTIC BOUNDARY DETECTION  (replaces blind LLM clustering)
    Instead of showing the LLM the entire slide list and asking it to
    guess chapter breaks, we now:

      Stage A (no LLM)  — compute cosine distance between adjacent slide
                          embeddings (produced by slide_captioner v4).
                          High distance = topic shift = boundary candidate.
                          Pick the top N candidates automatically.

      Stage B (one LLM) — show the LLM only the 6-slide context window
                          around each candidate and ask it to confirm /
                          reject + give a title.  Prompt is ~10x shorter
                          and the task is much easier.

    Falls back to uniform time-based split if no embeddings are present
    (i.e. if you ran the old slide_captioner).

2.  All other behaviour (transcript aggregation, keyword extraction,
    output format) is unchanged.

PIPELINE
--------
    slide_captions.json  +  transcript.json
        ↓
    1. Score every slide transition by cosine distance of embeddings
    ↓
    2. Pick top-(N-1) candidates respecting a minimum gap
    ↓
    3. LLM validates candidates with compact context-window prompt
    ↓
    4. Assemble Chapter objects with transcript + captions per window
    ↓
    5. Keyword extraction (one small LLM call per chapter)
    ↓
    chapters.json

USAGE
-----
python chaptering.py \\
    --transcript  transcript.json \\
    --captions    slide_captions.json \\
    --output      chapters.json \\
    [--model      llama3.1:8b] \\
    [--skip-keywords]
"""

import argparse
import json
import logging
import math
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

OLLAMA_URL    = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.1:8b"


# ── data model ────────────────────────────────────────────────────────────────
@dataclass
class Chapter:
    chapter_id:     str
    chapter_index:  int
    title:          str
    start_time:     float
    end_time:       float
    transcript:     str
    frame_captions: list[str]
    keywords:       list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


# ── helpers ───────────────────────────────────────────────────────────────────
def hms(sec: float) -> str:
    s = int(sec)
    return f"{s//3600:02d}:{(s%3600)//60:02d}:{s%60:02d}"


def from_hms(s: str) -> float:
    parts = [float(x) for x in s.strip().split(":")]
    if len(parts) == 3:
        return parts[0]*3600 + parts[1]*60 + parts[2]
    if len(parts) == 2:
        return parts[0]*60 + parts[1]
    return parts[0]


# ── load inputs ───────────────────────────────────────────────────────────────
def load_transcript(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    segs = data.get("segments", [])
    log.info(f"Loaded {len(segs)} transcript segments")
    return segs


def load_slides(path: Path) -> list[dict]:
    """
    Load slide_captioner output.
    Accepts both the new format (key: 'slides') and old format (key: 'captions').
    """
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    slides = data.get("slides") or data.get("captions") or []

    normalised = []
    for s in slides:
        normalised.append({
            "slide_id":   s.get("slide_id", s.get("segment_index", 0)),
            "start":      s.get("slide_start", s.get("timestamp", 0.0)),
            "end":        s.get("slide_end",   s.get("segment_end", 0.0)),
            "caption":    s.get("caption", "").strip(),
            "transcript": s.get("transcript", s.get("speech_text", "")).strip(),
            "rep_ts":     s.get("representative_timestamp", s.get("timestamp", 0.0)),
            "embedding":  s.get("embedding"),   # may be None for old files
        })

    normalised = [
        s for s in normalised
        if s["caption"] and s["caption"] != "[NO SLIDE]"
    ]

    log.info(f"Loaded {len(normalised)} slides from captions file")
    has_emb = sum(1 for s in normalised if s.get("embedding"))
    log.info(f"  {has_emb}/{len(normalised)} slides have embeddings")
    return normalised


# ── Ollama ────────────────────────────────────────────────────────────────────
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


def call_ollama(prompt: str, model: str, temperature: float = 0.1,
                num_predict: int = 1024) -> str:
    payload = json.dumps({
        "model": model, "prompt": prompt, "stream": False,
        "options": {"temperature": temperature, "num_predict": num_predict, "num_ctx": 16384},
    }).encode()

    req = urllib.request.Request(
        OLLAMA_URL, data=payload,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    log.info(f"Calling Ollama ({model}) ...")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            result = json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        log.error(f"Ollama unreachable: {e}\nRun:  ollama serve")
        sys.exit(1)
    log.info(f"Ollama responded in {time.time()-t0:.1f}s")
    return result.get("response", "")


# ── STAGE A · cosine-distance boundary scoring ────────────────────────────────
def cosine_distance(a: list[float], b: list[float]) -> float:
    """1 − cosine_similarity. Range [0, 2]. 0 = identical, 2 = opposite."""
    dot = sum(x * y for x, y in zip(a, b))
    na  = math.sqrt(sum(x * x for x in a))
    nb  = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 1.0
    return 1.0 - dot / (na * nb)


def score_boundaries(slides: list[dict]) -> list[dict]:
    """
    Compute cosine distance between each pair of adjacent slides and store
    it as 'boundary_score' (raw) and 'boundary_score_smoothed' (±1 window).
    A large score means the topic likely changed between those two slides.
    """
    embs = [s.get("embedding") for s in slides]
    n    = len(slides)

    raw = []
    for i in range(n - 1):
        if embs[i] and embs[i + 1]:
            raw.append(cosine_distance(embs[i], embs[i + 1]))
        else:
            raw.append(0.0)
    raw.append(0.0)   # sentinel for last slide

    smoothed = []
    for i in range(n):
        vals = [raw[j] for j in range(max(0, i - 1), min(n, i + 2)) if raw[j] > 0]
        smoothed.append(sum(vals) / len(vals) if vals else 0.0)

    for i, s in enumerate(slides):
        s["boundary_score"]          = round(raw[i],      4)
        s["boundary_score_smoothed"] = round(smoothed[i], 4)

    return slides


def pick_candidate_boundaries(
    slides:          list[dict],
    target_chapters: int,
    min_gap_sec:     float = 180.0,
) -> list[int]:
    """
    Return slide indices (sorted) that are the best candidate chapter
    starts, based on semantic boundary scores.  Slide 0 is always the
    first chapter start and is NOT included in this list (it's added later).
    """
    scored = sorted(
        range(len(slides)),
        key=lambda i: slides[i].get("boundary_score_smoothed", 0.0),
        reverse=True,
    )

    selected: list[int] = []
    for idx in scored:
        if len(selected) >= target_chapters - 1:
            break
        if idx == 0:
            continue
        start = slides[idx].get("start", 0.0)
        too_close = any(
            abs(start - slides[s].get("start", 0.0)) < min_gap_sec
            for s in selected
        )
        if not too_close:
            selected.append(idx)

    selected.sort()
    log.info(f"Picked {len(selected)} boundary candidates from semantic scores")
    for idx in selected:
        s = slides[idx]
        log.info(
            f"  slide {s.get('slide_id','?'):>3}  [{hms(s.get('start', 0))}]  "
            f"score={s.get('boundary_score_smoothed', 0):.3f}  "
            f"{s.get('caption','')[:60]}"
        )
    return selected


# ── STAGE B · LLM validates candidates ───────────────────────────────────────
def build_validation_prompt(
    slides:          list[dict],
    candidates:      list[int],
    video_duration:  float,
    target_chapters: int,
) -> str:
    """
    Build a short prompt showing only the slides around each candidate
    boundary (3 before + 3 after).  The LLM confirms/rejects and titles.
    """
    n = len(slides)

    context_indices: set[int] = {0}
    for c in candidates:
        for offset in range(-3, 4):
            idx = c + offset
            if 0 <= idx < n:
                context_indices.add(idx)

    context_slides = sorted(context_indices)

    lines = []
    for idx in context_slides:
        s     = slides[idx]
        cap   = (s.get("caption") or "").strip()
        cap   = cap.split("\n")[0][:80] if len(cap) > 80 else cap
        score = s.get("boundary_score_smoothed", 0.0)
        marker = "  ◀ CANDIDATE" if idx in candidates else ""
        lines.append(
            f"  #{idx:03d}  [{hms(s.get('start', 0))}]  "
            f"(Δ={score:.2f}) {cap}{marker}"
        )

    context_block  = "\n".join(lines)
    candidate_list = ", ".join(f"#{c:03d}" for c in candidates)

    return f"""You are an expert video editor reviewing a lecture for chapter boundaries.

VIDEO: {hms(video_duration)} total  |  Aim for {target_chapters} chapters

Semantic analysis identified these CANDIDATE chapter boundaries: {candidate_list}
Context slides (3 before/after each candidate) are shown below.
Δ = topic-shift score (higher = more likely to be a real boundary).

CONTEXT SLIDES:
{context_block}

YOUR JOB:
1. Confirm or REJECT each candidate.  Reject if the content before and after
   is clearly the same topic, sub-topic, or running example.
2. You may add ONE extra boundary from the context slides if a major topic
   shift is visible but was missed.
3. Give each confirmed chapter a specific descriptive title (4-8 words).
   Chapter 1 MUST start at slide #000.

Respond with ONLY a JSON array.  No markdown, no explanation.  Example:
[
  {{"slide": 0,   "title": "Introduction to Information Retrieval"}},
  {{"slide": 12,  "title": "Boolean vs Vector Space Models"}},
  {{"slide": 31,  "title": "Evaluation Metrics and Benchmarks"}}
]"""


def build_keywords_prompt(transcript: str, title: str) -> str:
    return f"""Extract 5-8 important technical keywords from this lecture transcript.
Chapter: {title}
Transcript: {transcript[:2500]}
Respond with ONLY a JSON array of strings. No markdown. Example: ["term1", "term2"]"""


# ── response parsing ──────────────────────────────────────────────────────────
def parse_json_response(response: str) -> Optional[list]:
    """Try to extract a JSON array from an LLM response."""
    try:
        data = json.loads(response.strip())
        if isinstance(data, list) and data:
            return data
    except json.JSONDecodeError:
        pass
    match = re.search(r'\[\s*\{.*?\}\s*\]', response, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            if isinstance(data, list) and data:
                return data
        except json.JSONDecodeError:
            pass
    return None


def uniform_split(slides: list[dict], n_chapters: int = 5) -> list[dict]:
    """Divide slides into n equal groups as a fallback."""
    step = max(1, len(slides) // n_chapters)
    result = []
    for i in range(0, len(slides), step):
        result.append({
            "slide": slides[i]["slide_id"],
            "title": f"Section {len(result) + 1}"
        })
    return result


def parse_keywords_response(response: str) -> list[str]:
    try:
        data = json.loads(response.strip())
        if isinstance(data, list):
            return [str(k).strip() for k in data if k]
    except json.JSONDecodeError:
        pass
    return re.findall(r'"([^"]+)"', response)


# ── main chapter detection logic ──────────────────────────────────────────────
def detect_chapters(
    slides:          list[dict],
    video_duration:  float,
    target_chapters: int,
    model:           str,
    temperature:     float,
) -> list[dict]:
    """
    Two-stage chapter detection.

    If slides have embeddings (from slide_captioner v4):
      Stage A — score transitions by cosine distance, pick top candidates
      Stage B — LLM validates candidates with a compact context-window prompt

    Otherwise falls back to the old single-pass LLM clustering using slide
    titles only (same behaviour as chaptering v2).
    """
    has_embeddings = sum(1 for s in slides if s.get("embedding"))

    if has_embeddings < len(slides) * 0.5:
        log.warning(
            f"Only {has_embeddings}/{len(slides)} slides have embeddings. "
            "Falling back to title-based LLM clustering."
        )
        prompt   = _build_fallback_prompt(slides, video_duration, target_chapters)
        response = call_ollama(prompt, model, temperature, num_predict=1024)
        clusters = parse_json_response(response)
        if clusters:
            return clusters
        log.warning("Fallback LLM response unparseable — using uniform split")
        return uniform_split(slides, target_chapters)

    # ── Stage A: score and pick candidates ───────────────────────────────────
    slides = score_boundaries(slides)
    candidates = pick_candidate_boundaries(slides, target_chapters)

    if not candidates:
        return [{"slide": slides[0].get("slide_id", 0), "title": "Full Lecture"}]

    # ── Stage B: LLM validates ───────────────────────────────────────────────
    prompt = build_validation_prompt(slides, candidates, video_duration, target_chapters)
    log.info(f"Validation prompt: ~{len(prompt)//4} tokens")
    response = call_ollama(prompt, model, temperature, num_predict=1024)

    clusters = parse_json_response(response)
    if clusters:
        log.info(f"LLM confirmed {len(clusters)} chapters")
        return clusters

    # LLM failed to parse: use candidates directly with caption-derived titles
    log.warning("LLM validation unparseable — using scored candidates directly")
    result = [{"slide": 0, "title": "Introduction"}]
    for c in candidates:
        s     = slides[c]
        cap   = (s.get("caption") or "").strip()
        title = cap.split("\n")[0][:60].strip() or f"Section at {hms(s.get('start', 0))}"
        result.append({"slide": s.get("slide_id", c), "title": title})
    return result


def _build_fallback_prompt(
    slides: list[dict],
    video_duration: float,
    target_chapters: int,
) -> str:
    """Original v2 prompt used when no embeddings are available."""
    lines = []
    for s in slides:
        cap = s["caption"]
        if len(cap) > 300:
            cap = cap.split("\n")[0][:80]
        else:
            cap = cap[:80]
        lines.append(f"  #{s['slide_id']:02d}  [{hms(s['start'])}]  {cap}")
    slide_index = "\n".join(lines)

    return f"""You are an expert video editor. You have a list of lecture slides with timestamps.
Your job: group these slides into {target_chapters} chapters by identifying where the topic genuinely changes.

VIDEO: {hms(video_duration)} ({video_duration/60:.0f} min total), {len(slides)} slides

SLIDE LIST (slide number, timestamp, title/content):
{slide_index}

INSTRUCTIONS:
- Each chapter starts at the timestamp of its FIRST slide.
- Chapter 1 MUST start at slide #00.
- Look for slides where the content clearly shifts to a new topic.
- Give each chapter a specific descriptive title (4-8 words).
- Aim for {target_chapters} chapters. Minimum chapter duration: 3 minutes.

Respond with ONLY a JSON array. No markdown, no explanation. Example:
[
  {{"slide": 0,  "title": "Course Overview and Learning Objectives"}},
  {{"slide": 4,  "title": "Definition and Scope of Information Retrieval"}}
]"""


# ── chapter assembly ──────────────────────────────────────────────────────────
def assemble_chapters(
    cluster_response:    list[dict],
    slides:              list[dict],
    transcript_segments: list[dict],
    video_duration:      float,
    video_stem:          str,
) -> list[Chapter]:
    slide_map = {s["slide_id"]: s for s in slides}

    # Ensure chapter 1 starts at slide 0
    slide_ids_in_response = {item.get("slide", -1) for item in cluster_response}
    if 0 not in slide_ids_in_response and slides:
        cluster_response.insert(0, {"slide": slides[0]["slide_id"], "title": "Course Introduction and Overview"})

    def get_start(item):
        sid = item.get("slide", 0)
        return slide_map.get(sid, {}).get("start", 0.0)

    cluster_response.sort(key=get_start)

    # Deduplicate chapters within 60s of each other
    deduped = [cluster_response[0]]
    for item in cluster_response[1:]:
        if get_start(item) - get_start(deduped[-1]) >= 60:
            deduped.append(item)
    cluster_response = deduped

    chapters = []
    for i, item in enumerate(cluster_response):
        sid   = item.get("slide", 0)
        slide = slide_map.get(sid, slides[0] if slides else {})
        start = slide.get("start", 0.0)
        title = item.get("title", f"Chapter {i+1}").strip()

        if i + 1 < len(cluster_response):
            next_sid   = cluster_response[i+1].get("slide", 0)
            next_slide = slide_map.get(next_sid, {})
            end = next_slide.get("start", video_duration)
        else:
            end = video_duration

        chapter_slides = [s for s in slides if start <= s["start"] < end]

        seen_texts = set()
        transcript_parts = []
        for s in chapter_slides:
            t = s.get("transcript", "").strip()
            if t and t not in seen_texts:
                transcript_parts.append(t)
                seen_texts.add(t)

        slide_covered = set()
        for s in chapter_slides:
            for seg in transcript_segments:
                if seg["start"] >= s["start"] and seg["end"] <= s["end"]:
                    slide_covered.add(id(seg))

        extra_segs = [
            seg["text"].strip()
            for seg in transcript_segments
            if id(seg) not in slide_covered
            and seg["start"] >= start and seg["end"] <= end
        ]
        if extra_segs:
            transcript_parts.extend(extra_segs)

        chapter_transcript = " ".join(transcript_parts)

        frame_captions = []
        for s in chapter_slides:
            cap = s.get("caption", "").strip()
            if cap and cap != "[NO SLIDE]":
                if len(cap) > 300:
                    cap = cap.split("\n")[0]
                frame_captions.append(cap)

        chapters.append(Chapter(
            chapter_id    = f"{video_stem}_ch{i+1}",
            chapter_index = i + 1,
            title         = title,
            start_time    = round(start),
            end_time      = round(end),
            transcript    = chapter_transcript,
            frame_captions= frame_captions,
        ))

    log.info(f"Assembled {len(chapters)} chapters")
    return chapters


# ── keyword enrichment ────────────────────────────────────────────────────────
def enrich_keywords(chapters: list[Chapter], model: str, temperature: float) -> list[Chapter]:
    log.info("Extracting keywords per chapter ...")
    for ch in chapters:
        if not ch.transcript:
            continue
        resp = call_ollama(
            build_keywords_prompt(ch.transcript, ch.title),
            model, temperature, num_predict=256,
        )
        ch.keywords = parse_keywords_response(resp)
        log.info(f"  Ch{ch.chapter_index} '{ch.title[:40]}': {ch.keywords}")
    return chapters


# ── output ────────────────────────────────────────────────────────────────────
def save_chapters(chapters: list[Chapter], path: Path, metadata: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"metadata": metadata, "chapters": [c.to_dict() for c in chapters]},
                  f, indent=2, ensure_ascii=False)
    log.info(f"Saved → {path}")


def print_chapters(chapters: list[Chapter]) -> None:
    print("\n" + "=" * 72)
    print(f"  {'CHAPTERS':^68}")
    print("=" * 72)
    for ch in chapters:
        dur = (ch.end_time - ch.start_time) / 60
        print(f"  {ch.chapter_index:>2}.  [{hms(ch.start_time)} → {hms(ch.end_time)}]  "
              f"({dur:.1f} min)  {ch.title}")
        if ch.keywords:
            print(f"        Keywords: {', '.join(ch.keywords)}")
    print("=" * 72 + "\n")


# ── main ──────────────────────────────────────────────────────────────────────
def run(
    transcript_path: str,
    captions_path:   str,
    output_path:     Optional[str] = None,
    model:           str   = DEFAULT_MODEL,
    temperature:     float = 0.1,
    skip_keywords:   bool  = False,
    target_chapters: int   = 0,
) -> list[Chapter]:

    transc_path = Path(transcript_path).resolve()
    caps_path   = Path(captions_path).resolve()
    out = Path(output_path) if output_path else \
          transc_path.parent / (transc_path.stem.replace("_transcript", "") + "_chapters.json")
    video_stem = transc_path.stem.replace("_transcript", "")

    log.info(f"Transcript : {transc_path}")
    log.info(f"Captions   : {caps_path}")
    log.info(f"Output     : {out}")
    log.info(f"Model      : {model}")

    if not check_ollama():
        log.error("Ollama not running — run:  ollama serve"); sys.exit(1)
    if not check_model(model):
        log.error(f"Model '{model}' not pulled — run:  ollama pull {model}"); sys.exit(1)
    log.info("Ollama OK")

    transcript_segments = load_transcript(transc_path)
    slides              = load_slides(caps_path)
    video_duration      = transcript_segments[-1]["end"] if transcript_segments else 0.0
    log.info(f"Duration: {hms(video_duration)}  |  Slides: {len(slides)}")

    if not slides:
        log.error("No slides found in captions file."); sys.exit(1)

    if target_chapters == 0:
        target_chapters = max(3, min(12, int(video_duration / 60 / 8)))
    log.info(f"Target chapters: {target_chapters}")

    # ── detect chapters (semantic + LLM validation) ───────────────────────────
    clusters = detect_chapters(
        slides, video_duration, target_chapters, model, temperature
    )
    log.info(f"Detected {len(clusters)} chapter clusters")

    # ── assemble ──────────────────────────────────────────────────────────────
    chapters = assemble_chapters(clusters, slides, transcript_segments, video_duration, video_stem)

    # ── keywords ──────────────────────────────────────────────────────────────
    if not skip_keywords:
        chapters = enrich_keywords(chapters, model, temperature)

    # ── save ──────────────────────────────────────────────────────────────────
    save_chapters(chapters, out, {
        "transcript":             str(transc_path),
        "captions":               str(caps_path),
        "model":                  model,
        "temperature":            temperature,
        "video_duration_seconds": round(video_duration, 1),
        "num_slides":             len(slides),
        "num_chapters":           len(chapters),
    })
    print_chapters(chapters)
    return chapters


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Semantic + LLM chapter detection from slide captions.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    ap.add_argument("--transcript",      required=True)
    ap.add_argument("--captions",        required=True)
    ap.add_argument("--output",          default=None)
    ap.add_argument("--model",           default=DEFAULT_MODEL)
    ap.add_argument("--temperature",     type=float, default=0.1)
    ap.add_argument("--skip-keywords",   action="store_true")
    ap.add_argument("--target-chapters", type=int, default=0,
                    help="Number of chapters to aim for. 0 = auto (1 per 8 min).")
    args = ap.parse_args()

    run(
        transcript_path = args.transcript,
        captions_path   = args.captions,
        output_path     = args.output,
        model           = args.model,
        temperature     = args.temperature,
        skip_keywords   = args.skip_keywords,
        target_chapters = args.target_chapters,
    )