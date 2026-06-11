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
    <section className="timeline-panel timeline-panel--compact">
      <div className="timeline-panel-header">
        <h3>Chapters</h3>
      </div>

      <div className="timeline-chapters timeline-chapters--horizontal">
        {chapters.map((chapter) => {
          const isSelected = chapter.id === selectedChapterId
          const isActive = chapter.id === activeChapterId
          const chapterBookmarks = bookmarks.filter((bookmark) => bookmark.chapterId === chapter.id)
          const chapterNotes = notes.filter((note) => note.chapterId === chapter.id)

          return (
            <article
              key={chapter.id}
              className={['timeline-chapter-card', isSelected ? 'selected' : '', isActive ? 'active' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <button type="button" className="timeline-chapter-card-main" onClick={() => onSelectChapter(chapter)}>
                <span className="timeline-chapter-card-index">Chapter {chapter.index}</span>
                <strong>{chapter.title}</strong>
                <span className="timeline-chapter-card-time">
                  {formatRange(chapter.startTime)} - {formatRange(chapter.endTime)}
                </span>
              </button>

              <div className="timeline-chapter-card-meta">
                <div className="timeline-marker-row">
                  <span className="timeline-marker badge-bookmark">{chapterBookmarks.length} bookmarks</span>
                  <span className="timeline-marker badge-note">{chapterNotes.length} notes</span>
                </div>

                <div className="timeline-chapter-card-actions">
                  <button type="button" className="secondary-btn small" onClick={() => onAddBookmark?.(chapter)}>
                    Save bookmark
                  </button>
                  <button type="button" className="secondary-btn small" onClick={() => onJumpToTime?.(chapter.startTime)}>
                    Jump
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}