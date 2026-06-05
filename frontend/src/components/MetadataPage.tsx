export default function MetadataPage() {
  return (
    <section className="metadata-page">
      <div className="panel">
        <p className="eyebrow">Metadata</p>
        <h2>Dataset and research foundation</h2>
        <p>
          The prototype uses educational and scientific video material from the
          TIB AV-Portal as the primary data source.
        </p>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Primary Repository</span>
          <strong>TIB AV-Portal</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Segmentation Basis</span>
          <strong>Chapter-Llama</strong>
        </article>

        <article className="stat-card">
          <span className="stat-label">Research Area</span>
          <strong>Visual Analytics</strong>
        </article>
      </div>

      <section className="panel">
        <h3>Data source</h3>
        <p>
          TIB AV-Portal (av.tib.eu) is used as the scientific video repository
          for the demonstration dataset and exploration workflow.
        </p>
      </section>

      <section className="panel">
        <h3>Methodological foundation</h3>
        <p>
          The interface concept is grounded in automatic chaptering,
          multi-granularity summarization, and visual analytics principles for
          interactive exploration and comparison.
        </p>
      </section>

      <section className="panel">
        <h3>Prototype scope</h3>
        <p>
          This demonstration focuses on educational video exploration, concept
          discovery, chapter-aware summaries, and collection-level comparison
          rather than a production deployment.
        </p>
      </section>
    </section>
  );
}