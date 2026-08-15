import type { VideoRecord } from "../types/video";

type MetadataPageProps = {
  videos: VideoRecord[];
};

function downloadMetadataJson(videos: VideoRecord[]) {
  const exportData = videos.map((video) => ({
    id: video.id,
    title: video.title,
    author: video.author,
    organization: video.organization,
    domain: video.domain,
    description: video.description,
    mainTopics: video.mainTopics,
    keywords: video.keywords,
    entities: video.entities,
    processingStats: video.processingStats,
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "video-metadata.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function MetadataPage({ videos }: MetadataPageProps) {
  return (
    <section className="w-full max-w-full mx-auto flex flex-col gap-5">

      {/* Page intro + stats grid combined */}
      <section className="bg-gradient-to-br from-[#fefce8] to-[#eff6ff] border border-[#fde68a] rounded-[28px]
        p-7 max-md:p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-6">
          <h2 className="m-0 mb-2.5 text-shadow-2xs font-bold
              text-[clamp(2rem,6vw,3.75rem)] tracking-tight text-slate-900">
            Video-level processed metadata
          </h2>
          <p className="font-semibold m-0 text-slate-600 leading-7">
            This page supports the basic details of the processed Educational videos. You can
            download the metadata into json format.
          </p>
        </div>

        <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
          <a
            href="https://av.tib.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 px-5 rounded-2xl bg-white border border-slate-300/20 shadow-[0_10px_24px_rgba(15,23,42,0.045)]
              flex flex-col gap-2 no-underline cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]
              transition-transform"
          >
            <span className="text-[0.82rem] text-slate-500">Data Source</span>
            <strong className="text-[1.7rem] tracking-tight text-slate-900">TIB AV-Portal</strong>
          </a>
          <article className="p-4 px-5 rounded-2xl bg-white border border-slate-300/20 shadow-[0_10px_24px_rgba(15,23,42,0.045)] flex flex-col gap-2">
            <span className="text-[0.82rem] text-slate-500">Segmentation Basis</span>
            <strong className="text-[1.7rem] tracking-tight text-slate-900">Chapter-Llama</strong>
          </article>
          <article className="p-4 px-5 rounded-2xl bg-white border border-slate-300/20 shadow-[0_10px_24px_rgba(15,23,42,0.045)] flex flex-col gap-2">
            <span className="text-[0.82rem] text-slate-500">Research Area</span>
            <strong className="text-[1.7rem] tracking-tight text-slate-900">Visual Analytics</strong>
          </article>
        </div>
      </section>

      {/* Panel: video list */}
      <section className="bg-white border border-slate-300/20 rounded-3xl p-7 max-md:p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 max-md:flex-col max-md:items-start">
          <h3 className="m-0 text-[1.05rem] tracking-tight text-slate-900 inline-flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#107c19] to-[#107c19] shadow-[0_0_0_4px_rgba(245,158,11,0.08)]" />
            Available {videos.length} videos
          </h3>
          {videos.length > 0 && (
          <div className="flex flex-wrap gap-3 max-md:w-full">
            <button
              type="button"
              className="border border-black rounded-2xl bg-black text-white px-4 py-2.5 font-bold
                shadow-[0_16px_28px_rgba(0,0,0,0.14)] hover:bg-[#111] hover:border-[#111]
                hover:-translate-y-px transition-transform"
              onClick={() => downloadMetadataJson(videos)}
            >
              Download Metadata
            </button>
          </div>
        )}
        </div>


        {videos.length === 0 ? (
          <p className="text-slate-600">No processed metadata is available yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] max-md:grid-cols-1 gap-4">
            {videos.map((video) => (
              <article
                key={video.id}
                className="p-[18px] rounded-[22px] bg-white border border-[#c7c7c7]
                  shadow-[0_10px_24px_rgba(15,23,42,0.045)] text-left flex flex-col gap-3
                  hover:-translate-y-0.5 hover:border-slate-400/30 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]
                  transition-transform"
              >
                <div className="font-bold flex items-start justify-between gap-3">
                  <h4 className="m-0 text-[1.08rem] leading-tight tracking-tight text-slate-900">
                    {video.title}
                  </h4>
                </div>

                {(video.author || video.organization) && (
                  <ul className="flex flex-wrap gap-2.5 m-0 p-0 list-none">
                    {video.author && (
                      <li className="bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1.5 text-[0.8rem] text-slate-900">
                        <strong>Author:</strong> {video.author}
                      </li>
                    )}
                    {video.organization && (
                      <li className="bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1.5 text-[0.8rem] text-slate-900">
                        <strong>Organization:</strong> {video.organization}
                      </li>
                    )}
                  </ul>
                )}

                {video.description && (
                  <p className="m-0 text-slate-600 leading-relaxed">Description: {video.description}</p>
                )}

                {video.mainTopics.length > 0 && (
                  <div>
                    <h5 className="m-0 mb-2 text-[0.95rem] font-semibold text-slate-900">Main topics: </h5>
                    <p className="m-0 text-slate-700 leading-relaxed">
                      {video.mainTopics.join(", ")}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}