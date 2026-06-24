import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import {
  Play,
  Pause,
  ListVideo,
  Captions,
  Camera,
  Expand,
  Shrink,
  ChevronRight,
} from 'lucide-react'

import type { CaptionSegment } from "../types/video";
type ChapterItem = {
  id: string
  title: string
  startTime: number
  endTime: number
}

type TranscriptItem = {
  id: string
  text: string
  startTime: number
}

type VideoPlayerProps = {
  videoId: string
  src: string
  title: string
  currentTime: number
  chapters?: ChapterItem[]
  transcript?: TranscriptItem[]
  playbackRate?: number
  subtitlesEnabled?: boolean
  captions?: CaptionSegment[];
  onTimeUpdate: (time: number) => void
  onPlaybackRateChange?: (rate: number) => void
  onSubtitlesToggle?: (enabled: boolean) => void
  onChapterSelect?: (chapter: ChapterItem, index: number) => void
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

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

export default function VideoPlayer({
  videoId,
  src,
  title,
  currentTime,
  chapters = [],
  transcript = [],
  playbackRate = 1,
  subtitlesEnabled = false,
  captions = [],
  onTimeUpdate,
  onPlaybackRateChange,
  onSubtitlesToggle,
  onChapterSelect,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playerRef = useRef<HTMLDivElement | null>(null)
  const seekRef = useRef<HTMLDivElement | null>(null)

  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'chapters' | 'transcript'>('chapters')
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.load()
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Math.abs(video.currentTime - currentTime) > 1.5) {
      video.currentTime = currentTime
    }
  }, [currentTime])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const [isScrubbing, setIsScrubbing] = useState(false)

  const activeChapterIndex = useMemo(() => {
    if (!chapters.length) return -1

    return chapters.findIndex((chapter, index) => {
      const next = chapters[index + 1]
      const start = chapter.startTime ?? 0
      const end = next?.startTime ?? duration
      return currentTime >= start && currentTime < end
    })
  }, [chapters, currentTime, duration])

  const activeCaption = useMemo(() => {
    if (!subtitlesEnabled || !captions?.length) return null;

    return (
      captions.find(
        (segment) =>
          currentTime >= segment.startTime && currentTime <= segment.endTime
      ) ?? null
    );
  }, [captions, currentTime, subtitlesEnabled]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  async function handlePlayPause() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      await video.play()
      setIsPlaying(true)
      return
    }

    video.pause()
    setIsPlaying(false)
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
  if (isScrubbing) return
  handleSeekFromPointer(event.clientX)
}

function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
  setIsScrubbing(true)
  event.currentTarget.setPointerCapture(event.pointerId)
  handleSeekFromPointer(event.clientX)
}

function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
  if (!isScrubbing) return
  handleSeekFromPointer(event.clientX)
}

function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
  setIsScrubbing(false)
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
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

  return (
  <div
    ref={playerRef}
    className={`video-player-shell ${isFullscreen ? 'is-fullscreen' : ''} ${panelOpen ? 'panel-open' : ''}`}
  >
    <div className="video-stage">
      <div className="video-media-area">
        <video
          key={videoId}
          ref={videoRef}
          src={src}
          preload="metadata"
          className="video-element"
          onClick={handlePlayPause}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
        >
          Your browser does not support the video tag for {title}.
        </video>

        {activeCaption ? (
            <div className="video-subtitle-overlay" aria-live="polite">
              {activeCaption.text}
            </div>
          ) : null}

        <div className="video-controls">
          <div
            ref={seekRef}
            className={`video-progress ${isScrubbing ? 'is-scrubbing' : ''}`}
            role="slider"
            aria-label="Video timeline"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration || 0)}
            aria-valuenow={Math.floor(currentTime || 0)}
            onClick={handleTimelineClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="video-progress-track" />
            <div className="video-progress-fill" style={{ width: `${progressPercent}%` }} />

            {chapters.map((chapter) => {
              const left = duration > 0 ? (chapter.startTime / duration) * 100 : 0
              return (
                <button
                  key={chapter.id}
                  type="button"
                  className="video-chapter-marker"
                  style={{ left: `${left}%` }}
                  onClick={(event) => {
                  event.stopPropagation()
                  handleChapterJump(chapter, chapters.findIndex((item) => item.id === chapter.id))
                  }}
                  title={`${chapter.title} • ${formatTime(chapter.startTime)}`}
                  aria-label={`Jump to chapter ${chapter.title}`}
                />
              )
            })}

            <div className="video-progress-thumb" style={{ left: `${progressPercent}%` }} />
          </div>

          <div className="video-controls-row">
            <div className="video-controls-left">
              <button
                type="button"
                className="video-control-btn icon-only"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                type="button"
                className={`video-control-btn video-control-btn-panel ${panelOpen ? 'active' : ''}`}
                onClick={() => setPanelOpen((current) => !current)}
                aria-label={panelOpen ? 'Close chapters panel' : 'Open chapters panel'}
                title="Chapters panel"
              >
                <ListVideo size={18} />
                <span className="video-control-label">More Section</span>
                <ChevronRight size={16} className={panelOpen ? 'rotate-open' : ''} />
              </button>

              <div className="video-time-readout">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="video-controls-right">
              <button
                type="button"
                className={`video-control-btn icon-only ${subtitlesEnabled ? 'active' : ''}`}
                onClick={() => onSubtitlesToggle?.(!subtitlesEnabled)}
                aria-label={subtitlesEnabled ? 'Disable subtitles' : 'Enable subtitles'}
                title="Subtitles"
              >
                <Captions size={18} />
              </button>

              <div className="video-speed-menu-wrap">
                <button
                  type="button"
                  className="video-control-btn"
                  onClick={() => setSpeedMenuOpen((current) => !current)}
                  aria-label="Playback speed"
                  title="Playback speed"
                >
                  <span className="video-speed-trigger">{playbackRate}x</span>
                </button>

                {speedMenuOpen ? (
                  <div className="video-speed-menu">
                    {SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        className={speed === playbackRate ? 'active' : ''}
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
                className="video-control-btn icon-only"
                onClick={handleScreenshot}
                aria-label="Capture screenshot"
                title="Screenshot"
              >
                <Camera size={18} />
              </button>

              <button
                type="button"
                className="video-control-btn icon-only"
                onClick={handleToggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Shrink size={18} /> : <Expand size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {panelOpen ? (
        <aside className="video-side-panel" aria-label="Video side panel">
          <div className="video-side-panel-tabs">
            <button
              type="button"
              className={panelTab === 'chapters' ? 'active' : ''}
              onClick={() => setPanelTab('chapters')}
            >
              Chapters
            </button>
            <button
              type="button"
              className={panelTab === 'transcript' ? 'active' : ''}
              onClick={() => setPanelTab('transcript')}
            >
              Transcript
            </button>
          </div>

          <div className="video-side-panel-body">
            {panelTab === 'chapters' ? (
              chapters.length > 0 ? (
                <div className="video-panel-list">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      type="button"
                      className={`video-panel-item ${index === activeChapterIndex ? 'active' : ''}`}
                      onClick={() => handleChapterJump(chapter, index)}
                    >
                      <span>{chapter.title}</span>
                      <strong>{formatTime(chapter.startTime)}</strong>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="video-panel-empty">No chapters available.</p>
              )
            ) : transcript.length > 0 ? (
              <div className="video-panel-list">
                {transcript.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`video-panel-item ${Math.abs(currentTime - item.startTime) < 3 ? 'active' : ''}`}
                    onClick={() => handleSeek(item.startTime)}
                  >
                    <span>{item.text}</span>
                    <strong>{formatTime(item.startTime)}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <p className="video-panel-empty">No transcript available.</p>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  </div>
)
}