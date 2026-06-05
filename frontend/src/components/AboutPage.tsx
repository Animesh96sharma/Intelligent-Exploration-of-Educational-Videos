import Logo from "./Logo";

type AboutPageProps = {
  onStartExploring: () => void;
};

export default function AboutPage({ onStartExploring }: AboutPageProps) {
  return (
    <section className="about-page about-page--rich">
      <div className="about-shell">
        <section className="about-hero-banner">
          <div className="about-hero-banner">
          <div className="about-hero-banner__brand-copy">
              <p className="eyebrow">About this project</p>
              <h2>Intelligent Exploration of Educational Videos</h2>
            </div>
          </div>

          <div className="about-hero-banner__stats">
            <article className="about-mini-stat">
              <span>Duration</span>
              <strong>2 semesters</strong>
            </article>
            <article className="about-mini-stat">
              <span>Group size</span>
              <strong>3 students</strong>
            </article>
            <article className="about-mini-stat">
              <span>Focus</span>
              <strong>Segmentation · Summarization · Visualization</strong>
            </article>
          </div>

          <div className="hero-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={onStartExploring}
            >
              Start Exploring
            </button>
          </div>
        </section>

        <section className="about-card">
          <div className="about-card__head">
            <span className="about-card__icon" aria-hidden="true">💡</span>
            <h3>Motivation</h3>
          </div>
          <p>
            Educational videos are a major part of modern learning, but long
            lectures and large video collections are still difficult to
            navigate, compare, and understand efficiently.
          </p>
          <p>
            This project addresses that challenge by combining chapter-aware
            segmentation, hierarchical summaries, and interactive visual
            exploration for faster access to relevant content and clearer
            cross-video understanding.
          </p>
        </section>

        <section className="about-card">
          <div className="about-card__head">
            <span className="about-card__icon" aria-hidden="true">🎯</span>
            <h3>Learning objectives</h3>
          </div>

          <div className="about-two-col-list">
            <ul className="clean-list">
              <li>Implement state-of-the-art video understanding techniques.</li>
              <li>Design multimodal content analysis workflows.</li>
              <li>Create multi-level summarization pipelines.</li>
              <li>Develop interactive visualization interfaces.</li>
            </ul>

            <ul className="clean-list">
              <li>Process and analyze long-form educational videos.</li>
              <li>Apply visual analytics principles in practice.</li>
              <li>Evaluate user-centered exploration systems.</li>
              <li>Work with open-source LLM and vision-based methods.</li>
            </ul>
          </div>
        </section>

        <section className="about-section-stack">
          <div className="about-section-heading">
            <h3>Architecture</h3>
            <p>
              The project is organized into three tightly connected technical
              tracks that come together in one end-to-end exploration system.
            </p>
          </div>

          <div className="student-track-grid">
            <article className="student-track student-track--blue">
              <div className="student-track__top">
                <h4>Video Segmentation &amp; Chaptering</h4>
                <p>
                  Implements automatic chapter detection and title generation for
                  long educational videos.
                </p>
              </div>

              <div className="student-track__body">
                <h5>Key features</h5>
                <ul className="clean-list">
                  <li>Multimodal feature extraction from transcripts and frames.</li>
                  <li>Speech-guided frame sampling for efficiency.</li>
                  <li>LLM-based chapter boundary detection.</li>
                  <li>Descriptive chapter title generation.</li>
                  <li>Support for hour-long educational videos.</li>
                </ul>

                <h5>Technologies</h5>
                <div className="chip-group">
                  <span className="chip static">Whisper ASR</span>
                  <span className="chip static">BLIP-2 / LLaVA</span>
                  <span className="chip static">Llama 3.1</span>
                  <span className="chip static">FFmpeg</span>
                  <span className="chip static">PySceneDetect</span>
                </div>
              </div>
            </article>

            <article className="student-track student-track--purple">
              <div className="student-track__top">
                <h4>Multi-Level Summarization</h4>
                <p>
                  Develops summary generation at chapter, video, and collection
                  levels.
                </p>
              </div>

              <div className="student-track__body">
                <h5>Key features</h5>
                <ul className="clean-list">
                  <li>Short, medium, and long summaries.</li>
                  <li>Chapter-aware hierarchical summaries.</li>
                  <li>Collection-level commonality detection.</li>
                  <li>Difference highlighting across videos.</li>
                  <li>Learning-objective extraction.</li>
                </ul>

                <h5>Technologies</h5>
                <div className="chip-group">
                  <span className="chip static">Llama 3.1 / Mistral</span>
                  <span className="chip static">Sentence-BERT</span>
                  <span className="chip static">Transformers</span>
                  <span className="chip static">BERTopic</span>
                </div>
              </div>
            </article>

            <article className="student-track student-track--orange">
              <div className="student-track__top">
                <h4>Interactive Visualization</h4>
                <p>
                  Builds the visual interface for exploration, comparison, and
                  collection-level analysis.
                </p>
              </div>

              <div className="student-track__body">
                <h5>Key features</h5>
                <ul className="clean-list">
                  <li>Interactive timeline with chapter navigation.</li>
                  <li>Network views for video relationships.</li>
                  <li>Collection comparison workflows.</li>
                  <li>Topic visualization and filtering.</li>
                  <li>Responsive web-based interface.</li>
                </ul>

                <h5>Technologies</h5>
                <div className="chip-group">
                  <span className="chip static">React</span>
                  <span className="chip static">D3.js / Recharts</span>
                  <span className="chip static">Tailwind CSS concepts</span>
                  <span className="chip static">Video.js</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="about-card">
          <h3>Scientific foundation</h3>

          <div className="reference-list">
            <article className="reference-item reference-item--blue">
              <h4>Data source</h4>
              <p>
                <a
                  href="https://av.tib.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TIB AV-Portal
                </a>{" "}
                provides scientific and educational audiovisual material and is a
                suitable basis for exploration-oriented video interfaces. [web:4]
              </p>
            </article>

            <article className="reference-item reference-item--purple">
              <h4>Video chaptering</h4>
              <p>
                Chapter-Llama frames long-video chaptering as a text-domain LLM
                problem using transcripts and selected frame captions, and reports
                strong results on hour-long videos. [web:12]
              </p>
            </article>

            <article className="reference-item reference-item--orange">
              <h4>Visualization</h4>
              <p>
                Visual analytics research highlights the role of interactive
                visualization in exploring complex image and video datasets across
                tasks, tools, and application areas. [web:13]
              </p>
            </article>
          </div>
        </section>

        <section className="about-evaluation-banner">
          <h3>Evaluation criteria</h3>
          <div className="about-evaluation-grid">
            <article>
              <h4>Technical metrics</h4>
              <ul className="clean-list">
                <li>Segmentation accuracy and boundary quality.</li>
                <li>Summary quality and coverage.</li>
                <li>Processing efficiency.</li>
                <li>System integration quality.</li>
              </ul>
            </article>

            <article>
              <h4>User study</h4>
              <ul className="clean-list">
                <li>Task completion rates.</li>
                <li>Time-on-task measures.</li>
                <li>User satisfaction surveys.</li>
                <li>Expert and educator feedback.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="about-note">
          <div className="about-note__icon" aria-hidden="true">ℹ️</div>
          <div>
            <h3>About this demonstration</h3>
            <p>
              This prototype focuses on the interface and exploration workflow.
              A full production pipeline would require model execution resources
              and deeper integration with automated chaptering, summarization,
              and video processing infrastructure.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}