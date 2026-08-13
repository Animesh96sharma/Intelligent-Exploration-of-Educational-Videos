import { useMemo, useRef, useState } from 'react'
import type { VideoRecord } from '../types/video'
import { buildConceptFrequency, buildConceptIntensityRows } from '../lib/analytics'

type TopicHeatmapProps = { videos: VideoRecord[]; onOpenVideo: (id: string) => void; onSelectConcept: (c: string | null) => void; selectedConcept: string | null }

const LABEL_COL_W = 240, LABEL_ROW_H = 140, MIN_CELL_W = 60, MAX_CELL_W = 160, ROW_H = 40, MAX_WORDS = 8

function colorScale(v: number) {
  if (v <= 0) return 'rgba(226,232,240,0.6)'
  return `hsl(221,78%,${92-Math.min(v,1)*52}%)`
}
function trunc(t: string, max: number) { return t.length>max ? `${t.slice(0,max-1)}\u2026` : t }

export default function TopicHeatmap({ videos, onOpenVideo, onSelectConcept, selectedConcept }: TopicHeatmapProps) {
  const [limit, setLimit] = useState(16)
  const [cellW, setCellW] = useState(100)
  const colRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  const freq = useMemo(() => buildConceptFrequency(videos), [videos])
  const topConcepts = useMemo(() => Array.from(freq.values()).filter(e=>e.label.trim().split(/\s+/).length<=MAX_WORDS).sort((a,b)=>b.count-a.count).slice(0,limit).map(e=>e.label), [freq,limit])
  const rows = useMemo(() => buildConceptIntensityRows(videos, topConcepts), [videos,topConcepts])
  const maxVal = useMemo(() => { let m=0; rows.forEach(r=>r.values.forEach(v=>{if(v>m)m=v})); return m||1 }, [rows])

  function onBodyScroll(e: React.UIEvent<HTMLDivElement>) {
    if(colRef.current) colRef.current.scrollLeft = e.currentTarget.scrollLeft
    if(rowRef.current) rowRef.current.scrollTop = e.currentTarget.scrollTop
  }

  const gW = topConcepts.length*cellW, gH = rows.length*ROW_H

  if (topConcepts.length===0) return <p className="text-slate-400">No concept coverage map available.</p>

  const hBtn = "border border-slate-200 rounded-[12px] bg-white text-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-50 cursor-pointer"

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-3 flex-wrap text-sm">
        <span className="text-slate-500">Showing top {topConcepts.length} concepts across {rows.length} videos</span>
        <div className="flex gap-2">
          <button type="button" className={hBtn} onClick={()=>setLimit(c=>Math.max(6,c-4))}>Fewer concepts</button>
          <button type="button" className={hBtn} onClick={()=>setLimit(c=>Math.min(60,c+4))}>More concepts</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Column width</span>
          <input type="range" min={MIN_CELL_W} max={MAX_CELL_W} step={10} value={cellW} onChange={e=>setCellW(Number(e.target.value))} className="w-24" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid overflow-hidden rounded-[18px] border border-slate-200 bg-white" style={{gridTemplateColumns: `${LABEL_COL_W}px 1fr`, gridTemplateRows: `${LABEL_ROW_H}px 1fr`}}>
        {/* Corner */}
        <div className="flex items-end justify-start p-3 text-slate-400 text-sm border-r border-b border-slate-200" style={{width:LABEL_COL_W,height:LABEL_ROW_H}}>Videos</div>
        {/* Col headers */}
        <div ref={colRef} className="overflow-hidden border-b border-slate-200" style={{height:LABEL_ROW_H}}>
          <div className="flex" style={{width:gW}}>
            {topConcepts.map(c=>(
              <button key={c} type="button" className={`flex items-end justify-center pb-2 text-[0.72rem] font-semibold leading-none text-slate-600 border-none bg-transparent cursor-pointer hover:text-slate-900 ${selectedConcept===c?'text-slate-900':''}`}
                style={{width:cellW,height:LABEL_ROW_H,writingMode:'vertical-rl',textOrientation:'mixed'}} onClick={()=>onSelectConcept(selectedConcept===c?null:c)} title={c}>
                <span className="truncate" style={{maxHeight:cellW}}>{c}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Row headers */}
        <div ref={rowRef} className="overflow-hidden border-r border-slate-200" style={{width:LABEL_COL_W}}>
          <div style={{height:gH}}>
            {rows.map(r=>(
              <button key={r.videoId} type="button" className="flex items-center px-3 text-[0.8rem] text-slate-700 font-medium border-none bg-transparent cursor-pointer hover:text-slate-900 hover:bg-slate-50 w-full text-left truncate" style={{height:ROW_H}} title={r.videoTitle} onClick={()=>onOpenVideo(r.videoId)}>
                {trunc(r.videoTitle,30)}
              </button>
            ))}
          </div>
        </div>
        {/* Body */}
        <div className="overflow-auto" onScroll={onBodyScroll}>
          <div style={{width:gW,height:gH,position:'relative'}}>
            {rows.map(row=>(
              <div key={row.videoId} className="flex" style={{height:ROW_H,width:gW}}>
                {row.values.map((v,idx)=>(
                  <button key={`${row.videoId}-${topConcepts[idx]}`} type="button"
                    className={`border-none cursor-pointer transition-opacity duration-100 ${selectedConcept===topConcepts[idx]?'ring-2 ring-blue-400':''}`}
                    style={{width:cellW,height:ROW_H,background:colorScale(v/maxVal)}}
                    onClick={()=>onSelectConcept(selectedConcept===topConcepts[idx]?null:topConcepts[idx])}
                    title={`${row.videoTitle} · ${topConcepts[idx]} · ${(v*100).toFixed(0)}% coverage`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span>Low coverage</span>
        <div className="flex gap-0.5">{[0,0.25,0.5,0.75,1].map(v=><span key={v} className="w-8 h-4 rounded-sm" style={{background:colorScale(v)}} />)}</div>
        <span>High coverage</span>
      </div>
    </div>
  )
}
