// src/components/ComparisonView.tsx

import { useMemo } from "react";
import type { VideoRecord } from "../types/video";
import { buildVideoComparison } from "../lib/analytics";

type ComparisonViewProps = {
  videos: VideoRecord[];
  allVideos: VideoRecord[];
  selectedConcept: string | null;
  onOpenVideo: (videoId: string) => void;
  onSelectConcept: (concept: string | null) => void;
  onToggleCompareVideo: (videoId: string) => void;
};

export default function ComparisonView({
  videos,
  allVideos,
  selectedConcept,
  onOpenVideo,
  onSelectConcept,
  onToggleCompareVideo,
}: ComparisonViewProps) {
  const [leftVideo, rightVideo] = videos;

  const comparison = useMemo(() => {
    if (!leftVideo || !rightVideo || leftVideo.id === rightVideo.id) return null;
    return buildVideoComparison(leftVideo, rightVideo);
  }, [leftVideo, rightVideo]);

  if (!leftVideo || !rightVideo || leftVideo.id === rightVideo.id) {
  return (
    <section className="comparison-page">
      <div className="page-intro">
        <div className="page-intro-copy">
          <p className="eyebrow">Comparison View</p>
          <h2>
            Side-by-Side Comparison
            <span>of Educational Videos</span>
          </h2>
          <p>
            Compare summaries, chapter structure, learning objectives, and concept
            overlap across two selected videos in one workspace.
          </p>
        </div>
      </div>

      <div className="results-head">
        <h3>Available videos for comparison</h3>
        <span>{allVideos.length} videos</span>
      </div>

        <div className="video-grid">
          {allVideos.map((video) => {
            const isSelected = videos.some((item) => item.id === video.id);

            return (
              <button
                key={video.id}
                className={`video-card ${isSelected ? "selected" : ""}`}
                onClick={() => onToggleCompareVideo(video.id)}
              >
                <p className="eyebrow">{video.domain ?? "General"}</p>
                <h3>{video.title}</h3>
                <p>{video.summaryShort}</p>

                <div className="video-card__meta">
                  <span>{video.speaker ?? "Unknown speaker"}</span>
                  <span>{Math.round(video.duration / 60)} min</span>
                  <span>{video.totalChapters} chapters</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

 return (
  <section className="comparison-page">
    <div className="page-intro">
      <div className="page-intro-copy">
        <p className="eyebrow">Comparison View</p>
        <h2>
          Side-by-Side Comparison
          <span>of Educational Videos</span>
        </h2>
        <p>
          Inspect overlap, unique concepts, chapter structure, and summary
          differences across two selected educational videos.
        </p>
        {selectedConcept ? (
          <p className="section-note">Focused concept: {selectedConcept}</p>
        ) : null}
      </div>
    </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Shared concepts</span>
          <strong>{comparison?.sharedConcepts.length ?? 0}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Similarity</span>
          <strong>{Math.round((comparison?.similarityScore ?? 0) * 100)}%</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Left chapters</span>
          <strong>{leftVideo.totalChapters}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Right chapters</span>
          <strong>{rightVideo.totalChapters}</strong>
        </article>
      </div>

      <div className="comparison-layout">
        {[leftVideo, rightVideo].map((video) => (
          <section key={video.id} className="panel comparison-column">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{video.domain ?? "General"}</p>
                <h3>{video.title}</h3>
              </div>

              <div className="comparison-actions">
                <button
                  className="secondary-btn"
                  onClick={() => onToggleCompareVideo(video.id)}
                >
                  Remove
                </button>
                <button
                  className="primary-btn"
                  onClick={() => onOpenVideo(video.id)}
                >
                  Open video
                </button>
              </div>
            </div>

            <p>{video.summaryMedium || video.summaryShort}</p>

            <div className="info-block">
              <h4>Key concepts</h4>
              <div className="chip-group">
                {video.keyConcepts.map((concept) => (
                  <button
                    key={concept}
                    className={`chip ${selectedConcept === concept ? "active" : ""}`}
                    onClick={() => onSelectConcept(concept)}
                  >
                    {concept}
                  </button>
                ))}
              </div>
            </div>

            <div className="info-block">
              <h4>Learning objectives</h4>
              {video.learningObjectives.length === 0 ? (
                <p>No learning objectives available.</p>
              ) : (
                <ul className="clean-list">
                  {video.learningObjectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="info-block">
              <h4>Chapters</h4>
              <ul className="clean-list chapter-compare-list">
                {video.chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <strong>
                      {chapter.index}. {chapter.title}
                    </strong>
                    <span>
                      {Math.round((chapter.endTime - chapter.startTime) / 60)} min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {comparison && (
        <section className="panel">
          <h3>Concept comparison</h3>

          <div className="info-block">
            <h4>Shared concepts</h4>
            {comparison.sharedConcepts.length === 0 ? (
              <p>No shared concepts detected.</p>
            ) : (
              <div className="chip-group">
                {comparison.sharedConcepts.map((concept) => (
                  <button
                    key={concept}
                    className={`chip ${selectedConcept === concept ? "active" : ""}`}
                    onClick={() => onSelectConcept(concept)}
                  >
                    {concept}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="comparison-unique-grid">
            <div className="panel comparison-subpanel">
              <h4>Unique to {leftVideo.title}</h4>
              <div className="chip-group">
                {comparison.leftUniqueConcepts.map((concept) => (
                  <span key={concept} className="chip muted">
                    {concept}
                  </span>
                ))}
                {comparison.leftUniqueConcepts.length === 0 && (
                  <p>No unique concepts listed.</p>
                )}
              </div>
            </div>

            <div className="panel comparison-subpanel">
              <h4>Unique to {rightVideo.title}</h4>
              <div className="chip-group">
                {comparison.rightUniqueConcepts.map((concept) => (
                  <span key={concept} className="chip muted">
                    {concept}
                  </span>
                ))}
                {comparison.rightUniqueConcepts.length === 0 && (
                  <p>No unique concepts listed.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}