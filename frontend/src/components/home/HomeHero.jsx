import { Link } from 'react-router-dom'

export default function HomeHero() {
  return (
    <section className="hero-section centered-hero-section">
      <div className="hero-copy centered-hero-copy">
        <span className="hero-kicker">Intelligent Exploration of Educational Videos</span>

        <h1>
          Explore long-form learning videos through timelines, summaries, and collection insights.
        </h1>

        <p>
          Navigate chapters, inspect concepts, compare related videos, and uncover shared themes
          across an entire educational collection through one unified visual interface.
        </p>

        <div className="hero-actions centered-hero-actions">
          <Link to="/explore" className="primary-btn">Start Exploring</Link>
          <Link to="/analytics" className="secondary-btn">View Analytics</Link>
        </div>

        <div className="hero-feature-cards">
          <article className="hero-feature-card">
            <div className="hero-feature-icon" />
            <h3>Chapter Summary</h3>
            <p>
              Explore chapter-level summaries, key concepts, and structured video navigation.
            </p>
          </article>

          <article className="hero-feature-card">
            <div className="hero-feature-icon" />
            <h3>Comparison View</h3>
            <p>
              Compare related videos side by side to discover shared topics and unique ideas.
            </p>
          </article>

          <article className="hero-feature-card">
            <div className="hero-feature-icon" />
            <h3>Collection Analysis</h3>
            <p>
              Analyze the full collection through similarity, commonality, and topic-level insights.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}