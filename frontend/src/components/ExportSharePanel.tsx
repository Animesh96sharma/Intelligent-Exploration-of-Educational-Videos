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
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ExportSharePanel({ video, bookmarks, notes, progress, currentTime }: ExportSharePanelProps) {
  function handleExport() {
    downloadJson(`${video.id}-study-data.json`, { videoId: video.id, videoTitle: video.title, exportedAt: new Date().toISOString(), currentTime, progress, bookmarks, notes })
  }

  async function handleCopyShareLink() {
    const url = `${window.location.origin}${window.location.pathname}#video=${video.id}&t=${Math.floor(currentTime)}`
    try { await navigator.clipboard.writeText(url) } catch { }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-[1.05rem] tracking-[-0.02em] inline-flex items-center gap-2.5">Export &amp; share</h3>
      </div>
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <button
          type="button"
          className="border border-black rounded-[14px] bg-white text-black px-4 py-2.5 font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-[transform,box-shadow] duration-[180ms] hover:bg-[#f8f8f8] hover:translate-y-[-1px]"
          onClick={handleExport}
        >
          Export notes and bookmarks
        </button>
        <button
          type="button"
          className="border border-black rounded-[14px] bg-black text-white px-4 py-2.5 font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] transition-[transform,box-shadow] duration-[180ms] hover:bg-[#111] hover:translate-y-[-1px]"
          onClick={handleCopyShareLink}
        >
          Copy share link
        </button>
      </div>
    </section>
  )
}
