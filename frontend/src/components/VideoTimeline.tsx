// src/components/VideoTimeline.tsx

import type { ChapterRecord } from "../types/video";

type VideoTimelineProps = {
  chapters: ChapterRecord[];
  activeChapterId: string | null;
  selectedChapterId: string | null;
  currentTime: number;
  duration: number;
  onSelectChapter: (chapter: ChapterRecord) => void;
};

export default function VideoTimeline({
  chapters,
  activeChapterId,
  selectedChapterId,
  currentTime,
  duration,
  onSelectChapter,
}: VideoTimelineProps) {
  return (
    <section className="timeline-panel">
      <div className="timeline-track" aria-hidden="true">
        <div
          className="timeline-progress"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      <div className="timeline-chapters">
        {chapters.map((chapter) => {
          const width = duration
            ? ((chapter.endTime - chapter.startTime) / duration) * 100
            : 0;

          const isSelected = chapter.id === selectedChapterId;
          const isActive = chapter.id === activeChapterId;

          return (
            <button
              key={chapter.id}
              className={[
                "timeline-chapter",
                isSelected ? "selected" : "",
                isActive ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ width: `${Math.max(width, 8)}%` }}
              onClick={() => onSelectChapter(chapter)}
              title={chapter.title}
            >
              <span className="timeline-index">{chapter.index}</span>
              <span className="timeline-title">{chapter.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}