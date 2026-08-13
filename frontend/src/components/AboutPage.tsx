type AboutPageProps = { onStartExploring: () => void };

export default function AboutPage({ onStartExploring }: AboutPageProps) {
  return (
    <section className="w-full max-w-full mx-auto flex flex-col gap-5">
      <div className="w-full max-w-full mx-auto grid gap-6">

        {/* Hero banner */}
        <section className="block p-[34px] max-md:p-6 rounded-[28px] bg-gradient-to-br from-surface to-surface-soft border border-border shadow-md">
          <div className="block p-[34px] max-md:p-6 rounded-[28px] bg-gradient-to-br from-surface to-surface-soft border border-border shadow-md">
            <div className="flex gap-2">
              <h1 className="items-stretch text-2xl text-black font-bold m-0">
                Project Name:
              </h1>
              <h2 className="font-display font-extrabold text-[clamp(1.6rem,3.5vw,2.6rem)] leading-tight m-0 bg-gradient-to-r from-[#2b6eff] via-[#5837ff] to-[#ff1a94] bg-clip-text text-transparent">
                Intelligent Exploration of Educational Videos
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-3 max-md:grid-cols-1 gap-3.5 mt-6 mb-5">
            <article className="p-4 px-[18px] rounded-2xl bg-surface border border-border">
              <span className="block text-[0.82rem] text-text-faint mb-1.5">Duration</span>
              <strong className="text-base text-text">2 semesters</strong>
            </article>
            <article className="p-4 px-[18px] rounded-2xl bg-surface border border-border">
              <span className="block text-[0.82rem] text-text-faint mb-1.5">Group size</span>
              <strong className="text-base text-text">3 students</strong>
            </article>
            <article className="p-4 px-[18px] rounded-2xl bg-surface border border-border">
              <span className="block text-[0.82rem] text-text-faint mb-1.5">Focus</span>
              <strong className="text-base text-text">Segmentation, Summarization, Visualization</strong>
            </article>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="border border-black rounded-2xl bg-black text-white px-4 py-2.5 font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] hover:bg-[#111] hover:border-[#111] hover:-translate-y-px transition-transform"
              onClick={onStartExploring}
            >
              Start Exploring
            </button>
          </div>
        </section>

        {/* Motivation card */}
        <section className="bg-white border border-slate-300/20 rounded-3xl p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl" aria-hidden="true">🎯</span>
            <h3 className="m-0 text-text text-2xl">Motivation</h3>
          </div>
          <p className="text-slate-700 leading-8 mb-3.5">
            Educational videos are a major part of modern learning, but long lectures and large
            video collections are still difficult to navigate, compare, and understand efficiently.
          </p>
          <p className="text-slate-700 leading-8 mb-3.5">
            This project addresses that challenge by combining chapter-aware segmentation,
            hierarchical summaries, and interactive visual exploration for faster access to
            relevant content and clearer cross-video understanding.
          </p>
        </section>

        {/* Learning objectives card */}
        <section className="bg-white border border-slate-300/20 rounded-3xl p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl" aria-hidden="true">🎓</span>
            <h3 className="m-0 text-text text-2xl">Learning objectives</h3>
          </div>
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-6">
            <ul className="m-0 pl-4.5 text-text-soft space-y-2">
              <li>Implement state-of-the-art video understanding techniques.</li>
              <li>Design multimodal content analysis workflows.</li>
              <li>Create multi-level summarization pipelines.</li>
              <li>Develop interactive visualization interfaces.</li>
            </ul>
            <ul className="m-0 pl-4.5 text-text-soft space-y-2">
              <li>Process and analyze long-form educational videos.</li>
              <li>Apply visual analytics principles in practice.</li>
              <li>Evaluate user-centered exploration systems.</li>
              <li>Work with open-source LLM and vision-based methods.</li>
            </ul>
          </div>
        </section>

        {/* Architecture / student tracks */}
        <section className="block p-[34px] max-md:p-6 rounded-[28px] bg-gradient-to-br from-surface to-surface-soft border border-border shadow-md">
          <div>
            <h3 className="m-0 mb-2 text-[1.7rem] text-slate-900">Architecture</h3>
            <p className="m-0 text-slate-600 leading-8">
              The project is organized into three tightly connected technical tracks that come
              together in one end-to-end exploration system.
            </p>
          </div>

          <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-5">
            {/* Track 1 - blue */}
            <article className="overflow-hidden rounded-3xl border border-slate-300/20 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="p-6 text-white bg-gradient-to-br from-[#3b82f6] to-[#06b6d4]">
                <p className="m-0 mb-2 text-[0.82rem] font-bold uppercase tracking-wider opacity-90">
                  Track 1
                </p>
                <h4 className="m-0 mb-2.5 text-[1.45rem] leading-tight">
                  Video Segmentation &amp; Chaptering
                </h4>
                <p className="m-0 text-white/90 leading-[1.7]">
                  Implements automatic chapter detection and title generation for long
                  educational videos.
                </p>
              </div>
              <div className="p-6">
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Key features</h5>
                <ul className="m-0 mb-4.5 text-slate-700 leading-[1.7] pl-4.5 space-y-1">
                  <li>Multimodal feature extraction from transcripts and frames.</li>
                  <li>Speech-guided frame sampling for efficiency.</li>
                  <li>LLM-based chapter boundary detection.</li>
                  <li>Descriptive chapter title generation.</li>
                  <li>Support for hour-long educational videos.</li>
                </ul>
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Technologies</h5>
                <div className="flex flex-wrap gap-2">
                  {["Whisper ASR", "BLIP-2 / LLaVA", "Llama 3.1", "FFmpeg", "PySceneDetect"].map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full bg-white text-black px-2.5 py-1.5 text-xs font-bold border border-black">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* Track 2 - purple */}
            <article className="overflow-hidden rounded-3xl border border-slate-300/20 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="p-6 text-white bg-gradient-to-br from-[#8b5cf6] to-[#ec4899]">
                <p className="m-0 mb-2 text-[0.82rem] font-bold uppercase tracking-wider opacity-90">
                  Track 2
                </p>
                <h4 className="m-0 mb-2.5 text-[1.45rem] leading-tight">
                  Multi-Level Summarization
                </h4>
                <p className="m-0 text-white/90 leading-[1.7]">
                  Develops summary generation at chapter, video, and collection levels.
                </p>
              </div>
              <div className="p-6">
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Key features</h5>
                <ul className="m-0 mb-4.5 text-slate-700 leading-[1.7] pl-4.5 space-y-1">
                  <li>Short, medium, and long summaries.</li>
                  <li>Chapter-aware hierarchical summaries.</li>
                  <li>Collection-level commonality detection.</li>
                  <li>Difference highlighting across videos.</li>
                  <li>Learning-objective extraction.</li>
                </ul>
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Technologies</h5>
                <div className="flex flex-wrap gap-2">
                  {["Llama 3.1 / Mistral", "Sentence-BERT", "Transformers", "BERTopic"].map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full bg-white text-black px-2.5 py-1.5 text-xs font-bold border border-black">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* Track 3 - orange */}
            <article className="overflow-hidden rounded-3xl border border-slate-300/20 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="p-6 text-white bg-gradient-to-br from-[#f97316] to-[#ef4444]">
                <p className="m-0 mb-2 text-[0.82rem] font-bold uppercase tracking-wider opacity-90">
                  Track 3
                </p>
                <h4 className="m-0 mb-2.5 text-[1.45rem] leading-tight">
                  Interactive Visualization
                </h4>
                <p className="m-0 text-white/90 leading-[1.7]">
                  Builds the visual interface for exploration, comparison, and collection-level analysis.
                </p>
              </div>
              <div className="p-6">
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Key features</h5>
                <ul className="m-0 mb-4.5 text-slate-700 leading-[1.7] pl-4.5 space-y-1">
                  <li>Interactive timeline with chapter navigation.</li>
                  <li>Network views for video relationships.</li>
                  <li>Collection comparison workflows.</li>
                  <li>Topic visualization and filtering.</li>
                  <li>Responsive web-based interface.</li>
                </ul>
                <h5 className="m-0 mb-3 text-[0.98rem] text-slate-900">Technologies</h5>
                <div className="flex flex-wrap gap-2">
                  {["React", "D3.js / Recharts", "Tailwind CSS concepts", "Video.js"].map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full bg-white text-black px-2.5 py-1.5 text-xs font-bold border border-black">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Scientific foundation */}
        <section className="bg-white border border-slate-300/20 rounded-3xl p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <h3 className="m-0 mb-4 text-slate-900 text-2xl">Scientific foundation</h3>
          <div className="grid gap-4">
            <article className="pl-4 border-l-4 border-[#3b82f6]">
              <h4 className="m-0 mb-1.5 text-slate-900">Data source</h4>
              <p className="m-0">
                <a href="https://av.tib.eu" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">
                  TIB AV-Portal
                </a>{" "}
                provides scientific and educational audiovisual material and is a suitable basis
                for exploration-oriented video interfaces. [web:4]
              </p>
            </article>
            <article className="pl-4 border-l-4 border-[#8b5cf6]">
              <h4 className="m-0 mb-1.5 text-slate-900">Video chaptering</h4>
              <p className="m-0">
                Chapter-Llama frames long-video chaptering as a text-domain LLM problem using
                transcripts and selected frame captions, and reports strong results on hour-long
                videos. [web:12]
              </p>
            </article>
            <article className="pl-4 border-l-4 border-[#f97316]">
              <h4 className="m-0 mb-1.5 text-slate-900">Visualization</h4>
              <p className="m-0">
                Visual analytics research highlights the role of interactive visualization in
                exploring complex image and video datasets across tasks, tools, and application
                areas. [web:13]
              </p>
            </article>
          </div>
        </section>

        {/* Evaluation banner */}
        <section className="p-7.5 rounded-[28px] text-white shadow-[0_22px_48px_rgba(124,58,237,0.2)] bg-gradient-to-br from-[#7c3aed] to-[#ec4899]">
          <h3 className="m-0 mb-5 text-[1.7rem]">Evaluation criteria</h3>
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-6">
            <article>
              <h4 className="m-0 mb-3 text-white">Technical metrics</h4>
              <ul className="m-0 pl-4.5 text-fuchsia-50 leading-[1.7] space-y-1">
                <li>Segmentation accuracy and boundary quality.</li>
                <li>Summary quality and coverage.</li>
                <li>Processing efficiency.</li>
                <li>System integration quality.</li>
              </ul>
            </article>
            <article>
              <h4 className="m-0 mb-3 text-white">User study</h4>
              <ul className="m-0 pl-4.5 text-fuchsia-50 leading-[1.7] space-y-1">
                <li>Task completion rates.</li>
                <li>Time-on-task measures.</li>
                <li>User satisfaction surveys.</li>
                <li>Expert and educator feedback.</li>
              </ul>
            </article>
          </div>
        </section>

        {/* Note */}
        <section className="grid grid-cols-[40px_1fr] gap-3.5 p-6 rounded-[22px] bg-[#fefce8] border border-[#fde68a]">
          <div className="text-2xl" aria-hidden="true">ℹ️</div>
          <div>
            <h3 className="m-0 mb-2 text-[#854d0e]">About this demonstration</h3>
            <p className="m-0 text-[#92400e] leading-[1.75]">
              This prototype focuses on the interface and exploration workflow. A full production
              pipeline would require model execution resources and deeper integration with
              automated chaptering, summarization, and video processing infrastructure.
            </p>
          </div>
        </section>

      </div>
    </section>
  );
}