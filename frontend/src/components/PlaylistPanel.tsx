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

export default function PlaylistPanel({
  video,
  playlists,
  allVideos,
  onSelectVideo,
  onCreatePlaylist,
  onAddVideoToPlaylist,
  onRemoveVideoFromPlaylist,
}: PlaylistPanelProps) {
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null)

  const videoMap = useMemo(() => {
    return new Map(allVideos.map((item) => [item.id, item]))
  }, [allVideos])

  function handleCreatePlaylist() {
    const trimmed = newPlaylistName.trim()
    if (!trimmed) return
    onCreatePlaylist(trimmed)
    setNewPlaylistName('')
  }

  return (
    <section className="sidebar-card">
      <div className="results-head">
        <h3>My Playlists</h3>
        <span>{playlists.length} total</span>
      </div>

      <div className="playlist-create">
        <input
          type="text"
          value={newPlaylistName}
          placeholder="Create a new playlist"
          onChange={(event) => setNewPlaylistName(event.target.value)}
        />
        <button type="button" className="secondary-btn" onClick={handleCreatePlaylist}>
          Create
        </button>
      </div>

      {playlists.length === 0 ? (
        <p>No playlists yet. Create one and add this video.</p>
      ) : (
        <div className="playlist-list">
          {playlists.map((playlist) => {
            const containsCurrentVideo = playlist.items.some((item) => item.videoId === video.id)
            const isExpanded = expandedPlaylistId === playlist.id

            return (
              <article key={playlist.id} className="playlist-card">
                <div className="playlist-card-head">
                  <div>
                    <strong>{playlist.name}</strong>
                    <span>{playlist.items.length} videos</span>
                  </div>

                  <div className="playlist-card-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onAddVideoToPlaylist(playlist.id, video.id)}
                      disabled={containsCurrentVideo}
                    >
                      {containsCurrentVideo ? 'Added' : 'Add current'}
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() =>
                        setExpandedPlaylistId((current) =>
                          current === playlist.id ? null : playlist.id
                        )
                      }
                    >
                      {isExpanded ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="playlist-items">
                    {playlist.items.length === 0 ? (
                      <p>This playlist is empty.</p>
                    ) : (
                      playlist.items.map((item) => {
                        const savedVideo = videoMap.get(item.videoId)

                        return (
                          <div key={`${playlist.id}-${item.videoId}`} className="playlist-item-row">
                            <div className="playlist-item-copy">
                              <strong>{savedVideo?.title ?? item.videoId}</strong>
                              <span>{savedVideo?.domain ?? 'Saved video'}</span>
                            </div>

                            <div className="playlist-item-actions">
                              {savedVideo ? (
                                <button
                                  type="button"
                                  className="secondary-btn"
                                  onClick={() => onSelectVideo(savedVideo.id)}
                                >
                                  Open
                                </button>
                              ) : null}

                              <button
                                type="button"
                                className="secondary-btn"
                                onClick={() =>
                                  onRemoveVideoFromPlaylist(playlist.id, item.videoId)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}