export interface VideoBookmark {
  id: string
  videoId: string
  chapterId?: string
  title: string
  timestamp: number
  createdAt: string
}

export interface PlaylistItem {
  videoId: string
  addedAt: string
}

export interface Playlist {
  id: string
  name: string
  items: PlaylistItem[]
  createdAt: string
}

export interface VideoNote {
  id: string
  videoId: string
  chapterId?: string
  timestamp: number
  text: string
  createdAt: string
  updatedAt: string
}

export interface VideoProgress {
  videoId: string
  lastWatchedTime: number
  duration: number
  percentComplete: number
  completed: boolean
  updatedAt: string
}

export interface SubtitleTrack {
  id: string
  label: string
  language: string
  src: string
  default?: boolean
}

export interface UserVideoState {
  bookmarks: VideoBookmark[]
  playlists: Playlist[]
  notes: VideoNote[]
  progress: Record<string, VideoProgress>
}