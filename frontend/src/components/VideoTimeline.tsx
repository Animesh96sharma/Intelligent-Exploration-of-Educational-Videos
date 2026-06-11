import type { ChapterRecord } from "../types/video";

type VideoTimelineProps = {
  chapters: ChapterRecord[];
  activeChapterId: string | null;
  selectedChapterId: string | null;
  currentTime: number;
  duration: number;
  onSelectChapter: (chapter: ChapterRecord) => void;
};

function formatRange(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function VideoTimeline({
  chapters,
  activeChapterId,
  selectedChapterId,
  onSelectChapter,
}: VideoTimelineProps) {
  return (
    <section className="timeline-panel timeline-panel--compact">
      <div className="timeline-panel__header">
        <h3>Chapters</h3>
      </div>

      <div className="timeline-chapters timeline-chapters--horizontal">
        {chapters.map((chapter) => {
          const isSelected = chapter.id === selectedChapterId;
          const isActive = chapter.id === activeChapterId;

          return (
            <button
              key={chapter.id}
              type="button"
              className={[
                "timeline-chapter-card",
                isSelected ? "selected" : "",
                isActive ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectChapter(chapter)}
            >
              <span className="timeline-chapter-card__index">
                Chapter {chapter.index}
              </span>
              <span className="timeline-chapter-card__time">
                {formatRange(chapter.startTime)} - {formatRange(chapter.endTime)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}