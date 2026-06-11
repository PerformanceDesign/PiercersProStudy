import { LessonContent, Topic } from '../types';
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
  return data ? mapLessonRow(data) : null;
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
