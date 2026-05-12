import { Link } from 'react-router-dom'

export default function HomeFooter() {
  return (
    <footer className="home-footer">
      <div>
        <h2>Start exploring the collection.</h2>
        <p>
          Move from introduction to chapter-level exploration, collection analytics, and video comparison.
        </p>
      </div>

      <div className="footer-actions">
        <Link to="/explore" className="primary-btn">Open Explorer</Link>
        <Link to="/metadata" className="secondary-btn">View Metadata</Link>
      </div>
    </footer>
  )
}