import { useMemo, useState, useRef, useEffect } from "react";
import type { VideoRecord } from "../types/video";
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Playlist, UserVideoState } from "../types/userState"

type HomePageProps = {
  videos: VideoRecord[]
  selectedVideoId: string | null
  comparisonVideoIds: string[]
  onOpenVideo: (videoId: string) => void
  onToggleCompareVideo: (videoId: string) => void
  onSelectConcept: (concept: string) => void
  onAddToWatchLater: (videoId: string) => void
  onAddVideoToPlaylist: (playlistId: string, videoId: string) => void
  onDownloadVideo: (video: VideoRecord) => void
  onShareVideo: (videoId: string) => void
  onSetReaction: (videoId: string, reaction: 'like' | 'dislike') => void
  reactions: Record<string, 'like' | 'dislike'>
  userState: UserVideoState
  onCreatePlaylist: (name: string) => Playlist | null
  playlist: Playlist[]
}

const TOP_CONCEPT_LIMIT = 10;

function formatDuration(seconds: number) {
  return `${Math.round(seconds / 60)} min`;
}

function MoreMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="menu-dots-icon" aria-hidden="true">
      <circle cx="12" cy="5.5" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="18.5" r="1.8" fill="currentColor" />
    </svg>
  );
}

function CompareMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
      <rect x="3.5" y="6" width="6.5" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="6" width="6.5" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.75 12h2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function WatchLaterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 8.2v4.3l3 1.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlaylistMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
      <path d="M4 7h10M4 12h10M4 17h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="18" cy="16.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M18 14.9v3.2M16.4 16.5h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
      <path d="M12 4.5v10.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M8.5 11.8 12 15.3l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18.5h14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ShareMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="menu-icon" aria-hidden="true">
      <circle cx="6" cy="12" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.5" cy="6.2" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.5" cy="17.8" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 11.1 15.4 7M8 12.9l7.4 4.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage({
  videos,
  selectedVideoId,
  comparisonVideoIds,
  onOpenVideo,
  onToggleCompareVideo,
  onSelectConcept,
  onAddToWatchLater,
  onAddVideoToPlaylist,
  onDownloadVideo,
  onShareVideo,
  onSetReaction,
  reactions,
  userState,
  onCreatePlaylist,
}: HomePageProps) {
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [unmutedIds, setUnmutedIds] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);
  const seekingIdRef = useRef<string | null>(null);
  const justSeekedRef = useRef(false);

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
  return activeConcept ? videos.filter((v) => v.keyConcepts.includes(activeConcept)) : videos
}, [videos, activeConcept])

  const handleConceptFilterClick = (concept: string | null) => {
    setActiveConcept(concept);
    onSelectConcept(concept ?? "");
  };

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

  const seekToPosition = (id: string, clientX: number, trackEl: HTMLDivElement) => {
    const el = videoRefs.current[id];
    if (!el || !el.duration) return;

    const rect = trackEl.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);

    el.currentTime = ratio * el.duration;
    setProgressMap((prev) => ({ ...prev, [id]: ratio * 100 }));
  };

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

    setProgressMap((prev) => ({
      ...prev,
      [id]: (el.currentTime / el.duration) * 100,
    }));
  };

  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleShareClick(videoId: string) {
    await onShareVideo(videoId)
    setCopiedId(videoId)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function handlePlaylistAction(video: VideoRecord) {
  if (userState.playlists.length > 0) {
    onAddVideoToPlaylist(userState.playlists[0].id, video.id)
  } else {
    const created = onCreatePlaylist('My Playlist')
    if (created) {
      onAddVideoToPlaylist(created.id, video.id)
    }
  }
}

  const handleMenuAction = async (action: string, video: VideoRecord) => {
  setOpenMenuId(null)
  switch (action) {
    case 'watch-later':
      onAddToWatchLater(video.id)
      break
    case 'download':
      onDownloadVideo(video)
      break
    case 'playlist':
      handlePlaylistAction(video)
      break
    case 'share':
      onShareVideo(video.id)
      break
    case 'like':
      onSetReaction(video.id, 'like')
      break
    case 'dislike':
      onSetReaction(video.id, 'dislike')
      break
    default:
      break
  }
}

  return (
    <section className="home-page">
        <div className="home-hero">
            <h2>Browse & easy filtering based on shared-concepts relationships</h2>
            <p>
              This page supports the collection of educational videos & filtering/searching capabilities based on shared-concepts, domain, difficulty-level.         
            </p>
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

      {openMenuId ? (
        <button
          type="button"
          className="video-tile-menu-backdrop"
          aria-label="Close video actions"
          onClick={() => setOpenMenuId(null)}
        />
      ) : null}

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
                  onClick={() => {
                    if (justSeekedRef.current) return;
                    onOpenVideo(video.id);
                  }}
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
                        <button
                          type="button"
                          className="video-tile-mute-btn"
                          onClick={(event) => toggleMute(video.id, event)}
                          aria-label={isUnmuted ? "Mute" : "Unmute"}
                        >
                          {isUnmuted ? (
                            <svg viewBox="0 0 24 24" className="mute-icon" aria-hidden="true">
                              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
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
                              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
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
                        aria-expanded={isMenuOpen}
                      >
                        <MoreMenuIcon />
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
                            <CompareMenuIcon />
                            <span>{isInComparison ? "Remove from Compare" : "Compare"}</span>
                          </button>

                          <div className="video-tile-menu-divider" />

                          <button
                            type="button"
                            onClick={() => {
                              void handleMenuAction("watch-later", video);
                            }}
                          >
                            <WatchLaterIcon />
                            <span>Save to Watch Later</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleMenuAction("playlist", video);
                            }}
                          >
                            <PlaylistMenuIcon />
                            <span>Add to Playlist</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleMenuAction("download", video);
                            }}
                          >
                            <DownloadIcon />
                            <span>Download</span>
                          </button>

                          <button onClick={() => handleShareClick(video.id)}>
                            <ShareMenuIcon />
                            <span>{copiedId === video.id ? 'Link copied!' : 'Share'}</span>
                          </button>

                          <div className="video-tile-menu-divider" />

                          <button
                            type="button"
                            className={reactions[video.id] === 'like' ? 'active' : ''}
                            onClick={() => {
                              void handleMenuAction('like', video)
                            }}
                          >
                            <ThumbsUp className="menu-icon" aria-hidden="true" />
                            <span>Like</span>
                          </button>

                          <button
                            type="button"
                            className={reactions[video.id] === 'dislike' ? 'active' : ''}
                            onClick={() => {
                              void handleMenuAction('dislike', video)
                            }}
                          >
                            <ThumbsDown className="menu-icon" aria-hidden="true" />
                            <span>Dislike</span>
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