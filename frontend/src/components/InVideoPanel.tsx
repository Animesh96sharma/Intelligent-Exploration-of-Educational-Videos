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

function formatTimeLabel(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function isTranscriptActive(
  segment: TranscriptSegment,
  currentTime: number,
  nextSegment?: TranscriptSegment,
) {
  const start = segment.startTime ?? 0
  const end = segment.endTime ?? nextSegment?.startTime ?? Number.POSITIVE_INFINITY
  return currentTime >= start && currentTime < end
}

export default function InVideoPanel({
  open,
  tab,
  onChangeTab,
  onClose,
  chapters,
  transcript,
  currentTime,
  activeChapterId,
  onSelectChapter,
  onSelectTranscriptSegment,
}: InVideoPanelProps) {
  if (!open) return null

  return (
    <aside className="in-video-panel" aria-label="In this video panel">
      <div className="in-video-panel__head">
        <div>
          <p className="eyebrow">In this video</p>
          <h3>{tab === 'chapters' ? 'Chapters' : 'Transcript'}</h3>
        </div>

        <button
          type="button"
          className="in-video-panel__close"
          onClick={onClose}
          aria-label="Close in-video panel"
        >
          ×
        </button>
      </div>

      <div
        className="in-video-panel__tabs"
        role="tablist"
        aria-label="Switch between chapters and transcript"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chapters'}
          className={tab === 'chapters' ? 'active' : ''}
          onClick={() => onChangeTab('chapters')}
        >
          Chapters
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'transcript'}
          className={tab === 'transcript' ? 'active' : ''}
          onClick={() => onChangeTab('transcript')}
        >
          Transcript
        </button>
      </div>

      <div className="in-video-panel__body">
        {tab === 'chapters' ? (
          chapters.length === 0 ? (
            <p className="in-video-panel__empty">No chapters available for this video.</p>
          ) : (
            <div className="in-video-panel__list">
              {chapters.map((chapter) => {
                const isActive = activeChapterId === chapter.id

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    className={`in-video-panel__item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectChapter(chapter)}
                  >
                    <div className="in-video-panel__item-meta">
                      <span className="in-video-panel__timestamp">
                        {formatTimeLabel(chapter.startTime)}
                      </span>
                      <span className="in-video-panel__duration">
                        {formatTimeLabel(Math.max(0, chapter.endTime - chapter.startTime))}
                      </span>
                    </div>

                    <div className="in-video-panel__item-copy">
                      <strong>{chapter.index}. {chapter.title}</strong>
                      {chapter.summaryShort ? <p>{chapter.summaryShort}</p> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        ) : transcript.length === 0 ? (
          <p className="in-video-panel__empty">No transcript available for this video.</p>
        ) : (
          <div className="in-video-panel__list">
            {transcript.map((segment, index) => {
              const isActive = isTranscriptActive(segment, currentTime, transcript[index + 1])

              return (
                <button
                  key={segment.id}
                  type="button"
                  className={`in-video-panel__item in-video-panel__item--transcript ${
                    isActive ? 'active' : ''
                  }`}
                  onClick={() => onSelectTranscriptSegment(segment)}
                >
                  <div className="in-video-panel__item-meta">
                    <span className="in-video-panel__timestamp">
                      {formatTimeLabel(segment.startTime)}
                    </span>
                  </div>

                  <div className="in-video-panel__item-copy">
                    <p>{segment.text}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}