// src/components/NetworkView.tsx

import { useMemo, useState } from "react";
import type { VideoRecord } from "../types/video";
import { normalizeConceptLabel } from "../lib/analytics";

type NetworkViewProps = {
  videos: VideoRecord[];
  selectedVideoId: string | null;
  onOpenVideo: (videoId: string) => void;
  onSelectConcept: (concept: string | null) => void;
  selectedConcept: string | null;
};

type VideoEdge = {
  sourceId: string;
  targetId: string;
  sharedConcepts: string[];
  weight: number;
};

function buildEdges(videos: VideoRecord[], selectedConcept: string | null): VideoEdge[] {
  const normalizedSelectedConcept = selectedConcept
    ? normalizeConceptLabel(selectedConcept)
    : null;

  const edges: VideoEdge[] = [];

  for (let i = 0; i < videos.length; i += 1) {
    for (let j = i + 1; j < videos.length; j += 1) {
      const left = videos[i];
      const right = videos[j];

      const leftConceptMap = new Map(
        left.keyConcepts.map((concept) => [normalizeConceptLabel(concept), concept])
      );

      const sharedConcepts = right.keyConcepts.filter((concept) => {
        const normalized = normalizeConceptLabel(concept);
        const matchesLeft = leftConceptMap.has(normalized);
        const matchesSelected =
          !normalizedSelectedConcept || normalized === normalizedSelectedConcept;
        return matchesLeft && matchesSelected;
      });

      if (sharedConcepts.length > 0) {
        edges.push({
          sourceId: left.id,
          targetId: right.id,
          sharedConcepts,
          weight: sharedConcepts.length,
        });
      }
    }
  }

  return edges.sort((a, b) => b.weight - a.weight);
}

function getVideoById(videos: VideoRecord[], id: string) {
  return videos.find((video) => video.id === id) ?? null;
}

export default function NetworkView({
  videos,
  selectedVideoId,
  onOpenVideo,
  onSelectConcept,
  selectedConcept,
}: NetworkViewProps) {
  const [minimumOverlap, setMinimumOverlap] = useState(1);
  const [focusedVideoId, setFocusedVideoId] = useState<string | null>(selectedVideoId);

  const edges = useMemo(
    () => buildEdges(videos, selectedConcept),
    [videos, selectedConcept]
  );

  const maxOverlap = useMemo(() => {
    if (edges.length === 0) return 1;
    return Math.max(...edges.map((edge) => edge.weight));
  }, [edges]);

  const filteredEdges = useMemo(() => {
    return edges.filter((edge) => edge.weight >= minimumOverlap);
  }, [edges, minimumOverlap]);

  const connectedVideoIds = useMemo(() => {
    const ids = new Set<string>();

    filteredEdges.forEach((edge) => {
      ids.add(edge.sourceId);
      ids.add(edge.targetId);
    });

    return ids;
  }, [filteredEdges]);

  const visibleVideos = useMemo(() => {
    if (filteredEdges.length === 0) return videos;
    return videos.filter((video) => connectedVideoIds.has(video.id));
  }, [videos, filteredEdges, connectedVideoIds]);

  const focusEdges = useMemo(() => {
    if (!focusedVideoId) return filteredEdges;

    return filteredEdges.filter(
      (edge) => edge.sourceId === focusedVideoId || edge.targetId === focusedVideoId
    );
  }, [filteredEdges, focusedVideoId]);

  const focusNeighbors = useMemo(() => {
    if (!focusedVideoId) return [];

    const neighborIds = new Set<string>();

    focusEdges.forEach((edge) => {
      if (edge.sourceId === focusedVideoId) neighborIds.add(edge.targetId);
      if (edge.targetId === focusedVideoId) neighborIds.add(edge.sourceId);
    });

    return videos.filter((video) => neighborIds.has(video.id));
  }, [focusEdges, focusedVideoId, videos]);

  const focusedVideo = focusedVideoId ? getVideoById(videos, focusedVideoId) : null;

  if (videos.length === 0) {
    return (
      <section className="network-page">
        <div className="network-hero">
          <p className="eyebrow">Network exploration</p>
          <h2>No videos match the current filters</h2>
          <p>
            Adjust the active search or filters to see concept relationships between videos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="network-page">
      <div className="network-hero">
        <div>
          <p className="eyebrow">Network exploration</p>
          <h2>Explore concept overlap across the visible video set</h2>
          <p>
            This view connects videos through shared key concepts. Increase the
            overlap threshold to focus on stronger conceptual relationships.
          </p>
          {selectedConcept && (
            <p className="section-note">Focused concept: {selectedConcept}</p>
          )}
        </div>

        {selectedConcept && (
          <button className="secondary-btn" onClick={() => onSelectConcept(null)}>
            Clear concept
          </button>
        )}
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Visible Videos</span>
          <strong>{videos.length}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Connected Videos</span>
          <strong>{visibleVideos.length}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Relationships</span>
          <strong>{filteredEdges.length}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Min Overlap</span>
          <strong>{minimumOverlap}</strong>
        </article>
      </div>

      <section className="panel">
        <div className="network-toolbar">
          <div>
            <h3>Relationship threshold</h3>
            <p>
              Show only links where videos share at least {minimumOverlap} concept
              {minimumOverlap === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="network-toolbar__controls">
            <label htmlFor="overlapRange">Minimum shared concepts</label>
            <input
              id="overlapRange"
              type="range"
              min={1}
              max={maxOverlap}
              value={minimumOverlap}
              onChange={(e) => setMinimumOverlap(Number(e.target.value))}
            />
            <span>{minimumOverlap}</span>
          </div>
        </div>
      </section>

      <div className="network-layout">
        <div className="network-main">
          <section className="panel">
            <div className="panel-head">
              <h3>Video nodes</h3>
              {focusedVideo && (
                <button
                  className="secondary-btn"
                  onClick={() => setFocusedVideoId(null)}
                >
                  Clear focus
                </button>
              )}
            </div>

            <div className="node-grid">
              {visibleVideos.map((video) => {
                const isSelected = video.id === selectedVideoId;
                const isFocused = video.id === focusedVideoId;

                const connectionCount = filteredEdges.filter(
                  (edge) => edge.sourceId === video.id || edge.targetId === video.id
                ).length;

                return (
                  <article
                    key={video.id}
                    className={[
                      "node-card",
                      isSelected ? "selected" : "",
                      isFocused ? "focused" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="node-card__head">
                      <p className="eyebrow">{video.domain ?? "General"}</p>
                      <span>{connectionCount} links</span>
                    </div>

                    <h4>{video.title}</h4>
                    <p>{video.summaryShort}</p>

                    <div className="chip-group compact">
                      {video.keyConcepts.slice(0, 4).map((concept) => (
                        <button
                          key={concept}
                          type="button"
                          className={`chip ${selectedConcept === concept ? "active" : ""}`}
                          onClick={() => onSelectConcept(concept)}
                        >
                          {concept}
                        </button>
                      ))}
                    </div>

                    <div className="node-card__actions">
                      <span>{video.totalChapters} chapters</span>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setFocusedVideoId(video.id)}
                      >
                        Focus node
                      </button>
                      <button
                        type="button"
                        className="inline-link"
                        onClick={() => onOpenVideo(video.id)}
                      >
                        Open video
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h3>Relationships</h3>

            {focusEdges.length === 0 ? (
              <p>
                No relationships match the current threshold
                {focusedVideo ? " for the focused video" : ""}.
              </p>
            ) : (
              <div className="relationship-list">
                {focusEdges.map((edge) => {
                  const source = getVideoById(videos, edge.sourceId);
                  const target = getVideoById(videos, edge.targetId);

                  if (!source || !target) return null;

                  return (
                    <article
                      key={`${edge.sourceId}-${edge.targetId}`}
                      className="relationship-card"
                    >
                      <div className="relationship-card__head">
                        <div>
                          <strong>{source.title}</strong>
                          <span>↔</span>
                          <strong>{target.title}</strong>
                        </div>
                        <span className="weight-badge">
                          {edge.weight} shared concept{edge.weight === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="chip-group compact">
                        {edge.sharedConcepts.map((concept) => (
                          <button
                            key={concept}
                            type="button"
                            className={`chip ${selectedConcept === concept ? "active" : ""}`}
                            onClick={() => onSelectConcept(concept)}
                          >
                            {concept}
                          </button>
                        ))}
                      </div>

                      <div className="relationship-actions">
                        <button
                          className="secondary-btn"
                          onClick={() => onOpenVideo(edge.sourceId)}
                        >
                          Open source
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => onOpenVideo(edge.targetId)}
                        >
                          Open target
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="network-sidebar">
          <section className="panel">
            <h3>Focused video</h3>

            {!focusedVideo ? (
              <p>Select a video node to inspect its immediate concept neighbors.</p>
            ) : (
              <div className="focused-panel">
                <p className="eyebrow">{focusedVideo.domain ?? "General"}</p>
                <h4>{focusedVideo.title}</h4>
                <p>{focusedVideo.summaryShort}</p>

                <div className="chip-group compact">
                  {focusedVideo.keyConcepts.map((concept) => (
                    <button
                      key={concept}
                      type="button"
                      className={`chip ${selectedConcept === concept ? "active" : ""}`}
                      onClick={() => onSelectConcept(concept)}
                    >
                      {concept}
                    </button>
                  ))}
                </div>

                <button
                  className="primary-btn"
                  onClick={() => onOpenVideo(focusedVideo.id)}
                >
                  Open video explorer
                </button>
              </div>
            )}
          </section>

          <section className="panel">
            <h3>Immediate neighbors</h3>

            {focusedVideoId && focusNeighbors.length === 0 ? (
              <p>No visible neighbors meet the current overlap threshold.</p>
            ) : !focusedVideoId ? (
              <p>Choose a video to inspect directly connected videos.</p>
            ) : (
              <div className="related-list">
                {focusNeighbors.map((video) => (
                  <button
                    key={video.id}
                    className="related-card"
                    onClick={() => setFocusedVideoId(video.id)}
                  >
                    <strong>{video.title}</strong>
                    <span>{video.domain ?? "General"}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}