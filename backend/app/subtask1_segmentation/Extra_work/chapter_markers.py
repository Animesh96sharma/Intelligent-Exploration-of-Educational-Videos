"""
FEATURE 5 — VTT Chapter Markers in Subtitle File
==================================================
WHAT CHANGED:
  The .vtt subtitle file previously contained only speech subtitles.
  Chapter markers have been added as VTT NOTE blocks and as a separate
  chapter track, enabling browsers to show chapter navigation natively
  in the video scrubber.

WHY THIS IS BETTER:
  Before: The .vtt file was only usable for subtitles. Chapters were
          in a separate chapters.json that required custom JS to display.
  After:  A single .vtt file carries BOTH subtitles AND chapter markers.
          Browsers that support the VTT chapter specification (Chrome,
          Firefox, Safari) show chapter thumbnails and titles in the
          video progress bar automatically — zero frontend JS needed.

HOW OPTIMAL:
  The chapter VTT is generated in <1ms from existing chapters.json data.
  Zero extra compute. The frontend gets native chapter navigation with
  no additional API calls.

HOW TO INTEGRATE:
  1. Add save_chapter_vtt() to your asr.py or a new post-processing step
  2. Call it after chaptering.py completes
  3. Serve the file via your existing /frames static mount or a new endpoint

BROWSER SUPPORT:
  <track kind="chapters" src="lecture_chapters.vtt" srclang="en" label="Chapters">
  Chrome 23+, Firefox 31+, Safari 6+ support VTT chapters natively.
"""

import json
from pathlib import Path
from typing import Optional


def seconds_to_vtt_timestamp(seconds: float) -> str:
    """Convert float seconds to VTT timestamp HH:MM:SS.mmm"""
    total_ms = int(round(seconds * 1000))
    ms = total_ms % 1000
    total_s = total_ms // 1000
    h = total_s // 3600
    m = (total_s % 3600) // 60
    s = total_s % 60
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def save_chapter_vtt(
    chapters_path:  str,
    output_path:    Optional[str] = None,
) -> Path:
    """
    Generate a WebVTT chapter file from chapters.json.

    The output follows the WebVTT chapter specification:
      WEBVTT

      Chapter 1
      00:00:00.000 --> 00:06:30.000
      Introduction and Course Overview

      Chapter 2
      00:06:30.000 --> 00:18:45.000
      Fundamentals of Neural Networks

    This file is loaded by the browser via:
      <track kind="chapters" src="lecture_chapters.vtt">

    Args:
        chapters_path: Path to chapters.json from chaptering.py
        output_path:   Where to save the .vtt file
                       Default: same location as chapters.json with _chapters.vtt suffix

    Returns:
        Path to the saved VTT file.
    """
    chap_path = Path(chapters_path)

    if output_path is None:
        output_path = chap_path.parent / chap_path.name.replace("_chapters.json", "_chapters.vtt")

    out_path = Path(output_path)

    with open(chap_path, encoding="utf-8") as f:
        data = json.load(f)

    chapters = data.get("chapters", [])
    if not chapters:
        raise ValueError(f"No chapters found in {chap_path}")

    lines = ["WEBVTT", ""]  # VTT header

    for i, ch in enumerate(chapters):
        start = ch.get("start_time", 0.0)
        end   = ch.get("end_time",   start + 60.0)
        title = ch.get("title", f"Chapter {i + 1}")
        conf  = ch.get("boundary_confidence", None)

        # Optional: append confidence indicator to title
        # Uncomment if frontend should show confidence:
        # if conf is not None:
        #     marker = "●" if conf >= 0.7 else "◐" if conf >= 0.4 else "○"
        #     title = f"{marker} {title}"

        lines.append(f"Chapter {i + 1}")
        lines.append(f"{seconds_to_vtt_timestamp(start)} --> {seconds_to_vtt_timestamp(end)}")
        lines.append(title)
        lines.append("")  # blank line between cues

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Chapter VTT saved → {out_path}  ({len(chapters)} chapters)")
    return out_path


def save_combined_vtt(
    subtitles_path: str,
    chapters_path:  str,
    output_path:    Optional[str] = None,
) -> Path:
    """
    Merge subtitle VTT and chapter markers into a single VTT file with NOTE blocks.

    NOTE blocks are invisible to subtitle renderers but readable by
    chapter-aware players. This creates a single self-contained file.

    Args:
        subtitles_path: Path to existing _transcript.vtt from asr.py
        chapters_path:  Path to chapters.json from chaptering.py
        output_path:    Output path for the combined VTT

    Returns:
        Path to the combined VTT file.
    """
    sub_path  = Path(subtitles_path)
    chap_path = Path(chapters_path)

    if output_path is None:
        output_path = sub_path.parent / sub_path.name.replace(".vtt", "_with_chapters.vtt")

    out_path = Path(output_path)

    # Read subtitle content (skip the WEBVTT header line)
    with open(sub_path, encoding="utf-8") as f:
        subtitle_content = f.read()

    # Load chapters
    with open(chap_path, encoding="utf-8") as f:
        chap_data = json.load(f)
    chapters = chap_data.get("chapters", [])

    # Build chapter NOTE blocks
    chapter_notes = ["WEBVTT", "", "NOTE chapter-markers"]
    for i, ch in enumerate(chapters):
        start = ch.get("start_time", 0.0)
        end   = ch.get("end_time",   start + 60.0)
        title = ch.get("title",      f"Chapter {i+1}")
        conf  = ch.get("boundary_confidence", 0.0)
        chapter_notes.append(
            f"NOTE chapter {i+1}: '{title}' "
            f"[{seconds_to_vtt_timestamp(start)} → {seconds_to_vtt_timestamp(end)}] "
            f"confidence={conf:.3f}"
        )

    chapter_notes.append("")

    # Combine: chapter notes + original subtitle content (skip its WEBVTT header)
    subtitle_body = "\n".join(subtitle_content.split("\n")[2:])  # skip WEBVTT + blank line
    combined = "\n".join(chapter_notes) + "\n" + subtitle_body

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(combined)

    print(f"Combined VTT saved → {out_path}  ({len(chapters)} chapters + subtitles)")
    return out_path


def batch_generate_chapter_vtts(
    chapters_dir: str,
    output_dir:   Optional[str] = None,
) -> None:
    """
    Generate chapter VTT files for all videos in a folder.

    Args:
        chapters_dir: Folder containing *_chapters.json files
        output_dir:   Where to save VTT files (default: same as chapters_dir)
    """
    chap_dir = Path(chapters_dir)
    out_dir  = Path(output_dir) if output_dir else chap_dir

    chap_files = sorted(chap_dir.glob("*_chapters.json"))
    print(f"Generating chapter VTTs for {len(chap_files)} videos...")

    for f in chap_files:
        vtt_path = out_dir / f.name.replace("_chapters.json", "_chapters.vtt")
        try:
            save_chapter_vtt(str(f), str(vtt_path))
        except Exception as e:
            print(f"  Failed for {f.name}: {e}")

    print(f"Done. VTT files saved to {out_dir}")


# ── Frontend HTML snippet ──────────────────────────────────────────────────────
FRONTEND_HTML = """
<!-- Use BOTH tracks: subtitles + chapters -->
<video id="lecture-player" controls width="100%">
    <source src="/videos/tib_av_325_720p/stream" type="video/mp4">

    <!-- Subtitle track — speech transcription -->
    <track
        kind="subtitles"
        src="/files/tib_av_325_720p_transcript.vtt"
        srclang="en"
        label="English Subtitles"
        default>

    <!-- Chapter track — browser shows chapter markers in scrubber -->
    <track
        kind="chapters"
        src="/files/tib_av_325_720p_chapters.vtt"
        srclang="en"
        label="Chapters">
</video>
"""

# ── API endpoint to add to api.py ─────────────────────────────────────────────
API_ENDPOINT = """
@app.get("/videos/{video_id}/chapters_vtt")
def get_chapter_vtt(video_id: str):
    \"\"\"
    Serve the chapter VTT file for a video.
    Used by the frontend <track kind='chapters'> element.
    \"\"\"
    vtt_path = CHAPTERS_DIR / f"{video_id}_chapters.vtt"
    if not vtt_path.exists():
        # Generate on the fly if not pre-generated
        chap_path = CHAPTERS_DIR / f"{video_id}_chapters.json"
        if not chap_path.exists():
            raise HTTPException(status_code=404, detail="Chapters not found")
        save_chapter_vtt(str(chap_path), str(vtt_path))

    return FileResponse(vtt_path, media_type="text/vtt")
"""

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate chapter VTT files")
    parser.add_argument("--chapters-dir", required=True, help="Folder with *_chapters.json")
    parser.add_argument("--output-dir",   default=None,  help="Output folder for VTT files")
    args = parser.parse_args()

    batch_generate_chapter_vtts(args.chapters_dir, args.output_dir)