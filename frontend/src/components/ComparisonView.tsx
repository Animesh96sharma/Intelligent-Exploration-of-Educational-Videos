import { useMemo, useRef, useState, useEffect, type ReactNode } from 'react'
import type { VideoRecord } from '../types/video'
import { buildVideoComparison } from '../lib/analytics'
import type { CollectionAnalysisRecord } from '../types/video'

type ComparisonViewProps = {
  videos: VideoRecord[]
  allVideos: VideoRecord[]
  selectedConcept: string | null
  collectionAnalysis?: CollectionAnalysisRecord
  onOpenVideo: (videoId: string) => void
  onSelectConcept: (concept: string | null) => void
  onToggleCompareVideo: (videoId: string) => void
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return 'N/A'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function inferTargetAudience(video: VideoRecord): string {
  const level = (video.difficultyLevel ?? 'General').toLowerCase()
  const domain = video.domain ?? 'this subject'
  if (level === 'beginner') return `Newcomers to ${domain} with no prior background`
  if (level === 'advanced') return `Learners with a strong foundation in ${domain}`
  return `Students with basic familiarity with ${domain}`
}

function getNextRecommendedVideo(video: VideoRecord, allVideos: VideoRecord[]): VideoRecord | null {
  let best: VideoRecord | null = null
  let bestScore = 0
  for (const candidate of allVideos) {
    if (candidate.id === video.id) continue
    const shared = candidate.keyConcepts.filter((c) =>
      video.keyConcepts.some((vc) => vc.toLowerCase() === c.toLowerCase())
    ).length
    if (shared > bestScore) {
      bestScore = shared
      best = candidate
    }
  }
  return best
}

function renderPills(
  concepts: string[],
  emptyLabel: string,
  selectedConcept: string | null,
  onSelectConcept: (concept: string | null) => void,
  muted = false
) {
  if (!concepts.length) return <p className="comparison-empty">{emptyLabel}</p>
  return (
    <div className="chip-group">
      {concepts.map((concept) => (
        <button
          key={concept}
          type="button"
          className={`chip ${muted ? 'muted' : ''} ${selectedConcept === concept ? 'active' : ''}`}
          onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
        >
          {concept}
        </button>
      ))}
    </div>
  )
}

function renderBulletList(items: string[], emptyLabel: string) {
  if (!items.length) return <p className="comparison-empty">{emptyLabel}</p>
  return (
    <ul className="comparison-bullet-list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>{item}</li>
      ))}
    </ul>
  )
}

function renderQualityBlock(video: VideoRecord) {
  const q = video.llmQuality
  if (!q) return <p className="comparison-empty">No quality evaluation available.</p>
  return (
    <div className="llm-quality-block">
      <div className="llm-quality-scores">
        <span className="quality-pill">
          Coherence: <strong>{q.coherenceScore ?? '\u2014'}</strong>
        </span>
        <span className="quality-pill">
          Informativeness: <strong>{q.informativenessScore ?? '\u2014'}</strong>
        </span>
        <span className="quality-pill">
          Conciseness: <strong>{q.concisenessScore ?? '\u2014'}</strong>
        </span>
      </div>
      {q.feedback ? <p className="llm-quality-feedback">{q.feedback}</p> : null}
    </div>
  )
}

function formatSyncTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

type SyncedVideoCellProps = {
  video: VideoRecord
  registerVideoRef: (id: string) => (el: HTMLVideoElement | null) => void
  isAudioSource: boolean
  onSetAudioSource: (id: string) => void
  onDuration: (duration: number) => void
}

function SyncedVideoCell({ video, registerVideoRef, isAudioSource, onSetAudioSource, onDuration }: SyncedVideoCellProps) {
  return (
    <div className="sync-video-cell">
      <video
        ref={registerVideoRef(video.id)}
        src={video.videoSrc}
        poster={video.posterSrc}
        muted={!isAudioSource}
        playsInline
        onLoadedMetadata={(e) => onDuration(e.currentTarget.duration || 0)}
        className="sync-player-video"
      />
      <button
        type="button"
        className={`sync-audio-btn ${isAudioSource ? 'active' : ''}`}
        onClick={() => onSetAudioSource(video.id)}
      >
        {isAudioSource ? 'Audio: On' : 'Audio: Off'}
      </button>
    </div>
  )
}

type SyncedControlsProps = {
  isPlaying: boolean
  masterTime: number
  masterDuration: number
  onPlayPause: () => void
  onSeek: (time: number) => void
}

function SyncedControls({ isPlaying, masterTime, masterDuration, onPlayPause, onSeek }: SyncedControlsProps) {
  return (
    <div className="sync-player-controls">
      <button type="button" className="secondary-btn" onClick={onPlayPause}>
        {isPlaying ? 'Pause all' : 'Play all'}
      </button>

      <input
        type="range"
        min={0}
        max={masterDuration || 0}
        step={0.1}
        value={masterTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="sync-player-seek"
      />

      <span className="sync-player-time">
        {formatSyncTime(masterTime)} / {formatSyncTime(masterDuration)}
      </span>
    </div>
  )
}

export default function ComparisonView({
  videos,
  allVideos,
  selectedConcept,
  onOpenVideo,
  onSelectConcept,
  onToggleCompareVideo,
}: ComparisonViewProps) {
  const [leftVideo, rightVideo] = videos

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [masterTime, setMasterTime] = useState(0)
  const [masterDuration, setMasterDuration] = useState(0)
  const [audioSourceId, setAudioSourceId] = useState<string | null>(null)
  const syncingRef = useRef(false)

  const comparison = useMemo(() => {
    if (!leftVideo || !rightVideo || leftVideo.id === rightVideo.id) return null
    return buildVideoComparison(leftVideo, rightVideo)
  }, [leftVideo, rightVideo])

  const nextLeft = useMemo(
    () => (leftVideo ? getNextRecommendedVideo(leftVideo, allVideos) : null),
    [leftVideo, allVideos]
  )
  const nextRight = useMemo(
    () => (rightVideo ? getNextRecommendedVideo(rightVideo, allVideos) : null),
    [rightVideo, allVideos]
  )

  useEffect(() => {
    if (leftVideo && !audioSourceId) {
      setAudioSourceId(leftVideo.id)
    }
  }, [leftVideo, audioSourceId])

  function registerVideoRef(id: string) {
    return (el: HTMLVideoElement | null) => {
      videoRefs.current[id] = el
    }
  }

  function handleSetAudioSource(id: string) {
    setAudioSourceId(id)
    Object.entries(videoRefs.current).forEach(([videoId, el]) => {
      if (!el) return
      el.muted = videoId !== id
    })
  }

  async function handleSyncPlayPause() {
    const entries = Object.values(videoRefs.current).filter(Boolean) as HTMLVideoElement[]
    if (!entries.length) return

    if (isPlaying) {
      entries.forEach((v) => v.pause())
      setIsPlaying(false)
    } else {
      await Promise.all(entries.map((v) => v.play().catch(() => {})))
      setIsPlaying(true)
    }
  }

  function handleSyncSeek(time: number) {
    const entries = Object.values(videoRefs.current).filter(Boolean) as HTMLVideoElement[]
    syncingRef.current = true
    entries.forEach((v) => {
      v.currentTime = time
    })
    setMasterTime(time)
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const entries = Object.entries(videoRefs.current).filter(([, v]) => v) as [string, HTMLVideoElement][]
      if (entries.length < 2) return

      const referenceTime = entries[0][1].currentTime

      entries.forEach(([, v]) => {
        if (Math.abs(v.currentTime - referenceTime) > 0.3) {
          v.currentTime = referenceTime
        }
      })

      setMasterTime(referenceTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying])

  if (!leftVideo || !rightVideo || leftVideo.id === rightVideo.id) {
    return (
      <section className="comparison-page">
        <div className="page-intro">
          <div className="page-intro-copy">
            <p className="eyebrow">Comparison View</p>
            <h2>
              Side-by-Side Comparison <span>of Educational Videos</span>
            </h2>
            <p>
              Compare summaries, chapter structure, learning objectives, and concept overlap
              across two selected videos in one workspace.
            </p>
          </div>
        </div>

        <div className="results-head">
          <h3>Available videos for comparison</h3>
          <span>{allVideos.length} videos</span>
        </div>

        <div className="video-grid">
          {allVideos.map((video) => {
            const isSelected = videos.some((item) => item.id === video.id)
            return (
              <button
                key={video.id}
                type="button"
                className={`video-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleCompareVideo(video.id)}
              >
                <p className="eyebrow">{video.domain ?? 'General'}</p>
                <h3>{video.title}</h3>
                <p>{video.summaryShort}</p>
                <div className="video-card-meta">
                  <span>{video.speaker ?? 'Unknown speaker'}</span>
                  <span>{Math.round(video.duration / 60)} min</span>
                  <span>{video.totalChapters} chapters</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  const rows: { label: string; left: ReactNode; right: ReactNode }[] = [
    {
      label: 'Video Title',
      left: (
        <button className="comparison-link" onClick={() => onOpenVideo(leftVideo.id)}>
          {leftVideo.title}
        </button>
      ),
      right: (
        <button className="comparison-link" onClick={() => onOpenVideo(rightVideo.id)}>
          {rightVideo.title}
        </button>
      ),
    },
    {
      label: 'Author',
      left: leftVideo.author ?? leftVideo.speaker ?? 'Unknown',
      right: rightVideo.author ?? rightVideo.speaker ?? 'Unknown',
    },
    { label: 'Domain', left: leftVideo.domain ?? 'General', right: rightVideo.domain ?? 'General' },
    {
      label: 'Video Duration',
      left: formatDuration(leftVideo.duration),
      right: formatDuration(rightVideo.duration),
    },
    {
      label: 'Main Topics',
      left: renderPills(leftVideo.mainTopics ?? [], 'No main topics listed.', selectedConcept, onSelectConcept),
      right: renderPills(rightVideo.mainTopics ?? [], 'No main topics listed.', selectedConcept, onSelectConcept),
    },
    {
      label: 'Description',
      left: leftVideo.description ?? 'No description available.',
      right: rightVideo.description ?? 'No description available.',
    },
    {
      label: 'Organization',
      left: leftVideo.organization ?? 'Not specified',
      right: rightVideo.organization ?? 'Not specified',
    },
    {
      label: 'Language',
      left: leftVideo.processingStats?.language ?? 'Not specified',
      right: rightVideo.processingStats?.language ?? 'Not specified',
    },
    {
      label: 'Shared Concepts',
      left: renderPills(comparison?.sharedConcepts ?? [], 'No shared concepts detected.', selectedConcept, onSelectConcept),
      right: renderPills(comparison?.sharedConcepts ?? [], 'No shared concepts detected.', selectedConcept, onSelectConcept),
    },
    {
      label: 'Unique Concepts',
      left: renderPills(comparison?.leftUniqueConcepts ?? [], 'No unique concepts listed.', selectedConcept, onSelectConcept, true),
      right: renderPills(comparison?.rightUniqueConcepts ?? [], 'No unique concepts listed.', selectedConcept, onSelectConcept, true),
    },
    {
      label: 'Learning Objectives',
      left: renderBulletList(leftVideo.videoLearningObjectives ?? [], 'No learning objectives available.'),
      right: renderBulletList(rightVideo.videoLearningObjectives ?? [], 'No learning objectives available.'),
    },
    {
      label: 'Prerequisites',
      left: renderBulletList(leftVideo.prerequisites ?? [], 'No prerequisites listed.'),
      right: renderBulletList(rightVideo.prerequisites ?? [], 'No prerequisites listed.'),
    },
    {
      label: 'Target Audience',
      left: inferTargetAudience(leftVideo),
      right: inferTargetAudience(rightVideo),
    },
    {
      label: 'Next Recommended Video',
      left: nextLeft ? (
        <button className="comparison-link" onClick={() => onOpenVideo(nextLeft.id)}>
          {nextLeft.title}
        </button>
      ) : (
        'No recommendation available.'
      ),
      right: nextRight ? (
        <button className="comparison-link" onClick={() => onOpenVideo(nextRight.id)}>
          {nextRight.title}
        </button>
      ) : (
        'No recommendation available.'
      ),
    },
    {
      label: 'LLM Quality Evaluation',
      left: renderQualityBlock(leftVideo),
      right: renderQualityBlock(rightVideo),
    },
  ]

  return (
    <section className="comparison-page">
      <div className="page-intro">
        <div className="page-intro-copy">
          <h2>Side-by-Side comparison of Educational videos</h2>
          <p>
            Inspect overlap, unique concepts, chapter structure, and summary differences across
            two selected educational videos.
          </p>
        </div>
        <div className="hero-actions">
          {selectedConcept ? (
            <div className="active-concept-banner">
              <span>
                Filtering by concept <strong>{selectedConcept}</strong>
              </span>
              <button className="secondary-btn" onClick={() => onSelectConcept(null)}>
                Clear concept
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Shared concepts</span>
          <strong>{comparison?.sharedConcepts.length ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Similarity</span>
          <strong>{Math.round((comparison?.similarityScore ?? 0) * 100)}%</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Left chapters</span>
          <strong>{leftVideo.totalChapters}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Right chapters</span>
          <strong>{rightVideo.totalChapters}</strong>
        </article>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="comparison-table-label-col">Synchronized playback</th>
              <th>
                <div className="comparison-video-header">
                  <span>{leftVideo.title}</span>
                  <SyncedVideoCell
                    video={leftVideo}
                    registerVideoRef={registerVideoRef}
                    isAudioSource={audioSourceId === leftVideo.id}
                    onSetAudioSource={handleSetAudioSource}
                    onDuration={setMasterDuration}
                  />
                  <div className="comparison-actions">
                    <button className="secondary-btn" onClick={() => onToggleCompareVideo(leftVideo.id)}>
                      Remove
                    </button>
                    <button className="primary-btn" onClick={() => onOpenVideo(leftVideo.id)}>
                      Open video
                    </button>
                  </div>
                </div>
              </th>
              <th>
                <div className="comparison-video-header">
                  <span>{rightVideo.title}</span>
                  <SyncedVideoCell
                    video={rightVideo}
                    registerVideoRef={registerVideoRef}
                    isAudioSource={audioSourceId === rightVideo.id}
                    onSetAudioSource={handleSetAudioSource}
                    onDuration={setMasterDuration}
                  />
                  <div className="comparison-actions">
                    <button className="secondary-btn" onClick={() => onToggleCompareVideo(rightVideo.id)}>
                      Remove
                    </button>
                    <button className="primary-btn" onClick={() => onOpenVideo(rightVideo.id)}>
                      Open video
                    </button>
                  </div>
                </div>
              </th>
            </tr>
            <tr className="sync-controls-row">
              <td className="comparison-table-label-col">Playback</td>
              <td colSpan={2}>
                <SyncedControls
                  isPlaying={isPlaying}
                  masterTime={masterTime}
                  masterDuration={masterDuration}
                  onPlayPause={handleSyncPlayPause}
                  onSeek={handleSyncSeek}
                />
              </td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="comparison-table-label-col">{row.label}</td>
                <td>{row.left}</td>
                <td>{row.right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
