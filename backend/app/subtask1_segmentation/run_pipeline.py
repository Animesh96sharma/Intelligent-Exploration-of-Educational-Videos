# import os
# import subprocess
# import argparse

# def run_pipeline(video_path):
#     # Extract filename without extension
#     base_name = os.path.splitext(os.path.basename(video_path))[0]

#     # Define paths
#     transcript_path = f"data/processed/subtask1_segmentation/transcripts/{base_name}_transcripts.json"
#     captions_path = f"data/processed/subtask1_segmentation/captions/{base_name}_captions.json"
#     chapters_path = f"data/processed/subtask1_segmentation/chapters/{base_name}_chapters.json"

#     # Step 1: ASR
#     print("Running ASR...")
#     subprocess.run([
#         "python",
#         "backend/app/subtask1_segmentation/asr.py",
#         "--video", video_path,
#         "--output", transcript_path
#     ], check=True)

#     # Step 2: Frame Captioning
#     print("Running Frame Captioning...")
#     subprocess.run([
#         "python",
#         "backend/app/subtask1_segmentation/frame_captioning.py",
#         "--video", video_path,
#         "--transcript", transcript_path,
#         "--output", captions_path
#     ], check=True)

#     # Step 3: Chaptering
#     print("Running Chaptering...")
#     subprocess.run([
#         "python",
#         "backend/app/subtask1_segmentation/chaptering.py",
#         "--transcript", transcript_path,
#         "--captions", captions_path,
#         "--output", chapters_path,
#         "--model", "llama3.2:latest"
#     ], check=True)

#     print("✅ Pipeline completed successfully!")

# if __name__ == "__main__":
#     parser = argparse.ArgumentParser()
#     parser.add_argument("--video", required=True, help="Path to input video")
#     args = parser.parse_args()

#     run_pipeline(args.video)
import os
import subprocess
import argparse

# Supported video formats
VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv"}


def run_pipeline(video_path):
    # Extract filename without extension
    base_name = os.path.splitext(os.path.basename(video_path))[0]

    # Define paths
    transcript_path = f"data/processed/subtask1_segmentation/transcripts/{base_name}_transcripts.json"
    captions_path   = f"data/processed/subtask1_segmentation/captions/{base_name}_captions.json"
    chapters_path   = f"data/processed/subtask1_segmentation/chapters/{base_name}_chapters.json"

    print(f"\n{'='*60}")
    print(f"Processing: {base_name}")
    print(f"{'='*60}")

    # Free GPU memory before each video:
    # 1. Unload Ollama model from VRAM
    # 2. Clear any leftover PyTorch cache from previous video
    import urllib.request, json, time, subprocess as sp
    try:
        payload = json.dumps({"model": "llama3.1:8b", "keep_alive": 0}).encode()
        req = urllib.request.Request(
            "http://localhost:11434/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
        print("  Ollama VRAM freed ✓")
    except Exception:
        pass
    # Kill any leftover Python/PyTorch processes holding GPU memory
    sp.run("fuser -k /dev/nvidia0 2>/dev/null || true", shell=True)
    time.sleep(5)   # wait for VRAM to fully release before loading next model

    # Step 1: ASR
    print("Running ASR...")
    subprocess.run([
        "python",
        "backend/app/subtask1_segmentation/asr.py",
        "--video", video_path,
        "--output", transcript_path
    ], check=True)

    # Step 2: Frame Captioning
    print("Running Frame Captioning...")
    subprocess.run([
        "python",
        "backend/app/subtask1_segmentation/frame_captioning.py",
        "--video", video_path,
        "--transcript", transcript_path,
        "--output", captions_path
    ], check=True)

    # Step 3: Chaptering
    print("Running Chaptering...")
    subprocess.run([
        "python",
        "backend/app/subtask1_segmentation/chaptering.py",
        "--transcript", transcript_path,
        "--captions", captions_path,
        "--output", chapters_path,
        "--model", "llama3.2:latest"
    ], check=True)

    print(f"✅ Done: {base_name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the full segmentation pipeline on all videos in a folder."
    )
    parser.add_argument(
        "--folder",
        required=True,
        help="Path to folder containing video files (e.g. data/raw/videos/)"
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip videos that already have a chapters JSON output"
    )
    args = parser.parse_args()

    # Collect all video files in the folder
    folder = args.folder
    if not os.path.isdir(folder):
        print(f"❌ Folder not found: {folder}")
        exit(1)

    video_files = sorted([
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if os.path.splitext(f)[1].lower() in VIDEO_EXTENSIONS
    ])

    if not video_files:
        print(f"❌ No video files found in: {folder}")
        print(f"   Supported formats: {', '.join(VIDEO_EXTENSIONS)}")
        exit(1)

    print(f"Found {len(video_files)} video(s) in '{folder}':")
    for v in video_files:
        print(f"  - {os.path.basename(v)}")

    # Process each video
    success = []
    failed  = []

    for video_path in video_files:
        base_name     = os.path.splitext(os.path.basename(video_path))[0]
        chapters_path = f"data/processed/subtask1_segmentation/chapters/{base_name}_chapters.json"

        # Skip if already processed
        if args.skip_existing and os.path.exists(chapters_path):
            print(f"\n⏭️  Skipping '{base_name}' — chapters already exist")
            continue

        try:
            run_pipeline(video_path)
            success.append(base_name)
        except subprocess.CalledProcessError as e:
            print(f"\n❌ Failed: {base_name} — {e}")
            failed.append(base_name)
            continue   # move on to the next video instead of stopping

    # Final summary
    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"  Total   : {len(video_files)}")
    print(f"  Success : {len(success)}")
    print(f"  Failed  : {len(failed)}")
    if failed:
        print(f"\n  Failed videos:")
        for name in failed:
            print(f"    - {name}")
    print(f"{'='*60}")