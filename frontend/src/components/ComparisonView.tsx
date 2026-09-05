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
    const shared = candidate.keyConcepts.filter((c) => video.keyConcepts.some((vc) => vc.toLowerCase() === c.toLowerCase())).length
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
  muted = false,
) {
  if (!concepts.length) return <p className="text-[#94a3b8] text-sm m-0">{emptyLabel}</p>
  return (
    <div className="flex flex-wrap gap-2">
      {concepts.map((concept) => (
        <button
          key={concept}
          type="button"
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border transition-all duration-[180ms] ${
            selectedConcept === concept
              ? 'bg-black text-white border-black'
              : muted
                ? 'bg-[#f8fafc] text-[#64748b] border-[#e8eef5]'
                : 'bg-[#f3f4f6] text-[#0f172a] border-[#d9e2ec] hover:-translate-y-px'
          }`}
          onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
        >
          {concept}
        </button>
      ))}
    </div>
  )
}

function renderBulletList(items: string[], emptyLabel: string) {
  if (!items.length) return <p className="text-[#94a3b8] text-sm m-0">{emptyLabel}</p>
  return (
    <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[#334155] text-sm m-0">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>{item}</li>
      ))}
    </ul>
  )
}

function renderQualityBlock(video: VideoRecord) {
  const q = video.llmQuality
  if (!q) return <p className="text-[#94a3b8] text-sm m-0">No quality evaluation available.</p>
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border border-[#d9e2ec] bg-[#f3f4f6] text-[#0f172a]">
          Coherence <strong>{q.coherenceScore ?? '—'}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border border-[#d9e2ec] bg-[#f3f4f6] text-[#0f172a]">
          Informativeness <strong>{q.informativenessScore ?? '—'}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border border-[#d9e2ec] bg-[#f3f4f6] text-[#0f172a]">
          Conciseness <strong>{q.concisenessScore ?? '—'}</strong>
        </span>
      </div>
      {q.feedback ? <p className="text-[#334155] text-sm m-0 italic">{q.feedback}</p> : null}
    </div>
  )
}

function formatSyncTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds))
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
    <div className="flex flex-col gap-2">
      <video
        ref={registerVideoRef(video.id)}
        src={video.videoSrc}
        poster={video.posterSrc}
        muted={!isAudioSource}
        playsInline
        onLoadedMetadata={(e) => onDuration(e.currentTarget.duration || 0)}
        className="w-full rounded-[14px] bg-black aspect-video"
      />
      <button
        type="button"
        className={`self-start border rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition-all duration-[180ms] ${
          isAudioSource ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-[#f8f8f8]'
        }`}
        onClick={() => onSetAudioSource(video.id)}
      >
        {isAudioSource ? 'Audio On' : 'Audio Off'}
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
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.8rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
        onClick={onPlayPause}
      >
        {isPlaying ? 'Pause all' : 'Play all'}
      </button>
      <input
        type="range"
        min={0}
        max={masterDuration || 0}
        step={0.1}
        value={masterTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="accent-black flex-1 min-w-[160px]"
      />
      <span className="text-[0.82rem] font-semibold text-[#0f172a] whitespace-nowrap">
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

  const nextLeft = useMemo(() => (leftVideo ? getNextRecommendedVideo(leftVideo, allVideos) : null), [leftVideo, allVideos])
  const nextRight = useMemo(() => (rightVideo ? getNextRecommendedVideo(rightVideo, allVideos) : null), [rightVideo, allVideos])

  useEffect(() => {
    if (leftVideo && !audioSourceId) setAudioSourceId(leftVideo.id)
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
        if (Math.abs(v.currentTime - referenceTime) > 0.3) v.currentTime = referenceTime
      })
      setMasterTime(referenceTime)
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Picker state- shown by default when fewer than 2 valid videos are selected.
  if (!leftVideo || !rightVideo || leftVideo.id === rightVideo.id) {
    return (
      <section className="w-full max-w-full mx-auto flex flex-col gap-4 sm:gap-5 px-4 sm:px-0">
        <div className="bg-gradient-to-br from-white to-[#f8fafc] border border-[#d9e2ec] shadow-[0_18px_40px_rgba(15,23,42,0.08)] rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 text-[#0f172a]">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#0f172a] m-0 mb-2">Comparison View</p>
          <h2 className="text-[#0f172a] my-2 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.1] tracking-[-0.03em]">
            Side-by-side comparison <span className="text-[#64748b]">of educational videos</span>
          </h2>
          <p className="text-[#334155] text-sm sm:text-base">
            Compare summaries, chapter structure, learning objectives, and concept overlap across two selected videos in one workspace.
          </p>
        </div>

        <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
          <div className="flex justify-between items-center gap-3 mb-4">
            <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">Available videos for comparison</h3>
            <span className="text-[0.8rem] text-[#64748b] whitespace-nowrap">{allVideos.length} videos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allVideos.map((video) => {
              const isSelected = videos.some((item) => item.id === video.id)
              return (
                <article
                  key={video.id}
                  className={`text-left border rounded-[18px] p-4 flex flex-col gap-2 transition-all duration-[180ms] ${
                    isSelected ? 'border-black shadow-[0_0_0_1px_rgba(0,0,0,0.14)]' : 'border-[#e8eef5]'
                  }`}
                >
                  <p className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a] m-0">{video.domain ?? 'General'}</p>
                  <h3 className="m-0 text-[0.95rem] font-bold leading-snug">{video.title}</h3>
                  <p className="text-[#334155] m-0 text-sm">{video.summaryShort}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.78rem] text-[#64748b] mt-1">
                    <span>{video.speaker ?? 'Unknown speaker'}</span>
                    <span>{Math.round((video.duration ?? 0) / 60)} min</span>
                    <span>{video.totalChapters} chapters</span>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className={`flex-1 border rounded-[10px] px-3 py-1.5 text-[0.78rem] font-semibold transition-all duration-[180ms] ${
                        isSelected
                          ? 'border-black bg-black text-white hover:bg-[#111]'
                          : 'border-black bg-white text-black hover:bg-[#f8f8f8]'
                      }`}
                      onClick={() => onToggleCompareVideo(video.id)}
                    >
                      {isSelected ? 'Remove' : 'Add to compare'}
                    </button>
                    <button
                      type="button"
                      className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.78rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                      onClick={() => onOpenVideo(video.id)}
                    >
                      Open
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </section>
    )
  }

  const rows: { label: string; left: ReactNode; right: ReactNode }[] = [
    {
      label: 'Video Title',
      left: <button className="text-[#0f172a] font-semibold underline" onClick={() => onOpenVideo(leftVideo.id)}>{leftVideo.title}</button>,
      right: <button className="text-[#0f172a] font-semibold underline" onClick={() => onOpenVideo(rightVideo.id)}>{rightVideo.title}</button>,
    },
    { label: 'Author', left: leftVideo.author ?? leftVideo.speaker ?? 'Unknown', right: rightVideo.author ?? rightVideo.speaker ?? 'Unknown' },
    { label: 'Domain', left: leftVideo.domain ?? 'General', right: rightVideo.domain ?? 'General' },
    { label: 'Video Duration', left: formatDuration(leftVideo.duration), right: formatDuration(rightVideo.duration) },
    {
      label: 'Main Topics',
      left: renderPills(leftVideo.mainTopics ?? [], 'No main topics listed.', selectedConcept, onSelectConcept),
      right: renderPills(rightVideo.mainTopics ?? [], 'No main topics listed.', selectedConcept, onSelectConcept),
    },
    { label: 'Description', left: leftVideo.description ?? 'No description available.', right: rightVideo.description ?? 'No description available.' },
    { label: 'Organization', left: leftVideo.organization ?? 'Not specified', right: rightVideo.organization ?? 'Not specified' },
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
    { label: 'Target Audience', left: inferTargetAudience(leftVideo), right: inferTargetAudience(rightVideo) },
    {
      label: 'Next Recommended Video',
      left: nextLeft ? <button className="text-[#0f172a] font-semibold underline" onClick={() => onOpenVideo(nextLeft.id)}>{nextLeft.title}</button> : 'No recommendation available.',
      right: nextRight ? <button className="text-[#0f172a] font-semibold underline" onClick={() => onOpenVideo(nextRight.id)}>{nextRight.title}</button> : 'No recommendation available.',
    },
    { label: 'LLM Quality Evaluation', left: renderQualityBlock(leftVideo), right: renderQualityBlock(rightVideo) },
  ]

  return (
    <section className="w-full max-w-full mx-auto flex flex-col gap-4 sm:gap-5 px-4 sm:px-0">

      {/* Page intro */}
      <div className="bg-gradient-to-br from-white to-[#f8fafc] border border-[#d9e2ec] shadow-[0_18px_40px_rgba(15,23,42,0.08)] rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 text-[#0f172a]">
        <h2 className="text-[#0f172a] my-2 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.1] tracking-[-0.03em]">
          Side-by-side comparison of educational videos
        </h2>
        <p className="text-[#334155] text-sm sm:text-base">
          Inspect overlap, unique concepts, chapter structure, and summary differences across two selected educational videos.
        </p>

        {selectedConcept ? (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="text-[0.85rem] sm:text-[0.92rem] text-[#334155]">
              Filtering by concept: <strong className="text-[#0f172a]">{selectedConcept}</strong>
            </span>
            <button
              type="button"
              className="border border-black rounded-[14px] bg-white text-black px-4 py-2 text-sm font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-[#f8f8f8] transition-all duration-[180ms]"
              onClick={() => onSelectConcept(null)}
            >
              Clear concept
            </button>
          </div>
        ) : null}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-[14px]">
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">Shared concepts</span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{comparison?.sharedConcepts.length ?? 0}</strong>
        </article>
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">Similarity</span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{Math.round((comparison?.similarityScore ?? 0) * 100)}%</strong>
        </article>
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">Left chapters</span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{leftVideo.totalChapters}</strong>
        </article>
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">Right chapters</span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{rightVideo.totalChapters}</strong>
        </article>
      </div>

      {/* Comparison table */}
      <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-[#e8eef5]">
              <th className="text-left py-2 pr-3 font-bold text-[#0f172a] w-[180px]">Synchronized playback</th>
              <th className="text-left py-2 px-3 align-top">
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-[#0f172a]">{leftVideo.title}</span>
                  <SyncedVideoCell
                    video={leftVideo}
                    registerVideoRef={registerVideoRef}
                    isAudioSource={audioSourceId === leftVideo.id}
                    onSetAudioSource={handleSetAudioSource}
                    onDuration={setMasterDuration}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.78rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                      onClick={() => onToggleCompareVideo(leftVideo.id)}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      className="border border-black rounded-[10px] bg-black text-white px-3 py-1.5 text-[0.78rem] font-bold hover:bg-[#111] transition-all duration-[180ms]"
                      onClick={() => onOpenVideo(leftVideo.id)}
                    >
                      Open video
                    </button>
                  </div>
                </div>
              </th>
              <th className="text-left py-2 pl-3 align-top">
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-[#0f172a]">{rightVideo.title}</span>
                  <SyncedVideoCell
                    video={rightVideo}
                    registerVideoRef={registerVideoRef}
                    isAudioSource={audioSourceId === rightVideo.id}
                    onSetAudioSource={handleSetAudioSource}
                    onDuration={setMasterDuration}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.78rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                      onClick={() => onToggleCompareVideo(rightVideo.id)}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      className="border border-black rounded-[10px] bg-black text-white px-3 py-1.5 text-[0.78rem] font-bold hover:bg-[#111] transition-all duration-[180ms]"
                      onClick={() => onOpenVideo(rightVideo.id)}
                    >
                      Open video
                    </button>
                  </div>
                </div>
              </th>
            </tr>
            <tr className="border-b border-[#e8eef5]">
              <td className="py-3 pr-3 font-semibold text-[#0f172a]">Playback</td>
              <td colSpan={2} className="py-3 px-3">
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
              <tr key={row.label} className="border-b border-[#f1f5f9] align-top">
                <td className="py-3 pr-3 font-semibold text-[#0f172a] w-[180px]">{row.label}</td>
                <td className="py-3 px-3 text-[#334155]">{row.left}</td>
                <td className="py-3 pl-3 text-[#334155]">{row.right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  )
}