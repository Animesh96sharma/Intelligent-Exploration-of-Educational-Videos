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
  driftSeed: number
}

const MAX_WORDS_IN_CONCEPT = 8
const MIN_FONT = 13
const MAX_FONT = 52
const CLOUD_WIDTH = 4000
const CLOUD_HEIGHT = 4000
const MIN_ZOOM = 0.4
const MAX_ZOOM = 3
const ZOOM_STEP = 0.2
const BOUNDS_PADDING = 40

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
        driftSeed: index * 0.618,
      })
    }
  })

  return placed
}

function computeFitViewBox(words: PlacedWord[]): { x: number; y: number; w: number; h: number } {
  if (words.length === 0) {
    return { x: 0, y: 0, w: CLOUD_WIDTH, h: CLOUD_HEIGHT }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  words.forEach((word) => {
    minX = Math.min(minX, word.x - word.width / 2)
    maxX = Math.max(maxX, word.x + word.width / 2)
    minY = Math.min(minY, word.y - word.height / 2)
    maxY = Math.max(maxY, word.y + word.height / 2)
  })

  minX -= BOUNDS_PADDING
  maxX += BOUNDS_PADDING
  minY -= BOUNDS_PADDING
  maxY += BOUNDS_PADDING

  const contentWidth = Math.max(maxX - minX, 120)
  const contentHeight = Math.max(maxY - minY, 80)
  const contentCenterX = (minX + maxX) / 2
  const contentCenterY = (minY + maxY) / 2

  const targetAspect = CLOUD_WIDTH / CLOUD_HEIGHT
  const contentAspect = contentWidth / contentHeight

  let w = contentWidth
  let h = contentHeight

  if (contentAspect > targetAspect) {
    h = w / targetAspect
  } else {
    w = h * targetAspect
  }

  return {
    x: contentCenterX - w / 2,
    y: contentCenterY - h / 2,
    w,
    h,
  }
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
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<{
    startClientX: number
    startClientY: number
    startPan: { x: number; y: number }
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [searched.length])

  const fitBox = useMemo(() => computeFitViewBox(placedWords), [placedWords])

  const viewBox = useMemo(() => {
    const w = fitBox.w / zoom
    const h = fitBox.h / zoom
    const cx = fitBox.x + fitBox.w / 2 + pan.x
    const cy = fitBox.y + fitBox.h / 2 + pan.y

    return {
      x: cx - w / 2,
      y: cy - h / 2,
      w,
      h,
    }
  }, [fitBox, zoom, pan])

  function clampPan(nextPan: { x: number; y: number }, currentZoom: number) {
    const w = fitBox.w / currentZoom
    const h = fitBox.h / currentZoom
    const maxOffsetX = Math.max(0, (fitBox.w - w) / 2 + fitBox.w * 0.15)
    const maxOffsetY = Math.max(0, (fitBox.h - h) / 2 + fitBox.h * 0.15)

    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nextPan.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, nextPan.y)),
    }
  }

  function handleZoomIn() {
    setZoom((z) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100)
      setPan((p) => clampPan(p, nextZoom))
      return nextZoom
    })
  }

  function handleZoomOut() {
    setZoom((z) => {
      const nextZoom = Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100)
      setPan((p) => clampPan(p, nextZoom))
      return nextZoom
    })
  }

  function handleResetZoom() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom((z) => {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round((z + delta) * 100) / 100))
      setPan((p) => clampPan(p, nextZoom))
      return nextZoom
    })
  }

  function handleMouseDown(e: React.MouseEvent) {
    draggingRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPan: { ...pan },
    }
    setIsDragging(false)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!draggingRef.current || !svgRef.current) return

    const dxClient = e.clientX - draggingRef.current.startClientX
    const dyClient = e.clientY - draggingRef.current.startClientY

    if (!isDragging && Math.hypot(dxClient, dyClient) > 3) {
      setIsDragging(true)
    }

    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = viewBox.w / rect.width
    const scaleY = viewBox.h / rect.height

    const nextPan = {
      x: draggingRef.current.startPan.x - dxClient * scaleX,
      y: draggingRef.current.startPan.y - dyClient * scaleY,
    }

    setPan(clampPan(nextPan, zoom))
  }

  function handleMouseUp() {
    draggingRef.current = null
    setTimeout(() => setIsDragging(false), 0)
  }

  function handleWordClick(label: string) {
    if (isDragging) return
    onSelectConcept(selectedConcept === label ? null : label)
  }

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
        <div className="word-cloud-zoom">
          <button type="button" onClick={handleZoomOut} aria-label="Zoom out" title="Zoom out">
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={handleZoomIn} aria-label="Zoom in" title="Zoom in">
            +
          </button>
          <span onClick={handleResetZoom} title="Reset zoom and position">
            Reset
          </span>
        </div>
        {selectedConcept ? (
          <button type="button" className="secondary-btn" onClick={() => onSelectConcept(null)}>
            Reset selection
          </button>
        ) : null}
      </div>

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className={`word-cloud-svg ${isDragging ? 'dragging' : ''}`}
        role="img"
        aria-label="Live word cloud of concepts"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
                cursor: isDragging ? 'grabbing' : 'pointer',
              }}
              onClick={() => handleWordClick(word.label)}
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
