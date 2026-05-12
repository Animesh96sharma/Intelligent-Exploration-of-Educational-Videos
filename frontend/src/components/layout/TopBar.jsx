import { Link } from 'react-router-dom'

export default function TopBar({ onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn" onClick={onMenuClick} aria-label="Open menu">
          ☰
        </button>

        <Link to="/" className="brand brand-with-logo">
          <img src="/logo.svg" alt="Educational Video Explorer logo" className="brand-logo" />
          <div className="brand-text-group">
            <span className="brand-title">EduVid Explorer</span>
            <span className="brand-motto">Intelligent Video Analysis Dashboard</span>
          </div>
        </Link>
      </div>

      <nav className="topbar-nav">
        <Link to="/explore">Explore</Link>
        <Link to="/analytics">Analytics</Link>
        <Link to="/compare">Compare</Link>
        <Link to="/metadata">Metadata</Link>
      </nav>

      <div className="topbar-right">
        <Link to="/explore" className="nav-cta">
          Open Platform
        </Link>
      </div>
    </header>
  )
}