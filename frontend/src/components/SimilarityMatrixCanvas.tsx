import { useEffect, useMemo, useRef, useState } from 'react'
import type { VideoRecord } from '../types/video'

type SimilarityEntry = { score: number; sharedConcepts: string[] }

type SimilarityCanvasProps = {
  videos: VideoRecord[]
  similarityMatrix: Map<string, SimilarityEntry>
  onOpenVideo: (videoId: string) => void
  onToggleCompareVideo: (videoId: string) => void
  onOpenComparison: (videoId?: string) => void
}

const MIN_CELL = 28
const MAX_CELL = 96
const LABEL_COL_WIDTH = 220
const LABEL_ROW_HEIGHT = 130

function getHeatColor(intensity: number) {
  const alpha = 0.08 + intensity * 0.72
  return `rgba(37, 99, 235, ${alpha})`
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text
}

export default function SimilarityMatrixCanvas({
  videos,
  similarityMatrix,
  onOpenVideo,
  onToggleCompareVideo,
  onOpenComparison,
}: SimilarityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const colHeaderRef = useRef<HTMLDivElement>(null)
  const rowHeaderRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const [cellSize, setCellSize] = useState(48)
  const [sortBySimilarity, setSortBySimilarity] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const orderedVideos = useMemo(() => {
    if (!sortBySimilarity || videos.length === 0) return videos

    const remaining = new Set(videos.map((v) => v.id))
    const byId = new Map(videos.map((v) => [v.id, v]))
    const order: VideoRecord[] = [videos[0]]
    remaining.delete(videos[0].id)

    while (remaining.size > 0) {
      const last = order[order.length - 1]
      let bestId: string | null = null
      let bestScore = -1

      remaining.forEach((id) => {
        const score = similarityMatrix.get(`${last.id}::${id}`)?.score ?? 0
        if (score > bestScore) {
          bestScore = score
          bestId = id
        }
      })

      if (!bestId) bestId = remaining.values().next().value as string
      order.push(byId.get(bestId)!)
      remaining.delete(bestId)
    }

    return order
  }, [videos, sortBySimilarity, similarityMatrix])

  const visibleVideos = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orderedVideos
    return orderedVideos.filter((v) => v.title.toLowerCase().includes(q))
  }, [orderedVideos, search])

  const n = visibleVideos.length
  const canvasSize = n * cellSize

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasSize, canvasSize)

    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        const rowVideo = visibleVideos[i]
        const colVideo = visibleVideos[j]
        const isSame = rowVideo.id === colVideo.id
        const score = isSame ? 1 : similarityMatrix.get(`${rowVideo.id}::${colVideo.id}`)?.score ?? 0

        ctx.fillStyle = isSame ? 'rgba(15, 23, 42, 0.12)' : getHeatColor(score)
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize)
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize)

        if (cellSize >= 30) {
          ctx.fillStyle = score > 0.55 ? '#ffffff' : '#0f172a'
          ctx.font = `${Math.max(10, cellSize * 0.28)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            isSame ? '\u2014' : `${Math.round(score * 100)}`,
            j * cellSize + cellSize / 2,
            i * cellSize + cellSize / 2,
          )
        }
      }
    }
  }, [visibleVideos, n, cellSize, similarityMatrix])

  function handleMouseMove(e: React.MouseEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)

    if (row < 0 || row >= n || col < 0 || col >= n) {
      setTooltip(null)
      return
    }

    const rowVideo = visibleVideos[row]
    const colVideo = visibleVideos[col]
    const isSame = rowVideo.id === colVideo.id
    const pair = similarityMatrix.get(`${rowVideo.id}::${colVideo.id}`)
    const score = isSame ? 1 : pair?.score ?? 0

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      text: isSame
        ? rowVideo.title
        : `${rowVideo.title} \u2194 ${colVideo.title} \u00b7 ${Math.round(score * 100)}% similarity${
            pair?.sharedConcepts.length ? ` \u00b7 ${pair.sharedConcepts.slice(0, 4).join(', ')}` : ''
          }`,
    })
  }

  function handleClick(e: React.MouseEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)
    if (row < 0 || row >= n || col < 0 || col >= n) return

    const rowVideo = visibleVideos[row]
    const colVideo = visibleVideos[col]

    if (rowVideo.id === colVideo.id) {
      onOpenVideo(rowVideo.id)
      return
    }

    onToggleCompareVideo(rowVideo.id)
    onToggleCompareVideo(colVideo.id)
    onOpenComparison()
  }

  function handleMainScroll(e: React.UIEvent<HTMLDivElement>) {
    if (colHeaderRef.current) colHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft
    if (rowHeaderRef.current) rowHeaderRef.current.scrollTop = e.currentTarget.scrollTop
  }

  return (
    <div className="similarity-canvas-shell">
      <div className="similarity-toolbar">
        <input
          type="text"
          placeholder="Search video title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="similarity-search"
        />
        <label className="similarity-sort-toggle">
          <input
            type="checkbox"
            checked={sortBySimilarity}
            onChange={(e) => setSortBySimilarity(e.target.checked)}
          />
          Cluster similar videos
        </label>
        <div className="similarity-zoom-controls">
          <span>Zoom</span>
          <input
            type="range"
            min={MIN_CELL}
            max={MAX_CELL}
            step={4}
            value={cellSize}
            onChange={(e) => setCellSize(Number(e.target.value))}
          />
          <span>{cellSize}px</span>
        </div>
        <span className="similarity-count">{n} × {n} videos</span>
      </div>

      <div className="similarity-frozen-grid">
        <div className="similarity-corner-cell" style={{ width: LABEL_COL_WIDTH, height: LABEL_ROW_HEIGHT }}>
          Videos
        </div>

        <div
          className="similarity-col-header-scroll"
          ref={colHeaderRef}
          style={{ height: LABEL_ROW_HEIGHT }}
        >
          <div className="similarity-col-header-row" style={{ width: canvasSize }}>
            {visibleVideos.map((video) => (
              <button
                key={`col-${video.id}`}
                type="button"
                className="similarity-col-label"
                style={{ width: cellSize }}
                title={video.title}
                onClick={() => onOpenVideo(video.id)}
              >
                <span>{truncate(video.title, 34)}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className="similarity-row-header-scroll"
          ref={rowHeaderRef}
          style={{ width: LABEL_COL_WIDTH }}
        >
          <div className="similarity-row-header-col" style={{ height: canvasSize }}>
            {visibleVideos.map((video) => (
              <button
                key={`row-${video.id}`}
                type="button"
                className="similarity-row-label"
                style={{ height: cellSize }}
                title={video.title}
                onClick={() => onOpenVideo(video.id)}
              >
                {truncate(video.title, 28)}
              </button>
            ))}
          </div>
        </div>

        <div
          className="similarity-canvas-viewport"
          ref={scrollRef}
          onScroll={handleMainScroll}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          onClick={handleClick}
        >
          <canvas ref={canvasRef} style={{ cursor: 'pointer', display: 'block' }} />
        </div>
      </div>

      {tooltip ? (
        <div className="similarity-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          {tooltip.text}
        </div>
      ) : null}
    </div>
  )
}
