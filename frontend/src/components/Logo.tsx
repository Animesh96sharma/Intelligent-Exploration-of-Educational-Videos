export default function Logo() {
  return (
    <div className="brand-logo" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="brand-logo__svg" role="img">
        <defs>
          <linearGradient id="logoHeadGradient" x1="18" y1="18" x2="46" y2="46">
            <stop offset="0%" stopColor="#e81b1be9" />
            <stop offset="100%" stopColor="#e81b1be9" />
          </linearGradient>

          <linearGradient id="logoCapGradient" x1="18" y1="10" x2="48" y2="24">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="logoBgGradient" x1="10" y1="8" x2="54" y2="56">
           <stop offset="0%" stopColor="#eff6ff00" />
           <stop offset="100%" stopColor="#e0f2fe00" />
          </linearGradient>
        </defs>

<rect x="8" y="8" width="200" height="60" rx="18" fill="url(#logoBgGradient)" className="brand-logo__bg" />

{/* head / play button */}
<circle cx="32" cy="37" r="13" className="brand-logo__head" />
<path d="M28.5 30.5L39 37L28.5 43.5V30.5Z" className="brand-logo__play" />

{/* tilted cap in front */}
<g transform="rotate(-14 30 50)">
  <path
    d="M17 18L34 10L51 18L34 26L17 18Z"
    className="brand-logo__cap-top"
  />
  <path
    d="M25 24H43C42.2 28.6 38.9 31 34 31C29.1 31 25.8 28.6 25 24Z"
    className="brand-logo__cap-band"
  />
  <path
    d="M46 21V30"
    className="brand-logo__tassel-line"
  />
  <circle cx="46" cy="32.5" r="2.2" className="brand-logo__tassel-dot" />
</g>
      </svg>
    </div>
  );
}