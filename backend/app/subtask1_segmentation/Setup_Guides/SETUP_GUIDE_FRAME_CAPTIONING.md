

## Step 1 — Activate Your Virtual Environment

Always activate your virtual environment before doing anything.

Open a terminal, navigate to your project folder, and activate:

```cmd
cd C:\Users\Shyam\Desktop\chapter_llama
venv\Scripts\activate
```

You should see `(venv)` at the start of your prompt before continuing.

---

## Step 2 — Install the New Packages

With your virtual environment active, run:

```cmd
pip install opencv-python Pillow transformers accelerate
```

This installs all four packages at once. You should see them all complete with
`Successfully installed`.

Verify they installed correctly:

```cmd
python -c "import cv2, PIL, transformers, accelerate, bitsandbytes; print('All packages OK')"
```

Expected output: `All packages OK`

---

## Step 3 — Check Your Project Folder

Your folder should look like this before running:

```
chapter_llama/
├── asr.py                        ← from Step 1
├── frame_captioning.py           ← new script
├── venv/
├── lecture.mp4                   ← your video
└── lecture_transcript.json       ← produced by asr.py in Step 1
```

If you don't have `lecture_transcript.json` yet, go back and run `asr.py` first:

```cmd
python asr.py --video lecture.mp4
```

---

## Step 4 — Run the Script

```cmd
python backend/app/subtask1_segmentation/frame_captioning.py --video data/raw/videos/trailvideo.mp4 --transcript data/processed/subtask1_segmentation/transcripts/trailvideo_transcripts.json --output data/processed/subtask1_segmentation/captions/trailvideo_captions.json
```

That's it. The script reads the transcript, finds the midpoint of every segment,
extracts that frame, and captions it.

---

First Run — LLaVA Model Download
The first time you run it, LLaVA will download its model weights automatically.
This is a one-time ~14 GB download (larger than Whisper/BLIP-2, but only happens once).
You will see something like:
12:00:01  INFO     Loading LLaVA 'llava-hf/llava-v1.6-mistral-7b-hf' in 4-bit quantization (downloads ~14 GB on first run) …
Downloading model.safetensors: 100%|██████████| 14.0G/14.0G [18:00<00:00]
12:18:35  INFO     LLaVA ready in 1082.3s
12:18:35  INFO     Captioning 245 frames …
12:18:37  INFO       [  10/245]  00:01:14.500  |  "a presentation slide showing..."  |  ETA 470s
After the first run, the model is cached and loads in ~30–60 seconds.

Why 4-bit Quantization?
Your GPU (RTX 4060 Ti) has 7.6 GB of VRAM. LLaVA-7B normally needs ~14 GB
in full precision. 4-bit quantization compresses the model weights so it fits
in ~5–6 GB — comfortably within your card — with minimal quality loss for
captioning tasks.
ModeVRAM neededWorks on your GPU?LLaVA fp16 (no quant)~14 GB✗ Overflows to slow CPU offloadLLaVA 4-bit ✅~5–6 GB✓ Fits, runs fastBLIP-2 fp16~6 GB✓ Fits, but weaker on lecture slides

What the Output Looks Like
After the script finishes, you will have a new file next to your video:
chapter_llama/
├── lecture.mp4
├── lecture_transcript.json        ← from asr.py
└── lecture_captions.json          ← NEW — produced by frame_captioning.py
Each entry in lecture_captions.json looks like:
json{
  "segment_index": 4,
  "timestamp": 47.9,
  "timestamp_str": "00:00:47.900",
  "segment_start": 42.1,
  "segment_end": 48.0,
  "speech_text": "So here we can see the attention mechanism in detail...",
  "caption": "A slide titled 'Attention Mechanism' showing a diagram with query, key, and value vectors connected by arrows.",
  "frame_path": null
}

Optional — Save Frame Images
To also save the extracted frame as a .jpg alongside each caption:
cmdpython frame_captioning.py --video data\lecture.mp4 --transcript data\lecture_transcript.json --save-frames
Frames will be saved to a lecture_frames/ folder next to your video.