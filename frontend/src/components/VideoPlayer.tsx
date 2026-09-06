import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { Play, Pause, Camera, Expand, Shrink, ChevronRight, Captions, RotateCcw, RotateCw } from 'lucide-react'
import type { SummaryDetailLevel } from '../types/video'
import InVideoPanel from './InVideoPanel'

type ChapterItem = { id: string; title: string; startTime: number; endTime: number }
type TranscriptItem = { id: string; text: string; startTime: number; endTime?: number }
type VideoSummaryContent = { short?: string; medium?: string; long?: string }

type VideoPlayerProps = {
  videoId: string
  src: string
  title: string
  currentTime: number
  chapters?: ChapterItem[]
  transcript?: TranscriptItem[]
  captionsSrc?: string
  summary?: VideoSummaryContent
  summaryLevel?: SummaryDetailLevel
  onSummaryLevelChange?: (level: SummaryDetailLevel) => void
  playbackRate?: number
  onTimeUpdate: (time: number) => void
  onPlaybackRateChange?: (rate: number) => void
  onChapterSelect?: (chapter: ChapterItem, index: number) => void
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function getSummaryText(summary: VideoSummaryContent | undefined, level: SummaryDetailLevel) {
  if (!summary) return 'No summary available.'
  if (level === 'long') return summary.long ?? summary.medium ?? summary.short ?? 'No summary available.'
  if (level === 'medium') return summary.medium ?? summary.short ?? 'No summary available.'
  return summary.short ?? 'No summary available.'
}

export default function VideoPlayer({
  videoId,
  src,
  title,
  currentTime,
  chapters = [],
  transcript = [],
  captionsSrc,
  summary,
  summaryLevel = 'medium',
  onSummaryLevelChange,
  playbackRate = 1,
  onTimeUpdate,
  onPlaybackRateChange,
  onChapterSelect,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const seekRef = useRef<HTMLDivElement>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const trackRef = useRef<HTMLTrackElement>(null)
  const hideTimerRef = useRef<number | null>(null)

  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'chapters' | 'transcript' | 'summary'>('chapters')
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)

  const resolvedSummary = useMemo(() => getSummaryText(summary, summaryLevel), [summary, summaryLevel])
  const resolvedCaptionsSrc = useMemo(
    () => captionsSrc ?? `/data/processed/subtask1_segmentation/transcripts/${videoId}_transcripts.vtt`,
    [captionsSrc, videoId],
  )

  useEffect(() => {
    const video = videoRef.current
    const trackEl = trackRef.current
    if (!video || !trackEl) return
    const textTrack = trackEl.track
    if (!textTrack) return

    const repositionCues = () => {
      const cues = textTrack.cues
      if (!cues) return
      const isMobile = window.innerWidth < 640
      for (let i = 0; i < cues.length; i += 1) {
        const cue = cues[i] as VTTCue
        cue.snapToLines = false
        cue.align = 'center'
        cue.line = 90
        cue.position = 50
        cue.size = isMobile ? 92 : 80
      }
    }

    const forceRender = () => {
      textTrack.mode = subtitlesEnabled ? 'showing' : 'hidden'
      repositionCues()
      if (subtitlesEnabled) {
        textTrack.mode = 'hidden'
        requestAnimationFrame(() => {
          textTrack.mode = 'showing'
        })
      }
    }

    const handleTrackLoad = () => {
      repositionCues()
      forceRender()
    }

    trackEl.addEventListener('load', handleTrackLoad)
    window.addEventListener('resize', repositionCues)
    window.addEventListener('orientationchange', repositionCues)
    forceRender()

    return () => {
      trackEl.removeEventListener('load', handleTrackLoad)
      window.removeEventListener('resize', repositionCues)
      window.removeEventListener('orientationchange', repositionCues)
    }
  }, [subtitlesEnabled, src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.load()
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === playerRef.current)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  function showControlsTemporarily() {
    setControlsVisible(true)
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    if (isPlaying) {
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false)
      }, 5000)
    }
  }

  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true)
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      return
    }
    showControlsTemporarily()
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }

  }, [isPlaying])

  useEffect(() => {
    if (speedMenuOpen || panelOpen) {
      setControlsVisible(true)
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [speedMenuOpen, panelOpen])

  const activeChapterIndex = useMemo(() => {
    if (!chapters.length) return -1
    return chapters.findIndex((chapter, index) => {
      const next = chapters[index + 1]
      const start = chapter.startTime ?? 0
      const end = next?.startTime ?? duration
      return currentTime >= start && currentTime < end
    })
  }, [chapters, currentTime, duration])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  async function handlePlayPause() {
    const video = videoRef.current
    if (!video) return
    try {
      if (video.paused) {
        await video.play()
        setIsPlaying(true)
      } else {
        video.pause()
        setIsPlaying(false)
      }
    } catch (error) {
      console.error('Video playback toggle failed', error)
    }
  }

  function handleSkip(deltaSeconds: number) {
    const video = videoRef.current
    if (!video) return
    const safeTime = Math.max(0, Math.min(currentTime + deltaSeconds, duration || 0))
    handleSeek(safeTime)
  }

  function handleSeek(nextTime: number) {
    const video = videoRef.current
    if (!video) return
    const safeTime = Math.max(0, Math.min(nextTime, duration || 0))
    video.currentTime = safeTime
    onTimeUpdate(safeTime)
  }

  function handleSeekFromPointer(clientX: number) {
    const seek = seekRef.current
    if (!seek || duration <= 0) return
    const rect = seek.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    handleSeek(ratio * duration)
  }

  function handleTimelineClick(event: MouseEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== null) return
    handleSeekFromPointer(event.clientX)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    activePointerIdRef.current = event.pointerId
    setIsScrubbing(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    handleSeekFromPointer(event.clientX)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isScrubbing) return
    if (activePointerIdRef.current !== event.pointerId) return
    handleSeekFromPointer(event.clientX)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    activePointerIdRef.current = null
    setIsScrubbing(false)
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    activePointerIdRef.current = null
    setIsScrubbing(false)
  }

  function handleTimelineKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (duration <= 0) return
    const smallStep = 5
    const largeStep = 15
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        handleSeek(currentTime + smallStep)
        break
      case 'ArrowLeft':
        event.preventDefault()
        handleSeek(currentTime - smallStep)
        break
      case 'PageUp':
        event.preventDefault()
        handleSeek(currentTime + largeStep)
        break
      case 'PageDown':
        event.preventDefault()
        handleSeek(currentTime - largeStep)
        break
      case 'Home':
        event.preventDefault()
        handleSeek(0)
        break
      case 'End':
        event.preventDefault()
        handleSeek(duration)
        break
      default:
        break
    }
  }

  async function handleToggleFullscreen() {
    const player = playerRef.current
    if (!player) return
    if (document.fullscreenElement) {
      await document.exitFullscreen?.()
      return
    }
    await player.requestFullscreen?.()
  }

  async function handleScreenshot() {
    const video = videoRef.current
    if (!video) return
    if (!video.videoWidth || !video.videoHeight) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      downloadBlob(blob, `${videoId}-frame-${Math.floor(video.currentTime)}.png`)
    }, 'image/png')
  }

  function handleChapterJump(chapter: ChapterItem, index: number) {
    handleSeek(chapter.startTime)
    onChapterSelect?.(chapter, index)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const delta = Math.abs(video.currentTime - currentTime)
    if (delta > 0.25) video.currentTime = currentTime
  }, [currentTime])

  return (
    <div
      ref={playerRef}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
      onKeyDown={showControlsTemporarily}
      onMouseLeave={() => {
        if (isPlaying) setControlsVisible(false)
      }}
      className={`relative w-full bg-[#0b1020] rounded-[18px] overflow-hidden flex flex-col ${
        isFullscreen ? 'w-screen h-screen rounded-none bg-black' : ''
      }`}
    >
      <div
        className={`relative w-full flex flex-col sm:flex-row sm:items-stretch flex-1 min-h-0 ${
          isFullscreen ? '' : 'sm:h-[calc(100vh-220px)] sm:max-h-[640px]'
        }`}
      >
        <div
          className={`relative min-w-0 bg-black flex flex-col aspect-video sm:aspect-auto ${
            isFullscreen ? 'flex-1 aspect-auto w-full' : 'w-full sm:flex-[1.6] '
          }`}
        >
          <video
            key={videoId}
            ref={videoRef}
            src={src}
            preload="metadata"
            className="video-element w-full h-full block object-contain bg-black flex-1"
            onClick={handlePlayPause}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
          >
            <track
              ref={trackRef}
              kind="subtitles"
              src={resolvedCaptionsSrc}
              srcLang="en"
              label="English"
              default
            />
            Your browser does not support the video tag for {title}.
          </video>

          {/* Play/Pause and Rewind/Forward controls */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-7 z-5 transition-opacity duration-200 ${
              controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              type="button"
              className="w-[46px] h-[46px] bg-black/[0.815] border-none rounded-full text-white inline-flex items-center justify-center cursor-pointer hover:bg-black/75"
              onClick={() => handleSkip(-10)}
              aria-label="Rewind 10 seconds"
              title="Rewind 10s"
            >
              <RotateCcw size={26} />
            </button>
            <button
              type="button"
              className="w-16 h-16 bg-black/[0.815] border-none rounded-full text-white inline-flex items-center justify-center cursor-pointer hover:bg-black/75"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={34} /> : <Play size={34} />}
            </button>
            <button
              type="button"
              className="w-[46px] h-[46px] bg-black/[0.815] border-none rounded-full text-white inline-flex items-center justify-center cursor-pointer hover:bg-black/75"
              onClick={() => handleSkip(10)}
              aria-label="Forward 10 seconds"
              title="Forward 10s"
            >
              <RotateCw size={26} />
            </button>
          </div>

          {/* Bottom controls */}
          <div
            className={`absolute inset-x-0 bottom-0 p-2 sm:p-3.5 bg-gradient-to-t from-black/[0.82] to-black/[0.08] text-white z-5 flex flex-col gap-1.5 sm:gap-2 transition-opacity duration-200 ${
              controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div
              ref={seekRef}
              className={`relative w-full h-5 cursor-pointer ${isScrubbing ? 'cursor-grabbing' : ''}`}
              role="slider"
              aria-label="Video timeline"
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration || 0)}
              aria-valuenow={Math.floor(currentTime || 0)}
              tabIndex={0}
              onClick={handleTimelineClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerUp}
              onKeyDown={handleTimelineKeyDown}
            >
              <div className="absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2 rounded-full bg-white/[0.724] pointer-events-none" />
              <div
                className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full bg-[#bc0404e0] pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
              {chapters.map((chapter, index) => {
                const left = duration > 0 ? (chapter.startTime / duration) * 100 : 0
                const isActive = index === activeChapterIndex
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    className={`absolute top-1/2 w-[9px] h-2 -translate-x-1/2 -translate-y-1/2 border-none rounded-full pointer-events-auto ${
                      isActive ? 'bg-white' : 'bg-[rgba(78,68,68,0.9)]'
                    }`}
                    style={{ left: `${left}%` }}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleChapterJump(chapter, index)
                    }}
                    aria-label={`Jump to chapter ${chapter.title}`}
                    title={`${chapter.title} — ${formatTime(chapter.startTime)}`}
                  />
                )
              })}
              <div
                className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-[#bc0404e0] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_2px_#bc0404e0] pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <button
                  type="button"
                  className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center gap-2 border border-white/[0.16] bg-white/[0.12] text-white rounded-full flex-shrink-0"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setPanelOpen((current) => !current)}
                  aria-label={panelOpen ? 'Close video details panel' : 'Open video details panel'}
                  title="Video details panel"
                  className="inline-flex items-center gap-1 min-h-[36px] sm:min-h-[40px] border border-white/[0.16] bg-white/[0.12] text-white px-2 sm:px-3 rounded-full flex-shrink-0"
                >
                  <span className="hidden sm:inline text-sm">More</span>
                  <ChevronRight size={16} />
                </button>

                <div className="flex gap-1 text-[0.72rem] sm:text-sm whitespace-nowrap truncate">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center min-h-[36px] sm:min-h-[40px] border border-white/[0.16] bg-white/[0.12] text-white px-2.5 sm:px-3 rounded-full text-[0.8rem] sm:text-sm"
                    onClick={() => setSpeedMenuOpen((current) => !current)}
                    aria-label="Playback speed"
                    title="Playback speed"
                  >
                    {playbackRate}x
                  </button>
                  {speedMenuOpen ? (
                    <div className="absolute right-0 bottom-[calc(100%+8px)] flex flex-col gap-1.5 min-w-[88px] p-2 bg-[rgba(10,10,16,0.96)] border border-white/[0.12] rounded-xl z-10">
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          className={`border-none rounded-lg px-2.5 py-1.5 text-sm ${
                            playbackRate === speed ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-white'
                          }`}
                          onClick={() => {
                            onPlaybackRateChange?.(speed)
                            setSpeedMenuOpen(false)
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setSubtitlesEnabled((current) => !current)}
                  aria-pressed={subtitlesEnabled}
                  aria-label={subtitlesEnabled ? 'Turn off subtitles' : 'Turn on subtitles'}
                  title="Subtitles (CC)"
                  className={`w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center border border-white/[0.16] rounded-full flex-shrink-0 ${
                    subtitlesEnabled ? 'bg-white/[0.24]' : 'bg-white/[0.12]'
                  } text-white`}
                >
                  <Captions size={16} />
                </button>

                <button
                  type="button"
                  className="w-9 h-9 hidden sm:inline-flex items-center justify-center border border-white/[0.16] bg-white/[0.12] text-white rounded-full flex-shrink-0"
                  onClick={handleScreenshot}
                  aria-label="Capture screenshot"
                  title="Capture screenshot"
                >
                  <Camera size={18} />
                </button>

                <button
                  type="button"
                  className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center border border-white/[0.16] bg-white/[0.12] text-white rounded-full flex-shrink-0"
                  onClick={handleToggleFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Shrink size={16} /> : <Expand size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <InVideoPanel
          open={panelOpen}
          tab={panelTab}
          onChangeTab={setPanelTab}
          chapters={chapters}
          transcript={transcript}
          currentTime={currentTime}
          activeChapterIndex={activeChapterIndex}
          onSelectChapter={(chapter, index) => handleChapterJump(chapter, index)}
          onSelectTranscriptSegment={(segment) => handleSeek(segment.startTime)}
          summaryContent={resolvedSummary}
          summaryLevel={summaryLevel}
          onSummaryLevelChange={onSummaryLevelChange}
          isFullscreen={isFullscreen}
        />
      </div>
    </div>
  )
}