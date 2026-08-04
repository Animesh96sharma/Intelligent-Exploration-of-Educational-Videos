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
import urllib.request
import json
import time

VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv"}

BASE_DIR = "data/processed/subtask1_segmentation"
TRANSCRIPTS_DIR = os.path.join(BASE_DIR, "transcripts")
METADATA_DIR = os.path.join("data/processed/metadata/subtask1_segmentation")
CAPTIONS_DIR = os.path.join(BASE_DIR, "captions")
CHAPTERS_DIR = os.path.join(BASE_DIR, "chapters")


def free_gpu_memory():
    try:
        payload = json.dumps({"model": "llama3.2:latest", "keep_alive": 0}).encode()
        req = urllib.request.Request(
            "http://localhost:11434/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
        print("Ollama VRAM freed ✓")
    except Exception:
        pass

    time.sleep(3)


def run_pipeline(video_path):
    if not os.path.isfile(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    base_name = os.path.splitext(os.path.basename(video_path))[0]

    transcript_path = os.path.join(TRANSCRIPTS_DIR, f"{base_name}_transcripts.json")
    metadata_path = os.path.join(METADATA_DIR, f"{base_name}_metadata.json")
    captions_path = os.path.join(CAPTIONS_DIR, f"{base_name}_captions.json")
    chapters_path = os.path.join(CHAPTERS_DIR, f"{base_name}_chapters.json")


    os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)
    os.makedirs(METADATA_DIR, exist_ok=True)
    os.makedirs(CAPTIONS_DIR, exist_ok=True)
    os.makedirs(CHAPTERS_DIR, exist_ok=True)
    

    print(f"\n{'='*60}")
    print(f"Processing: {base_name}")
    print(f"{'='*60}")

    free_gpu_memory()

    print("Running ASR...")
    subprocess.run([
        "python",
        "project/bhavik/backend/app/subtask1_segmentation/asr.py",
        "--video", video_path,
        "--output", transcript_path
    ], check=True)

    print("Running Frame Captioning...")
    subprocess.run([
        "python",
        "project/bhavik/backend/app/subtask1_segmentation/frame_captioning.py",
        "--video", video_path,
        "--transcript", transcript_path,
        "--output", captions_path
    ], check=True)

    print("Running Metadata Extraction...")
    subprocess.run([
        "python",
        "project/bhavik/backend/app/subtask1_segmentation/metadata_extraction.py",
        "--transcript", transcript_path,
        "--captions",   captions_path,       
        "--output",     metadata_path
    ], check=True)

    print("Running Chaptering...")
    subprocess.run([
        "python",
        "project/bhavik/backend/app/subtask1_segmentation/chaptering.py",
        "--transcript", transcript_path,
        "--captions", captions_path,
        "--output", chapters_path,
        "--model", "llama3.2:latest"
    ], check=True)

    print(f"✅ Done: {base_name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the segmentation pipeline on one video or all videos in a folder."
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--video", help="Path to a single input video")
    group.add_argument("--folder", help="Path to folder containing video files")

    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip videos that already have a chapters JSON output"
    )

    args = parser.parse_args()

    if args.video:
        run_pipeline(args.video)

    elif args.folder:
        if not os.path.isdir(args.folder):
            print(f"❌ Folder not found: {args.folder}")
            raise SystemExit(1)

        video_files = sorted([
            os.path.join(args.folder, f)
            for f in os.listdir(args.folder)
            if os.path.splitext(f)[1].lower() in VIDEO_EXTENSIONS
        ])

        if not video_files:
            print(f"❌ No video files found in: {args.folder}")
            raise SystemExit(1)

        success = []
        failed = []

        for video_path in video_files:
            base_name = os.path.splitext(os.path.basename(video_path))[0]
            chapters_path = os.path.join(CHAPTERS_DIR, f"{base_name}_chapters.json")

            if args.skip_existing and os.path.exists(chapters_path):
                print(f"⏭️ Skipping '{base_name}' — chapters already exist")
                continue

            try:
                run_pipeline(video_path)
                success.append(base_name)
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed: {base_name} — {e}")
                failed.append(base_name)

        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        print(f"Total   : {len(video_files)}")
        print(f"Success : {len(success)}")
        print(f"Failed  : {len(failed)}")