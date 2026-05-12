# LLM Chaptering Setup Guide — From Zero to Running

Complete step-by-step instructions to install Ollama, pull Llama 3.1, and
generate chapter boundaries from your transcript and captions.

> **Prerequisite:** You must have completed Steps 1 and 2 and have both:
> - `lecture_transcript.json`  (from asr.py)
> - `lecture_captions.json`    (from frame_captioning.py)

---

## What This Step Does

Feeds your transcript and frame captions into a local Llama 3.1 model and
asks it to identify where topic changes occur in the video.

```
lecture_transcript.json  ──┐
                            ├──► Llama 3.1 (via Ollama) ──► lecture_chapters.json
lecture_captions.json    ──┘
```

Example output:
```
══════════════════════════════════════════════════════════════════════
                             CHAPTERS
══════════════════════════════════════════════════════════════════════
   1.  [00:00:00 → 00:06:30]  ( 6.5 min)  Introduction and Course Overview
   2.  [00:06:30 → 00:18:45]  (12.2 min)  Fundamentals of Neural Networks
   3.  [00:18:45 → 00:34:10]  (15.4 min)  Forward Pass and Activation Functions
   4.  [00:34:10 → 00:51:20]  (17.2 min)  Backpropagation Explained
   5.  [00:51:20 → 01:02:00]  (10.7 min)  Training and Optimisation
══════════════════════════════════════════════════════════════════════
```

---

## What You Need to Install

| Tool | Why | Size |
|---|---|---|
| **Ollama** | Runs Llama 3.1 locally as a server | ~50 MB app |
| **llama3.1:8b model** | The LLM that reads the transcript and generates chapters | ~5 GB |

No new Python packages are needed — `chaptering.py` uses only Python's
built-in `urllib` and `json` modules.

---

## Step 1 — Install Ollama

### Windows

1. Go to **https://ollama.com/download**
2. Click **Download for Windows**
3. Run the downloaded `.exe` installer
4. Follow the installer — it installs Ollama as a background service
5. After install, open a **new terminal** and verify:

```cmd
ollama --version
```

You should see something like: `ollama version 0.3.x`

### Mac
  
```bash
brew install ollama
```

Or download the Mac app from https://ollama.com/download

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## Step 2 — Start the Ollama Server

Ollama runs as a local server that your script talks to.
On Windows it usually starts automatically after install,
but if not, open a terminal and run:

```cmd
ollama serve
```

Leave this terminal open. You should see:
```
time=... level=INFO source=... msg="Listening on 127.0.0.1:11434"
```

> **Tip:** On Windows, Ollama also adds a tray icon — if you see the llama icon
> in your system tray (bottom-right), the server is already running.

---

## Step 3 — Pull the Llama 3.1 Model

Open a **new terminal** (keep `ollama serve` running in the other one) and run:

```cmd
ollama pull llama3.1:8b
```

This downloads the Llama 3.1 8B model — a **one-time ~5 GB download**.
You will see a progress bar:

```
pulling manifest
pulling 667b0c1eed9d... 100% ▕████████████████▏ 4.9 GB
pulling 948af2743fc7... 100% ▕████████████████▏  1.5 KB
verifying sha256 digest
writing manifest
success
```

After this finishes, the model is cached locally and never needs to be
downloaded again.

Verify it is available:
```cmd
ollama list
```

You should see `llama3.1:8b` in the list.

---

## Step 4 — Check Your Project Folder

Your folder should now look like this:

```
chapter_llama/
├── asr.py
├── frame_captioning.py
├── chaptering.py                  ← new script
├── venv/
├── lecture.mp4
├── lecture_transcript.json        ← from Step 1
└── lecture_captions.json          ← from Step 2
```

---

## Step 5 — Activate Virtual Environment

```cmd
cd C:\Users\Shyam\Desktop\chapter_llama
venv\Scripts\activate
```

No new Python packages to install for this step.

---

## Step 6 — Run the Script

```cmd
python backend/app/subtask1_segmentation/chaptering.py --transcript data/processed/subtask1_segmentation/transcripts/trailvideo_transcripts.json --captions data/processed/subtask1_segmentation/captions/trailvideo_captions.json --output data/processed/subtask1_segmentation/chapters/trailvideo_chapters.json
```

Optional
--model llama3.2:latest

You will see:

```
12:00:01  INFO     Transcript : C:\...\lecture_transcript.json
12:00:01  INFO     Captions   : C:\...\lecture_captions.json
12:00:01  INFO     Model      : llama3.1:8b
12:00:01  INFO     Ollama is running ✓
12:00:01  INFO     Model 'llama3.1:8b' is available ✓
12:00:01  INFO     Loaded 412 transcript segments
12:00:01  INFO     Loaded 245 frame captions
12:00:01  INFO     Video duration: 01:02:00 (3720s)
12:00:01  INFO     Prompt length: 4821 words / ~19284 tokens
12:00:01  INFO     Sending prompt to Ollama (llama3.1:8b) …
12:01:45  INFO     Ollama responded in 104.2s
12:01:45  INFO     Parsed 8 chapters successfully
12:01:45  INFO     Chapters saved → lecture_chapters.json
```

Then the chapter list prints to the console.

---

## Output File

```
chapter_llama/
├── lecture_transcript.json
├── lecture_captions.json
└── lecture_chapters.json          ← NEW
```

### JSON structure

```json
{
  "metadata": {
    "model": "llama3.1:8b",
    "temperature": 0.1,
    "video_duration_seconds": 3720.0,
    "num_chapters": 8
  },
  "chapters": [
    {
      "index": 0,
      "start_time": 0.0,
      "end_time": 390.0,
      "start_str": "00:00:00",
      "end_str": "00:06:30",
      "duration": 390.0,
      "title": "Introduction and Course Overview"
    },
    {
      "index": 1,
      "start_time": 390.0,
      "end_time": 1125.0,
      "start_str": "00:06:30",
      "end_str": "00:18:45",
      "duration": 735.0,
      "title": "Fundamentals of Neural Networks"
    }
  ]
}
```

---

## All Available Options

```cmd
# Basic run
python chaptering.py --transcript lecture_transcript.json --captions lecture_captions.json

# Custom output path
python chaptering.py --transcript lecture_transcript.json --captions lecture_captions.json --output results/chapters.json

# Use a larger model for better quality (needs more VRAM, slower)
python chaptering.py --transcript lecture_transcript.json --captions lecture_captions.json --model llama3.1:70b

# Change video — just swap both input files
python chaptering.py --transcript other_lecture_transcript.json --captions other_lecture_captions.json
```

---

## How Long Will It Take?

| Hardware | Time for 1-hour lecture |
|---|---|
| NVIDIA GPU (8 GB+) | ~1–3 minutes |
| CPU only | ~10–30 minutes |
| Apple M1/M2 | ~3–8 minutes |

> Ollama automatically uses your GPU if available — no extra configuration needed.

---

## Model Choice

| Model | Quality | VRAM / RAM needed | Speed |
|---|---|---|---|
| `llama3.1:8b` | Good — **recommended default** | ~6 GB | Fast |
| `llama3.1:70b` | Best — use for final evaluation | ~40 GB | Slow |
| `mistral:7b` | Decent alternative to 8b | ~5 GB | Fast |

Start with `llama3.1:8b`. Switch to `llama3.1:70b` only when running your
final evaluation — it produces noticeably better chapter titles.

---

## Pipeline Progress So Far

```
Step 1 — ASR (asr.py)                      ✅  lecture_transcript.json
Step 2 — Frame Captioning                   ✅  lecture_captions.json
Step 3 — LLM Chaptering (this)              ✅  lecture_chapters.json
Step 4 — Evaluation                         ⬜  coming next
```

---

## Troubleshooting

**`Ollama is not running`**
→ Open a terminal and run: `ollama serve`
→ Keep that terminal open and run the script in a different terminal.

**`Model 'llama3.1:8b' is not pulled yet`**
→ Run: `ollama pull llama3.1:8b`

**`Could not reach Ollama`**
→ Make sure you didn't close the terminal running `ollama serve`.
→ Try visiting http://localhost:11434 in your browser — you should see `Ollama is running`.

**`JSON parsing failed`**
→ The LLM produced a non-JSON response. This is rare but can happen.
→ The script has 3 fallback parsers and will usually recover automatically.
→ If it still fails, try running again (LLM output has some randomness).

**Chapters are too few / too many**
→ This is normal variation. The LLM decides how many chapters fit.
→ For a 1-hour lecture, 5–12 chapters is a reasonable range.
→ If consistently wrong, the model may need a stronger GPU. Try `llama3.1:70b`.

**Very slow on CPU**
→ Ollama will still work on CPU but is significantly slower.
→ For a 1-hour lecture on CPU expect 15–30 minutes.
→ Let it run — the output quality is the same.
