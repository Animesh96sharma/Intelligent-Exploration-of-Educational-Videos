import { Fragment, useMemo } from 'react'
import type { CollectionAnalysisRecord, VideoRecord } from '../types/video'
import { buildSimilarityRecords } from '../lib/analytics'

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

function getHeatColor(intensity: number) {
  const alpha = 0.08 + intensity * 0.6
  return `rgba(37, 99, 235, ${alpha})`
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

  const topConceptColumns = useMemo(
    () => commonConceptEntries.slice(0, 8).map(([concept]) => concept),
    [commonConceptEntries],
  )

  const topicCoverageRows = useMemo(
    () =>
      safeVideos.map((video) => {
        const normalized = new Set(
          ensureStringArray(video.keyConcepts).map((concept) => concept.toLowerCase()),
        )

        const cells = topConceptColumns.map((concept) => ({
          concept,
          present: normalized.has(concept.toLowerCase()),
          intensity: normalized.has(concept.toLowerCase()) ? 1 : 0,
        }))

        return { video, cells }
      }),
    [safeVideos, topConceptColumns],
  )

  const mostSharedConcept = commonConceptEntries[0] ?? null
  const mostUniqueVideo = uniqueConceptEntries[0] ?? null
  const suggestedStart = suggestedOrder[0] ?? null

  const visibleCount = safeVideos.length
  const totalCollectionCount = analysis.totalVideos

  if (safeVideos.length === 0) {
    return (
      <section className="collection-page">
        <div className="collection-hero">
          <div>
            <p className="eyebrow">Collection intelligence</p>
            <h2>No videos match the current filters</h2>
            <p>
              Clear or adjust the active search, concept, and filter settings to explore
              collection-level analysis again.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="collection-page">
      <div className="collection-hero">
        <div>
          <p className="eyebrow">Collection intelligence</p>
          <h2>Cross-video themes, overlap patterns, and guided learning flow</h2>
          <p>
            Explore pairwise similarity, topic coverage, shared concepts, and the recommended
            viewing path derived from the processed collection analysis outputs.
          </p>
          <p className="section-note">
            Showing analysis for {visibleCount} visible video{visibleCount === 1 ? '' : 's'} out of{' '}
            {totalCollectionCount}.
          </p>
        </div>

        <div className="hero-actions">
          {selectedConcept ? (
            <button className="secondary-btn" onClick={() => onSelectConcept(null)}>
              Clear concept filter
            </button>
          ) : null}
        </div>
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

      <section className="panel">
        <div className="results-head">
          <h3>Collection signals</h3>
          <span>Fast demo-ready insights</span>
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
            <section className="panel">
              <div className="results-head">
                <h3>Overview</h3>
                <span>Collection summary</span>
              </div>

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
              <h3>Pairwise similarity matrix</h3>
              <span>
                {safeVideos.length} × {safeVideos.length} scan
              </span>
            </div>

            <div className="matrix-wrap">
              <div
                className="similarity-matrix"
                style={{
                  gridTemplateColumns: `180px repeat(${safeVideos.length}, minmax(72px, 1fr))`,
                }}
              >
                <div className="matrix-corner">Videos</div>

                {safeVideos.map((video) => (
                  <div key={`col-${video.id}`} className="matrix-label matrix-label--top" title={video.title}>
                    <button type="button" className="inline-link" onClick={() => onOpenVideo(video.id)}>
                      {video.title}
                    </button>
                  </div>
                ))}

                {safeVideos.map((rowVideo) => (
                  <FragmentRow
                    key={rowVideo.id}
                    rowVideo={rowVideo}
                    videos={safeVideos}
                    similarityMatrix={similarityMatrix}
                    onOpenVideo={onOpenVideo}
                    onToggleCompareVideo={onToggleCompareVideo}
                    onOpenComparison={onOpenComparison}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="results-head">
              <h3>Topic coverage heatmap</h3>
              <span>{topConceptColumns.length} major shared concepts</span>
            </div>

            {topConceptColumns.length === 0 ? (
              <p>No concept coverage map is available for the current filtered set.</p>
            ) : (
              <div className="heatmap-wrap">
                <div
                  className="topic-heatmap"
                  style={{
                    gridTemplateColumns: `220px repeat(${topConceptColumns.length}, minmax(74px, 1fr))`,
                  }}
                >
                  <div className="matrix-corner">Videos</div>

                  {topConceptColumns.map((concept) => (
                    <button
                      key={`heat-col-${concept}`}
                      type="button"
                      className={`matrix-label matrix-label--top heatmap-concept ${
                        selectedConcept === concept ? 'active' : ''
                      }`}
                      onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                    >
                      {concept}
                    </button>
                  ))}

                  {topicCoverageRows.map(({ video, cells }) => (
                    <Fragment key={video.id}>
                      <div className="matrix-label matrix-label--side">
                        <button type="button" className="inline-link" onClick={() => onOpenVideo(video.id)}>
                          {video.title}
                        </button>
                      </div>

                      {cells.map((cell) => (
                        <button
                          key={`${video.id}-${cell.concept}`}
                          type="button"
                          className={`heatmap-cell ${cell.present ? 'present' : ''} ${
                            selectedConcept === cell.concept ? 'active' : ''
                          }`}
                          style={{
                            background: cell.present
                              ? getHeatColor(cell.intensity)
                              : 'rgba(148, 163, 184, 0.08)',
                          }}
                          onClick={() =>
                            onSelectConcept(selectedConcept === cell.concept ? null : cell.concept)
                          }
                          title={`${video.title} · ${cell.concept} · ${
                            cell.present ? 'Present' : 'Not highlighted'
                          }`}
                        >
                          {cell.present ? '•' : ''}
                        </button>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
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

          <section className="panel">
            <div className="results-head">
              <h3>Unique concepts by video</h3>
              <span>Differentiating signals</span>
            </div>

            {uniqueConceptEntries.length === 0 ? (
              <p>No unique concept breakdown is available for the current selection.</p>
            ) : (
              <div className="collection-unique-grid">
                {uniqueConceptEntries.map(([videoId, group]) => {
                  const video = safeVideos.find((item) => item.id === videoId)
                  if (!video) return null

                  return (
                    <article key={videoId} className="unique-video-card">
                      <div className="node-cardhead">
                        <div>
                          <p className="eyebrow">{video.domain ?? 'General'}</p>
                          <h4>{group?.videotitle || video.title}</h4>
                        </div>
                        <span>{group?.uniqueconcepts?.length ?? 0} unique concepts</span>
                      </div>

                      <div className="chip-group compact">
                        {(group?.uniqueconcepts ?? []).slice(0, 8).map((concept) => (
                          <button
                            key={concept}
                            type="button"
                            className={`chip ${selectedConcept === concept ? 'active' : ''}`}
                            onClick={() => onSelectConcept(selectedConcept === concept ? null : concept)}
                          >
                            {concept}
                          </button>
                        ))}
                        {(group?.uniqueconcepts?.length ?? 0) > 8 ? (
                          <span className="chip muted">
                            +{(group?.uniqueconcepts?.length ?? 0) - 8} more
                          </span>
                        ) : null}
                      </div>

                      <div className="node-cardactions">
                        <span>
                          {formatMinutes(video.duration)} · {video.chapters.length} chapters
                        </span>
                        <button className="secondary-btn" onClick={() => onToggleCompareVideo(videoId)}>
                          Compare
                        </button>
                        <button className="inline-link" onClick={() => onOpenVideo(videoId)}>
                          Open video
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="collection-sidebar">
          <section className="panel">
            <div className="results-head">
              <h3>Suggested learning path</h3>
              <span>Pedagogical sequence</span>
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

          <section className="panel">
            <h3>Domains</h3>
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
            <h3>Collection cues</h3>
            <ul className="clean-list">
              <li>Use the matrix to identify the strongest pairwise overlaps.</li>
              <li>Use the heatmap to scan which concepts are distributed across the set.</li>
              <li>Use the learning path to present a recommended progression story.</li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  )
}

type FragmentRowProps = {
  rowVideo: VideoRecord
  videos: VideoRecord[]
  similarityMatrix: Map<string, { score: number; sharedConcepts: string[] }>
  onOpenVideo: (videoId: string) => void
  onToggleCompareVideo: (videoId: string) => void
  onOpenComparison: (videoId?: string) => void
}

function FragmentRow({
  rowVideo,
  videos,
  similarityMatrix,
  onOpenVideo,
  onToggleCompareVideo,
  onOpenComparison,
}: FragmentRowProps) {
  return (
    <>
      <div className="matrix-label matrix-label--side">
        <button type="button" className="inline-link" onClick={() => onOpenVideo(rowVideo.id)}>
          {rowVideo.title}
        </button>
      </div>

      {videos.map((columnVideo) => {
        const isSame = rowVideo.id === columnVideo.id
        const pair = similarityMatrix.get(`${rowVideo.id}::${columnVideo.id}`)
        const score = pair?.score ?? 0
        const sharedConcepts = pair?.sharedConcepts ?? []

        return (
          <button
            key={`${rowVideo.id}-${columnVideo.id}`}
            type="button"
            className={`matrix-cell ${isSame ? 'matrix-cell--self' : ''}`}
            style={{
              background: isSame ? 'rgba(15, 23, 42, 0.06)' : getHeatColor(score),
            }}
            title={
              isSame
                ? `${rowVideo.title}`
                : `${rowVideo.title} ↔ ${columnVideo.title} · ${Math.round(score * 100)}% similarity${
                    sharedConcepts.length ? ` · ${sharedConcepts.join(', ')}` : ''
                  }`
            }
            onClick={() => {
              if (isSame) {
                onOpenVideo(rowVideo.id)
                return
              }
              onToggleCompareVideo(rowVideo.id)
              onToggleCompareVideo(columnVideo.id)
              onOpenComparison()
            }}
          >
            {isSame ? '—' : `${Math.round(score * 100)}%`}
          </button>
        )
      })}
    </>
  )
}