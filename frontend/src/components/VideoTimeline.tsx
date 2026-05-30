// src/components/VideoTimeline.tsx

import { useMemo, useState } from "react";
import type { ChapterRecord, SummaryDetailLevel } from "../types/video";

type VideoTimelineProps = {
  chapters: ChapterRecord[];
  activeChapterId: string | null;
  selectedChapterId: string | null;
  currentTime: number;
  duration: number;
  summaryLevel?: SummaryDetailLevel;
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
  currentTime,
  duration,
  summaryLevel = "medium",
  onSelectChapter,
}: VideoTimelineProps) {
  const [previewChapterId, setPreviewChapterId] = useState<string | null>(null);

  const previewChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === previewChapterId) ?? null,
    [chapters, previewChapterId]
  );

  function getPreviewSummary(chapter: ChapterRecord) {
    if (summaryLevel === "long") {
      return chapter.summaryLong || chapter.summaryMedium || chapter.summaryShort;
    }

    if (summaryLevel === "medium") {
      return chapter.summaryMedium || chapter.summaryShort;
    }

    return chapter.summaryShort;
  }

  function closePreview() {
    setPreviewChapterId(null);
  }

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
          const isPreviewed = chapter.id === previewChapterId;
          const tooltipId = `timeline-preview-${chapter.id}`;

          return (
            <button
              key={chapter.id}
              type="button"
              className={[
                "timeline-chapter",
                isSelected ? "selected" : "",
                isActive ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ width: `${Math.max(width, 8)}%` }}
              onClick={() => onSelectChapter(chapter)}
              onMouseEnter={() => setPreviewChapterId(chapter.id)}
              onMouseLeave={() => closePreview()}
              onFocus={() => setPreviewChapterId(chapter.id)}
              onBlur={() => closePreview()}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closePreview();
                }
              }}
              title={chapter.title}
              aria-describedby={isPreviewed ? tooltipId : undefined}
            >
              <span className="timeline-index">{chapter.index}</span>
              <span className="timeline-title">{chapter.title}</span>

              {isPreviewed && previewChapter && previewChapter.id === chapter.id && (
                <span
                  id={tooltipId}
                  role="tooltip"
                  className="timeline-preview"
                  onMouseEnter={() => setPreviewChapterId(chapter.id)}
                  onMouseLeave={() => closePreview()}
                >
                  <strong>{chapter.title}</strong>
                  <span className="timeline-preview__range">
                    {formatRange(chapter.startTime)} - {formatRange(chapter.endTime)}
                  </span>
                  <span className="timeline-preview__summary">
                    {getPreviewSummary(chapter)}
                  </span>
                  <span className="timeline-preview__duration">
                    {Math.round(chapter.durationSeconds / 60)} min
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}