import { useEffect, useMemo, useState } from "react";
import "./App.css";

import type { AppDataset, VideoRecord } from "./types/video";
import { loadAppDataset } from "./lib/dataLoader";
import { videoMatchesConcept } from "./lib/analytics";

import LandingPage from "./components/LandingPage";
import HomePage from "./components/HomePage";
import VideoExplorer from "./components/VideoExplorer";
import CollectionAnalysis from "./components/CollectionAnalysis";
import NetworkView from "./components/NetworkView";
import ComparisonView from "./components/ComparisonView";

type ViewMode =
  | "home"
  | "browse"
  | "video"
  | "collection"
  | "network"
  | "compare";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [dataset, setDataset] = useState<AppDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("home");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [comparisonVideoIds, setComparisonVideoIds] = useState<string[]>([]);

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
        (video.difficultyLevel ?? "").toLowerCase() ===
          selectedDifficulty.toLowerCase();

      const matchesSelectedConcept = videoMatchesConcept(video, selectedConcept);

      return (
        matchesQuery &&
        matchesDomain &&
        matchesDifficulty &&
        matchesSelectedConcept
      );
    });
  }, [dataset, searchQuery, selectedDomain, selectedDifficulty, selectedConcept]);

  const selectedVideo: VideoRecord | null = useMemo(() => {
    if (!dataset || !selectedVideoId) return null;
    return dataset.videos.find((video) => video.id === selectedVideoId) ?? null;
  }, [dataset, selectedVideoId]);

  const comparisonVideos = useMemo(() => {
    if (!dataset || comparisonVideoIds.length === 0) return [];

    return comparisonVideoIds
      .map((id) => dataset.videos.find((video) => video.id === id) ?? null)
      .filter(Boolean) as VideoRecord[];
  }, [dataset, comparisonVideoIds]);

  const availableDomains = useMemo(() => {
    if (!dataset) return [];
    return Array.from(
      new Set(dataset.videos.map((video) => video.domain).filter(Boolean))
    ) as string[];
  }, [dataset]);

  const availableDifficulties = useMemo(() => {
    if (!dataset) return [];
    return Array.from(
      new Set(dataset.videos.map((video) => video.difficultyLevel).filter(Boolean))
    ) as string[];
  }, [dataset]);

  function handleOpenBrowse() {
    setView("browse");
  }

  function handleOpenVideo(videoId: string) {
    setSelectedVideoId(videoId);
    setView("video");
  }

  function handleOpenCollection() {
    setView("collection");
  }

  function handleOpenNetwork() {
    setView("network");
  }

  function handleSelectConcept(concept: string | null) {
    setSelectedConcept(concept);
  }

  function handleToggleCompareVideo(videoId: string) {
    setComparisonVideoIds((current) => {
      let next: string[];

      if (current.includes(videoId)) {
        next = current.filter((id) => id !== videoId);
      } else if (current.length >= 2) {
        next = [current[1], videoId];
      } else {
        next = [...current, videoId];
      }

      if (next.length >= 2) {
        setView("compare");
      } else if (view === "compare") {
        setView("browse");
      }

      return next;
    });
  }

  function handleOpenComparison(videoId?: string) {
    if (!videoId) {
      if (comparisonVideoIds.length >= 2) {
        setView("compare");
      }
      return;
    }

    setComparisonVideoIds((current) => {
      let next: string[];

      if (current.includes(videoId)) {
        next = current;
      } else if (current.length >= 2) {
        next = [current[1], videoId];
      } else {
        next = [...current, videoId];
      }

      if (next.length >= 2) {
        setView("compare");
      }

      return next;
    });
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
                  <linearGradient
                    id="eduvidStatsGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="55%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>

                <rect
                  x="8"
                  y="10"
                  width="48"
                  height="44"
                  rx="16"
                  fill="url(#eduvidStatsGradient)"
                  opacity="0.12"
                />
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

        <nav className="topbar-nav" aria-label="Primary">
          <button
            type="button"
            className={view === "home" ? "active" : ""}
            onClick={() => setView("home")}
          >
            Home
          </button>

          <button
            type="button"
            className={view === "browse" ? "active" : ""}
            onClick={handleOpenBrowse}
          >
            Homepage
          </button>

          <button
            type="button"
            className={view === "collection" ? "active" : ""}
            onClick={handleOpenCollection}
          >
            Collection
          </button>

          <button
            type="button"
            className={view === "network" ? "active" : ""}
            onClick={handleOpenNetwork}
          >
            Network
          </button>

          <button
            type="button"
            className={view === "compare" ? "active" : ""}
            onClick={() => setView("compare")}
          >
            Compare
          </button>

          <button
            type="button"
            className={view === "compare" ? "active" : ""}
            onClick={() => setView("compare")}
          >
            About
          </button>
        </nav>

      </header>

      {view !== "home" && (
        <section className="filters-bar">
          <input
            type="search"
            placeholder="Search by title, speaker, summary, or concept"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          <select
            value={selectedDomain}
            onChange={(event) => setSelectedDomain(event.target.value)}
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
            onChange={(event) => setSelectedDifficulty(event.target.value)}
          >
            <option value="all">All difficulty levels</option>
            {availableDifficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </section>
      )}

      <main className="main-content">
        {view === "home" && (
          <LandingPage
            onEnterHomepage={handleOpenBrowse}
            onOpenCollection={handleOpenCollection}
            onOpenNetwork={handleOpenNetwork}
          />
        )}

        {view === "browse" && (
          <HomePage
            videos={filteredVideos}
            selectedVideoId={selectedVideoId}
            comparisonVideoIds={comparisonVideoIds}
            onOpenVideo={handleOpenVideo}
            onOpenCollection={handleOpenCollection}
            onOpenNetwork={handleOpenNetwork}
            onToggleCompareVideo={handleToggleCompareVideo}
            onSelectConcept={(concept) => handleSelectConcept(concept)}
          />
        )}

        {view === "video" && selectedVideo && (
          <VideoExplorer
            video={selectedVideo}
            relatedVideos={filteredVideos.filter((video) => video.id !== selectedVideo.id)}
            selectedConcept={selectedConcept}
            onSelectConcept={handleSelectConcept}
            onOpenVideo={handleOpenVideo}
            onToggleCompareVideo={handleToggleCompareVideo}
            comparisonVideoIds={comparisonVideoIds}
            onOpenCollection={handleOpenCollection}
            onOpenComparison={handleOpenComparison}
          />
        )}

        {view === "collection" && dataset.collectionAnalysis && (
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

        {view === "network" && (
          <NetworkView
            videos={filteredVideos}
            selectedVideoId={selectedVideoId}
            onOpenVideo={handleOpenVideo}
            onSelectConcept={handleSelectConcept}
            selectedConcept={selectedConcept}
          />
        )}

        {view === "compare" && (
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
    </div>
  );
}