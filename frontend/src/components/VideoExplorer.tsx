// src/components/VideoExplorer.tsx

import { useEffect, useMemo, useState } from "react";
import type { SummaryDetailLevel, VideoRecord, ChapterRecord } from "../types/video";
import VideoPlayer from "./VideoPlayer";
import VideoTimeline from "./VideoTimeline";

type VideoExplorerProps = {
  video: VideoRecord;
  allVideos: VideoRecord[];
  onSelectVideo: (videoId: string) => void;
};

function getBestChapterSummary(
  chapter: ChapterRecord,
  level: SummaryDetailLevel
): string {
  if (level === "long") {
    return chapter.summaryLong || chapter.summaryMedium || chapter.summaryShort;
  }

  if (level === "medium") {
    return chapter.summaryMedium || chapter.summaryShort;
  }

  return chapter.summaryShort;
}

function getActiveChapter(chapters: ChapterRecord[], currentTime: number): ChapterRecord | null {
  return (
    chapters.find(
      (chapter) => currentTime >= chapter.startTime && currentTime < chapter.endTime
    ) ?? chapters[chapters.length - 1] ?? null
  );
}

export default function VideoExplorer({
  video,
  allVideos,
  onSelectVideo,
}: VideoExplorerProps) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [summaryLevel, setSummaryLevel] = useState<SummaryDetailLevel>("medium");

  useEffect(() => {
    setSelectedChapterIndex(0);
    setCurrentTime(0);
  }, [video.id]);

  const selectedChapter =
    video.chapters[selectedChapterIndex] ?? video.chapters[0] ?? null;

  const activePlaybackChapter = useMemo(
    () => getActiveChapter(video.chapters, currentTime),
    [video.chapters, currentTime]
  );

  const relatedVideos = useMemo(() => {
    const currentConcepts = new Set(video.keyConcepts.map((item) => item.toLowerCase()));

    return allVideos
      .filter((candidate) => candidate.id !== video.id)
      .map((candidate) => {
        const overlap = candidate.keyConcepts.filter((concept) =>
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
  }, [allVideos, video]);

  function handleSelectChapter(index: number) {
    setSelectedChapterIndex(index);
    const nextChapter = video.chapters[index];
    if (nextChapter) {
      setCurrentTime(nextChapter.startTime);
    }
  }

  if (!selectedChapter) {
    return <div>No chapter data available.</div>;
  }

  return (
    <section className="video-explorer">
      <div className="video-explorer__header">
        <div>
          <p className="eyebrow">{video.domain ?? "Educational video"}</p>
          <h2>{video.title}</h2>
          <p className="meta">
            {video.speaker ?? "Unknown speaker"} · {video.totalChapters} chapters ·{" "}
            {Math.round(video.duration / 60)} min
          </p>
        </div>

        <div className="summary-toggle" role="tablist" aria-label="Summary detail">
          {(["short", "medium", "long"] as SummaryDetailLevel[]).map((level) => (
            <button
              key={level}
              className={summaryLevel === level ? "active" : ""}
              onClick={() => setSummaryLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="video-explorer__layout">
        <div className="video-explorer__main">
          <VideoPlayer
            src={video.videoSrc}
            title={video.title}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
          />

          <VideoTimeline
            chapters={video.chapters}
            activeChapterId={activePlaybackChapter?.id ?? null}
            selectedChapterId={selectedChapter.id}
            currentTime={currentTime}
            duration={video.duration}
            onSelectChapter={(chapter) =>
              handleSelectChapter(video.chapters.findIndex((item) => item.id === chapter.id))
            }
          />

          <article className="chapter-panel">
            <div className="chapter-panel__header">
              <div>
                <p className="eyebrow">Selected chapter</p>
                <h3>
                  {selectedChapter.index}. {selectedChapter.title}
                </h3>
              </div>
              <span className="time-range">
                {Math.floor(selectedChapter.startTime / 60)}:
                {String(selectedChapter.startTime % 60).padStart(2, "0")} -{" "}
                {Math.floor(selectedChapter.endTime / 60)}:
                {String(selectedChapter.endTime % 60).padStart(2, "0")}
              </span>
            </div>

            <p>{getBestChapterSummary(selectedChapter, summaryLevel)}</p>

            {selectedChapter.learningObjectives.length > 0 && (
              <div className="info-block">
                <h4>Learning objectives</h4>
                <ul>
                  {selectedChapter.learningObjectives.map((objective) => (
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
              {selectedChapter.keyConcepts.map((concept) => (
                <span key={concept} className="chip">
                  {concept}
                </span>
              ))}
            </div>
          </article>
        </div>

        <aside className="video-explorer__sidebar">
          <section className="sidebar-card">
            <h3>Video summary</h3>
            <p>
              {summaryLevel === "long"
                ? video.summaryLong || video.summaryMedium || video.summaryShort
                : summaryLevel === "medium"
                ? video.summaryMedium || video.summaryShort
                : video.summaryShort}
            </p>
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
            <h3>Related videos</h3>
            <div className="related-list">
              {relatedVideos.length === 0 && <p>No related videos found yet.</p>}
              {relatedVideos.map(({ video: related, overlap }) => (
                <button
                  key={related.id}
                  className="related-card"
                  onClick={() => onSelectVideo(related.id)}
                >
                  <strong>{related.title}</strong>
                  <span>{related.domain}</span>
                  <small>{overlap.slice(0, 4).join(", ")}</small>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}