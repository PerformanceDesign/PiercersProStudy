import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { DocumentRecord, SourceChunk } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { listAllSourceChunks, listPublishedDocuments } from '../services/sourceService';

interface SourceLibraryProps {
  documents: DocumentRecord[];
  chunks: SourceChunk[];
  isLoading: boolean;
  error: string | null;
}

const SourceLibrary: React.FC<SourceLibraryProps> = ({ documents, chunks, isLoading, error }) => {
  const chunkCountByDocument = useMemo(() => {
    const counts = new Map<string, number>();
    chunks.forEach((chunk) => counts.set(chunk.documentId, (counts.get(chunk.documentId) || 0) + 1));
    return counts;
  }, [chunks]);

  const documentsWithChunks = documents.filter((document) => (chunkCountByDocument.get(document.id) || 0) > 0).length;
  const documentsAwaitingExtraction = documents.length - documentsWithChunks;

  if (!isSupabaseConfigured) {
    return (
      <section className="bg-white border-4 border-black p-6 neo-shadow">
        <div className="flex gap-3 items-start">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="text-xl font-black uppercase">Source Library Offline</h3>
            <p className="text-sm font-bold opacity-70 mt-1">
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load documentation.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border-4 border-black p-6 neo-shadow">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-black text-[#FF6B00] p-2">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase leading-none">Source Library</h3>
            <p className="text-xs font-bold uppercase opacity-60">Documentation coverage and extraction status</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-2 border-black bg-red-50 p-3 text-sm font-bold text-red-700 mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm font-bold">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading source library...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Metric label="PDFs" value={documents.length} />
            <Metric label="Pages" value={chunks.length} />
            <Metric label="Gaps" value={documentsAwaitingExtraction} />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {documents.map((document) => {
              const chunkCount = chunkCountByDocument.get(document.id) || 0;
              const hasChunks = chunkCount > 0;

              return (
                <div key={document.id} className="border-2 border-black bg-zinc-50 p-3">
                  <div className="flex items-start gap-2">
                    {hasChunks ? (
                      <CheckCircle2 className="h-4 w-4 mt-1 text-green-600 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 mt-1 text-zinc-400 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black leading-tight">{document.title}</p>
                      <p className="text-xs font-bold opacity-60 truncate">{document.filename}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${hasChunks ? 'bg-green-600 text-white' : 'bg-zinc-300 text-black'}`}>
                          {hasChunks ? `${chunkCount} pages extracted` : 'needs extraction'}
                        </span>
                        {document.topicTags.map((tag) => (
                          <span key={tag} className="bg-white border border-black px-2 py-0.5 text-[10px] font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="border-2 border-black bg-zinc-100 p-3 text-center">
    <p className="text-2xl font-black leading-none">{value}</p>
    <p className="text-[10px] font-black uppercase opacity-60 mt-1">{label}</p>
  </div>
);

export const useSourceLibrary = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [chunks, setChunks] = useState<SourceChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    setIsLoading(true);
    Promise.all([listPublishedDocuments(), listAllSourceChunks()])
      .then(([nextDocuments, nextChunks]) => {
        setDocuments(nextDocuments);
        setChunks(nextChunks);
      })
      .catch((err) => {
        console.error(err);
        setError('Could not load source documents. Check Supabase env vars and public read policies.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { documents, chunks, isLoading, error };
};

export default SourceLibrary;
