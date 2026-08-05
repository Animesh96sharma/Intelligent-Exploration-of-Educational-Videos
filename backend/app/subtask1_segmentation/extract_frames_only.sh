#!/bin/bash

CAPTIONS_DIR="/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/captions"
FRAMES_DIR="/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/frames"
VIDEOS_DIR="/home/umwise2526studentproj/Group3ProjectWork/project/bhavik/data/raw/videos"

for captions_file in "$CAPTIONS_DIR"/*_captions.json; do
    base=$(basename "$captions_file" _captions.json)
    video="$VIDEOS_DIR/${base}.mp4"
    frames="$FRAMES_DIR/$base"

    if [ ! -f "$video" ]; then
        echo "⏭️  Skipping $base — video not found"
        continue
    fi

    mkdir -p "$frames"
    echo "🖼️  Extracting frames for $base ..."

    # Read timestamps from existing captions JSON and extract frames with ffmpeg
    python3 - <<PYEOF
import json, subprocess, os
from pathlib import Path

captions_file = "$captions_file"
video         = "$video"
frames_dir    = Path("$frames")

data   = json.load(open(captions_file, encoding="utf-8"))
slides = data.get("slides", [])

for s in slides:
    ts      = s.get("representative_timestamp", s.get("slide_start", 0))
    sid     = s.get("slide_id", 0)
    outfile = frames_dir / f"slide_{sid:04d}_{ts:.1f}s.jpg"

    if outfile.exists():
        continue  # skip already extracted

    subprocess.run([
        "ffmpeg", "-y",
        "-ss", str(ts),
        "-i", video,
        "-vframes", "1",
        "-q:v", "2",
        str(outfile),
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print(f"  Saved {len(slides)} frames → {frames_dir}")
PYEOF

    echo "✅ Done: $base"
done

echo ""
echo "All frames extracted."
