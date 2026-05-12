export default function FeatureGrid() {
  const features = [
    {
      title: 'Video exploration',
      text: 'Jump through chapters, inspect summaries, and quickly understand long educational videos.'
    },
    {
      title: 'Collection analytics',
      text: 'See how videos relate through similarity graphs, shared concepts, and topic coverage views.'
    },
    {
      title: 'Comparison tools',
      text: 'Compare two videos side by side and identify common themes, unique ideas, and different perspectives.'
    },
    {
      title: 'Metadata and search',
      text: 'Search content, inspect metadata, and move faster across an entire learning collection.'
    }
  ]

  return (
    <section className="content-section">
      <div className="section-intro">
        <span className="section-kicker">What you can do</span>
        <h2>One platform for exploration, comparison, and understanding.</h2>
      </div>

      <div className="feature-grid">
        {features.map((item) => (
          <article key={item.title} className="feature-card">
            <div className="feature-icon" />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}