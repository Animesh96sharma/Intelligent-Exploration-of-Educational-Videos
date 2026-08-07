import { useMemo, useRef, useState } from 'react'
import type { VideoRecord } from '../types/video'
import { buildConceptFrequency, buildConceptIntensityRows } from '../lib/analytics'

type TopicHeatmapProps = {
  videos: VideoRecord[]
  onOpenVideo: (videoId: string) => void
  onSelectConcept: (concept: string | null) => void
  selectedConcept: string | null
}

const LABEL_COL_WIDTH = 240
const LABEL_ROW_HEIGHT = 140
const MIN_CELL_W = 60
const MAX_CELL_W = 160
const ROW_H = 40
const MAX_WORDS_IN_CONCEPT = 8

function colorScale(value: number) {
  if (value <= 0) return 'rgba(226, 232, 240, 0.6)'
  const lightness = 92 - Math.min(value, 1) * 52
  return `hsl(221, 78%, ${lightness}%)`
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text
}

export default function TopicHeatmap({
  videos,
  onOpenVideo,
  onSelectConcept,
  selectedConcept,
}: TopicHeatmapProps) {
  const [conceptLimit, setConceptLimit] = useState(16)
  const [cellWidth, setCellWidth] = useState(100)
  const colHeaderRef = useRef<HTMLDivElement>(null)
  const rowHeaderRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const conceptFrequency = useMemo(() => buildConceptFrequency(videos), [videos])

  const topConcepts = useMemo(
    () =>
      Array.from(conceptFrequency.values())
        .filter((entry) => entry.label.trim().split(/\s+/).length <= MAX_WORDS_IN_CONCEPT)
        .sort((a, b) => b.count - a.count)
        .slice(0, conceptLimit)
        .map((entry) => entry.label),
    [conceptFrequency, conceptLimit],
  )

  const rows = useMemo(() => buildConceptIntensityRows(videos, topConcepts), [videos, topConcepts])

  const maxValue = useMemo(() => {
    let max = 0
    rows.forEach((row) => row.values.forEach((v) => { if (v > max) max = v }))
    return max || 1
  }, [rows])

  function handleBodyScroll(e: React.UIEvent<HTMLDivElement>) {
    if (colHeaderRef.current) colHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft
    if (rowHeaderRef.current) rowHeaderRef.current.scrollTop = e.currentTarget.scrollTop
  }

  const gridWidth = topConcepts.length * cellWidth
  const gridHeight = rows.length * ROW_H

  if (topConcepts.length === 0) {
    return <p>No concept coverage map is available for the current filtered set.</p>
  }

  return (
    <div className="topic-heatmap-v2">
      <div className="topic-heatmap-controls">
        <span>Showing top {topConcepts.length} concepts across {rows.length} videos</span>
        <div className="topic-heatmap-limit">
          <button type="button" onClick={() => setConceptLimit((c) => Math.max(6, c - 4))}>
            Fewer concepts
          </button>
          <button type="button" onClick={() => setConceptLimit((c) => Math.min(60, c + 4))}>
            More concepts
          </button>
        </div>
        <div className="topic-heatmap-zoom">
          <span>Column width</span>
          <input
            type="range"
            min={MIN_CELL_W}
            max={MAX_CELL_W}
            step={10}
            value={cellWidth}
            onChange={(e) => setCellWidth(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="topic-heatmap-frozen-grid">
        <div className="topic-heatmap-corner" style={{ width: LABEL_COL_WIDTH, height: LABEL_ROW_HEIGHT }}>
          Videos
        </div>

        <div
          className="topic-heatmap-col-header-scroll"
          ref={colHeaderRef}
          style={{ height: LABEL_ROW_HEIGHT }}
        >
          <div className="topic-heatmap-col-header-row" style={{ width: gridWidth }}>
            {topConcepts.map((concept) => (
              <button
                key={`heat-col-${concept}`}
                type="button"
                className={`heatmap-concept-label ${selectedConcept === concept ? 'active' : ''}`}
                style={{ width: cellWidth }}
                onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                title={concept}
              >
                <span>{concept}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className="topic-heatmap-row-header-scroll"
          ref={rowHeaderRef}
          style={{ width: LABEL_COL_WIDTH }}
        >
          <div className="topic-heatmap-row-header-col" style={{ height: gridHeight }}>
            {rows.map((row) => (
              <button
                key={`row-${row.videoId}`}
                type="button"
                className="heatmap-row-label"
                style={{ height: ROW_H }}
                title={row.videoTitle}
                onClick={() => onOpenVideo(row.videoId)}
              >
                {truncate(row.videoTitle, 30)}
              </button>
            ))}
          </div>
        </div>

        <div
          className="topic-heatmap-body-scroll"
          ref={bodyRef}
          onScroll={handleBodyScroll}
        >
          <div style={{ width: gridWidth, height: gridHeight, position: 'relative' }}>
            {rows.map((row) => (
              <div
                key={row.videoId}
                className="topic-heatmap-row"
                style={{ height: ROW_H, width: gridWidth }}
              >
                {row.values.map((value, idx) => (
                  <button
                    key={`${row.videoId}-${topConcepts[idx]}`}
                    type="button"
                    className={`heatmap-cell-v2 ${selectedConcept === topConcepts[idx] ? 'active' : ''}`}
                    style={{ width: cellWidth, height: ROW_H, background: colorScale(value / maxValue) }}
                    onClick={() => onSelectConcept(selectedConcept === topConcepts[idx] ? null : topConcepts[idx])}
                    title={`${row.videoTitle} \u00b7 ${topConcepts[idx]} \u00b7 ${(value * 100).toFixed(0)}% coverage`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="topic-heatmap-legend">
        <span>Low coverage</span>
        <div className="topic-heatmap-legend-scale">
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <span key={v} style={{ background: colorScale(v) }} />
          ))}
        </div>
        <span>High coverage</span>
      </div>
    </div>
  )
}
