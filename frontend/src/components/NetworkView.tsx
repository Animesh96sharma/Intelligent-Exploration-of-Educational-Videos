import { useEffect, useMemo, useState } from 'react'
import type { VideoRecord } from '../types/video'
import { normalizeConceptLabel } from '../lib/analytics'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force'
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force'

const GRAPH_WIDTH = 400
const GRAPH_HEIGHT = 200

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

type LayoutNode = SimulationNodeDatum & { id: string }
type LayoutLink = SimulationLinkDatum<LayoutNode> & {
  source: string | LayoutNode
  target: string | LayoutNode
  weight: number
}

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

// Simulate positions once per graph change.
function getForcePositions(
  videos: VideoRecord[],
  edges: VideoEdge[],
): Map<string, { x: number; y: number }> {
  const nodes: LayoutNode[] = videos.map((video) => ({ id: video.id }))
  const ids = new Set(nodes.map((node) => node.id))
  const links: LayoutLink[] = edges
    .filter((edge) => ids.has(edge.sourceId) && ids.has(edge.targetId))
    .map((edge) => ({
      source: edge.sourceId,
      target: edge.targetId,
      weight: edge.weight,
    }))

  if (nodes.length === 0) return new Map()

  const simulation = forceSimulation<LayoutNode>(nodes)
    .force(
      'link',
      forceLink<LayoutNode, LayoutLink>(links)
        .id((node) => node.id)
        .distance((link) => Math.max(65, 105 - (link.weight - 1) * 10))
        .strength((link) => Math.min(0.55, 0.22 + (link.weight - 1) * 0.06)),
    )
    .force('charge', forceManyBody<LayoutNode>().strength(-250))
    .force('collision', forceCollide<LayoutNode>().radius(26).strength(0.9))
    .force('center', forceCenter(GRAPH_WIDTH / 2, GRAPH_HEIGHT / 2))
    .stop()

  for (let i = 0; i < 300; i += 1) simulation.tick()

  return new Map(
    nodes.map((node) => [
      node.id,
      { x: node.x ?? GRAPH_WIDTH / 2, y: node.y ?? GRAPH_HEIGHT / 2 },
    ]),
  )
}

// All shared-concept relationships remain available in the list.
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

function getGraphNodes(
  videos: VideoRecord[],
  positions: Map<string, { x: number; y: number }>,
  connectionCounts: Map<string, number>,
  focusedVideoId: string | null,
  selectedVideoId: string | null,
  focusNeighborIds: Set<string>,
): GraphNode[] {
  return videos.map((video) => {
    const connectionCount = connectionCounts.get(video.id) ?? 0
    const position = positions.get(video.id)
    return {
      video,
      x: position?.x ?? GRAPH_WIDTH / 2,
      y: position?.y ?? GRAPH_HEIGHT / 2,
      radius: 10 + Math.min(connectionCount, 8) * 1.2,
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
  const [focusedVideoId, setFocusedVideoId] = useState<string | null>(null)
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('graph')
  const FOCUS_CONCEPT_LIMIT = 5;
  const [showAllFocusConcepts, setShowAllFocusConcepts] = useState(false);
  const MIN_NODE_LINKS = 5; // show first: videos with MORE than this many links
  const [showRemainingVideos, setShowRemainingVideos] = useState(false);

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

  const positions = useMemo(() => getForcePositions(visibleVideos, filteredEdges), [visibleVideos, filteredEdges])

  const graphNodes = useMemo(
    () => getGraphNodes(visibleVideos, positions, connectionCounts, focusedVideoId, selectedVideoId, focusNeighborIds),
    [visibleVideos, positions, connectionCounts, focusedVideoId, selectedVideoId, focusNeighborIds],
  )

  const nodeMap = useMemo(() => new Map(graphNodes.map((node) => [node.video.id, node])), [graphNodes])
  const displayedEdges = focusedVideoId ? focusEdges : filteredEdges
  const conceptSummaryEdges = focusedVideoId ? focusEdges : filteredEdges

  // ViewBox is calculated to ensure all nodes are visible with some padding, even if they are outside the default graph area.
  const graphViewBox = useMemo(() => {
    if (graphNodes.length === 0) return `0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`
    const padding = 90
    const left = Math.min(0, ...graphNodes.map((node) => node.x - node.radius - padding))
    const top = Math.min(0, ...graphNodes.map((node) => node.y - node.radius - padding))
    const right = Math.max(GRAPH_WIDTH, ...graphNodes.map((node) => node.x + node.radius + padding))
    const bottom = Math.max(GRAPH_HEIGHT, ...graphNodes.map((node) => node.y + node.radius + padding))
    return `${left} ${top} ${right - left} ${bottom - top}`
  }, [graphNodes])

  const topSharedConcepts = useMemo(() => {
    const counts = new Map<string, number>()
    conceptSummaryEdges.forEach((edge) => {
      edge.sharedConcepts.forEach((concept) => counts.set(concept, (counts.get(concept) ?? 0) + 1))
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
  }, [conceptSummaryEdges])

  // Selected concept first, then the rest in original order
  const orderedFocusConcepts = useMemo(() => {
    const all = focusedVideo?.keyConcepts ?? [];
    if (!selectedConcept) return all;
    const target = normalizeConceptLabel(selectedConcept);
    const matching = all.filter((c) => normalizeConceptLabel(c) === target);
    const rest = all.filter((c) => normalizeConceptLabel(c) !== target);
    return [...matching, ...rest];
  }, [focusedVideo, selectedConcept]);

  const visibleFocusConcepts = showAllFocusConcepts
    ? orderedFocusConcepts
    : orderedFocusConcepts.slice(0, FOCUS_CONCEPT_LIMIT);
  const hiddenFocusConceptCount = orderedFocusConcepts.length - FOCUS_CONCEPT_LIMIT;

  // Collapse again whenever a different node is focused
  useEffect(() => {
    setShowAllFocusConcepts(false);
  }, [focusedVideoId]);

  // All visible videos, most-linked first (ties: alphabetical)
  const sortedNodeVideos = useMemo(
    () =>
      [...visibleVideos].sort(
        (a, b) =>
          (connectionCounts.get(b.id) ?? 0) - (connectionCounts.get(a.id) ?? 0) ||
          a.title.localeCompare(b.title)
      ),
    [visibleVideos, connectionCounts]
  );
  const MIN_NODES_SHOWN = 6;     // never show fewer than this before "Show remaining"

  const strongLinkedVideos = useMemo(
    () => sortedNodeVideos.filter((v) => (connectionCounts.get(v.id) ?? 0) > MIN_NODE_LINKS),
    [sortedNodeVideos, connectionCounts]
  );

  // Fall back to the top N (sorted by links) when too few videos pass the cut-off
  const usingFallback = strongLinkedVideos.length < MIN_NODES_SHOWN;
  const topLinkedVideos = usingFallback
    ? sortedNodeVideos.slice(0, MIN_NODES_SHOWN)
    : strongLinkedVideos;

  const remainingVideoCount = sortedNodeVideos.length - topLinkedVideos.length;
  const nodeListVideos = showRemainingVideos ? sortedNodeVideos : topLinkedVideos;

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
              Shows only links between videos that share at least {minimumOverlap} concept{minimumOverlap !== 1 ? 's' : ''}.
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
              value={Math.min(minimumOverlap, maxOverlap)}
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
            <section className="w-full min-w-0 mx-auto bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-3 sm:p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] overflow-hidden">
              <div className="flex justify-between gap-3 mb-2 flex-wrap">
                <div>
                  <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">Concept graph</h3>
                  <p className="mt-1.5 text-[#94a3b8] text-[0.9rem] leading-[1.55]">
                    Node size reflects connection count, edge width reflects shared concepts, and colors indicate video domain. Hover for titles; click to focus.
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
                  ['#dd37b9', 'Computer Science'],
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
              <div className="w-full min-w-0 overflow-x-auto rounded-[18px] border border-[#f1f5f9] bg-gradient-to-b from-[#f8fafc] to-white mt-3">
                <svg
                  viewBox={graphViewBox}
                  preserveAspectRatio="xMidYMid meet"
                  className="block w-full min-w-[400px] h-[280px] sm:min-w-0 sm:h-[860px]"
                  role="group"
                  aria-label="Video relationship graph"
                >
                  {displayedEdges.map((edge) => {
                    const source = nodeMap.get(edge.sourceId)
                    const target = nodeMap.get(edge.targetId)
                    if (!source || !target) return null
                    const highlighted = hoveredVideoId === edge.sourceId || hoveredVideoId === edge.targetId || !!focusedVideoId
                    return (
                      <line
                        key={`${edge.sourceId}-${edge.targetId}`}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={highlighted ? 'rgba(15,23,42,0.48)' : 'rgba(15,23,42,0.18)'}
                        strokeLinecap="round"
                        strokeWidth={highlighted ? Math.min(2.5, 0.9 + edge.weight * 0.35) : Math.min(1.6, 0.6 + edge.weight * 0.2)}
                        className="pointer-events-none"
                      />
                    )
                  })}
                  {graphNodes.map((node) => {
                    const dimmed = !!focusedVideoId && !node.isFocused && !node.isNeighbor
                    const showLabel = node.isFocused || node.isSelected || hoveredVideoId === node.video.id
                    return (
                      <g
                        key={node.video.id}
                        className="cursor-pointer"
                        style={{ opacity: dimmed ? 0.22 : 1 }}
                        transform={`translate(${node.x}, ${node.y})`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${node.video.title}, ${node.connectionCount} links. Press Enter to focus.`}
                        onMouseEnter={() => setHoveredVideoId(node.video.id)}
                        onMouseLeave={() => setHoveredVideoId(null)}
                        onFocus={() => setHoveredVideoId(node.video.id)}
                        onBlur={() => setHoveredVideoId(null)}
                        onClick={() => setFocusedVideoId((current) => (current === node.video.id ? null : node.video.id))}
                        onDoubleClick={() => onOpenVideo(node.video.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setFocusedVideoId((current) => (current === node.video.id ? null : node.video.id))
                          }
                        }}
                      >
                        <title>{node.video.title}</title>
                        <circle
                          r={node.radius}
                          fill={getDomainColor(node.video.domain)}
                          stroke={node.isFocused || node.isSelected ? '#0f172a' : '#ffffff'}
                          strokeWidth={node.isFocused || node.isSelected ? 3 : 2}
                        />
                        {node.isFocused || node.isSelected ? (
                          <circle r={node.radius + 5} fill="none" stroke="rgba(15,23,42,0.4)" strokeWidth={1.5} />
                        ) : null}
                        {showLabel ? (
                          <text
                            textAnchor="middle"
                            y={node.radius + 19}
                            fill="#0f172a"
                            fontSize="12"
                            fontWeight={700}
                            stroke="#ffffff"
                            strokeWidth={3}
                            paintOrder="stroke"
                            className="pointer-events-none"
                          >
                            {node.video.title.length > 26 ? `${node.video.title.slice(0, 26)}…` : node.video.title}
                          </text>
                        ) : null}
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
                {nodeListVideos.map((video) => {
                  const isSelected = video.id === selectedVideoId
                  const isFocused = video.id === focusedVideoId
                  const connectionCount = connectionCounts.get(video.id) ?? 0

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

                      <p className="m-0 text-[0.82rem] leading-relaxed text-[#334155]">
                        <span className="font-semibold text-[#0f172a]">Key concepts: </span>
                        {video.keyConcepts.slice(0, 4).map((concept, index, list) => (
                          <span key={concept}>
                            <button
                              type="button"
                              className={`border-none bg-transparent p-0 text-[0.82rem] underline underline-offset-2 cursor-pointer hover:text-black ${
                                selectedConcept === concept ? "font-bold text-black" : "font-medium text-[#334155]"
                              }`}
                              onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                            >
                              {concept}
                            </button>
                            {index < list.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>

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

        {remainingVideoCount > 0 ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              className="border border-black rounded-[12px] bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8] transition-all duration-[180ms]"
              onClick={() => setShowRemainingVideos((open) => !open)}
              aria-expanded={showRemainingVideos}
            >
              {showRemainingVideos
                ? "Show fewer videos"
                : `Show the remaining videos (${remainingVideoCount})`}
            </button>
          </div>
        ) : null}
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

                        <p className="m-0 text-[0.82rem] leading-relaxed text-[#334155]">
                          <span className="font-semibold text-[#0f172a]">Shared concepts: </span>
                          {edge.sharedConcepts.map((concept, index) => (
                            <span key={concept}>
                              <button
                                type="button"
                                className={`border-none bg-transparent p-0 text-[0.82rem] underline underline-offset-2 cursor-pointer hover:text-black ${
                                  selectedConcept === concept ? "font-bold text-black" : "font-medium text-[#334155]"
                                }`}
                                onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                              >
                                {concept}
                              </button>
                              {index < edge.sharedConcepts.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </p>

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
                <div className="flex flex-col gap-2">
                  <p className="m-0 text-[0.82rem] leading-relaxed text-[#334155]">
                    <span className="font-semibold text-[#0f172a]">Key concepts: </span>
                    {visibleFocusConcepts.map((concept, index, list) => (
                      <span key={concept}>
                        <button
                          type="button"
                          className={`border-none bg-transparent p-0 text-[0.82rem] underline underline-offset-2 cursor-pointer hover:text-black ${
                            selectedConcept === concept ? "font-bold text-black" : "font-medium text-[#334155]"
                          }`}
                          onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                        >
                          {concept}
                        </button>
                        {index < list.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                {hiddenFocusConceptCount > 0 ? (
                  <button
                    type="button"
                    className="self-end border-none bg-transparent p-0 text-[0.82rem] underline underline-offset-2 cursor-pointer hover:text-black"
                    onClick={() => setShowAllFocusConcepts((open) => !open)}
                    aria-expanded={showAllFocusConcepts}
                  >
                    {showAllFocusConcepts ? "Show less" : `Show more (${hiddenFocusConceptCount})`}
                  </button>
                ) : null}
              </div>
                <button
                  type="button"
                  className="border border-black rounded-[12px] bg-black text-white px-4 py-2 text-sm font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] hover:bg-[#111] transition-all duration-[180ms] mt-1"
                  onClick={() => onOpenVideo(focusedVideo.id)}
                >
                  Open video
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
