import type { VideoRecord } from "../types/video";

type MetadataPageProps = { videos: VideoRecord[] };

function downloadMetadataJson(videos: VideoRecord[]) {
  const exportData = videos.map((v) => ({ id: v.id, title: v.title, author: v.author, organization: v.organization, domain: v.domain, description: v.description, mainTopics: v.mainTopics, keywords: v.keywords, entities: v.entities, processingStats: v.processingStats }))
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a"); link.href = url; link.download = "video-metadata.json"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}

export default function MetadataPage({ videos }: MetadataPageProps) {
  return (
    <section className="metadata-page w-full max-w-full mx-auto flex flex-col gap-5">
      {/* Hero */}
      <div className="page-intro-metadata relative overflow-hidden isolate bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-[30px] p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)] flex justify-between gap-5 items-start">
        <div>
          <h2 className="text-slate-900 mt-2 mb-2.5 text-[clamp(1.75rem,2.2vw,2.5rem)] leading-[1.08] tracking-[-0.04em]">Video-level processed metadata</h2>
          <p className="text-slate-500">This page supports the basic details of the processed Educational videos. You can download the metadata into json format.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <a href="https://av.tib.eu/" target="_blank" rel="noopener noreferrer"
          className="bg-white border border-slate-200 rounded-[22px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] p-[18px_20px] flex flex-col gap-2 no-underline hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:translate-y-[-3px] transition-[transform,box-shadow,border-color] duration-[180ms]">
          <span className="text-slate-400 text-[0.8rem]uppercase tracking-[0.08em]">Data Source</span>
          <strong className="text-[1.7rem] tracking-[-0.04em] text-slate-900">TIB AV-Portal</strong>
        </a>
        <article className="bg-white border border-slate-200 rounded-[22px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] p-[18px_20px] flex flex-col gap-2">
          <span className="text-slate-400 text-[0.8rem] uppercase tracking-[0.08em]">Segmentation Basis</span>
          <strong className="text-[1.7rem] tracking-[-0.04em] text-slate-900">Chapter-Llama</strong>
        </article>
        <article className="bg-white border border-slate-200 rounded-[22px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] p-[18px_20px] flex flex-col gap-2">
          <span className="text-slate-400 text-[0.8rem] uppercase tracking-[0.08em]">Research Area</span>
          <strong className="text-[1.7rem] tracking-[-0.04em] text-slate-900">Visual Analytics</strong>
        </article>
      </div>

      {/* Video list panel */}
      <section className="bg-white border border-slate-200 rounded-[22px] p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 text-[1.05rem] tracking-[-0.02em] inline-flex items-center gap-2.5">Available {videos.length} videos</h3>
        </div>
        {videos.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            <button type="button"
              className="border border-black rounded-[14px] bg-white text-black px-4 py-2.5 font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-[transform,box-shadow] duration-[180ms] hover:bg-[#f8f8f8] hover:translate-y-[-1px]"
              onClick={() => downloadMetadataJson(videos)}>
              Download Metadata
            </button>
          </div>
        )}
        {videos.length === 0 ? (
          <p className="text-slate-400">No processed metadata is available yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            {videos.map((video) => (
              <article key={video.id} className="bg-white border border-slate-200 rounded-[22px] p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.05)] text-left hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-[border-color,box-shadow] duration-[180ms]">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="m-0 text-[1.08rem] leading-[1.3] tracking-[-0.02em] text-slate-900">{video.title}</h4>
                </div>
                {(video.author || video.organization) && (
                  <ul className="list-none p-0 m-0 flex flex-col gap-2 mt-3">
                    {video.author && <li className="px-3 py-2.5 bg-slate-50 rounded-[14px] border border-slate-100 text-sm text-slate-600"><strong>Author:</strong> {video.author}</li>}
                    {video.organization && <li className="px-3 py-2.5 bg-slate-50 rounded-[14px] border border-slate-100 text-sm text-slate-600"><strong>Organization:</strong> {video.organization}</li>}
                  </ul>
                )}
                {video.description && <p className="mt-2 text-slate-500 text-sm">{video.description}</p>}
                {video.mainTopics.length > 0 && (
                  <div className="flex flex-col gap-2.5 mt-3">
                    <h5 className="m-0 text-[0.96rem] tracking-[-0.02em] text-slate-900">Main topics</h5>
                    <div className="flex flex-wrap gap-2">
                      {video.mainTopics.map((topic) => (
                        <span key={topic} className="inline-flex items-center rounded-full bg-white text-black px-[11px] py-[7px] text-[0.78rem] font-bold leading-none border border-black cursor-default">{topic}</span>
                      ))}
                    </div>
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
