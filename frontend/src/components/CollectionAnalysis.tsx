import { useMemo } from 'react'
import type { CollectionAnalysisRecord, VideoRecord } from '../types/video'
import { buildSimilarityRecords } from '../lib/analytics'
import SimilarityMatrixCanvas from './SimilarityMatrixCanvas'
import TopicHeatmap from './TopicHeatmap'
import ConceptWeightCluster from './ConceptWeightCluster'

type CollectionAnalysisProps = {
  analysis: CollectionAnalysisRecord
  videos: VideoRecord[]
  onOpenVideo: (videoId: string) => void
  onToggleCompareVideo: (videoId: string) => void
  onSelectConcept: (concept: string | null) => void
  selectedConcept: string | null
  onOpenComparison: (videoId?: string) => void
  comparisonVideoIds: string[]
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
  comparisonVideoIds = [],
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
      (analysis.overview?.suggested_viewing_order ?? []).filter(
        (item: { video_id?: string; reason?: string }) =>
          item?.video_id && visibleVideoIds.has(item.video_id),
      ),
    [analysis, visibleVideoIds],
  )

  // Shared concept entries - filtered to concepts with more than one video
  const commonConceptEntries = useMemo(
    () =>
      Object.entries(analysis.commonConcepts ?? {})
        .map(([concept, videoIds]) => {
          const filteredIds = (Array.isArray(videoIds) ? videoIds : []).filter((videoId) =>
            visibleVideoIds.has(videoId),
          )
          return [concept, filteredIds] as const
        })
        .filter(([, videoIds]) => videoIds.length > 1)
        .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])),
    [analysis, visibleVideoIds],
  )

  const uniqueConceptEntries = useMemo(
    () =>
      Object.entries(analysis.uniqueConcepts ?? {})
        .filter(([videoId]) => visibleVideoIds.has(videoId))
        .sort(
          (a, b) =>
            (b[1]?.unique_concepts?.length ?? 0) - (a[1]?.unique_concepts?.length ?? 0),
        ),
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

  // In case of no Video
  if (safeVideos.length === 0) {
    return (
      <section className="w-full max-w-full mx-auto flex flex-col gap-5 px-4 sm:px-0">
        <div className="bg-gradient-to-br from-white to-[#f8fafc] border border-[#d9e2ec] shadow-[0_18px_40px_rgba(15,23,42,0.08)] rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 flex justify-between gap-5 items-start">
          <div className="text-[#0f172a]">
            <h2 className="text-[#0f172a] my-2 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.1] tracking-[-0.03em]">
              Collection analysis across Educational videos
            </h2>
            <p className="text-[#334155] text-sm sm:text-base">
              This page supports the collection-level analysis through shared concepts, similarity
              patterns, topic coverage, and guided learning flow across the available educational
              videos.
            </p>
            <p className="mt-3 text-[0.85rem] sm:text-[0.92rem] text-[#64748b]">
              No videos match the current filter. Clear or adjust the active search, concept, and
              filter settings to explore collection-level analysis again.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Default- All videos are available
  return (
    <section className="w-full max-w-full mx-auto flex flex-col gap-4 sm:gap-5 px-4 sm:px-0">

      {/* Page intro */}
      <div className="bg-gradient-to-br from-white to-[#f8fafc] border border-[#d9e2ec] shadow-[0_18px_40px_rgba(15,23,42,0.08)] rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 text-[#0f172a]">
        <h2 className="text-[#0f172a] my-2 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.1] tracking-[-0.03em]">
          Collection analysis across Educational videos
        </h2>
        <p className="text-[#334155] text-sm sm:text-base">
          This page supports the collection-level analysis through shared concepts, similarity
          patterns, topic coverage, and guided learning flow across the available educational
          videos.
        </p>

        {selectedConcept ? (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="text-[0.85rem] sm:text-[0.92rem] text-[#334155]">
              Filtering by concept: <strong className="text-[#0f172a]">{selectedConcept}</strong>
            </span>
            <button
              type="button"
              className="border border-black rounded-[14px] bg-white text-black px-4 py-2 text-sm font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-[#f8f8f8] transition-all duration-[180ms]"
              onClick={() => onSelectConcept(null)}
            >
              Clear filter
            </button>
          </div>
        ) : null}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-[14px]">
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">
            Filtered Videos
          </span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{visibleCount}</strong>
        </article>
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">
            Shared Concepts
          </span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">
            {commonConceptEntries.length}
          </strong>
        </article>
        <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">
            Domains
          </span>
          <strong className="text-[1.4rem] sm:text-[1.6rem] leading-tight tracking-tight">{domains.length}</strong>
        </article>
      </div>

      {/* Insight highlights panel */}
      <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
        <div className="flex justify-between gap-3 mb-4">
          <h3 className="m-0 text-[0.98rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">
            ✦ Some Highlighted signals from selected videos
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-[14px]">
          <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
            <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">
              Most shared concept
            </span>
            <strong className="text-[0.95rem] leading-[1.35]">
              {mostSharedConcept?.[0] ?? 'Not available'}
            </strong>
            <p className="text-[#334155] m-0 text-sm">
              {mostSharedConcept
                ? `${mostSharedConcept[1].length} videos reference this concept.`
                : 'No shared concept is available for the current selection.'}
            </p>
          </article>

          <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
            <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">
              Most unique video
            </span>
            <strong className="text-[0.95rem] leading-[1.35]">
              {mostUniqueVideo?.[1]?.video_title ?? 'Not available'}
            </strong>
            <p className="text-[#334155] m-0 text-sm">
              {mostUniqueVideo
                ? `${mostUniqueVideo[1]?.unique_concepts?.length ?? 0} unique concepts stand out in this video.`
                : 'No unique concept profile is available.'}
            </p>
          </article>

          <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
            <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">
              Highest overlap pair
            </span>
            <strong className="text-[0.95rem] leading-[1.35]">
              {highestOverlapPair
                ? `${formatPercent(highestOverlapPair.score)} similarity`
                : 'Not available'}
            </strong>
            <p className="text-[#334155] m-0 text-sm">
              {highestOverlapPair
                ? `${safeVideos.find((v) => v.id === highestOverlapPair.sourceVideoId)?.title ?? highestOverlapPair.sourceVideoId} ↔ ${safeVideos.find((v) => v.id === highestOverlapPair.targetVideoId)?.title ?? highestOverlapPair.targetVideoId}`
                : 'No pairwise overlap is available for the visible set.'}
            </p>
          </article>

          <article className="bg-gradient-to-b from-[#f8fafc] to-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 flex flex-col gap-2">
            <span className="text-[0.72rem] font-extrabold tracking-[0.1em] uppercase text-[#0f172a]">
              Suggested starting video
            </span>
            <strong className="text-[0.95rem] leading-[1.35]">
              {suggestedStart
                ? safeVideos.find((v) => v.id === suggestedStart.video_id)?.title ??
                  suggestedStart.video_id
                : 'Not available'}
            </strong>
            <p className="text-[#334155] m-0 text-sm">
              {suggestedStart?.reason ?? 'No guided entry point is available.'}
            </p>
          </article>
        </div>
      </section>

      {/* Main layout: Left: main visualization grids + right:sidebar with other informations */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4 sm:gap-5 items-start">

        {/* Main column */}
        <div className="flex flex-col gap-4 sm:gap-5 min-w-0">

          {/* Concept clustering */}
          <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] overflow-x-auto">
            <div className="flex justify-between gap-3 mb-4">
              <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">
                💬 Topics/Key-concepts Clustering
              </h3>
            </div>
            <ConceptWeightCluster
              videos={safeVideos}
              onSelectConcept={onSelectConcept}
              selectedConcept={selectedConcept}
            />
          </section>

          {/* Similarity matrix */}
          <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] overflow-x-auto">
            <div className="flex justify-between gap-3 mb-4">
              <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">
                ⿻ Pairwise similarity amongst videos
              </h3>
            </div>
            <SimilarityMatrixCanvas
              videos={safeVideos}
              similarityMatrix={similarityMatrix}
              onOpenVideo={onOpenVideo}
              onToggleCompareVideo={onToggleCompareVideo}
              onOpenComparison={onOpenComparison}
            />
          </section>

          {/* Topic heatmap */}
          <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] overflow-x-auto">
            <div className="flex justify-between gap-3 mb-4">
              <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">
                📈 Topic coverage heatmap
              </h3>
            </div>
            <TopicHeatmap
              videos={safeVideos}
              onOpenVideo={onOpenVideo}
              onSelectConcept={onSelectConcept}
              selectedConcept={selectedConcept}
            />
          </section>

          {/* Shared concept board (hidden on mobile) */}
          <section className="hidden sm:block bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <div className="flex justify-between items-center gap-3 mb-4">
              <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">
                Shared concept board
              </h3>
              <span className="text-[0.8rem] text-[#64748b]">Concept-to-video mapping</span>
            </div>

            {commonConceptEntries.length === 0 ? (
              <p className="text-[#334155] m-0 text-sm">
                No shared concepts with more than one video are available for the currently visible videos.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#e8eef5]">
                      <th className="text-left py-2 pr-3 font-bold text-[#0f172a] w-[220px]">
                        Shared concept
                      </th>
                      <th className="text-left py-2 px-3 font-bold text-[#0f172a]">
                        Video
                      </th>
                      <th className="text-right py-2 pl-3 font-bold text-[#0f172a] w-[200px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {commonConceptEntries.map(([concept, videoIds]) =>
                      videoIds.map((videoId, idx) => {
                        const video = safeVideos.find((item) => item.id === videoId)
                        if (!video) return null

                        const isCompared = comparisonVideoIds.includes(videoId)

                        return (
                          <tr
                            key={`${concept}-${videoId}`}
                            className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]"
                          >
                            {idx === 0 ? (
                              <td
                                className="py-3 pr-3 align-top"
                                rowSpan={videoIds.length}
                              >
                                <button
                                  type="button"
                                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border transition-all duration-[180ms] cursor-pointer ${
                                    selectedConcept === concept
                                      ? 'bg-black text-white border-black'
                                      : 'bg-[#f3f4f6] text-[#0f172a] border-[#d9e2ec] hover:-translate-y-px'
                                  }`}
                                  onClick={() =>
                                    onSelectConcept(selectedConcept === concept ? null : concept)
                                  }
                                >
                                  {concept}
                                </button>
                                <div className="text-[0.72rem] text-[#64748b] mt-1">
                                  {videoIds.length} videos
                                </div>
                              </td>
                            ) : null}

                            <td className="py-3 px-3 align-top">
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <strong className="text-[0.85rem] text-[#0f172a]">
                                  {video.title}
                                </strong>
                                <span className="text-[0.75rem] text-[#64748b]">
                                  {video.domain ?? 'General'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 pl-3 align-top text-right">
                              <div className="flex gap-2 justify-end flex-wrap">
                                <button
                                  className={`border rounded-[12px] px-3 py-1.5 text-[0.78rem] font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-[180ms] ${
                                    isCompared
                                      ? 'border-black bg-black text-white hover:bg-[#111]'
                                      : 'border-black bg-white text-black hover:bg-[#f8f8f8]'
                                  }`}
                                  onClick={() => onToggleCompareVideo(videoId)}
                                >
                                  {isCompared ? 'Remove' : 'Compare'}
                                </button>
                                <button
                                  className="border border-black rounded-[12px] bg-black text-white px-3 py-1.5 text-[0.78rem] font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] hover:bg-[#111] transition-all duration-[180ms]"
                                  onClick={() => onOpenVideo(videoId)}
                                >
                                  Open
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
         </div> 

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 sm:gap-5 min-w-0">

          {/* Collection overview */}
          {analysis.overview ? (
            <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              {analysis.overview.collection_summary ? (
                <p className="text-[#334155] m-0 mb-3 text-sm sm:text-base">{analysis.overview.collection_summary}</p>
              ) : null}

              {Array.isArray(analysis.overview.main_themes) &&
              analysis.overview.main_themes.length > 0 ? (
                <>
                  <h4 className="m-0 mb-2 text-[0.9rem] font-bold tracking-[-0.01em]">
                    Main themes
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {analysis.overview.main_themes.map((theme: string) => (
                      <button
                        key={theme}
                        type="button"
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-[0.8rem] font-semibold border transition-all duration-[180ms] cursor-pointer ${
                          selectedConcept === theme
                            ? 'bg-black text-white border-black'
                            : 'bg-[#f3f4f6] text-[#0f172a] border-[#d9e2ec] hover:-translate-y-px'
                        }`}
                        onClick={() => onSelectConcept(theme)}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {analysis.overview.difficulty_progression ? (
                <>
                  <h4 className="m-0 mb-2 text-[0.9rem] font-bold tracking-[-0.01em]">
                    Difficulty progression
                  </h4>
                  <p className="text-[#334155] m-0 mb-3 text-sm">
                    {analysis.overview.difficulty_progression}
                  </p>
                </>
              ) : null}

              {analysis.overview.target_audience ? (
                <>
                  <h4 className="m-0 mb-2 text-[0.9rem] font-bold tracking-[-0.01em]">
                    Target audience
                  </h4>
                  <p className="text-[#334155] m-0 text-sm">{analysis.overview.target_audience}</p>
                </>
              ) : null}
            </section>
          ) : null}

          {/* Domains */}
          <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <h3 className="m-0 mb-3 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">🗂️ Domains</h3>
            {domains.length === 0 ? (
              <p className="text-[#334155] m-0 text-sm">
                No domains are visible with the current filters.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {domains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-[0.78rem] font-semibold border border-[#d9e2ec] bg-[#f3f4f6] text-[#0f172a] cursor-default"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Suggested learning path */}
          <section className="bg-white border border-[#e8eef5] rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <div className="flex justify-between gap-3 mb-4">
              <h3 className="m-0 text-[0.95rem] sm:text-[1.05rem] font-bold tracking-[-0.02em]">
                🎯 Suggested learning path
              </h3>
            </div>

            {suggestedOrder.length === 0 ? (
              <p className="text-[#334155] m-0 text-sm">
                No recommended sequence is available for the current filtered set.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {suggestedOrder.map(
                  (item: { video_id?: string; reason?: string }, index: number) => {
                    const video = safeVideos.find((v) => v.id === item.video_id)

                    return (
                      <article key={item.video_id} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-[0.75rem] font-bold">
                          <span>{index + 1}</span>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                          <strong className="text-[0.85rem] text-[#0f172a] leading-snug">
                            {video?.title ?? item.video_id}
                          </strong>
                          <p className="text-[0.78rem] text-[#334155] m-0">{item.reason}</p>
                          <div className="flex gap-2 flex-wrap mt-1">
                            <button
                              className={`border rounded-[12px] px-3 py-1.5 text-[0.78rem] font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-[180ms] ${
                                isCompared
                                  ? 'border-black bg-black text-white hover:bg-[#111]'
                                  : 'border-black bg-white text-black hover:bg-[#f8f8f8]'
                              }`}
                              onClick={() => item.video_id && onToggleCompareVideo(item.video_id)}
                            >
                              {isCompared ? 'Remove' : 'Compare'}
                            </button>
                            <button
                              className="border border-black rounded-[12px] bg-black text-white px-3 py-1.5 text-[0.78rem] font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] hover:bg-[#111] transition-all duration-[180ms]"
                              onClick={() => item.video_id && onOpenVideo(item.video_id)}
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  },
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}