import { DocumentRecord, SourceChunk } from '../types';
import { listDocuments } from './documentService';
import { requireSupabase } from './supabaseClient';

type ChunkRow = {
  id: string;
  document_id: string;
  topic_title: string | null;
  heading: string | null;
  page_number: number | null;
  content: string;
};

const normalizeSearchTerm = (term: string) =>
  term
    .trim()
    .replace(/[%_,()]/g, ' ')
    .replace(/[^a-zA-Z0-9 -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const listPublishedDocuments = async (): Promise<DocumentRecord[]> => {
  const documents = await listDocuments();
  return documents.filter((document) => document.status === 'published');
};

export const listSourceChunks = async (query?: string, limit = 50): Promise<SourceChunk[]> => {
  const supabase = requireSupabase();
  const documents = await listPublishedDocuments();
  const documentMap = new Map(documents.map((document) => [document.id, document]));

  let request = supabase
    .from('document_chunks')
    .select('id, document_id, topic_title, heading, page_number, content')
    .order('page_number', { ascending: true })
    .limit(limit);

  const term = query ? normalizeSearchTerm(query) : '';
  if (term) {
    request = request.or(`topic_title.ilike.%${term}%,heading.ilike.%${term}%,content.ilike.%${term}%`);
  }

  const { data, error } = await request;
  if (error) throw error;

  return ((data || []) as ChunkRow[])
    .map((chunk) => {
      const document = documentMap.get(chunk.document_id);
      if (!document) return null;

      return {
        id: chunk.id,
        documentId: chunk.document_id,
        documentTitle: document.title,
        documentFilename: document.filename,
        topicTitle: chunk.topic_title,
        heading: chunk.heading,
        pageNumber: chunk.page_number,
        content: chunk.content,
      };
    })
    .filter((chunk): chunk is SourceChunk => Boolean(chunk));
};

export const listAllSourceChunks = async (): Promise<SourceChunk[]> => listSourceChunks(undefined, 250);
