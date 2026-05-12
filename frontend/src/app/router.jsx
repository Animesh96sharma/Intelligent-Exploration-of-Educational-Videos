import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'

function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: '40px', color: 'white', background: '#0b1020', minHeight: '100vh' }}>
      <h1>{title}</h1>
      <p>This is a placeholder route for now.</p>
    </div>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explore" element={<PlaceholderPage title="Video Exploration" />} />
      <Route path="/analytics" element={<PlaceholderPage title="Collection Analytics" />} />
      <Route path="/compare" element={<PlaceholderPage title="Comparison View" />} />
      <Route path="/metadata" element={<PlaceholderPage title="Metadata View" />} />
    </Routes>
  )
}