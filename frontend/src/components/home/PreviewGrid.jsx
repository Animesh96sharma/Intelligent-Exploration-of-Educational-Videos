import { Link } from 'react-router-dom'

export default function PreviewGrid() {
  const previews = [
    {
      title: 'Timeline exploration',
      text: 'Inspect chapters, summaries, and concepts in a linked timeline interface.',
      route: '/explore'
    },
    {
      title: 'Collection analytics',
      text: 'Explore similarity networks, matrices, and shared concept views across multiple videos.',
      route: '/analytics'
    },
    {
      title: 'Video comparison',
      text: 'Compare two videos side by side with synchronized views and difference analysis.',
      route: '/compare'
    }
  ]

  return (
    <section className="content-section">
      <div className="section-intro">
        <span className="section-kicker">Core views</span>
        <h2>Preview the main interfaces before entering the platform.</h2>
      </div>

      <div className="preview-grid">
        {previews.map((item) => (
          <article key={item.title} className="preview-card">
            <div className="preview-thumb" />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <Link to={item.route} className="text-link">
              Open view →
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}