export default function Logo() {
  return (
    <div className="w-11 h-11 inline-flex items-center justify-center flex-shrink-0" aria-hidden="true">
      <svg
        className="w-full h-full block overflow-visible"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cap top */}
        <path d="M8 24L32 14L56 24L32 34L8 24Z" fill="#111111" />
        {/* Cap band */}
        <path
          d="M20 30V38C20 40 25 44 32 44C39 44 44 40 44 38V30"
          stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
        {/* Tassel line */}
        <path d="M56 24V38" stroke="#ecc206" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Tassel dot */}
        <circle cx="56" cy="41" r="3" fill="#ecc206" />
      </svg>
    </div>
  );
}
