import type { VideoRecord } from "../types/video";

type MetadataPageProps = {
  videos: VideoRecord[];
};

function downloadMetadataJson(videos: VideoRecord[]) {
  const exportData = videos.map((video) => ({
    id: video.id,
    title: video.title,
    author: video.author,
    organization: video.organization,
    domain: video.domain,
    description: video.description,
    mainTopics: video.mainTopics,
    keywords: video.keywords,
    entities: video.entities,
    processingStats: video.processingStats,
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "video-metadata.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function MetadataPage({ videos }: MetadataPageProps) {
  return (
    <section className="metadata-page">
      <section className="panel">
        <div className="stats-grid">
          <a
            href="https://av.tib.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="stat-card"
            style={{ textDecoration: "none", cursor: "pointer" }}
          >
            <span className="stat-label">Data Source</span>
            <strong>TIB AV-Portal</strong>
          </a>
          <article className="stat-card">
            <span className="stat-label">Segmentation Basis</span>
            <strong>Chapter-Llama</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Research Area</span>
            <strong>Visual Analytics</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="results-head">
          <h3>Video-level processed metadata</h3>
          <span>Available {videos.length} videos</span>
        </div>

        {videos.length > 0 && (
          <div className="hero-actions" style={{ marginBottom: "16px" }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => downloadMetadataJson(videos)}
            >
              Download Metadata
            </button>
          </div>
        )}

        {videos.length === 0 ? (
          <p>No processed metadata is available yet.</p>
        ) : (
          <div className="node-grid">
            {videos.map((video) => (
              <article key={video.id} className="node-card">
                <div className="node-card__head">
                  <h4>{video.title}</h4>
                </div>

                {(video.author || video.organization) && (
                  <ul className="meta-list">
                    {video.author && (
                      <li><strong>Author:</strong> {video.author}</li>
                    )}
                    {video.organization && (
                      <li><strong>Organization:</strong> {video.organization}</li>
                    )}
                  </ul>
                )}

                {video.description && <p>{video.description}</p>}

                {video.mainTopics.length > 0 && (
                  <div className="info-block">
                    <h5>Main topics</h5>
                    <div className="chip-group">
                      {video.mainTopics.map((topic) => (
                        <span key={topic} className="chip static">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}