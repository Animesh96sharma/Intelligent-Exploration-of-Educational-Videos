import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChapterRecord, SummaryDetailLevel, VideoRecord } from '../types/video'
import type { Playlist, UserVideoState, VideoBookmark, VideoNote } from '../types/userState'
import VideoPlayer from './VideoPlayer'
import VideoTimeline from './VideoTimeline'
import PlaylistPanel from './PlaylistPanel'

type VideoExplorerProps = {
  video: VideoRecord
  allVideos: VideoRecord[]
  selectedConcept: string | null
  onSelectConcept: (concept: string | null) => void
  onSelectVideo: (videoId: string) => void
  onToggleCompareVideo: (videoId: string) => void
  onOpenComparison: (videoId?: string) => void
  onBrowseMoreVideos: () => void
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

function getBestVideoSummary(video: VideoRecord, level: SummaryDetailLevel): string {
  if (level === 'long') {
    return video.summaryLong ?? video.summaryMedium ?? video.summaryShort ?? 'No video summary available.'
  }
  if (level === 'medium') {
    return video.summaryMedium ?? video.summaryShort ?? 'No video summary available.'
  }
  return video.summaryShort ?? 'No video summary available.'
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
  onSelectVideo,
  onToggleCompareVideo,
  onSelectConcept,
  selectedConcept,
  onOpenComparison,
  onBrowseMoreVideos,
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
}: VideoExplorerProps) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [summaryLevel, setSummaryLevel] = useState<SummaryDetailLevel>('medium')
  const [detailsExpanded, setDetailsExpanded] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [playbackRate, setPlaybackRate] = useState(1)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false)
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null)

  const chapters = useMemo(() => ensureChapterArray(video?.chapters), [video?.chapters])
  const videoConcepts = useMemo(() => ensureStringArray(video?.keyConcepts), [video?.keyConcepts])
  const safeAllVideos = useMemo(() => (Array.isArray(allVideos) ? allVideos.filter(Boolean) : []), [allVideos])

  useEffect(() => {
    setSelectedChapterIndex(0)
    setCurrentTime(0)
    setDetailsExpanded(true)
    setNoteText('')
    setPlaybackRate(1)
    setSubtitlesEnabled(false)
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

  const selectedChapter = useMemo(() => {
    if (chapters.length === 0) return null
    return chapters[selectedChapterIndex] ?? chapters[0] ?? null
  }, [chapters, selectedChapterIndex])

  const selectedChapterConcepts = useMemo(
    () => ensureStringArray(selectedChapter?.keyConcepts),
    [selectedChapter]
  )

  const selectedChapterObjectives = useMemo(
    () => ensureStringArray(selectedChapter?.learningObjectives),
    [selectedChapter]
  )

  const activePlaybackChapter = useMemo(
    () => getActiveChapter(chapters, currentTime),
    [chapters, currentTime]
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

  const videoProgress = userState.progress[video.id]
  const watchedPercent =
    videoProgress?.duration && videoProgress.duration > 0
      ? Math.round((videoProgress.currentTime / videoProgress.duration) * 100)
      : 0

  function handleSelectChapter(index: number) {
    if (index < 0 || index >= chapters.length) return
    setSelectedChapterIndex(index)
    const nextChapter = chapters[index]
    if (nextChapter) setCurrentTime(nextChapter.startTime ?? 0)
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
      chapterId: activePlaybackChapter?.id ?? selectedChapter?.id ?? null,
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
      chapterId: activePlaybackChapter?.id ?? selectedChapter?.id ?? null,
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
          <section className="video-title-card video-title-card--top">
            <div className="video-title-cardtop">
              <div className="video-title-cardheading">
                <h2>{video.title ?? 'Untitled video'}</h2>
                <p className="eyebrow">
                  {video.speaker ?? 'Unknown speaker'} · {video.domain ?? 'General'} · {formatDurationMinutes(video.duration)}
                </p>
              </div>

              <div className="video-title-cardactions hero-actions">
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
              playbackRate={playbackRate}
              subtitlesEnabled={subtitlesEnabled}
              captions={video.captions?.segments ?? []}
              onTimeUpdate={(time) => {
                setCurrentTime(time)
                onUpdateVideoProgress(video.id, time, video.duration ?? 0)
              }}
              onPlaybackRateChange={setPlaybackRate}
              onSubtitlesToggle={setSubtitlesEnabled}
              onChapterSelect={(chapter, index) => {
                setSelectedChapterIndex(index)
                setCurrentTime(chapter.startTime)
              }}
            />
          </section>

          {chapters.length > 0 && selectedChapter ? (
            <>
              <VideoTimeline
                chapters={chapters}
                activeChapterId={activePlaybackChapter?.id ?? null}
                selectedChapterId={selectedChapter?.id ?? null}
                currentTime={currentTime}
                duration={video.duration ?? 0}
                onSelectChapter={(chapter) => {
                  const chapterIndex = chapters.findIndex((item) => item.id === chapter.id)
                  if (chapterIndex >= 0) handleSelectChapter(chapterIndex)
                }}
              />

              <article className="chapter-panel">
                <div className="chapter-panelheader">
                  <div>
                    <h3>
                      {selectedChapter.index ?? selectedChapterIndex + 1}. {selectedChapter.title ?? 'Untitled chapter'}
                    </h3>
                    <p>{getBestChapterSummary(selectedChapter, summaryLevel)}</p>
                  </div>
                </div>
              </article>
            </>
          ) : (
            <article className="chapter-panel">
              <div className="chapter-panelheader">
                <div>
                  <p className="eyebrow">Selected chapter</p>
                  <h3>No chapter data available</h3>
                </div>
              </div>
              <p>This video does not currently have usable chapter information.</p>
            </article>
          )}

          <section className="video-details-collapsible">
            <button
    type="button"
    className="video-details-collapsible__toggle"
    onClick={() => setDetailsExpanded((current) => !current)}
    aria-expanded={detailsExpanded}
  >
    <span>Click here for more details</span>
    <span>{detailsExpanded ? "Show" : "Hide"}</span>
  </button>

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
        </div>

        <aside className="video-explorersidebar">
          <section className="sidebar-card">
            <div className="results-head">
              <h3>Video Summary</h3>
              <div className="summary-toggle" role="tablist" aria-label="Summary detail level">
                {(['short', 'medium', 'long'] as SummaryDetailLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={summaryLevel === level ? 'active' : ''}
                    onClick={() => setSummaryLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <p>{getBestVideoSummary(video, summaryLevel)}</p>
          </section>

          <section className="sidebar-card">
            <div className="results-head">
              <h3>Playback tools</h3>
              <span>{formatClock(currentTime)}</span>
            </div>

            <div className="info-block">
              <button type="button" className="secondary-btn" onClick={handleAddBookmark}>
                Add bookmark at current time
              </button>

              <button type="button" className="secondary-btn" onClick={handleCaptureScreenshot}>
                Capture screenshot
              </button>
            </div>

            <div className="info-block">
              <label htmlFor="playback-rate-select">Playback speed</label>
              <select
                id="playback-rate-select"
                value={String(playbackRate)}
                onChange={(event) => setPlaybackRate(Number(event.target.value))}
              >
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
              <p className="meta">Currently selected: {playbackRate}x</p>
            </div>

            <div className="info-block">
              <label className="playback-toggle-row">
                <input
                  type="checkbox"
                  checked={subtitlesEnabled}
                  onChange={(event) => setSubtitlesEnabled(event.target.checked)}
                />
                <span>Subtitles {subtitlesEnabled ? 'enabled' : 'disabled'}</span>
              </label>
              <p className="meta">Use this as a frontend toggle until subtitle track files are connected.</p>
            </div>

            <video
              ref={hiddenVideoRef}
              src={getVideoSource(video)}
              preload="metadata"
              style={{ display: 'none' }}
            />
          </section>

          <section className="sidebar-card">
            <div className="results-head">
              <h3>Progress</h3>
              <span>{watchedPercent}% watched</span>
            </div>
            <div className="progress-mini">
              <div className="progress-mini-bar">
                <div
                  className="progress-mini-bar-fill"
                  style={{ width: `${Math.min(100, watchedPercent)}%` }}
                />
              </div>
              <p>Last position: {formatClock(videoProgress?.currentTime ?? 0)}</p>
            </div>
          </section>

          <section className="sidebar-card">
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
                      onClick={() => setCurrentTime(bookmark.timestampSeconds)}
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
              <h3>Notes & annotations</h3>
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
                        onClick={() => setCurrentTime(note.timestampSeconds)}
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
            <h3>Related videos</h3>
            {relatedVideos.length === 0 ? (
              <p>No related videos found yet.</p>
            ) : (
              <div className="related-list">
                {relatedVideos.map(({ video: related, overlap }) => (
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
                        className="secondary-btn"
                        onClick={() => onToggleCompareVideo(related.id)}
                      >
                        Compare
                      </button>
                      <button
                        className="primary-btn"
                        onClick={() => onSelectVideo(related.id)}
                      >
                        Open
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

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