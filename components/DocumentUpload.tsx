import React, { useEffect, useState } from 'react';
import { CircleAlert as AlertCircle, Database, FileText, Loader as Loader2, Upload, Tag } from 'lucide-react';
import { DocumentRecord } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { listDocuments, uploadDocument } from '../services/documentService';

const STATUS_COLORS: Record<DocumentRecord['status'], string> = {
  uploaded: 'bg-zinc-800 text-white',
  processing: 'bg-yellow-500 text-black',
  draft: 'bg-blue-600 text-white',
  published: 'bg-green-600 text-white',
  failed: 'bg-red-600 text-white',
};

const DocumentUpload: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    listDocuments()
      .then(setDocuments)
      .catch(() => setMessage({ text: 'Could not load documentation records.', isError: true }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setIsUploading(true);
    try {
      const doc = await uploadDocument(file);
      setDocuments((prev) => [doc, ...prev]);
      setMessage({ text: 'Documentation uploaded and sent for processing.', isError: false });
    } catch (err) {
      console.error(err);
      setMessage({
        text: 'Upload failed. Check Supabase storage policies and the process-pdf function.',
        isError: true,
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <section className="bg-white border-4 border-black p-6 neo-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-black text-[#FF6B00] p-2">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase leading-none">Upload Documentation</h3>
          <p className="text-xs font-bold uppercase opacity-60">Supabase-backed source library</p>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="border-2 border-black bg-zinc-100 p-4 text-sm font-bold flex gap-2 items-start">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env before uploading PDFs.</span>
        </div>
      ) : (
        <>
          <label className="flex cursor-pointer items-center justify-center gap-2 border-4 border-black bg-[#FF6B00] px-4 py-3 font-black uppercase text-black hover:bg-black hover:text-[#FF6B00] transition-all">
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {isUploading ? 'Uploading...' : 'Upload PDF'}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileChange}
            />
          </label>

          {message && (
            <p className={`mt-3 border-2 border-black p-3 text-sm font-bold ${message.isError ? 'bg-red-50' : 'bg-zinc-100'}`}>
              {message.text}
            </p>
          )}

          <div className="mt-5 space-y-2">
            <h4 className="text-sm font-black uppercase">Uploaded Sources</h4>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm font-bold">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm font-bold opacity-60">No documentation uploaded yet.</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="border-2 border-black bg-zinc-50 p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate">{doc.title}</p>
                      <p className="text-xs font-bold opacity-60 truncate">{doc.filename}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_COLORS[doc.status]}`}>
                          {doc.status}
                        </span>
                        {doc.topicTags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 bg-zinc-200 border border-black px-1.5 py-0.5 text-[10px] font-bold">
                            <Tag className="h-2.5 w-2.5" />{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default DocumentUpload;
