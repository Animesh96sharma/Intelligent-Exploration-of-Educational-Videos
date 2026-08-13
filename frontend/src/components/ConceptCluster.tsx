import { useMemo, useState } from 'react'
import type { VideoRecord } from '../types/video'
import { buildConceptFrequency } from '../lib/analytics'

type ConceptClusterProps = { videos: VideoRecord[]; onSelectConcept: (c: string | null) => void; selectedConcept: string | null }
type Circle = { label: string; count: number; x: number; y: number; r: number }

const W = 900, H = 520, MIN_R = 18, MAX_R = 90

function packCircles(items: { label: string; count: number }[]): Circle[] {
  const max = Math.max(...items.map((i) => i.count), 1)
  const scale = (c: number) => MIN_R + (MAX_R - MIN_R) * Math.sqrt(c / max)
  const circles: Circle[] = []
  items.forEach((item) => {
    const r = scale(item.count); let placed = false; let attempts = 0
    while (!placed && attempts < 400) {
      attempts++
      const x = r + Math.random() * (W - 2 * r); const y = r + Math.random() * (H - 2 * r)
      if (!circles.some((c) => Math.sqrt((c.x-x)**2+(c.y-y)**2) < c.r+r+3)) { circles.push({...item,x,y,r}); placed=true }
    }
    if (!placed) circles.push({...item, x: r+Math.random()*(W-2*r), y: r+Math.random()*(H-2*r), r})
  })
  return circles
}

export default function ConceptCluster({ videos, onSelectConcept, selectedConcept }: ConceptClusterProps) {
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)
  const freq = useMemo(() => buildConceptFrequency(videos), [videos])
  const items = useMemo(() => Array.from(freq.values()).sort((a,b)=>b.count-a.count).slice(0,120), [freq])
  const filtered = useMemo(() => { const q=search.trim().toLowerCase(); return q ? items.filter(i=>i.label.toLowerCase().includes(q)) : items }, [items,search])
  const circles = useMemo(() => packCircles(filtered), [filtered])

  if (items.length === 0) return <p className="text-slate-400">No concepts available.</p>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <input type="text" placeholder="Search concepts..." value={search} onChange={(e)=>setSearch(e.target.value)}
          className="border border-slate-200 rounded-[12px] bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-slate-400 text-sm flex-1 min-w-[160px]" />
        <span className="text-slate-400 text-sm">{filtered.length} of {items.length} concepts</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[18px] bg-slate-50 border border-slate-200" role="img" aria-label="Concept cluster">
        {circles.map((c) => {
          const active = selectedConcept === c.label; const hov = hovered === c.label
          const fontSize = Math.max(9, Math.min(c.r * 0.5, 20))
          return (
            <g key={c.label} transform={`translate(${c.x},${c.y})`} onClick={()=>onSelectConcept(active?null:c.label)}
              onMouseEnter={()=>setHovered(c.label)} onMouseLeave={()=>setHovered(null)} style={{cursor:'pointer'}}>
              <circle r={c.r} fill={active?'#111':'#e2e8f0'} stroke={active?'none':'#cbd5e1'} strokeWidth="1.5"
                style={{filter: hov ? 'brightness(0.9)' : undefined}} />
              <text textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fill={active?'#fff':'#334155'} fontWeight="600">
                {c.label.length>18&&c.r<40?`${c.label.slice(0,16)}…`:c.label}
              </text>
              {hov && <text textAnchor="middle" y={c.r+14} fontSize={11} fill="#64748b">{c.count} video{c.count===1?'':'s'}</text>}
            </g>
          )
        })}
      </svg>

      <p className="text-slate-400 text-sm">Bubble size reflects how many videos reference each concept. Click a bubble to filter.</p>
    </div>
  )
}
