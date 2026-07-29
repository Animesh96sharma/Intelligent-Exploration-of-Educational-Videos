import { useEffect, useMemo, useState } from 'react'
import './App.css'

import type { UserVideoState, VideoBookmark, VideoNote } from './types/userState'
import { buildProgress, createPlaylist, loadUserState, saveUserState } from './lib/userState'

import type { AppDataset, VideoRecord } from './types/video'
import { loadAppDataset } from './lib/dataLoader'
import { videoMatchesConcept } from './lib/analytics'

import Logo from './components/Logo'
import LandingPage from './components/LandingPage'
import AboutPage from './components/AboutPage'
import MetadataPage from './components/MetadataPage'
import HomePage from './components/HomePage'
import VideoExplorer from './components/VideoExplorer'
import CollectionAnalysis from './components/CollectionAnalysis'
import NetworkView from './components/NetworkView'
import ComparisonView from './components/ComparisonView'

type ViewMode =
  | 'home'
  | 'about'
  | 'metadata'
  | 'browse'
  | 'video'
  | 'collection'
  | 'network'
  | 'compare'

const NAV_ICONS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  collection: 'M4 6.5h16M4 12h16M4 17.5h16',
  network:
    'M8 6a2 2 0 1 1-4 0a2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0Zm-6 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0ZM7.5 7.5l3 8M16.5 7.5l-3 8',
  compare: 'M4 7h6M4 12h6M4 17h6M14 7h6M14 12h6M14 17h6',
  about: 'M12 8h.01M11 12h1v5h1M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z',
  metadata: 'M5 4h14M5 9h14M5 14h14M5 19h14',
} as const

function NavIcon({ path }: { path: string }) {
  return (
    <span className="nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function SearchIcon() {
  return (
    <span className="nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <path
          d="M21 21l-4.35-4.35M10.8 18a7.2 7.2 0 1 1 0-14.4a7.2 7.2 0 0 1 0 14.4Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

const NAV_ITEMS: { key: ViewMode; label: string }[] = [
  { key: 'browse', label: 'Home'},
  { key: 'collection', label: 'Collection View'},
  { key: 'network', label: 'Network View' },
  { key: 'compare', label: 'Comparison' },
  { key: 'metadata', label: 'Metadata'},
  { key: 'about', label: 'About'},
]

export default function App() {
  const [dataset, setDataset] = useState<AppDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userState, setUserState] = useState<UserVideoState>(() => loadUserState())
  const [view, setView] = useState<ViewMode>('home')
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [comparisonVideoIds, setComparisonVideoIds] = useState<string[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchPanelOpen, setSearchPanelOpen] = useState(false)

  useEffect(() => {
    saveUserState(userState)
  }, [userState])

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        setLoading(true)
        const data = await loadAppDataset()
        if (!mounted) return

        setDataset(data)
        setSelectedVideoId(data.videos[0]?.id ?? null)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load dataset.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 820) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      setSearchPanelOpen(false)
    }
  }, [menuOpen])

  const filteredVideos = useMemo(() => {
    if (!dataset) return []

    const q = searchQuery.trim().toLowerCase()

    return dataset.videos.filter((video) => {
      const matchesQuery =
        q === '' ||
        video.title.toLowerCase().includes(q) ||
        (video.speaker ?? '').toLowerCase().includes(q) ||
        (video.domain ?? '').toLowerCase().includes(q) ||
        (video.summaryShort ?? '').toLowerCase().includes(q) ||
        video.keyConcepts.some((concept) => concept.toLowerCase().includes(q))

      const matchesDomain =
        selectedDomain === 'all' ||
        (video.domain ?? '').toLowerCase() === selectedDomain.toLowerCase()

      const matchesDifficulty =
        selectedDifficulty === 'all' ||
        (video.difficultyLevel ?? '').toLowerCase() === selectedDifficulty.toLowerCase()

      const matchesSelectedConcept = videoMatchesConcept(video, selectedConcept)

      return (
        matchesQuery &&
        matchesDomain &&
        matchesDifficulty &&
        matchesSelectedConcept
      )
    })
  }, [dataset, searchQuery, selectedDomain, selectedDifficulty, selectedConcept])

  const selectedVideo: VideoRecord | null = useMemo(() => {
    if (!dataset || !selectedVideoId) return null
    return dataset.videos.find((video) => video.id === selectedVideoId) ?? null
  }, [dataset, selectedVideoId])

  const comparisonVideos = useMemo(() => {
    if (!dataset || comparisonVideoIds.length === 0) return []

    return comparisonVideoIds
      .map((id) => dataset.videos.find((video) => video.id === id) ?? null)
      .filter(Boolean) as VideoRecord[]
  }, [dataset, comparisonVideoIds])

  const isSelectedVideoInComparison = useMemo(() => {
  if (!selectedVideoId) return false
  return comparisonVideoIds.includes(selectedVideoId)
}, [comparisonVideoIds, selectedVideoId])

  const availableDomains = useMemo(() => {
    if (!dataset) return []
    return Array.from(
      new Set(dataset.videos.map((video) => video.domain).filter(Boolean))
    ) as string[]
  }, [dataset])

  const availableDifficulties = useMemo(() => {
    if (!dataset) return []
    return Array.from(
      new Set(dataset.videos.map((video) => video.difficultyLevel).filter(Boolean))
    ) as string[]
  }, [dataset])

  function addBookmark(bookmark: VideoBookmark) {
    setUserState((current) => ({
      ...current,
      bookmarks: [bookmark, ...current.bookmarks],
    }))
  }

  function removeBookmark(bookmarkId: string) {
    setUserState((current) => ({
      ...current,
      bookmarks: current.bookmarks.filter((item) => item.id !== bookmarkId),
    }))
  }

  function addNote(note: VideoNote) {
    setUserState((current) => ({
      ...current,
      notes: [note, ...current.notes],
    }))
  }

  function updateNote(noteId: string, text: string) {
    setUserState((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === noteId
          ? { ...note, text, updatedAt: new Date().toISOString() }
          : note
      ),
    }))
  }

  function removeNote(noteId: string) {
    setUserState((current) => ({
      ...current,
      notes: current.notes.filter((note) => note.id !== noteId),
    }))
  }

  function createNewPlaylist(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return

    const playlist = createPlaylist(trimmed)
    setUserState((current) => ({
      ...current,
      playlists: [playlist, ...current.playlists],
    }))
  }

  function addVideoToPlaylist(playlistId: string, videoId: string) {
    setUserState((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => {
        if (playlist.id !== playlistId) return playlist

        const alreadyExists = playlist.items.some((item) => item.videoId === videoId)
        if (alreadyExists) return playlist

        return {
          ...playlist,
          items: [
            ...playlist.items,
            {
              videoId,
              addedAt: new Date().toISOString(),
            },
          ],
        }
      }),
    }))
  }

  function removeVideoFromPlaylist(playlistId: string, videoId: string) {
    setUserState((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              items: playlist.items.filter((item) => item.videoId !== videoId),
            }
          : playlist
      ),
    }))
  }

  function updateVideoProgress(videoId: string, currentTime: number, duration: number) {
    setUserState((current) => ({
      ...current,
      progress: {
        ...current.progress,
        [videoId]: buildProgress(videoId, currentTime, duration),
      },
    }))
  }

  function handleOpenBrowse() {
    setView('browse')
    setMenuOpen(false)
  }

  function handleOpenVideo(videoId: string) {
    setSelectedVideoId(videoId)
    setView('video')
    setMenuOpen(false)
  }

  function handleOpenCollection() {
    setView('collection')
    setMenuOpen(false)
  }

  function handleOpenNetwork() {
    setView('network')
    setMenuOpen(false)
  }

  function handleSelectConcept(concept: string | null) {
    setSelectedConcept(concept || null)
  }

  function handleToggleCompareVideo(videoId: string) {
    setComparisonVideoIds((current) => {
      let next: string[]

      if (current.includes(videoId)) {
        next = current.filter((id) => id !== videoId)
      } else if (current.length >= 2) {
        next = [current[1], videoId]
      } else {
        next = [...current, videoId]
      }

      if (next.length >= 2) {
        setView('compare')
      } else if (view === 'compare') {
        setView('browse')
      }

      return next
    })
  }

  function handleOpenComparison(videoId?: string) {
    if (!videoId) {
      if (comparisonVideoIds.length >= 2) {
        setView('compare')
      }
      return
    }

    setComparisonVideoIds((current) => {
      let next: string[]

      if (current.includes(videoId)) {
        next = current
      } else if (current.length >= 2) {
        next = [current[1], videoId]
      } else {
        next = [...current, videoId]
      }

      if (next.length >= 2) {
        setView('compare')
      }

      return next
    })
  }

  function handleNavSelect(key: ViewMode) {
    if (key === 'browse') handleOpenBrowse()
    else if (key === 'collection') handleOpenCollection()
    else if (key === 'network') handleOpenNetwork()
    else if (key === 'compare') setView('compare')
    else setView(key)

    setMenuOpen(false)
  }

  if (loading) {
    return <div className="app-shell">Loading EduVid Explorer...</div>
  }

  if (error || !dataset) {
    return <div className="app-shell">Error: {error ?? 'Unknown error'}</div>
  }

  const isLanding = view === 'home'
  const canUseSearchTray = !isLanding

  return (
    <div className={`app-shell ${isLanding ? 'is-landing' : ''}`}>
      <header className="topbar youtube-topbar">
        <div className="topbar-left">
          <button
            type="button"
            className={`hamburger-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="topbar-nav"
          >
            <span />
            <span />
          </button>

          <button
            type="button"
            className="brand-block"
            onClick={() => {
              setView('home')
              setMenuOpen(false)
              setSearchPanelOpen(false)
            }}
            aria-label="Go to homepage"
          >
            <Logo />
            <div className="brand-copy" />
              <p className="brand-gradient">EduVid Explorer</p>
          </button>
        </div>

        <div className="topbar-center" />

        <div className="topbar-right">
          <nav
            id="topbar-nav"
            className={`topbar-nav ${menuOpen ? 'open' : ''}`}
            aria-label="Primary navigation"
            >
            {NAV_ITEMS.map((item) => {
              const isActive =
                view === item.key || (item.key === 'browse' && view === 'video')

              return (
                <button
                  key={item.key}
                  type="button"
                  className={isActive ? 'active' : ''}
                  onClick={() => handleNavSelect(item.key)}
                  disabled={item.key === 'compare' && comparisonVideos.length < 2}
                >
                  <span>
                    {item.label}
                    {item.key === 'compare' && comparisonVideos.length > 0
                      ? ` (${comparisonVideos.length}/2)`
                      : ''}
                  </span>
                </button>
              )
            })}
          </nav>

          {canUseSearchTray && (
          <button
            type="button"
            className={`topbar-search-toggle ${searchPanelOpen ? 'active' : ''}`}
            aria-label={searchPanelOpen ? 'Close search panel' : 'Open search panel'}
            aria-expanded={searchPanelOpen}
            aria-controls="topbar-search-panel"
            onClick={() => {
              setSearchPanelOpen((prev) => !prev)
              setMenuOpen(false)
            }}
            >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <line x1="16" y1="16" x2="21" y2="21" />
            </svg>
          </button>
        )}
        </div>
      </header>

      {canUseSearchTray && (
        <section
          id="topbar-search-panel"
          className={`topbar-search-panel ${searchPanelOpen ? 'open' : ''}`}
          aria-hidden={!searchPanelOpen}
        >
          <div className="topbar-search-panel__inner">
            <form className="topbar-search" role="search" onSubmit={(e) => e.preventDefault()}>
              <input
                type="search"
                placeholder="Search by title, speaker, summary, or concept"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search videos"
              />
            </form>

            <select
              className="topbar-filter"
              value={selectedDomain}
              onChange={(event) => setSelectedDomain(event.target.value)}
              aria-label="Filter by domain"
            >
              <option value="all">All domains</option>
              {availableDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>

            <select
              className="topbar-filter"
              value={selectedDifficulty}
              onChange={(event) => setSelectedDifficulty(event.target.value)}
              aria-label="Filter by difficulty"
            >
              <option value="all">All difficulty levels</option>
              {availableDifficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {menuOpen && (
        <button
          type="button"
          className="drawer-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {!isLanding && (
        <main className="main-content">
          {view === 'about' && <AboutPage onStartExploring={handleOpenBrowse} />}

          {view === 'metadata' && <MetadataPage videos={dataset?.videos ?? []} />}

          {view === 'browse' && (
            <HomePage
              videos={filteredVideos}
              selectedVideoId={selectedVideoId}
              comparisonVideoIds={comparisonVideoIds}
              onOpenVideo={handleOpenVideo}
              onOpenCollection={handleOpenCollection}
              onOpenNetwork={handleOpenNetwork}
              onToggleCompareVideo={handleToggleCompareVideo}
              onSelectConcept={handleSelectConcept}
            />
          )}

          {view === 'video' && selectedVideo && (
            <VideoExplorer
              video={selectedVideo}
              allVideos={dataset.videos ?? []}
              selectedConcept={selectedConcept}
              onSelectConcept={handleSelectConcept}
              onSelectVideo={handleOpenVideo}
              onToggleCompareVideo={handleToggleCompareVideo}
              onOpenComparison={handleOpenComparison}
              onBrowseMoreVideos={handleOpenBrowse}
              isVideoCompared={isSelectedVideoInComparison}
              userState={userState}
              onAddBookmark={addBookmark}
              onRemoveBookmark={removeBookmark}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onRemoveNote={removeNote}
              onCreatePlaylist={createNewPlaylist}
              onAddVideoToPlaylist={addVideoToPlaylist}
              onRemoveVideoFromPlaylist={removeVideoFromPlaylist}
              onUpdateVideoProgress={updateVideoProgress}
            />
          )}

          {view === 'collection' && dataset.collectionAnalysis && (
            <CollectionAnalysis
              analysis={dataset.collectionAnalysis}
              videos={filteredVideos}
              onOpenVideo={handleOpenVideo}
              onToggleCompareVideo={handleToggleCompareVideo}
              onSelectConcept={handleSelectConcept}
              selectedConcept={selectedConcept}
              onOpenComparison={handleOpenComparison}
            />
          )}

          {view === 'network' && (
            <NetworkView
              videos={filteredVideos}
              selectedVideoId={selectedVideoId}
              onOpenVideo={handleOpenVideo}
              onSelectConcept={handleSelectConcept}
              selectedConcept={selectedConcept}
            />
          )}

          {view === 'compare' && (
            <ComparisonView
              videos={comparisonVideos}
              allVideos={filteredVideos}
              selectedConcept={selectedConcept}
              onOpenVideo={handleOpenVideo}
              onSelectConcept={handleSelectConcept}
              onToggleCompareVideo={handleToggleCompareVideo}
            />
          )}
        </main>
      )}

      {isLanding && (
        <main className="main-content main-content--landing">
          <LandingPage
            onEnterHomepage={handleOpenBrowse}
            onOpenAbout={() => {
              setView('about')
              setMenuOpen(false)
            }}
            onOpenNetwork={handleOpenNetwork}
          />
        </main>
      )}

      <footer className="app-footer">
        <div className="app-footer__inner">
          <p>MSc Computer Science Group Project 3 - Intelligent Exploration of Educational Videos</p>
          <p className="app-footer__subtext">
            Demonstration Prototype | Powered by Chapter-Llama &amp; Multi-Level Summarization
          </p>
        </div>
      </footer>
    </div>
  )
}