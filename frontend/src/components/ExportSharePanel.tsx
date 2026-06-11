import type { VideoRecord } from '../types/video'
import type { VideoBookmark, VideoNote, VideoProgress } from '../types/userState'

type ExportSharePanelProps = {
  video: VideoRecord
  bookmarks: VideoBookmark[]
  notes: VideoNote[]
  progress?: VideoProgress
  currentTime: number
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function ExportSharePanel({
  video,
  bookmarks,
  notes,
  progress,
  currentTime,
}: ExportSharePanelProps) {
  function handleExport() {
    downloadJson(`${video.id}-study-data.json`, {
      videoId: video.id,
      videoTitle: video.title,
      exportedAt: new Date().toISOString(),
      currentTime,
      progress,
      bookmarks,
      notes,
    })
  }

  async function handleCopyShareLink() {
    const shareUrl = `${window.location.origin}${window.location.pathname}#video=${video.id}&t=${Math.floor(currentTime)}`
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // ignore
    }
  }

  return (
    <section className="sidebar-card">
      <div className="results-head">
        <h3>Export & share</h3>
      </div>

      <div className="export-actions">
        <button type="button" className="secondary-btn" onClick={handleExport}>
          Export notes and bookmarks
        </button>
        <button type="button" className="primary-btn" onClick={handleCopyShareLink}>
          Copy share link
        </button>
      </div>
    </section>
  )
}