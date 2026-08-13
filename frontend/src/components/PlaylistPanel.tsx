import { useMemo, useState } from 'react'
import type { VideoRecord } from '../types/video'
import type { Playlist } from '../types/userState'

type PlaylistPanelProps = {
  video: VideoRecord
  playlists: Playlist[]
  allVideos: VideoRecord[]
  onSelectVideo: (videoId: string) => void
  onCreatePlaylist: (name: string) => void
  onAddVideoToPlaylist: (playlistId: string, videoId: string) => void
  onRemoveVideoFromPlaylist: (playlistId: string, videoId: string) => void
}

export default function PlaylistPanel({ video, playlists, allVideos, onSelectVideo, onCreatePlaylist, onAddVideoToPlaylist, onRemoveVideoFromPlaylist }: PlaylistPanelProps) {
  const [newName, setNewName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const videoMap = useMemo(() => new Map(allVideos.map((v) => [v.id, v])), [allVideos])

  function handleCreate() {
    const t = newName.trim(); if (!t) return; onCreatePlaylist(t); setNewName('')
  }

  const btnSecondary = "border border-black rounded-[14px] bg-white text-black px-4 py-2.5 font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-[transform,box-shadow] duration-[180ms] hover:bg-[#f8f8f8] hover:translate-y-[-1px]"
  const btnSmall = "border border-black rounded-[14px] bg-white text-black px-3 py-2 text-[0.82rem] font-semibold hover:bg-[#f8f8f8]"

  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-[1.05rem] tracking-[-0.02em]">☰ My Playlists</h3>
        <span className="text-slate-400 text-sm">{playlists.length} total</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
        <input type="text" value={newName} placeholder="Create a new playlist" onChange={(e) => setNewName(e.target.value)}
          className="w-full border border-slate-200 rounded-[12px] bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-slate-400" />
        <button type="button" className={btnSecondary} onClick={handleCreate}>Create</button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-slate-400 text-sm">No playlists yet. Create one and add this video.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {playlists.map((pl) => {
            const has = pl.items.some((i) => i.videoId === video.id)
            const expanded = expandedId === pl.id

            return (
              <article key={pl.id} className="border border-slate-200 bg-slate-50 rounded-[16px] p-3.5">
                <div className="flex justify-between gap-3 items-start flex-wrap">
                  <div className="flex flex-col gap-1">
                    <strong className="text-slate-900">{pl.name}</strong>
                    <span className="text-slate-400 text-[0.84rem]">{pl.items.length} videos</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" className={btnSmall} onClick={() => onAddVideoToPlaylist(pl.id, video.id)} disabled={has}>{has ? 'Added' : 'Add current'}</button>
                    <button type="button" className={btnSmall} onClick={() => setExpandedId((c) => c === pl.id ? null : pl.id)}>{expanded ? 'Hide' : 'View'}</button>
                  </div>
                </div>

                {expanded && (
                  <div className="flex flex-col gap-3 mt-3">
                    {pl.items.length === 0 ? <p className="text-slate-400 text-sm">Empty.</p> : pl.items.map((item) => {
                      const sv = videoMap.get(item.videoId)
                      return (
                        <div key={`${pl.id}-${item.videoId}`} className="flex justify-between gap-3 items-start flex-wrap">
                          <div className="flex flex-col gap-1">
                            <strong className="text-sm text-slate-900">{sv?.title ?? item.videoId}</strong>
                            <span className="text-slate-400 text-[0.84rem]">{sv?.domain ?? 'Saved video'}</span>
                          </div>
                          <div className="flex gap-2">
                            {sv && <button type="button" className={btnSmall} onClick={() => onSelectVideo(sv.id)}>Open</button>}
                            <button type="button" className={btnSmall} onClick={() => onRemoveVideoFromPlaylist(pl.id, item.videoId)}>Remove</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
