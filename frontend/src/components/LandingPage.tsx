type LandingPageProps = {
  onEnterHomepage: () => void;
  onOpenAbout: () => void;
  onOpenNetwork: () => void;
};

export default function LandingPage({
  onEnterHomepage,
  onOpenAbout,
  onOpenNetwork,
}: LandingPageProps) {
  return (
    <section className="landing-page landing-page--centered">
      <div className="landing-page__inner">
        <div className="landing-title-group">
          <h2 className="landing-title">Intelligent Exploration</h2>
          <h2 className="landing-title-varient">of Educational Videos</h2>

          <h2 className="landing-eyebrow">
            A comprehensive dashboard for exploring educational video collections
            through automatic segmentation, multi-level summarization, and
            interactive visualization
          </h2>

          <div className="landing-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={onEnterHomepage}
            >
              Start Exploring
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={onOpenAbout}
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="landing-card-grid">
          <button
            type="button"
            className="landing-nav-card"
            onClick={onEnterHomepage}
          >
            <span
              className="landing-nav-card__icon landing-nav-card__icon--video"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="6.5" width="12.5" height="11" rx="2.5" />
                <path d="M16 10l4.5-2.5v9L16 14" />
                <circle cx="8.5" cy="11.8" r="1.25" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <h3>Video Exploration</h3>
            <p>
              Navigate videos through chapter-aware browsing, concept discovery,
              and interactive playback entry points.
            </p>
          </button>

          <button
            type="button"
            className="landing-nav-card"
            onClick={onEnterHomepage}
          >
            <span
              className="landing-nav-card__icon landing-nav-card__icon--collection"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5V11.5" />
                <path d="M9 19.5V6.5" />
                <path d="M14 19.5V9.5" />
                <path d="M19 19.5V4.5" />
                <path d="M3 19.5H21" />
              </svg>
            </span>
            <h3>Summaries</h3>
            <p>
              Explore multi-level summaries from short overviews to chapter-based
              and collection-level insights.
            </p>
          </button>

          <button
            type="button"
            className="landing-nav-card"
            onClick={onOpenNetwork}
          >
            <span
              className="landing-nav-card__icon landing-nav-card__icon--network"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="12" r="2.5" />
                <circle cx="17.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
                <path d="M8.2 10.9l6.9-3.2" />
                <path d="M8.2 13.1l6.9 3.2" />
              </svg>
            </span>
            <h3>Visualization</h3>
            <p>
              Understand relationships through timelines, concept links,
              comparison views, and collection-wide visual analytics.
            </p>
          </button>
        </div>

        <section className="landing-detail-card">
          <div className="landing-detail-card__header">
            <h2>Technical Capabilities</h2>
            <p>
              EduVid Explorer combines automatic video segmentation, intelligent
              summarization, and interactive visualization to support efficient
              exploration of long educational videos.
            </p>
          </div>

          <div className="landing-capabilities-grid">
            <article className="landing-capability">
              <div className="landing-capability__icon landing-capability__icon--chaptering">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2 5 13h5l-1 9 8-12h-5l1-8Z" />
                </svg>
              </div>
              <h3>LLM-Powered Chaptering</h3>
              <p>
                State-of-the-art video segmentation using large language models
                with multimodal inputs such as transcripts and frame captions.
              </p>
            </article>

            <article className="landing-capability">
              <div className="landing-capability__icon landing-capability__icon--summary">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 18V6" />
                  <path d="M9.5 9.5C10 8 11 7 12 7s2 1 2.5 2.5" />
                  <path d="M8 5.5C8.8 3.9 10.2 3 12 3s3.2.9 4 2.5" />
                  <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
                  <path d="M7.5 12.5a4.5 4.5 0 0 0-2.5 4" />
                  <path d="M16.5 12.5a4.5 4.5 0 0 1 2.5 4" />
                </svg>
              </div>
              <h3>Intelligent Summarization</h3>
              <p>
                Generate summaries at multiple levels, including short, medium,
                long, chapter-level, and collection-wide insights.
              </p>
            </article>

            <article className="landing-capability">
              <div className="landing-capability__icon landing-capability__icon--analytics">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 20V10" />
                  <path d="M10 20V4" />
                  <path d="M16 20v-7" />
                  <path d="M22 20v-11" />
                  <path d="M3 20h19" />
                </svg>
              </div>
              <h3>Visual Analytics</h3>
              <p>
                Interactive timelines, network graphs, comparison views, and
                topic visualizations support deeper exploration across videos and
                collections.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-source-card">
          <p>
            <span>Data Source:</span> TIB AV-Portal (av.tib.eu)
          </p>
          <p className="landing-source-card__subtext">
            Scientific video repository | Foundation: Chapter-Llama (CVPR 2025)
            + Visual Analytics Survey
          </p>
        </section>
      </div>
    </section>
  );
}