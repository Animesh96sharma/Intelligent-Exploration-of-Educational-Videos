import { useEffect, useMemo, useRef, useState } from 'react'

export type WordEntry = { label: string; weight: number; meta?: string }

type LiveWordCloudProps = {
  entries: WordEntry[]
  onSelectConcept: (concept: string | null) => void
  selectedConcept: string | null
  emptyMessage?: string
  unitLabel?: string
}

type PlacedWord = {
  label: string
  weight: number
  meta?: string
  x: number
  y: number
  fontSize: number
  color: string
  width: number
  height: number
  angle: number
  driftSeed: number
}

const MAX_WORDS_IN_CONCEPT = 8
const MIN_FONT = 13
const MAX_FONT = 52
const CLOUD_WIDTH = 960
const CLOUD_HEIGHT = 560

const PALETTE = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5',
  '#0d9488', '#c026d3', '#ca8a04', '#059669', '#e11d48',
  '#4338ca', '#0284c7', '#b45309', '#9333ea', '#15803d',
]

function colorForLabel(label: string) {
  let hash = 0
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}

function measureText(text: string, fontSize: number, fontWeight = 700): { width: number; height: number } {
  const canvas = measureText.canvas ?? (measureText.canvas = document.createElement('canvas'))
  const ctx = canvas.getContext('2d')!
  ctx.font = `${fontWeight} ${fontSize}px sans-serif`
  const metrics = ctx.measureText(text)
  return { width: metrics.width, height: fontSize * 1.15 }
}
measureText.canvas = undefined as HTMLCanvasElement | undefined

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding = 4,
) {
  return !(
    a.x + a.width / 2 + padding < b.x - b.width / 2 ||
    a.x - a.width / 2 - padding > b.x + b.width / 2 ||
    a.y + a.height / 2 + padding < b.y - b.height / 2 ||
    a.y - a.height / 2 - padding > b.y + b.height / 2
  )
}

function layoutWordCloud(entries: WordEntry[]): PlacedWord[] {
  if (entries.length === 0) return []

  const maxWeight = Math.max(...entries.map((e) => e.weight), 1)
  const minWeight = Math.min(...entries.map((e) => e.weight), maxWeight)
  const sorted = [...entries].sort((a, b) => b.weight - a.weight)

  const placed: PlacedWord[] = []
  const centerX = CLOUD_WIDTH / 2
  const centerY = CLOUD_HEIGHT / 2

  sorted.forEach((entry, index) => {
    const ratio = maxWeight === minWeight ? 1 : (entry.weight - minWeight) / (maxWeight - minWeight)
    const fontSize = MIN_FONT + (MAX_FONT - MIN_FONT) * Math.sqrt(ratio)
    const { width, height } = measureText(entry.label, fontSize)

    let angle = 0
    let radius = 0
    let placedOk = false
    let x = centerX
    let y = centerY
    const spiralStep = 6
    const angleStep = 0.35

    for (let attempt = 0; attempt < 2000; attempt += 1) {
      x = centerX + radius * Math.cos(angle)
      y = centerY + radius * Math.sin(angle) * 0.72

      const candidate = { x, y, width, height }
      const withinBounds =
        x - width / 2 > 8 &&
        x + width / 2 < CLOUD_WIDTH - 8 &&
        y - height / 2 > 8 &&
        y + height / 2 < CLOUD_HEIGHT - 8

      const overlapsExisting = placed.some((p) => rectsOverlap(candidate, p))

      if (withinBounds && !overlapsExisting) {
        placedOk = true
        break
      }

      angle += angleStep
      radius += spiralStep * 0.12
    }

    if (placedOk) {
      placed.push({
        label: entry.label,
        weight: entry.weight,
        meta: entry.meta,
        x,
        y,
        fontSize,
        color: colorForLabel(entry.label),
        width,
        height,
        angle: 0,
        driftSeed: index * 0.618,
      })
    }
  })

  return placed
}

export default function LiveWordCloud({
  entries,
  onSelectConcept,
  selectedConcept,
  emptyMessage = 'No concepts are available for the current filtered set.',
  unitLabel = 'occurrences',
}: LiveWordCloudProps) {
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(60)
  const [hovered, setHovered] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let start: number | null = null

    function frame(timestamp: number) {
      if (start === null) start = timestamp
      setTick((timestamp - start) / 1000)
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const filteredEntries = useMemo(
    () => entries.filter((entry) => entry.label.trim().split(/\s+/).length <= MAX_WORDS_IN_CONCEPT),
    [entries],
  )

  const limited = useMemo(
    () => [...filteredEntries].sort((a, b) => b.weight - a.weight).slice(0, limit),
    [filteredEntries, limit],
  )

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return limited
    return limited.filter((entry) => entry.label.toLowerCase().includes(q))
  }, [limited, search])

  const placedWords = useMemo(() => layoutWordCloud(searched), [searched])

  if (filteredEntries.length === 0) {
    return <p>{emptyMessage}</p>
  }

  return (
    <div className="word-cloud-shell">
      <div className="word-cloud-controls">
        <input
          type="text"
          placeholder="Search concepts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="similarity-search"
        />
        <div className="word-cloud-limit">
          <button type="button" onClick={() => setLimit((c) => Math.max(10, c - 10))}>
            Fewer
          </button>
          <span>{placedWords.length} of {filteredEntries.length} concepts</span>
          <button type="button" onClick={() => setLimit((c) => Math.min(200, c + 10))}>
            More
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CLOUD_WIDTH} ${CLOUD_HEIGHT}`}
        className="word-cloud-svg"
        role="img"
        aria-label="Live word cloud of concepts"
      >
        {placedWords.map((word) => {
          const isActive = selectedConcept === word.label
          const isHovered = hovered === word.label
          const driftX = Math.sin(tick * 0.6 + word.driftSeed) * 3
          const driftY = Math.cos(tick * 0.5 + word.driftSeed * 1.3) * 3
          const scale = isHovered || isActive ? 1.12 : 1

          return (
            <text
              key={word.label}
              x={word.x + driftX}
              y={word.y + driftY}
              fontSize={word.fontSize}
              fontWeight={700}
              fill={word.color}
              fillOpacity={isActive ? 1 : isHovered ? 0.95 : 0.82}
              textAnchor="middle"
              dominantBaseline="middle"
              className="word-cloud-word"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${word.x}px ${word.y}px`,
                cursor: 'pointer',
              }}
              onClick={() => onSelectConcept(isActive ? null : word.label)}
              onMouseEnter={() => setHovered(word.label)}
              onMouseLeave={() => setHovered(null)}
            >
              {word.label}
              <title>{`${word.label} \u00b7 ${word.weight} ${unitLabel}${word.meta ? ` \u00b7 ${word.meta}` : ''}`}</title>
            </text>
          )
        })}
      </svg>
    </div>
  )
}
