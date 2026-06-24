:root {
  --bg: #f5f7fb;
  --bg-accent: #eef3fb;
  --surface: #ffffff;
  --surface-soft: #f8fafc;
  --surface-soft-2: #eef2f7;
  --surface-muted: #f4f7fb;
  --surface-elevated: rgba(255, 255, 255, 0.96);

  --border: #d9e2ec;
  --border-strong: #c5d2e0;
  --divider: #e8eef5;

  --text: #0f172a;
  --text-soft: #334155;
  --text-faint: #64748b;

  --primary: #000000;
  --primary-soft: #f3f4f6;
  --primary-strong: #000000;

  --success-soft: #dcfce7;
  --warning-soft: #fef3c7;

  --shadow-sm: 0 8px 20px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 18px 40px rgba(15, 23, 42, 0.08);

  --radius-lg: 18px;
  --radius-md: 14px;
  --radius-sm: 10px;

  --page-gutter: 24px;
  --page-gutter-mobile: 16px;
  --page-section-gap: 20px;
  --page-max-width: 1320px;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.05), transparent 28%),
    linear-gradient(180deg, var(--bg-accent) 0%, var(--bg) 38%, var(--surface-soft) 100%);
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

.app-shell {
  min-height: 100vh;
  padding: var(--page-gutter);
}

.main-content {
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
}

/* Custom video player */

.custom-video-player-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  border-radius: 24px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: var(--shadow-md);
}

.custom-video-player-shell.is-extended {
  grid-template-columns: minmax(0, 1fr) 360px;
}

.custom-video-player {
  min-width: 0;
  position: relative;
}

.custom-video-player-extension {
  min-width: 0;
  height: 100%;
  background: #111827;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}

.custom-video-stage {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  background: #000;
}

.custom-video-element {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  cursor: pointer;
}

.custom-video-gradient {
  position: absolute;
  inset: auto 0 0 0;
  height: 38%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.82), rgba(0, 0, 0, 0));
  pointer-events: none;
}

.custom-video-center-toggle {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 72px;
  height: 72px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.58);
  color: #fff;
  font-size: 1.5rem;
  backdrop-filter: blur(8px);
  transition: opacity 180ms ease, transform 180ms ease, background 180ms ease;
}

.custom-video-center-toggle.is-playing {
  opacity: 0;
  pointer-events: none;
}

.custom-video-stage:hover .custom-video-center-toggle.is-playing,
.custom-video-stage:focus-within .custom-video-center-toggle.is-playing {
  opacity: 1;
  pointer-events: auto;
}

.custom-video-controls {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 2;
  padding: 0 1rem 1rem;
}

.custom-video-progress-shell {
  position: relative;
  margin-bottom: 0.85rem;
  padding-top: 0.75rem;
}

.custom-video-progress-track {
  position: relative;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.custom-video-progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: #ff0033;
  pointer-events: none;
}

.custom-video-chapter-segment {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 2;
  border: 0;
  background: transparent;
}

.custom-video-chapter-segment:hover {
  background: rgba(255, 255, 255, 0.08);
}

.custom-video-chapter-divider {
  position: absolute;
  top: -2px;
  width: 2px;
  height: 10px;
  background: rgba(255, 255, 255, 0.82);
  transform: translateX(-50%);
  pointer-events: none;
}

.custom-video-progress-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.custom-video-hover-preview {
  position: absolute;
  bottom: calc(100% + 0.6rem);
  transform: translateX(-50%);
  min-width: 120px;
  max-width: 220px;
  display: grid;
  gap: 0.12rem;
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  pointer-events: none;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.26);
}

.custom-video-hover-preview span {
  font-size: 0.78rem;
  opacity: 0.82;
}

.custom-video-hover-preview strong {
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.25;
}

.custom-video-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: #fff;
}

.custom-video-controls-left,
.custom-video-controls-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.custom-video-icon-btn,
.custom-video-panel-btn {
  min-height: 40px;
  border: 0;
  border-radius: 999px;
  color: #fff;
}

.custom-video-icon-btn {
  min-width: 40px;
  padding: 0 0.75rem;
  background: transparent;
  font-size: 1rem;
}

.custom-video-panel-btn {
  padding: 0.5rem 0.9rem;
  background: rgba(255, 255, 255, 0.14);
  font-size: 0.9rem;
  font-weight: 600;
}

.custom-video-panel-btn:hover,
.custom-video-icon-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}

.custom-video-time {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
}

.custom-video-volume {
  width: 88px;
}

.custom-video-rate-select {
  min-height: 36px;
  padding: 0.35rem 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.58);
  color: #fff;
}

.custom-video-player-shell:fullscreen,
.custom-video-player-shell:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
  grid-template-columns: minmax(0, 1fr) 400px;
}

.custom-video-player-shell:fullscreen .custom-video-player,
.custom-video-player-shell:-webkit-full-screen .custom-video-player,
.custom-video-player-shell:fullscreen .custom-video-player-extension,
.custom-video-player-shell:-webkit-full-screen .custom-video-player-extension {
  height: 100vh;
}

/* In-video panel */

.in-video-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: min(72vh, 760px);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.in-video-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid var(--divider);
}

.in-video-panel__head h3 {
  margin: 4px 0 0;
  font-size: 1.1rem;
}

.in-video-panel__close {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-soft);
  font-size: 1.75rem;
  line-height: 1;
}

.in-video-panel__tabs {
  display: flex;
  gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--divider);
  background: var(--surface-soft);
}

.in-video-panel__tabs button {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-soft);
  font-weight: 600;
}

.in-video-panel__tabs button.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.in-video-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.in-video-panel__list {
  display: grid;
  gap: 8px;
}

.in-video-panel__item {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  text-align: left;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.in-video-panel__item:hover {
  border-color: var(--border-strong);
  background: var(--surface-soft);
  transform: translateY(-1px);
}

.in-video-panel__item.active {
  border-color: #94a3b8;
  background: #f8fafc;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
}

.in-video-panel__item-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.in-video-panel__timestamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 700;
}

.in-video-panel__duration {
  color: var(--text-faint);
  font-size: 0.78rem;
}

.in-video-panel__item-copy {
  min-width: 0;
}

.in-video-panel__item-copy strong {
  display: block;
  margin-bottom: 6px;
  color: var(--text);
}

.in-video-panel__item-copy p {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.55;
}

.in-video-panel__item--transcript {
  grid-template-columns: 74px minmax(0, 1fr);
}

.in-video-panel__empty {
  margin: 0;
  padding: 12px 8px;
  color: var(--text-faint);
}

/* Brand */

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-logo {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-logo__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.brand-logo__cap-top {
  fill: #111111;
}

.brand-logo__cap-band {
  stroke: #111111;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.brand-logo__tassel-line {
  stroke: #ecc206;
  stroke-width: 2.5;
  stroke-linecap: round;
}

.brand-logo__tassel-dot {
  fill: #ecc206;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--text);
}

.brand-copy p {
  margin: 4px 0 0;
  max-width: 520px;
  font-size: 0.88rem;
  line-height: 1.35;
  color: var(--text-soft);
}

/* Topbar */

.topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
  margin: 0 0 var(--page-section-gap);
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface-elevated);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-sm);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1 1 auto;
}

.topbar-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
}

.topbar-nav button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 46px;
  padding: 11px 16px;
  border: 1px solid #000;
  border-radius: 14px;
  background: #fff;
  color: #000;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.topbar-nav button.active {
  background: #000;
  color: #fff;
  border-color: #000;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.16);
}

.topbar-nav button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-icon svg {
  display: block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.hamburger-btn {
  display: none;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  width: 48px;
  height: 48px;
  margin-left: auto;
  border: 1px solid #000;
  border-radius: 14px;
  background: #fff;
  color: #000;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.hamburger-btn span {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.hamburger-btn.active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-btn.active span:nth-child(2) {
  opacity: 0;
}

.hamburger-btn.active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Shared interactive */

.topbar-nav button,
.primary-btn,
.secondary-btn,
.inline-link,
.video-card__surface,
.summary-toggle button,
.chip {
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.topbar-nav button:hover,
.primary-btn:hover,
.secondary-btn:hover,
.inline-link:hover,
.video-card__surface:hover,
.hamburger-btn:hover,
.summary-toggle button:hover,
.chip:hover {
  transform: translateY(-1px);
}

.primary-btn {
  padding: 10px 16px;
  border: 1px solid #000;
  border-radius: 14px;
  background: #000;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.14);
}

.primary-btn:hover {
  background: #111111;
  border-color: #111111;
}

.secondary-btn {
  padding: 10px 16px;
  border: 1px solid #000;
  border-radius: 14px;
  background: #fff;
  color: #000;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.secondary-btn:hover {
  background: #f8f8f8;
}

.inline-link {
  padding: 0;
  border: none;
  background: transparent;
  color: #000;
  font-weight: 700;
}

/* Landing */

.landing-topbar {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto var(--page-section-gap);
  padding: 0;
}

.landing-page {
  min-height: calc(100vh - 110px);
  display: grid;
  place-items: center;
  padding: 0;
}

.landing-page__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--page-section-gap);
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
  text-align: center;
}

.landing-title-group,
.landing-detail-card,
.landing-source-card {
  width: 100%;
}

.landing-title-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.landing-eyebrow {
  margin: 24px;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-soft);
}

.landing-title,
.landing-title-varient {
  margin: 0;
  max-width: 44ch;
  line-height: 1.3;
  letter-spacing: 0;
  font-weight: 700;
}

.landing-title {
  font-size: clamp(2.8rem, 7vw, 3.7rem);
  background: linear-gradient(90deg, #2b6eff 0%, #5837ff 52%, #ff1a94 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.landing-title-varient {
  font-size: clamp(2.8rem, 7vw, 5.6rem);
  line-height: 0.96;
  letter-spacing: -0.05em;
  color: var(--text);
}

.landing-description {
  margin: 0;
  max-width: 760px;
  font-size: clamp(1.05rem, 1.8vw, 1.35rem);
  line-height: 1.75;
  color: var(--text-soft);
}

.landing-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  margin-top: 10px;
}

.landing-actions .primary-btn,
.landing-actions .secondary-btn {
  min-width: auto;
  padding: 10px 16px;
}

.landing-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  width: 100%;
  margin-top: 28px;
}

.landing-nav-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 220px;
  padding: 24px 20px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
  color: var(--text);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.landing-nav-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.landing-nav-card h3 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--text);
}

.landing-nav-card__icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: 22px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.landing-nav-card__icon svg {
  display: block;
  width: 34px;
  height: 34px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.landing-nav-card__icon--video {
  color: #2563eb;
  background: #dbeafe;
}

.landing-nav-card__icon--collection {
  color: #d97706;
  background: #fef3c7;
}

.landing-nav-card__icon--network {
  color: #7c3aed;
  background: #ede9fe;
}

.landing-detail-card {
  width: 100%;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 30px;
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  text-align: left;
  box-shadow: var(--shadow-md);
}

.landing-detail-card__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 20px;
  text-align: center;
}

.landing-detail-card__header h2 {
  margin: 0 0 10px;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--text);
}

.landing-detail-card__header p {
  margin: 0 auto;
  max-width: 760px;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-soft);
}

.landing-capabilities-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  width: 100%;
}

.landing-capability {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.landing-capability h3 {
  margin: 0 0 10px;
  font-size: 1.08rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: var(--text);
}

.landing-capability p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-soft);
}

.landing-capability__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 14px;
  border-radius: 16px;
}

.landing-capability__icon svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.landing-capability__icon--chaptering {
  color: #0f766e;
  background: #ccfbf1;
}

.landing-capability__icon--summary {
  color: #7c3aed;
  background: #ede9fe;
}

.landing-capability__icon--analytics {
  color: #2563eb;
  background: #dbeafe;
}

.landing-source-card {
  width: 100%;
  padding: 24px 28px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface-soft-2);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.landing-source-card p {
  margin: 0;
  line-height: 1.7;
  color: var(--text-soft);
}

.landing-source-card p + p {
  margin-top: 8px;
}

.landing-source-card span {
  font-weight: 700;
  color: var(--text);
}

.landing-source-card__subtext {
  font-size: 0.9rem;
  color: var(--text-faint);
}

@media (max-width: 1180px) {
  .custom-video-player-shell.is-extended {
    grid-template-columns: 1fr;
  }

  .in-video-panel {
    max-height: 460px;
  }
}

@media (max-width: 900px) {
  .custom-video-control-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .custom-video-controls-left,
  .custom-video-controls-right {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .custom-video-volume {
    width: 72px;
  }

  .landing-card-grid,
  .landing-capabilities-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .video-player-overlay-actions {
    top: 10px;
    right: 10px;
  }

  .video-player-overlay-chip {
    padding: 9px 12px;
    font-size: 0.82rem;
  }

  .in-video-panel {
    max-height: 52vh;
  }

  .in-video-panel__item {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .app-shell {
    padding: var(--page-gutter-mobile);
  }
}

@media (max-width: 640px) {
  .custom-video-controls {
    padding: 0 0.75rem 0.75rem;
  }

  .custom-video-center-toggle {
    width: 60px;
    height: 60px;
  }

  .custom-video-time {
    font-size: 0.82rem;
  }

  .custom-video-panel-btn {
    font-size: 0.82rem;
  }

  .topbar {
    padding: 14px;
    border-radius: 18px;
  }

  .landing-detail-card,
  .landing-source-card {
    padding: 20px;
  }
}

/* Generic section structure */

.home-page,
.video-explorer,
.collection-page,
.network-page,
.comparison-page,
.about-page,
.metadata-page {
  display: flex;
  flex-direction: column;
  gap: var(--page-section-gap);
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
}

.home-hero,
.collection-hero,
.network-hero,
.comparison-hero,
.video-explorer__header,
.about-hero {
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 30px;
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  box-shadow: var(--shadow-md);
}

.home-hero,
.collection-hero,
.network-hero,
.comparison-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.home-hero h2,
.collection-hero h2,
.network-hero h2,
.comparison-hero h2,
.video-explorer__header h2,
.about-hero h2 {
  margin: 8px 0 10px;
  color: var(--text);
  font-size: clamp(1.75rem, 2.2vw, 2.5rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.home-hero p,
.collection-hero p,
.network-hero p,
.comparison-hero p,
.video-explorer__header p,
.about-hero p,
.panel p,
.video-card p,
.node-card p,
.relationship-card p,
.focused-panel p {
  color: var(--text-soft);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #000;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-note {
  margin-top: 12px;
  font-size: 0.92rem;
  color: var(--text-faint);
}

/* Filters */

.filters-bar {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) repeat(2, minmax(180px, 0.7fr));
  gap: 14px;
  width: 100%;
  max-width: none;
  margin: 0 0 24px;
}

.filters-bar input,
.filters-bar select {
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  outline: none;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.filters-bar input:focus,
.filters-bar select:focus,
input[type="range"]:focus {
  border-color: #000;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08);
}

/* Shared cards / heads */

.results-head,
.panel-head,
.video-explorer__header,
.concept-card__head,
.relationship-card__head,
.node-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.results-head h3,
.panel h3,
.sidebar-card h3 {
  margin: 0;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.results-head span,
.stat-label,
.meta,
.time-range,
.weight-badge {
  color: var(--text-faint);
}

.video-grid,
.node-grid,
.stats-grid {
  display: grid;
  gap: 16px;
}

.video-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.node-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.video-card,
.stat-card,
.panel,
.related-card,
.node-card,
.relationship-card,
.concept-card,
.sidebar-card {
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.node-card,
.relationship-card,
.concept-card,
.panel,
.sidebar-card {
  padding: 18px;
}

.video-card,
.node-card,
.related-card {
  text-align: left;
}

.video-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.video-cardsurface,
.video-card__surface {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  width: 100%;
  text-align: left;
}

.video-card-thumbnail,
.video-card-thumbnail--horizontal {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--surface-soft);
}

.video-card-thumbnail {
  aspect-ratio: 16 / 9;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.video-card-thumbnail-media,
.video-card-thumbnail video {
  display: block;
  width: 100%;
  height: 100%;
  background: #0f172a;
  object-fit: cover;
}

.video-card-thumbnail-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--surface-soft), var(--surface-soft-2));
  color: var(--text-soft);
  text-align: center;
}

.video-card-thumbnail-overlay {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
}

.video-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1rem 0.75rem;
}

.video-card-content .eyebrow {
  margin: 0;
  color: var(--text-faint);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
}

.video-card-content h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.02rem;
  line-height: 1.38;
  letter-spacing: -0.02em;
}

.video-card-pills,
.video-card__meta,
.meta-list,
.node-card__actions,
.relationship-actions,
.network-toolbar__controls,
.comparison-actions,
.related-card__actions,
.video-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-pill,
.video-card__meta span,
.node-card__actions span,
.weight-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-soft);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
}

.video-card-summary {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.6;
}

.video-cardactions {
  padding: 0 1rem 1rem;
}

.video-card:hover,
.node-card:hover,
.related-card:hover,
.relationship-card:hover,
.concept-card:hover,
.panel:hover,
.sidebar-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.video-card.selected,
.node-card.selected,
.node-card.focused {
  border-color: rgba(0, 0, 0, 0.3);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08);
}

.video-card h3,
.node-card h4,
.focused-panel h4,
.chapter-panel h3 {
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
}

.stat-card strong {
  font-size: 1.7rem;
  letter-spacing: -0.04em;
}

/* Layout blocks */

.collection-layout,
.network-layout,
.video-explorer__layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

.collection-main,
.network-main,
.video-explorer__main,
.collection-sidebar,
.network-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel,
.sidebar-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.clean-list,
.ordered-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-soft);
}

.ordered-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--divider);
}

.ordered-item:last-child {
  border-bottom: none;
}

/* Home page only */

.home-page .video-grid {
  grid-template-columns: 1fr;
  gap: 18px;
}

.home-page .video-card {
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--divider);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.045);
}

.home-page .video-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.home-page .video-card.selected {
  border-color: rgba(0, 0, 0, 0.22);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08);
}

.home-page .video-card--horizontal {
  padding: 0;
  overflow: hidden;
}

.home-page .video-cardsurface--horizontal,
.home-page .video-card__surface--horizontal {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  align-items: stretch;
}

.home-page .video-card-thumbnail--horizontal .video-card-thumbnail-media,
.home-page .video-card-thumbnail--horizontal video {
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
}

.home-page .video-card-concepts-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-page .video-card-concepts-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
}

.home-page .video-card-concepts-empty {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-soft);
}

.home-page .chip-group.compact {
  gap: 8px;
}

.home-page .chip.static {
  cursor: default;
}

.home-page .video-card-content .chip {
  padding: 6px 10px;
  font-size: 0.74rem;
}

.home-page .video-card-toprow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
}

.home-page .video-card-headline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.home-page .video-card-sideactions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  align-self: center;
}

.home-page .video-card-sideactions .primary-btn,
.home-page .video-card-sideactions .secondary-btn {
  min-width: 140px;
  justify-content: center;
}

.home-page .video-card-preview-button {
  padding: 0;
  border: none;
  background: var(--surface-soft);
  text-align: left;
  cursor: pointer;
}

.home-page .video-card-preview-button:hover {
  filter: brightness(0.98);
}

.home-page .video-card-preview-button:focus-visible {
  outline: 2px solid var(--border-strong);
  outline-offset: -2px;
}

.home-page .video-cardactions {
  padding: 0 18px 18px;
}

.home-page .video-cardactions .primary-btn,
.home-page .video-cardactions .secondary-btn {
  width: auto;
}

/* Responsive */

@media (max-width: 900px) {
  .home-hero,
  .collection-hero,
  .network-hero,
  .comparison-hero,
  .video-explorer__header,
  .about-hero {
    padding: 22px;
    border-radius: 24px;
  }

  .collection-layout,
  .network-layout,
  .video-explorer__layout {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    grid-template-columns: 1fr;
  }

  .home-page .video-cardsurface--horizontal,
  .home-page .video-card__surface--horizontal {
    grid-template-columns: 1fr;
  }

  .home-page .video-card-thumbnail--horizontal {
    aspect-ratio: 16 / 9;
    border-right: none;
    border-bottom: 1px solid var(--divider);
  }

  .home-page .video-cardactions {
    padding: 0 18px 18px;
  }

  .home-page .video-cardactions .primary-btn,
  .home-page .video-cardactions .secondary-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 720px) {
  .home-page .video-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .home-page .video-card-toprow {
    grid-template-columns: 1fr;
  }

  .home-page .video-card-sideactions {
    justify-content: stretch;
  }

  .home-page .video-card-sideactions .primary-btn,
  .home-page .video-card-sideactions .secondary-btn {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .video-card-content {
    padding: 0.9rem 0.9rem 0.7rem;
  }

  .video-cardactions {
    padding: 0 0.9rem 0.9rem;
  }

  .video-card-pills {
    gap: 0.4rem;
  }

  .meta-pill {
    font-size: 0.76rem;
  }
}

/* Chips */

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border: 1px solid #000;
  border-radius: 999px;
  background: #fff;
  color: #000;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.chip.muted {
  background: var(--surface-soft-2);
  color: var(--text-faint);
  border-color: var(--border);
}

.chip.active {
  background: #000;
  color: #fff;
  border-color: #000;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}

.chip.static {
  cursor: default;
}

/* Lists / related */

.related-list,
.relationship-list,
.concept-list,
.chapter-compare-list,
.more-videos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-card {
  width: 100%;
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
  color: var(--text);
}

.related-card strong,
.related-card span,
.related-card small {
  color: inherit;
}

.related-card--actions {
  align-items: stretch;
  gap: 12px;
}

.related-card--actions > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Tables */

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--divider);
  text-align: left;
  vertical-align: top;
}

.data-table th {
  color: var(--text-faint);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.table-video-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Video explorer */

.video-explorerlayout,
.video-explorerlayout--with-sidebar,
.video-explorer__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.72fr);
  gap: 20px;
  align-items: start;
}

.video-explorermain,
.video-explorer__main,
.video-explorersidebar,
.video-explorer__sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.video-summary-card,
.timeline-vertical-section,
.video-details-collapsible {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-summary-card__head,
.video-details-collapsible__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-title-card,
.video-details-collapsible__toggle,
.timeline-panel,
.chapter-panel,
.sidebar-card,
.video-player {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.video-title-card {
  gap: 14px;
  padding: 20px;
  background: linear-gradient(180deg, var(--surface) 0, var(--surface-soft) 100%);
}

.video-details-collapsible__toggle {
  width: 100%;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  background: linear-gradient(180deg, var(--surface) 0, var(--surface-soft) 100%);
}

.video-details-collapsible__toggle h3 {
  margin: 4px 0 0;
}

.video-details-collapsible__icon {
  font-size: 1.35rem;
  line-height: 1;
  transition: transform 0.18s ease;
}

.video-details-collapsible__icon.open {
  transform: rotate(180deg);
}

.video-title-card__top,
.chapter-panel__header,
.network-toolbar,
.timeline-panel__header,
.timeline-chapter-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.video-title-card__heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.video-title-card__heading h2 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.5rem, 2vw, 2.2rem);
  line-height: 1.12;
  letter-spacing: -0.03em;
}

.video-title-card__actions,
.video-explorer__header-actions,
.video-card__actions,
.related-card__actions,
.comparison-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.video-title-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-title-card__summary {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.7;
}

.video-detail-grid,
.comparison-layout,
.comparison-unique-grid {
  display: grid;
  gap: 20px;
}

.video-detail-grid,
.comparison-layout,
.comparison-unique-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.comparison-column,
.comparison-subpanel {
  min-height: 100%;
}

.summary-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-toggle button {
  padding: 10px 14px;
  border: 1px solid #000;
  border-radius: 999px;
  background: #fff;
  color: #000;
  font-weight: 700;
  text-transform: capitalize;
}

.summary-toggle button.active {
  background: #000;
  color: #fff;
  border-color: #000;
}

/* Legacy/default media player blocks */

.video-player {
  border-radius: 24px;
  padding: 16px;
  box-shadow: var(--shadow-md);
}

.video-element {
  width: 100%;
  max-height: 520px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #dbeafe;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

/* Meta/info blocks */

.meta-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--text-soft);
}

.meta-list li {
  padding: 10px 12px;
  border: 1px solid var(--divider);
  border-radius: 14px;
  background: var(--surface-soft);
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-block h4,
.panel h4,
.chapter-panel h4 {
  margin: 0;
  font-size: 0.96rem;
  letter-spacing: -0.02em;
}

.video-details-collapsible__content .sidebar-card {
  gap: 18px;
}

.video-details-collapsible__content .info-block + .info-block {
  padding-top: 4px;
  border-top: 1px solid var(--divider);
}

/* Timeline */

.timeline-track {
  width: 100%;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-soft-2);
}

.timeline-progress {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4b5563 0%, #111827 70%, #000000 100%);
}

.timeline-chapters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-chapter {
  position: relative;
  flex: 1 1 120px;
  min-width: 110px;
  overflow: visible;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface-soft);
  color: var(--text-soft);
  text-align: left;
}

.timeline-chapter.active {
  border-color: rgba(0, 0, 0, 0.3);
  background: #f3f4f6;
}

.timeline-chapter.selected {
  background: #000;
  color: #fff;
  border-color: #000;
}

.timeline-index {
  display: inline-flex;
  margin-bottom: 6px;
  font-weight: 800;
}

.timeline-title {
  display: block;
  font-size: 0.86rem;
  line-height: 1.35;
}

.timeline-preview {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(300px, 72vw);
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text);
  text-align: left;
  white-space: normal;
  box-shadow: var(--shadow-md);
}

.timeline-preview strong,
.timeline-preview__range,
.timeline-preview__summary,
.timeline-preview__duration {
  color: var(--text);
}

.timeline-preview__range,
.timeline-preview__duration {
  font-size: 0.78rem;
  color: var(--text-faint);
}

.timeline-preview__summary {
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--text-soft);
}

/* Vertical timeline */

.timeline-panel--vertical,
.timeline-panel--compact {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.timeline-chapters--vertical {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-chapter-row {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface-soft);
  text-align: left;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.timeline-chapter-row:hover,
.timeline-chapter-row.previewed {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.08);
}

.timeline-chapter-row.selected,
.timeline-chapter-row.active {
  border-color: rgba(59, 130, 246, 0.45);
  background: rgba(59, 130, 246, 0.12);
}

.timeline-chapter-row__index {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.08);
  font-weight: 700;
}

.timeline-chapter-row__content {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.timeline-chapter-row__content strong {
  color: var(--text);
}

.timeline-chapter-row__content span,
.timeline-chapter-card__time {
  color: var(--text-faint);
  font-size: 0.84rem;
}

.timeline-chapter-detail {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-soft);
}

/* Horizontal timeline */

.timeline-chapters--horizontal {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.timeline-chapter-card {
  flex: 0 0 auto;
  min-width: 150px;
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface-soft);
  text-align: left;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.timeline-chapter-card:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.3);
}

.timeline-chapter-card.selected,
.timeline-chapter-card.active {
  border-color: rgba(59, 130, 246, 0.45);
  background: rgba(59, 130, 246, 0.1);
}

.timeline-chapter-card__index {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text);
}

/* Network / state */

.node-card__actions,
.relationship-actions {
  align-items: center;
  justify-content: space-between;
}

.weight-badge {
  background: #f3f4f6;
  color: #000;
  border-color: #000;
  font-weight: 700;
}

.network-toolbar__controls {
  align-items: center;
}

.network-toolbar__controls input[type="range"] {
  accent-color: #000;
}

.active-concept-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 20px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.focused-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-state {
  padding: 30px;
  border: 1px dashed var(--border-strong);
  border-radius: 22px;
  background: var(--surface);
  color: var(--text-soft);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.video-grid .empty-state {
  grid-column: 1 / -1;
}

.video-card__actions {
  margin-top: auto;
}

.chapter-compare-list li,
.more-video-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-soft);
}

.chapter-compare-list li {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.more-video-card {
  width: 100%;
  text-align: left;
}

.more-video-card__player {
  width: 100%;
  border-radius: 14px;
  background: #000;
}

.more-video-card__body {
  display: grid;
  gap: 4px;
}

.more-video-card__body strong {
  color: var(--text);
}

.more-videos-browse-btn {
  width: 100%;
  justify-content: center;
  margin-top: 12px;
}

.concept-card__title-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.concept-chip {
  cursor: pointer;
}

.video-explorer__header-actions {
  justify-content: flex-end;
  align-items: flex-end;
}

/* Responsive */

@media (max-width: 900px) {
  .video-explorerlayout,
  .video-explorerlayout--with-sidebar,
  .video-explorer__layout,
  .video-detail-grid,
  .comparison-layout,
  .comparison-unique-grid {
    grid-template-columns: 1fr;
  }

  .video-title-card,
  .video-details-collapsible__toggle,
  .chapter-panel,
  .sidebar-card {
    padding: 16px 18px;
    border-radius: 18px;
  }

  .video-summary-card__head {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 640px) {
  .video-title-card__top,
  .chapter-panel__header,
  .timeline-panel__header,
  .timeline-chapter-detail__head {
    flex-direction: column;
    align-items: stretch;
  }

  .video-title-card__actions,
  .video-explorer__header-actions {
    width: 100%;
  }

  .video-title-card__actions .primary-btn,
  .video-title-card__actions .secondary-btn,
  .video-explorer__header-actions .primary-btn,
  .video-explorer__header-actions .secondary-btn,
  .more-videos-browse-btn {
    width: 100%;
    justify-content: center;
  }

  .summary-toggle {
    width: 100%;
  }

  .summary-toggle button {
    flex: 1 1 auto;
    text-align: center;
  }

  .chapter-compare-list li {
    grid-template-columns: 1fr;
  }
}
/* =========================================
   Network view
========================================= */

.network-view-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.network-view-toggle button {
  padding: 10px 14px;
  border: 1px solid #000;
  border-radius: 999px;
  background: #fff;
  color: #000;
  font-weight: 700;
}

.network-view-toggle button.active {
  background: #000;
  color: #fff;
  border-color: #000;
}

.network-graph-panel {
  overflow: hidden;
}

.network-panel-note {
  margin-top: 6px;
  color: var(--text-faint);
  font-size: 0.9rem;
  line-height: 1.55;
}

.network-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  color: var(--text-soft);
  font-size: 0.84rem;
}

.network-legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-dot--blue { background: #2563eb; }
.legend-dot--purple { background: #7c3aed; }
.legend-dot--pink { background: #db2777; }
.legend-dot--amber { background: #d97706; }
.legend-dot--teal { background: #0f766e; }
.legend-dot--slate { background: #475569; }

.network-graph-wrap {
  width: 100%;
  overflow: auto;
  border: 1px solid var(--divider);
  border-radius: 18px;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.04), transparent 30%),
    linear-gradient(180deg, var(--surface-soft) 0%, var(--surface) 100%);
}

.network-graph {
  display: block;
  width: 100%;
  min-width: 760px;
  min-height: 520px;
}

.network-edge {
  stroke: rgba(15, 23, 42, 0.18);
  stroke-linecap: round;
  transition: opacity 0.18s ease, stroke 0.18s ease;
}

.network-edge.active {
  stroke: rgba(15, 23, 42, 0.42);
}

.network-edge.dimmed {
  opacity: 0.18;
}

.network-node {
  cursor: pointer;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.network-node:hover .network-node-circle {
  filter: brightness(1.03);
}

.network-node.dimmed {
  opacity: 0.24;
}

.network-node-circle {
  stroke: rgba(255, 255, 255, 0.95);
  stroke-width: 3;
  transition: transform 0.18s ease;
}

.network-node-ring {
  stroke: rgba(15, 23, 42, 0.28);
  stroke-width: 2;
}

.network-node-count {
  fill: #fff;
  font-size: 0.85rem;
  font-weight: 800;
  pointer-events: none;
}

.network-node-label {
  fill: var(--text);
  font-size: 0.78rem;
  font-weight: 700;
  pointer-events: none;
}

.network-concept-strip {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--divider);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--surface-soft) 0%, var(--surface) 100%);
}

.network-concept-striphead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.network-concept-striphead h4 {
  margin: 0;
}

.network-concept-striphead span {
  color: var(--text-faint);
  font-size: 0.82rem;
}

.network-concept-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.network-concept-chip strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
  font-size: 0.72rem;
  line-height: 1;
}

.network-concept-chip.active strong {
  background: rgba(255, 255, 255, 0.18);
}

.network-mini-action {
  width: auto;
  min-width: unset;
  padding: 8px 12px;
}

/* Video explorer additions */

.video-explorer-layout,
.video-explorer__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.video-explorer-main,
.video-explorer__main,
.video-explorer-sidebar,
.video-explorer__sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.video-title-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.video-progress-inline {
  margin: 8px 0 0;
  color: var(--text-soft);
  font-size: 0.92rem;
}

.video-player-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.player-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--divider);
  border-radius: 16px;
  background: var(--surface-soft);
}

.player-toolbar-group,
.timeline-chapter-card-meta,
.timeline-chapter-card-actions,
.timeline-marker-row,
.bookmark-card-actions,
.note-card-head,
.playlist-card,
.export-actions,
.playback-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.player-toolbar-group--actions {
  margin-left: auto;
}

.player-toolbar-label {
  color: var(--text-soft);
  font-size: 0.82rem;
  font-weight: 700;
}

.player-select,
.playlist-create input,
.notes-compose textarea,
.note-card textarea,
.note-composer textarea,
.sidebar-card select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  resize: vertical;
}

.video-progress-bar,
.progress-mini-bar {
  width: 100%;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-soft-2);
}

.video-progress-bar {
  height: 8px;
}

.progress-mini-bar {
  height: 10px;
}

.video-progress-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #0f172a);
}

.progress-mini {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-mini-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4b5563 0, #111827 70%, #000 100%);
}

.timeline-chapter-card {
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--divider);
  border-radius: 16px;
  background: var(--surface);
}

.timeline-chapter-card-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
}

.timeline-chapter-card.active {
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
}

.timeline-chapter-card.selected {
  border-color: rgba(0, 0, 0, 0.18);
}

.timeline-marker {
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.badge-bookmark {
  background: #fef3c7;
  color: #92400e;
}

.badge-note {
  background: #dbeafe;
  color: #1d4ed8;
}

.bookmark-list,
.notes-list,
.playlist-list,
.playlist-items,
.note-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bookmark-card,
.note-card,
.playlist-card {
  padding: 12px 14px;
  border: 1px solid var(--divider);
  border-radius: 14px;
  background: var(--surface-soft);
}

.notes-compose,
.note-composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.playlist-create {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.chapter-panel-header,
.playlist-card-head,
.playlist-item-row,
.bookmark-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.secondary-btn.small,
.primary-btn.small {
  min-height: auto;
  padding: 8px 12px;
  font-size: 0.82rem;
}

.playlist-card-head > div:first-child,
.playlist-item-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.playlist-card-head span,
.playlist-item-copy span,
.progress-mini p,
.meta {
  color: var(--text-faint);
  font-size: 0.84rem;
}

.playlist-card-actions,
.playlist-item-actions,
.related-cardactions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.more-video-cardpreview {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
}

.more-video-cardfallback {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 140px;
  padding: 1rem;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--surface-soft), var(--surface-soft-2));
  color: var(--text-soft);
  text-align: center;
}

/* =========================================
   Collection analytics
========================================= */

.collection-layout--visual {
  align-items: start;
}

.insight-band {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.insight-tile {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--divider);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--surface-soft) 0%, var(--surface) 100%);
}

.insight-tile strong {
  font-size: 1rem;
  line-height: 1.35;
}

.insight-tile p {
  margin: 0;
  color: var(--text-soft);
}

.matrix-wrap,
.heatmap-wrap {
  width: 100%;
  overflow: auto;
  border: 1px solid var(--divider);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--surface-soft) 0%, var(--surface) 100%);
}

.similarity-matrix,
.topic-heatmap {
  display: grid;
  min-width: max-content;
}

.matrix-corner,
.matrix-label,
.matrix-cell,
.heatmap-cell {
  min-height: 64px;
  padding: 10px;
  border-right: 1px solid var(--divider);
  border-bottom: 1px solid var(--divider);
}

.matrix-corner {
  position: sticky;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  background: var(--surface);
  color: var(--text);
  font-weight: 800;
}

.matrix-label {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  text-align: center;
}

.matrix-label--top {
  font-size: 0.78rem;
  font-weight: 700;
}

.matrix-label--side {
  position: sticky;
  left: 0;
  z-index: 1;
  justify-content: flex-start;
}

.matrix-cell,
.heatmap-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  font-weight: 800;
  transition: transform 0.16s ease, filter 0.16s ease;
}

.matrix-cell:hover,
.heatmap-cell:hover {
  transform: scale(0.98);
  filter: brightness(0.98);
}

.matrix-cell--self {
  color: var(--text-faint);
}

.heatmap-concept.active {
  background: #000;
  color: #fff;
}

.heatmap-cell {
  font-size: 1rem;
}

.heatmap-cell.present {
  color: #0f172a;
}

.heatmap-cell.active {
  outline: 2px solid #000;
  outline-offset: -2px;
}

.concept-board {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.concept-board-card {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding: 16px;
  border: 1px solid var(--divider);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
}

.concept-board-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.concept-board-meta span {
  color: var(--text-soft);
  font-size: 0.9rem;
}

.concept-board-videos,
.learning-path {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.concept-video-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--divider);
  border-radius: 16px;
  background: var(--surface);
}

.concept-video-pill span {
  display: block;
  margin-top: 4px;
  color: var(--text-faint);
  font-size: 0.84rem;
}

.collection-unique-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.unique-video-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--divider);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
}

.learning-step {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.learning-stepmarker {
  position: relative;
  display: flex;
  justify-content: center;
}

.learning-stepmarker span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #000;
  color: #fff;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}

.learning-step:not(:last-child) .learning-stepmarker::after {
  content: "";
  position: absolute;
  top: 40px;
  width: 2px;
  height: calc(100% + 12px);
  background: var(--divider);
}

.learning-stepcontent {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--divider);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
}

.learning-stepcontent p {
  margin: 0;
  color: var(--text-soft);
}

/* Responsive */

@media (max-width: 1080px) {
  .video-explorer-layout,
  .video-explorer__layout {
    grid-template-columns: 1fr;
  }

  .player-toolbar-group--actions {
    margin-left: 0;
  }

  .insight-band {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .collection-unique-grid,
  .concept-board-card {
    grid-template-columns: 1fr;
  }

  .concept-video-pill {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 900px) {
  .playlist-card-head,
  .playlist-item-row,
  .note-card-head,
  .bookmark-row {
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .network-view-toggle {
    width: 100%;
  }

  .network-view-toggle button {
    flex: 1 1 100px;
    justify-content: center;
  }

  .network-legend {
    gap: 8px 12px;
    font-size: 0.8rem;
  }

  .network-graph {
    min-width: 680px;
    min-height: 480px;
  }

  .insight-band {
    grid-template-columns: 1fr;
  }

  .matrix-corner,
  .matrix-label,
  .matrix-cell,
  .heatmap-cell {
    min-height: 58px;
    padding: 8px;
    font-size: 0.8rem;
  }
}

/* About */

.about-page--rich {
  min-height: calc(100vh - 180px);
  padding: 0;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
}

.about-shell {
  display: grid;
  gap: 24px;
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
}

.about-hero-banner {
  display: block;
  padding: 34px;
  border: 1px solid var(--border);
  border-radius: 28px;
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  color: var(--text);
  box-shadow: var(--shadow-md);
}

.about-hero-banner__brand {
  display: block;
}

.about-hero-banner__logo {
  display: none;
}

.about-hero-banner__brand-copy h2 {
  margin: 6px 0 14px;
  color: var(--text);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.08;
}

.about-hero-banner__brand-copy p {
  max-width: 70ch;
  color: var(--text-soft);
  line-height: 1.75;
}

.about-hero-banner__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
  margin-bottom: 20px;
}

.about-mini-stat {
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.about-mini-stat span {
  display: block;
  margin-bottom: 6px;
  color: var(--text-faint);
  font-size: 0.82rem;
}

.about-mini-stat strong {
  color: var(--text);
  font-size: 1rem;
}

.about-card {
  padding: 28px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.about-card h3 {
  margin: 0 0 16px;
  color: #0f172a;
  font-size: 1.55rem;
}

.about-card p {
  margin: 0 0 14px;
  color: #334155;
  line-height: 1.8;
}

.about-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.about-card__icon {
  font-size: 1.6rem;
}

.about-two-col-list,
.about-evaluation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.about-section-stack {
  display: grid;
  gap: 18px;
}

.about-section-heading h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 1.7rem;
}

.about-section-heading p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}

.student-track-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.student-track {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.student-track__top {
  padding: 24px;
  color: #fff;
}

.student-track--blue .student-track__top {
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
}

.student-track--purple .student-track__top {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
}

.student-track--orange .student-track__top {
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
}

.student-track__label {
  margin: 0 0 8px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.92;
}

.student-track__top h4 {
  margin: 0 0 10px;
  font-size: 1.45rem;
  line-height: 1.2;
}

.student-track__top p {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.7;
}

.student-track__body {
  padding: 24px;
}

.student-track__body h5 {
  margin: 0 0 12px;
  color: #0f172a;
  font-size: 0.98rem;
}

.student-track__body .clean-list {
  margin-bottom: 18px;
}

.student-track__body .clean-list li {
  color: #334155;
  line-height: 1.7;
}

.reference-list {
  display: grid;
  gap: 16px;
}

.reference-item {
  padding-left: 16px;
  border-left: 4px solid transparent;
}

.reference-item--blue {
  border-left-color: #3b82f6;
}

.reference-item--purple {
  border-left-color: #8b5cf6;
}

.reference-item--orange {
  border-left-color: #f97316;
}

.reference-item h4 {
  margin: 0 0 6px;
  color: #0f172a;
}

.reference-item p {
  margin: 0;
}

.reference-item a {
  color: #000;
  text-decoration: none;
}

.reference-item a:hover {
  text-decoration: underline;
}

.about-evaluation-banner {
  padding: 30px;
  border-radius: 28px;
  background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
  color: #fff;
  box-shadow: 0 22px 48px rgba(124, 58, 237, 0.2);
}

.about-evaluation-banner h3 {
  margin: 0 0 20px;
  font-size: 1.7rem;
}

.about-evaluation-grid h4 {
  margin: 0 0 12px;
  color: #fff;
}

.about-evaluation-grid .clean-list li {
  color: rgba(250, 245, 255, 0.95);
}

.about-note {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 14px;
  padding: 24px;
  border: 1px solid #fde68a;
  border-radius: 22px;
  background: #fefce8;
}

.about-note__icon {
  font-size: 1.6rem;
}

.about-note h3 {
  margin: 0 0 8px;
  color: #854d0e;
}

.about-note p {
  margin: 0;
  color: #92400e;
  line-height: 1.75;
}

/* Footer */

.app-footer {
  width: 100%;
  max-width: var(--page-max-width);
  margin: 32px auto 0;
  padding: 12px 0 8px;
}

.app-footer__inner {
  width: 100%;
  padding-top: 20px;
  border-top: 1px solid var(--divider);
  text-align: center;
}

.app-footer__inner p {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.6;
}

.app-footer__subtext {
  margin-top: 4px !important;
  color: var(--text-faint) !important;
  font-size: 0.8rem !important;
}

/* Premium visual pass — enhancement only */

.home-page,
.collection-page,
.network-page,
.comparison-page,
.metadata-page {
  position: relative;
}

.home-page::before,
.collection-page::before,
.network-page::before,
.comparison-page::before,
.metadata-page::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.9;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.75), transparent 28%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 24%),
    linear-gradient(180deg, #f7f9fc 0%, #f4f7fb 100%);
}

.home-hero,
.collection-hero,
.network-hero,
.comparison-hero,
.metadata-page > .panel:first-child {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.home-hero::before,
.collection-hero::before,
.network-hero::before,
.comparison-hero::before,
.metadata-page > .panel:first-child::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.home-hero > *,
.collection-hero > *,
.network-hero > *,
.comparison-hero > *,
.metadata-page > .panel:first-child > * {
  position: relative;
  z-index: 1;
}

.home-hero::before {
  background:
    radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.14), transparent 30%),
    radial-gradient(circle at 0% 100%, rgba(20, 184, 166, 0.1), transparent 26%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
}

.collection-hero::before {
  background:
    radial-gradient(circle at 100% 0%, rgba(124, 58, 237, 0.16), transparent 30%),
    radial-gradient(circle at 0% 100%, rgba(236, 72, 153, 0.09), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
}

.network-hero::before {
  background:
    radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.14), transparent 30%),
    radial-gradient(circle at 0% 100%, rgba(168, 85, 247, 0.11), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
}

.comparison-hero::before {
  background:
    radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.14), transparent 28%),
    radial-gradient(circle at 0% 100%, rgba(239, 68, 68, 0.09), transparent 26%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
}

.metadata-page > .panel:first-child::before {
  background:
    radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.12), transparent 28%),
    radial-gradient(circle at 0% 100%, rgba(59, 130, 246, 0.08), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
}

.results-head h3,
.panel h3,
.sidebar-card h3,
.chapter-panel h3,
.info-block h4,
.panel h4 {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.results-head h3::before,
.panel h3::before,
.sidebar-card h3::before,
.chapter-panel h3::before,
.info-block h4::before,
.panel h4::before {
  content: "";
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
}

.collection-page .panel h3::before,
.collection-page .results-head h3::before {
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.08);
}

.network-page .panel h3::before,
.network-page .results-head h3::before {
  background: linear-gradient(135deg, #2563eb, #8b5cf6);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
}

.metadata-page .panel h3::before {
  background: linear-gradient(135deg, #f59e0b, #2563eb);
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.08);
}

.video-card,
.stat-card,
.panel,
.related-card,
.node-card,
.relationship-card,
.concept-card,
.sidebar-card,
.insight-tile,
.unique-video-card,
.concept-board-card,
.learning-stepcontent,
.network-concept-strip,
.matrix-wrap,
.heatmap-wrap,
.network-graph-wrap {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.045),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
}

.video-card:hover,
.stat-card:hover,
.panel:hover,
.related-card:hover,
.node-card:hover,
.relationship-card:hover,
.concept-card:hover,
.sidebar-card:hover,
.insight-tile:hover,
.unique-video-card:hover,
.concept-board-card:hover,
.learning-stepcontent:hover {
  transform: translateY(-3px);
  border-color: rgba(15, 23, 42, 0.14);
  box-shadow:
    0 18px 36px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.stat-card,
.insight-tile {
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.65), transparent 35%),
    linear-gradient(180deg, var(--surface-soft) 0%, var(--surface) 100%);
}

.stat-card strong {
  font-size: 1.8rem;
  letter-spacing: -0.05em;
}

.insight-tile strong,
.unique-video-card h4,
.concept-board-card strong,
.learning-stepcontent strong {
  color: var(--text);
  letter-spacing: -0.02em;
}

.video-card.selected,
.node-card.selected,
.node-card.focused,
.chip.active,
.heatmap-concept.active,
.heatmap-cell.active {
  border-color: rgba(37, 99, 235, 0.22);
  box-shadow:
    0 0 0 1px rgba(37, 99, 235, 0.14),
    0 18px 36px rgba(37, 99, 235, 0.08);
}

.collection-page .chip.active,
.collection-page .heatmap-concept.active,
.collection-page .heatmap-cell.active {
  border-color: rgba(124, 58, 237, 0.24);
  box-shadow:
    0 0 0 1px rgba(124, 58, 237, 0.14),
    0 18px 36px rgba(124, 58, 237, 0.08);
}

.network-graph-wrap,
.matrix-wrap,
.heatmap-wrap {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.55), transparent 28%),
    linear-gradient(180deg, var(--surface-soft) 0%, var(--surface) 100%);
}

.network-graph-wrap::after,
.matrix-wrap::after,
.heatmap-wrap::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.primary-btn,
.secondary-btn {
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease;
}

.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:hover {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
}

.secondary-btn:hover {
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

/* Home page final horizontal cards */

.home-page .video-grid {
  grid-template-columns: 1fr;
  gap: 18px;
}

.home-page .video-card {
  overflow: visible;
  padding: 0;
  border: 1px solid var(--divider);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--surface) 0, var(--surface-soft) 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.045);
}

.home-page .video-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.home-page .video-card.selected {
  border-color: rgba(0, 0, 0, 0.22);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08);
}

.home-page .video-cardsurface,
.home-page .video-card__surface {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  align-items: center;
  gap: 0;
  width: 100%;
  padding: 0;
  border: none;
  border-radius: inherit;
  background: transparent;
  text-align: left;
  overflow: hidden;
}

.home-page .video-card-thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  padding: 18px;
  border-right: 1px solid var(--divider);
  border-bottom: none;
  background: var(--surface-soft);
  border-top-left-radius: 22px;
  border-bottom-left-radius: 22px;
  overflow: hidden;
}

.home-page .video-card-thumbnail-media,
.home-page .video-card-thumbnail video {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  object-fit: cover;
}

.home-page .video-card-thumbnail-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 240px;
  padding: 1rem;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: rgba(255, 255, 255, 0.88);
  text-align: center;
}

.home-page .video-card-thumbnail-overlay {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
}

.home-page .video-card-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  padding: 18px 20px;
  overflow: visible;
}

.home-page .video-card-toprow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.home-page .video-card-headline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.home-page .video-card-content .eyebrow {
  margin: 0;
  color: var(--text-faint);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
}

.home-page .video-card-content h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.04rem;
  line-height: 1.38;
  letter-spacing: -0.02em;
}

.home-page .video-card-pills,
.home-page .chip-group.compact {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  overflow: visible;
}

.home-page .meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid var(--divider);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-soft);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1;
}

.home-page .video-card-summary {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-soft);
  font-size: 0.93rem;
  line-height: 1.62;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.home-page .video-card-content .chip {
  padding: 6px 10px;
  font-size: 0.74rem;
}

.home-page .video-card-sideactions,
.home-page .video-cardactions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.home-page .video-cardactions {
  margin-top: 2px;
}

.home-page .video-cardactions .primary-btn,
.home-page .video-cardactions .secondary-btn {
  min-width: 148px;
  justify-content: center;
}

.home-page .video-card-preview-button {
  padding: 0;
  border: none;
  background: var(--surface-soft);
  text-align: left;
  cursor: pointer;
}

.home-page .video-card-preview-button:hover {
  filter: brightness(0.98);
}

.home-page .video-card-preview-button:focus-visible {
  outline: 2px solid var(--border-strong);
  outline-offset: -2px;
}

/* Concept popover */

.home-page .concept-popover-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.home-page .concept-more-trigger {
  white-space: nowrap;
  flex-shrink: 0;
}

.home-page .concept-popover {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(360px, 72vw);
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  border: 1px solid var(--divider);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.14);
}

.home-page .concept-popover-title {
  margin: 0;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.home-page .concept-popover::before {
  content: "";
  position: absolute;
  top: -7px;
  left: 20px;
  width: 12px;
  height: 12px;
  border-top: 1px solid var(--border);
  border-left: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.99);
  transform: rotate(45deg);
}

.home-page .concept-popover .chip-group.compact {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 8px;
}

.home-page .concept-popover .chip {
  max-width: 100%;
  white-space: normal;
  text-align: left;
}

.home-page .concept-popover-wrap:hover .concept-popover,
.home-page .concept-popover-wrap:focus-within .concept-popover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.home-page .concept-popover::-webkit-scrollbar {
  width: 8px;
}

.home-page .concept-popover::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.45);
}

.home-page .concept-popover::-webkit-scrollbar-track {
  background: transparent;
}

/* Dark helpers */

[data-theme="dark"] .landing-nav-card__icon--video {
  color: #93c5fd;
  background: rgba(37, 99, 235, 0.18);
}

[data-theme="dark"] .landing-nav-card__icon--collection {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.18);
}

[data-theme="dark"] .landing-nav-card__icon--network {
  color: #c4b5fd;
  background: rgba(124, 58, 237, 0.2);
}

[data-theme="dark"] .landing-capability__icon--chaptering {
  color: #5eead4;
  background: rgba(20, 184, 166, 0.16);
}

[data-theme="dark"] .landing-capability__icon--summary {
  color: #c4b5fd;
  background: rgba(124, 58, 237, 0.18);
}

[data-theme="dark"] .landing-capability__icon--analytics {
  color: #93c5fd;
  background: rgba(37, 99, 235, 0.18);
}

[data-theme="dark"] .home-page::before,
[data-theme="dark"] .collection-page::before,
[data-theme="dark"] .network-page::before,
[data-theme="dark"] .comparison-page::before,
[data-theme="dark"] .metadata-page::before {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.03), transparent 28%),
    radial-gradient(circle at top right, rgba(79, 152, 163, 0.08), transparent 24%),
    linear-gradient(180deg, #171614 0%, #1c1b19 100%);
}

[data-theme="dark"] .video-card,
[data-theme="dark"] .stat-card,
[data-theme="dark"] .panel,
[data-theme="dark"] .related-card,
[data-theme="dark"] .node-card,
[data-theme="dark"] .relationship-card,
[data-theme="dark"] .concept-card,
[data-theme="dark"] .sidebar-card,
[data-theme="dark"] .insight-tile,
[data-theme="dark"] .unique-video-card,
[data-theme="dark"] .concept-board-card,
[data-theme="dark"] .learning-stepcontent,
[data-theme="dark"] .network-concept-strip,
[data-theme="dark"] .matrix-wrap,
[data-theme="dark"] .heatmap-wrap,
[data-theme="dark"] .network-graph-wrap {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 14px 30px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* Responsive */

@media (max-width: 1024px) {
  .comparison-layout,
  .comparison-unique-grid,
  .collection-layout,
  .network-layout,
  .video-explorer__layout,
  .filters-bar,
  .landing-card-grid,
  .landing-capabilities-grid,
  .student-track-grid,
  .about-two-col-list,
  .about-evaluation-grid,
  .about-hero-banner__stats {
    grid-template-columns: 1fr;
  }

  .landing-nav-card {
    min-height: 180px;
  }

  .topbar,
  .home-hero,
  .collection-hero,
  .network-hero,
  .comparison-hero,
  .video-explorer__header {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 900px) {
  .home-page .video-cardsurface,
  .home-page .video-card__surface {
    grid-template-columns: 1fr;
  }

  .home-page .video-card-thumbnail {
    min-height: auto;
    aspect-ratio: 16 / 9;
    border-right: none;
    border-bottom: 1px solid var(--divider);
  }

  .home-page .video-card-thumbnail-media,
  .home-page .video-card-thumbnail video,
  .home-page .video-card-thumbnail img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-top-left-radius: inherit;
    border-bottom-left-radius: inherit;
  }

  .home-page .video-card-content {
    padding: 16px 16px 14px;
  }

  .home-page .video-card-toprow {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .home-page .video-cardactions,
  .home-page .video-card-sideactions {
    justify-content: flex-start;
  }

  .home-page .video-cardactions .primary-btn,
  .home-page .video-cardactions .secondary-btn,
  .home-page .video-card-sideactions .primary-btn,
  .home-page .video-card-sideactions .secondary-btn {
    width: auto;
    min-width: 140px;
  }

  .home-page .concept-popover {
    min-width: 300px;
    max-width: min(420px, calc(100vw - 48px));
  }

  .about-shell {
    width: min(100% - 24px, 1180px);
  }

  .about-hero-banner,
  .about-card,
  .about-evaluation-banner,
  .about-note,
  .landing-detail-card,
  .topbar,
  .home-hero,
  .collection-hero,
  .network-hero,
  .comparison-hero,
  .video-explorer__header,
  .panel,
  .sidebar-card,
  .video-player,
  .timeline-panel,
  .chapter-panel {
    padding: 16px;
    border-radius: 18px;
  }

  .timeline-chapter {
    min-width: 100%;
  }

  .ordered-item,
  .chapter-panel__header,
  .network-toolbar,
  .results-head,
  .panel-head,
  .relationship-card__head,
  .concept-card__head,
  .node-card__head,
  .active-concept-bar,
  .video-explorer__header-actions,
  .table-video-actions,
  .comparison-actions,
  .related-card__actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-toggle,
  .hero-actions,
  .network-toolbar__controls {
    width: 100%;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
    justify-content: center;
  }

  .timeline-preview {
    position: static;
    width: 100%;
    margin-top: 10px;
  }
}

@media (max-width: 820px) {
  .hamburger-btn {
    display: inline-flex;
  }

  .topbar-nav {
    display: none;
    flex-direction: column;
    justify-content: flex-start;
    width: 100%;
    margin-left: 0;
  }

  .topbar-nav.open {
    display: flex;
  }

  .topbar-nav button {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .app-shell {
    padding: var(--page-gutter-mobile);
  }

  .main-content,
  .landing-page__inner,
  .home-page,
  .video-explorer,
  .collection-page,
  .network-page,
  .comparison-page,
  .about-page,
  .metadata-page,
  .about-shell,
  .landing-topbar,
  .app-footer {
    max-width: 100%;
  }

  .primary-btn,
  .secondary-btn {
    width: auto;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .home-page .video-grid {
    gap: 16px;
  }

  .home-page .video-card-content {
    padding: 15px 15px 12px;
  }

  .home-page .video-cardactions {
    justify-content: stretch;
  }

  .home-page .video-cardactions .primary-btn,
  .home-page .video-cardactions .secondary-btn {
    width: 100%;
  }

  .home-page .concept-popover {
    left: 0;
    right: auto;
    width: min(300px, 82vw);
    min-width: 240px;
    max-width: min(340px, calc(100vw - 36px));
    max-height: 180px;
    padding: 12px 12px 10px;
  }

  .about-note {
    grid-template-columns: 1fr;
  }
}