
export interface Topic {
  id: string;
  title: string;
  subtopics?: Topic[];
  description?: string;
}

export interface LessonContent {
  title: string;
  overview: string;
  anatomy: string;
  tools: string;
  procedure: string;
  aftercare: string;
  complications: string;
  // Technical Deep-Dive Fields
  jewelrySpecs?: string;
  painAndHealing?: string;
  difficulty?: string;
  setup?: string;
  faqs?: string;
  prosCons?: string;
  redFlags?: string;
  clientDiscussion?: string;
  commonIssues?: string;
  sources?: LessonSource[];
}

export interface LessonSource {
  documentTitle: string;
  pageNumber?: number;
  excerpt?: string;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  title: string;
  description?: string | null;
  topicTags: string[];
  status: 'uploaded' | 'processing' | 'draft' | 'published' | 'failed';
  createdAt: string;
}

export enum LoadingStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface SessionStats {
  lessonsGenerated: number;
  topicsExplored: number;
}
