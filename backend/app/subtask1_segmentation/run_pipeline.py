import os
import subprocess
import argparse

def run_pipeline(video_path):
    # Extract filename without extension
    base_name = os.path.splitext(os.path.basename(video_path))[0]

    # Define paths
    transcript_path = f"/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/transcripts/{base_name}_transcripts.json"
    captions_path = f"/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/captions/{base_name}_captions.json"
    chapters_path = f"/home/umwise2526studentproj/Group3ProjectWork/data/processed/subtask1_segmentation/chapters/{base_name}_chapters.json"

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

    print("✅ Pipeline completed successfully!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True, help="Path to input video")
    args = parser.parse_args()

    run_pipeline(args.video)