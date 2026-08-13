type AboutPageProps = { onStartExploring: () => void };

export default function AboutPage({ onStartExploring }: AboutPageProps) {
  const card = "bg-white border border-[rgba(148,163,184,0.22)] rounded-[24px] p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
  const chip = "inline-flex items-center rounded-full bg-white text-black px-[11px] py-[7px] text-[0.78rem] font-bold leading-none border border-black cursor-default"
  const cleanList = "m-0 pl-[18px] text-slate-500 flex flex-col gap-1"

  return (
    <section className="about-page about-page--rich w-full min-h-[calc(100vh-180px)]">
      <div className="w-full max-w-full mx-auto grid gap-6">

        {/* Hero */}
        <section className="block p-[34px] rounded-[28px] bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)] text-slate-900">
          <p className="m-0 text-[0.75rem] font-extrabold tracking-[0.12em] uppercase text-black inline-flex items-center gap-2">About this project</p>
          <h2 className="mt-1.5 mb-3.5 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-slate-900">Intelligent Exploration of Educational Videos</h2>

          <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-3.5 mt-6 mb-5">
            {[{label:'Duration', val:'2 semesters'},{label:'Group size', val:'3 students'},{label:'Focus', val:'Segmentation · Summarization · Visualization'}].map((s) => (
              <article key={s.label} className="px-[18px] py-4 rounded-[18px] bg-white border border-slate-200">
                <span className="block text-[0.82rem] text-slate-400 mb-1.5">{s.label}</span>
                <strong className="text-[1rem] text-slate-900">{s.val}</strong>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button"
              className="border border-black rounded-[14px] bg-black text-white px-4 py-2.5 font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] transition-[transform,box-shadow] duration-[180ms] hover:bg-[#111] hover:translate-y-[-1px]"
              onClick={onStartExploring}>Start Exploring</button>
          </div>
        </section>

        {/* Motivation */}
        <section className={card}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[1.6rem]" aria-hidden="true">💡</span>
            <h3 className="m-0 text-slate-900 text-[1.55rem]">Motivation</h3>
          </div>
          <p className="text-slate-500 leading-[1.8] m-0 mb-3.5">Educational videos are a major part of modern learning, but long lectures and large video collections are still difficult to navigate, compare, and understand efficiently.</p>
          <p className="text-slate-500 leading-[1.8] m-0">This project addresses that challenge by combining chapter-aware segmentation, hierarchical summaries, and interactive visual exploration for faster access to relevant content and clearer cross-video understanding.</p>
        </section>

        {/* Learning objectives */}
        <section className={card}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[1.6rem]" aria-hidden="true">🎯</span>
            <h3 className="m-0 text-slate-900 text-[1.55rem]">Learning objectives</h3>
          </div>
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-6">
            <ul className={cleanList}>
              <li>Implement state-of-the-art video understanding techniques.</li>
              <li>Design multimodal content analysis workflows.</li>
              <li>Create multi-level summarization pipelines.</li>
              <li>Develop interactive visualization interfaces.</li>
            </ul>
            <ul className={cleanList}>
              <li>Process and analyze long-form educational videos.</li>
              <li>Apply visual analytics principles in practice.</li>
              <li>Evaluate user-centered exploration systems.</li>
              <li>Work with open-source LLM and vision-based methods.</li>
            </ul>
          </div>
        </section>

        {/* Architecture */}
        <section className="grid gap-[18px]">
          <div className="grid gap-2">
            <h3 className="m-0 mb-2 text-[1.7rem] text-slate-900">Architecture</h3>
            <p className="m-0 text-slate-500 leading-[1.8]">The project is organized into three tightly connected technical tracks that come together in one end-to-end exploration system.</p>
          </div>

          <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-5">
            {/* Segmentation */}
            <article className="overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.2)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="p-6 text-white bg-gradient-to-br from-[#3b82f6] to-[#06b6d4]">
                <h4 className="m-0 mb-2.5 text-[1.45rem] leading-[1.2]">Video Segmentation &amp; Chaptering</h4>
                <p className="m-0 text-white/92 leading-[1.7]">Implements automatic chapter detection and title generation for long educational videos.</p>
              </div>
              <div className="p-6">
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Key features</h5>
                <ul className={`${cleanList} mb-[18px]`}>
                  <li>Multimodal feature extraction from transcripts and frames.</li>
                  <li>Speech-guided frame sampling for efficiency.</li>
                  <li>LLM-based chapter boundary detection.</li>
                  <li>Descriptive chapter title generation.</li>
                  <li>Support for hour-long educational videos.</li>
                </ul>
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Technologies</h5>
                <div className="flex flex-wrap gap-2">{['Whisper ASR','BLIP-2 / LLaVA','Llama 3.1','FFmpeg','PySceneDetect'].map((t) => <span key={t} className={chip}>{t}</span>)}</div>
              </div>
            </article>

            {/* Summarization */}
            <article className="overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.2)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="p-6 text-white bg-gradient-to-br from-[#8b5cf6] to-[#ec4899]">
                <h4 className="m-0 mb-2.5 text-[1.45rem] leading-[1.2]">Multi-Level Summarization</h4>
                <p className="m-0 text-white/92 leading-[1.7]">Develops summary generation at chapter, video, and collection levels.</p>
              </div>
              <div className="p-6">
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Key features</h5>
                <ul className={`${cleanList} mb-[18px]`}>
                  <li>Short, medium, and long summaries.</li>
                  <li>Chapter-aware hierarchical summaries.</li>
                  <li>Collection-level commonality detection.</li>
                  <li>Difference highlighting across videos.</li>
                  <li>Learning-objective extraction.</li>
                </ul>
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Technologies</h5>
                <div className="flex flex-wrap gap-2">{['Llama 3.1 / Mistral','Sentence-BERT','Transformers','BERTopic'].map((t) => <span key={t} className={chip}>{t}</span>)}</div>
              </div>
            </article>

            {/* Visualization */}
            <article className="overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.2)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="p-6 text-white bg-gradient-to-br from-[#f97316] to-[#ef4444]">
                <h4 className="m-0 mb-2.5 text-[1.45rem] leading-[1.2]">Interactive Visualization</h4>
                <p className="m-0 text-white/92 leading-[1.7]">Builds the visual interface for exploration, comparison, and collection-level analysis.</p>
              </div>
              <div className="p-6">
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Key features</h5>
                <ul className={`${cleanList} mb-[18px]`}>
                  <li>Interactive timeline with chapter navigation.</li>
                  <li>Network views for video relationships.</li>
                  <li>Collection comparison workflows.</li>
                  <li>Topic visualization and filtering.</li>
                  <li>Responsive web-based interface.</li>
                </ul>
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Technologies</h5>
                <div className="flex flex-wrap gap-2">{['React','D3.js / Recharts','Tailwind CSS','Video.js'].map((t) => <span key={t} className={chip}>{t}</span>)}</div>
              </div>
            </article>
          </div>
        </section>

        {/* Scientific foundation */}
        <section className={card}>
          <h3 className="m-0 mb-4 text-slate-900 text-[1.55rem]">Scientific foundation</h3>
          <div className="grid gap-4">
            {[
              { color: '#3b82f6', label: 'Data source', body: <p className="m-0 text-slate-500"><a href="https://av.tib.eu/" target="_blank" rel="noopener noreferrer" className="text-black no-underline hover:underline">TIB AV-Portal</a> provides scientific and educational audiovisual material.</p> },
              { color: '#8b5cf6', label: 'Video chaptering', body: <p className="m-0 text-slate-500">Chapter-Llama frames long-video chaptering as a text-domain LLM problem using transcripts and selected frame captions.</p> },
              { color: '#f97316', label: 'Visualization', body: <p className="m-0 text-slate-500">Visual analytics research highlights the role of interactive visualization in exploring complex image and video datasets.</p> },
            ].map((ref) => (
              <article key={ref.label} className="border-l-4 pl-4" style={{ borderLeftColor: ref.color }}>
                <h4 className="m-0 mb-1.5 text-slate-900">{ref.label}</h4>
                {ref.body}
              </article>
            ))}
          </div>
        </section>

        {/* Evaluation */}
        <section className="p-[30px] rounded-[28px] bg-gradient-to-br from-[#7c3aed] to-[#ec4899] text-white shadow-[0_22px_48px_rgba(124,58,237,0.2)]">
          <h3 className="m-0 mb-5 text-[1.7rem]">Evaluation criteria</h3>
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-6">
            <article>
              <h4 className="m-0 mb-3 text-white">Technical metrics</h4>
              <ul className="m-0 pl-[18px] flex flex-col gap-1"><li className="text-[rgba(250,245,255,0.95)]">Segmentation accuracy and boundary quality.</li><li className="text-[rgba(250,245,255,0.95)]">Summary quality and coverage.</li><li className="text-[rgba(250,245,255,0.95)]">Processing efficiency.</li><li className="text-[rgba(250,245,255,0.95)]">System integration quality.</li></ul>
            </article>
            <article>
              <h4 className="m-0 mb-3 text-white">User study</h4>
              <ul className="m-0 pl-[18px] flex flex-col gap-1"><li className="text-[rgba(250,245,255,0.95)]">Task completion rates.</li><li className="text-[rgba(250,245,255,0.95)]">Time-on-task measures.</li><li className="text-[rgba(250,245,255,0.95)]">User satisfaction surveys.</li><li className="text-[rgba(250,245,255,0.95)]">Expert and educator feedback.</li></ul>
            </article>
          </div>
        </section>

      </div>
    </section>
  );
}
