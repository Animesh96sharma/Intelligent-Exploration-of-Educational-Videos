# Project Structure```
animesh
├──backend
│   └──app
│   │   ├──api
│   │   │   ├──chapters.py
│   │   │   ├──comparisons.py
│   │   │   ├──summaries.py
│   │   │   └──videos.py
│   │   ├──common
│   │   │   ├──ingestion
│   │   │   │   └──ingest_videos.py
│   │   │   ├──storage
│   │   │   │   └──file_manager.py
│   │   │   └──utils
│   │   │   │   ├──llm_client.py
│   │   │   │   └──logger.py
│   │   ├──subtask1_segmentation
│   │   │   ├──chapters
│   │   │   │   ├──tib_001_ml_intro.json
│   │   │   │   ├──tib_002_neural_networks.json
│   │   │   │   ├──tib_003_databases.json
│   │   │   │   ├──tib_004_computer_vision.json
│   │   │   │   ├──tib_005_nlp.json
│   │   │   │   └──tib_006_data_science.json
│   │   │   ├──Setup_Guides
│   │   │   │   ├──SETUP_GUIDE_ASR.md
│   │   │   │   ├──SETUP_GUIDE_CHAPTERING.md
│   │   │   │   └──SETUP_GUIDE_FRAME_CAPTIONING.md
│   │   │   ├──asr.py
│   │   │   ├──chaptering.py
│   │   │   ├──evaluation.py
│   │   │   ├──frame_captioning.py
│   │   │   └──run_pipeline.py
│   │   ├──subtask2_summarization
│   │   │   ├──chapter_level
│   │   │   │   └──summarize_chapters.py
│   │   │   ├──collection_level
│   │   │   │   └──analyze_collection.py
│   │   │   ├──embeddings
│   │   │   │   └──build_embeddings.py
│   │   │   ├──evaluation
│   │   │   │   └──summarization_metrics.py
│   │   │   ├──utils
│   │   │   │   ├──__init__.py
│   │   │   │   ├──chunking.py
│   │   │   │   └──error_handling.py
│   │   │   ├──video_level
│   │   │   │   └──summarize_video.py
│   │   │   └──__init__.py
│   │   ├──config.py
│   │   └──main.py
├──docs
│   ├──architecture_diagram.png
│   ├──design_document.md
│   └──evaluation_plan.md
├──frontend
│   ├──public
│   │   ├──eduvid_favicon.svg
│   │   ├──favicon.svg
│   │   └──icons.svg
│   ├──src
│   │   ├──assets
│   │   │   ├──hero.png
│   │   │   ├──react.svg
│   │   │   └──vite.svg
│   │   ├──components
│   │   │   ├──AboutPage.tsx
│   │   │   ├──CollectionAnalysis.tsx
│   │   │   ├──ComparisonView.tsx
│   │   │   ├──HomePage.tsx
│   │   │   ├──LandingPage.tsx
│   │   │   ├──Logo.tsx
│   │   │   ├──MetadataPage.tsx
│   │   │   ├──NetworkView.tsx
│   │   │   ├──VideoExplorer.tsx
│   │   │   ├──VideoPlayer.tsx
│   │   │   └──VideoTimeline.tsx
│   │   ├──types
│   │   │   └──video.ts
│   │   ├──App.css
│   │   ├──App.tsx
│   │   ├──index.css
│   │   └──main.tsx
│   ├──eslint.config.js
│   ├──index.html
│   ├──package-lock.json
│   ├──package.json
│   ├──tsconfig.app.json
│   ├──tsconfig.json
│   ├──tsconfig.node.json
│   └──vite.config.ts
├──notebooks
│   ├──evaluation_analysis.ipynb
│   ├──subtask1_experiments.ipynb
│   └──subtask2_experiments.ipynb
├──scripts
│   ├──debug_files.py
│   ├──run_full_pipeline.py
│   ├──run_subtask1.py
│   └──run_subtask2.py
├──tests
│   ├──__init__.py
│   └──test_subtask2.py
├──=0.2.0
├──pyrightconfig.json
├──README.md
├──requirements.txt
└──.gitignore
```


# SubTask 3 Details-Interactive Visualization Interface
  # Task Description: Design and implement an intuitive, interactive visualization system that presents segmentation and summarization results in a way that facilitates efficient video exploration and comparison.
    # Specific Requirements:
        1.) Video-Level Visualizations:
                    ● Timeline View:
                        ○ Interactive video timeline with chapter markers
                        ○ Chapter titles and durations
                        ○ Hover previews showing chapter summaries
                        ○ Clickable segments for direct navigation
                    ● Summary Display:
                        ○  Hierarchical summary presentation (overview → detailed)
                        ○ Key concept highlighting
                        ○ Visual content preview (screenshots, diagrams)
                        ○ Expandable/collapsible sections
                    ● Content Overview:
                        ○ Topic tag cloud or visualization
                        ○ Concept relationship graphs
                        ○ Learning objective display
                        ○ Video metadata and statistics
        2.) Collection-Level Visualizations:
                    ● Similarity and Comparison Views, e.g.
                        ○ Network graphs showing video relationships
                        ○ Matrix visualizations for pairwise comparisons
                        ○ Clustering visualizations by topic
                        ○ Timeline showing video release/creation dates
                    ● Commonality Visualization, e.g.
                        ○ Venn diagrams for shared topics
                        ○ Heat maps showing topic coverage
                        ○ Hierarchical clustering of common themes
                        ○ Interactive exploration of shared concepts
                    ● Difference Highlighting, e.g.
                        ○ Side-by-side comparison interface
                        ○ Synchronized timeline comparison
                        ○ Unique content markers
                        ○ Differential topic analysis
        3.) Interactive Features:
                    ● Navigation:
                        ○ Search within and across videos
                        ○ Jump to specific chapters or topics
                        ○ Filter by metadata (speaker, date, topic)
                        ○ Bookmark and create playlists
                    ● Exploration Support:
                        ○ Drill-down from overview to detail
                        ○ Linked views (select chapter → show summary)
                        ○ Brushing and linking across visualizations
                        ○ Export and share functionality
                    ● User Preferences:
                        ○ Adjustable summary detail level
                        ○ Customizable visualization layouts
                        ○ Save personal notes and annotations
                        ○ Progress tracking
        4.) Technical Implementation:
                    ● Frontend Architecture:
                        ○ Responsive web application
                        ○ Component-based design
                        ○ Real-time updates
                        ○ Mobile-friendly interface
                    ● Video Video Player Integration:
                        ○ Custom controls with chapter navigation
                        ○ Synchronized multi-video playback (for comparison)
                        ○ Speed control and subtitles
                        ○ Screenshot capture
        5.) Evaluation:
                    ● Usability Testing:
                        ○ Task completion rates
                        ○ Time-on-task measurements
                        ○ User satisfaction surveys
                        ○ Think-aloud protocols
                    ● Expert Review:
                        ○ Feedback from educators/students
                        ○ Assessment of pedagogical value
                        ○ Suggestions for improvement
    # Deliverables:
    ● Complete web-based visualization interface
    ● Multiple coordinated views for exploration
    ● Interactive comparison tools
    ● User manual and documentation
    ● Usability study report
    ● Demo video showcasing features


    Current files code for frontend tasks-

    1.) CollectionAnalysis.tsx-

    // src/components/CollectionAnalysis.tsx

import { useMemo } from "react";
import type { CollectionAnalysisRecord, VideoRecord } from "../types/video";

type CollectionAnalysisProps = {
  analysis: CollectionAnalysisRecord;
  videos: VideoRecord[];
  onOpenVideo: (videoId: string) => void;
  onToggleCompareVideo: (videoId: string) => void;
  onSelectConcept: (concept: string | null) => void;
  selectedConcept: string | null;
  onOpenComparison: (videoId?: string) => void;
};

function formatMinutes(seconds: number) {
  return `${Math.round(seconds / 60)} min`;
}

export default function CollectionAnalysis({
  analysis,
  videos,
  onOpenVideo,
  onToggleCompareVideo,
  onSelectConcept,
  selectedConcept,
  onOpenComparison,
}: CollectionAnalysisProps) {
  const visibleVideoIds = useMemo(() => {
    return new Set(videos.map((video) => video.id));
  }, [videos]);

  const totalDuration = useMemo(() => {
    return videos.reduce((sum, video) => sum + video.duration, 0);
  }, [videos]);

  const domains = useMemo(() => {
    return Array.from(
      new Set(videos.map((video) => video.domain).filter(Boolean))
    ) as string[];
  }, [videos]);

  const suggestedOrder = useMemo(() => {
    return (analysis.overview?.suggested_viewing_order ?? []).filter((item) =>
      visibleVideoIds.has(item.video_id)
    );
  }, [analysis, visibleVideoIds]);

  const commonConceptEntries = useMemo(() => {
    return Object.entries(analysis.commonConcepts)
      .map(([concept, videoIds]) => {
        const filteredIds = videoIds.filter((videoId) => visibleVideoIds.has(videoId));
        return [concept, filteredIds] as const;
      })
      .filter(([, videoIds]) => videoIds.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
  }, [analysis, visibleVideoIds]);

  const uniqueConceptEntries = useMemo(() => {
    return Object.entries(analysis.uniqueConcepts).filter(([videoId]) =>
      visibleVideoIds.has(videoId)
    );
  }, [analysis, visibleVideoIds]);

  const visibleCount = videos.length;
  const totalCollectionCount = analysis.totalVideos;

  if (videos.length === 0) {
    return (
      <section className="collection-page">
        <div className="collection-hero">
          <div>
            <p className="eyebrow">Collection intelligence</p>
            <h2>No videos match the current filters</h2>
            <p>
              Clear or adjust the active search, concept, and filter settings to
              explore collection-level analysis again.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="collection-page">
      <div className="collection-hero">
        <div>
          <p className="eyebrow">Collection intelligence</p>
          <h2>Cross-video themes, overlaps, and recommended learning paths</h2>
          <p>
            Explore the collection-level summary, shared concepts, unique topic
            coverage, and the suggested viewing order derived from the processed
            summarization outputs.
          </p>
          <p className="section-note">
            Showing analysis for {visibleCount} visible video
            {visibleCount === 1 ? "" : "s"} out of {totalCollectionCount}.
          </p>
        </div>

        {selectedConcept && (
          <button className="secondary-btn" onClick={() => onSelectConcept(null)}>
            Clear concept filter
          </button>
        )}
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Visible Videos</span>
          <strong>{visibleCount}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Total Duration</span>
          <strong>{formatMinutes(totalDuration)}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Shared Concepts</span>
          <strong>{commonConceptEntries.length}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Domains</span>
          <strong>{domains.length}</strong>
        </article>
      </div>

      <div className="collection-layout">
        <div className="collection-main">
          {analysis.overview && (
            <section className="panel">
              <h3>Overview</h3>

              {analysis.overview.collection_summary && (
                <p>{analysis.overview.collection_summary}</p>
              )}

              {analysis.overview.main_themes &&
                analysis.overview.main_themes.length > 0 && (
                  <>
                    <h4>Main themes</h4>
                    <div className="chip-group">
                      {analysis.overview.main_themes.map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          className={`chip ${selectedConcept === theme ? "active" : ""}`}
                          onClick={() => onSelectConcept(theme)}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </>
                )}

              {analysis.overview.difficulty_progression && (
                <>
                  <h4>Difficulty progression</h4>
                  <p>{analysis.overview.difficulty_progression}</p>
                </>
              )}

              {analysis.overview.target_audience && (
                <>
                  <h4>Target audience</h4>
                  <p>{analysis.overview.target_audience}</p>
                </>
              )}

              {analysis.overview.knowledge_gaps &&
                analysis.overview.knowledge_gaps.length > 0 && (
                  <>
                    <h4>Knowledge gaps</h4>
                    <ul className="clean-list">
                      {analysis.overview.knowledge_gaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </>
                )}
            </section>
          )}

          <section className="panel">
            <h3>Shared concepts</h3>

            {commonConceptEntries.length === 0 ? (
              <p>No shared concepts available for the currently visible videos.</p>
            ) : (
              <div className="concept-list">
                {commonConceptEntries.map(([concept, videoIds]) => (
                  <article key={concept} className="concept-card">
                    <div className="concept-card__head">
                      <div className="concept-card__title-block">
                        <button
                          type="button"
                          className={`chip concept-chip ${selectedConcept === concept ? "active" : ""}`}
                          onClick={() => onSelectConcept(concept)}
                        >
                          {concept}
                        </button>
                      </div>
                      <span>{videoIds.length} videos</span>
                    </div>

                    <div className="related-list">
                      {videoIds.map((videoId) => {
                        const video = videos.find((item) => item.id === videoId);
                        if (!video) return null;

                        return (
                          <div key={videoId} className="related-card related-card--actions">
                            <div>
                              <strong>{video.title}</strong>
                              <span>{video.domain ?? "General"}</span>
                            </div>

                            <div className="related-card__actions">
                              <button
                                className="secondary-btn"
                                onClick={() => onToggleCompareVideo(videoId)}
                              >
                                Compare
                              </button>
                              <button
                                className="primary-btn"
                                onClick={() => onOpenVideo(videoId)}
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {videoIds.length >= 2 && (
                      <button
                        className="secondary-btn"
                        onClick={() => onOpenComparison()}
                      >
                        Open comparison workspace
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <h3>Unique concepts by video</h3>

            {uniqueConceptEntries.length === 0 ? (
              <p>No unique concept breakdown is available for the current selection.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Video</th>
                      <th>Duration</th>
                      <th>Chapters</th>
                      <th>Difficulty</th>
                      <th>Unique concepts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueConceptEntries.map(([videoId, group]) => {
                      const video = videos.find((item) => item.id === videoId);
                      if (!video) return null;

                      return (
                        <tr key={videoId}>
                          <td>
                            <div className="table-video-actions">
                              <button
                                className="inline-link"
                                onClick={() => onOpenVideo(videoId)}
                              >
                                {group.video_title || video.title}
                              </button>
                              <button
                                className="secondary-btn"
                                onClick={() => onToggleCompareVideo(videoId)}
                              >
                                Compare
                              </button>
                            </div>
                          </td>
                          <td>{formatMinutes(video.duration)}</td>
                          <td>{video.chapters.length}</td>
                          <td>{video.difficultyLevel ?? "N/A"}</td>
                          <td>
                            <div className="chip-group compact">
                              {group.unique_concepts.slice(0, 6).map((concept) => (
                                <button
                                  key={concept}
                                  type="button"
                                  className={`chip ${selectedConcept === concept ? "active" : ""}`}
                                  onClick={() => onSelectConcept(concept)}
                                >
                                  {concept}
                                </button>
                              ))}
                              {group.unique_concepts.length > 6 && (
                                <span className="chip muted">
                                  +{group.unique_concepts.length - 6} more
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="collection-sidebar">
          <section className="panel">
            <h3>Suggested viewing order</h3>

            {suggestedOrder.length === 0 ? (
              <p>No recommended sequence is available for the current filtered set.</p>
            ) : (
              <ol className="ordered-list">
                {suggestedOrder.map((item, index) => {
                  const video = videos.find((v) => v.id === item.video_id);

                  return (
                    <li key={item.video_id} className="ordered-item">
                      <div>
                        <strong>
                          {index + 1}. {video?.title ?? item.video_id}
                        </strong>
                        <p>{item.reason}</p>
                      </div>

                      <button
                        className="secondary-btn"
                        onClick={() => onOpenVideo(item.video_id)}
                      >
                        Open
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="panel">
            <h3>Domains</h3>

            {domains.length === 0 ? (
              <p>No domains are visible with the current filters.</p>
            ) : (
              <div className="chip-group">
                {domains.map((domain) => (
                  <span key={domain} className="chip">
                    {domain}
                  </span>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}


2.) ComparisonView.tsx

// src/components/ComparisonView.tsx

import { useMemo } from "react";
import type { VideoRecord } from "../types/video";
import { buildVideoComparison } from "../lib/analytics";

type ComparisonViewProps = {
  videos: VideoRecord[];
  allVideos: VideoRecord[];
  selectedConcept: string | null;
  onOpenVideo: (videoId: string) => void;
  onSelectConcept: (concept: string | null) => void;
  onToggleCompareVideo: (videoId: string) => void;
};

export default function ComparisonView({
  videos,
  allVideos,
  selectedConcept,
  onOpenVideo,
  onSelectConcept,
  onToggleCompareVideo,
}: ComparisonViewProps) {
  const [leftVideo, rightVideo] = videos;

  const comparison = useMemo(() => {
    if (!leftVideo || !rightVideo || leftVideo.id === rightVideo.id) return null;
    return buildVideoComparison(leftVideo, rightVideo);
  }, [leftVideo, rightVideo]);

  if (!leftVideo || !rightVideo || leftVideo.id === rightVideo.id) {
    return (
      <section className="comparison-page">
        <div className="comparison-hero">
          <div>
            <p className="eyebrow">Comparison view</p>
            <h2>Select two different videos to compare</h2>
            <p>
              Choose videos from the home page, explorer, or collection analysis
              to compare summaries, chapters, and concept overlap side by side.
            </p>
          </div>
        </div>

        <div className="results-head">
          <h3>Available videos for comparison</h3>
          <span>{allVideos.length} videos</span>
        </div>

        <div className="video-grid">
          {allVideos.map((video) => {
            const isSelected = videos.some((item) => item.id === video.id);

            return (
              <button
                key={video.id}
                className={`video-card ${isSelected ? "selected" : ""}`}
                onClick={() => onToggleCompareVideo(video.id)}
              >
                <p className="eyebrow">{video.domain ?? "General"}</p>
                <h3>{video.title}</h3>
                <p>{video.summaryShort}</p>

                <div className="video-card__meta">
                  <span>{video.speaker ?? "Unknown speaker"}</span>
                  <span>{Math.round(video.duration / 60)} min</span>
                  <span>{video.totalChapters} chapters</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="comparison-page">
      <div className="comparison-hero">
        <div>
          <p className="eyebrow">Comparison view</p>
          <h2>Compare videos side by side</h2>
          <p>
            Inspect overlap, unique concepts, chapter structure, and summary
            differences across two selected videos.
          </p>
        </div>

        {selectedConcept && (
          <button className="secondary-btn" onClick={() => onSelectConcept(null)}>
            Clear concept filter
          </button>
        )}
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Shared concepts</span>
          <strong>{comparison?.sharedConcepts.length ?? 0}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Similarity</span>
          <strong>{Math.round((comparison?.similarityScore ?? 0) * 100)}%</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Left chapters</span>
          <strong>{leftVideo.totalChapters}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Right chapters</span>
          <strong>{rightVideo.totalChapters}</strong>
        </article>
      </div>

      <div className="comparison-layout">
        {[leftVideo, rightVideo].map((video) => (
          <section key={video.id} className="panel comparison-column">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{video.domain ?? "General"}</p>
                <h3>{video.title}</h3>
              </div>

              <div className="comparison-actions">
                <button
                  className="secondary-btn"
                  onClick={() => onToggleCompareVideo(video.id)}
                >
                  Remove
                </button>
                <button
                  className="primary-btn"
                  onClick={() => onOpenVideo(video.id)}
                >
                  Open video
                </button>
              </div>
            </div>

            <p>{video.summaryMedium || video.summaryShort}</p>

            <div className="info-block">
              <h4>Key concepts</h4>
              <div className="chip-group">
                {video.keyConcepts.map((concept) => (
                  <button
                    key={concept}
                    className={`chip ${selectedConcept === concept ? "active" : ""}`}
                    onClick={() => onSelectConcept(concept)}
                  >
                    {concept}
                  </button>
                ))}
              </div>
            </div>

            <div className="info-block">
              <h4>Learning objectives</h4>
              {video.learningObjectives.length === 0 ? (
                <p>No learning objectives available.</p>
              ) : (
                <ul className="clean-list">
                  {video.learningObjectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="info-block">
              <h4>Chapters</h4>
              <ul className="clean-list chapter-compare-list">
                {video.chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <strong>
                      {chapter.index}. {chapter.title}
                    </strong>
                    <span>
                      {Math.round((chapter.endTime - chapter.startTime) / 60)} min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {comparison && (
        <section className="panel">
          <h3>Concept comparison</h3>

          <div className="info-block">
            <h4>Shared concepts</h4>
            {comparison.sharedConcepts.length === 0 ? (
              <p>No shared concepts detected.</p>
            ) : (
              <div className="chip-group">
                {comparison.sharedConcepts.map((concept) => (
                  <button
                    key={concept}
                    className={`chip ${selectedConcept === concept ? "active" : ""}`}
                    onClick={() => onSelectConcept(concept)}
                  >
                    {concept}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="comparison-unique-grid">
            <div className="panel comparison-subpanel">
              <h4>Unique to {leftVideo.title}</h4>
              <div className="chip-group">
                {comparison.leftUniqueConcepts.map((concept) => (
                  <span key={concept} className="chip muted">
                    {concept}
                  </span>
                ))}
                {comparison.leftUniqueConcepts.length === 0 && (
                  <p>No unique concepts listed.</p>
                )}
              </div>
            </div>

            <div className="panel comparison-subpanel">
              <h4>Unique to {rightVideo.title}</h4>
              <div className="chip-group">
                {comparison.rightUniqueConcepts.map((concept) => (
                  <span key={concept} className="chip muted">
                    {concept}
                  </span>
                ))}
                {comparison.rightUniqueConcepts.length === 0 && (
                  <p>No unique concepts listed.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}

3.) HomePage.tsx

// src/components/HomePage.tsx

import type { VideoRecord } from "../types/video";

type HomePageProps = {
  videos: VideoRecord[];
  selectedVideoId: string | null;
  comparisonVideoIds: string[];
  onOpenVideo: (videoId: string) => void;
  onOpenCollection: () => void;
  onOpenNetwork: () => void;
  onToggleCompareVideo: (videoId: string) => void;
  onSelectConcept: (concept: string) => void;
};

export default function HomePage({
  videos,
  selectedVideoId,
  comparisonVideoIds,
  onOpenVideo,
  onOpenCollection,
  onOpenNetwork,
  onToggleCompareVideo,
  onSelectConcept,
}: HomePageProps) {
  return (
    <section className="home-page">
      <div className="home-hero">
        <div>
          <p className="eyebrow">Educational video intelligence</p>
          <h2>Browse videos, chapter summaries, and concept-level relationships</h2>
          <p>
            This interface supports search, chapter-based exploration, collection
            comparison, and network-style topic discovery across the processed
            educational video dataset.
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={onOpenCollection}>
            Open collection analysis
          </button>
          <button type="button" className="secondary-btn" onClick={onOpenNetwork}>
            Open network view
          </button>
        </div>
      </div>

      <div className="results-head">
        <h3>Available videos</h3>
        <span>{videos.length} results</span>
      </div>

      <div className="video-grid">
        {videos.length === 0 ? (
          <div className="empty-state">
            <h3>No matching videos</h3>
            <p>Try a different search term, concept, or reset the filters.</p>
          </div>
        ) : (
          videos.map((video) => {
            const isSelected = selectedVideoId === video.id;
            const isInComparison = comparisonVideoIds.includes(video.id);

            return (
              <article
                key={video.id}
                className={`video-card ${isSelected ? "selected" : ""}`}
              >
                <button
                  type="button"
                  className="video-card__surface"
                  onClick={() => onOpenVideo(video.id)}
                >
                  <p className="eyebrow">{video.domain ?? "General"}</p>
                  <h3>{video.title}</h3>
                  <p>{video.summaryShort}</p>

                  <div className="video-card__meta">
                    <span>{video.speaker ?? "Unknown speaker"}</span>
                    <span>{Math.round(video.duration / 60)} min</span>
                    <span>{video.totalChapters} chapters</span>
                    <span>{video.difficultyLevel ?? "N/A"}</span>
                  </div>
                </button>

                <div className="chip-group compact">
                  {video.keyConcepts.slice(0, 4).map((concept) => (
                    <button
                      key={concept}
                      type="button"
                      className="chip concept-chip"
                      onClick={() => onSelectConcept(concept)}
                    >
                      {concept}
                    </button>
                  ))}
                </div>

                <div className="video-card__actions">
                  <button
                    type="button"
                    className={isInComparison ? "primary-btn" : "secondary-btn"}
                    onClick={() => onToggleCompareVideo(video.id)}
                  >
                    {isInComparison ? "Selected for compare" : "Compare"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

4.) NetworkView.tsx

// src/components/NetworkView.tsx

import { useMemo, useState } from "react";
import type { VideoRecord } from "../types/video";
import { normalizeConceptLabel } from "../lib/analytics";

type NetworkViewProps = {
  videos: VideoRecord[];
  selectedVideoId: string | null;
  onOpenVideo: (videoId: string) => void;
  onSelectConcept: (concept: string | null) => void;
  selectedConcept: string | null;
};

type VideoEdge = {
  sourceId: string;
  targetId: string;
  sharedConcepts: string[];
  weight: number;
};

function buildEdges(videos: VideoRecord[], selectedConcept: string | null): VideoEdge[] {
  const normalizedSelectedConcept = selectedConcept
    ? normalizeConceptLabel(selectedConcept)
    : null;

  const edges: VideoEdge[] = [];

  for (let i = 0; i < videos.length; i += 1) {
    for (let j = i + 1; j < videos.length; j += 1) {
      const left = videos[i];
      const right = videos[j];

      const leftConceptMap = new Map(
        left.keyConcepts.map((concept) => [normalizeConceptLabel(concept), concept])
      );

      const sharedConcepts = right.keyConcepts.filter((concept) => {
        const normalized = normalizeConceptLabel(concept);
        const matchesLeft = leftConceptMap.has(normalized);
        const matchesSelected =
          !normalizedSelectedConcept || normalized === normalizedSelectedConcept;
        return matchesLeft && matchesSelected;
      });

      if (sharedConcepts.length > 0) {
        edges.push({
          sourceId: left.id,
          targetId: right.id,
          sharedConcepts,
          weight: sharedConcepts.length,
        });
      }
    }
  }

  return edges.sort((a, b) => b.weight - a.weight);
}

function getVideoById(videos: VideoRecord[], id: string) {
  return videos.find((video) => video.id === id) ?? null;
}

export default function NetworkView({
  videos,
  selectedVideoId,
  onOpenVideo,
  onSelectConcept,
  selectedConcept,
}: NetworkViewProps) {
  const [minimumOverlap, setMinimumOverlap] = useState(1);
  const [focusedVideoId, setFocusedVideoId] = useState<string | null>(selectedVideoId);

  const edges = useMemo(
    () => buildEdges(videos, selectedConcept),
    [videos, selectedConcept]
  );

  const maxOverlap = useMemo(() => {
    if (edges.length === 0) return 1;
    return Math.max(...edges.map((edge) => edge.weight));
  }, [edges]);

  const filteredEdges = useMemo(() => {
    return edges.filter((edge) => edge.weight >= minimumOverlap);
  }, [edges, minimumOverlap]);

  const connectedVideoIds = useMemo(() => {
    const ids = new Set<string>();

    filteredEdges.forEach((edge) => {
      ids.add(edge.sourceId);
      ids.add(edge.targetId);
    });

    return ids;
  }, [filteredEdges]);

  const visibleVideos = useMemo(() => {
    if (filteredEdges.length === 0) return videos;
    return videos.filter((video) => connectedVideoIds.has(video.id));
  }, [videos, filteredEdges, connectedVideoIds]);

  const focusEdges = useMemo(() => {
    if (!focusedVideoId) return filteredEdges;

    return filteredEdges.filter(
      (edge) => edge.sourceId === focusedVideoId || edge.targetId === focusedVideoId
    );
  }, [filteredEdges, focusedVideoId]);

  const focusNeighbors = useMemo(() => {
    if (!focusedVideoId) return [];

    const neighborIds = new Set<string>();

    focusEdges.forEach((edge) => {
      if (edge.sourceId === focusedVideoId) neighborIds.add(edge.targetId);
      if (edge.targetId === focusedVideoId) neighborIds.add(edge.sourceId);
    });

    return videos.filter((video) => neighborIds.has(video.id));
  }, [focusEdges, focusedVideoId, videos]);

  const focusedVideo = focusedVideoId ? getVideoById(videos, focusedVideoId) : null;

  if (videos.length === 0) {
    return (
      <section className="network-page">
        <div className="network-hero">
          <p className="eyebrow">Network exploration</p>
          <h2>No videos match the current filters</h2>
          <p>
            Adjust the active search or filters to see concept relationships between videos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="network-page">
      <div className="network-hero">
        <div>
          <p className="eyebrow">Network exploration</p>
          <h2>Explore concept overlap across the visible video set</h2>
          <p>
            This view connects videos through shared key concepts. Increase the
            overlap threshold to focus on stronger conceptual relationships.
          </p>
          {selectedConcept && (
            <p className="section-note">Focused concept: {selectedConcept}</p>
          )}
        </div>

        {selectedConcept && (
          <button className="secondary-btn" onClick={() => onSelectConcept(null)}>
            Clear concept
          </button>
        )}
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Visible Videos</span>
          <strong>{videos.length}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Connected Videos</span>
          <strong>{visibleVideos.length}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Relationships</span>
          <strong>{filteredEdges.length}</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Min Overlap</span>
          <strong>{minimumOverlap}</strong>
        </article>
      </div>

      <section className="panel">
        <div className="network-toolbar">
          <div>
            <h3>Relationship threshold</h3>
            <p>
              Show only links where videos share at least {minimumOverlap} concept
              {minimumOverlap === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="network-toolbar__controls">
            <label htmlFor="overlapRange">Minimum shared concepts</label>
            <input
              id="overlapRange"
              type="range"
              min={1}
              max={maxOverlap}
              value={minimumOverlap}
              onChange={(e) => setMinimumOverlap(Number(e.target.value))}
            />
            <span>{minimumOverlap}</span>
          </div>
        </div>
      </section>

      <div className="network-layout">
        <div className="network-main">
          <section className="panel">
            <div className="panel-head">
              <h3>Video nodes</h3>
              {focusedVideo && (
                <button
                  className="secondary-btn"
                  onClick={() => setFocusedVideoId(null)}
                >
                  Clear focus
                </button>
              )}
            </div>

            <div className="node-grid">
              {visibleVideos.map((video) => {
                const isSelected = video.id === selectedVideoId;
                const isFocused = video.id === focusedVideoId;

                const connectionCount = filteredEdges.filter(
                  (edge) => edge.sourceId === video.id || edge.targetId === video.id
                ).length;

                return (
                  <article
                    key={video.id}
                    className={[
                      "node-card",
                      isSelected ? "selected" : "",
                      isFocused ? "focused" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="node-card__head">
                      <p className="eyebrow">{video.domain ?? "General"}</p>
                      <span>{connectionCount} links</span>
                    </div>

                    <h4>{video.title}</h4>
                    <p>{video.summaryShort}</p>

                    <div className="chip-group compact">
                      {video.keyConcepts.slice(0, 4).map((concept) => (
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

                    <div className="node-card__actions">
                      <span>{video.totalChapters} chapters</span>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setFocusedVideoId(video.id)}
                      >
                        Focus node
                      </button>
                      <button
                        type="button"
                        className="inline-link"
                        onClick={() => onOpenVideo(video.id)}
                      >
                        Open video
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h3>Relationships</h3>

            {focusEdges.length === 0 ? (
              <p>
                No relationships match the current threshold
                {focusedVideo ? " for the focused video" : ""}.
              </p>
            ) : (
              <div className="relationship-list">
                {focusEdges.map((edge) => {
                  const source = getVideoById(videos, edge.sourceId);
                  const target = getVideoById(videos, edge.targetId);

                  if (!source || !target) return null;

                  return (
                    <article
                      key={`${edge.sourceId}-${edge.targetId}`}
                      className="relationship-card"
                    >
                      <div className="relationship-card__head">
                        <div>
                          <strong>{source.title}</strong>
                          <span>↔</span>
                          <strong>{target.title}</strong>
                        </div>
                        <span className="weight-badge">
                          {edge.weight} shared concept{edge.weight === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="chip-group compact">
                        {edge.sharedConcepts.map((concept) => (
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

                      <div className="relationship-actions">
                        <button
                          className="secondary-btn"
                          onClick={() => onOpenVideo(edge.sourceId)}
                        >
                          Open source
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => onOpenVideo(edge.targetId)}
                        >
                          Open target
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="network-sidebar">
          <section className="panel">
            <h3>Focused video</h3>

            {!focusedVideo ? (
              <p>Select a video node to inspect its immediate concept neighbors.</p>
            ) : (
              <div className="focused-panel">
                <p className="eyebrow">{focusedVideo.domain ?? "General"}</p>
                <h4>{focusedVideo.title}</h4>
                <p>{focusedVideo.summaryShort}</p>

                <div className="chip-group compact">
                  {focusedVideo.keyConcepts.map((concept) => (
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

                <button
                  className="primary-btn"
                  onClick={() => onOpenVideo(focusedVideo.id)}
                >
                  Open video explorer
                </button>
              </div>
            )}
          </section>

          <section className="panel">
            <h3>Immediate neighbors</h3>

            {focusedVideoId && focusNeighbors.length === 0 ? (
              <p>No visible neighbors meet the current overlap threshold.</p>
            ) : !focusedVideoId ? (
              <p>Choose a video to inspect directly connected videos.</p>
            ) : (
              <div className="related-list">
                {focusNeighbors.map((video) => (
                  <button
                    key={video.id}
                    className="related-card"
                    onClick={() => setFocusedVideoId(video.id)}
                  >
                    <strong>{video.title}</strong>
                    <span>{video.domain ?? "General"}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

5.) VideoExplorer.tsx

// src/components/VideoExplorer.tsx

import { useEffect, useMemo, useState } from "react";
import type { SummaryDetailLevel, VideoRecord, ChapterRecord } from "../types/video";
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
};

function getBestChapterSummary(
  chapter: ChapterRecord,
  level: SummaryDetailLevel
): string {
  if (level === "long") {
    return chapter.summaryLong || chapter.summaryMedium || chapter.summaryShort;
  }

  if (level === "medium") {
    return chapter.summaryMedium || chapter.summaryShort;
  }

  return chapter.summaryShort;
}

function getActiveChapter(
  chapters: ChapterRecord[],
  currentTime: number
): ChapterRecord | null {
  return (
    chapters.find(
      (chapter) => currentTime >= chapter.startTime && currentTime < chapter.endTime
    ) ?? chapters[chapters.length - 1] ?? null
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
}: VideoExplorerProps) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [summaryLevel, setSummaryLevel] = useState<SummaryDetailLevel>("medium");

  useEffect(() => {
    setSelectedChapterIndex(0);
    setCurrentTime(0);
  }, [video.id]);

  const selectedChapter =
    video.chapters[selectedChapterIndex] ?? video.chapters[0] ?? null;

  const activePlaybackChapter = useMemo(
    () => getActiveChapter(video.chapters, currentTime),
    [video.chapters, currentTime]
  );

  const relatedVideos = useMemo(() => {
    const currentConcepts = new Set(video.keyConcepts.map((item) => item.toLowerCase()));

    return allVideos
      .filter((candidate) => candidate.id !== video.id)
      .map((candidate) => {
        const overlap = candidate.keyConcepts.filter((concept) =>
          currentConcepts.has(concept.toLowerCase())
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
  }, [allVideos, video]);

  function handleSelectChapter(index: number) {
    setSelectedChapterIndex(index);
    const nextChapter = video.chapters[index];
    if (nextChapter) {
      setCurrentTime(nextChapter.startTime);
    }
  }

  if (!selectedChapter) {
    return <div>No chapter data available.</div>;
  }

  return (
    <section className="video-explorer">
      <div className="video-explorer__header">
        <div>
          <p className="eyebrow">{video.domain ?? "Educational video"}</p>
          <h2>{video.title}</h2>
          <p className="meta">
            {video.speaker ?? "Unknown speaker"} · {video.totalChapters} chapters ·{" "}
            {Math.round(video.duration / 60)} min
          </p>
        </div>

        <div className="video-explorer__header-actions">
          <div className="summary-toggle" role="tablist" aria-label="Summary detail">
            {(["short", "medium", "long"] as SummaryDetailLevel[]).map((level) => (
              <button
                key={level}
                className={summaryLevel === level ? "active" : ""}
                onClick={() => setSummaryLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="hero-actions">
            <button
              className="secondary-btn"
              onClick={() => onToggleCompareVideo(video.id)}
            >
              Add to compare
            </button>
            <button
              className="primary-btn"
              onClick={() => onOpenComparison(video.id)}
            >
              Open comparison
            </button>
          </div>
        </div>
      </div>

      <div className="video-explorer__layout">
        <div className="video-explorer__main">
          <VideoPlayer
            videoId={video.id}
            src={video.videoSrc}
            title={video.title}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
          />

          <VideoTimeline
            chapters={video.chapters}
            activeChapterId={activePlaybackChapter?.id ?? null}
            selectedChapterId={selectedChapter.id}
            currentTime={currentTime}
            duration={video.duration}
            summaryLevel={summaryLevel}
            onSelectChapter={(chapter) =>
              handleSelectChapter(video.chapters.findIndex((item) => item.id === chapter.id))
            }
          />

          <article className="chapter-panel">
            <div className="chapter-panel__header">
              <div>
                <p className="eyebrow">Selected chapter</p>
                <h3>
                  {selectedChapter.index}. {selectedChapter.title}
                </h3>
              </div>
              <span className="time-range">
                {Math.floor(selectedChapter.startTime / 60)}:
                {String(selectedChapter.startTime % 60).padStart(2, "0")} -{" "}
                {Math.floor(selectedChapter.endTime / 60)}:
                {String(selectedChapter.endTime % 60).padStart(2, "0")}
              </span>
            </div>

            <p>{getBestChapterSummary(selectedChapter, summaryLevel)}</p>

            {selectedChapter.learningObjectives.length > 0 && (
              <div className="info-block">
                <h4>Learning objectives</h4>
                <ul>
                  {selectedChapter.learningObjectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedChapter.visualDescription && (
              <div className="info-block">
                <h4>Visual description</h4>
                <p>{selectedChapter.visualDescription}</p>
              </div>
            )}

            <div className="chip-group">
              {selectedChapter.keyConcepts.map((concept) => (
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
          </article>
        </div>

        <aside className="video-explorer__sidebar">
          <section className="sidebar-card">
            <h3>Video summary</h3>
            <p>
              {summaryLevel === "long"
                ? video.summaryLong || video.summaryMedium || video.summaryShort
                : summaryLevel === "medium"
                ? video.summaryMedium || video.summaryShort
                : video.summaryShort}
            </p>
          </section>

          <section className="sidebar-card">
            <h3>Video details</h3>
            <ul className="meta-list">
              <li>Speaker: {video.speaker ?? "Unknown"}</li>
              <li>Domain: {video.domain ?? "Unspecified"}</li>
              <li>Difficulty: {video.difficultyLevel ?? "Not available"}</li>
              <li>Code examples: {video.hasCodeExamples ? "Yes" : "No"}</li>
              <li>Math content: {video.hasMathematicalContent ? "Yes" : "No"}</li>
              <li>Diagrams: {video.hasDiagrams ? "Yes" : "No"}</li>
            </ul>
          </section>

          <section className="sidebar-card">
            <h3>Video concepts</h3>
            <div className="chip-group">
              {video.keyConcepts.map((concept) => (
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
          </section>

          <section className="sidebar-card">
            <h3>Related videos</h3>
            <div className="related-list">
              {relatedVideos.length === 0 && <p>No related videos found yet.</p>}
              {relatedVideos.map(({ video: related, overlap }) => (
                <button
                  key={related.id}
                  className="related-card"
                  onClick={() => onSelectVideo(related.id)}
                >
                  <strong>{related.title}</strong>
                  <span>{related.domain}</span>
                  <small>{overlap.slice(0, 4).join(", ")}</small>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

6.) VideoPlayer.tsx

import { useEffect, useRef } from "react";

type VideoPlayerProps = {
  videoId: string;
  src: string;
  title: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
};

export default function VideoPlayer({
  videoId,
  src,
  title,
  currentTime,
  onTimeUpdate,
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.load();
  }, [src]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 1.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <div className="video-player">
      <video
        key={videoId}
        ref={ref}
        src={src}
        controls
        preload="metadata"
        className="video-element"
        onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
      >
        Your browser does not support the video tag for {title}.
      </video>
    </div>
  );
}

7.) VideoTimeline.tsx 

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

8.) analytics.ts

import type {
  VideoComparisonRecord,
  VideoRecord,
  VideoSimilarityRecord,
} from "../types/video";

export function normalizeConceptLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function uniqueNormalizedConceptMap(concepts: string[]): Map<string, string> {
  const map = new Map<string, string>();

  concepts.forEach((concept) => {
    const normalized = normalizeConceptLabel(concept);
    if (!normalized) return;

    if (!map.has(normalized)) {
      map.set(normalized, concept);
    }
  });

  return map;
}

export function getSharedAndUniqueConcepts(left: string[], right: string[]) {
  const leftMap = uniqueNormalizedConceptMap(left);
  const rightMap = uniqueNormalizedConceptMap(right);

  const sharedConcepts: string[] = [];
  const leftUniqueConcepts: string[] = [];
  const rightUniqueConcepts: string[] = [];

  leftMap.forEach((original, normalized) => {
    if (rightMap.has(normalized)) {
      sharedConcepts.push(original);
    } else {
      leftUniqueConcepts.push(original);
    }
  });

  rightMap.forEach((original, normalized) => {
    if (!leftMap.has(normalized)) {
      rightUniqueConcepts.push(original);
    }
  });

  return {
    sharedConcepts: sharedConcepts.sort((a, b) => a.localeCompare(b)),
    leftUniqueConcepts: leftUniqueConcepts.sort((a, b) => a.localeCompare(b)),
    rightUniqueConcepts: rightUniqueConcepts.sort((a, b) => a.localeCompare(b)),
  };
}

export function getJaccardSimilarity(left: string[], right: string[]): number {
  const leftSet = new Set(left.map(normalizeConceptLabel).filter(Boolean));
  const rightSet = new Set(right.map(normalizeConceptLabel).filter(Boolean));

  const union = new Set([...leftSet, ...rightSet]);
  if (union.size === 0) return 0;

  let intersectionCount = 0;
  leftSet.forEach((item) => {
    if (rightSet.has(item)) {
      intersectionCount += 1;
    }
  });

  return intersectionCount / union.size;
}

export function buildVideoComparison(
  leftVideo: VideoRecord,
  rightVideo: VideoRecord
): VideoComparisonRecord {
  const { sharedConcepts, leftUniqueConcepts, rightUniqueConcepts } =
    getSharedAndUniqueConcepts(leftVideo.keyConcepts, rightVideo.keyConcepts);

  return {
    leftVideoId: leftVideo.id,
    rightVideoId: rightVideo.id,
    sharedConcepts,
    leftUniqueConcepts,
    rightUniqueConcepts,
    similarityScore: getJaccardSimilarity(leftVideo.keyConcepts, rightVideo.keyConcepts),
  };
}

export function buildSimilarityRecords(videos: VideoRecord[]): VideoSimilarityRecord[] {
  const results: VideoSimilarityRecord[] = [];

  for (let i = 0; i < videos.length; i += 1) {
    for (let j = i + 1; j < videos.length; j += 1) {
      const left = videos[i];
      const right = videos[j];

      const overlap = getSharedAndUniqueConcepts(left.keyConcepts, right.keyConcepts);
      if (overlap.sharedConcepts.length === 0) continue;

      results.push({
        sourceVideoId: left.id,
        targetVideoId: right.id,
        sharedConcepts: overlap.sharedConcepts,
        score: getJaccardSimilarity(left.keyConcepts, right.keyConcepts),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function videoMatchesConcept(video: VideoRecord, concept: string | null): boolean {
  if (!concept) return true;

  const normalizedTarget = normalizeConceptLabel(concept);
  return video.keyConcepts.some(
    (item) => normalizeConceptLabel(item) === normalizedTarget
  );
}

9.) dataloader.ts

// src/lib/dataLoader.ts

import type {
  AppDataset,
  ChapterRecord,
  CollectionAnalysisRecord,
  RawChapterSummariesFile,
  RawCollectionAnalysis,
  RawVideoSummary,
  VideoRecord,
} from "../types/video";

const DATA_BASE = "/data/processed/subtask2_summarization";

const VIDEO_FILE_MAP: Record<string, string> = {
  tib_av_00000_720p: "/data/raw/videos/tib_av_00000_720p.mp4",
  tib_av_16257_720p: "/data/raw/videos/tib_av_16257_720p.mp4",
  tib_av_16258_720p: "/data/raw/videos/tib_av_16258_720p.mp4",
  tib_av_16259_720p: "/data/raw/videos/tib_av_16259_720p.mp4",
  tib_av_16260_720p: "/data/raw/videos/tib_av_16260_720p.mp4",
  tib_av_16261_1080p: "/data/raw/videos/tib_av_16261_1080p.mp4",
};

const VIDEO_IDS = Object.keys(VIDEO_FILE_MAP);

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        typeof item === "string"
          ? item.split(",").map((part) => part.trim())
          : []
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeDifficulty(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function mergeVideoData(
  videoSummary: RawVideoSummary,
  chapterFile?: RawChapterSummariesFile
): VideoRecord {
  const chapterSummaryMap = new Map(
    (chapterFile?.chapter_summaries ?? []).map((chapter) => [chapter.chapter_index, chapter])
  );

  const chapters: ChapterRecord[] = videoSummary.chapter_timeline.map((timelineItem) => {
    const detailed = chapterSummaryMap.get(timelineItem.chapter_index);

    return {
      id:
        detailed?.chapter_id ??
        `${videoSummary.video_id}_ch${timelineItem.chapter_index}`,
      index: timelineItem.chapter_index,
      title: detailed?.title ?? timelineItem.title,
      startTime: timelineItem.start_time,
      endTime: timelineItem.end_time,
      durationSeconds:
        detailed?.duration_seconds ??
        Math.max(0, timelineItem.end_time - timelineItem.start_time),
      summaryShort: detailed?.summary_short ?? timelineItem.summary_short ?? "",
      summaryMedium: detailed?.summary_medium,
      summaryLong: detailed?.summary_long,
      keyConcepts: detailed?.key_concepts ?? timelineItem.key_concepts ?? [],
      learningObjectives: detailed?.learning_objectives ?? [],
      hasVisuals: detailed?.has_visuals ?? false,
      visualDescription: detailed?.visual_description,
      difficultyLevel: normalizeDifficulty(detailed?.difficulty_level),
      estimatedReadTimeSeconds: detailed?.estimated_read_time_seconds,
    };
  });

  const mergedKeyConcepts = Array.from(
    new Set([
      ...ensureStringArray(videoSummary.key_concepts),
      ...chapters.flatMap((chapter) => chapter.keyConcepts),
    ])
  );

  const mergedLearningObjectives = Array.from(
    new Set([
      ...ensureStringArray(videoSummary.learning_objectives),
      ...chapters.flatMap((chapter) => chapter.learningObjectives),
    ])
  );

  return {
    id: videoSummary.video_id,
    title: videoSummary.video_title,
    speaker: videoSummary.speaker ?? chapterFile?.speaker,
    domain: videoSummary.domain ?? chapterFile?.domain,
    duration: videoSummary.duration,
    totalChapters: videoSummary.total_chapters,
    videoSrc: VIDEO_FILE_MAP[videoSummary.video_id] ?? "",
    posterSrc: undefined,
    summaryShort: videoSummary.summary_short,
    summaryMedium: videoSummary.summary_medium,
    summaryLong: videoSummary.summary_long,
    keyConcepts: mergedKeyConcepts,
    learningObjectives: mergedLearningObjectives,
    prerequisites: ensureStringArray(videoSummary.prerequisites),
    topicProgression: videoSummary.topic_progression,
    difficultyLevel: normalizeDifficulty(videoSummary.difficulty_level),
    domainTags: videoSummary.domain_tags ?? [],
    hasCodeExamples: Boolean(videoSummary.has_code_examples),
    hasMathematicalContent: Boolean(videoSummary.has_mathematical_content),
    hasDiagrams: Boolean(videoSummary.has_diagrams),
    chapters,
  };
}

function normalizeCollectionAnalysis(
  raw: RawCollectionAnalysis
): CollectionAnalysisRecord {
  return {
    totalVideos: raw.total_videos,
    overview: raw.collection_overview,
    commonConcepts: raw.common_concepts ?? {},
    uniqueConcepts: raw.unique_concepts ?? {},
  };
}

export async function loadVideoRecord(videoId: string): Promise<VideoRecord> {
  const [videoSummary, chapterSummaries] = await Promise.all([
    fetchJson<RawVideoSummary>(`${DATA_BASE}/video_summaries/${videoId}_video_summary.json`),
    fetchJson<RawChapterSummariesFile>(
      `${DATA_BASE}/chapter_summaries/${videoId}_chapter_summaries.json`
    ).catch(() => undefined),
  ]);

  return mergeVideoData(videoSummary, chapterSummaries);
}

export async function loadAllVideos(): Promise<VideoRecord[]> {
  const videos = await Promise.all(VIDEO_IDS.map((videoId) => loadVideoRecord(videoId)));
  return videos.sort((a, b) => a.title.localeCompare(b.title));
}

export async function loadCollectionAnalysis(): Promise<CollectionAnalysisRecord> {
  const raw = await fetchJson<RawCollectionAnalysis>(
    `${DATA_BASE}/collection_analysis/collection_analysis.json`
  );
  return normalizeCollectionAnalysis(raw);
}

export async function loadAppDataset(): Promise<AppDataset> {
  const [videos, collectionAnalysis] = await Promise.all([
    loadAllVideos(),
    loadCollectionAnalysis().catch(() => undefined),
  ]);

  return {
    videos,
    collectionAnalysis,
  };
}

10.) video.ts

export type SummaryDetailLevel = "short" | "medium" | "long";

export interface RawChapterTimelineItem {
  chapter_index: number;
  title: string;
  start_time: number;
  end_time: number;
  summary_short: string;
  key_concepts?: string[];
}

export interface RawVideoSummary {
  video_id: string;
  video_title: string;
  speaker?: string;
  domain?: string;
  duration: number;
  total_chapters: number;
  chapter_timeline: RawChapterTimelineItem[];
  summary_short?: string;
  summary_medium?: string;
  summary_long?: string;
  key_concepts?: string[] | string;
  learning_objectives?: string[] | string;
  prerequisites?: string[] | string;
  topic_progression?: string;
  difficulty_level?: string;
  domain_tags?: string[];
  has_code_examples?: boolean;
  has_mathematical_content?: boolean;
  has_diagrams?: boolean;
}

export interface RawChapterSummaryItem {
  chapter_id: string;
  chapter_index: number;
  title: string;
  start_time: number;
  end_time: number;
  duration_seconds?: number;
  summary_short?: string;
  summary_medium?: string;
  summary_long?: string;
  key_concepts?: string[];
  learning_objectives?: string[];
  has_visuals?: boolean;
  visual_description?: string;
  difficulty_level?: string;
  estimated_read_time_seconds?: number;
}

export interface RawChapterSummariesFile {
  video_id: string;
  video_title: string;
  speaker?: string;
  domain?: string;
  duration: number;
  total_chapters: number;
  chapter_summaries: RawChapterSummaryItem[];
}

export interface CollectionOverview {
  collection_summary?: string;
  main_themes?: string[];
  suggested_viewing_order?: Array<{
    video_id: string;
    reason: string;
  }>;
  difficulty_progression?: string;
  knowledge_gaps?: string[];
  target_audience?: string;
}

export interface UniqueConceptGroup {
  video_title: string;
  unique_concepts: string[];
}

export interface RawCollectionAnalysis {
  total_videos: number;
  collection_overview?: CollectionOverview;
  common_concepts?: Record<string, string[]>;
  unique_concepts?: Record<string, UniqueConceptGroup>;
}

export interface ChapterRecord {
  id: string;
  index: number;
  title: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  summaryShort: string;
  summaryMedium?: string;
  summaryLong?: string;
  keyConcepts: string[];
  learningObjectives: string[];
  hasVisuals: boolean;
  visualDescription?: string;
  difficultyLevel?: string;
  estimatedReadTimeSeconds?: number;
}

export interface VideoRecord {
  id: string;
  title: string;
  speaker?: string;
  domain?: string;
  duration: number;
  totalChapters: number;
  videoSrc: string;
  posterSrc?: string;
  summaryShort?: string;
  summaryMedium?: string;
  summaryLong?: string;
  keyConcepts: string[];
  learningObjectives: string[];
  prerequisites: string[];
  topicProgression?: string;
  difficultyLevel?: string;
  domainTags: string[];
  hasCodeExamples: boolean;
  hasMathematicalContent: boolean;
  hasDiagrams: boolean;
  chapters: ChapterRecord[];
}

export interface CollectionAnalysisRecord {
  totalVideos: number;
  overview?: CollectionOverview;
  commonConcepts: Record<string, string[]>;
  uniqueConcepts: Record<string, UniqueConceptGroup>;
}

export interface AppDataset {
  videos: VideoRecord[];
  collectionAnalysis?: CollectionAnalysisRecord;
}

export interface ConceptOverlapRecord {
  concept: string;
  normalized: string;
}

export interface VideoSimilarityRecord {
  sourceVideoId: string;
  targetVideoId: string;
  sharedConcepts: string[];
  score: number;
}

export interface VideoComparisonRecord {
  leftVideoId: string;
  rightVideoId: string;
  sharedConcepts: string[];
  leftUniqueConcepts: string[];
  rightUniqueConcepts: string[];
  similarityScore: number;
}

export type ComparisonSelection = [string, string] | [];

11.) App.css

:root {
  --bg: #f3f7fc;
  --bg-accent: #eef4ff;
  --surface: #ffffff;
  --surface-soft: #f8fbff;
  --surface-soft-2: #eff6ff;
  --surface-muted: #f8fbff;
  --surface-elevated: rgba(255, 255, 255, 0.92);

  --border: #dbe6f3;
  --border-strong: #c7d7ea;
  --divider: #edf2f8;

  --text: #0f172a;
  --text-soft: #000000;
  --text-faint: #22948a;

  --primary: #2563eb;
  --primary-soft: #dbeafe;
  --primary-strong: #1d4ed8;

  --success-soft: #dcfce7;
  --warning-soft: #fef3c7;

  --shadow-sm: 0 8px 20px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 18px 40px rgba(15, 23, 42, 0.08);

  --radius-lg: 18px;
  --radius-md: 14px;
  --radius-sm: 10px;
  --max-width: 100%;
}

[data-theme="dark"] {
  --bg: #08111f;
  --bg-accent: #0b1324;
  --surface: #0f172a;
  --surface-soft: #111c31;
  --surface-soft-2: #16233a;
  --surface-muted: #152033;
  --surface-elevated: rgba(15, 23, 42, 0.92);

  --border: #22314b;
  --border-strong: #314563;
  --divider: #243247;

  --text: #f8fafc;
  --text-soft: #dbe4f3;
  --text-faint: #94a3b8;

  --primary: #60a5fa;
  --primary-soft: rgba(96, 165, 250, 0.16);
  --primary-strong: #93c5fd;

  --success-soft: rgba(34, 197, 94, 0.16);
  --warning-soft: rgba(251, 191, 36, 0.16);

  --shadow-sm: 0 8px 20px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 18px 40px rgba(0, 0, 0, 0.34);
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 28%),
    linear-gradient(180deg, var(--bg-accent) 0%, var(--bg) 34%, var(--surface-soft) 100%);
  color: var(--text);
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 16px 18px;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-logo__svg {
  width: 42px;
  height: 42px;
  display: block;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--text);
}

.brand-copy p {
  margin: 4px 0 0;
  font-size: 0.88rem;
  line-height: 1.35;
  color: var(--text-soft);
  max-width: 520px;
}

.topbar {
  width: 100%;
  max-width: none;
  margin: 0 0 20px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  backdrop-filter: blur(14px);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  border-radius: 24px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.topbar > div:not(.brand-block) h1 {
  margin: 0;
}

.topbar > div:not(.brand-block) p {
  margin: 6px 0 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1 1 auto;
}

.topbar-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.theme-toggle {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  color: var(--text);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.theme-toggle__icon {
  width: 20px;
  height: 20px;
  display: block;
}

.brand-logo {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
  display: grid;
  place-items: center;
  box-shadow:
    inset 0 0 0 1px rgba(37, 99, 235, 0.1),
    0 10px 24px rgba(37, 99, 235, 0.08);
  flex-shrink: 0;
}

.brand-gradient {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.02;
  letter-spacing: -0.04em;
  background: linear-gradient(90deg, #2563eb 0%, #14b8a6 52%, #7c3aed 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.brand-tagline {
  margin: 4px 0 0;
  font-size: 0.9rem;
  line-height: 1.35;
  max-width: 560px;
  background: linear-gradient(90deg, #2563eb 0%, #0f766e 52%, #6d28d9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.topbar-nav button,
.primary-btn,
.secondary-btn,
.inline-link,
.video-card__surface {
  border: none;
  border-radius: 999px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.topbar-nav button {
  background: #eff6ff;
  color: var(--text-soft);
  padding: 10px 16px;
  font-weight: 600;
}

.topbar-nav button:hover,
.primary-btn:hover,
.secondary-btn:hover,
.inline-link:hover,
.video-card__surface:hover {
  transform: translateY(-1px);
}

.topbar-nav button.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}

.topbar-nav button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.filters-bar {
  width: 100%;
  max-width: none;
  margin: 0 0 24px;
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) repeat(2, minmax(180px, 0.7fr));
  gap: 14px;
}

.filters-bar input,
.filters-bar select,
.video-element,
.panel,
.stat-card,
.video-card,
.related-card,
.node-card,
.relationship-card,
.concept-card {
  border: 1px solid var(--border);
}

.filters-bar input,
.filters-bar select {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-sm);
  color: var(--text);
  border-radius: 16px;
  padding: 14px 16px;
  outline: none;
}

.filters-bar input:focus,
.filters-bar select:focus,
input[type="range"]:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.main-content {
  width: 100%;
  max-width: none;
  margin: 0;
}

.home-page,
.video-explorer,
.collection-page,
.network-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home-hero,
.collection-hero,
.network-hero {
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: 30px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.home-hero,
.collection-hero,
.network-hero,
.video-explorer__header {
  color: var(--text);
}

.home-hero h2,
.collection-hero h2,
.network-hero h2,
.video-explorer__header h2 {
  color: var(--text);
  margin: 8px 0 10px;
  font-size: clamp(1.75rem, 2.2vw, 2.5rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.home-hero p,
.collection-hero p,
.network-hero p,
.video-explorer__header p,
.panel p,
.video-card p,
.node-card p,
.relationship-card p,
.focused-panel p {
  color: var(--text-soft);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.primary-btn {
  background: var(--primary);
  color: white;
  padding: 12px 18px;
  font-weight: 700;
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.2);
}

.primary-btn:hover {
  background: var(--primary-strong);
}

.secondary-btn {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 11px 16px;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.inline-link {
  background: transparent;
  color: var(--primary);
  padding: 0;
  font-weight: 700;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary);
}

.section-note {
  margin-top: 12px;
  font-size: 0.92rem;
  color: var(--text-faint);
}

.results-head,
.panel-head,
.video-explorer__header,
.concept-card__head,
.relationship-card__head,
.node-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.results-head h3,
.panel h3,
.sidebar-card h3 {
  margin: 0;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.results-head span,
.stat-label,
.meta,
.time-range,
.weight-badge {
  color: var(--text-faint);
}

.video-grid,
.node-grid,
.stats-grid {
  display: grid;
  gap: 16px;
}

.video-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.node-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.video-card,
.stat-card,
.panel,
.related-card,
.node-card,
.relationship-card,
.concept-card,
.sidebar-card {
  background: var(--surface);
  border-radius: 22px;
  box-shadow: var(--shadow-sm);
}

.video-card,
.node-card,
.relationship-card,
.concept-card,
.panel,
.sidebar-card {
  padding: 18px;
}

.video-card,
.node-card,
.related-card {
  text-align: left;
}

.video-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
}

.video-card__surface {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
  padding: 0;
  background: transparent;
  text-align: left;
  box-shadow: none;
}

.video-card:hover,
.node-card:hover,
.related-card:hover,
.relationship-card:hover,
.concept-card:hover,
.panel:hover,
.sidebar-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.video-card.selected,
.node-card.selected,
.node-card.focused {
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 16px 36px rgba(37, 99, 235, 0.12);
}

.video-card h3,
.node-card h4,
.focused-panel h4,
.chapter-panel h3 {
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.video-card__meta,
.meta-list,
.node-card__actions,
.relationship-actions,
.network-toolbar__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.video-card__meta span,
.node-card__actions span,
.weight-badge {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.8rem;
  color: var(--text);
}

.stat-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card strong {
  font-size: 1.7rem;
  letter-spacing: -0.04em;
}

.collection-layout,
.network-layout,
.video-explorer__layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

.collection-main,
.network-main,
.video-explorer__main,
.collection-sidebar,
.network-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel,
.sidebar-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.clean-list,
.ordered-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-soft);
}

.ordered-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--divider);
}

.ordered-item:last-child {
  border-bottom: none;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-strong);
  padding: 7px 11px;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  border: none;
  cursor: pointer;
}

.chip.muted {
  background: var(--surface-soft-2);
  color: var(--text-faint);
}

.related-list,
.relationship-list,
.concept-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-card {
  color: var(--text);
}

.related-card strong,
.related-card span,
.related-card small {
  color: var(--text);
}

.related-card {
  width: 100%;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--divider);
  text-align: left;
  vertical-align: top;
}

.data-table th {
  color: var(--text-faint);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.video-explorer__header {
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: 28px;
  padding: 24px 26px;
}

.summary-toggle {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-toggle button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-soft);
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
}

.summary-toggle button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.video-player {
  background: var(--surface);
  border-radius: 24px;
  padding: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
}

.video-element {
  width: 100%;
  max-height: 520px;
  border-radius: 18px;
  background: #dbeafe;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.timeline-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.timeline-track {
  width: 100%;
  height: 12px;
  background: var(--surface-soft-2);
  border-radius: 999px;
  overflow: hidden;
}

.timeline-progress {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #60a5fa 0%, #2563eb 70%, #1d4ed8 100%);
}

.timeline-chapters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.timeline-chapter {
  min-width: 110px;
  flex: 1 1 120px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  color: var(--text-soft);
  border-radius: 16px;
  padding: 12px;
  text-align: left;
  position: relative;
  overflow: visible;
}

.timeline-chapter.active {
  border-color: rgba(37, 99, 235, 0.45);
  background: var(--surface-soft-2);
}

.timeline-chapter.selected {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border-color: transparent;
}

.timeline-index {
  display: inline-flex;
  margin-bottom: 6px;
  font-weight: 800;
}

.timeline-title {
  display: block;
  font-size: 0.86rem;
  line-height: 1.35;
}

.chapter-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-panel__header,
.network-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-block h4,
.panel h4,
.chapter-panel h4 {
  margin: 0;
  font-size: 0.96rem;
  letter-spacing: -0.02em;
}

.meta-list {
  padding: 0;
  margin: 0;
  list-style: none;
  flex-direction: column;
}

.meta-list li {
  padding: 10px 12px;
  background: var(--surface-soft);
  border-radius: 14px;
  border: 1px solid var(--divider);
}

.node-card__actions,
.relationship-actions {
  justify-content: space-between;
  align-items: center;
}

.video-grid .empty-state {
  grid-column: 1 / -1;
}

.focused-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.weight-badge {
  color: var(--primary-strong);
  background: var(--primary-soft);
  border-color: transparent;
  font-weight: 700;
}

.network-toolbar__controls {
  align-items: center;
}

.network-toolbar__controls input[type="range"] {
  accent-color: var(--primary);
}

.empty-state {
  background: var(--surface);
  border: 1px dashed var(--border-strong);
  border-radius: 22px;
  padding: 30px;
  text-align: center;
  color: var(--text-soft);
  box-shadow: var(--shadow-sm);
}

.active-concept-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 20px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  color: var(--text);
}

.video-card__actions,
.related-card__actions,
.comparison-actions,
.table-video-actions,
.video-explorer__header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.video-card__actions {
  margin-top: auto;
}

.comparison-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-hero {
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: 30px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.comparison-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.comparison-column {
  min-height: 100%;
}

.comparison-unique-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.comparison-subpanel {
  min-height: 100%;
}

.chapter-compare-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chapter-compare-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-soft);
  border: 1px solid var(--divider);
}

.table-video-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.related-card--actions {
  align-items: stretch;
  gap: 12px;
}

.related-card--actions > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.concept-card__title-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.concept-chip {
  border: none;
  cursor: pointer;
}

.chip.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
}

.video-explorer__header-actions {
  justify-content: flex-end;
  align-items: flex-end;
}

.timeline-preview {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 20;
  width: min(300px, 72vw);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow-md);
  color: var(--text);
  text-align: left;
  white-space: normal;
}

.timeline-preview strong,
.timeline-preview__range,
.timeline-preview__summary,
.timeline-preview__duration {
  color: var(--text);
}

.timeline-preview__range,
.timeline-preview__duration {
  font-size: 0.78rem;
  color: var(--text-faint);
}

.timeline-preview__summary {
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--text-soft);
}

@media (max-width: 1024px) {
  .comparison-layout,
  .comparison-unique-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .active-concept-bar,
  .comparison-hero,
  .video-explorer__header-actions,
  .table-video-actions,
  .comparison-actions,
  .related-card__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .timeline-preview {
    position: static;
    width: 100%;
    margin-top: 10px;
  }
}

@media (max-width: 1024px) {
  .topbar,
  .home-hero,
  .collection-hero,
  .network-hero,
  .video-explorer__header,
  .collection-layout,
  .network-layout,
  .video-explorer__layout {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .filters-bar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .app-shell {
    padding: 16px;
  }

  .topbar,
  .home-hero,
  .collection-hero,
  .network-hero,
  .video-explorer__header,
  .panel,
  .sidebar-card,
  .video-player,
  .chapter-panel,
  .timeline-panel {
    padding: 16px;
    border-radius: 18px;
  }

  .timeline-chapter {
    min-width: 100%;
  }

  .topbar-right {
    margin-left: 0;
    width: 100%;
  }

  .topbar-right .theme-toggle {
    width: 100%;
  }

  .ordered-item,
  .chapter-panel__header,
  .network-toolbar,
  .results-head,
  .panel-head,
  .relationship-card__head,
  .concept-card__head,
  .node-card__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .topbar-nav,
  .summary-toggle,
  .hero-actions,
  .network-toolbar__controls {
    width: 100%;
  }

  .topbar-nav button,
  .primary-btn,
  .secondary-btn {
    width: 100%;
    justify-content: center;
  }
}

12.) App.tsx

import { useEffect, useMemo, useState } from "react";
import "./App.css";

import type { AppDataset, VideoRecord } from "./types/video";
import { loadAppDataset } from "./lib/dataLoader";
import { videoMatchesConcept } from "./lib/analytics";

import HomePage from "./components/HomePage";
import VideoExplorer from "./components/VideoExplorer";
import CollectionAnalysis from "./components/CollectionAnalysis";
import NetworkView from "./components/NetworkView";
import ComparisonView from "./components/ComparisonView";

type ViewMode = "home" | "video" | "collection" | "network" | "compare";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [dataset, setDataset] = useState<AppDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("home");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [comparisonVideoIds, setComparisonVideoIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setLoading(true);
        const data = await loadAppDataset();
        if (!mounted) return;

        setDataset(data);
        setSelectedVideoId(data.videos[0]?.id ?? null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load dataset.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredVideos = useMemo(() => {
    if (!dataset) return [];

    const q = searchQuery.trim().toLowerCase();

    return dataset.videos.filter((video) => {
      const matchesQuery =
        q === "" ||
        video.title.toLowerCase().includes(q) ||
        (video.speaker ?? "").toLowerCase().includes(q) ||
        (video.domain ?? "").toLowerCase().includes(q) ||
        (video.summaryShort ?? "").toLowerCase().includes(q) ||
        video.keyConcepts.some((concept) => concept.toLowerCase().includes(q));

      const matchesDomain =
        selectedDomain === "all" ||
        (video.domain ?? "").toLowerCase() === selectedDomain.toLowerCase();

      const matchesDifficulty =
        selectedDifficulty === "all" ||
        (video.difficultyLevel ?? "").toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesSelectedConcept = videoMatchesConcept(video, selectedConcept);

      return (
        matchesQuery &&
        matchesDomain &&
        matchesDifficulty &&
        matchesSelectedConcept
      );
    });
  }, [dataset, searchQuery, selectedDomain, selectedDifficulty, selectedConcept]);

  const selectedVideo: VideoRecord | null = useMemo(() => {
    if (!dataset || !selectedVideoId) return null;
    return dataset.videos.find((video) => video.id === selectedVideoId) ?? null;
  }, [dataset, selectedVideoId]);

  const comparisonVideos = useMemo(() => {
    if (!dataset || comparisonVideoIds.length === 0) return [];

    return comparisonVideoIds
      .map((id) => dataset.videos.find((video) => video.id === id) ?? null)
      .filter(Boolean) as VideoRecord[];
  }, [dataset, comparisonVideoIds]);

  const availableDomains = useMemo(() => {
    if (!dataset) return [];
    return Array.from(
      new Set(dataset.videos.map((video) => video.domain).filter(Boolean))
    ) as string[];
  }, [dataset]);

  const availableDifficulties = useMemo(() => {
    if (!dataset) return [];
    return Array.from(
      new Set(dataset.videos.map((video) => video.difficultyLevel).filter(Boolean))
    ) as string[];
  }, [dataset]);

  function handleOpenVideo(videoId: string) {
    setSelectedVideoId(videoId);
    setView("video");
  }

  function handleSelectConcept(concept: string | null) {
    setSelectedConcept(concept);
  }

  function handleToggleCompareVideo(videoId: string) {
    setComparisonVideoIds((current) => {
      let next: string[];

      if (current.includes(videoId)) {
        next = current.filter((id) => id !== videoId);
      } else if (current.length >= 2) {
        next = [current[1], videoId];
      } else {
        next = [...current, videoId];
      }

      if (next.length >= 2) {
        setView("compare");
      } else if (view === "compare") {
        setView("home");
      }

      return next;
    });
  }

  function handleOpenComparison(videoId?: string) {
    if (!videoId) {
      if (comparisonVideoIds.length >= 2) {
        setView("compare");
      }
      return;
    }

    setComparisonVideoIds((current) => {
      let next: string[];

      if (current.includes(videoId)) {
        next = current;
      } else if (current.length >= 2) {
        next = [current[1], videoId];
      } else {
        next = [...current, videoId];
      }

      if (next.length >= 2) {
        setView("compare");
      }

      return next;
    });
  }

  if (loading) {
    return <div className="app-shell">Loading EduVid Explorer...</div>;
  }

  if (error || !dataset) {
    return <div className="app-shell">Error: {error ?? "Unknown error"}</div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand-block">
            <div className="brand-logo" aria-hidden="true">
              <svg viewBox="0 0 64 64" className="brand-logo__svg" role="img">
                <defs>
                  <linearGradient id="eduvidStatsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="55%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>

                <rect
                  x="8"
                  y="10"
                  width="48"
                  height="44"
                  rx="16"
                  fill="url(#eduvidStatsGradient)"
                  opacity="0.12"
                />
                <path
                  d="M18 46V34M30 46V24M42 46V16"
                  stroke="url(#eduvidStatsGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M16 46H48"
                  stroke="#0f172a"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  opacity="0.24"
                />
                <circle cx="18" cy="34" r="3" fill="#2563eb" />
                <circle cx="30" cy="24" r="3" fill="#14b8a6" />
                <circle cx="42" cy="16" r="3" fill="#7c3aed" />
              </svg>
            </div>

            <div className="brand-copy">
              <h1 className="brand-gradient">EduVid Explorer</h1>
              <p className="brand-tagline">
                Interactive exploration of educational video summaries and chapters
              </p>
            </div>
          </div>
        </div>

        <nav className="topbar-nav">
          <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>
            Home
          </button>
          <button
            className={view === "video" ? "active" : ""}
            onClick={() => setView("video")}
            disabled={!selectedVideo}
          >
            Video Explorer
          </button>
          <button
            className={view === "collection" ? "active" : ""}
            onClick={() => setView("collection")}
          >
            Collection
          </button>
          <button
            className={view === "network" ? "active" : ""}
            onClick={() => setView("network")}
          >
            Network
          </button>
          <button
            className={view === "compare" ? "active" : ""}
            onClick={() => setView("compare")}
            disabled={comparisonVideos.length < 2}
          >
            Compare {comparisonVideos.length > 0 ? `(${comparisonVideos.length}/2)` : ""}
          </button>
        </nav>

        <div className="topbar-right">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" className="theme-toggle__icon" aria-hidden="true">
                <path
                  d="M12 3.75V2m0 20v-1.75M4.75 12H3m18 0h-1.75M6.22 6.22 5 5m14 14-1.22-1.22M6.22 17.78 5 19m14-14-1.22 1.22M12 16.25A4.25 4.25 0 1 0 12 7.75a4.25 4.25 0 0 0 0 8.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="theme-toggle__icon" aria-hidden="true">
                <path
                  d="M20.2 14.2A8.5 8.5 0 0 1 9.8 3.8a8.75 8.75 0 1 0 10.4 10.4Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      <section className="filters-bar">
        <input
          type="text"
          placeholder="Search by title, speaker, concept, or summary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)}>
          <option value="all">All domains</option>
          {availableDomains.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
        >
          <option value="all">All difficulty levels</option>
          {availableDifficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
      </section>

      {selectedConcept && (
        <section className="active-concept-bar">
          <span>
            Active concept filter: <strong>{selectedConcept}</strong>
          </span>
          <button className="secondary-btn" onClick={() => handleSelectConcept(null)}>
            Clear concept
          </button>
        </section>
      )}

      <main className="main-content">
        {view === "home" && (
          <HomePage
            videos={filteredVideos}
            selectedVideoId={selectedVideoId}
            comparisonVideoIds={comparisonVideoIds}
            onOpenVideo={handleOpenVideo}
            onOpenCollection={() => setView("collection")}
            onOpenNetwork={() => setView("network")}
            onToggleCompareVideo={handleToggleCompareVideo}
            onSelectConcept={handleSelectConcept}
          />
        )}

        {view === "video" && selectedVideo && (
  <VideoExplorer
    key={selectedVideo.id}
    video={selectedVideo}
    allVideos={dataset.videos}
    onSelectVideo={handleOpenVideo}
    onToggleCompareVideo={handleToggleCompareVideo}
    onSelectConcept={handleSelectConcept}
    selectedConcept={selectedConcept}
    onOpenComparison={handleOpenComparison}
  />
)}

        {view === "collection" && dataset.collectionAnalysis && (
          <CollectionAnalysis
            analysis={dataset.collectionAnalysis}
            videos={filteredVideos}
            onOpenVideo={handleOpenVideo}
            onToggleCompareVideo={handleToggleCompareVideo}
            onSelectConcept={handleSelectConcept}
            selectedConcept={selectedConcept}
            onOpenComparison={handleOpenComparison}
          />
        )}

        {view === "network" && (
          <NetworkView
            videos={filteredVideos}
            selectedVideoId={selectedVideoId}
            onOpenVideo={handleOpenVideo}
            onSelectConcept={handleSelectConcept}
            selectedConcept={selectedConcept}
          />
        )}

        {view === "compare" && (
          <ComparisonView
            videos={comparisonVideos}
            allVideos={dataset.videos}
            selectedConcept={selectedConcept}
            onOpenVideo={handleOpenVideo}
            onSelectConcept={handleSelectConcept}
            onToggleCompareVideo={handleToggleCompareVideo}
          />
        )}
      </main>
    </div>
  );
}

13.) index.css

:root {
  --text: #6b6375;
  --text-h: #08060d;
  --bg: #fff;
  --border: #e5e4e7;
  --code-bg: #f4f3ec;
  --accent: #aa3bff;
  --accent-bg: rgba(170, 59, 255, 0.1);
  --accent-border: rgba(170, 59, 255, 0.5);
  --social-bg: rgba(244, 243, 236, 0.5);
  --shadow:
    rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;

  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;

  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;
  color-scheme: light dark;
  color: var(--text);
  background: var(--bg);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  @media (max-width: 1024px) {
    font-size: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --text: #9ca3af;
    --text-h: #f3f4f6;
    --bg: #16171d;
    --border: #2e303a;
    --code-bg: #1f2028;
    --accent: #c084fc;
    --accent-bg: rgba(192, 132, 252, 0.15);
    --accent-border: rgba(192, 132, 252, 0.5);
    --social-bg: rgba(47, 48, 58, 0.5);
    --shadow:
      rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px;
  }

  #social .button-icon {
    filter: invert(1) brightness(2);
  }
}

#root {
  width: 100%;
  max-width: none;
  margin: 0;
  text-align: left;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

body {
  margin: 0;
}

h1,
h2 {
  font-family: var(--heading);
  font-weight: 500;
  color: var(--text-h);
}

h1 {
  font-size: 56px;
  letter-spacing: -1.68px;
  margin: 32px 0;
  @media (max-width: 1024px) {
    font-size: 36px;
    margin: 20px 0;
  }
}
h2 {
  font-size: 24px;
  line-height: 118%;
  letter-spacing: -0.24px;
  margin: 0 0 8px;
  @media (max-width: 1024px) {
    font-size: 20px;
  }
}
p {
  margin: 0;
}

code,
.counter {
  font-family: var(--mono);
  display: inline-flex;
  border-radius: 4px;
  color: var(--text-h);
}

code {
  font-size: 15px;
  line-height: 135%;
  padding: 4px 8px;
  background: var(--code-bg);
}

14.) main.tsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

