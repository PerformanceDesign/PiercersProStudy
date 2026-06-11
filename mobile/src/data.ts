import { DocumentRecord, SourceChunk, Topic } from './types';
import { requireSupabase } from './supabase';

export const curriculumTopics: Topic[] = [
  { title: 'Anatomy & Physiology', terms: ['anatomy', 'physiology', 'skin', 'tissue', 'vascular', 'nervous'] },
  { title: 'Tools & Equipment', terms: ['tools', 'equipment', 'needle', 'forceps', 'clamp'] },
  { title: 'Aftercare & Healing', terms: ['aftercare', 'healing', 'immune', 'lymphatic'] },
  { title: 'Complications', terms: ['complications', 'troubleshooting', 'allergic', 'sensitivities', 'infection'] },
  { title: 'Genital Piercing', terms: ['genital', 'vch', 'triangle', 'christina', 'prince albert', 'guiche'] },
  { title: 'Regulations & First Aid', terms: ['first-aid', 'first aid', 'organisations', 'governmental', 'regulations'] },
];

export const atlasTopics: Topic[] = [
  { title: 'Ear Cartilage', terms: ['helix', 'tragus', 'conch', 'rook', 'daith', 'industrial', 'snug', 'flat'] },
  { title: 'Ear Lobe', terms: ['lobe', 'stretched lobe'] },
  { title: 'Nose & Face', terms: ['septum', 'nostril', 'bridge', 'eyebrow'] },
  { title: 'Lip & Oral', terms: ['philtrum', 'labret', 'monroe', 'madonna', 'tongue', 'venom'] },
  { title: 'Body & Genital', terms: ['navel', 'nipple', 'dermal', 'surface', 'genital', 'vch', 'triangle'] },
];

export const loadDocuments = async (): Promise<DocumentRecord[]> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('documents')
    .select('id, filename, title, description, topic_tags, status, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const loadChunks = async (limit = 250): Promise<SourceChunk[]> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('document_chunks')
    .select('id, document_id, topic_title, heading, page_number, content')
    .order('page_number', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
};

export const searchChunks = async (query: string, limit = 20): Promise<SourceChunk[]> => {
  const term = query
    .trim()
    .replace(/[%_,()]/g, ' ')
    .replace(/[^a-zA-Z0-9 -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!term) return [];

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('document_chunks')
    .select('id, document_id, topic_title, heading, page_number, content')
    .or(`topic_title.ilike.%${term}%,heading.ilike.%${term}%,content.ilike.%${term}%`)
    .limit(limit);

  if (error) throw error;
  return data ?? [];
};

export const topicHasCoverage = (topic: Topic, documents: DocumentRecord[], chunks: SourceChunk[]) => {
  const haystack = [
    ...documents.flatMap((document) => [document.title, document.filename, ...(document.topic_tags ?? [])]),
    ...chunks.flatMap((chunk) => [chunk.topic_title ?? '', chunk.heading ?? '', chunk.content.slice(0, 600)]),
  ]
    .join(' ')
    .toLowerCase();

  return topic.terms.some((term) => haystack.includes(term.toLowerCase()));
};
