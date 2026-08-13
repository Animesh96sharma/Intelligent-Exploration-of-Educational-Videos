import type { ChapterRecord } from '../types/video'
import type { VideoBookmark, VideoNote } from '../types/userState'

type VideoTimelineProps = {
  chapters: ChapterRecord[]
  activeChapterId: string | null
  selectedChapterId: string | null
  currentTime: number
  duration: number
  bookmarks?: VideoBookmark[]
  notes?: VideoNote[]
  onSelectChapter: (chapter: ChapterRecord) => void
  onAddBookmark?: (chapter: ChapterRecord) => void
  onJumpToTime?: (time: number) => void
}

function formatRange(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VideoTimeline({ chapters, activeChapterId, selectedChapterId, bookmarks = [], notes = [], onSelectChapter, onAddBookmark, onJumpToTime }: VideoTimelineProps) {
  return (
    <section className="grid gap-4 p-[18px] border border-slate-200 rounded-[22px] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className="flex justify-between items-center gap-3">
        <h3 className="m-0 text-[1.05rem] tracking-[-0.02em] inline-flex items-center gap-2.5">Chapters</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {chapters.map((chapter) => {
          const isSelected = chapter.id === selectedChapterId
          const isActive = chapter.id === activeChapterId
          const cBookmarks = bookmarks.filter((b) => b.chapterId === chapter.id)
          const cNotes = notes.filter((n) => n.chapterId === chapter.id)

          return (
            <article
              key={chapter.id}
              className={`flex-none min-w-[150px] flex flex-col gap-2.5 text-left p-3.5 rounded-[16px] border transition-[transform,border-color,background] duration-[180ms] ${
                isSelected || isActive
                  ? 'border-blue-400/45 bg-blue-500/10'
                  : 'border-slate-200 bg-slate-50 hover:translate-y-[-1px] hover:border-blue-300/30'
              }`}
            >
              <button type="button" className="border-none bg-transparent p-0 flex flex-col gap-1.5 text-left" onClick={() => onSelectChapter(chapter)}>
                <span className="text-[0.86rem] font-bold text-slate-900">Chapter {chapter.index}</span>
                <strong className="text-[0.94rem] text-slate-900 leading-snug">{chapter.title}</strong>
                <span className="text-[0.84rem] text-slate-400 whitespace-nowrap">{formatRange(chapter.startTime)} - {formatRange(chapter.endTime)}</span>
              </button>

              <div className="flex items-center justify-between gap-2.5 flex-wrap">
                <div className="flex items-center justify-between gap-2.5 flex-wrap">
                  <span className="inline-flex items-center px-[9px] py-[5px] rounded-full text-[0.76rem] font-bold bg-amber-100 text-amber-800">{cBookmarks.length} bookmarks</span>
                  <span className="inline-flex items-center px-[9px] py-[5px] rounded-full text-[0.76rem] font-bold bg-blue-100 text-blue-800">{cNotes.length} notes</span>
                </div>
                <div className="flex items-center justify-between gap-2.5 flex-wrap">
                  <button type="button" className="border border-black rounded-[14px] bg-white text-black px-3 py-2 text-[0.82rem] font-semibold hover:bg-[#f8f8f8]" onClick={() => onAddBookmark?.(chapter)}>Save bookmark</button>
                  <button type="button" className="border border-black rounded-[14px] bg-white text-black px-3 py-2 text-[0.82rem] font-semibold hover:bg-[#f8f8f8]" onClick={() => onJumpToTime?.(chapter.startTime)}>Jump</button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
