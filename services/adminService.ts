import { DraftLesson, LessonContent } from '../types';
import { requireSupabase } from './supabaseClient';

type DraftLessonRow = {
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
  created_at: string;
  lesson_sources?: {
    document_id: string;
    documents: {
      id: string;
      filename: string;
      title: string;
    }[] | null;
  }[];
};

const EMPTY = 'No content extracted for this section.';

const mapDraftRow = (row: DraftLessonRow): DraftLesson => {
  const rawDoc = row.lesson_sources?.[0]?.documents;
  const sourceDoc = Array.isArray(rawDoc) ? rawDoc[0] ?? null : rawDoc ?? null;

  const lesson: LessonContent = {
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
  };

  return {
    id: row.id,
    topicTitle: row.topic_title,
    title: row.title,
    overview: row.overview,
    createdAt: row.created_at,
    sourceDocument: sourceDoc
      ? { id: sourceDoc.id, filename: sourceDoc.filename, title: sourceDoc.title }
      : null,
    lesson,
  };
};

export const listDraftLessons = async (): Promise<DraftLesson[]> => {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id, topic_title, title, overview, anatomy, tools, procedure, aftercare,
      complications, jewelry_specs, pain_and_healing, difficulty, setup,
      faqs, pros_cons, red_flags, client_discussion, common_issues, created_at,
      lesson_sources ( document_id, documents ( id, filename, title ) )
    `)
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDraftRow);
};

export const publishLesson = async (lessonId: string, documentId: string | null): Promise<void> => {
  const supabase = requireSupabase();

  const { error: lessonError } = await supabase
    .from('lessons')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', lessonId);

  if (lessonError) throw lessonError;

  if (documentId) {
    const { error: docError } = await supabase
      .from('documents')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    if (docError) throw docError;
  }
};

export const discardLesson = async (lessonId: string): Promise<void> => {
  const supabase = requireSupabase();

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (error) throw error;
};
