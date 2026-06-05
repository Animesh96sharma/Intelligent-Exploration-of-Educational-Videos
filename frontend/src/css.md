App.css

:root {
  --bg: #f3f7fc;
  --bg-accent: #eef4ff;
  --surface: #ffffff;
  --surface-soft: #f8fbff;
  --surface-soft-2: #eff6ff;
  --surface-muted: #f8fbff;
  --surface-elevated: rgba(255, 255, 255, 0.92);

  --border: #dbe6f3;
  --border-strong: #c7d7ea;
  --divider: #edf2f8;

  --text: #0f172a;
  --text-soft: #000000;
  --text-faint: #22948a;

  --primary: #2563eb;
  --primary-soft: #dbeafe;
  --primary-strong: #1d4ed8;

  --success-soft: #dcfce7;
  --warning-soft: #fef3c7;

  --shadow-sm: 0 8px 20px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 18px 40px rgba(15, 23, 42, 0.08);

  --radius-lg: 18px;
  --radius-md: 14px;
  --radius-sm: 10px;
  --max-width: 100%;
}

[data-theme="dark"] {
  --bg: #08111f;
  --bg-accent: #0b1324;
  --surface: #0f172a;
  --surface-soft: #111c31;
  --surface-soft-2: #16233a;
  --surface-muted: #152033;
  --surface-elevated: rgba(15, 23, 42, 0.92);

  --border: #22314b;
  --border-strong: #314563;
  --divider: #243247;

  --text: #f8fafc;
  --text-soft: #dbe4f3;
  --text-faint: #94a3b8;

  --primary: #60a5fa;
  --primary-soft: rgba(96, 165, 250, 0.16);
  --primary-strong: #93c5fd;

  --success-soft: rgba(34, 197, 94, 0.16);
  --warning-soft: rgba(251, 191, 36, 0.16);

  --shadow-sm: 0 8px 20px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 18px 40px rgba(0, 0, 0, 0.34);
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
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 28%),
    linear-gradient(180deg, var(--bg-accent) 0%, var(--bg) 34%, var(--surface-soft) 100%);
  color: var(--text);
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
}

.app-shell {
  min-height: 100vh;
  padding: 16px 18px;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-logo__svg {
  width: 42px;
  height: 42px;
  display: block;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--text);
}

.brand-copy p {
  margin: 4px 0 0;
  font-size: 0.88rem;
  line-height: 1.35;
  color: var(--text-soft);
  max-width: 520px;
}

.topbar {
  width: 100%;
  max-width: none;
  margin: 0 0 20px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  backdrop-filter: blur(14px);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  border-radius: 24px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.topbar > div:not(.brand-block) h1 {
  margin: 0;
}

.topbar > div:not(.brand-block) p {
  margin: 6px 0 0;
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
  gap: 10px;
  justify-content: center;
}

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.theme-toggle {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  color: var(--text);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.theme-toggle__icon {
  width: 20px;
  height: 20px;
  display: block;
}

.brand-logo {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
  display: grid;
  place-items: center;
  box-shadow:
    inset 0 0 0 1px rgba(37, 99, 235, 0.1),
    0 10px 24px rgba(37, 99, 235, 0.08);
  flex-shrink: 0;
}

.brand-gradient {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.02;
  letter-spacing: -0.04em;
  background: linear-gradient(90deg, #2563eb 0%, #14b8a6 52%, #7c3aed 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.brand-tagline {
  margin: 4px 0 0;
  font-size: 0.9rem;
  line-height: 1.35;
  max-width: 560px;
  background: linear-gradient(90deg, #2563eb 0%, #0f766e 52%, #6d28d9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.topbar-nav button,
.primary-btn,
.secondary-btn,
.inline-link,
.video-card__surface {
  border: none;
  border-radius: 999px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.topbar-nav button {
  background: #eff6ff;
  color: var(--text-soft);
  padding: 10px 16px;
  font-weight: 600;
}

.topbar-nav button:hover,
.primary-btn:hover,
.secondary-btn:hover,
.inline-link:hover,
.video-card__surface:hover {
  transform: translateY(-1px);
}

.topbar-nav button.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}

.topbar-nav button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.landing-topbar {
  width: 100%;
  margin: 0 0 24px;
  padding: 12px 4px;
  display: flex;
  align-items: center;
}

.landing-page {
  min-height: calc(100vh - 110px);
  display: grid;
  place-items: center;
  padding: 24px;
}

.landing-page__inner {
  width: min(920px, 100%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

.landing-eyebrow {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
}

.landing-title {
  margin: 0;
  max-width: 14ch;
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
  min-width: 220px;
  padding: 14px 22px;
}

.filters-bar {
  width: 100%;
  max-width: none;
  margin: 0 0 24px;
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) repeat(2, minmax(180px, 0.7fr));
  gap: 14px;
}

.filters-bar input,
.filters-bar select,
.video-element,
.panel,
.stat-card,
.video-card,
.related-card,
.node-card,
.relationship-card,
.concept-card {
  border: 1px solid var(--border);
}

.filters-bar input,
.filters-bar select {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-sm);
  color: var(--text);
  border-radius: 16px;
  padding: 14px 16px;
  outline: none;
}

.filters-bar input:focus,
.filters-bar select:focus,
input[type="range"]:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.main-content {
  width: 100%;
  max-width: none;
  margin: 0;
}

.home-page,
.video-explorer,
.collection-page,
.network-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home-hero,
.collection-hero,
.network-hero {
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: 30px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.home-hero,
.collection-hero,
.network-hero,
.video-explorer__header {
  color: var(--text);
}

.home-hero h2,
.collection-hero h2,
.network-hero h2,
.video-explorer__header h2 {
  color: var(--text);
  margin: 8px 0 10px;
  font-size: clamp(1.75rem, 2.2vw, 2.5rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.home-hero p,
.collection-hero p,
.network-hero p,
.video-explorer__header p,
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

.primary-btn {
  background: var(--primary);
  color: white;
  padding: 12px 18px;
  font-weight: 700;
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.2);
}

.primary-btn:hover {
  background: var(--primary-strong);
}

.secondary-btn {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 11px 16px;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.inline-link {
  background: transparent;
  color: var(--primary);
  padding: 0;
  font-weight: 700;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary);
}

.section-note {
  margin-top: 12px;
  font-size: 0.92rem;
  color: var(--text-faint);
}

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
  background: var(--surface);
  border-radius: 22px;
  box-shadow: var(--shadow-sm);
}

.video-card,
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
  gap: 14px;
  min-height: 100%;
}

.video-card__surface {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
  padding: 0;
  background: transparent;
  text-align: left;
  box-shadow: none;
}

.video-card:hover,
.node-card:hover,
.related-card:hover,
.relationship-card:hover,
.concept-card:hover,
.panel:hover,
.sidebar-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.video-card.selected,
.node-card.selected,
.node-card.focused {
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 16px 36px rgba(37, 99, 235, 0.12);
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

.video-card__meta,
.meta-list,
.node-card__actions,
.relationship-actions,
.network-toolbar__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.video-card__meta span,
.node-card__actions span,
.weight-badge {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.8rem;
  color: var(--text);
}

.stat-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card strong {
  font-size: 1.7rem;
  letter-spacing: -0.04em;
}

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
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--divider);
}

.ordered-item:last-child {
  border-bottom: none;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-strong);
  padding: 7px 11px;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  border: none;
  cursor: pointer;
}

.chip.muted {
  background: var(--surface-soft-2);
  color: var(--text-faint);
}

.related-list,
.relationship-list,
.concept-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-card {
  color: var(--text);
}

.related-card strong,
.related-card span,
.related-card small {
  color: var(--text);
}

.related-card {
  width: 100%;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

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
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.video-explorer__header {
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: 28px;
  padding: 24px 26px;
}

.summary-toggle {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-toggle button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-soft);
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
}

.summary-toggle button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.video-player {
  background: var(--surface);
  border-radius: 24px;
  padding: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
}

.video-element {
  width: 100%;
  max-height: 520px;
  border-radius: 18px;
  background: #dbeafe;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.timeline-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.timeline-track {
  width: 100%;
  height: 12px;
  background: var(--surface-soft-2);
  border-radius: 999px;
  overflow: hidden;
}

.timeline-progress {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #60a5fa 0%, #2563eb 70%, #1d4ed8 100%);
}

.timeline-chapters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.timeline-chapter {
  min-width: 110px;
  flex: 1 1 120px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  color: var(--text-soft);
  border-radius: 16px;
  padding: 12px;
  text-align: left;
  position: relative;
  overflow: visible;
}

.timeline-chapter.active {
  border-color: rgba(37, 99, 235, 0.45);
  background: var(--surface-soft-2);
}

.timeline-chapter.selected {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border-color: transparent;
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

.chapter-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-panel__header,
.network-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
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

.meta-list {
  padding: 0;
  margin: 0;
  list-style: none;
  flex-direction: column;
}

.meta-list li {
  padding: 10px 12px;
  background: var(--surface-soft);
  border-radius: 14px;
  border: 1px solid var(--divider);
}

.node-card__actions,
.relationship-actions {
  justify-content: space-between;
  align-items: center;
}

.video-grid .empty-state {
  grid-column: 1 / -1;
}

.focused-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.weight-badge {
  color: var(--primary-strong);
  background: var(--primary-soft);
  border-color: transparent;
  font-weight: 700;
}

.network-toolbar__controls {
  align-items: center;
}

.network-toolbar__controls input[type="range"] {
  accent-color: var(--primary);
}

.empty-state {
  background: var(--surface);
  border: 1px dashed var(--border-strong);
  border-radius: 22px;
  padding: 30px;
  text-align: center;
  color: var(--text-soft);
  box-shadow: var(--shadow-sm);
}

.active-concept-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 20px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  color: var(--text);
}

.video-card__actions,
.related-card__actions,
.comparison-actions,
.table-video-actions,
.video-explorer__header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.video-card__actions {
  margin-top: auto;
}

.comparison-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-hero {
  background: linear-gradient(135deg, var(--surface), var(--surface-soft));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: 30px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.comparison-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.comparison-column {
  min-height: 100%;
}

.comparison-unique-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.comparison-subpanel {
  min-height: 100%;
}

.chapter-compare-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chapter-compare-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-soft);
  border: 1px solid var(--divider);
}

.table-video-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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

.concept-card__title-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.concept-chip {
  border: none;
  cursor: pointer;
}

.chip.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
}

.video-explorer__header-actions {
  justify-content: flex-end;
  align-items: flex-end;
}

.timeline-preview {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 20;
  width: min(300px, 72vw);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow-md);
  color: var(--text);
  text-align: left;
  white-space: normal;
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

@media (max-width: 1024px) {
  .comparison-layout,
  .comparison-unique-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .active-concept-bar,
  .comparison-hero,
  .video-explorer__header-actions,
  .table-video-actions,
  .comparison-actions,
  .related-card__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .timeline-preview {
    position: static;
    width: 100%;
    margin-top: 10px;
  }
}

@media (max-width: 1024px) {
  .topbar,
  .home-hero,
  .collection-hero,
  .network-hero,
  .video-explorer__header,
  .collection-layout,
  .network-layout,
  .video-explorer__layout {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .filters-bar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .app-shell {
    padding: 16px;
  }

  .topbar,
  .home-hero,
  .collection-hero,
  .network-hero,
  .video-explorer__header,
  .panel,
  .sidebar-card,
  .video-player,
  .chapter-panel,
  .timeline-panel {
    padding: 16px;
    border-radius: 18px;
  }

  .timeline-chapter {
    min-width: 100%;
  }

  .topbar-right {
    margin-left: 0;
    width: 100%;
  }

  .topbar-right .theme-toggle {
    width: 100%;
  }

  .ordered-item,
  .chapter-panel__header,
  .network-toolbar,
  .results-head,
  .panel-head,
  .relationship-card__head,
  .concept-card__head,
  .node-card__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .topbar-nav,
  .summary-toggle,
  .hero-actions,
  .network-toolbar__controls {
    width: 100%;
  }

  .topbar-nav button,
  .primary-btn,
  .secondary-btn {
    width: 100%;
    justify-content: center;
  }
}