// src/components/HomePage.tsx

import type { VideoRecord } from "../types/video";

type HomePageProps = {
  videos: VideoRecord[];
  selectedVideoId: string | null;
  onOpenVideo: (videoId: string) => void;
  onOpenCollection: () => void;
  onOpenNetwork: () => void;
};

export default function HomePage({
  videos,
  selectedVideoId,
  onOpenVideo,
  onOpenCollection,
  onOpenNetwork,
}: HomePageProps) {
  return (
    <section className="home-page">
      <div className="home-hero">
        <div>
          <p className="eyebrow">Educational video intelligence</p>
          <h2>Browse videos, chapter summaries, and concept-level relationships</h2>
          <p>
            This interface supports search, chapter-based exploration, collection
            comparison, and network-style topic discovery across the processed
            educational video dataset.
          </p>
        </div>

        <div className="hero-actions">
          <button className="primary-btn" onClick={onOpenCollection}>
            Open collection analysis
          </button>
          <button className="secondary-btn" onClick={onOpenNetwork}>
            Open network view
          </button>
        </div>
      </div>

      <div className="results-head">
        <h3>Available videos</h3>
        <span>{videos.length} results</span>
      </div>

<div className="video-grid">
  {videos.length === 0 ? (
    <div className="empty-state">
      <h3>No matching videos</h3>
      <p>Try a different search term or reset the filters.</p>
    </div>
  ) : (
    videos.map((video) => (
      <button
        key={video.id}
        className={`video-card ${selectedVideoId === video.id ? "selected" : ""}`}
        onClick={() => onOpenVideo(video.id)}
      >
        <p className="eyebrow">{video.domain ?? "General"}</p>
        <h3>{video.title}</h3>
        <p>{video.summaryShort}</p>

        <div className="video-card__meta">
          <span>{video.speaker ?? "Unknown speaker"}</span>
          <span>{Math.round(video.duration / 60)} min</span>
          <span>{video.totalChapters} chapters</span>
          <span>{video.difficultyLevel ?? "N/A"}</span>
        </div>

        <div className="chip-group compact">
          {video.keyConcepts.slice(0, 4).map((concept) => (
            <span key={concept} className="chip">
              {concept}
            </span>
          ))}
        </div>
      </button>
    ))
  )}
</div>
    </section>
  );
}