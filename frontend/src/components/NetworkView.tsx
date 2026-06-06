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

function buildEdges(videos: VideoRecord[], selectedConcept: string | null): VideoEdge[] {
  const normalizedSelectedConcept = selectedConcept
    ? normalizeConceptLabel(selectedConcept)
    : null

  const edges: VideoEdge[] = []

  for (let i = 0; i < videos.length; i += 1) {
    for (let j = i + 1; j < videos.length; j += 1) {
      const left = videos[i]
      const right = videos[j]

      const leftConceptMap = new Map(
        left.keyConcepts.map((concept) => [normalizeConceptLabel(concept), concept]),
      )

      const sharedConcepts = right.keyConcepts.filter((concept) => {
        const normalized = normalizeConceptLabel(concept)
        const matchesLeft = leftConceptMap.has(normalized)
        const matchesSelected =
          !normalizedSelectedConcept || normalized === normalizedSelectedConcept
        return matchesLeft && matchesSelected
      })

      if (sharedConcepts.length > 0) {
        edges.push({
          sourceId: left.id,
          targetId: right.id,
          sharedConcepts,
          weight: sharedConcepts.length,
        })
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

  if (value.includes('vision')) return '#7c3aed'
  if (value.includes('nlp') || value.includes('language')) return '#db2777'
  if (value.includes('database')) return '#d97706'
  if (value.includes('data')) return '#0f766e'
  if (value.includes('neural') || value.includes('machine') || value.includes('ai')) return '#2563eb'

  return '#475569'
}

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
    const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2
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

  const edges = useMemo(
    () => buildEdges(videos, selectedConcept),
    [videos, selectedConcept],
  )

  const maxOverlap = useMemo(() => {
    if (edges.length === 0) return 1
    return Math.max(...edges.map((edge) => edge.weight))
  }, [edges])

  const filteredEdges = useMemo(
    () => edges.filter((edge) => edge.weight >= minimumOverlap),
    [edges, minimumOverlap],
  )

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
    return filteredEdges.filter(
      (edge) => edge.sourceId === focusedVideoId || edge.targetId === focusedVideoId,
    )
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
    () =>
      getNodePositions(
        visibleVideos,
        connectionCounts,
        focusedVideoId,
        selectedVideoId,
        focusNeighborIds,
      ),
    [visibleVideos, connectionCounts, focusedVideoId, selectedVideoId, focusNeighborIds],
  )

  const nodeMap = useMemo(
    () => new Map(graphNodes.map((node) => [node.video.id, node])),
    [graphNodes],
  )

  const displayedEdges = focusedVideoId ? focusEdges : filteredEdges

      const conceptSummaryEdges = focusedVideoId ? focusEdges : filteredEdges

  const topSharedConcepts = useMemo(() => {
    const counts = new Map<string, number>()

    conceptSummaryEdges.forEach((edge) => {
      edge.sharedConcepts.forEach((concept) => {
        counts.set(concept, (counts.get(concept) ?? 0) + 1)
      })
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
  }, [conceptSummaryEdges])

  if (videos.length === 0) {
    return (
      <section className="network-page">
        <div className="network-hero">
          <p className="eyebrow">Network exploration</p>
          <h2>No videos match the current filters</h2>
          <p>Adjust the active search or filters to see concept relationships between videos.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="network-page">
      <div className="network-hero">
        <div>
          <p className="eyebrow">Network exploration</p>
          <h2>Explore concept overlap across the visible video set</h2>
          <p>
            This view connects videos through shared key concepts. Increase the overlap threshold
            to focus on stronger conceptual relationships.
          </p>
          {selectedConcept ? (
            <p className="section-note">Focused concept: {selectedConcept}</p>
          ) : null}
        </div>

        <div className="hero-actions">
          {selectedConcept ? (
            <button className="secondary-btn" onClick={() => onSelectConcept(null)}>
              Clear concept
            </button>
          ) : null}
          {focusedVideo ? (
            <button className="secondary-btn" onClick={() => setFocusedVideoId(null)}>
              Clear focus
            </button>
          ) : null}
        </div>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Visible Videos</span>
          <strong>{videos.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Connected Videos</span>
          <strong>{visibleVideos.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Relationships</span>
          <strong>{filteredEdges.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Min Overlap</span>
          <strong>{minimumOverlap}</strong>
        </article>
      </div>

      <section className="panel">
        <div className="network-toolbar">
          <div>
            <h3>Relationship threshold</h3>
            <p>
              Show only links where videos share at least {minimumOverlap} concept
              {minimumOverlap === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="network-toolbarcontrols">
            <label htmlFor="overlapRange">Minimum shared concepts</label>
            <input
              id="overlapRange"
              type="range"
              min={1}
              max={maxOverlap}
              value={minimumOverlap}
              onChange={(event) => setMinimumOverlap(Number(event.target.value))}
            />
            <span>{minimumOverlap}</span>
          </div>
        </div>

        <div className="network-view-toggle" role="tablist" aria-label="Network view modes">
          <button
            type="button"
            className={viewMode === 'graph' ? 'active' : ''}
            onClick={() => setViewMode('graph')}
          >
            Graph
          </button>
          <button
            type="button"
            className={viewMode === 'nodes' ? 'active' : ''}
            onClick={() => setViewMode('nodes')}
          >
            Nodes
          </button>
          <button
            type="button"
            className={viewMode === 'relationships' ? 'active' : ''}
            onClick={() => setViewMode('relationships')}
          >
            Relationships
          </button>
        </div>
      </section>

      <div className="network-layout">
        <div className="network-main">
          {viewMode === 'graph' ? (
            <section className="panel network-graph-panel">
              <div className="panel-head">
                <div>
                  <h3>Concept graph</h3>
                  <p className="network-panel-note">
                    Node size reflects connection count, edge width reflects shared concepts, and
                    colors indicate video domain.
                  </p>
                </div>
                <span>{graphNodes.length} nodes</span>
              </div>

                                          <div className="network-concept-strip">
                <div className="network-concept-striphead">
                  <div>
                    <h4>
                      {focusedVideo
                        ? `Shared concepts around ${focusedVideo.title}`
                        : 'Top shared concepts'}
                    </h4>
                    <span>
                      {focusedVideo
                        ? 'Based on the focused node and its visible neighbors'
                        : 'Based on all visible relationships'}
                    </span>
                  </div>

                  {focusedVideo ? (
                    <button
                      type="button"
                      className="secondary-btn network-mini-action"
                      onClick={() => setFocusedVideoId(null)}
                    >
                      Show full network
                    </button>
                  ) : null}
                </div>

                {topSharedConcepts.length === 0 ? (
                  <p className="network-panel-note">
                    {focusedVideo
                      ? 'This node has no visible shared concepts at the current threshold.'
                      : 'Lower the overlap threshold or clear the active concept filter to reveal more shared concepts.'}
                  </p>
                ) : (
                  <div className="chip-group compact">
                    {topSharedConcepts.map(([concept, count]) => (
                      <button
                        key={concept}
                        type="button"
                        className={`chip network-concept-chip ${selectedConcept === concept ? 'active' : ''}`}
                        onClick={() =>
                          onSelectConcept(selectedConcept === concept ? null : concept)
                        }
                      >
                        <span>{concept}</span>
                        <strong>{count}</strong>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="network-legend">
                <span><i className="legend-dot legend-dot--blue" /> AI / ML</span>
                <span><i className="legend-dot legend-dot--purple" /> Vision</span>
                <span><i className="legend-dot legend-dot--pink" /> NLP</span>
                <span><i className="legend-dot legend-dot--amber" /> Databases</span>
                <span><i className="legend-dot legend-dot--teal" /> Data</span>
                <span><i className="legend-dot legend-dot--slate" /> General</span>
              </div>

              <div className="network-graph-wrap">
                <svg
                  viewBox="0 0 920 520"
                  className="network-graph"
                  role="img"
                  aria-label="Video relationship graph"
                >
                  {displayedEdges.map((edge) => {
                    const source = nodeMap.get(edge.sourceId)
                    const target = nodeMap.get(edge.targetId)
                    if (!source || !target) return null

                    const isActive =
                      !focusedVideoId ||
                      edge.sourceId === focusedVideoId ||
                      edge.targetId === focusedVideoId

                    return (
                      <line
                        key={`${edge.sourceId}-${edge.targetId}`}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        className={`network-edge ${isActive ? 'active' : 'dimmed'}`}
                        strokeWidth={1.5 + edge.weight * 1.2}
                      />
                    )
                  })}

                  {graphNodes.map((node) => {
                    const dimmed =
                      !!focusedVideoId && !node.isFocused && !node.isNeighbor

                    return (
                      <g
                        key={node.video.id}
                        className={`network-node ${dimmed ? 'dimmed' : ''}`}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() =>
                          setFocusedVideoId((current) =>
                            current === node.video.id ? null : node.video.id,
                          )
                        }
                        onDoubleClick={() => onOpenVideo(node.video.id)}
                      >
                        <circle
                          className="network-node-circle"
                          r={node.radius}
                          fill={getDomainColor(node.video.domain)}
                        />
                        {(node.isFocused || node.isSelected) && (
                          <circle
                            className="network-node-ring"
                            r={node.radius + 6}
                            fill="none"
                          />
                        )}
                        <text
                          className="network-node-count"
                          textAnchor="middle"
                          dy="4"
                        >
                          {node.connectionCount}
                        </text>
                        <text
                          className="network-node-label"
                          textAnchor="middle"
                          y={node.radius + 18}
                        >
                          {node.video.title.length > 26
                            ? `${node.video.title.slice(0, 26)}…`
                            : node.video.title}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </section>
          ) : null}

          {viewMode === 'nodes' ? (
            <section className="panel">
              <div className="panel-head">
                <h3>Video nodes</h3>
                {focusedVideo ? (
                  <button className="secondary-btn" onClick={() => setFocusedVideoId(null)}>
                    Clear focus
                  </button>
                ) : null}
              </div>

              <div className="node-grid">
                {visibleVideos.map((video) => {
                  const isSelected = video.id === selectedVideoId
                  const isFocused = video.id === focusedVideoId
                  const connectionCount = filteredEdges.filter(
                    (edge) => edge.sourceId === video.id || edge.targetId === video.id,
                  ).length

                  return (
                    <article
                      key={video.id}
                      className={['node-card', isSelected ? 'selected' : '', isFocused ? 'focused' : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <div className="node-cardhead">
                        <p className="eyebrow">{video.domain ?? 'General'}</p>
                        <span>{connectionCount} links</span>
                      </div>

                      <h4>{video.title}</h4>
                      <p>{video.summaryShort}</p>

                      <div className="chip-group compact">
                        {video.keyConcepts.slice(0, 4).map((concept) => (
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

                      <div className="node-cardactions">
                        <span>{video.totalChapters} chapters</span>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                            setFocusedVideoId((current) =>
                              current === video.id ? null : video.id,
                            )
                          }
                        >
                          {isFocused ? 'Focused' : 'Focus node'}
                        </button>
                        <button
                          type="button"
                          className="inline-link"
                          onClick={() => onOpenVideo(video.id)}
                        >
                          Open video
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}

          {viewMode === 'relationships' ? (
            <section className="panel">
              <h3>Relationships</h3>

              {displayedEdges.length === 0 ? (
                <p>
                  No relationships match the current threshold
                  {focusedVideo ? ' for the focused video' : ''}.
                </p>
              ) : (
                <div className="relationship-list">
                  {displayedEdges.map((edge) => {
                    const source = getVideoById(videos, edge.sourceId)
                    const target = getVideoById(videos, edge.targetId)
                    if (!source || !target) return null

                    return (
                      <article
                        key={`${edge.sourceId}-${edge.targetId}`}
                        className="relationship-card"
                      >
                        <div className="relationship-cardhead">
                          <div>
                            <strong>{source.title}</strong>
                            <span> ↔ </span>
                            <strong>{target.title}</strong>
                          </div>
                          <span className="weight-badge">
                            {edge.weight} shared concept{edge.weight === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="chip-group compact">
                          {edge.sharedConcepts.map((concept) => (
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

                        <div className="relationship-actions">
                          <button
                            className="secondary-btn"
                            onClick={() => onOpenVideo(edge.sourceId)}
                          >
                            Open source
                          </button>
                          <button
                            className="secondary-btn"
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

        <aside className="network-sidebar">
          <section className="panel">
            <h3>Focused video</h3>

            {!focusedVideo ? (
              <p>Select a node in the graph or node list to inspect its immediate concept neighbors.</p>
            ) : (
              <div className="focused-panel">
                <p className="eyebrow">{focusedVideo.domain ?? 'General'}</p>
                <h4>{focusedVideo.title}</h4>
                <p>{focusedVideo.summaryShort}</p>

                <div className="chip-group compact">
                  {focusedVideo.keyConcepts.map((concept) => (
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

                <button
                  className="primary-btn"
                  onClick={() => onOpenVideo(focusedVideo.id)}
                >
                  Open video explorer
                </button>
              </div>
            )}
          </section>

          <section className="panel">
            <h3>Immediate neighbors</h3>

            {focusNeighbors.length === 0 ? (
              <p>No neighboring videos are currently connected to the selected node.</p>
            ) : (
              <div className="related-list">
                {focusNeighbors.map((video) => (
                  <article key={video.id} className="related-card related-card--actions">
                    <div>
                      <strong>{video.title}</strong>
                      <span>{video.domain ?? 'General'}</span>
                      <small>{connectionCounts.get(video.id) ?? 0} total links</small>
                    </div>

                    <div className="related-cardactions">
                      <button
                        className="secondary-btn"
                        onClick={() => setFocusedVideoId(video.id)}
                      >
                        Focus
                      </button>
                      <button
                        className="primary-btn"
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