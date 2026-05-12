export default function ProcessSection() {
  const steps = [
    {
      number: '01',
      title: 'Segment the video',
      text: 'Videos are divided into semantic chapters for faster navigation and structured exploration.'
    },
    {
      number: '02',
      title: 'Summarize the content',
      text: 'Each video and chapter is summarized into key ideas, concepts, and learning goals.'
    },
    {
      number: '03',
      title: 'Explore visually',
      text: 'Users move from timelines to analytics and comparison views to discover patterns across the collection.'
    }
  ]

  return (
    <section className="content-section">
      <div className="section-intro narrow-intro">
        <span className="section-kicker">How it works</span>
        <h2>From raw videos to interactive learning exploration.</h2>
      </div>

      <div className="process-grid">
        {steps.map((step) => (
          <article key={step.number} className="process-card">
            <span className="process-number">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}