type LandingPageProps = {
  onEnterHomepage: () => void;
  onOpenAbout: () => void;
  onOpenNetwork: () => void;
};

export default function LandingPage({ onEnterHomepage, onOpenAbout, onOpenNetwork }: LandingPageProps) {
  return (
    <section className="min-h-[calc(100vh-110px)] p-0 grid place-items-center">
      <div className="w-full max-w-full mx-auto text-center flex flex-col items-center gap-5">

        {/* Title group */}
        <div className="w-full flex flex-col items-center gap-0">
          <h2 className="landing-gradient-title m-0 max-w-[44ch] leading-[1.3] tracking-normal font-bold text-[clamp(2.8rem,7vw,3.7rem)]">
            Intelligent Exploration
          </h2>
          <h2 className="m-0 max-w-[44ch] leading-[0.96] tracking-[-0.05em] font-bold text-slate-900 text-[clamp(2.8rem,7vw,5.6rem)]">
            of Educational Videos
          </h2>
          <p className="mt-6 text-[1rem] tracking-[0.08em] uppercase text-slate-500 font-medium max-w-[760px] text-[clamp(1.05rem,1.8vw,1.35rem)] leading-[1.75]">
            A comprehensive dashboard for exploring educational video collections through automatic segmentation,
            multi-level summarization, and interactive visualization
          </p>
          <div className="flex flex-wrap justify-center gap-3.5 mt-2.5">
            <button
              type="button"
              className="border border-black rounded-[14px] bg-black text-white px-4 py-2.5 font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] transition-[transform,box-shadow,background-color,border-color] duration-[180ms] hover:bg-[#111] hover:border-[#111] hover:translate-y-[-1px] hover:shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
              onClick={onEnterHomepage}
            >
              Start Exploring
            </button>
            <button
              type="button"
              className="border border-black rounded-[14px] bg-white text-black px-4 py-2.5 font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-[transform,box-shadow,background-color,border-color] duration-[180ms] hover:bg-[#f8f8f8] hover:translate-y-[-1px] hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
              onClick={onOpenAbout}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Nav cards */}
        <div className="w-full grid grid-cols-3 max-lg:grid-cols-1 gap-[18px] mt-7">
          {/* Video Exploration */}
          <button
            type="button"
            className="border border-slate-200 bg-gradient-to-b from-white to-slate-50 rounded-[22px] p-6 text-center text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center gap-4 min-h-[220px] transition-[transform,box-shadow,border-color] duration-[180ms] hover:translate-y-[-3px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:border-slate-300"
            onClick={onEnterHomepage}
          >
            <span className="w-[76px] h-[76px] rounded-[22px] grid place-items-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] text-blue-600 bg-blue-100" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="w-[34px] h-[34px] stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="6.5" width="12.5" height="11" rx="2.5" />
                <path d="M16 10l4.5-2.5v9L16 14" />
                <circle cx="8.5" cy="11.8" r="1.25" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <h3 className="m-0 text-[1.15rem] leading-[1.25] tracking-[-0.02em] text-slate-900">Video Exploration</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Navigate videos through chapter-aware browsing, concept discovery, and interactive playback entry points.</p>
          </button>

          {/* Summaries */}
          <button
            type="button"
            className="border border-slate-200 bg-gradient-to-b from-white to-slate-50 rounded-[22px] p-6 text-center text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center gap-4 min-h-[220px] transition-[transform,box-shadow,border-color] duration-[180ms] hover:translate-y-[-3px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:border-slate-300"
            onClick={onEnterHomepage}
          >
            <span className="w-[76px] h-[76px] rounded-[22px] grid place-items-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] text-amber-600 bg-amber-100" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="w-[34px] h-[34px] stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5V11.5" /><path d="M9 19.5V6.5" /><path d="M14 19.5V9.5" /><path d="M19 19.5V4.5" /><path d="M3 19.5H21" />
              </svg>
            </span>
            <h3 className="m-0 text-[1.15rem] leading-[1.25] tracking-[-0.02em] text-slate-900">Summaries</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Explore multi-level summaries from short overviews to chapter-based and collection-level insights.</p>
          </button>

          {/* Visualization */}
          <button
            type="button"
            className="border border-slate-200 bg-gradient-to-b from-white to-slate-50 rounded-[22px] p-6 text-center text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center gap-4 min-h-[220px] transition-[transform,box-shadow,border-color] duration-[180ms] hover:translate-y-[-3px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:border-slate-300"
            onClick={onOpenNetwork}
          >
            <span className="w-[76px] h-[76px] rounded-[22px] grid place-items-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] text-violet-600 bg-violet-100" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="w-[34px] h-[34px] stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="12" r="2.5" /><circle cx="17.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
                <path d="M8.2 10.9l6.9-3.2" /><path d="M8.2 13.1l6.9 3.2" />
              </svg>
            </span>
            <h3 className="m-0 text-[1.15rem] leading-[1.25] tracking-[-0.02em] text-slate-900">Visualization</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Understand relationships through timelines, concept links, comparison views, and collection-wide visual analytics.</p>
          </button>
        </div>

        {/* Technical Capabilities card */}
        <section className="w-full bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-[30px] p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)] text-left">
          <div className="w-full mb-5 flex flex-col gap-3 text-center">
            <h2 className="m-0 mb-2.5 text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.04em] text-slate-900">Technical Capabilities</h2>
            <p className="m-auto max-w-[760px] text-[1rem] leading-[1.7] text-slate-500">
              EduVid Explorer combines automatic video segmentation, intelligent summarization, and interactive visualization to support efficient exploration of long educational videos.
            </p>
          </div>
          <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-[18px] w-full">
            {/* Chaptering */}
            <article className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-3.5">
              <div className="w-[52px] h-[52px] rounded-[16px] grid place-items-center mb-3.5 text-teal-700 bg-teal-100">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-6 h-6 stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 5 13h5l-1 9 8-12h-5l1-8Z" />
                </svg>
              </div>
              <h3 className="m-0 mb-2.5 text-[1.08rem] leading-[1.3] text-slate-900 tracking-[-0.02em]">LLM-Powered Chaptering</h3>
              <p className="m-0 text-[0.95rem] leading-[1.7] text-slate-500">State-of-the-art video segmentation using large language models with multimodal inputs such as transcripts and frame captions.</p>
            </article>
            {/* Summarization */}
            <article className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-3.5">
              <div className="w-[52px] h-[52px] rounded-[16px] grid place-items-center mb-3.5 text-violet-700 bg-violet-100">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-6 h-6 stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 18V6" /><path d="M9.5 9.5C10 8 11 7 12 7s2 1 2.5 2.5" />
                  <path d="M8 5.5C8.8 3.9 10.2 3 12 3s3.2.9 4 2.5" /><path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
                  <path d="M7.5 12.5a4.5 4.5 0 0 0-2.5 4" /><path d="M16.5 12.5a4.5 4.5 0 0 1 2.5 4" />
                </svg>
              </div>
              <h3 className="m-0 mb-2.5 text-[1.08rem] leading-[1.3] text-slate-900 tracking-[-0.02em]">Intelligent Summarization</h3>
              <p className="m-0 text-[0.95rem] leading-[1.7] text-slate-500">Generate summaries at multiple levels, including short, medium, long, chapter-level, and collection-wide insights.</p>
            </article>
            {/* Analytics */}
            <article className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-3.5">
              <div className="w-[52px] h-[52px] rounded-[16px] grid place-items-center mb-3.5 text-blue-600 bg-blue-100">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-6 h-6 stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20v-11" /><path d="M3 20h19" />
                </svg>
              </div>
              <h3 className="m-0 mb-2.5 text-[1.08rem] leading-[1.3] text-slate-900 tracking-[-0.02em]">Visual Analytics</h3>
              <p className="m-0 text-[0.95rem] leading-[1.7] text-slate-500">Interactive timelines, network graphs, comparison views, and topic visualizations support deeper exploration across videos and collections.</p>
            </article>
          </div>
        </section>

        {/* Source card */}
        <section className="w-full bg-slate-100 border border-slate-200 rounded-[24px] px-7 py-6 text-center shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
          <p className="m-0 text-slate-500 leading-[1.7]"><span className="font-bold text-slate-900">Data Source:</span> TIB AV-Portal (av.tib.eu)</p>
          <p className="mt-2 text-[0.9rem] text-slate-400">Scientific video repository | Foundation: Chapter-Llama (CVPR 2025) + Visual Analytics Survey</p>
        </section>

      </div>
    </section>
  );
}
