"""
Debug script to verify all JSON files are detected.
Run this first to see what files your code can find.
"""

import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend" / "app"))

def check_files():
    # Check input directory
    input_dir = Path("data/processed/subtask1_segmentation/chapters")
    
    print("="*60)
    print("FILE DETECTION DEBUG")
    print("="*60)
    
    print(f"\nCurrent working directory: {Path.cwd()}")
    print(f"Looking for files in: {input_dir.absolute()}")
    
    if not input_dir.exists():
        print(f"\n❌ ERROR: Directory does not exist!")
        print(f"   Please check the path.")
        return
    
    print(f"\n✅ Directory exists")
    
    # Get all JSON files
    files = sorted(input_dir.glob("*.json"))
    
    print(f"\nFound {len(files)} JSON files:")
    for i, f in enumerate(files):
        print(f"  {i+1}. {f.name}")
    
    # Check if your new files are there
    expected_files = [
        "tib_001_ml_intro.json",
        "tib_002_neural_networks.json", 
        "tib_003_databases.json",
        "tib_004_computer_vision.json",
        "tib_005_nlp.json",
        "tib_006_data_science.json",
        "tib_007_cloud_computing.json"
    ]
    
    print("\n" + "="*60)
    print("CHECKING FOR EXPECTED FILES:")
    print("="*60)
    
    found_files = [f.name for f in files]
    for expected in expected_files:
        if expected in found_files:
            print(f"  ✅ {expected} - FOUND")
        else:
            print(f"  ❌ {expected} - MISSING")
    
    # Also check output directories
    output_dirs = [
        "data/processed/subtask2_summarization/chapter_summaries",
        "data/processed/subtask2_summarization/video_summaries"
    ]
    
    print("\n" + "="*60)
    print("OUTPUT DIRECTORY STATUS:")
    print("="*60)
    
    for out_dir in output_dirs:
        out_path = Path(out_dir)
        if out_path.exists():
            existing = list(out_path.glob("*.json"))
            print(f"\n{out_dir}:")
            print(f"  Existing files: {len(existing)}")
            for ex in existing[:5]:  # Show first 5
                print(f"    - {ex.name}")
            if len(existing) > 5:
                print(f"    ... and {len(existing)-5} more")
        else:
            print(f"\n{out_dir}: Directory not created yet")

if __name__ == "__main__":
    check_files()
    