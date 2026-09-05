import { useMemo, useState } from 'react'
import type { VideoRecord } from '../types/video'
import { normalizeConceptLabel } from '../lib/analytics'

type NetworkViewProps = {
  videos: VideoRecord[]
  selectedVideoId: string | null
  onOpenVideo: (videoId: string) => void
  onSelectConcept: (concept: string | null) => void
  selectedConcept: string | null
}

type VideoEdge = {
  sourceId: string
  targetId: string
  sharedConcepts: string[]
  weight: number
}

type ViewMode = 'graph' | 'nodes' | 'relationships'

type GraphNode = {
  video: VideoRecord
  x: number
  y: number
  radius: number
  connectionCount: number
  isFocused: boolean
  isNeighbor: boolean
  isSelected: boolean
}

{/* Builds every pairwise edge between videos that share at least one concept. */}
function buildEdges(videos: VideoRecord[], selectedConcept: string | null): VideoEdge[] {
  const normalizedSelectedConcept = selectedConcept ? normalizeConceptLabel(selectedConcept) : null
  const edges: VideoEdge[] = []

  for (let i = 0; i < videos.length; i += 1) {
    for (let j = i + 1; j < videos.length; j += 1) {
      const left = videos[i]
      const right = videos[j]
      const leftConceptMap = new Map(left.keyConcepts.map((concept) => [normalizeConceptLabel(concept), concept]))

      const sharedConcepts = right.keyConcepts.filter((concept) => {
        const normalized = normalizeConceptLabel(concept)
        const matchesLeft = leftConceptMap.has(normalized)
        const matchesSelected = !normalizedSelectedConcept || normalized === normalizedSelectedConcept
        return matchesLeft && matchesSelected
      })

      if (sharedConcepts.length > 0) {
        edges.push({ sourceId: left.id, targetId: right.id, sharedConcepts, weight: sharedConcepts.length })
      }
    }
  }

  return edges.sort((a, b) => b.weight - a.weight)
}

function getVideoById(videos: VideoRecord[], id: string) {
  return videos.find((video) => video.id === id) ?? null
}


// Maps a video's domain string to a fixed hex color for the graph legend/nodes.
function getDomainColor(domain?: string) {
  const value = (domain ?? 'general').toLowerCase()
  if (['mathematics', 'functions', 'complex', 'holomorphic', 'integrals', 'matrix', 'jacobian'].some((k) => value.includes(k))) return '#0f766e'
  if (['sql', 'information', 'keywords', 'target', 'search', 'evaluation', 'structured', 'data'].some((k) => value.includes(k))) return '#d97706'
  if (value.includes('vision')) return '#7c3aed'
  if (['nlp', 'language', 'document frequency', 'idf', 'term frequency'].some((k) => value.includes(k))) return '#db2777'
  if (['neural', 'machine', 'ai'].some((k) => value.includes(k))) return '#2563eb'
  if (value.includes('finance')) return '#3fb14e'
  if (value.includes('computer science')) return '#dd37b9'
  return '#475569'
}

// Distributes videos evenly around a circular orbit (basic radial layout algorithm).
function getNodePositions(
  videos: VideoRecord[],
  connectionCounts: Map<string, number>,
  focusedVideoId: string | null,
  selectedVideoId: string | null,
  focusNeighborIds: Set<string>,
): GraphNode[] {
  const width = 920
  const height = 520
  const centerX = width / 2
  const centerY = height / 2
  const total = videos.length
  const radiusBase = Math.min(width, height) * 0.34

  return videos.map((video, index) => {
    const angle = ((Math.PI * 2) / Math.max(total, 1)) * index - Math.PI / 2
    const orbitScale = total <= 2 ? 0.55 : total <= 4 ? 0.72 : 1
    const x = centerX + Math.cos(angle) * radiusBase * orbitScale
    const y = centerY + Math.sin(angle) * radiusBase * orbitScale
    const connectionCount = connectionCounts.get(video.id) ?? 0

    return {
      video,
      x,
      y,
      radius: 18 + Math.min(connectionCount, 6) * 3,
      connectionCount,
      isFocused: video.id === focusedVideoId,
      isNeighbor: focusNeighborIds.has(video.id),
      isSelected: video.id === selectedVideoId,
    }
  })
}

export default function NetworkView({
  videos,
  selectedVideoId,
  onOpenVideo,
  onSelectConcept,
  selectedConcept,
}: NetworkViewProps) {
  const [minimumOverlap, setMinimumOverlap] = useState(1)
  const [focusedVideoId, setFocusedVideoId] = useState<string | null>(selectedVideoId)
  const [viewMode, setViewMode] = useState<ViewMode>('graph')

  const edges = useMemo(() => buildEdges(videos, selectedConcept), [videos, selectedConcept])
  const maxOverlap = useMemo(() => (edges.length === 0 ? 1 : Math.max(...edges.map((edge) => edge.weight))), [edges])
  const filteredEdges = useMemo(() => edges.filter((edge) => edge.weight >= minimumOverlap), [edges, minimumOverlap])

  const connectedVideoIds = useMemo(() => {
    const ids = new Set<string>()
    filteredEdges.forEach((edge) => {
      ids.add(edge.sourceId)
      ids.add(edge.targetId)
    })
    return ids
  }, [filteredEdges])

  const visibleVideos = useMemo(() => {
    if (filteredEdges.length === 0) return videos
    return videos.filter((video) => connectedVideoIds.has(video.id))
  }, [videos, filteredEdges, connectedVideoIds])

  const focusEdges = useMemo(() => {
    if (!focusedVideoId) return filteredEdges
    return filteredEdges.filter((edge) => edge.sourceId === focusedVideoId || edge.targetId === focusedVideoId)
  }, [filteredEdges, focusedVideoId])

  const focusNeighborIds = useMemo(() => {
    const ids = new Set<string>()
    if (!focusedVideoId) return ids
    focusEdges.forEach((edge) => {
      if (edge.sourceId === focusedVideoId) ids.add(edge.targetId)
      if (edge.targetId === focusedVideoId) ids.add(edge.sourceId)
    })
    return ids
  }, [focusEdges, focusedVideoId])

  const focusNeighbors = useMemo(() => {
    if (!focusedVideoId) return []
    return videos.filter((video) => focusNeighborIds.has(video.id))
  }, [videos, focusedVideoId, focusNeighborIds])

  const focusedVideo = focusedVideoId ? getVideoById(videos, focusedVideoId) : null

  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    visibleVideos.forEach((video) => counts.set(video.id, 0))
    filteredEdges.forEach((edge) => {
      counts.set(edge.sourceId, (counts.get(edge.sourceId) ?? 0) + 1)
      counts.set(edge.targetId, (counts.get(edge.targetId) ?? 0) + 1)
    })
    return counts
  }, [visibleVideos, filteredEdges])

  const graphNodes = useMemo(
    () => getNodePositions(visibleVideos, connectionCounts, focusedVideoId, selectedVideoId, focusNeighborIds),
    [visibleVideos, connectionCounts, focusedVideoId, selectedVideoId, focusNeighborIds],
  )

  const nodeMap = useMemo(() => new Map(graphNodes.map((node) => [node.video.id, node])), [graphNodes])

  const displayedEdges = focusedVideoId ? focusEdges : filteredEdges
  const conceptSummaryEdges = focusedVideoId ? focusEdges : filteredEdges

  const topSharedConcepts = useMemo(() => {
    const counts = new Map<string, number>()
    conceptSummaryEdges.forEach((edge) => {
      edge.sharedConcepts.forEach((concept) => counts.set(concept, (counts.get(concept) ?? 0) + 1))
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
  }, [conceptSummaryEdges])

  if (videos.length === 0) {
    return (
      <section className="w-full max-w-full mx-auto flex flex-col gap-5 px-4 sm:px-0">
        <div className="bg-gradient-to-br from-white to-[#f8fafc] border border-[#d9e2ec] shadow-[0_18px_40px_rgba(15,23,42,0.08)] rounded-[24px] sm:rounded-[30px] p-5 sm:p-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#0f172a] m-0 mb-2">Network Exploration</p>
          <h2 className="text-[#0f172a] my-2 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.1] tracking-[-0.03em]">
            Relationship mapping <span className="text-[#64748b]">across educational videos</span>
          </h2>
          <p className="text-[#334155] text-sm sm:text-base">
            Discover concept-based relationships between videos through network-style exploration of shared topics and conceptual overlap.
          </p>
          <p className="mt-3 text-[0.85rem] sm:text-[0.92rem] text-[#64748b]">
            Adjust the active search or filters to see concept relationships between videos.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full max-w-full mx-auto flex flex-col gap-4 sm:gap-5 px-4 sm:px-0">

      {/* Page intro */}
      <div className="bg-gradient-to-br from-white to-[#f8fafc] border border-[#d9e2ec] shadow-[0_18px_40px_rgba(15,23,42,0.08)] rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 text-[#0f172a]">
        <h2 className="text-[#0f172a] my-2 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.1] tracking-[-0.03em]">
          Relationship mapping across educational videos
        </h2>
        <p className="text-[#334155] text-sm sm:text-base">
          Discover concept-based relationships between videos through shared key-concepts using different interactive network navigation.
        </p>
        {selectedConcept ? (
          <p className="mt-2 text-[0.82rem] text-[#64748b]">Focused concept: {selectedConcept}</p>
        ) : null}

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
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">Visible videos</span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{videos.length}</strong>
        </article>
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">Connected videos</span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{visibleVideos.length}</strong>
        </article>
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">Relationships</span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{filteredEdges.length}</strong>
        </article>
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">Min overlap</span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{minimumOverlap}</strong>
        </article>
      </div>

      {/* Toolbar panel */}
      <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:items-start">
          <div>
            <h3 className="m-0 mb-1 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">Relationship threshold</h3>
            <p className="text-[#334155] m-0 text-sm">
              Shows only link between videos which share at least {minimumOverlap} concept{minimumOverlap !== 1 ? 's' : '.'}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="overlapRange" className="text-[0.82rem] font-semibold text-[#334155] whitespace-nowrap">
              Minimum shared concepts
            </label>
            <input
              id="overlapRange"
              type="range"
              min={1}
              max={maxOverlap}
              value={minimumOverlap}
              onChange={(event) => setMinimumOverlap(Number(event.target.value))}
              className="accent-black flex-1"
            />
            <span className="text-[0.85rem] font-bold text-[#0f172a]">{minimumOverlap}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4" role="tablist" aria-label="Network view modes">
          {(['graph', 'nodes', 'relationships'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`border rounded-full px-3.5 py-2 text-sm font-bold capitalize transition-all duration-[180ms] ${
                viewMode === mode ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-[#f8f8f8]'
              }`}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'graph' ? 'Graph' : mode === 'nodes' ? 'Nodes' : 'Relationships'}
            </button>
          ))}
        </div>
      </section>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4 sm:gap-5 items-start">

        <div className="flex flex-col gap-4 sm:gap-5 min-w-0">

          {viewMode === 'graph' ? (
            <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] overflow-hidden">
              <div className="flex justify-between gap-3 mb-2 flex-wrap">
                <div>
                  <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">Concept graph</h3>
                  <p className="mt-1.5 text-[#94a3b8] text-[0.9rem] leading-[1.55]">
                    Node size reflects connection count, edge width reflects shared concepts, and colors indicate video domain.
                  </p>
                </div>
                <span className="text-[0.8rem] text-[#64748b] whitespace-nowrap">{graphNodes.length} nodes</span>
              </div>

              {/* Concept strip */}
              <div className="flex flex-col gap-3 p-3.5 sm:p-4 mt-4 rounded-[18px] bg-gradient-to-b from-[#f8fafc] to-white border border-[#f1f5f9]">
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <div>
                    <h4 className="m-0 text-[0.9rem] font-bold">
                      {focusedVideo ? `Shared concepts around ${focusedVideo.title}` : 'Top shared concepts'}
                    </h4>
                    <span className="text-[#94a3b8] text-[0.82rem]">
                      {focusedVideo ? 'Based on the focused node and its visible neighbors' : 'Based on all visible relationships'}
                    </span>
                  </div>
                  {focusedVideo ? (
                    <button
                      type="button"
                      className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.8rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                      onClick={() => setFocusedVideoId(null)}
                    >
                      Show full network
                    </button>
                  ) : null}
                </div>

                {topSharedConcepts.length === 0 ? (
                  <p className="text-[#94a3b8] text-[0.9rem] leading-[1.55] m-0">
                    {focusedVideo
                      ? 'This node has no visible shared concepts at the current threshold.'
                      : 'Lower the overlap threshold or clear the active concept filter to reveal more shared concepts.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {topSharedConcepts.map(([concept, count]) => (
                      <button
                        key={concept}
                        type="button"
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border transition-all duration-[180ms] ${
                          selectedConcept === concept
                            ? 'bg-black text-white border-black'
                            : 'bg-[#f3f4f6] text-[#0f172a] border-[#d9e2ec] hover:-translate-y-px'
                        }`}
                        onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                      >
                        <span>{concept}</span>
                        <strong className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-black/10 text-[0.72rem]">
                          {count}
                        </strong>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3.5 gap-y-2.5 text-[#334155] text-[0.84rem] mt-4">
                {[
                  ['#e11d48', 'Computer Science'],
                  ['#2563eb', 'AI / ML'],
                  ['#7c3aed', 'Computer Vision'],
                  ['#db2777', 'NLP'],
                  ['#d97706', 'Databases'],
                  ['#0f766e', 'Mathematics'],
                  ['#3fb14e', 'Finance'],
                  ['#475569', 'General'],
                ].map(([color, label]) => (
                  <span key={label} className="inline-flex items-center gap-2">
                    <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>

              {/* Graph SVG */}
              <div className="w-full overflow-auto rounded-[18px] border border-[#f1f5f9] bg-gradient-to-b from-[#f8fafc] to-white mt-4">
                <svg viewBox="0 0 920 520" className="w-full min-w-[760px] min-h-[520px] block" role="img" aria-label="Video relationship graph">
                  {displayedEdges.map((edge) => {
                    const source = nodeMap.get(edge.sourceId)
                    const target = nodeMap.get(edge.targetId)
                    if (!source || !target) return null
                    const isActive = !focusedVideoId || edge.sourceId === focusedVideoId || edge.targetId === focusedVideoId
                    return (
                      <line
                        key={`${edge.sourceId}-${edge.targetId}`}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={isActive ? 'rgba(15,23,42,0.42)' : 'rgba(15,23,42,0.18)'}
                        strokeLinecap="round"
                        strokeWidth={1.5 + edge.weight * 1.2}
                        opacity={isActive ? 1 : 0.18}
                        className="transition-[opacity,stroke] duration-[180ms]"
                      />
                    )
                  })}
                  {graphNodes.map((node) => {
                    const dimmed = !!focusedVideoId && !node.isFocused && !node.isNeighbor
                    return (
                      <g
                        key={node.video.id}
                        className={`cursor-pointer transition-[opacity,transform] duration-[180ms] ${dimmed ? 'opacity-[0.24]' : ''}`}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => setFocusedVideoId((current) => (current === node.video.id ? null : node.video.id))}
                        onDoubleClick={() => onOpenVideo(node.video.id)}
                      >
                        <circle
                          r={node.radius}
                          fill={getDomainColor(node.video.domain)}
                          stroke={node.isFocused || node.isSelected ? '#0f172a' : 'rgba(255,255,255,0.95)'}
                          strokeWidth={3}
                        />
                        <circle r={node.radius + 6} fill="none" stroke="rgba(15,23,42,0.28)" strokeWidth={2} />
                        <text textAnchor="middle" dy={4} fill="#ffffff" fontSize="0.85rem" fontWeight={800} className="pointer-events-none">
                          {node.connectionCount}
                        </text>
                        <text
                          textAnchor="middle"
                          y={node.radius + 18}
                          fill="#0f172a"
                          fontSize="0.78rem"
                          fontWeight={700}
                          className="pointer-events-none"
                        >
                          {node.video.title.length > 26 ? `${node.video.title.slice(0, 26)}…` : node.video.title}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </section>
          ) : null}

          {viewMode === 'nodes' ? (
            <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <div className="flex justify-between items-center gap-3 mb-4">
                <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">Video nodes</h3>
                {focusedVideo ? (
                  <button
                    type="button"
                    className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.8rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                    onClick={() => setFocusedVideoId(null)}
                  >
                    Clear focus
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleVideos.map((video) => {
                  const isSelected = video.id === selectedVideoId
                  const isFocused = video.id === focusedVideoId
                  const connectionCount = filteredEdges.filter(
                    (edge) => edge.sourceId === video.id || edge.targetId === video.id,
                  ).length

                  return (
                    <article
                      key={video.id}
                      className={`border rounded-[18px] p-4 flex flex-col gap-3 transition-all duration-[180ms] ${
                        isSelected || isFocused ? 'border-black shadow-[0_0_0_1px_rgba(0,0,0,0.14)]' : 'border-[#e8eef5]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a] m-0">
                          {video.domain ?? 'General'}
                        </p>
                        <span className="text-[0.75rem] text-[#64748b] whitespace-nowrap">{connectionCount} links</span>
                      </div>
                      <h4 className="m-0 text-[0.95rem] font-bold leading-snug">{video.title}</h4>
                      <p className="text-[#334155] m-0 text-sm">{video.summaryShort}</p>

                      <div className="flex flex-wrap gap-2">
                        {video.keyConcepts.slice(0, 4).map((concept) => (
                          <button
                            key={concept}
                            type="button"
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border transition-all duration-[180ms] ${
                              selectedConcept === concept
                                ? 'bg-black text-white border-black'
                                : 'bg-[#f3f4f6] text-[#0f172a] border-[#d9e2ec]'
                            }`}
                            onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                          >
                            {concept}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between items-center gap-2 mt-1">
                        <span className="text-[0.78rem] text-[#64748b]">{video.totalChapters} chapters</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.78rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                            onClick={() => setFocusedVideoId((current) => (current === video.id ? null : video.id))}
                          >
                            {isFocused ? 'Focused' : 'Focus node'}
                          </button>
                          <button
                            type="button"
                            className="text-[0.78rem] font-semibold underline text-[#0f172a]"
                            onClick={() => onOpenVideo(video.id)}
                          >
                            Open video
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}

          {viewMode === 'relationships' ? (
            <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <h3 className="m-0 mb-4 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">Relationships</h3>

              {displayedEdges.length === 0 ? (
                <p className="text-[#334155] m-0 text-sm">
                  No relationships match the current threshold{focusedVideo ? ' for the focused video.' : '.'}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {displayedEdges.map((edge) => {
                    const source = getVideoById(videos, edge.sourceId)
                    const target = getVideoById(videos, edge.targetId)
                    if (!source || !target) return null

                    return (
                      <article
                        key={`${edge.sourceId}-${edge.targetId}`}
                        className="border border-[#e8eef5] rounded-[16px] p-4 flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <strong className="text-[0.9rem] text-[#0f172a]">{source.title}</strong>
                            <span className="text-[#94a3b8]">↔</span>
                            <strong className="text-[0.9rem] text-[#0f172a]">{target.title}</strong>
                          </div>
                          <span className="inline-flex items-center border border-black rounded-full px-3 py-1 text-[0.76rem] font-bold text-black bg-[#f3f4f6] whitespace-nowrap">
                            {edge.weight} shared concept{edge.weight !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {edge.sharedConcepts.map((concept) => (
                            <button
                              key={concept}
                              type="button"
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border transition-all duration-[180ms] ${
                                selectedConcept === concept
                                  ? 'bg-black text-white border-black'
                                  : 'bg-[#f3f4f6] text-[#0f172a] border-[#d9e2ec]'
                              }`}
                              onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                            >
                              {concept}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.78rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                            onClick={() => onOpenVideo(edge.sourceId)}
                          >
                            Open source
                          </button>
                          <button
                            type="button"
                            className="border border-black rounded-[10px] bg-white text-black px-3 py-1.5 text-[0.78rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                            onClick={() => onOpenVideo(edge.targetId)}
                          >
                            Open target
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 sm:gap-5 min-w-0">
          <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <h3 className="m-0 mb-3 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">Focused video</h3>
            {!focusedVideo ? (
              <p className="text-[#334155] m-0 text-sm">
                Select a node in the graph or node list to inspect its immediate concept neighbors.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a] m-0">
                  {focusedVideo.domain ?? 'General'}
                </p>
                <h4 className="m-0 text-[0.95rem] font-bold leading-snug">{focusedVideo.title}</h4>
                <p className="text-[#334155] m-0 text-sm">{focusedVideo.summaryShort}</p>
                <div className="flex flex-wrap gap-2">
                  {focusedVideo.keyConcepts.map((concept) => (
                    <button
                      key={concept}
                      type="button"
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border transition-all duration-[180ms] ${
                        selectedConcept === concept
                          ? 'bg-black text-white border-black'
                          : 'bg-[#f3f4f6] text-[#0f172a] border-[#d9e2ec]'
                      }`}
                      onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                    >
                      {concept}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="border border-black rounded-[12px] bg-black text-white px-4 py-2 text-sm font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] hover:bg-[#111] transition-all duration-[180ms] mt-1"
                  onClick={() => onOpenVideo(focusedVideo.id)}
                >
                  Open video explorer
                </button>
              </div>
            )}
          </section>

          <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <h3 className="m-0 mb-3 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">Immediate neighbors</h3>
            {focusNeighbors.length === 0 ? (
              <p className="text-[#334155] m-0 text-sm">No neighboring videos are currently connected to the selected node.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {focusNeighbors.map((video) => (
                  <article key={video.id} className="border border-[#e8eef5] rounded-[16px] p-3 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <strong className="text-[0.85rem] text-[#0f172a]">{video.title}</strong>
                      <span className="text-[0.75rem] text-[#64748b]">{video.domain ?? 'General'}</span>
                      <small className="text-[0.72rem] text-[#94a3b8]">{connectionCounts.get(video.id) ?? 0} total links</small>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        className="border border-black rounded-[10px] bg-white text-black px-2.5 py-1.5 text-[0.72rem] font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
                        onClick={() => setFocusedVideoId(video.id)}
                      >
                        Focus
                      </button>
                      <button
                        type="button"
                        className="border border-black rounded-[10px] bg-black text-white px-2.5 py-1.5 text-[0.72rem] font-bold hover:bg-[#111] transition-all duration-[180ms]"
                        onClick={() => onOpenVideo(video.id)}
                      >
                        Open
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}