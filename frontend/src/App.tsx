import { useEffect, useMemo, useState } from "react";
import "./App.css";

import type { AppDataset, VideoRecord } from "./types/video";
import { loadAppDataset } from "./lib/dataLoader";
import { videoMatchesConcept } from "./lib/analytics";

import Logo from "./components/Logo";
import LandingPage from "./components/LandingPage";
import AboutPage from "./components/AboutPage";
import MetadataPage from "./components/MetadataPage";
import HomePage from "./components/HomePage";
import VideoExplorer from "./components/VideoExplorer";
import CollectionAnalysis from "./components/CollectionAnalysis";
import NetworkView from "./components/NetworkView";
import ComparisonView from "./components/ComparisonView";

type ViewMode =
  | "home"
  | "about"
  | "metadata"
  | "browse"
  | "video"
  | "collection"
  | "network"
  | "compare";

const NAV_ICONS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
  video:
    "M4 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm13 4 5-3v10l-5-3",
  collection: "M4 6.5h16M4 12h16M4 17.5h16",
  network:
    "M8 6a2 2 0 1 1-4 0a2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0Zm-6 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0ZM7.5 7.5l3 8M16.5 7.5l-3 8",
  compare: "M4 7h6M4 12h6M4 17h6M14 7h6M14 12h6M14 17h6",
  about: "M12 8h.01M11 12h1v5h1M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z",
  metadata: "M5 4h14M5 9h14M5 14h14M5 19h14"
} as const;

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
  );
}

export default function App() {
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
            <Logo />

            <div className="brand-copy">
              <h1 className="brand-gradient">EduVid Explorer</h1>
              <p className="brand-tagline">
                Intelligent Video Analysis Platform
              </p>
            </div>
          </div>
        </div>

        <nav className="topbar-nav" aria-label="Primary">
          {view === "home" ? (
            <>
              <button
                type="button"
                className={view === "about" ? "active" : ""}
                onClick={() => setView("about")}
              >
                <NavIcon path={NAV_ICONS.about} />
                About
              </button>

              <button
                type="button"
                className={view === "metadata" ? "active" : ""}
                onClick={() => setView("metadata")}
              >
                <NavIcon path={NAV_ICONS.metadata} />
                Metadata
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={view === "home" ? "active" : ""}
                onClick={() => setView("home")}
              >
                <NavIcon path={NAV_ICONS.home} />
                Home
              </button>

              <button
                type="button"
                className={view === "browse" ? "active" : ""}
                onClick={handleOpenBrowse}
              >
                <NavIcon path={NAV_ICONS.video} />
                Video Explorer
              </button>

              <button
                type="button"
                className={view === "collection" ? "active" : ""}
                onClick={handleOpenCollection}
              >
                <NavIcon path={NAV_ICONS.collection} />
                Collection Analysis
              </button>

              <button
                type="button"
                className={view === "network" ? "active" : ""}
                onClick={handleOpenNetwork}
              >
                <NavIcon path={NAV_ICONS.network} />
                Network View
              </button>

              <button
                type="button"
                className={view === "compare" ? "active" : ""}
                onClick={() => setView("compare")}
                disabled={comparisonVideos.length < 2}
              >
                <NavIcon path={NAV_ICONS.compare} />
                Compare {comparisonVideos.length > 0 ? `(${comparisonVideos.length}/2)` : ""}
              </button>

              <button
                type="button"
                className={view === "about" ? "active" : ""}
                onClick={() => setView("about")}
              >
                <NavIcon path={NAV_ICONS.about} />
                About
              </button>

              <button
                type="button"
                className={view === "metadata" ? "active" : ""}
                onClick={() => setView("metadata")}
              >
                <NavIcon path={NAV_ICONS.metadata} />
                Metadata
              </button>
            </>
          )}
        </nav>
      </header>

      {view !== "home" && view !== "about" && view !== "metadata" && (
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
            onOpenAbout={() => setView("about")}
            onOpenNetwork={handleOpenNetwork}
          />
        )}

        {view === "about" && (
          <AboutPage onStartExploring={handleOpenBrowse} />
        )}

        {view === "metadata" && <MetadataPage />}

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

      <footer className="app-footer">
        <div className="app-footer__inner">
          <p>MSc Computer Science Group Project 3 - Intelligent Exploration of Educational Videos</p>
          <p className="app-footer__subtext">
            Demonstration Prototype | Powered by Chapter-Llama &amp; Multi-Level Summarization
          </p>
        </div>
      </footer>
    </div>
  );
}