export default function Logo() {
  return (
    <div className="brand-logo" aria-hidden="true">
      <svg
        className="brand-logo__svg"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 24L32 14L56 24L32 34L8 24Z"
          className="brand-logo__cap-top"
        />
        <path
          d="M20 30V38C20 40 25 44 32 44C39 44 44 40 44 38V30"
          className="brand-logo__cap-band"
        />
        <path
          d="M56 24V38"
          className="brand-logo__tassel-line"
        />
        <circle
          cx="56"
          cy="41"
          r="3"
          className="brand-logo__tassel-dot"
        />
      </svg>
    </div>
  );
}