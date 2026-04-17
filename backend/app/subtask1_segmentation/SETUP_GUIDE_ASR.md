

## Step 1 — Check Your Python Version

Open a terminal and run:

```bash
python --version
```

You need **Python 3.10 or higher**. If you see `3.9` or lower, download the latest Python from https://www.python.org/downloads/ and reinstall.

If `python` doesn't work, try `python3`:

```bash
python3 --version
```

> **Note:** On Windows, use `python` everywhere. On Mac/Linux, you may need `python3` and `pip3`.

---

## Step 2 — Create a Virtual Environment

A virtual environment keeps your project's packages isolated from the rest of your system.

```bash
# Create it
python -m venv venv

# Activate it — Mac/Linux:
source venv/bin/activate

# Activate it — Windows:
venv\Scripts\activate
```

You should now see `(venv)` at the start of your terminal prompt. **Always activate this before working on the project.**

To deactivate later (when you're done working):
```bash
deactivate
```

---

## Step 3 — Install FFmpeg

FFmpeg is a system tool (not a Python package), so it's installed separately.

### Windows

1. Go to https://ffmpeg.org/download.html
2. Click **Windows builds by BtbN** (or gyan.dev)
3. Download the `ffmpeg-release-essentials.zip`
4. Extract it to `C:\ffmpeg`
5. Add FFmpeg to your PATH:
   - Search for **"Edit the system environment variables"** in the Start menu
   - Click **Environment Variables**
   - Under **System Variables**, find `Path` and click **Edit**
   - Click **New** and add: `C:\ffmpeg\bin`
   - Click OK on all windows
6. Restart your terminal and verify:

```bash
ffmpeg -version
```

You should see output starting with `ffmpeg version 6.x...`. If you see that, FFmpeg is ready.

---

## Step 4 — Install PyTorch

PyTorch needs to be installed before Whisper. Choose the right command for your setup:

### If you have an NVIDIA GPU (recommended for speed)

First check if you have CUDA:
```bash
nvidia-smi
```
If that command shows a GPU, run:

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### If you have no GPU (CPU only)

```bash
pip install torch torchvision torchaudio
```

---

## Step 5 — Install OpenAI Whisper

```bash
pip install openai-whisper
```

Verify the installation:

```bash
python -c "import whisper; print('Whisper installed OK')"
```

You should see: `Whisper installed OK`

---

## Step 6 — Verify Everything Is Ready

Run these three checks — all three must pass before you continue:

```bash
# Check 1: FFmpeg
ffmpeg -version

# Check 2: Python packages
python -c "import whisper, torch; print('Packages OK')"

# Check 3: CUDA (skip if CPU-only)
python -c "import torch; print('CUDA available:', torch.cuda.is_available())"
```

Expected output for the last check:
- GPU machine: `CUDA available: True`
- CPU machine: `CUDA available: False`  ← this is fine, the script handles it automatically

---

## Step 7 — Put Your Video in the Project Folder

Copy your video file into `~/chapter_llama/` (or wherever you put `asr.py`).

Supported formats: `.mp4`, `.mkv`, `.avi`, `.mov`, `.webm`, `.flv`, `.wmv` — any format FFmpeg can read.


---

## Step 8 — Run the Script

Make sure your virtual environment is active (you see `(venv)` in the terminal), then:

```bash
python backend/app/subtask1_segmentation/asr.py --video data/raw/videos/trailvideo.mp4 --output data/processed/subtask1_segmentation/transcripts/trailvideo_transcripts.json
```

### First run — Whisper model download

The **first time** you run it, Whisper will download the model weights automatically. This is a one-time download:

| Model | Download Size |
|---|---|
| tiny | 75 MB |
| base | 145 MB |
| small | 461 MB |
| **medium (default)** | **1.5 GB** |
| large-v3 | 3.1 GB |

You will see something like:
```
12:00:01  INFO     Input  : /home/you/chapter_llama/lecture.mp4
12:00:01  INFO     Extracting audio from 'lecture.mp4' → 'lecture_audio.wav' …
12:00:04  INFO     Audio extracted in 3.2s  (28.4 MB)
12:00:04  INFO     Loading Whisper model (downloads on first run) …
100%|████████████████| 1.5G/1.5G [02:10<00:00]
12:02:15  INFO     Model loaded in 131.0s
12:02:15  INFO     Transcribing 'lecture_audio.wav' …
12:08:30  INFO     Transcription done in 375.1s  (video: 3600s, real-time factor: 0.10x)
12:08:30  INFO     Detected language: 'en'
```

After the first run, the model is cached locally and loads in a few seconds.

---

## Output

The script produces a JSON file next to your video:

```
chapter_llama/
├── asr.py
├── lecture.mp4
└── lecture_transcript.json    ← generated output
```

---
