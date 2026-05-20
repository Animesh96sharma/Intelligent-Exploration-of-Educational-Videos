// src/lib/dataLoader.ts

import type {
  AppDataset,
  ChapterRecord,
  CollectionAnalysisRecord,
  RawChapterSummariesFile,
  RawCollectionAnalysis,
  RawVideoSummary,
  VideoRecord,
} from "../types/video";

const DATA_BASE = "/data/processed/subtask2_summarization";

const VIDEO_FILE_MAP: Record<string, string> = {
  tib_av_00000_720p: "/data/raw/videos/tib_av_00000_720p.mp4",
  tib_av_16257_720p: "/data/raw/videos/tib_av_16257_720p.mp4",
  tib_av_16258_720p: "/data/raw/videos/tib_av_16258_720p.mp4",
  tib_av_16259_720p: "/data/raw/videos/tib_av_16259_720p.mp4",
  tib_av_16260_720p: "/data/raw/videos/tib_av_16260_720p.mp4",
  tib_av_16261_1080p: "/data/raw/videos/tib_av_16261_1080p.mp4",
};

const VIDEO_IDS = Object.keys(VIDEO_FILE_MAP);

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

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function mergeVideoData(
  videoSummary: RawVideoSummary,
  chapterFile?: RawChapterSummariesFile
): VideoRecord {
  const chapterSummaryMap = new Map(
    (chapterFile?.chapter_summaries ?? []).map((chapter) => [chapter.chapter_index, chapter])
  );

  const chapters: ChapterRecord[] = videoSummary.chapter_timeline.map((timelineItem) => {
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
      keyConcepts: detailed?.key_concepts ?? timelineItem.key_concepts ?? [],
      learningObjectives: detailed?.learning_objectives ?? [],
      hasVisuals: detailed?.has_visuals ?? false,
      visualDescription: detailed?.visual_description,
      difficultyLevel: normalizeDifficulty(detailed?.difficulty_level),
      estimatedReadTimeSeconds: detailed?.estimated_read_time_seconds,
    };
  });

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

  return {
    id: videoSummary.video_id,
    title: videoSummary.video_title,
    speaker: videoSummary.speaker ?? chapterFile?.speaker,
    domain: videoSummary.domain ?? chapterFile?.domain,
    duration: videoSummary.duration,
    totalChapters: videoSummary.total_chapters,
    videoSrc: VIDEO_FILE_MAP[videoSummary.video_id] ?? "",
    posterSrc: undefined,
    summaryShort: videoSummary.summary_short,
    summaryMedium: videoSummary.summary_medium,
    summaryLong: videoSummary.summary_long,
    keyConcepts: mergedKeyConcepts,
    learningObjectives: mergedLearningObjectives,
    prerequisites: ensureStringArray(videoSummary.prerequisites),
    topicProgression: videoSummary.topic_progression,
    difficultyLevel: normalizeDifficulty(videoSummary.difficulty_level),
    domainTags: videoSummary.domain_tags ?? [],
    hasCodeExamples: Boolean(videoSummary.has_code_examples),
    hasMathematicalContent: Boolean(videoSummary.has_mathematical_content),
    hasDiagrams: Boolean(videoSummary.has_diagrams),
    chapters,
  };
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

export async function loadVideoRecord(videoId: string): Promise<VideoRecord> {
  const [videoSummary, chapterSummaries] = await Promise.all([
    fetchJson<RawVideoSummary>(`${DATA_BASE}/video_summaries/${videoId}_video_summary.json`),
    fetchJson<RawChapterSummariesFile>(
      `${DATA_BASE}/chapter_summaries/${videoId}_chapter_summaries.json`
    ).catch(() => undefined),
  ]);

  return mergeVideoData(videoSummary, chapterSummaries);
}

export async function loadAllVideos(): Promise<VideoRecord[]> {
  const videos = await Promise.all(VIDEO_IDS.map((videoId) => loadVideoRecord(videoId)));
  return videos.sort((a, b) => a.title.localeCompare(b.title));
}

export async function loadCollectionAnalysis(): Promise<CollectionAnalysisRecord> {
  const raw = await fetchJson<RawCollectionAnalysis>(
    `${DATA_BASE}/collection_analysis/collection_analysis.json`
  );
  return normalizeCollectionAnalysis(raw);
}

export async function loadAppDataset(): Promise<AppDataset> {
  const [videos, collectionAnalysis] = await Promise.all([
    loadAllVideos(),
    loadCollectionAnalysis().catch(() => undefined),
  ]);

  return {
    videos,
    collectionAnalysis,
  };
}