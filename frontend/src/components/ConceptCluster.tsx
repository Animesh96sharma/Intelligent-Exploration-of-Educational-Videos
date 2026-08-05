import { useMemo, useState } from 'react'
import type { VideoRecord } from '../types/video'
import { buildConceptFrequency } from '../lib/analytics'

type ConceptClusterProps = {
  videos: VideoRecord[]
  onSelectConcept: (concept: string | null) => void
  selectedConcept: string | null
}

type Circle = { label: string; count: number; x: number; y: number; r: number }

const WIDTH = 900
const HEIGHT = 520
const MIN_RADIUS = 18
const MAX_RADIUS = 90

function packCircles(items: { label: string; count: number }[]): Circle[] {
  const maxCount = Math.max(...items.map((i) => i.count), 1)
  const scale = (count: number) =>
    MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(count / maxCount)

  const circles: Circle[] = []

  items.forEach((item) => {
    const r = scale(item.count)
    let placed = false
    let attempts = 0

    while (!placed && attempts < 400) {
      attempts += 1
      const x = r + Math.random() * (WIDTH - 2 * r)
      const y = r + Math.random() * (HEIGHT - 2 * r)

      const overlaps = circles.some((c) => {
        const dx = c.x - x
        const dy = c.y - y
        const dist = Math.sqrt(dx * dx + dy * dy)
        return dist < c.r + r + 3
      })

      if (!overlaps) {
        circles.push({ label: item.label, count: item.count, x, y, r })
        placed = true
      }
    }

    if (!placed) {
      circles.push({
        label: item.label,
        count: item.count,
        x: r + Math.random() * (WIDTH - 2 * r),
        y: r + Math.random() * (HEIGHT - 2 * r),
        r,
      })
    }
  })

  return circles
}

export default function ConceptCluster({
  videos,
  onSelectConcept,
  selectedConcept,
}: ConceptClusterProps) {
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)

  const conceptFrequency = useMemo(() => buildConceptFrequency(videos), [videos])

  const items = useMemo(
    () =>
      Array.from(conceptFrequency.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 120),
    [conceptFrequency],
  )

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [items, search])

  const circles = useMemo(() => packCircles(filteredItems), [filteredItems])

  if (items.length === 0) {
    return <p>No concepts are available for the current filtered set.</p>
  }

  return (
    <div className="concept-cluster-shell">
      <div className="concept-cluster-controls">
        <input
          type="text"
          placeholder="Search concepts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="similarity-search"
        />
        <span>{filteredItems.length} of {items.length} concepts</span>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="concept-cluster-svg" role="img" aria-label="Concept cluster">
        {circles.map((circle) => {
          const isActive = selectedConcept === circle.label
          const isHovered = hovered === circle.label
          const fontSize = Math.max(9, Math.min(circle.r * 0.5, 20))

          return (
            <g
              key={circle.label}
              transform={`translate(${circle.x}, ${circle.y})`}
              className={`concept-bubble ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
              onClick={() => onSelectConcept(isActive ? null : circle.label)}
              onMouseEnter={() => setHovered(circle.label)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle r={circle.r} />
              <text textAnchor="middle" dominantBaseline="middle" fontSize={fontSize}>
                {circle.label.length > 18 && circle.r < 40 ? `${circle.label.slice(0, 16)}...` : circle.label}
              </text>
              {isHovered ? (
                <text textAnchor="middle" y={circle.r + 14} fontSize={11} className="concept-bubble-count">
                  {circle.count} video{circle.count === 1 ? '' : 's'}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>

      <p className="section-note">
        Bubble size reflects how many videos reference each concept. Click a bubble to filter the
        collection by that concept, or search to locate a specific one.
      </p>
    </div>
  )
}
