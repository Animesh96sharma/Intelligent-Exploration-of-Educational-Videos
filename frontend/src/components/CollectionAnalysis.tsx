// src/components/CollectionAnalysis.tsx

import { useMemo } from "react";
import type { CollectionAnalysisRecord, VideoRecord } from "../types/video";

type CollectionAnalysisProps = {
  analysis: CollectionAnalysisRecord;
  videos: VideoRecord[];
  onOpenVideo: (videoId: string) => void;
};

function formatMinutes(seconds: number) {
  return `${Math.round(seconds / 60)} min`;
}

export default function CollectionAnalysis({
  analysis,
  videos,
  onOpenVideo,
}: CollectionAnalysisProps) {
  const visibleVideoIds = useMemo(() => {
    return new Set(videos.map((video) => video.id));
  }, [videos]);

  const totalDuration = useMemo(() => {
    return videos.reduce((sum, video) => sum + video.duration, 0);
  }, [videos]);

  const domains = useMemo(() => {
    return Array.from(
      new Set(videos.map((video) => video.domain).filter(Boolean))
    ) as string[];
  }, [videos]);

  const suggestedOrder = useMemo(() => {
    return (analysis.overview?.suggested_viewing_order ?? []).filter((item) =>
      visibleVideoIds.has(item.video_id)
    );
  }, [analysis, visibleVideoIds]);

  const commonConceptEntries = useMemo(() => {
    return Object.entries(analysis.commonConcepts)
      .map(([concept, videoIds]) => {
        const filteredIds = videoIds.filter((videoId) => visibleVideoIds.has(videoId));
        return [concept, filteredIds] as const;
      })
      .filter(([, videoIds]) => videoIds.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
  }, [analysis, visibleVideoIds]);

  const uniqueConceptEntries = useMemo(() => {
    return Object.entries(analysis.uniqueConcepts).filter(([videoId]) =>
      visibleVideoIds.has(videoId)
    );
  }, [analysis, visibleVideoIds]);

  const visibleCount = videos.length;
  const totalCollectionCount = analysis.totalVideos;

  if (videos.length === 0) {
    return (
      <section className="collection-page">
        <div className="collection-hero">
          <div>
            <p className="eyebrow">Collection intelligence</p>
            <h2>No videos match the current filters</h2>
            <p>
              Clear or adjust the active search and filter settings to explore
              collection-level analysis again.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="collection-page">
      <div className="collection-hero">
        <div>
          <p className="eyebrow">Collection intelligence</p>
          <h2>Cross-video themes, overlaps, and recommended learning paths</h2>
          <p>
            Explore the collection-level summary, shared concepts, unique topic
            coverage, and the suggested viewing order derived from the processed
            summarization outputs.
          </p>
          <p className="section-note">
            Showing analysis for {visibleCount} visible video
            {visibleCount === 1 ? "" : "s"} out of {totalCollectionCount}.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Visible Videos</span>
          <strong>{visibleCount}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Total Duration</span>
          <strong>{formatMinutes(totalDuration)}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Shared Concepts</span>
          <strong>{commonConceptEntries.length}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Domains</span>
          <strong>{domains.length}</strong>
        </article>
      </div>

      <div className="collection-layout">
        <div className="collection-main">
          {analysis.overview && (
            <section className="panel">
              <h3>Overview</h3>

              {analysis.overview.collection_summary && (
                <p>{analysis.overview.collection_summary}</p>
              )}

              {analysis.overview.main_themes &&
                analysis.overview.main_themes.length > 0 && (
                  <>
                    <h4>Main themes</h4>
                    <div className="chip-group">
                      {analysis.overview.main_themes.map((theme) => (
                        <span key={theme} className="chip">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </>
                )}

              {analysis.overview.difficulty_progression && (
                <>
                  <h4>Difficulty progression</h4>
                  <p>{analysis.overview.difficulty_progression}</p>
                </>
              )}

              {analysis.overview.target_audience && (
                <>
                  <h4>Target audience</h4>
                  <p>{analysis.overview.target_audience}</p>
                </>
              )}

              {analysis.overview.knowledge_gaps &&
                analysis.overview.knowledge_gaps.length > 0 && (
                  <>
                    <h4>Knowledge gaps</h4>
                    <ul className="clean-list">
                      {analysis.overview.knowledge_gaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </>
                )}
            </section>
          )}

          <section className="panel">
            <h3>Shared concepts</h3>

            {commonConceptEntries.length === 0 ? (
              <p>No shared concepts available for the currently visible videos.</p>
            ) : (
              <div className="concept-list">
                {commonConceptEntries.map(([concept, videoIds]) => (
                  <article key={concept} className="concept-card">
                    <div className="concept-card__head">
                      <h4>{concept}</h4>
                      <span>{videoIds.length} videos</span>
                    </div>

                    <div className="related-list">
                      {videoIds.map((videoId) => {
                        const video = videos.find((item) => item.id === videoId);
                        if (!video) return null;

                        return (
                          <button
                            key={videoId}
                            className="related-card"
                            onClick={() => onOpenVideo(videoId)}
                          >
                            <strong>{video.title}</strong>
                            <span>{video.domain ?? "General"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <h3>Unique concepts by video</h3>

            {uniqueConceptEntries.length === 0 ? (
              <p>No unique concept breakdown is available for the current selection.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Video</th>
                      <th>Duration</th>
                      <th>Chapters</th>
                      <th>Difficulty</th>
                      <th>Unique concepts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueConceptEntries.map(([videoId, group]) => {
                      const video = videos.find((item) => item.id === videoId);
                      if (!video) return null;

                      return (
                        <tr key={videoId}>
                          <td>
                            <button
                              className="inline-link"
                              onClick={() => onOpenVideo(videoId)}
                            >
                              {group.video_title || video.title}
                            </button>
                          </td>
                          <td>{formatMinutes(video.duration)}</td>
                          <td>{video.chapters.length}</td>
                          <td>{video.difficultyLevel ?? "N/A"}</td>
                          <td>
                            <div className="chip-group compact">
                              {group.unique_concepts.slice(0, 6).map((concept) => (
                                <span key={concept} className="chip">
                                  {concept}
                                </span>
                              ))}
                              {group.unique_concepts.length > 6 && (
                                <span className="chip muted">
                                  +{group.unique_concepts.length - 6} more
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="collection-sidebar">
          <section className="panel">
            <h3>Suggested viewing order</h3>

            {suggestedOrder.length === 0 ? (
              <p>No recommended sequence is available for the current filtered set.</p>
            ) : (
              <ol className="ordered-list">
                {suggestedOrder.map((item, index) => {
                  const video = videos.find((v) => v.id === item.video_id);

                  return (
                    <li key={item.video_id} className="ordered-item">
                      <div>
                        <strong>
                          {index + 1}. {video?.title ?? item.video_id}
                        </strong>
                        <p>{item.reason}</p>
                      </div>

                      <button
                        className="secondary-btn"
                        onClick={() => onOpenVideo(item.video_id)}
                      >
                        Open
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="panel">
            <h3>Domains</h3>

            {domains.length === 0 ? (
              <p>No domains are visible with the current filters.</p>
            ) : (
              <div className="chip-group">
                {domains.map((domain) => (
                  <span key={domain} className="chip">
                    {domain}
                  </span>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}