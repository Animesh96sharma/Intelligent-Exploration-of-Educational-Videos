import { Fragment, useMemo } from 'react'
import type { CollectionAnalysisRecord, VideoRecord } from '../types/video'
import { buildSimilarityRecords } from '../lib/analytics'
import SimilarityMatrixCanvas from './SimilarityMatrixCanvas'
import TopicHeatmap from './TopicHeatmap'
import ConceptCluster from './ConceptCluster'
import ConceptWeightCluster from './ConceptWeightCluster'

type CollectionAnalysisProps = {
  analysis: CollectionAnalysisRecord
  videos: VideoRecord[]
  onOpenVideo: (videoId: string) => void
  onToggleCompareVideo: (videoId: string) => void
  onSelectConcept: (concept: string | null) => void
  selectedConcept: string | null
  onOpenComparison: (videoId?: string) => void
}

function formatMinutes(seconds: number) {
  return `${Math.round(seconds / 60)} min`
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
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
  const safeVideos = useMemo(
    () =>
      videos.map((video) => ({
        ...video,
        keyConcepts: ensureStringArray(video.keyConcepts),
        chapters: Array.isArray(video.chapters) ? video.chapters : [],
      })),
    [videos],
  )

  const visibleVideoIds = useMemo(
    () => new Set(safeVideos.map((video) => video.id)),
    [safeVideos],
  )

  const totalDuration = useMemo(
    () => safeVideos.reduce((sum, video) => sum + video.duration, 0),
    [safeVideos],
  )

  const domains = useMemo(
    () =>
      Array.from(
        new Set(
          safeVideos
            .map((video) => video.domain)
            .filter((domain): domain is string => typeof domain === 'string' && domain.length > 0),
        ),
      ),
    [safeVideos],
  )

  const suggestedOrder = useMemo(
    () =>
      (analysis.overview?.suggestedviewingorder ?? []).filter(
        (item) => item?.videoid && visibleVideoIds.has(item.videoid),
      ),
    [analysis, visibleVideoIds],
  )

  const commonConceptEntries = useMemo(
    () =>
      Object.entries(analysis.commonConcepts ?? {})
        .map(([concept, videoIds]) => {
          const filteredIds = (Array.isArray(videoIds) ? videoIds : []).filter((videoId) =>
            visibleVideoIds.has(videoId),
          )
          return [concept, filteredIds] as const
        })
        .filter(([, videoIds]) => videoIds.length > 0)
        .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])),
    [analysis, visibleVideoIds],
  )

  const uniqueConceptEntries = useMemo(
    () =>
      Object.entries(analysis.uniqueConcepts ?? {})
        .filter(([videoId]) => visibleVideoIds.has(videoId))
        .sort((a, b) => (b[1]?.uniqueconcepts?.length ?? 0) - (a[1]?.uniqueconcepts?.length ?? 0)),
    [analysis, visibleVideoIds],
  )

  const similarityRecords = useMemo(() => {
    try {
      return buildSimilarityRecords(safeVideos)
    } catch (error) {
      console.error('CollectionAnalysis similarity error:', error, safeVideos)
      return []
    }
  }, [safeVideos])

  const similarityMatrix = useMemo(() => {
    const map = new Map<string, { score: number; sharedConcepts: string[] }>()

    similarityRecords.forEach((record) => {
      map.set(`${record.sourceVideoId}::${record.targetVideoId}`, {
        score: record.score,
        sharedConcepts: record.sharedConcepts,
      })
      map.set(`${record.targetVideoId}::${record.sourceVideoId}`, {
        score: record.score,
        sharedConcepts: record.sharedConcepts,
      })
    })

    return map
  }, [similarityRecords])

  const highestOverlapPair = useMemo(() => similarityRecords[0] ?? null, [similarityRecords])

  const mostSharedConcept = commonConceptEntries[0] ?? null
  const mostUniqueVideo = uniqueConceptEntries[0] ?? null
  const suggestedStart = suggestedOrder[0] ?? null

  const visibleCount = safeVideos.length
  const totalCollectionCount = analysis.totalVideos

  if (safeVideos.length === 0) {
  return (
    <section className="collection-page">
      <div className="page-intro">
        <div className="page-intro-copy">
          <h2>
            Collection analysis across Educational videos
          </h2>
          <p>
            This page supports the collection-level analysis through shared concepts, similarity
            patterns, topic coverage, and guided learning flow across the available educational
            videos.
          </p>
          <p className="section-note">
            No videos match the current filter. Clear or adjust the active search,
            concept, and filter settings to explore collection-level analysis again.
          </p>
        </div>
      </div>
    </section>
  )
}

return (
  <section className="collection-page">

      <div className="page-intro-copy">
        <h2>
          Collection analysis across Educational videos
        </h2>
        <p>
            This page supports the collection-level analysis through shared concepts, similarity
            patterns, topic coverage, and guided learning flow across the available educational
            videos.
        </p>
        {selectedConcept ? (
          <div className="active-concept-banner">
            <span>
              Filtering by concept: <strong>{selectedConcept}</strong>
            </span>
            <button type="button" className="secondary-btn" onClick={() => onSelectConcept(null)}>
              Clear filter
            </button>
          </div>
        ) : null}
      </div>

    {/* keep the rest of the component unchanged */}

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Filtered Videos</span>
          <strong>{visibleCount}</strong>
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

      <section className="panel">
        <div className="results-head">
          <h3>✦ Some Highlighted signals from selected videos</h3>
        </div>

        <div className="insight-band">
          <article className="insight-tile">
            <span className="eyebrow">Most shared concept</span>
            <strong>{mostSharedConcept?.[0] ?? 'Not available'}</strong>
            <p>
              {mostSharedConcept
                ? `${mostSharedConcept[1].length} videos reference this concept.`
                : 'No shared concept is available for the current selection.'}
            </p>
          </article>

          <article className="insight-tile">
            <span className="eyebrow">Most unique video</span>
            <strong>{mostUniqueVideo?.[1]?.videotitle ?? 'Not available'}</strong>
            <p>
              {mostUniqueVideo
                ? `${mostUniqueVideo[1]?.uniqueconcepts?.length ?? 0} unique concepts stand out in this video.`
                : 'No unique concept profile is available.'}
            </p>
          </article>

          <article className="insight-tile">
            <span className="eyebrow">Highest overlap pair</span>
            <strong>
              {highestOverlapPair
                ? `${formatPercent(highestOverlapPair.score)} similarity`
                : 'Not available'}
            </strong>
            <p>
              {highestOverlapPair
                ? `${safeVideos.find((video) => video.id === highestOverlapPair.sourceVideoId)?.title ?? highestOverlapPair.sourceVideoId} ↔ ${safeVideos.find((video) => video.id === highestOverlapPair.targetVideoId)?.title ?? highestOverlapPair.targetVideoId}`
                : 'No pairwise overlap is available for the visible set.'}
            </p>
          </article>

          <article className="insight-tile">
            <span className="eyebrow">Suggested starting video</span>
            <strong>
              {suggestedStart
                ? safeVideos.find((video) => video.id === suggestedStart.videoid)?.title ??
                  suggestedStart.videoid
                : 'Not available'}
            </strong>
            <p>{suggestedStart?.reason ?? 'No guided entry point is available.'}</p>
          </article>
        </div>
      </section>

      <div className="collection-layout collection-layout--visual">
        <div className="collection-main">
          {analysis.overview ? (
            <section>

              {analysis.overview.collectionsummary ? <p>{analysis.overview.collectionsummary}</p> : null}

              {Array.isArray(analysis.overview.mainthemes) && analysis.overview.mainthemes.length > 0 ? (
                <>
                  <h4>Main themes</h4>
                  <div className="chip-group">
                    {analysis.overview.mainthemes.map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        className={`chip ${selectedConcept === theme ? 'active' : ''}`}
                        onClick={() => onSelectConcept(theme)}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {analysis.overview.difficultyprogression ? (
                <>
                  <h4>Difficulty progression</h4>
                  <p>{analysis.overview.difficultyprogression}</p>
                </>
              ) : null}

              {analysis.overview.targetaudience ? (
                <>
                  <h4>Target audience</h4>
                  <p>{analysis.overview.targetaudience}</p>
                </>
              ) : null}
            </section>
          ) : null}

          <section className="panel">
            <div className="results-head">
              <h3>💬 Topics/Key-concepts Clustering</h3>
            </div>
            <ConceptWeightCluster
              videos={safeVideos}
              onSelectConcept={onSelectConcept}
              selectedConcept={selectedConcept}
            />
          </section>

          <section className="panel">
            <div className="results-head">
              <h3>⿻ Pairwise similarity amongst videos</h3>
            </div>

            <SimilarityMatrixCanvas
              videos={safeVideos}
              similarityMatrix={similarityMatrix}
              onOpenVideo={onOpenVideo}
              onToggleCompareVideo={onToggleCompareVideo}
              onOpenComparison={onOpenComparison}
            />
          </section>

          <section className="panel">
            <div className="results-head">
              <h3>📈 Topic coverage heatmap</h3>
            </div>

            <TopicHeatmap
              videos={safeVideos}
              onOpenVideo={onOpenVideo}
              onSelectConcept={onSelectConcept}
              selectedConcept={selectedConcept}
            />
          </section>

          <section className="panel">
            <div className="results-head">
              <h3>Shared concept board</h3>
              <span>Concept-to-video mapping</span>
            </div>

            {commonConceptEntries.length === 0 ? (
              <p>No shared concepts are available for the currently visible videos.</p>
            ) : (
              <div className="concept-board">
                {commonConceptEntries.map(([concept, videoIds]) => (
                  <article key={concept} className="concept-board-card">
                    <div className="concept-board-meta">
                      <button
                        type="button"
                        className={`chip concept-chip ${selectedConcept === concept ? 'active' : ''}`}
                        onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                      >
                        {concept}
                      </button>
                      <span>{videoIds.length} videos</span>
                    </div>

                    <div className="concept-board-videos">
                      {videoIds.map((videoId) => {
                        const video = safeVideos.find((item) => item.id === videoId)
                        if (!video) return null

                        return (
                          <div key={videoId} className="concept-video-pill">
                            <div>
                              <strong>{video.title}</strong>
                              <span>{video.domain ?? 'General'}</span>
                            </div>

                            <div className="related-cardactions">
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
                        )
                      })}
                    </div>

                    {videoIds.length >= 2 ? (
                      <button className="secondary-btn" onClick={() => onOpenComparison()}>
                        Open comparison workspace
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>

          
        </div>
        <aside className="collection-sidebar">
          <section className="panel">
            <h3>🗂️ Domains</h3>
            {domains.length === 0 ? (
              <p>No domains are visible with the current filters.</p>
            ) : (
              <div className="chip-group">
                {domains.map((domain) => (
                  <span key={domain} className="chip static">
                    {domain}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="results-head">
              <h3>🎯 Suggested learning path</h3>
            </div>

            {suggestedOrder.length === 0 ? (
              <p>No recommended sequence is available for the current filtered set.</p>
            ) : (
              <div className="learning-path">
                {suggestedOrder.map((item, index) => {
                  const video = safeVideos.find((v) => v.id === item.videoid)

                  return (
                    <article key={item.videoid} className="learning-step">
                      <div className="learning-stepmarker">
                        <span>{index + 1}</span>
                      </div>

                      <div className="learning-stepcontent">
                        <strong>{video?.title ?? item.videoid}</strong>
                        <p>{item.reason}</p>
                        <div className="related-cardactions">
                          <button className="secondary-btn" onClick={() => onToggleCompareVideo(item.videoid)}>
                            Compare
                          </button>
                          <button className="primary-btn" onClick={() => onOpenVideo(item.videoid)}>
                            Open
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>



          
        </aside>
      </div>
    </section>
  )
}