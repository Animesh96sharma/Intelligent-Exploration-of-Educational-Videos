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

  if (!video) {
    return <div className="w-full max-w-full mx-auto py-10 text-center text-slate-500">No video data available.</div>
  }

  return (
    <section className="w-full max-w-full mx-auto flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row gap-5 w-full items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-5">
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

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 flex-wrap">
            <div className="min-w-0">
              <h2 className="m-0 text-[clamp(1.35rem,2vw,2rem)] leading-tight tracking-tight text-slate-900">
                {video.title ?? 'Untitled video'}
              </h2>
            </div>

            <div className="flex items-center justify-end gap-2.5 flex-wrap">
              <button
                type="button"
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 font-semibold transition-colors ${
                  isVideoCompared
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-neutral-50'
                }`}
                onClick={() => onToggleCompareVideo(video.id)}
              >
                {isVideoCompared ? 'Remove' : 'Add to compare'}
              </button>

              {isVideoCompared ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-black text-white border border-black px-4 py-2 font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] hover:bg-neutral-800"
                  onClick={() => onOpenComparison(video.id)}
                >
                  Open comparison
                </button>
              ) : null}

              <div className="flex items-center gap-2.5 flex-wrap" aria-label="Video quick actions">
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 min-h-[42px] px-3.5 rounded-full border font-semibold transition-transform hover:-translate-y-0.5 ${
                    currentReaction === 'like'
                      ? 'bg-black border-black text-white shadow-[0_12px_24px_rgba(0,0,0,0.14)]'
                      : 'bg-slate-50/90 border-slate-900/10 text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:bg-white'
                  }`}
                  aria-label="Like video"
                  onClick={() => onSetReaction(video.id, 'like')}
                >
                  <ThumbsUp size={18} className={currentReaction === 'like' ? 'text-white' : 'text-slate-500'} />
                  <span>Like</span>
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 min-h-[42px] px-3.5 rounded-full border font-semibold transition-transform hover:-translate-y-0.5 ${
                    currentReaction === 'dislike'
                      ? 'bg-black border-black text-white shadow-[0_12px_24px_rgba(0,0,0,0.14)]'
                      : 'bg-slate-50/90 border-slate-900/10 text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:bg-white'
                  }`}
                  aria-label="Dislike video"
                  onClick={() => onSetReaction(video.id, 'dislike')}
                >
                  <ThumbsDown size={18} className={currentReaction === 'dislike' ? 'text-white' : 'text-slate-500'} />
                  <span>Dislike</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 min-h-[42px] px-3.5 rounded-full border border-slate-900/10 bg-slate-50/90 text-slate-900 font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-0.5 hover:bg-white"
                  aria-label="Share video"
                  onClick={() => onShareVideo(video.id)}
                >
                  <Share2 size={18} className="text-slate-500" />
                  <span>Share</span>
                </button>

                <div
                  ref={videoMenuRef}
                  className="relative flex-shrink-0"
                >
                  <button
                    type="button"
                    className="w-[42px] h-[42px] p-0 inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-slate-50/90 text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:bg-white hover:text-slate-900"
                    aria-label="More actions"
                    aria-expanded={videoMenuOpen}
                    onClick={() => setVideoMenuOpen((prev) => !prev)}
                  >
                    <span className="inline-flex flex-col items-center justify-center gap-[3px]" aria-hidden="true">
                      <span className="block w-1 h-1 rounded-full bg-current" />
                      <span className="block w-1 h-1 rounded-full bg-current" />
                      <span className="block w-1 h-1 rounded-full bg-current" />
                    </span>
                  </button>

                  {videoMenuOpen ? (
                    <div className="absolute top-[calc(100%+6px)] right-0 z-20 w-[220px] p-2 rounded-2xl border border-slate-900/10 bg-white/96 backdrop-blur-md shadow-[0_18px_38px_rgba(15,23,42,0.16)] flex flex-col gap-1">
                      <button
                        type="button"
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-900 hover:bg-slate-50"
                        onClick={() => {
                          handleAddBookmark()
                          setVideoMenuOpen(false)
                        }}
                      >
                        Add bookmark
                      </button>

                      <button
                        type="button"
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-900 hover:bg-slate-50"
                        onClick={() => {
                          handleCaptureScreenshot()
                          setVideoMenuOpen(false)
                        }}
                      >
                        Capture screenshot
                      </button>

                      <button
                        type="button"
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-900 hover:bg-slate-50"
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
                          className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-900 hover:bg-slate-50"
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
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-2">
              {chapters.length > 0 && activePlaybackChapter ? (
                <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <h3 className="m-0 text-[1.08rem] leading-tight tracking-tight text-slate-900">
                        {activePlaybackChapter.index ?? chapters.indexOf(activePlaybackChapter) + 1}. {activePlaybackChapter.title ?? 'Untitled chapter'}
                      </h3>
                      <p className="text-slate-600">{getBestChapterSummary(activePlaybackChapter, summaryLevel)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className=" self-start border-none bg-transparent text-black font-semibold p-0"
                    onClick={() => setDetailsExpanded((open) => !open)}
                    aria-expanded={detailsExpanded}
                  >
                    {detailsExpanded ? 'Show less' : 'Show more...'}
                  </button>
                </article>
              ) : (
                <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <p className="inline-flex items-center gap-2 m-0 text-xs font-extrabold tracking-widest uppercase text-black">Selected chapter</p>
                      <h3 className="m-0 text-[1.08rem] leading-tight tracking-tight text-slate-900">No chapter data available</h3>
                    </div>
                  </div>
                  <p className="text-slate-600">This video does not currently have usable chapter information.</p>

                  <button
                    type="button"
                    className="sm:hidden self-start border-none bg-transparent text-black font-semibold p-0"
                    onClick={() => setDetailsExpanded((open) => !open)}
                    aria-expanded={detailsExpanded}
                  >
                    {detailsExpanded ? 'Show less' : 'Show more...'}
                  </button>
                </article>
              )}
            </div>

            {detailsExpanded ? (
              <div className="flex flex-col gap-4">
                <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3.5">
                  {selectedChapterObjectives.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      <h4 className="m-0 text-[0.96rem] tracking-tight text-slate-900">Learning objectives</h4>
                      <ul className="m-0 pl-4.5 text-slate-600 list-disc">
                        {selectedChapterObjectives.map((objective) => (
                          <li key={objective}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedChapterConcepts.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      <h4 className="m-0 text-[0.96rem] tracking-tight text-slate-900">Important chapter concepts</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedChapterConcepts.map((concept) => (
                          <button
                            key={concept}
                            type="button"
                            className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-bold ${
                              selectedConcept === concept
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-black border-black'
                            }`}
                            onClick={() => onSelectConcept(concept)}
                          >
                            {concept}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2.5">
                    <h4 className="m-0 text-[0.96rem] tracking-tight text-slate-900">Important concepts</h4>
                    <div className="flex flex-wrap gap-2">
                      {videoConcepts.length === 0 ? (
                        <p className="text-slate-600">No concepts available.</p>
                      ) : (
                        videoConcepts.map((concept) => (
                          <button
                            key={concept}
                            type="button"
                            className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-bold ${
                              selectedConcept === concept
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-black border-black'
                            }`}
                            onClick={() => onSelectConcept(concept)}
                          >
                            {concept}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h4 className="m-0 italic font-semibold text-[0.95rem] text-slate-900">Domain: {video.domain ?? 'Educational video'}</h4>
                    <h4 className="m-0 italic font-semibold text-[0.95rem] text-slate-900">Speaker: {video.speaker ?? 'Unknown speaker'}</h4>
                    <h4 className="m-0 italic font-semibold text-[0.95rem] text-slate-900">Total Chapters: {video.totalChapters ?? chapters.length}</h4>
                    <h4 className="m-0 italic font-semibold text-[0.95rem] text-slate-900">Duration: {formatDurationMinutes(video.duration)}</h4>
                    {video.difficultyLevel ? (
                      <h4 className="m-0 italic font-semibold text-[0.95rem] text-slate-900">Difficulty: {video.difficultyLevel}</h4>
                    ) : null}
                  </div>
                </section>
              </div>
            ) : null}
          </div>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3.5">
            <h3 className="m-0 text-[1.05rem] tracking-tight text-slate-900">Related videos</h3>
            {relatedVideos.length === 0 ? (
              <p className="text-slate-600">No related videos found yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {relatedVideos.map(({ video: related, overlap }) => {
                  const isRelatedCompared = comparisonVideoIds.includes(related.id)
                  return (
                    <article key={related.id} className="w-full text-left bg-slate-50/90 border border-slate-200 rounded-2xl p-4 grid gap-3 items-stretch">
                      <div className="grid gap-1.5">
                        <strong className="text-slate-900">{related.title}</strong>
                        <span className="text-slate-600">{related.domain ?? 'General'}</span>
                        <small className="text-slate-600">
                          {overlap.length > 0 ? overlap.slice(0, 4).join(', ') : 'No shared concepts'}
                        </small>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className={`inline-flex items-center justify-center rounded-full border px-4 py-2 font-semibold ${
                            isRelatedCompared
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-black hover:bg-neutral-50'
                          }`}
                          onClick={() => onToggleCompareVideo(related.id)}
                        >
                          {isRelatedCompared ? 'Remove' : 'Compare'}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full bg-black text-white border border-black px-4 py-2 font-bold hover:bg-neutral-800"
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

        <aside className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-5">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="m-0 text-[1.05rem] tracking-tight text-slate-900">Notes & annotations</h3>
              <span className="text-slate-500">{videoNotes.length} saved</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <textarea
                className="w-full border border-slate-200 rounded-xl bg-white p-3 text-slate-900 resize-y"
                value={noteText}
                placeholder={`Write a note at ${formatClock(currentTime)}`}
                onChange={(event) => setNoteText(event.target.value)}
                rows={4}
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-black text-white border border-black px-4 py-2 font-bold hover:bg-neutral-800"
                onClick={handleAddTimestampNote}
              >
                Save note at current time
              </button>
            </div>

            {videoNotes.length === 0 ? (
              <p className="text-slate-600">No notes yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {videoNotes.map((note) => (
                  <article key={note.id} className="border border-slate-200 bg-slate-50/90 rounded-2xl p-3.5">
                    <div className="flex justify-between gap-3 items-start mb-2">
                      <button
                        type="button"
                        className="border-none bg-transparent text-black font-bold p-0"
                        onClick={() => seekTo(note.timestampSeconds)}
                      >
                        Jump to {formatClock(note.timestampSeconds)}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full bg-white text-black border border-black px-3 py-1.5 text-sm font-semibold hover:bg-neutral-50"
                        onClick={() => onRemoveNote(note.id)}
                      >
                        Delete
                      </button>
                    </div>

                    <textarea
                      className="w-full border border-slate-200 rounded-xl bg-white p-3 text-slate-900 resize-y"
                      value={note.text}
                      onChange={(event) => onUpdateNote(note.id, event.target.value)}
                      rows={3}
                    />
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="m-0 text-[1.05rem] tracking-tight text-slate-900">Bookmarks</h3>
              <span className="text-slate-500">Current Time: {formatClock(currentTime)}</span>
              <span className="text-slate-500">{videoBookmarks.length} saved</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-white text-black border border-black px-4 py-2 font-semibold hover:bg-neutral-50"
                onClick={handleAddBookmark}
              >
                Add bookmark at current time
              </button>
            </div>

            <video
              ref={hiddenVideoRef}
              src={getVideoSource(video)}
              preload="metadata"
              style={{ display: 'none' }}
            />

            {videoBookmarks.length === 0 ? (
              <p className="text-slate-600">No bookmarks yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {videoBookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="flex justify-between gap-3 items-center border border-slate-200 bg-slate-50/90 rounded-xl px-3.5 py-2.5">
                    <button
                      type="button"
                      className="border-none bg-transparent text-black font-bold p-0"
                      onClick={() => seekTo(bookmark.timestampSeconds)}
                    >
                      {bookmark.label ?? formatClock(bookmark.timestampSeconds)}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full bg-white text-black border border-black px-3 py-1.5 text-sm font-semibold hover:bg-neutral-50"
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

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="m-0 text-[1.05rem] tracking-tight text-slate-900">More videos</h3>
              <span className="text-slate-500">{moreVideos.length} shown</span>
            </div>

            {moreVideos.length === 0 ? (
              <p className="text-slate-600">No additional videos are available.</p>
            ) : (
              <div className="grid gap-3.5">
                {moreVideos.map((item) => (
                  <article key={item.id} className="grid gap-3 w-full border border-slate-200 bg-slate-50/90 rounded-2xl p-3">
                    <button
                      type="button"
                      className="border-none p-0 bg-transparent w-full text-left"
                      onClick={() => onSelectVideo(item.id)}
                    >
                      {getVideoSource(item) ? (
                        <video
                          className="w-full rounded-xl bg-black"
                          src={getVideoSource(item)}
                          preload="metadata"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="w-full min-h-[140px] grid place-items-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 text-center p-4">
                          No preview available
                        </div>
                      )}
                    </button>

                    <div className="grid gap-1">
                      <strong className="text-slate-900">{item.title ?? 'Untitled video'}</strong>
                      <span className="text-slate-500">
                        {item.domain ?? 'General'} · {formatDurationMinutes(item.duration)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <button
              type="button"
              className="w-full inline-flex items-center justify-center rounded-full bg-white text-black border border-black px-4 py-2 font-semibold mt-3 hover:bg-neutral-50"
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
