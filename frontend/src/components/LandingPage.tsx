type LandingPageProps = {
  onEnterHomepage: () => void
  onOpenAbout: () => void
  onOpenNetwork: () => void
}

export default function LandingPage({ onEnterHomepage, onOpenAbout, onOpenNetwork }: LandingPageProps) {
  return (
    <section className="min-h-[calc(100vh-110px)] p-0 grid place-items-center">
      <div className="w-full max-w-full mx-auto text-center flex flex-col items-center gap-5">

        {/* Title */}
        <div className="w-full flex flex-col items-center gap-0">
          <h2 className="m-0 max-w-[44ch] leading-[1.3] tracking-normal font-bold text-[clamp(2.8rem,7vw,3.7rem)] bg-gradient-to-r from-[#2b6eff] via-[#5837ff] to-[#ff1a94] bg-clip-text text-transparent">
            Intelligent Exploration
          </h2>
          <h2 className="m-0 max-w-[44ch] leading-[0.96] tracking-[-0.05em] font-bold text-[clamp(2.8rem,7vw,5.6rem)] text-[#0f172a]">
            of Educational Videos
          </h2>
          <h2 className="my-6 text-base tracking-[0.08em] uppercase text-[#334155] font-medium max-w-[100ch]">
            A comprehensive dashboard for exploring educational video collections through automatic segmentation, multi-level summarization, and interactive visualization
          </h2>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3.5 mt-2.5">
          <button
            type="button"
            className="border border-black rounded-[14px] bg-black text-white px-4 py-2.5 font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] hover:bg-[#111] hover:-translate-y-px transition-all duration-[180ms]"
            onClick={onEnterHomepage}
          >
            Start Exploring
          </button>
          <button
            type="button"
            className="border border-black rounded-[14px] bg-white text-black px-4 py-2.5 font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-[#f8f8f8] hover:-translate-y-px transition-all duration-[180ms]"
            onClick={onOpenAbout}
          >
            Learn More
          </button>
        </div>

        {/* Nav card grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-[18px] mt-7">
          <button
            type="button"
            className="border border-[#d9e2ec] bg-gradient-to-b from-white to-[#f8fafc] rounded-[22px] px-5 py-6 text-center text-[#0f172a] shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center gap-4 min-h-[180px] sm:min-h-[220px] hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:border-[#c5d2e0] transition-all duration-[180ms]"
            onClick={onEnterHomepage}
          >
            <span className="w-[76px] h-[76px] rounded-[22px] grid place-items-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] text-[#2563eb] bg-[#dbeafe]" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="w-[34px] h-[34px] block stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="6.5" width="12.5" height="11" rx="2.5" />
                <path d="M16 10l4.5-2.5v9L16 14Z" />
                <circle cx="8.5" cy="11.8" r="1.25" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <h3 className="m-0 text-[1.15rem] leading-[1.25] tracking-[-0.02em] text-[#0f172a] font-bold">Video Exploration</h3>
            <p className="m-0 text-[#334155] text-sm leading-relaxed">
              Navigate videos through chapter-aware browsing, concept discovery, and interactive playback entry points.
            </p>
          </button>

          <button
            type="button"
            className="border border-[#d9e2ec] bg-gradient-to-b from-white to-[#f8fafc] rounded-[22px] px-5 py-6 text-center text-[#0f172a] shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center gap-4 min-h-[180px] sm:min-h-[220px] hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:border-[#c5d2e0] transition-all duration-[180ms]"
            onClick={onEnterHomepage}
          >
            <span className="w-[76px] h-[76px] rounded-[22px] grid place-items-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] text-[#d97706] bg-[#fef3c7]" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="w-[34px] h-[34px] block stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5V11.5" />
                <path d="M9 19.5V6.5" />
                <path d="M14 19.5V9.5" />
                <path d="M19 19.5V4.5" />
                <path d="M3 19.5H21" />
              </svg>
            </span>
            <h3 className="m-0 text-[1.15rem] leading-[1.25] tracking-[-0.02em] text-[#0f172a] font-bold">Summaries</h3>
            <p className="m-0 text-[#334155] text-sm leading-relaxed">
              Explore multi-level summaries from short overviews to chapter-based and collection-level insights.
            </p>
          </button>

          <button
            type="button"
            className="border border-[#d9e2ec] bg-gradient-to-b from-white to-[#f8fafc] rounded-[22px] px-5 py-6 text-center text-[#0f172a] shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center gap-4 min-h-[180px] sm:min-h-[220px] hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:border-[#c5d2e0] transition-all duration-[180ms]"
            onClick={onOpenNetwork}
          >
            <span className="w-[76px] h-[76px] rounded-[22px] grid place-items-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] text-[#7c3aed] bg-[#ede9fe]" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="w-[34px] h-[34px] block stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="12" r="2.5" />
                <circle cx="17.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
                <path d="M8.2 10.9l6.9-3.2" />
                <path d="M8.2 13.1l6.9 3.2" />
              </svg>
            </span>
            <h3 className="m-0 text-[1.15rem] leading-[1.25] tracking-[-0.02em] text-[#0f172a] font-bold">Visualization</h3>
            <p className="m-0 text-[#334155] text-sm leading-relaxed">
              Understand relationships through timelines, concept links, comparison views, and collection-wide visual analytics.
            </p>
          </button>
        </div>

        {/* Technical capabilities detail card */}
        <section className="w-full bg-gradient-to-br from-white to-[#f8fafc] border border-[#d9e2ec] rounded-[30px] p-5 sm:p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)] text-left">
          <div className="w-full mb-5 flex flex-col gap-3 text-center">
            <h2 className="m-0 mb-2.5 text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.04em] text-[#0f172a]">
              Technical Capabilities
            </h2>
            <p className="m-0 mx-auto max-w-[760px] text-base leading-relaxed text-[#334155]">
              EduVid Explorer combines automatic video segmentation, intelligent summarization, and interactive visualization to support efficient exploration of long educational videos.
            </p>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-[18px]">
            <article className="bg-white border border-[#e8eef5] rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-3.5">
              <div className="w-[52px] h-[52px] rounded-2xl grid place-items-center mb-3.5 text-[#0f766e] bg-[#ccfbf1]">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2 5 13h5l-1 9 8-12h-5l1-8Z" />
                </svg>
              </div>
              <h3 className="m-0 mb-2.5 text-[1.08rem] leading-[1.3] text-[#0f172a] tracking-[-0.02em] font-bold">LLM-Powered Chaptering</h3>
              <p className="m-0 text-[0.95rem] leading-relaxed text-[#334155]">
                State-of-the-art video segmentation using large language models with multimodal inputs such as transcripts and frame captions.
              </p>
            </article>

            <article className="bg-white border border-[#e8eef5] rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-3.5">
              <div className="w-[52px] h-[52px] rounded-2xl grid place-items-center mb-3.5 text-[#7c3aed] bg-[#ede9fe]">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 18V6" />
                  <path d="M9.5 9.5C10 8 11 7 12 7s2 1 2.5 2.5" />
                  <path d="M8 5.5C8.8 3.9 10.2 3 12 3s3.2.9 4 2.5" />
                  <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
                  <path d="M7.5 12.5a4.5 4.5 0 0 0-2.5 4" />
                  <path d="M16.5 12.5a4.5 4.5 0 0 1 2.5 4" />
                </svg>
              </div>
              <h3 className="m-0 mb-2.5 text-[1.08rem] leading-[1.3] text-[#0f172a] tracking-[-0.02em] font-bold">Intelligent Summarization</h3>
              <p className="m-0 text-[0.95rem] leading-relaxed text-[#334155]">
                Generate summaries at multiple levels, including short, medium, long, chapter-level, and collection-wide insights.
              </p>
            </article>

            <article className="bg-white border border-[#e8eef5] rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-3.5">
              <div className="w-[52px] h-[52px] rounded-2xl grid place-items-center mb-3.5 text-[#2563eb] bg-[#dbeafe]">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 20V10" />
                  <path d="M10 20V4" />
                  <path d="M16 20v-7" />
                  <path d="M22 20v-11" />
                  <path d="M3 20h19" />
                </svg>
              </div>
              <h3 className="m-0 mb-2.5 text-[1.08rem] leading-[1.3] text-[#0f172a] tracking-[-0.02em] font-bold">Visual Analytics</h3>
              <p className="m-0 text-[0.95rem] leading-relaxed text-[#334155]">
                Interactive timelines, network graphs, comparison views, and topic visualizations support deeper exploration across videos and collections.
              </p>
            </article>
          </div>
        </section>

        {/* Data source card */}
        <section className="w-full bg-[#eef2f7] border border-[#d9e2ec] rounded-[24px] px-6 sm:px-7 py-6 text-center shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
          <p className="m-0 text-[#334155] leading-relaxed">
            <span className="font-bold text-[#0f172a]">Data Source</span> — TIB AV-Portal (av.tib.eu)
          </p>
          <p className="mt-2 text-[0.9rem] text-[#64748b]">
            Scientific video repository · Foundation: Chapter-Llama (CVPR 2025) · Visual Analytics Survey
          </p>
        </section>
      </div>
    </section>
  )
}