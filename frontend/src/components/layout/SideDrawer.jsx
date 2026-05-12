import { Link } from 'react-router-dom'

export default function SideDrawer({ open, onClose }) {
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          <h2>Navigation</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className="drawer-links">
          <Link to="/" onClick={onClose}>Home</Link>
          <Link to="/explore" onClick={onClose}>Explore Videos</Link>
          <Link to="/analytics" onClick={onClose}>Collection Analytics</Link>
          <Link to="/compare" onClick={onClose}>Compare Videos</Link>
          <Link to="/metadata" onClick={onClose}>Metadata</Link>
        </div>
      </aside>
    </>
  )
}