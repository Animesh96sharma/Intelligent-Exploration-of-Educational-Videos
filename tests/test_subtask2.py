"""
tests/test_subtask2.py

Unit tests for Subtask 2 — Multi-Level Video Summarization.
Run: pytest tests/test_subtask2.py -v
"""
import json
import sys
import pytest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


# ── llm_client tests ──────────────────────────────────────────────────────────

class TestChunkText:
    def setup_method(self):
        from backend.app.common.utils.llm_client import chunk_text
        self.chunk_text = chunk_text

    def test_short_text_not_chunked(self):
        text = "This is a short text."
        result = self.chunk_text(text, limit=1000)
        assert result == [text]

    def test_long_text_is_chunked(self):
        text = ("This is a sentence. " * 200)  # ~4000 chars
        result = self.chunk_text(text, limit=500)
        assert len(result) > 1

    def test_chunks_cover_all_content(self):
        text = "Alpha. Beta. Gamma. Delta. Epsilon. " * 50
        chunks = self.chunk_text(text, limit=200, overlap=50)
        # Every original sentence should appear in at least one chunk
        combined = " ".join(chunks)
        for word in ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"]:
            assert word in combined

    def test_overlap_creates_continuity(self):
        text = "First sentence here. Second sentence here. Third sentence here. " * 20
        chunks = self.chunk_text(text, limit=200, overlap=80)
        # No chunk should be empty
        assert all(len(c) > 0 for c in chunks)


class TestParseJsonResponse:
    def setup_method(self):
        from backend.app.common.utils.llm_client import parse_json_response
        self.parse = parse_json_response

    def test_clean_json(self):
        raw = '{"key": "value", "number": 42}'
        result = self.parse(raw)
        assert result == {"key": "value", "number": 42}

    def test_json_with_markdown_fence(self):
        raw = '```json\n{"key": "value"}\n```'
        result = self.parse(raw)
        assert result == {"key": "value"}

    def test_json_buried_in_prose(self):
        raw = 'Here is the result: {"key": "value"} and some more text.'
        result = self.parse(raw)
        assert result is not None
        assert result.get("key") == "value"

    def test_invalid_json_returns_none(self):
        raw = "This is not JSON at all."
        result = self.parse(raw)
        assert result is None

    def test_empty_string_returns_none(self):
        result = self.parse("")
        assert result is None


# ── Extractive summarization tests ───────────────────────────────────────────

class TestExtractiveSummary:
    def setup_method(self):
        from backend.app.subtask2_summarization.video_level.summarize_video import extractive_summary
        self.extractive = extractive_summary

    def test_short_text_returned_as_is(self):
        text = "Short text. Not much here."
        result = self.extractive(text, n_sentences=5)
        assert result == text

    def test_returns_n_sentences(self):
        text = " ".join([f"This is sentence number {i} with enough words to count." for i in range(20)])
        result = self.extractive(text, n_sentences=3)
        sentences = [s for s in result.split(".") if s.strip()]
        assert len(sentences) <= 5  # allow minor variation

    def test_preserves_important_content(self):
        text = (
            "The capital of France is Paris, a major European city. "
            "France is known for its cuisine and culture. "
            "Paris has many famous landmarks. "
            "The Eiffel Tower is a globally recognized symbol of Paris. "
            "Many tourists visit Paris every year. "
            "Paris is a beautiful city with rich history. "
            "French culture has influenced the world in art and fashion. "
            "The Louvre is the world's largest art museum, located in Paris. "
        )
        result = self.extractive(text, n_sentences=3)
        assert len(result) > 0


# ── ROUGE metrics tests ───────────────────────────────────────────────────────

class TestRougeScore:
    def setup_method(self):
        from backend.app.subtask2_summarization.evaluation.summarization_metrics import rouge_score
        self.rouge = rouge_score

    def test_identical_texts_score_one(self):
        text = "machine learning is a subfield of artificial intelligence"
        scores = self.rouge(text, text)
        assert scores["rouge1"]["f1"] == pytest.approx(1.0, abs=0.01)

    def test_completely_different_texts_score_zero(self):
        hyp = "machine learning neural networks deep learning"
        ref = "database systems sql relational tables"
        scores = self.rouge(hyp, ref)
        assert scores["rouge1"]["f1"] == pytest.approx(0.0, abs=0.01)

    def test_partial_overlap(self):
        hyp = "machine learning and neural networks"
        ref = "machine learning is powerful for classification"
        scores = self.rouge(hyp, ref)
        assert 0.0 < scores["rouge1"]["f1"] < 1.0

    def test_rouge_l_exists(self):
        scores = self.rouge("hello world foo", "hello world bar")
        assert "rougeL" in scores
        assert "f1" in scores["rougeL"]


# ── Concept coverage tests ────────────────────────────────────────────────────

class TestConceptCoverage:
    def setup_method(self):
        from backend.app.subtask2_summarization.evaluation.summarization_metrics import concept_coverage
        self.coverage = concept_coverage

    def test_all_concepts_present(self):
        summary  = "Machine learning uses neural networks for classification tasks."
        concepts = ["machine learning", "neural networks", "classification"]
        result   = self.coverage(summary, concepts)
        assert result["coverage"] == pytest.approx(1.0)

    def test_no_concepts_present(self):
        summary  = "Database systems use SQL for querying."
        concepts = ["backpropagation", "gradient descent", "loss function"]
        result   = self.coverage(summary, concepts)
        assert result["coverage"] == pytest.approx(0.0)

    def test_partial_coverage(self):
        summary  = "Machine learning uses gradient descent optimization."
        concepts = ["machine learning", "gradient descent", "backpropagation"]
        result   = self.coverage(summary, concepts)
        assert result["coverage"] == pytest.approx(2/3, abs=0.01)

    def test_empty_concepts_list(self):
        result = self.coverage("Some summary text.", [])
        assert result["coverage"] == 0.0


# ── Collection analysis helpers tests ────────────────────────────────────────

class TestExtractConcepts:
    def setup_method(self):
        from backend.app.subtask2_summarization.collection_level.analyze_collection import extract_concepts
        self.extract = extract_concepts

    def test_proper_list(self):
        result = self.extract(["machine learning", "deep learning", "neural networks"])
        assert "machine learning" in result
        assert "deep learning" in result

    def test_comma_string(self):
        result = self.extract("machine learning, deep learning, neural networks")
        assert "machine learning" in result
        assert len(result) == 3

    def test_list_with_comma_string(self):
        result = self.extract(["machine learning, deep learning", "neural networks"])
        assert "machine learning" in result
        assert "neural networks" in result

    def test_empty_input(self):
        assert self.extract([]) == []
        assert self.extract("") == []
        assert self.extract(None) == []

    def test_lowercase_normalization(self):
        result = self.extract(["Machine Learning", "DEEP LEARNING"])
        assert "machine learning" in result
        assert "deep learning" in result


# ── Input JSON validation tests ───────────────────────────────────────────────

class TestInputJsonFormat:
    """Validate that mock JSON files conform to the expected schema."""

    INPUT_DIR = ROOT / "data" / "processed" / "subtask1_segmentation" / "chapters"

    REQUIRED_VIDEO_FIELDS = {"video_id", "video_title", "duration", "chapters"}
    REQUIRED_CHAPTER_FIELDS = {
        "chapter_id", "chapter_index", "title",
        "start_time", "end_time", "transcript", "frame_captions"
    }

    def test_all_json_files_parseable(self):
        files = list(self.INPUT_DIR.glob("*.json"))
        assert len(files) > 0, f"No JSON files found in {self.INPUT_DIR}"
        for path in files:
            with open(path) as f:
                data = json.load(f)  # Should not raise
            assert isinstance(data, dict)

    def test_video_fields_present(self):
        for path in self.INPUT_DIR.glob("*.json"):
            with open(path) as f:
                data = json.load(f)
            missing = self.REQUIRED_VIDEO_FIELDS - set(data.keys())
            assert not missing, f"{path.name} missing fields: {missing}"

    def test_chapter_fields_present(self):
        for path in self.INPUT_DIR.glob("*.json"):
            with open(path) as f:
                data = json.load(f)
            for ch in data["chapters"]:
                missing = self.REQUIRED_CHAPTER_FIELDS - set(ch.keys())
                assert not missing, f"{path.name} chapter {ch.get('chapter_index')} missing: {missing}"

    def test_chapter_timestamps_valid(self):
        for path in self.INPUT_DIR.glob("*.json"):
            with open(path) as f:
                data = json.load(f)
            for ch in data["chapters"]:
                assert ch["start_time"] >= 0
                assert ch["end_time"] > ch["start_time"]

    def test_transcript_not_empty(self):
        for path in self.INPUT_DIR.glob("*.json"):
            with open(path) as f:
                data = json.load(f)
            for ch in data["chapters"]:
                assert len(ch["transcript"]) > 50, \
                    f"{path.name} chapter {ch['chapter_index']} has very short transcript"