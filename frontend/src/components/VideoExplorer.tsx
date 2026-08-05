import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChapterRecord, SummaryDetailLevel, VideoRecord } from '../types/video'
import type { Playlist, UserVideoState, VideoBookmark, VideoNote } from '../types/userState'
import VideoPlayer from './VideoPlayer'
import PlaylistPanel from './PlaylistPanel'
import { Share2, ThumbsDown, ThumbsUp } from 'lucide-react'

type VideoExplorerProps = {
  video: VideoRecord
  allVideos: VideoRecord[]
  selectedConcept: string | null
  comparisonVideoIds: string[]
  onSelectConcept: (concept: string | null) => void
  onSelectVideo: (videoId: string) => void
  onToggleCompareVideo: (videoId: string) => void
  onOpenComparison: (videoId?: string) => void
  onOpenVideo: (videoId: string) => void
  onBrowseMoreVideos: () => void
  isVideoCompared: boolean
  userState: UserVideoState
  onAddBookmark: (bookmark: VideoBookmark) => void
  onRemoveBookmark: (bookmarkId: string) => void
  onAddNote: (note: VideoNote) => void
  onUpdateNote: (noteId: string, text: string) => void
  onRemoveNote: (noteId: string) => void
  onCreatePlaylist: (name: string) => void
  onAddVideoToPlaylist: (playlistId: string, videoId: string) => void
  onRemoveVideoFromPlaylist: (playlistId: string, videoId: string) => void
  onUpdateVideoProgress: (videoId: string, currentTime: number, duration: number) => void
  onSetReaction: (videoId: string, reaction: 'like' | 'dislike') => void
  onShareVideo: (videoId: string) => void
}

function shuffleArray<T>(items: T[]) {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }
  return next
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function ensureChapterArray(value: unknown): ChapterRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is ChapterRecord =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'title' in item &&
      'startTime' in item &&
      'endTime' in item
  )
}

function getBestChapterSummary(chapter: ChapterRecord | null, level: SummaryDetailLevel): string {
  if (!chapter) return 'No chapter summary available.'
  if (level === 'long') {
    return chapter.summaryLong ?? chapter.summaryMedium ?? chapter.summaryShort ?? 'No chapter summary available.'
  }
  if (level === 'medium') {
    return chapter.summaryMedium ?? chapter.summaryShort ?? 'No chapter summary available.'
  }
  return chapter.summaryShort ?? 'No chapter summary available.'
}

function getActiveChapter(chapters: ChapterRecord[], currentTime: number): ChapterRecord | null {
  if (chapters.length === 0) return null

  return (
    chapters.find((chapter) => {
      const start = chapter.startTime ?? 0
      const end = chapter.endTime ?? 0
      return currentTime >= start && currentTime < end
    }) ??
    chapters[chapters.length - 1] ??
    null
  )
}

function formatDurationMinutes(seconds: number | undefined): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Number(seconds)) : 0
  return `${Math.round(safeSeconds / 60)} min`
}

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getVideoSource(video: VideoRecord): string {
  return (
    (video as VideoRecord & {
      videoSrc?: string
      videoUrl?: string
      previewUrl?: string
      src?: string
    }).videoSrc ??
    (video as VideoRecord & {
      videoSrc?: string
      videoUrl?: string
      previewUrl?: string
      src?: string
    }).videoUrl ??
    (video as VideoRecord & {
      videoSrc?: string
      videoUrl?: string
      previewUrl?: string
      src?: string
    }).previewUrl ??
    (video as VideoRecord & {
      videoSrc?: string
      videoUrl?: string
      previewUrl?: string
      src?: string
    }).src ??
    ''
  )
}

export default function VideoExplorer({
  video,
  allVideos,
  comparisonVideoIds,
  onSelectVideo,
  onToggleCompareVideo,
  onSelectConcept,
  onOpenVideo,
  selectedConcept,
  onOpenComparison,
  onBrowseMoreVideos,
  isVideoCompared,
  userState,
  onAddBookmark,
  onRemoveBookmark,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onCreatePlaylist,
  onAddVideoToPlaylist,
  onRemoveVideoFromPlaylist,
  onUpdateVideoProgress,
  onSetReaction,
  onShareVideo,
}: VideoExplorerProps) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [summaryLevel, setSummaryLevel] = useState<SummaryDetailLevel>('medium')
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [playbackRate, setPlaybackRate] = useState(1)
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null)
  const [videoMenuOpen, setVideoMenuOpen] = useState(false)
  const videoMenuRef = useRef<HTMLDivElement | null>(null)
  const currentReaction = userState.reactions[video.id] ?? null
  


  const chapters = useMemo(() => ensureChapterArray(video?.chapters), [video?.chapters])
  const videoConcepts = useMemo(() => ensureStringArray(video?.keyConcepts), [video?.keyConcepts])
  const safeAllVideos = useMemo(() => (Array.isArray(allVideos) ? allVideos.filter(Boolean) : []), [allVideos])

  useEffect(() => {
    setSelectedChapterIndex(0)
    setCurrentTime(0)
    setDetailsExpanded(false)
    setNoteText('')
    setPlaybackRate(1)
  }, [video?.id])

  useEffect(() => {
    if (chapters.length === 0) {
      if (selectedChapterIndex !== 0) setSelectedChapterIndex(0)
      return
    }

    if (selectedChapterIndex < 0 || selectedChapterIndex >= chapters.length) {
      setSelectedChapterIndex(0)
    }
  }, [chapters, selectedChapterIndex])

  useEffect(() => {
    if (!videoMenuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!videoMenuRef.current) return
      if (!videoMenuRef.current.contains(event.target as Node)) {
        setVideoMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [videoMenuOpen])

  const selectedChapter = useMemo(() => {
    if (chapters.length === 0) return null
    return chapters[selectedChapterIndex] ?? chapters[0] ?? null
  }, [chapters, selectedChapterIndex])

  const activePlaybackChapter = useMemo(
    () => getActiveChapter(chapters, currentTime),
    [chapters, currentTime]
  )

  const selectedChapterConcepts = useMemo(
    () => ensureStringArray(activePlaybackChapter?.keyConcepts),
    [activePlaybackChapter]
  )

  const selectedChapterObjectives = useMemo(
    () => ensureStringArray(activePlaybackChapter?.learningObjectives),
    [activePlaybackChapter]
  )

  const relatedVideos = useMemo(() => {
    const currentConcepts = new Set(videoConcepts.map((item) => item.toLowerCase()))

    return safeAllVideos
      .filter((candidate) => candidate && candidate.id !== video.id)
      .map((candidate) => {
        const candidateConcepts = ensureStringArray(candidate.keyConcepts)
        const overlap = candidateConcepts.filter((concept) =>
          currentConcepts.has(concept.toLowerCase())
        )

        return {
          video: candidate,
          overlap,
          score: overlap.length,
        }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }, [safeAllVideos, video.id, videoConcepts])

  const moreVideos = useMemo(() => {
    const candidates = safeAllVideos.filter((item) => item.id !== video.id)
    return shuffleArray(candidates).slice(0, 4)
  }, [safeAllVideos, video.id])

  const videoBookmarks = useMemo(
    () => userState.bookmarks.filter((bookmark) => bookmark.videoId === video.id),
    [userState.bookmarks, video.id]
  )

  const videoNotes = useMemo(
    () => userState.notes.filter((note) => note.videoId === video.id),
    [userState.notes, video.id]
  )

  function seekTo(time: number) {
    const safeTime = Math.max(0, time)
    setCurrentTime(safeTime)
    onUpdateVideoProgress(video.id, safeTime, video.duration ?? 0)
  }

  function createId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  function handleAddBookmark() {
    const bookmark: VideoBookmark = {
      id: createId(),
      videoId: video.id,
      chapterId: activePlaybackChapter?.id ?? selectedChapter?.id ?? undefined,
      timestampSeconds: currentTime,
      label: `${video.title} @ ${formatClock(currentTime)}`,
      createdAt: new Date().toISOString(),
    }
    onAddBookmark(bookmark)
  }

  function handleAddTimestampNote() {
    const trimmed = noteText.trim()
    if (!trimmed) return

    const note: VideoNote = {
      id: createId(),
      videoId: video.id,
      chapterId: activePlaybackChapter?.id ?? selectedChapter?.id ?? undefined,
      timestampSeconds: currentTime,
      text: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onAddNote(note)
    setNoteText('')
  }

  function handleCaptureScreenshot() {
    const source = hiddenVideoRef.current
    if (!source) return

    source.currentTime = currentTime

    const captureFrame = () => {
      const canvas = document.createElement('canvas')
      canvas.width = source.videoWidth || 1280
      canvas.height = source.videoHeight || 720

      const context = canvas.getContext('2d')
      if (!context) return

      context.drawImage(source, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${video.id}-${Math.floor(currentTime)}s.png`
        link.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    }

    if (source.readyState >= 2) {
      captureFrame()
      return
    }

    source.addEventListener('seeked', captureFrame, { once: true })
  }

  if (!video) {
    return <div className="video-explorer">No video data available.</div>
  }

  return (
    <section className="video-explorer">
      <div className="video-explorerlayout">
        <div className="video-explorermain">
          <section className="video-watch-card">
            <VideoPlayer
              videoId={video.id}
              src={getVideoSource(video)}
              title={video.title}
              currentTime={currentTime}
              chapters={chapters}
              transcript={(video.transcript?.segments ?? []).map((segment) => ({
                id: segment.id,
                text: segment.text,
                startTime: segment.startTime,
              }))}
              summary={{
                short: video.summaryShort,
                medium: video.summaryMedium,
                long: video.summaryLong,
              }}
              summaryLevel={summaryLevel}
              onSummaryLevelChange={setSummaryLevel}
              playbackRate={playbackRate}
              onTimeUpdate={(time) => {
                setCurrentTime(time)
                onUpdateVideoProgress(video.id, time, video.duration ?? 0)
              }}
              onPlaybackRateChange={setPlaybackRate}
              onChapterSelect={(chapter, index) => {
                setSelectedChapterIndex(index)
                seekTo(chapter.startTime)
              }}
            />

            <div className="video-watch-meta">
              <div className="video-watch-meta__main">
                <h2>{video.title ?? 'Untitled video'}</h2>
              </div>

              <div className="video-watch-meta__actions">
                <button
                  type="button"
                  className={isVideoCompared ? 'secondary-btn compare-toggle-btn is-selected' : 'secondary-btn compare-toggle-btn'}
                  onClick={() => onToggleCompareVideo(video.id)}
                >
                  {isVideoCompared ? 'Remove' : 'Add to compare'}
                </button>

                {isVideoCompared ? (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => onOpenComparison(video.id)}
                  >
                    Open comparison
                  </button>
                ) : null}

                <div className="video-watch-quick-actions" aria-label="Video quick actions">
                  <button type="button" className={`video-utility-btn ${currentReaction === 'like' ? 'active' : ''}`}
                    aria-label="Like video"
                    onClick={() => onSetReaction(video.id, 'like')}
                  >
                    <ThumbsUp size={18} />
                    <span>Like</span>
                  </button>
                  <button
                    type="button"
                    className={`video-utility-btn ${currentReaction === 'dislike' ? 'active' : ''}`}
                    aria-label="Dislike video"
                    onClick={() => onSetReaction(video.id, 'dislike')}
                  >
                    <ThumbsDown size={18} />
                    <span>Dislike</span>
                  </button>
                  <button
                    type="button"
                    className="video-utility-btn"
                    aria-label="Share video"
                    onClick={() => onShareVideo(video.id)}
                  >
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>

                  {/* <button type="button" className="video-utility-btn" aria-label="Save to playlist">
                    <ListPlus size={18} />
                    <span>Playlist</span>
                  </button> */}
                </div>

                <div
                  ref={videoMenuRef}
                  className="video-tile-menu-wrap video-tile-menu-wrap--end"
                >
                  <button
                    type="button"
                    className="video-tile-menu-trigger video-tile-menu-trigger--icon"
                    aria-label="More actions"
                    aria-expanded={videoMenuOpen}
                    onClick={() => setVideoMenuOpen((prev) => !prev)}
                  >
                    <span className="video-kebab-icon" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  </button>

                  {videoMenuOpen ? (
                    <div className="video-tile-menu-popover">
                      <button
                        type="button"
                        onClick={() => {
                          handleAddBookmark()
                          setVideoMenuOpen(false)
                        }}
                      >
                        Add bookmark
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleCaptureScreenshot()
                          setVideoMenuOpen(false)
                        }}
                      >
                        Capture screenshot
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onToggleCompareVideo(video.id)
                          setVideoMenuOpen(false)
                        }}
                      >
                        {isVideoCompared ? 'Remove from compare' : 'Add to compare'}
                      </button>

                      {isVideoCompared ? (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenComparison(video.id)
                            setVideoMenuOpen(false)
                          }}
                        >
                          Open comparison
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          

          <section className="video-details-collapsible">
            <div className="video-details-collapsible__summary-row">
              {chapters.length > 0 && activePlaybackChapter ? (
                <article className="chapter-panel">
                  <div className="chapter-panelheader">
                    <div>
                      <h3>
                        {activePlaybackChapter.index ?? chapters.indexOf(activePlaybackChapter) + 1}. {activePlaybackChapter.title ?? 'Untitled chapter'}
                      </h3>
                      <p>{getBestChapterSummary(activePlaybackChapter, summaryLevel)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="video-mobile-more-link chapter-panel__more-link"
                    onClick={() => setDetailsExpanded((open) => !open)}
                    aria-expanded={detailsExpanded}
                  >
                    {detailsExpanded ? 'Show less' : 'Show more...'}
                  </button>
                </article>
              ) : (
                <article className="chapter-panel">
                  <div className="chapter-panelheader">
                    <div>
                      <p className="eyebrow">Selected chapter</p>
                      <h3>No chapter data available</h3>
                    </div>
                  </div>
                  <p>This video does not currently have usable chapter information.</p>

                  <button
                    type="button"
                    className="video-mobile-more-link chapter-panel__more-link"
                    onClick={() => setDetailsExpanded((open) => !open)}
                    aria-expanded={detailsExpanded}
                  >
                    {detailsExpanded ? 'Show less' : 'Show more...'}
                  </button>
                </article>
              )}
            </div>

  {detailsExpanded ? (
    <div className="video-details-collapsiblecontent">
      <section className="sidebar-card">
        <div className="info-block">
          <div className="chip-group">
            <span className="chip static">{video.domain ?? 'Educational video'}</span>
            <span className="chip static">{video.speaker ?? 'Unknown speaker'}</span>
            <span className="chip static">{video.totalChapters ?? chapters.length} chapters</span>
            <span className="chip static">{formatDurationMinutes(video.duration)}</span>
            {video.difficultyLevel ? (
              <span className="chip static">{video.difficultyLevel}</span>
            ) : null}
          </div>
        </div>

        {selectedChapterObjectives.length > 0 ? (
          <div className="info-block">
            <h4>Learning objectives</h4>
            <ul className="clean-list">
              {selectedChapterObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {selectedChapterConcepts.length > 0 ? (
          <div className="info-block">
            <h4>Important chapter concepts</h4>
            <div className="chip-group">
              {selectedChapterConcepts.map((concept) => (
                <button
                  key={concept}
                  type="button"
                  className={`chip ${selectedConcept === concept ? 'active' : ''}`}
                  onClick={() => onSelectConcept(concept)}
                >
                  {concept}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="info-block">
          <h4>Important concepts</h4>
          <div className="chip-group">
            {videoConcepts.length === 0 ? (
              <p>No concepts available.</p>
            ) : (
              videoConcepts.map((concept) => (
                <button
                  key={concept}
                  type="button"
                  className={`chip ${selectedConcept === concept ? 'active' : ''}`}
                  onClick={() => onSelectConcept(concept)}
                >
                  {concept}
                </button>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  ) : null}
</section>
          <section className="sidebar-card">
            <h3>Related videos</h3>
            {relatedVideos.length === 0 ? (
              <p>No related videos found yet.</p>
            ) : (
              <div className="related-list">
                {relatedVideos.map(({ video: related, overlap }) => {
                  const isRelatedCompared = comparisonVideoIds.includes(related.id)
                  return (
                    <article key={related.id} className="related-card related-card--actions">
                      <div>
                        <strong>{related.title}</strong>
                        <span>{related.domain ?? 'General'}</span>
                        <small>
                          {overlap.length > 0 ? overlap.slice(0, 4).join(', ') : 'No shared concepts'}
                        </small>
                      </div>
                      <div className="related-cardactions">
                        <button
                          type="button"
                          className={`secondary-btn ${isRelatedCompared ? 'is-selected' : ''}`}
                          onClick={() => onToggleCompareVideo(related.id)}
                        >
                          {isRelatedCompared ? 'Remove' : 'Compare'}
                        </button>
                        <button
                          type="button"
                          className="primary-btn"
                          onClick={() => onOpenVideo(related.id)}
                        >
                          Open
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="video-explorersidebar">
          <section className="sidebar-card">
            <div className="results-head">
              <h3>📝Notes & annotations</h3>
              <span>{videoNotes.length} saved</span>
            </div>

            <div className="note-composer">
              <textarea
                value={noteText}
                placeholder={`Write a note at ${formatClock(currentTime)}`}
                onChange={(event) => setNoteText(event.target.value)}
                rows={4}
              />
              <button type="button" className="primary-btn" onClick={handleAddTimestampNote}>
                Save note at current time
              </button>
            </div>

            {videoNotes.length === 0 ? (
              <p>No notes yet.</p>
            ) : (
              <div className="note-list">
                {videoNotes.map((note) => (
                  <article key={note.id} className="note-card">
                    <div className="note-card-head">
                      <button
                        type="button"
                        className="inline-link"
                        onClick={() => seekTo(note.timestampSeconds)}
                      >
                        Jump to {formatClock(note.timestampSeconds)}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onRemoveNote(note.id)}
                      >
                        Delete
                      </button>
                    </div>

                    <textarea
                      value={note.text}
                      onChange={(event) => onUpdateNote(note.id, event.target.value)}
                      rows={3}
                    />
                  </article>
                ))}
              </div>
            )}
          </section>
          <section className="sidebar-card">
            <div className="results-head">
              <h3>Bookmarks</h3>
               <span>Current Time: {formatClock(currentTime)}</span>
              <span>{videoBookmarks.length} saved</span>
            </div>



            <div className="info-block">
              <button type="button" className="secondary-btn" onClick={handleAddBookmark}>
                Add bookmark at current time
              </button>
            </div>

            <video
              ref={hiddenVideoRef}
              src={getVideoSource(video)}
              preload="metadata"
              style={{ display: 'none' }}
            />
            <div className="results-head">
              <h3>Bookmarks</h3>
              <span>{videoBookmarks.length} saved</span>
            </div>

            {videoBookmarks.length === 0 ? (
              <p>No bookmarks yet.</p>
            ) : (
              <div className="bookmark-list">
                {videoBookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bookmark-row">
                    <button
                      type="button"
                      className="inline-link"
                      onClick={() => seekTo(bookmark.timestampSeconds)}
                    >
                      {bookmark.label ?? formatClock(bookmark.timestampSeconds)}
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onRemoveBookmark(bookmark.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

    
          <PlaylistPanel
            video={video}
            playlists={userState.playlists as Playlist[]}
            allVideos={allVideos}
            onSelectVideo={onSelectVideo}
            onCreatePlaylist={onCreatePlaylist}
            onAddVideoToPlaylist={onAddVideoToPlaylist}
            onRemoveVideoFromPlaylist={onRemoveVideoFromPlaylist}
          />

          <section className="sidebar-card">
            <div className="results-head">
              <h3>More videos</h3>
              <span>{moreVideos.length} shown</span>
            </div>

            {moreVideos.length === 0 ? (
              <p>No additional videos are available.</p>
            ) : (
              <div className="more-videos-list">
                {moreVideos.map((item) => (
                  <article key={item.id} className="more-video-card">
                    <button
                      type="button"
                      className="more-video-card-preview"
                      onClick={() => onSelectVideo(item.id)}
                    >
                      {getVideoSource(item) ? (
                        <video
                          className="more-video-card__player"
                          src={getVideoSource(item)}
                          preload="metadata"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="more-video-card-fallback">No preview available</div>
                      )}
                    </button>

                    <div className="more-video-card__body">
                      <strong>{item.title ?? 'Untitled video'}</strong>
                      <span>
                        {item.domain ?? 'General'} · {formatDurationMinutes(item.duration)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <button
              type="button"
              className="secondary-btn more-videos-browse-btn"
              onClick={onBrowseMoreVideos}
            >
              Browse more videos
            </button>
          </section>
        </aside>
      </div>
    </section>
  )
}