import { useEffect, useRef } from 'react'

type InVideoPanelTab = 'chapters' | 'transcript' | 'summary'

type ChapterItem = { id: string; title: string; startTime: number; endTime: number }
type TranscriptItem = { id: string; text: string; startTime: number; endTime?: number }

type InVideoPanelProps = {
  open: boolean
  tab: InVideoPanelTab
  onChangeTab: (tab: InVideoPanelTab) => void
  chapters: ChapterItem[]
  transcript: TranscriptItem[]
  currentTime: number
  activeChapterIndex: number
  onSelectChapter: (chapter: ChapterItem, index: number) => void
  onSelectTranscriptSegment: (segment: TranscriptItem) => void
  summaryContent: string
  summaryLevel: 'short' | 'medium' | 'long'
  onSummaryLevelChange?: (level: 'short' | 'medium' | 'long') => void
  isFullscreen: boolean
}

const SUMMARY_LEVELS: Array<'short' | 'medium' | 'long'> = ['short', 'medium', 'long']

function formatTimeLabel(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function isTranscriptActive(segment: TranscriptItem, currentTime: number, nextSegment?: TranscriptItem) {
  const start = segment.startTime ?? 0
  const end = segment.endTime ?? nextSegment?.startTime ?? Number.POSITIVE_INFINITY
  return currentTime >= start && currentTime < end
}

export default function InVideoPanel({
  open,
  tab,
  onChangeTab,
  chapters,
  transcript,
  currentTime,
  activeChapterIndex,
  onSelectChapter,
  onSelectTranscriptSegment,
  summaryContent,
  summaryLevel,
  onSummaryLevelChange,
  isFullscreen,
}: InVideoPanelProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map())

  const activeTranscriptId = (() => {
    for (let i = 0; i < transcript.length; i += 1) {
      const segment = transcript[i]
      const next = transcript[i + 1]
      if (isTranscriptActive(segment, currentTime, next)) return segment.id
    }
    return null
  })()

  const activeChapterId = chapters[activeChapterIndex]?.id ?? null

  useEffect(() => {
    if (!open) return
    const activeId = tab === 'chapters' ? activeChapterId : tab === 'transcript' ? activeTranscriptId : null
    if (!activeId) return
    const el = itemRefs.current.get(activeId)
    const container = bodyRef.current
    if (!el || !container) return

    const elTop = el.offsetTop
    const elBottom = elTop + el.offsetHeight
    const viewTop = container.scrollTop
    const viewBottom = viewTop + container.clientHeight

    if (elTop < viewTop || elBottom > viewBottom) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [open, tab, activeChapterId, activeTranscriptId])

  if (!open) return null

  return (
    <aside
      aria-label="Video side panel"
      className="bg-[rgba(7,10,18,0.96)] text-white border-t sm:border-t-0 sm:border-l border-white/[0.12] flex flex-col items-stretch w-full sm:w-[min(480px,38vw)] flex-shrink-0 min-h-0 h-[45vh] sm:h-full max-h-[70vh] sm:max-h-full overflow-hidden"
    >
      <div className="flex p-2.5 gap-2 border-b border-white/10 flex-shrink-0">
        <button
          type="button"
          className={`border-none rounded-[10px] px-2.5 py-2 text-sm ${tab === 'chapters' ? 'bg-white/20' : 'bg-white/[0.08]'} text-white`}
          onClick={() => onChangeTab('chapters')}
        >
          Chapters
        </button>
        <button
          type="button"
          className={`border-none rounded-[10px] px-2.5 py-2 text-sm ${tab === 'transcript' ? 'bg-white/20' : 'bg-white/[0.08]'} text-white`}
          onClick={() => onChangeTab('transcript')}
        >
          Transcript
        </button>
        <button
          type="button"
          className={`border-none rounded-[10px] px-2.5 py-2 text-sm ${tab === 'summary' ? 'bg-white/20' : 'bg-white/[0.08]'} text-white`}
          onClick={() => onChangeTab('summary')}
        >
          Summary
        </button>
      </div>

      <div ref={bodyRef} className="overflow-y-auto p-2.5 flex-1 min-h-0">
        {tab === 'chapters' ? (
          chapters.length > 0 ? (
            <div className="flex flex-col gap-2">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  ref={(el) => {
                    itemRefs.current.set(chapter.id, el)
                  }}
                  type="button"
                  className={`flex justify-between gap-3 text-left border-none rounded-xl px-3 py-2.5 ${
                    index === activeChapterIndex ? 'bg-white/[0.16]' : 'bg-white/[0.06]'
                  } text-white`}
                  onClick={() => onSelectChapter(chapter, index)}
                >
                  <span>{chapter.title}</span>
                  <strong>{formatTimeLabel(chapter.startTime)}</strong>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-white/70 text-sm">No chapters available.</p>
          )
        ) : null}

        {tab === 'transcript' ? (
          transcript.length > 0 ? (
            <div className="flex flex-col gap-2">
              {transcript.map((item) => (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current.set(item.id, el)
                  }}
                  type="button"
                  className={`flex justify-between gap-3 text-left border-none rounded-xl px-3 py-2.5 ${
                    item.id === activeTranscriptId ? 'bg-white/[0.16]' : 'bg-white/[0.06]'
                  } text-white`}
                  onClick={() => onSelectTranscriptSegment(item)}
                >
                  <span>{item.text}</span>
                  <strong>{formatTimeLabel(item.startTime)}</strong>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-white/70 text-sm">No transcript available.</p>
          )
        ) : null}

        {tab === 'summary' ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center gap-3">
              <div className="inline-flex items-center gap-1.5 p-1 border-none rounded-full bg-black" role="tablist" aria-label="Summary detail level">
                {SUMMARY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`border rounded-full px-3.5 py-1 font-semibold capitalize text-sm ${
                      summaryLevel === level ? 'bg-white/20 text-white border-white/40' : 'border-white/[0.18] bg-[rgba(26,25,25,0.639)] text-white'
                    }`}
                    onClick={() => onSummaryLevelChange?.(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-white/85 text-sm leading-relaxed">{summaryContent}</p>
          </div>
        ) : null}
      </div>
    </aside>
  )
}