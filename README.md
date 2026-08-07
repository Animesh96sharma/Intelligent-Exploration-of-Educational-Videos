# Intelligent Exploration of Educational Videos

A university group project for building an intelligent platform to explore, analyze, and navigate educational video content. The system combines a modern frontend for interactive exploration with a Python-based backend for educational video processing, segmentation, and summarization.

---

## Project Overview

The goal of this project is to make long educational videos easier to understand, browse, and revisit. Instead of forcing users to manually scrub through lengthy content, the platform helps identify meaningful segments, surface important concepts, and present concise summaries that support faster learning and revision.

This project is centered on educational and scientific video exploration, with the dataset sourced from the **TIB AV-Portal**.

---

## Project Structure

```text
.
├── backend/            # Python backend for video processing and analysis
├── docs/               # Documentation and supporting material
├── frontend/           # React + Vite frontend for interactive exploration
├── notebooks/          # Experiments, analysis, and prototyping
├── scripts/            # Utility and automation scripts
├── tests/              # Unit and integration tests
├── requirements.txt    # Python dependencies
└── pyrightconfig.json  # Static type checking config
```

---

## Backend

The backend is organized around two major subtasks that together support intelligent educational video exploration.

### Subtask 1: Segmentation

`backend/app/subtask1_segmentation/`

This module focuses on dividing an educational video into meaningful temporal segments. Instead of treating a video as one continuous stream, the segmentation pipeline identifies boundaries that break the content into smaller, more understandable units.

Typical goals of this subtask include:
- Detecting topic or scene transitions.
- Producing segment-level structure for navigation.
- Supporting timeline-based exploration in the frontend.
- Creating a foundation for summarization and concept-level analysis.

Segmentation is especially useful for educational videos because lectures, tutorials, and scientific presentations often contain natural topic boundaries, explanation blocks, demonstrations, or chapter-like transitions.

### Subtask 2: Summarization

`backend/app/subtask2_summarization/`

This module focuses on generating concise textual understanding from educational video content. Once a video has been segmented, summarization helps convert long-form content into shorter, more digestible outputs for learners.

Typical goals of this subtask include:
- Producing summaries for full videos or individual segments.
- Transforming extracted content into study-friendly notes.
- Highlighting key concepts, important explanations, and takeaways.
- Supporting frontend features such as summary panels, search, and revision-oriented views.

### Combined Backend Flow

Together, segmentation and summarization form the main intelligence pipeline of the project:

1. Process the raw educational video.
2. Split it into meaningful temporal segments.
3. Analyze the resulting segments.
4. Generate concise summaries and structured learning outputs.
5. Expose those outputs to the frontend for interactive exploration.

---

## Frontend

The frontend is designed as an exploration interface rather than a basic video player. Its purpose is to help users browse educational videos, understand their structure, and interact with summaries, concepts, and segments more effectively.

### Custom Exploration Features

The frontend highlights educational-video-specific interaction patterns such as:
- A video explorer page with long horizontal video cards.
- A layout that places the video player beside a summary panel.
- Segment-aware navigation for easier movement across meaningful parts of a video.
- Concept-focused displays that help users identify important ideas quickly.
- Search and comparison-oriented interaction for deeper exploration.

### UI Direction

The project emphasizes a clean, modern, and structured interface tailored for educational content. Instead of generic media browsing, the frontend is intended to support workflows such as:
- Browsing available educational videos.
- Opening a video and seeing a structured summary.
- Navigating between meaningful segments.
- Reviewing important concepts.
- Revisiting specific parts of a video more efficiently than with standard playback alone.

### Frontend Scope

Planned and evolving frontend capabilities include:
- Comparison page.
- Shared selection state.
- Video-internal search.
- Timeline hover cards.
- Similarity matrix or heatmap.
- Richer concept filtering.
- Bookmarks and notes.
- Player upgrades, subtitles, playback speed, and screenshot capture.
- Accessibility and usability improvements.

---

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- HTML / CSS / JSX

### Backend
- Python
- Script-based processing pipelines
- Segment processing and summarization workflows
- Notebook-based experimentation and analysis

### Tooling and Development
- Git
- GitHub
- Pyright
- Jupyter Notebooks
- Virtual environments / Conda for environment management

### Repository Support Structure
- `docs/` for documentation
- `scripts/` for utilities and automation
- `tests/` for validation
- `notebooks/` for experiments and research work

### Data Source
- TIB AV-Portal for educational/scientific video data

---

## Setup

### Backend Environment

Using Conda:

```bash
conda activate myenv
```

Using venv:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Pipeline Example

Run the segmentation pipeline with:

```bash
python backend/app/subtask1_segmentation/run_pipeline.py --video /path/to/video.mp4
```

---

## Sprint Roadmap

| Sprint | Backend Focus | Frontend Focus |
|--------|---------------|----------------|
| Sprint 1 | Environment setup, raw data organization, initial segmentation pipeline, backend structure | Base application structure, shared state, core video browsing UI, comparison page foundation |
| Sprint 2 | Improve segmentation quality, define segment metadata flow, start summarization integration | Video-internal search, timeline interactions, summary panel refinement, concept filtering |
| Sprint 3 | Expand summarization workflow, connect segment and summary outputs more cleanly, improve testing and processing reliability | Similarity matrix or heatmap, bookmarks, notes, richer interaction patterns, player improvements |
| Sprint 4 | Integration hardening, backend cleanup, evaluation, testing, and documentation | Accessibility fixes, UI polish, usability evaluation, and final demo preparation |

---

## References

- [TIB AV-Portal](https://av.tib.eu/) — source of the educational/scientific video dataset used in this project.
- [Chapter-LLaMA](https://github.com/lucas-ventura/chapter-llama) — reference repository consulted for related ideas and implementation support.

---

## Contribution Notes

This project is organized as collaborative university group work. Contributors should coordinate changes through Git branches, keep experiments structured, and maintain clear separation between processing tasks, frontend development, and documentation.

---

## License

This repository is part of a university project and is maintained by the contributors.
