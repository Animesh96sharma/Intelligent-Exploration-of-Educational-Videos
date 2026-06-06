import type { VideoRecord } from '../types/video'

type HomePageProps = {
  videos: VideoRecord[]
  selectedVideoId: string | null
  comparisonVideoIds: string[]
  onOpenVideo: (videoId: string) => void
  onOpenCollection: () => void
  onOpenNetwork: () => void
  onToggleCompareVideo: (videoId: string) => void
  onSelectConcept: (concept: string) => void
}

function formatDuration(seconds: number) {
  return `${Math.round(seconds / 60)} min`
}

function getPreviewLabel(video: VideoRecord) {
  return video.totalChapters
    ? `${video.totalChapters} chapters`
    : 'Preview available'
}

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
            This interface supports search, chapter-based exploration, collection comparison,
            and network-style topic discovery across the processed educational video dataset.
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
            const isSelected = selectedVideoId === video.id
            const isInComparison = comparisonVideoIds.includes(video.id)
            const concepts = video.keyConcepts.slice(0, 3)
            const previewSrc =
              video.thumbnailUrl || video.thumbnail || video.previewImage || video.posterUrl || ''
            const videoSrc = video.videoUrl || video.previewUrl || video.src || ''

            return (
              <article
                key={video.id}
                className={['video-card', isSelected ? 'selected' : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  className="video-cardsurface"
                  onClick={() => onOpenVideo(video.id)}
                >
                  <div className="video-card-thumbnail">
                    {previewSrc ? (
                      <img
                        className="video-card-thumbnail-media"
                        src={previewSrc}
                        alt={`${video.title} preview`}
                        loading="lazy"
                      />
                    ) : videoSrc ? (
                      <video
                        className="video-card-thumbnail-media"
                        src={videoSrc}
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="video-card-thumbnail-fallback">
                        <span>No preview available</span>
                      </div>
                    )}

                    <span className="video-card-thumbnail-overlay">
                      {formatDuration(video.duration)}
                    </span>
                  </div>

                  <div className="video-card-content">
                    <p className="eyebrow">{video.domain ?? 'General'}</p>
                    <h3>{video.title}</h3>

                    <div className="video-card-pills">
                      <span className="meta-pill">{video.speaker ?? 'Unknown speaker'}</span>
                      <span className="meta-pill">{getPreviewLabel(video)}</span>
                      <span className="meta-pill">{video.difficultyLevel ?? 'N/A'}</span>
                    </div>

                    <p className="video-card-summary">{video.summaryShort}</p>

                    {concepts.length > 0 ? (
                      <div className="chip-group compact">
                        {concepts.map((concept) => (
                          <button
                            key={concept}
                            type="button"
                            className="chip concept-chip"
                            onClick={(event) => {
                              event.stopPropagation()
                              onSelectConcept(concept)
                            }}
                          >
                            {concept}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>

                <div className="video-cardactions">
                  <button
                    type="button"
                    className={isInComparison ? 'primary-btn' : 'secondary-btn'}
                    onClick={() => onToggleCompareVideo(video.id)}
                  >
                    {isInComparison ? 'Selected for compare' : 'Compare'}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}