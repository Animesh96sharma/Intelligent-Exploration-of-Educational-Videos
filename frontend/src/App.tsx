import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { VideoRecord } from "./types/video"
import type { UserVideoState } from "./types/userState"
import type {VideoBookmark, VideoNote } from './types/userState'
import { buildProgress, createPlaylist, loadUserState, saveUserState } from './lib/userState'

import type { AppDataset } from './types/video'
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
  const [userState, setUserState] = useState<UserVideoState>(loadUserState())
  const [view, setView] = useState<ViewMode>('home')
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [comparisonVideoIds, setComparisonVideoIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchPanelOpen, setSearchPanelOpen] = useState(false)

  useEffect(() => { saveUserState(userState) }, [userState])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [view])
  useEffect(() => { setSearchPanelOpen(false) }, [view])
  useEffect(() => { if (searchPanelOpen) window.scrollTo({ top: 0, behavior: 'smooth' }) }, [searchPanelOpen])

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
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 820) setMenuOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { if (menuOpen) setSearchPanelOpen(false) }, [menuOpen])

  const filteredVideos = useMemo(() => {
    if (!dataset) return []
    const q = searchQuery.trim().toLowerCase()
    return dataset.videos.filter((video) => {
      const matchesQuery = q === '' || video.title.toLowerCase().includes(q) || (video.speaker ?? '').toLowerCase().includes(q) || (video.domain ?? '').toLowerCase().includes(q) || (video.summaryShort ?? '').toLowerCase().includes(q) || video.keyConcepts.some((concept) => concept.toLowerCase().includes(q))
      const matchesDomain = selectedDomain === 'all' || (video.domain ?? '').toLowerCase() === selectedDomain.toLowerCase()
      const matchesDifficulty = selectedDifficulty === 'all' || (video.difficultyLevel ?? '').toLowerCase() === selectedDifficulty.toLowerCase()
      const matchesSelectedConcept = videoMatchesConcept(video, selectedConcept)
      return matchesQuery && matchesDomain && matchesDifficulty && matchesSelectedConcept
    })
  }, [dataset, searchQuery, selectedDomain, selectedDifficulty, selectedConcept])

  const selectedVideo: VideoRecord | null = useMemo(() => {
    if (!dataset || !selectedVideoId) return null
    return dataset.videos.find((video) => video.id === selectedVideoId) ?? null
  }, [dataset, selectedVideoId])

  const comparisonVideos = useMemo(() => {
    if (!dataset || comparisonVideoIds.length === 0) return []
    return comparisonVideoIds.map((id) => dataset.videos.find((video) => video.id === id) ?? null).filter(Boolean) as VideoRecord[]
  }, [dataset, comparisonVideoIds])

  const isSelectedVideoInComparison = useMemo(() => {
    if (!selectedVideoId) return false
    return comparisonVideoIds.includes(selectedVideoId)
  }, [comparisonVideoIds, selectedVideoId])

  const availableDomains = useMemo(() => {
    if (!dataset) return []
    return Array.from(new Set(dataset.videos.map((v) => v.domain).filter(Boolean))) as string[]
  }, [dataset])

  const availableDifficulties = useMemo(() => {
    if (!dataset) return []
    return Array.from(new Set(dataset.videos.map((v) => v.difficultyLevel).filter(Boolean))) as string[]
  }, [dataset])

  function addBookmark(bookmark: VideoBookmark) { setUserState((c) => ({ ...c, bookmarks: [bookmark, ...c.bookmarks] })) }
  function removeBookmark(id: string) { setUserState((c) => ({ ...c, bookmarks: c.bookmarks.filter((b) => b.id !== id) })) }
  function addNote(note: VideoNote) { setUserState((c) => ({ ...c, notes: [note, ...c.notes] })) }
  function updateNote(noteId: string, text: string) { setUserState((c) => ({ ...c, notes: c.notes.map((n) => n.id === noteId ? { ...n, text, updatedAt: new Date().toISOString() } : n) })) }
  function removeNote(id: string) { setUserState((c) => ({ ...c, notes: c.notes.filter((n) => n.id !== id) })) }
  function createNewPlaylist(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return null
    const playlist = createPlaylist(trimmed)
    setUserState((c) => ({ ...c, playlists: [playlist, ...c.playlists] }))
    return playlist
  }
  function addVideoToPlaylist(playlistId: string, videoId: string) {
    setUserState((c) => ({ ...c, playlists: c.playlists.map((pl) => {
      if (pl.id !== playlistId) return pl
      if (pl.items.some((i) => i.videoId === videoId)) return pl
      return { ...pl, items: [...pl.items, { videoId, addedAt: new Date().toISOString() }] }
    })}))
  }
  function removeVideoFromPlaylist(playlistId: string, videoId: string) {
    setUserState((c) => ({ ...c, playlists: c.playlists.map((pl) => pl.id === playlistId ? { ...pl, items: pl.items.filter((i) => i.videoId !== videoId) } : pl) }))
  }
  function updateVideoProgress(videoId: string, currentTime: number, duration: number) {
    setUserState((c) => ({ ...c, progress: { ...c.progress, [videoId]: buildProgress(videoId, currentTime, duration) } }))
  }
  function setVideoReaction(videoId: string, reaction: 'like' | 'dislike') {
    setUserState((c) => { const next = { ...c.reactions }; if (next[videoId] === reaction) delete next[videoId]; else next[videoId] = reaction; return { ...c, reactions: next } })
  }
  function addToWatchLater(videoId: string) { setUserState((c) => c.watchLater.includes(videoId) ? c : { ...c, watchLater: [...c.watchLater, videoId] }) }
  function shareVideo(videoId: string) {
    const url = `${window.location.origin}/video/${videoId}`
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(url).catch(() => {}); return }
    const ta = document.createElement('textarea'); ta.value = url; ta.style.position = 'absolute'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
  }
  function downloadVideo(video: VideoRecord) {
    const src = (video as VideoRecord & { videoSrc?: string }).videoSrc
    if (!src) return
    const a = document.createElement('a'); a.href = src; a.download = `${video.title || video.id}.mp4`; a.click()
  }

  function handleOpenBrowse() { setView('browse'); setMenuOpen(false) }
  function handleOpenVideo(videoId: string) { setSelectedVideoId(videoId); setView('video'); setMenuOpen(false) }
  function handleOpenCollection() { setView('collection'); setMenuOpen(false) }
  function handleOpenNetwork() { setView('network'); setMenuOpen(false) }
  function handleSelectConcept(concept: string | null) { setSelectedConcept(concept || null) }

  function handleToggleCompareVideo(videoId: string) {
    setComparisonVideoIds((current) => {
      let next: string[]
      if (current.includes(videoId)) next = current.filter((id) => id !== videoId)
      else if (current.length >= 2) next = [current[1], videoId]
      else next = [...current, videoId]
      if (next.length >= 2) setView('compare')
      else if (view === 'compare') setView('browse')
      return next
    })
  }

  function handleOpenComparison(videoId?: string) {
    if (!videoId) { if (comparisonVideoIds.length >= 2) setView('compare'); return }
    setComparisonVideoIds((current) => {
      let next: string[]
      if (current.includes(videoId)) next = current
      else if (current.length >= 2) next = [current[1], videoId]
      else next = [...current, videoId]
      if (next.length >= 2) setView('compare')
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading EduVid Explorer...</div>
  if (error || !dataset) return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error ?? 'Unknown error'}</div>

  const isLanding = view === 'home'
  const canUseSearchTray = !['home', 'about', 'metadata'].includes(view)

  return (
    <div className="min-h-screen p-0">
      {/* ── TOPBAR ── */}
      <header className="sticky top-0 z-[1300] w-full flex items-center justify-between gap-3 px-[18px] py-[10px] bg-white/5 border-b border-slate-900/8 backdrop-blur-[18px] mb-4">
        <div className="flex items-center gap-2.5 min-w-0 flex-[0_1_auto]">
          {/* Hamburger */}
          <button
            type="button"
            className={`hamburger-btn relative w-[34px] h-[34px] md:hidden inline-flex items-center justify-center border-none rounded-full bg-transparent text-slate-800/86 transition-colors hover:bg-slate-900/5 z-[1302] ${ menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((p) => !p)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="topbar-nav"
          >
            <span /><span />
          </button>

          {/* Brand */}
          <button
            type="button"
            className="inline-flex items-center gap-2.5 min-w-0 border-none bg-transparent p-0 m-0 text-left shadow-none transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-1 rounded-[14px]"
            onClick={() => { setView('home'); setMenuOpen(false); setSearchPanelOpen(false); setSearchQuery(''); setSelectedDomain('all'); setSelectedDifficulty('all'); setSelectedConcept(null) }}
            aria-label="Go to homepage"
          >
            <Logo />
            <div className="flex flex-col min-w-0">
              <span className="text-[1rem] font-bold leading-none tracking-[-0.02em] text-slate-900 whitespace-nowrap">EduVid Explorer</span>
            </div>
          </button>
        </div>

        {/* Center placeholder */}
        <div className="flex-1" />

        {/* Right: nav + search toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <nav
            id="topbar-nav"
            className={`topbar-nav flex items-center gap-2 ${ menuOpen ? 'open' : '' } max-md:fixed max-md:top-0 max-md:left-0 max-md:right-0 max-md:z-[1200] max-md:flex-col max-md:gap-1 max-md:pt-16 max-md:px-3 max-md:pb-3 max-md:rounded-b-[22px] max-md:bg-white/95 max-md:border-b max-md:border-slate-900/8 max-md:shadow-[0_18px_40px_rgba(15,23,42,0.08)] max-md:backdrop-blur-[20px] ${ menuOpen ? 'max-md:flex' : 'max-md:hidden' }`}
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = view === item.key || (item.key === 'browse' && view === 'video')
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`min-h-[36px] px-3 border-none rounded-full font-medium tracking-[-0.01em] transition-[background-color,color,transform] duration-[180ms] ${ isActive ? 'bg-slate-900 text-white/92' : 'bg-transparent text-slate-900/80 hover:bg-slate-900/5 hover:text-slate-900' } disabled:opacity-40 disabled:cursor-not-allowed max-md:w-full max-md:min-h-[48px] max-md:px-3.5 max-md:py-3 max-md:justify-start max-md:text-left max-md:rounded-[14px]`}
                  onClick={() => handleNavSelect(item.key)}
                  disabled={item.key === 'compare' && comparisonVideos.length < 2}
                >
                  {item.label}{item.key === 'compare' && comparisonVideos.length > 0 ? ` (${comparisonVideos.length}/2)` : ''}
                </button>
              )
            })}
          </nav>

          {canUseSearchTray && (
            <button
              type="button"
              className={`inline-flex items-center justify-center w-9 h-9 border-none rounded-full bg-transparent text-slate-900/82 transition-[background-color,color,transform] duration-[180ms] hover:bg-slate-900/5 ${ searchPanelOpen ? 'bg-slate-900/8 text-slate-900' : '' }`}
              aria-label={searchPanelOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchPanelOpen}
              aria-controls="topbar-search-panel"
              onClick={() => { setSearchPanelOpen((p) => !p); setMenuOpen(false) }}
            >
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] block stroke-current stroke-2 fill-none flex-shrink-0" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <line x1="16" y1="16" x2="21" y2="21" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ── SEARCH PANEL ── */}
      {canUseSearchTray && (
        <section
          id="topbar-search-panel"
          className={`topbar-search-panel w-full mb-[18px] px-6 max-sm:px-3.5`}
          aria-hidden={!searchPanelOpen}
        >
          <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(180px,0.7fr))] max-sm:grid-cols-1 gap-3 p-4 rounded-[20px] bg-white/92 border border-slate-900/8 backdrop-blur-[18px]">
            <form className="min-w-0" role="search" onSubmit={(e) => e.preventDefault()}>
              <input
                type="search"
                placeholder="Search by title, speaker, summary, or concept"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search videos"
                className="w-full min-h-[48px] border border-slate-900/8 rounded-[16px] bg-white/96 text-slate-900 px-4 outline-none focus:border-slate-900/18 focus:ring-4 focus:ring-slate-900/6"
              />
            </form>
            <select
              className="w-full min-h-[48px] border border-slate-900/8 rounded-[16px] bg-white/96 text-slate-900 px-4 outline-none focus:border-slate-900/18 focus:ring-4 focus:ring-slate-900/6"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              aria-label="Filter by domain"
            >
              <option value="all">All domains</option>
              {availableDomains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              className="w-full min-h-[48px] border border-slate-900/8 rounded-[16px] bg-white/96 text-slate-900 px-4 outline-none focus:border-slate-900/18 focus:ring-4 focus:ring-slate-900/6"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              aria-label="Filter by difficulty"
            >
              <option value="all">All difficulty levels</option>
              {availableDifficulties.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </section>
      )}

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/14 backdrop-blur-[8px] z-[1100] border-none"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      {!isLanding && (
        <main className="w-full px-6 max-[720px]:px-4">
          {view === 'about' && <AboutPage onStartExploring={handleOpenBrowse} />}
          {view === 'metadata' && <MetadataPage videos={dataset?.videos ?? []} />}
          {view === 'browse' && (
            <HomePage
              videos={filteredVideos} selectedVideoId={selectedVideoId} comparisonVideoIds={comparisonVideoIds}
              onOpenVideo={handleOpenVideo} onToggleCompareVideo={handleToggleCompareVideo} onSelectConcept={handleSelectConcept}
              onAddToWatchLater={addToWatchLater} onAddVideoToPlaylist={addVideoToPlaylist} onDownloadVideo={downloadVideo}
              onShareVideo={shareVideo} onSetReaction={setVideoReaction} reactions={userState.reactions}
              userState={userState} onCreatePlaylist={createNewPlaylist} playlist={userState.playlists}
            />
          )}
          {view === 'video' && selectedVideo && (
            <VideoExplorer
              video={selectedVideo} allVideos={dataset.videos} selectedConcept={selectedConcept}
              comparisonVideoIds={comparisonVideoIds} onSelectConcept={handleSelectConcept} onSelectVideo={handleOpenVideo}
              onOpenVideo={handleOpenVideo} onToggleCompareVideo={handleToggleCompareVideo} onOpenComparison={handleOpenComparison}
              onBrowseMoreVideos={handleOpenBrowse} isVideoCompared={isSelectedVideoInComparison} userState={userState}
              onAddBookmark={addBookmark} onRemoveBookmark={removeBookmark} onAddNote={addNote} onUpdateNote={updateNote}
              onRemoveNote={removeNote} onCreatePlaylist={createNewPlaylist} onAddVideoToPlaylist={addVideoToPlaylist}
              onRemoveVideoFromPlaylist={removeVideoFromPlaylist} onUpdateVideoProgress={updateVideoProgress}
              onSetReaction={setVideoReaction} onShareVideo={shareVideo}
            />
          )}
          {view === 'collection' && dataset.collectionAnalysis && (
            <CollectionAnalysis
              analysis={dataset.collectionAnalysis} videos={filteredVideos} onOpenVideo={handleOpenVideo}
              onToggleCompareVideo={handleToggleCompareVideo} onSelectConcept={handleSelectConcept}
              selectedConcept={selectedConcept} onOpenComparison={handleOpenComparison}
            />
          )}
          {view === 'network' && (
            <NetworkView
              videos={filteredVideos} selectedVideoId={selectedVideoId} onOpenVideo={handleOpenVideo}
              onSelectConcept={handleSelectConcept} selectedConcept={selectedConcept}
            />
          )}
          {view === 'compare' && (
            <ComparisonView
              videos={comparisonVideos} allVideos={filteredVideos} selectedConcept={selectedConcept}
              collectionAnalysis={dataset.collectionAnalysis} onOpenVideo={handleOpenVideo}
              onSelectConcept={handleSelectConcept} onToggleCompareVideo={handleToggleCompareVideo}
            />
          )}
        </main>
      )}

      {isLanding && (
        <main className="w-full px-6 max-[720px]:px-4">
          <LandingPage
            onEnterHomepage={handleOpenBrowse}
            onOpenAbout={() => { setView('about'); setMenuOpen(false) }}
            onOpenNetwork={handleOpenNetwork}
          />
        </main>
      )}

      {/* ── FOOTER ── */}
      <footer className="w-full mx-auto mt-8 px-6 max-[720px]:px-4 pb-2">
        <div className="w-full text-center border-t border-slate-200 pt-5">
          <p className="m-0 text-slate-500 text-[0.92rem] leading-relaxed">MSc Computer Science Group Project 3 - Intelligent Exploration of Educational Videos</p>
          <p className="mt-1 text-[0.8rem] text-slate-400">Demonstration Prototype | Powered by Chapter-Llama &amp; Multi-Level Summarization</p>
        </div>
      </footer>
    </div>
  )
}
