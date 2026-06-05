// src/components/VideoExplorer.tsx

import { useEffect, useMemo, useState } from "react";
import type { SummaryDetailLevel, VideoRecord, ChapterRecord } from "../types/video";
import VideoPlayer from "./VideoPlayer";
import VideoTimeline from "./VideoTimeline";

type VideoExplorerProps = {
  video: VideoRecord;
  allVideos: VideoRecord[];
  onSelectVideo: (videoId: string) => void;
  onToggleCompareVideo: (videoId: string) => void;
  onSelectConcept: (concept: string) => void;
  selectedConcept: string | null;
  onOpenComparison: (videoId?: string) => void;
};

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function ensureChapterArray(value: unknown): ChapterRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ChapterRecord =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "title" in item &&
      "startTime" in item &&
      "endTime" in item
  );
}

function getBestChapterSummary(
  chapter: ChapterRecord | null,
  level: SummaryDetailLevel
): string {
  if (!chapter) return "No chapter summary available.";

  if (level === "long") {
    return (
      chapter.summaryLong ||
      chapter.summaryMedium ||
      chapter.summaryShort ||
      "No chapter summary available."
    );
  }

  if (level === "medium") {
    return chapter.summaryMedium || chapter.summaryShort || "No chapter summary available.";
  }

  return chapter.summaryShort || "No chapter summary available.";
}

function getBestVideoSummary(
  video: VideoRecord,
  level: SummaryDetailLevel
): string {
  if (level === "long") {
    return (
      video.summaryLong ||
      video.summaryMedium ||
      video.summaryShort ||
      "No video summary available."
    );
  }

  if (level === "medium") {
    return video.summaryMedium || video.summaryShort || "No video summary available.";
  }

  return video.summaryShort || "No video summary available.";
}

function getActiveChapter(
  chapters: ChapterRecord[],
  currentTime: number
): ChapterRecord | null {
  if (chapters.length === 0) return null;

  return (
    chapters.find(
      (chapter) =>
        currentTime >= (chapter.startTime ?? 0) &&
        currentTime < (chapter.endTime ?? 0)
    ) ??
    chapters[chapters.length - 1] ??
    null
  );
}

function formatTime(seconds: number | undefined): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds ?? 0)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function VideoExplorer({
  video,
  allVideos,
  onSelectVideo,
  onToggleCompareVideo,
  onSelectConcept,
  selectedConcept,
  onOpenComparison,
}: VideoExplorerProps) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [summaryLevel, setSummaryLevel] = useState<SummaryDetailLevel>("medium");

  const chapters = useMemo(() => ensureChapterArray(video?.chapters), [video?.chapters]);
  const videoConcepts = useMemo(() => ensureStringArray(video?.keyConcepts), [video?.keyConcepts]);
  const safeAllVideos = useMemo(
    () => (Array.isArray(allVideos) ? allVideos.filter(Boolean) : []),
    [allVideos]
  );

  useEffect(() => {
    setSelectedChapterIndex(0);
    setCurrentTime(0);
  }, [video?.id]);

  useEffect(() => {
    if (chapters.length === 0) {
      if (selectedChapterIndex !== 0) {
        setSelectedChapterIndex(0);
      }
      return;
    }

    if (selectedChapterIndex < 0 || selectedChapterIndex >= chapters.length) {
      setSelectedChapterIndex(0);
    }
  }, [chapters, selectedChapterIndex]);

  const selectedChapter = useMemo(() => {
    if (chapters.length === 0) return null;
    return chapters[selectedChapterIndex] ?? chapters[0] ?? null;
  }, [chapters, selectedChapterIndex]);

  const selectedChapterConcepts = useMemo(
    () => ensureStringArray(selectedChapter?.keyConcepts),
    [selectedChapter]
  );

  const selectedChapterObjectives = useMemo(
    () => ensureStringArray(selectedChapter?.learningObjectives),
    [selectedChapter]
  );

  const activePlaybackChapter = useMemo(
    () => getActiveChapter(chapters, currentTime),
    [chapters, currentTime]
  );

  const relatedVideos = useMemo(() => {
    const currentConcepts = new Set(
      videoConcepts.map((item) => item.toLowerCase())
    );

    return safeAllVideos
      .filter((candidate) => candidate && candidate.id !== video.id)
      .map((candidate) => {
        const candidateConcepts = ensureStringArray(candidate.keyConcepts);

        const overlap = candidateConcepts.filter((concept) =>
          currentConcepts.has(concept.toLowerCase())
        );

        return {
          video: candidate,
          overlap,
          score: overlap.length,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [safeAllVideos, video.id, videoConcepts]);

  function handleSelectChapter(index: number) {
    if (index < 0 || index >= chapters.length) return;

    setSelectedChapterIndex(index);

    const nextChapter = chapters[index];
    if (nextChapter) {
      setCurrentTime(nextChapter.startTime ?? 0);
    }
  }

  if (!video) {
    return <div className="video-explorer">No video data available.</div>;
  }

  if (chapters.length === 0 || !selectedChapter) {
    return (
      <section className="video-explorer">
        <div className="video-explorer__header">
          <div>
            <p className="eyebrow">{video.domain ?? "Educational video"}</p>
            <h2>{video.title ?? "Untitled video"}</h2>
            <p className="meta">
              {video.speaker ?? "Unknown speaker"} · {video.totalChapters ?? 0} chapters ·{" "}
              {Math.round((video.duration ?? 0) / 60)} min
            </p>
          </div>

          <div className="video-explorer__header-actions">
            <div className="summary-toggle" role="tablist" aria-label="Summary detail">
              {(["short", "medium", "long"] as SummaryDetailLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={summaryLevel === level ? "active" : ""}
                  onClick={() => setSummaryLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onToggleCompareVideo(video.id)}
              >
                Add to compare
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => onOpenComparison(video.id)}
              >
                Open comparison
              </button>
            </div>
          </div>
        </div>

        <div className="video-explorer__layout">
          <div className="video-explorer__main">
            <VideoPlayer
              videoId={video.id}
              src={video.videoSrc ?? ""}
              title={video.title ?? "Untitled video"}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
            />

            <article className="chapter-panel">
              <div className="chapter-panel__header">
                <div>
                  <p className="eyebrow">Selected chapter</p>
                  <h3>No chapter data available</h3>
                </div>
              </div>

              <p>This video does not currently have usable chapter information.</p>
            </article>
          </div>

          <aside className="video-explorer__sidebar">
            <section className="sidebar-card">
              <h3>Video summary</h3>
              <p>{getBestVideoSummary(video, summaryLevel)}</p>
            </section>

            <section className="sidebar-card">
              <h3>Video concepts</h3>
              <div className="chip-group">
                {videoConcepts.length === 0 ? (
                  <p>No concepts available.</p>
                ) : (
                  videoConcepts.map((concept) => (
                    <button
                      key={concept}
                      type="button"
                      className={`chip ${selectedConcept === concept ? "active" : ""}`}
                      onClick={() => onSelectConcept(concept)}
                    >
                      {concept}
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="video-explorer">
      <div className="video-explorer__header">
        <div>
          <p className="eyebrow">{video.domain ?? "Educational video"}</p>
          <h2>{video.title ?? "Untitled video"}</h2>
          <p className="meta">
            {video.speaker ?? "Unknown speaker"} · {video.totalChapters ?? chapters.length} chapters ·{" "}
            {Math.round((video.duration ?? 0) / 60)} min
          </p>
        </div>

        <div className="video-explorer__header-actions">
          <div className="summary-toggle" role="tablist" aria-label="Summary detail">
            {(["short", "medium", "long"] as SummaryDetailLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                className={summaryLevel === level ? "active" : ""}
                onClick={() => setSummaryLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="hero-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onToggleCompareVideo(video.id)}
            >
              Add to compare
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => onOpenComparison(video.id)}
            >
              Open comparison
            </button>
          </div>
        </div>
      </div>

      <div className="video-explorer__layout">
        <div className="video-explorer__main">
          <VideoPlayer
            videoId={video.id}
            src={video.videoSrc ?? ""}
            title={video.title ?? "Untitled video"}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
          />

          <VideoTimeline
            chapters={chapters}
            activeChapterId={activePlaybackChapter?.id ?? null}
            selectedChapterId={selectedChapter?.id ?? null}
            currentTime={currentTime}
            duration={video.duration ?? 0}
            summaryLevel={summaryLevel}
            onSelectChapter={(chapter) => {
              const chapterIndex = chapters.findIndex((item) => item.id === chapter.id);
              if (chapterIndex >= 0) {
                handleSelectChapter(chapterIndex);
              }
            }}
          />

          <article className="chapter-panel">
            <div className="chapter-panel__header">
              <div>
                <p className="eyebrow">Selected chapter</p>
                <h3>
                  {selectedChapter.index ?? selectedChapterIndex + 1}.{" "}
                  {selectedChapter.title ?? "Untitled chapter"}
                </h3>
              </div>
              <span className="time-range">
                {formatTime(selectedChapter.startTime)} - {formatTime(selectedChapter.endTime)}
              </span>
            </div>

            <p>{getBestChapterSummary(selectedChapter, summaryLevel)}</p>

            {selectedChapterObjectives.length > 0 && (
              <div className="info-block">
                <h4>Learning objectives</h4>
                <ul>
                  {selectedChapterObjectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedChapter.visualDescription && (
              <div className="info-block">
                <h4>Visual description</h4>
                <p>{selectedChapter.visualDescription}</p>
              </div>
            )}

            <div className="chip-group">
              {selectedChapterConcepts.length === 0 ? (
                <p>No chapter concepts available.</p>
              ) : (
                selectedChapterConcepts.map((concept) => (
                  <button
                    key={concept}
                    type="button"
                    className={`chip ${selectedConcept === concept ? "active" : ""}`}
                    onClick={() => onSelectConcept(concept)}
                  >
                    {concept}
                  </button>
                ))
              )}
            </div>
          </article>
        </div>

        <aside className="video-explorer__sidebar">
          <section className="sidebar-card">
            <h3>Video summary</h3>
            <p>{getBestVideoSummary(video, summaryLevel)}</p>
          </section>

          <section className="sidebar-card">
            <h3>Video details</h3>
            <ul className="meta-list">
              <li>Speaker: {video.speaker ?? "Unknown"}</li>
              <li>Domain: {video.domain ?? "Unspecified"}</li>
              <li>Difficulty: {video.difficultyLevel ?? "Not available"}</li>
              <li>Code examples: {video.hasCodeExamples ? "Yes" : "No"}</li>
              <li>Math content: {video.hasMathematicalContent ? "Yes" : "No"}</li>
              <li>Diagrams: {video.hasDiagrams ? "Yes" : "No"}</li>
            </ul>
          </section>

          <section className="sidebar-card">
            <h3>Video concepts</h3>
            <div className="chip-group">
              {videoConcepts.length === 0 ? (
                <p>No concepts available.</p>
              ) : (
                videoConcepts.map((concept) => (
                  <button
                    key={concept}
                    type="button"
                    className={`chip ${selectedConcept === concept ? "active" : ""}`}
                    onClick={() => onSelectConcept(concept)}
                  >
                    {concept}
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="sidebar-card">
            <h3>Related videos</h3>
            <div className="related-list">
              {relatedVideos.length === 0 && <p>No related videos found yet.</p>}

              {relatedVideos.map(({ video: related, overlap }) => (
                <button
                  key={related.id}
                  type="button"
                  className="related-card"
                  onClick={() => onSelectVideo(related.id)}
                >
                  <strong>{related.title ?? "Untitled video"}</strong>
                  <span>{related.domain ?? "General"}</span>
                  <small>
                    {overlap.length > 0 ? overlap.slice(0, 4).join(", ") : "No shared concepts"}
                  </small>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}