import { DocumentRecord } from '../types';
import { requireSupabase } from './supabaseClient';

type DocumentRow = {
  id: string;
  filename: string;
  title: string;
  description: string | null;
  topic_tags: string[] | null;
  status: DocumentRecord['status'];
  created_at: string;
};

const mapDocumentRow = (row: DocumentRow): DocumentRecord => ({
  id: row.id,
  filename: row.filename,
  title: row.title,
  description: row.description,
  topicTags: row.topic_tags || [],
  status: row.status,
  createdAt: row.created_at,
});

export const listDocuments = async (): Promise<DocumentRecord[]> => {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('documents')
    .select('id, filename, title, description, topic_tags, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapDocumentRow);
};

export const uploadDocument = async (file: File): Promise<DocumentRecord> => {
  const supabase = requireSupabase();
  const path = `${Date.now()}-${file.name}`;

  const storageResult = await supabase.storage
    .from('source-documents')
    .upload(path, file, {
      contentType: file.type || 'application/pdf',
      upsert: false,
    });

  if (storageResult.error) {
    throw storageResult.error;
  }

  const { data, error } = await supabase.functions.invoke<DocumentRow>('process-pdf', {
    body: {
      path,
      filename: file.name,
    },
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('The PDF processor did not return a document record.');
  }

  return mapDocumentRow(data);
};
