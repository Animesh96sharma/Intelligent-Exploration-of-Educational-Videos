import type {
  AppDataset,
  ChapterRecord,
  CollectionAnalysisRecord,
  RawChapterSummariesFile,
  RawCollectionAnalysis,
  RawVideoSummary,
  RawVideoMetadataFile,
  RawEvaluationReport,
  VideoRecord,
} from "../types/video";


const METADATA_API_BASE =
  import.meta.env.VITE_METADATA_API_URL ?? "http://localhost:8000";

const SUMMARY_API_BASE =
  import.meta.env.VITE_SUMMARY_API_URL ?? "http://localhost:8001/api";

function getVideoStreamUrl(videoId: string): string {
  return `${METADATA_API_BASE}/videos/${videoId}/stream`;
}

// Remove Fallback once Sub-task pipe run on 33 videos
// const FALLBACK_VIDEO_IDS = [
//   "tib_av_00000_720p",
//   "tib_av_16257_720p",
//   "tib_av_16258_720p",
//   "tib_av_16259_720p",
//   "tib_av_16260_720p",
//   "tib_av_16261_1080p",
//   "tib_av_21899_720p",
//   "tib_av_34032_480p",
//   "tib_av_34035_480p",
// ];

type VideosApiResponse = {
  status: string;
  total: number;
  videos: { video_id: string }[];
};

type RawTranscriptSegment = {
  start: number;
  end: number;
  start_timestamp: string;
  end_timestamp: string;
  text: string;
  confidence?: number;
};

type RawTranscriptFile = {
  metadata?: {
    language?: string;
    duration_seconds?: number;
    model?: string;
    device?: string;
    fp16?: boolean;
    processing_time_seconds?: number;
    realtime_factor?: number;
    num_segments?: number;
  };
  segments?: RawTranscriptSegment[];
};


function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        typeof item === "string"
          ? item.split(",").map((part) => part.trim())
          : []
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeDifficulty(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeTranscript(raw?: RawTranscriptFile) {
  if (!raw) return undefined;

  const segments = Array.isArray(raw.segments)
    ? raw.segments
        .map((segment, index) => ({
          id: `${index}`,
          startTime: Number(segment.start ?? 0),
          endTime: Number(segment.end ?? 0),
          startTimestamp: segment.start_timestamp ?? "",
          endTimestamp: segment.end_timestamp ?? "",
          text: typeof segment.text === "string" ? segment.text.trim() : "",
          confidence:
            typeof segment.confidence === "number"
              ? segment.confidence
              : undefined,
        }))
        .filter((segment) => segment.text.length > 0)
    : [];

  return {
    language: raw.metadata?.language,
    durationSeconds: raw.metadata?.duration_seconds,
    model: raw.metadata?.model,
    numSegments: raw.metadata?.num_segments,
    segments,
  };
}

function normalizeEntities(
  entities?: { text: string; label: string; mentions: number }[]
) {
  return (entities ?? []).filter(
    (entity) =>
      entity.text?.trim().length > 0 && entity.label?.trim().length > 0
  );
}

function normalizeCollectionAnalysis(
  raw: RawCollectionAnalysis
): CollectionAnalysisRecord {
  return {
    totalVideos: raw.total_videos,
    overview: raw.collection_overview,
    commonConcepts: raw.common_concepts ?? {},
    uniqueConcepts: raw.unique_concepts ?? {},
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${path}: ${response.status} ${response.statusText}`
    );
  }
  return response.json() as Promise<T>;
}

async function loadVideoIds(): Promise<string[]> {
  try {
    const data = await fetchJson<VideosApiResponse>(`${METADATA_API_BASE}/videos`);
    const ids = (data.videos ?? []).map((item) => item.video_id);
    console.log("[dataLoader] video list loaded:", ids);
    if (ids.length === 0) {
      console.error("[dataLoader] API returned zero videos");
    }
    return ids;
  } catch (error) {
    console.error("[dataLoader] failed to load video list from API:", error);
    return [];
  }
}


// And disable this 
// async function loadVideoIds(): Promise<string[]> {
//   try {
//     const data = await fetchJson<{ video_id: string }[] | string[]>(
//       `${METADATA_API_BASE}/videos` 
//     );
//     const ids = Array.isArray(data)
//       ? data.map((item) => (typeof item === "string" ? item : item.video_id))
//       : [];
//     console.log("[dataLoader] video list loaded:", ids);
//     return ids.length > 0 ? ids : FALLBACK_VIDEO_IDS;
//   } catch (error) {
//     console.warn("[dataLoader] failed to load video list, using fallback:", error);
//     return FALLBACK_VIDEO_IDS;
//   }
// }



async function loadEvaluationReport(): Promise<RawEvaluationReport | undefined> {
  try {
    const report = await fetchJson<RawEvaluationReport>(
      `${SUMMARY_API_BASE}/evaluation/report`
    );
    console.log("[dataLoader] evaluation_report loaded:", report);
    return report;
  } catch (error) {
    console.warn("[dataLoader] evaluation_report not found:", error);
    return undefined;
  }
}

async function loadVideoMetadata(
  videoId: string
): Promise<RawVideoMetadataFile | undefined> {
  try {
    const metadata = await fetchJson<RawVideoMetadataFile>(
      `${METADATA_API_BASE}/videos/${videoId}/metadata`
    );
    console.log("[dataLoader] metadata loaded:", videoId, metadata);
    return metadata;
  } catch (error) {
    console.warn("[dataLoader] metadata not found:", videoId, error);
    return undefined;
  }
}

async function loadTranscript(
  videoId: string
): Promise<RawTranscriptFile | undefined> {
  try {
    const transcript = await fetchJson<RawTranscriptFile>(
      `${METADATA_API_BASE}/videos/${videoId}/transcript`
    );
    console.log("[dataLoader] transcript loaded:", videoId, transcript);
    return transcript;
  } catch (error) {
    console.warn("[dataLoader] no transcript found for video:", videoId, error);
    return undefined;
  }
}

async function loadVideoSummary(
  videoId: string
): Promise<RawVideoSummary | undefined> {
  try {
    const summary = await fetchJson<RawVideoSummary>(
      `${SUMMARY_API_BASE}/summaries/${videoId}`
    );
    console.log("[dataLoader] summary loaded:", videoId);
    return summary;
  } catch (error) {
    console.warn("[dataLoader] no summary found for video:", videoId, error);
    return undefined;
  }
}

type LlmQualityEntry = NonNullable<RawEvaluationReport["per_video"]>[string];

function mergeVideoData(
  videoSummary: RawVideoSummary,
  chapterFile?: RawChapterSummariesFile,
  transcriptFile?: RawTranscriptFile,
  metadataFile?: RawVideoMetadataFile,
  llmQualityEntry?: LlmQualityEntry
): VideoRecord {
  const chapterSummaryMap = new Map(
    (chapterFile?.chapter_summaries ?? []).map((chapter) => [
      chapter.chapter_index,
      chapter,
    ])
  );

  const chapters: ChapterRecord[] = videoSummary.chapter_timeline.map(
    (timelineItem) => {
      const detailed = chapterSummaryMap.get(timelineItem.chapter_index);

      return {
        id:
          detailed?.chapter_id ??
          `${videoSummary.video_id}_ch${timelineItem.chapter_index}`,
        index: timelineItem.chapter_index,
        title: detailed?.title ?? timelineItem.title,
        startTime: timelineItem.start_time,
        endTime: timelineItem.end_time,
        durationSeconds:
          detailed?.duration_seconds ??
          Math.max(0, timelineItem.end_time - timelineItem.start_time),
        summaryShort: detailed?.summary_short ?? timelineItem.summary_short ?? "",
        summaryMedium: detailed?.summary_medium,
        summaryLong: detailed?.summary_long,
        keyConcepts: ensureStringArray(
          detailed?.key_concepts ?? timelineItem.key_concepts
        ),
        learningObjectives: ensureStringArray(detailed?.learning_objectives),
        hasVisuals: detailed?.has_visuals ?? false,
        visualDescription: detailed?.visual_description,
        difficultyLevel: normalizeDifficulty(detailed?.difficulty_level),
        estimatedReadTimeSeconds: detailed?.estimated_read_time_seconds,
      };
    }
  );

  const mergedKeyConcepts = Array.from(
    new Set([
      ...ensureStringArray(videoSummary.key_concepts),
      ...chapters.flatMap((chapter) => chapter.keyConcepts),
    ])
  );

  const mergedLearningObjectives = Array.from(
    new Set([
      ...ensureStringArray(videoSummary.learning_objectives),
      ...chapters.flatMap((chapter) => chapter.learningObjectives),
    ])
  );

  const videoMetadata = metadataFile?.video_metadata;
  const sourceMetadata = metadataFile?.source_metadata;

  return {
    id: videoSummary.video_id,
    title: videoMetadata?.title || videoSummary.video_title,
    speaker: videoSummary.speaker ?? chapterFile?.speaker,
    domain: videoMetadata?.domain || videoSummary.domain || chapterFile?.domain,
    duration: videoSummary.duration,
    totalChapters: videoSummary.total_chapters,
    videoSrc: getVideoStreamUrl(videoSummary.video_id),
    posterSrc: undefined,
    transcript: normalizeTranscript(transcriptFile),
    summaryShort: videoSummary.summary_short,
    summaryMedium: videoSummary.summary_medium,
    summaryLong: videoSummary.summary_long,
    keyConcepts: mergedKeyConcepts,
    learningObjectives: mergedLearningObjectives,
    videoLearningObjectives: ensureStringArray(videoSummary.learning_objectives),
    prerequisites: ensureStringArray(videoSummary.prerequisites),
    topicProgression: videoSummary.topic_progression,
    difficultyLevel: normalizeDifficulty(videoSummary.difficulty_level),
    domainTags: videoSummary.domain_tags ?? [],
    hasCodeExamples: Boolean(videoSummary.has_code_examples),
    hasMathematicalContent: Boolean(videoSummary.has_mathematical_content),
    hasDiagrams: Boolean(videoSummary.has_diagrams),
    chapters,
    author: videoMetadata?.author || undefined,
    organization: videoMetadata?.organization || undefined,
    description: videoMetadata?.description || undefined,
    mainTopics: ensureStringArray(videoMetadata?.main_topics),
    keywords: ensureStringArray(videoMetadata?.keywords),
    entities: normalizeEntities(metadataFile?.entities),
    processingStats: sourceMetadata
      ? {
          language: sourceMetadata.language,
          model: sourceMetadata.model,
          device: sourceMetadata.device,
          fp16: sourceMetadata.fp16,
          processingTimeSeconds: sourceMetadata.processing_time_seconds,
          realtimeFactor: sourceMetadata.realtime_factor,
          numSegments: sourceMetadata.num_segments,
        }
      : undefined,

    llmQuality: llmQualityEntry?.llm_quality
      ? {
          coherenceScore: llmQualityEntry.llm_quality.coherence_score,
          informativenessScore: llmQualityEntry.llm_quality.informativeness_score,
          concisenessScore: llmQualityEntry.llm_quality.conciseness_score,
          feedback: llmQualityEntry.llm_quality.feedback,
        }
      : undefined,
  };
}

export async function loadVideoRecord(
  videoId: string,
  evaluationReport?: RawEvaluationReport
): Promise<VideoRecord | undefined> {
  const [videoSummary, chapterSummaries, transcriptFile, metadataFile] =
    await Promise.all([
      loadVideoSummary(videoId),
      fetchJson<RawChapterSummariesFile>(
        `${SUMMARY_API_BASE}/summaries/${videoId}/chapters`
      ).catch(() => undefined),
      loadTranscript(videoId),
      loadVideoMetadata(videoId),
    ]);

  if (!videoSummary) {
    return undefined;
  }

  const llmQualityEntry = evaluationReport?.per_video?.[videoId];

  return mergeVideoData(
    videoSummary,
    chapterSummaries,
    transcriptFile,
    metadataFile,
    llmQualityEntry
  );
}

export async function loadAllVideos(
  evaluationReport?: RawEvaluationReport
): Promise<VideoRecord[]> {
  const videoIds = await loadVideoIds();
  const videos = await Promise.all(
    videoIds.map((videoId) => loadVideoRecord(videoId, evaluationReport))
  );
  return videos
    .filter((video): video is VideoRecord => video !== undefined)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function loadCollectionAnalysis(): Promise<CollectionAnalysisRecord> {
  const raw = await fetchJson<RawCollectionAnalysis>(
    `${SUMMARY_API_BASE}/collection/analysis`
  );
  return normalizeCollectionAnalysis(raw);
}

export async function searchVideos(query: string) {
  return fetchJson(`${SUMMARY_API_BASE}/search?q=${encodeURIComponent(query)}`);
}

export async function loadAppDataset(): Promise<AppDataset> {
  const evaluationReport = await loadEvaluationReport();

  const [videos, collectionAnalysis] = await Promise.all([
    loadAllVideos(evaluationReport),
    loadCollectionAnalysis().catch(() => undefined),
  ]);

  return {
    videos,
    collectionAnalysis,
  };
}