import { useEffect, useMemo, useState } from "react";
import type {
  ChapterRecord,
  SummaryDetailLevel,
  VideoRecord,
} from "../types/video";
import VideoPlayer from "./VideoPlayer";
import VideoTimeline from "./VideoTimeline";

type VideoExplorerProps = {
  video: VideoRecord;
  allVideos: VideoRecord[];
  onSelectVideo: (videoId: string) => void;
  onToggleCompareVideo: (videoId: string) => void;
  onSelectConcept: (concept: string) => void;
  selectedConcept: string | null;
  onOpenComparison: (videoId?: string) => void;
  onBrowseMoreVideos: () => void;
};

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function ensureChapterArray(value: unknown): ChapterRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ChapterRecord =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "title" in item &&
      "startTime" in item &&
      "endTime" in item,
  );
}

function getBestChapterSummary(
  chapter: ChapterRecord | null,
  level: SummaryDetailLevel,
): string {
  if (!chapter) return "No chapter summary available.";

  if (level === "long") {
    return (
      chapter.summaryLong ||
      chapter.summaryMedium ||
      chapter.summaryShort ||
      "No chapter summary available."
    );
  }

  if (level === "medium") {
    return (
      chapter.summaryMedium ||
      chapter.summaryShort ||
      "No chapter summary available."
    );
  }

  return chapter.summaryShort || "No chapter summary available.";
}

function getBestVideoSummary(
  video: VideoRecord,
  level: SummaryDetailLevel,
): string {
  if (level === "long") {
    return (
      video.summaryLong ||
      video.summaryMedium ||
      video.summaryShort ||
      "No video summary available."
    );
  }

  if (level === "medium") {
    return (
      video.summaryMedium ||
      video.summaryShort ||
      "No video summary available."
    );
  }

  return video.summaryShort || "No video summary available.";
}

function getActiveChapter(
  chapters: ChapterRecord[],
  currentTime: number,
): ChapterRecord | null {
  if (chapters.length === 0) return null;

  return (
    chapters.find((chapter) => {
      const start = chapter.startTime ?? 0;
      const end = chapter.endTime ?? 0;
      return currentTime >= start && currentTime <= end;
    }) ||
    chapters[chapters.length - 1] ||
    null
  );
}

function formatDurationMinutes(seconds: number | undefined): string {
  const safeSeconds = Number.isFinite(seconds)
    ? Math.max(0, Number(seconds))
    : 0;
  return `${Math.round(safeSeconds / 60)} min`;
}

function getVideoSource(video: VideoRecord): string {
  return (
    (video as VideoRecord & {
      videoSrc?: string;
      videoUrl?: string;
      previewUrl?: string;
      src?: string;
    }).videoSrc ||
    (video as VideoRecord & {
      videoSrc?: string;
      videoUrl?: string;
      previewUrl?: string;
      src?: string;
    }).videoUrl ||
    (video as VideoRecord & {
      videoSrc?: string;
      videoUrl?: string;
      previewUrl?: string;
      src?: string;
    }).previewUrl ||
    (video as VideoRecord & {
      videoSrc?: string;
      videoUrl?: string;
      previewUrl?: string;
      src?: string;
    }).src ||
    ""
  );
}

export default function VideoExplorer({
  video,
  allVideos,
  onSelectVideo,
  onToggleCompareVideo,
  onSelectConcept,
  selectedConcept,
  onOpenComparison,
  onBrowseMoreVideos,
}: VideoExplorerProps) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [summaryLevel, setSummaryLevel] =
    useState<SummaryDetailLevel>("medium");
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const chapters = useMemo(
    () => ensureChapterArray(video?.chapters),
    [video?.chapters],
  );

  const videoConcepts = useMemo(
    () => ensureStringArray(video?.keyConcepts),
    [video?.keyConcepts],
  );

  const safeAllVideos = useMemo(
    () => (Array.isArray(allVideos) ? allVideos.filter(Boolean) : []),
    [allVideos],
  );

  useEffect(() => {
    setSelectedChapterIndex(0);
    setCurrentTime(0);
    setDetailsExpanded(true);
  }, [video?.id]);

  useEffect(() => {
    if (chapters.length === 0) {
      if (selectedChapterIndex !== 0) setSelectedChapterIndex(0);
      return;
    }

    if (selectedChapterIndex < 0 || selectedChapterIndex >= chapters.length) {
      setSelectedChapterIndex(0);
    }
  }, [chapters, selectedChapterIndex]);

  const selectedChapter = useMemo(() => {
    if (chapters.length === 0) return null;
    return chapters[selectedChapterIndex] ?? chapters[0] ?? null;
  }, [chapters, selectedChapterIndex]);

  const selectedChapterConcepts = useMemo(
    () => ensureStringArray(selectedChapter?.keyConcepts),
    [selectedChapter],
  );

  const selectedChapterObjectives = useMemo(
    () => ensureStringArray(selectedChapter?.learningObjectives),
    [selectedChapter],
  );

  const activePlaybackChapter = useMemo(
    () => getActiveChapter(chapters, currentTime),
    [chapters, currentTime],
  );

  const relatedVideos = useMemo(() => {
    const currentConcepts = new Set(
      videoConcepts.map((item) => item.toLowerCase()),
    );

    return safeAllVideos
      .filter((candidate) => candidate && candidate.id !== video.id)
      .map((candidate) => {
        const candidateConcepts = ensureStringArray(candidate.keyConcepts);
        const overlap = candidateConcepts.filter((concept) =>
          currentConcepts.has(concept.toLowerCase()),
        );

        return {
          video: candidate,
          overlap,
          score: overlap.length,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [safeAllVideos, video.id, videoConcepts]);

 const moreVideos = useMemo(() => {
  const candidates = safeAllVideos.filter((item) => item.id !== video.id);
  return shuffleArray(candidates).slice(0, 4);
}, [safeAllVideos, video.id]);

  function handleSelectChapter(index: number) {
    if (index < 0 || index >= chapters.length) return;

    setSelectedChapterIndex(index);

    const nextChapter = chapters[index];
    if (nextChapter) {
      setCurrentTime(nextChapter.startTime ?? 0);
    }
  }

  if (!video) {
    return <div className="video-explorer">No video data available.</div>;
  }

  return (
    <section className="video-explorer">
      <div className="video-explorerlayout">
        <div className="video-explorermain">
          <section className="video-title-card video-title-card--top">
            <div className="video-title-card__top">
              <div className="video-title-card__heading">
                <h2>{video.title ?? "Untitled video"}</h2>
              </div>

              <VideoPlayer
            videoId={video.id}
            src={getVideoSource(video)}
            title={video.title ?? "Untitled video"}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
          />
            </div>
          </section>

          {chapters.length > 0 && selectedChapter ? (
            <>
              <VideoTimeline
                chapters={chapters}
                activeChapterId={activePlaybackChapter?.id ?? null}
                selectedChapterId={selectedChapter?.id ?? null}
                currentTime={currentTime}
                duration={video.duration ?? 0}
                onSelectChapter={(chapter) => {
                  const chapterIndex = chapters.findIndex(
                    (item) => item.id === chapter.id,
                  );
                  if (chapterIndex >= 0) {
                    handleSelectChapter(chapterIndex);
                  }
                }}
              />

              <article className="chapter-panel">
                <div className="chapter-panel__header">
                  <div>
                    <h3>
                      {selectedChapter.index ?? selectedChapterIndex + 1}.{" "}
                      {selectedChapter.title ?? "Untitled chapter"}
                    </h3>
                    <p>{getBestChapterSummary(selectedChapter, summaryLevel)}</p>
                  </div>
                </div>
              </article>
            </>
          ) : (
            <article className="chapter-panel">
              <div className="chapter-panel__header">
                <div>
                  <p className="eyebrow">Selected chapter</p>
                  <h3>No chapter data available</h3>
                </div>
              </div>
              <p>This video does not currently have usable chapter information.</p>
            </article>
          )}

          <section className="video-details-collapsible">
  <button
    type="button"
    className="video-details-collapsible__toggle"
    onClick={() => setDetailsExpanded((current) => !current)}
    aria-expanded={detailsExpanded}
  >
    <span>Click here for more details</span>
    <span>{detailsExpanded ? "Hide" : "Show"}</span>
  </button>

  {detailsExpanded ? (
    <div className="video-details-collapsible__content">
      <section className="sidebar-card">


        <div className="info-block">

          <div className="chip-group">
            <span className="chip static">
              {video.domain ?? "Educational video"}
            </span>
            <span className="chip static">
              {video.speaker ?? "Unknown speaker"}
            </span>
            <span className="chip static">
              {video.totalChapters ?? chapters.length} chapters
            </span>
            <span className="chip static">
              {formatDurationMinutes(video.duration)}
            </span>
            {video.difficultyLevel ? (
              <span className="chip static">{video.difficultyLevel}</span>
            ) : null}
          </div>
        </div>

        {selectedChapterObjectives.length > 0 ? (
          <div className="info-block">
            <h4>Learning objectives</h4>
            <ul className="clean-list">
              {selectedChapterObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {selectedChapterConcepts.length > 0 ? (
          <div className="info-block">
            <h4>Important chapter concepts</h4>
            <div className="chip-group">
              {selectedChapterConcepts.map((concept) => (
                <button
                  key={concept}
                  type="button"
                  className={`chip ${selectedConcept === concept ? "active" : ""}`}
                  onClick={() => onSelectConcept(concept)}
                >
                  {concept}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="info-block">
          <h4>Important concepts</h4>
          <div className="chip-group">
            {videoConcepts.length === 0 ? (
              <p>No concepts available.</p>
            ) : (
              videoConcepts.map((concept) => (
                <button
                  key={concept}
                  type="button"
                  className={`chip ${selectedConcept === concept ? "active" : ""}`}
                  onClick={() => onSelectConcept(concept)}
                >
                  {concept}
                </button>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  ) : null}
</section>
        </div>

        <aside className="video-explorer__sidebar">
          <section className="sidebar-card">
            <div className="results-head">
              <h3>Video Summary</h3>
              <div
                className="summary-toggle"
                role="tablist"
                aria-label="Summary detail"
              >
                {(["short", "medium", "long"] as SummaryDetailLevel[]).map(
                  (level) => (
                    <button
                      key={level}
                      type="button"
                      className={summaryLevel === level ? "active" : ""}
                      onClick={() => setSummaryLevel(level)}
                    >
                      {level}
                    </button>
                  ),

                  



                )}
              </div>
            </div>
            <p>{getBestVideoSummary(video, summaryLevel)}</p>

              <div className="video-title-card__actions hero-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => onToggleCompareVideo(video.id)}
                >
                  Add to compare
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => onOpenComparison(video.id)}
                >
                  Open comparison
                </button>
              </div>

          </section>

          <section className="sidebar-card">
            <h3>Related videos</h3>
            {relatedVideos.length === 0 ? (
              <p>No related videos found yet.</p>
            ) : (
              <div className="related-list">
                {relatedVideos.map(({ video: related, overlap }) => (
                  <article
                    key={related.id}
                    className="related-card related-card--actions"
                  >
                    <div>
                      <strong>{related.title}</strong>
                      <span>{related.domain ?? "General"}</span>
                      <small>
                        {overlap.length > 0
                          ? overlap.slice(0, 4).join(", ")
                          : "No shared concepts"}
                      </small>
                    </div>

                    <div className="related-cardactions">
                      <button
                        className="secondary-btn"
                        onClick={() => onToggleCompareVideo(related.id)}
                      >
                        Compare
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="sidebar-card">
  <div className="results-head">
    <h3>More videos</h3>
    <span>{moreVideos.length} shown</span>
  </div>

  {moreVideos.length === 0 ? (
    <p>No additional videos are available.</p>
  ) : (
    <>
      <div className="more-videos-list">
        {moreVideos.map((item) => (
          <article key={item.id} className="more-video-card">
            <button
              type="button"
              className="more-video-card__preview"
              onClick={() => onSelectVideo(item.id)}
            >
              {getVideoSource(item) ? (
                <video
                  className="more-video-card__player"
                  src={getVideoSource(item)}
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                <div className="more-video-card__fallback">
                  No preview available
                </div>
              )}
            </button>

            <div className="more-video-card__body">
              <strong>{item.title ?? "Untitled video"}</strong>
              <span>
                {item.domain ?? "General"} · {formatDurationMinutes(item.duration)}
              </span>
            </div>

          </article>
        ))}
      </div>

      <button
        type="button"
        className="secondary-btn more-videos-browse-btn"
        onClick={onBrowseMoreVideos}
      >
        Browse more videos
      </button>
    </>
  )}
</section>
        </aside>
      </div>
    </section>
  );
}