export type SummaryDetailLevel = "short" | "medium" | "long";

export interface RawMetadataEntity {
  text: string;
  label: string;
  mentions: number;
}

export interface RawVideoMetadataFile {
  source_metadata: {
    language: string;
    duration_seconds: number;
    model: string;
    device: string;
    fp16: boolean;
    processing_time_seconds: number;
    realtime_factor: number;
    num_segments: number;
  };
  video_metadata: {
    title: string;
    author: string;
    organization: string;
    domain: string;
    description: string;
    main_topics: string[];
    keywords: string[];
    entities: RawMetadataEntity[];
    language: string;
  };
  entities: RawMetadataEntity[];
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  startTimestamp: string;
  endTimestamp: string;
  text: string;
  confidence?: number;
}

export interface VideoTranscript {
  language?: string;
  durationSeconds?: number;
  model?: string;
  numSegments?: number;
  segments: TranscriptSegment[];
}

export interface RawChapterTimelineItem {
  chapter_index: number;
  title: string;
  start_time: number;
  end_time: number;
  summary_short: string;
  key_concepts?: string[];
}

export interface RawVideoSummary {
  video_id: string;
  video_title: string;
  speaker?: string;
  domain?: string;
  duration: number;
  total_chapters: number;
  chapter_timeline: RawChapterTimelineItem[];
  summary_short?: string;
  summary_medium?: string;
  summary_long?: string;
  key_concepts?: string[] | string;
  learning_objectives?: string[] | string;
  prerequisites?: string[] | string;
  topic_progression?: string;
  difficulty_level?: string;
  domain_tags?: string[];
  has_code_examples?: boolean;
  has_mathematical_content?: boolean;
  has_diagrams?: boolean;
}

export interface RawChapterSummaryItem {
  chapter_id: string;
  chapter_index: number;
  title: string;
  start_time: number;
  end_time: number;
  duration_seconds?: number;
  summary_short?: string;
  summary_medium?: string;
  summary_long?: string;
  key_concepts?: string[];
  learning_objectives?: string[];
  has_visuals?: boolean;
  visual_description?: string;
  difficulty_level?: string;
  estimated_read_time_seconds?: number;
}

export interface RawChapterSummariesFile {
  video_id: string;
  video_title: string;
  speaker?: string;
  domain?: string;
  duration: number;
  total_chapters: number;
  chapter_summaries: RawChapterSummaryItem[];
}

export interface CollectionOverview {
  collection_summary?: string;
  main_themes?: string[];
  suggested_viewing_order?: Array<{
    video_id: string;
    reason: string;
  }>;
  difficulty_progression?: string;
  knowledge_gaps?: string[];
  target_audience?: string;
}

export interface UniqueConceptGroup {
  video_title: string;
  unique_concepts: string[];
}

export interface RawCollectionAnalysis {
  total_videos: number;
  collection_overview?: CollectionOverview;
  common_concepts?: Record<string, string[]>;
  unique_concepts?: Record<string, UniqueConceptGroup>;
}

export interface ChapterRecord {
  id: string;
  index: number;
  title: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  summaryShort: string;
  summaryMedium?: string;
  summaryLong?: string;
  keyConcepts: string[];
  learningObjectives: string[];
  hasVisuals: boolean;
  visualDescription?: string;
  difficultyLevel?: string;
  estimatedReadTimeSeconds?: number;
}

export interface VideoRecord {
  id: string;
  title: string;
  speaker?: string;
  domain?: string;
  duration: number;
  totalChapters: number;
  videoSrc: string;
  posterSrc?: string;
  transcript?: VideoTranscript;
  summaryShort?: string;
  summaryMedium?: string;
  summaryLong?: string;
  keyConcepts: string[];
  learningObjectives: string[];
  prerequisites: string[];
  topicProgression?: string;
  difficultyLevel?: string;
  domainTags: string[];
  hasCodeExamples: boolean;
  hasMathematicalContent: boolean;
  hasDiagrams: boolean;
  chapters: ChapterRecord[];
  author?: string;
  organization?: string;
  description?: string;
  mainTopics: string[];
  keywords: string[];
  entities: RawMetadataEntity[];
  processingStats?: {
    language: string;
    model: string;
    device: string;
    fp16: boolean;
    processingTimeSeconds: number;
    realtimeFactor: number;
    numSegments: number;
}

export interface CollectionAnalysisRecord {
  totalVideos: number;
  overview?: CollectionOverview;
  commonConcepts: Record<string, string[]>;
  uniqueConcepts: Record<string, UniqueConceptGroup>;
}

export interface AppDataset {
  videos: VideoRecord[];
  collectionAnalysis?: CollectionAnalysisRecord;
}

export interface ConceptOverlapRecord {
  concept: string;
  normalized: string;
}

export interface VideoSimilarityRecord {
  sourceVideoId: string;
  targetVideoId: string;
  sharedConcepts: string[];
  score: number;
}

export interface VideoComparisonRecord {
  leftVideoId: string;
  rightVideoId: string;
  sharedConcepts: string[];
  leftUniqueConcepts: string[];
  rightUniqueConcepts: string[];
  similarityScore: number;
}

export type ComparisonSelection = [string, string] | [];