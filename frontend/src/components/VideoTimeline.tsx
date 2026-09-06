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
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

export default function VideoTimeline({
  chapters,
  activeChapterId,
  selectedChapterId,
  bookmarks = [],
  notes = [],
  onSelectChapter,
  onAddBookmark,
  onJumpToTime,
}: VideoTimelineProps) {
  return (
    <section className="grid gap-4 p-4 sm:p-[18px] border border-[var(--border)] rounded-[22px] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex justify-between items-center gap-3">
        <h3 className="m-0 text-[1.05rem] font-semibold tracking-[-0.02em]">Chapters</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {chapters.map((chapter) => {
          const isSelected = chapter.id === selectedChapterId
          const isActive = chapter.id === activeChapterId
          const chapterBookmarks = bookmarks.filter((bookmark) => bookmark.chapterId === chapter.id)
          const chapterNotes = notes.filter((note) => note.chapterId === chapter.id)

          return (
            <article
              key={chapter.id}
              className={`flex-shrink-0 min-w-[150px] grid gap-1.5 text-left p-3 rounded-2xl border transition-transform duration-200 hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-[rgba(0,0,0,0.18)] bg-[var(--surface)]'
                  : isActive
                    ? 'border-[rgba(59,130,246,0.45)] bg-[rgba(59,130,246,0.1)]'
                    : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[rgba(59,130,246,0.3)]'
              }`}
            >
              <button
                type="button"
                className="border-none bg-transparent p-0 flex flex-col gap-1.5 text-left cursor-pointer"
                onClick={() => onSelectChapter(chapter)}
              >
                <span className="text-[0.86rem] font-bold text-[var(--text)]">Chapter {chapter.index}</span>
                <strong className="text-[0.86rem] leading-[1.35] text-[var(--text)]">{chapter.title}</strong>
                <span className="text-[0.84rem] text-[var(--text-faint)] whitespace-nowrap">
                  {formatRange(chapter.startTime)} - {formatRange(chapter.endTime)}
                </span>
              </button>

              <div className="flex items-center justify-between gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.76rem] font-bold bg-[#fef3c7] text-[#92400e]">
                    {chapterBookmarks.length} bookmarks
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.76rem] font-bold bg-[#dbeafe] text-[#1d4ed8]">
                    {chapterNotes.length} notes
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 flex-wrap">
                <button
                  type="button"
                  className="min-h-0 px-3 py-2 text-[0.82rem] border border-black bg-white text-black rounded-[14px] font-semibold shadow-[var(--shadow-sm)] hover:bg-[#f8f8f8]"
                  onClick={() => onAddBookmark?.(chapter)}
                >
                  Save bookmark
                </button>
                <button
                  type="button"
                  className="min-h-0 px-3 py-2 text-[0.82rem] border border-black bg-white text-black rounded-[14px] font-semibold shadow-[var(--shadow-sm)] hover:bg-[#f8f8f8]"
                  onClick={() => onJumpToTime?.(chapter.startTime)}
                >
                  Jump
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
