import { LessonContent, Topic } from '../types';
import { listSourceChunks } from './sourceService';
import { requireSupabase } from './supabaseClient';

type LessonRow = {
  id: string;
  topic_title: string;
  title: string;
  overview: string | null;
  anatomy: string | null;
  tools: string | null;
  procedure: string | null;
  aftercare: string | null;
  complications: string | null;
  jewelry_specs: string | null;
  pain_and_healing: string | null;
  difficulty: string | null;
  setup: string | null;
  faqs: string | null;
  pros_cons: string | null;
  red_flags: string | null;
  client_discussion: string | null;
  common_issues: string | null;
  lesson_sources?: {
    page_number: number | null;
    excerpt: string | null;
    documents: { title: string } | null;
  }[];
};

const EMPTY = 'No documentation has been published for this section yet.';

const mapLessonRow = (row: LessonRow): LessonContent => ({
  title: row.title || row.topic_title,
  overview: row.overview || EMPTY,
  anatomy: row.anatomy || EMPTY,
  tools: row.tools || EMPTY,
  procedure: row.procedure || EMPTY,
  aftercare: row.aftercare || EMPTY,
  complications: row.complications || EMPTY,
  jewelrySpecs: row.jewelry_specs || undefined,
  painAndHealing: row.pain_and_healing || undefined,
  difficulty: row.difficulty || undefined,
  setup: row.setup || undefined,
  faqs: row.faqs || undefined,
  prosCons: row.pros_cons || undefined,
  redFlags: row.red_flags || undefined,
  clientDiscussion: row.client_discussion || undefined,
  commonIssues: row.common_issues || undefined,
  sources: row.lesson_sources?.map((s) => ({
    documentTitle: s.documents?.title || 'Uploaded documentation',
    pageNumber: s.page_number ?? undefined,
    excerpt: s.excerpt ?? undefined,
  })),
});

const getSourceChunksForTopic = async (topicTitle: string) => {
  const exactChunks = await listSourceChunks(topicTitle, 8);
  if (exactChunks.length > 0) return exactChunks;

  const keywords = topicTitle
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4 && !['piercing', 'common', 'standard'].includes(word))
    .slice(0, 4);

  const chunksById = new Map<string, Awaited<ReturnType<typeof listSourceChunks>>[number]>();
  for (const keyword of keywords) {
    const keywordChunks = await listSourceChunks(keyword, 4);
    keywordChunks.forEach((chunk) => chunksById.set(chunk.id, chunk));
    if (chunksById.size >= 8) break;
  }

  return Array.from(chunksById.values()).slice(0, 8);
};

export const getLessonByTopic = async (topicTitle: string): Promise<LessonContent | null> => {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id, topic_title, title, overview, anatomy, tools, procedure, aftercare,
      complications, jewelry_specs, pain_and_healing, difficulty, setup,
      faqs, pros_cons, red_flags, client_discussion, common_issues,
      lesson_sources ( page_number, excerpt, documents ( title ) )
    `)
    .eq('topic_title', topicTitle)
    .eq('status', 'published')
    .maybeSingle<LessonRow>();

  if (error) throw error;
  if (data) return mapLessonRow(data);

  const chunks = await getSourceChunksForTopic(topicTitle);
  if (chunks.length === 0) return null;

  const excerptBlock = chunks
    .map((chunk) => {
      const page = chunk.pageNumber ? `p. ${chunk.pageNumber}` : 'source page';
      return `${chunk.documentTitle}, ${page}\n${chunk.content}`;
    })
    .join('\n\n---\n\n');

  return {
    title: `${topicTitle} - Source Notes`,
    overview: `No reviewed lesson has been published for "${topicTitle}" yet, but the source database contains matching documentation excerpts. Use these notes as a research/reference view until a structured lesson is reviewed and published.`,
    anatomy: excerptBlock,
    tools: EMPTY,
    procedure: EMPTY,
    aftercare: EMPTY,
    complications: EMPTY,
    sources: chunks.map((chunk) => ({
      documentTitle: chunk.documentTitle,
      pageNumber: chunk.pageNumber ?? undefined,
      excerpt: chunk.content.slice(0, 220),
    })),
  };
};

export const suggestTopics = async (existingTopics: string[]): Promise<Topic[]> => {
  const supabase = requireSupabase();
  const existing = new Set(existingTopics.map((t) => t.toLowerCase()));

  const { data, error } = await supabase
    .from('lessons')
    .select('topic_title, title')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) throw error;

  return (data || [])
    .filter((row) => !existing.has((row.topic_title || row.title).toLowerCase()))
    .slice(0, 5)
    .map((row) => ({
      id: `db-${(row.topic_title || row.title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: row.topic_title || row.title,
      description: 'Published from uploaded documentation',
    }));
};
