// src/App.tsx

import { useEffect, useMemo, useState } from "react";
import "./App.css";

import type { AppDataset, VideoRecord } from "./types/video";
import { loadAppDataset } from "./lib/dataLoader";

import HomePage from "./components/HomePage";
import VideoExplorer from "./components/VideoExplorer";
import CollectionAnalysis from "./components/CollectionAnalysis";
import NetworkView from "./components/NetworkView";

type ViewMode = "home" | "video" | "collection" | "network";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [dataset, setDataset] = useState<AppDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("home");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  function toggleTheme() {
  setTheme((current) => (current === "light" ? "dark" : "light"));
}

  useEffect(() => {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
}, [theme]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setLoading(true);
        const data = await loadAppDataset();
        if (!mounted) return;

        setDataset(data);
        setSelectedVideoId(data.videos[0]?.id ?? null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load dataset.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

const filteredVideos = useMemo(() => {
  if (!dataset) return [];

  const q = searchQuery.trim().toLowerCase();

  return dataset.videos.filter((video) => {
    const matchesQuery =
      q === "" ||
      video.title.toLowerCase().includes(q) ||
      (video.speaker ?? "").toLowerCase().includes(q) ||
      (video.domain ?? "").toLowerCase().includes(q) ||
      (video.summaryShort ?? "").toLowerCase().includes(q) ||
      video.keyConcepts.some((concept) => concept.toLowerCase().includes(q));

    const matchesDomain =
      selectedDomain === "all" ||
      (video.domain ?? "").toLowerCase() === selectedDomain.toLowerCase();

    const matchesDifficulty =
      selectedDifficulty === "all" ||
      (video.difficultyLevel ?? "").toLowerCase() === selectedDifficulty.toLowerCase();

    return matchesQuery && matchesDomain && matchesDifficulty;
  });
}, [dataset, searchQuery, selectedDomain, selectedDifficulty]);

console.log("searchQuery:", searchQuery);
console.log("selectedDomain:", selectedDomain);
console.log("selectedDifficulty:", selectedDifficulty);
console.log("all videos:", dataset?.videos.length);
console.log("filtered videos:", filteredVideos.length);

  const selectedVideo: VideoRecord | null = useMemo(() => {
    if (!dataset || !selectedVideoId) return null;
    return dataset.videos.find((video) => video.id === selectedVideoId) ?? null;
  }, [dataset, selectedVideoId]);

  const availableDomains = useMemo(() => {
    if (!dataset) return [];
    return Array.from(
      new Set(dataset.videos.map((video) => video.domain).filter(Boolean))
    ) as string[];
  }, [dataset]);

  const availableDifficulties = useMemo(() => {
    if (!dataset) return [];
    return Array.from(
      new Set(
        dataset.videos
          .map((video) => video.difficultyLevel)
          .filter(Boolean)
      )
    ) as string[];
  }, [dataset]);

  function handleOpenVideo(videoId: string) {
    setSelectedVideoId(videoId);
    setView("video");
  }

  if (loading) {
    return <div className="app-shell">Loading EduVid Explorer...</div>;
  }

  if (error || !dataset) {
    return <div className="app-shell">Error: {error ?? "Unknown error"}</div>;
  }

  return (
    <div className="app-shell">
 <header className="topbar">
  <div className="topbar-left">
    <div className="brand-block">
      <div className="brand-logo" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="brand-logo__svg" role="img">
          <defs>
            <linearGradient id="eduvidStatsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="55%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>

          <rect x="8" y="10" width="48" height="44" rx="16" fill="url(#eduvidStatsGradient)" opacity="0.12" />
          <path
            d="M18 46V34M30 46V24M42 46V16"
            stroke="url(#eduvidStatsGradient)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M16 46H48"
            stroke="#0f172a"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.24"
          />
          <circle cx="18" cy="34" r="3" fill="#2563eb" />
          <circle cx="30" cy="24" r="3" fill="#14b8a6" />
          <circle cx="42" cy="16" r="3" fill="#7c3aed" />
        </svg>
      </div>

      <div className="brand-copy">
        <h1 className="brand-gradient">EduVid Explorer</h1>
        <p className="brand-tagline">
          Interactive exploration of educational video summaries and chapters
        </p>
      </div>
    </div>
  </div>

  <nav className="topbar-nav">
    <button
      className={view === "home" ? "active" : ""}
      onClick={() => setView("home")}
    >
      Home
    </button>
    <button
      className={view === "video" ? "active" : ""}
      onClick={() => setView("video")}
      disabled={!selectedVideo}
    >
      Video Explorer
    </button>
    <button
      className={view === "collection" ? "active" : ""}
      onClick={() => setView("collection")}
    >
      Collection
    </button>
    <button
      className={view === "network" ? "active" : ""}
      onClick={() => setView("network")}
    >
      Network
    </button>
  </nav>

  <div className="topbar-right">
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="theme-toggle__icon" aria-hidden="true">
          <path
            d="M12 3.75V2m0 20v-1.75M4.75 12H3m18 0h-1.75M6.22 6.22 5 5m14 14-1.22-1.22M6.22 17.78 5 19m14-14-1.22 1.22M12 16.25A4.25 4.25 0 1 0 12 7.75a4.25 4.25 0 0 0 0 8.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="theme-toggle__icon" aria-hidden="true">
          <path
            d="M20.2 14.2A8.5 8.5 0 0 1 9.8 3.8a8.75 8.75 0 1 0 10.4 10.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  </div>
</header>

      <section className="filters-bar">
        <input
          type="text"
          placeholder="Search by title, speaker, concept, or summary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
        >
          <option value="all">All domains</option>
          {availableDomains.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
        >
          <option value="all">All difficulty levels</option>
          {availableDifficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
      </section>

      <main className="main-content">
        {view === "home" && (
          <HomePage
            videos={filteredVideos}
            selectedVideoId={selectedVideoId}
            onOpenVideo={handleOpenVideo}
            onOpenCollection={() => setView("collection")}
            onOpenNetwork={() => setView("network")}
          />
        )}

        {view === "video" && selectedVideo && (
          <VideoExplorer
            video={selectedVideo}
            allVideos={dataset.videos}
            onSelectVideo={handleOpenVideo}
          />
        )}

        {view === "collection" && dataset.collectionAnalysis && (
          <CollectionAnalysis
            analysis={dataset.collectionAnalysis}
            videos={filteredVideos}
            onOpenVideo={handleOpenVideo}
          />
        )}

        {view === "network" && (
          <NetworkView
            videos={filteredVideos}
            selectedVideoId={selectedVideoId}
            onOpenVideo={handleOpenVideo}
          />
        )}
      </main>
    </div>
  );
}