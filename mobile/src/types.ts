export type DocumentRecord = {
  id: string;
  filename: string;
  title: string;
  description: string | null;
  topic_tags: string[] | null;
  status: 'uploaded' | 'processing' | 'draft' | 'published' | 'failed';
  created_at: string;
};

export type SourceChunk = {
  id: string;
  document_id: string;
  topic_title: string | null;
  heading: string | null;
  page_number: number | null;
  content: string;
};

export type Topic = {
  title: string;
  terms: string[];
};
