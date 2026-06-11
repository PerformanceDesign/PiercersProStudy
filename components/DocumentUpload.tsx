import React, { useEffect, useState } from 'react';
import { AlertCircle, Database, FileText, Loader2, Upload } from 'lucide-react';
import { DocumentRecord } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { listDocuments, uploadDocument } from '../services/documentService';

const DocumentUpload: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        setDocuments(await listDocuments());
      } catch (error) {
        console.error(error);
        setMessage('Could not load documentation records.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setIsUploading(true);

    try {
      const document = await uploadDocument(file);
      setDocuments((current) => [document, ...current]);
      setMessage('Documentation uploaded. The PDF processor returned a document record.');
    } catch (error) {
      console.error(error);
      setMessage('Upload failed. Check Supabase storage, policies, and the process-pdf function.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <section className="bg-white border-4 border-black p-6 neo-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-black text-[#FF6B00] p-2">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase leading-none">Upload Documentation</h3>
          <p className="text-xs font-bold uppercase opacity-60">Supabase-backed source library</p>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="border-2 border-black bg-zinc-100 p-4 text-sm font-bold flex gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local before uploading PDFs.
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
            <p className="mt-3 border-2 border-black bg-zinc-100 p-3 text-sm font-bold">
              {message}
            </p>
          )}

          <div className="mt-5 space-y-2">
            <h4 className="text-sm font-black uppercase">Available Sources</h4>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm font-bold">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm font-bold opacity-60">No documentation uploaded yet.</p>
            ) : (
              documents.map((document) => (
                <div key={document.id} className="border-2 border-black bg-zinc-50 p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-black">{document.title}</p>
                      <p className="text-xs font-bold opacity-60">{document.filename}</p>
                      <p className="mt-1 inline-block bg-black px-2 py-0.5 text-[10px] font-black uppercase text-[#FF6B00]">
                        {document.status}
                      </p>
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
