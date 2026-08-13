import type { ChapterRecord, TranscriptSegment } from '../types/video'

type InVideoPanelTab = 'chapters' | 'transcript'

type InVideoPanelProps = {
  open: boolean
  tab: InVideoPanelTab
  onChangeTab: (tab: InVideoPanelTab) => void
  onClose: () => void
  chapters: ChapterRecord[]
  transcript: TranscriptSegment[]
  currentTime: number
  activeChapterId: string | null
  onSelectChapter: (chapter: ChapterRecord) => void
  onSelectTranscriptSegment: (segment: TranscriptSegment) => void
}

function fmt(s: number) {
  const safe = Math.max(0, Math.floor(s || 0))
  const h = Math.floor(safe / 3600); const m = Math.floor((safe % 3600) / 60); const sec = safe % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

function isTranscriptActive(seg: TranscriptSegment, t: number, next?: TranscriptSegment) {
  const start = seg.startTime ?? 0; const end = seg.endTime ?? next?.startTime ?? Infinity
  return t >= start && t < end
}

export default function InVideoPanel({ open, tab, onChangeTab, onClose, chapters, transcript, currentTime, activeChapterId, onSelectChapter, onSelectTranscriptSegment }: InVideoPanelProps) {
  if (!open) return null

  return (
    <aside
      className="w-[min(480px,38vw)] max-[900px]:w-full max-[900px]:h-[min(42vh,320px)] h-full bg-[rgba(7,10,18,0.96)] text-white border-l border-white/12 max-[900px]:border-l-0 max-[900px]:border-t flex flex-col items-center"
      aria-label="In this video panel"
    >
      {/* Head */}
      <div className="w-full flex items-start justify-between gap-3 px-3.5 pt-4 pb-2">
        <div>
          <p className="m-0 text-[0.75rem] font-extrabold tracking-[0.12em] uppercase text-white">In this video</p>
          <h3 className="m-0 text-[1.05rem] tracking-[-0.02em] text-white">{tab === 'chapters' ? 'Chapters' : 'Transcript'}</h3>
        </div>
        <button type="button" className="border-none bg-white/8 text-white rounded-[10px] p-2 text-xl leading-none hover:bg-white/16" onClick={onClose} aria-label="Close">×</button>
      </div>

      {/* Tabs */}
      <div className="flex p-2.5 gap-2 border-b border-white/10 w-full" role="tablist">
        {(['chapters','transcript'] as InVideoPanelTab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t}
            className={`border-none rounded-[10px] px-2.5 py-2 text-white capitalize ${ tab === t ? 'bg-white/20' : 'bg-white/8' }`}
            onClick={() => onChangeTab(t)}>{t}</button>
        ))}
      </div>

      {/* Body */}
      <div className="overflow-auto p-2.5 w-full flex-1">
        {tab === 'chapters' ? (
          chapters.length === 0 ? <p className="text-white/60 text-sm px-2">No chapters available.</p> : (
            <div className="flex flex-col gap-2">
              {chapters.map((ch) => (
                <button key={ch.id} type="button"
                  className={`flex justify-between gap-3 text-left border-none px-3 py-2.5 rounded-[12px] text-white ${ activeChapterId === ch.id ? 'bg-white/16' : 'bg-white/6 hover:bg-white/10' }`}
                  onClick={() => onSelectChapter(ch)}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[0.72rem] text-white/60">{fmt(ch.startTime)}</span>
                    <strong className="text-sm">{ch.index}. {ch.title}</strong>
                    {ch.summaryShort && <p className="m-0 text-[0.78rem] text-white/70 leading-snug">{ch.summaryShort}</p>}
                  </div>
                  <span className="text-[0.72rem] text-white/50 shrink-0">{fmt(Math.max(0, ch.endTime - ch.startTime))}</span>
                </button>
              ))}
            </div>
          )
        ) : transcript.length === 0 ? <p className="text-white/60 text-sm px-2">No transcript available.</p> : (
          <div className="flex flex-col gap-2">
            {transcript.map((seg, i) => {
              const active = isTranscriptActive(seg, currentTime, transcript[i + 1])
              return (
                <button key={seg.id} type="button"
                  className={`flex gap-3 text-left border-none px-3 py-2.5 rounded-[12px] text-white ${ active ? 'bg-white/16' : 'bg-white/6 hover:bg-white/10' }`}
                  onClick={() => onSelectTranscriptSegment(seg)}>
                  <span className="text-[0.72rem] text-white/60 shrink-0 pt-0.5">{fmt(seg.startTime)}</span>
                  <p className="m-0 text-sm text-white/90 leading-relaxed">{seg.text}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
