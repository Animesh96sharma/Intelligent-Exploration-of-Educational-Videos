import { useMemo, useState, useRef, useEffect } from "react";
import type { VideoRecord } from "../types/video";

type HomePageProps = {
  videos: VideoRecord[];
  selectedVideoId: string | null;
  comparisonVideoIds: string[];
  onOpenVideo: (videoId: string) => void;
  onOpenCollection: () => void;
  onOpenNetwork: () => void;
  onToggleCompareVideo: (videoId: string) => void;
  onSelectConcept: (concept: string) => void;
};

const TOP_CONCEPT_LIMIT = 10;

function formatDuration(seconds: number) {
  return `${Math.round(seconds / 60)} min`;
}

export default function HomePage({
  videos,
  selectedVideoId,
  comparisonVideoIds,
  onOpenVideo,
  onOpenCollection,
  onOpenNetwork,
  onToggleCompareVideo,
  onSelectConcept,
}: HomePageProps) {
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [unmutedIds, setUnmutedIds] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const topConcepts = useMemo(() => {
    const counts = new Map<string, number>();
    videos.forEach((video) => {
      video.keyConcepts.forEach((concept) => {
        counts.set(concept, (counts.get(concept) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_CONCEPT_LIMIT)
      .map(([concept]) => concept);
  }, [videos]);

  const displayedVideos = useMemo(() => {
    if (!activeConcept) return videos;
    return videos.filter((video) => video.keyConcepts.includes(activeConcept));
  }, [videos, activeConcept]);

  const handleConceptFilterClick = (concept: string | null) => {
    setActiveConcept(concept);
    onSelectConcept(concept ?? "");
  };
  
  const isMuted = (id: string) => !mutedIds.has(id) ? true : mutedIds.has(id);
  // Default: muted. Track "unmuted" ids instead for clarity:

  const toggleMute = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setUnmutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const seekingIdRef = useRef<string | null>(null);

const seekToPosition = (id: string, clientX: number, trackEl: HTMLDivElement) => {
  const el = videoRefs.current[id];
  if (!el || !el.duration) return;
  const rect = trackEl.getBoundingClientRect();
  const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  el.currentTime = ratio * el.duration;
  setProgressMap((prev) => ({ ...prev, [id]: ratio * 100 }));
};

const justSeekedRef = useRef(false);

const handleSeekStart = (id: string, event: React.MouseEvent<HTMLDivElement>) => {
  event.stopPropagation();
  const trackEl = event.currentTarget;
  seekingIdRef.current = id;
  justSeekedRef.current = true;
  seekToPosition(id, event.clientX, trackEl);

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (seekingIdRef.current !== id) return;
    seekToPosition(id, moveEvent.clientX, trackEl);
  };

  const handleMouseUp = () => {
    seekingIdRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    setTimeout(() => {
      justSeekedRef.current = false;
    }, 0);
  };

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
};

  const handleTimeUpdate = (id: string) => {
    const el = videoRefs.current[id];
    if (!el || !el.duration) return;
    setProgressMap((prev) => ({ ...prev, [id]: (el.currentTime / el.duration) * 100 }));
  };

  const handleMenuAction = (action: string, video: VideoRecord) => {
    setOpenMenuId(null);
    switch (action) {
      case "watch-later":
        console.log("Save to Watch Later:", video.id);
        break;
      case "playlist":
        console.log("Add to Playlist:", video.id);
        break;
      case "download":
        console.log("Download:", video.id);
        break;
      case "share":
        navigator.clipboard?.writeText(`${window.location.origin}/video/${video.id}`);
        break;
      case "interested":
        console.log("Interested:", video.id);
        break;
      case "not-interested":
        console.log("Not interested:", video.id);
        break;
      default:
        break;
    }
  };

  return (
    <section className="home-page">
      <div className="home-hero">
        <div>
          <h1>Browse videos, chapter summaries, and important concept-level relationships</h1>
          <p>
            This interface supports timeline & chapter-based exploration, including the hierarchical-based summaries across the processed educational video dataset.
          </p>
        </div>
      </div>

      <div className="concept-filter-bar">
        <button
          type="button"
          className={`chip concept-filter-chip ${!activeConcept ? "active" : ""}`}
          onClick={() => handleConceptFilterClick(null)}
        >
          All
        </button>

        {topConcepts.map((concept) => (
          <button
            key={concept}
            type="button"
            className={`chip concept-filter-chip ${activeConcept === concept ? "active" : ""}`}
            onClick={() => handleConceptFilterClick(concept)}
          >
            {concept}
          </button>
        ))}
      </div>

      <div className="results-head">
        <h3>
          Available videos: <span>{displayedVideos.length} results</span>
        </h3>
      </div>

      

      <div className="video-grid video-grid--youtube">
        {displayedVideos.length === 0 ? (
          <div className="empty-state">
            <h3>No matching videos</h3>
            <p>Try a different concept, search term, or reset the filters.</p>
          </div>
        ) : (
          displayedVideos.map((video) => {
            const isSelected = selectedVideoId === video.id;
            const isInComparison = comparisonVideoIds.includes(video.id);
            const videoSrc = video.videoSrc;
            const topicsLabel =
              video.keyConcepts.slice(0, 2).join(", ") || video.domain || "General";
            const isHovered = hoveredId === video.id;
            const isUnmuted = unmutedIds.has(video.id);
            const progress = progressMap[video.id] ?? 0;
            const isMenuOpen = openMenuId === video.id;

            return (
              <article
                key={video.id}
                className={["video-card", "video-card--tile", isSelected ? "selected" : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="video-cardsurface"
                  onClick={() => onOpenVideo(video.id)}
                  onMouseEnter={() => setHoveredId(video.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenVideo(video.id);
                    }
                  }}
                >
                  <div className="video-card-thumbnail">
                    {videoSrc ? (
                      <video
                        key={video.id}
                        className="video-card-thumbnail-media"
                        src={videoSrc}
                        muted={!isUnmuted}
                        loop
                        playsInline
                        preload="metadata"
                        onTimeUpdate={() => handleTimeUpdate(video.id)}
                        ref={(el) => {
                          videoRefs.current[video.id] = el;
                          if (!el) return;
                          if (isHovered) {
                            el.play().catch(() => {});
                          } else {
                            el.pause();
                            el.currentTime = 0;
                          }
                        }}
                      />
                    ) : (
                      <div className="video-card-thumbnail-fallback">
                        <span>No preview available</span>
                      </div>
                    )}

                    {isInComparison ? (
                      <span className="video-tile-compare-badge">Selected to compare</span>
                    ) : null}


                    {isHovered ? (
                      <>
                        <button type="button"
                          className="video-tile-mute-btn"
                          onClick={(event) => toggleMute(video.id, event)}
                          aria-label={isUnmuted ? "Mute" : "Unmute"}
                        >
                          {isUnmuted ? (
                            <svg viewBox="0 0 24 24" className="mute-icon" aria-hidden="true">
                              <path
                                d="M4 9v6h4l5 4V5L8 9H4z"
                                fill="currentColor"
                              />
                              <path
                                d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="mute-icon" aria-hidden="true">
                              <path
                                d="M4 9v6h4l5 4V5L8 9H4z"
                                fill="currentColor"
                              />
                              <path
                                d="M16 9l5 6M21 9l-5 6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </button>

                        <div
                          className="video-tile-progress-track"
                          onMouseDown={(event) => handleSeekStart(video.id, event)}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div
                            className="video-tile-progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                          <div
                            className="video-tile-progress-handle"
                            style={{ left: `${progress}%` }}
                          />
                        </div>
                      </>
                    ) : null}

                    <span className="video-card-thumbnail-overlay">
                      {formatDuration(video.duration)}
                    </span>
                  </div>

                  <div className="video-card-tile-row">
                    <div className="video-card-tile-content">
                      <h3>{video.title}</h3>
                      <p className="video-card-tile-meta">
                        {video.speaker ? `${video.speaker} | ` : ""}
                        {topicsLabel}
                      </p>
                    </div>

                    <div className="video-tile-menu-wrap" ref={isMenuOpen ? menuRef : null}>
                      <button
                        type="button"
                        className="video-tile-menu-trigger"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : video.id);
                        }}
                        aria-label="More options"
                      >
                        ⋮
                      </button>

                      {isMenuOpen ? (
                        <div
                          className="video-tile-menu-popover"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onToggleCompareVideo(video.id);
                            }}
                          >
                            <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                              <rect x="3" y="6" width="7" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                              <rect x="14" y="6" width="7" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                              <path d="M10.5 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            <span>{isInComparison ? "Remove from Compare" : "Compare"}</span>
                          </button>

                          <div className="video-tile-menu-divider" />

                          <button type="button" onClick={() => handleMenuAction("watch-later", video)}>
                            <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                              <path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            <span>Save to Watch Later</span>
                          </button>

                          <button type="button" onClick={() => handleMenuAction("playlist", video)}>
                            <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                              <path d="M4 6h11M4 12h11M4 18h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <circle cx="18.5" cy="16.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                              <path d="M18.5 15v3M17 16.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                            <span>Add to Playlist</span>
                          </button>

                          <button type="button" onClick={() => handleMenuAction("download", video)}>
                            <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                              <path d="M12 4v11m0 0l-4-4m4 4l4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M5 18.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            <span>Download</span>
                          </button>

                          <button type="button" onClick={() => handleMenuAction("share", video)}>
                            <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                              <circle cx="6" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                              <circle cx="17" cy="6" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                              <circle cx="17" cy="18" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                              <path d="M8 11l7-4M8 13l7 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            <span>Share</span>
                          </button>

                          <div className="video-tile-menu-divider" />

                          <button type="button" onClick={() => handleMenuAction("interested", video)}>
                            <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                              <path
                                d="M7 11v8H4v-8h3zm2 8h8.5a1.5 1.5 0 0 0 1.46-1.85l-1.2-5A1.5 1.5 0 0 0 16.3 11H13l.7-3.5A1.5 1.5 0 0 0 12.24 5.6L9 11v8z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>Interested</span>
                          </button>

                          <button type="button" onClick={() => handleMenuAction("not-interested", video)}>
                            <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
                              <path
                                d="M7 13V5H4v8h3zm2-8h8.5a1.5 1.5 0 0 1 1.46 1.85l-1.2 5A1.5 1.5 0 0 1 16.3 13H13l.7 3.5A1.5 1.5 0 0 1 12.24 18.4L9 13V5z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>Not Interested</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}