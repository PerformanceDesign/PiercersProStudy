import React, { useCallback, useEffect, useState } from 'react';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle2, ChevronDown, ChevronRight, FileText, Loader as Loader2, RefreshCw, Trash2, X } from 'lucide-react';
import { DraftLesson, LessonContent, LoadingStatus } from '../types';
import { listDraftLessons, publishLesson, discardLesson } from '../services/adminService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import LessonModal from './LessonModal';

const AdminReview: React.FC = () => {
  const [drafts, setDrafts] = useState<DraftLesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [previewLesson, setPreviewLesson] = useState<LessonContent | null>(null);
  const [previewStatus, setPreviewStatus] = useState<LoadingStatus>(LoadingStatus.IDLE);

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDrafts(await listDraftLessons());
    } catch (err) {
      console.error(err);
      setError('Draft review needs a protected admin publishing flow. Source documents can still be viewed in the main library.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) loadDrafts();
  }, [loadDrafts]);

  const handlePublish = async (draft: DraftLesson) => {
    setActioningId(draft.id);
    try {
      await publishLesson(draft.id, draft.sourceDocument?.id ?? null);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    } catch (err) {
      console.error(err);
      setError(`Failed to publish "${draft.title}". Check RLS UPDATE policies on lessons and documents.`);
    } finally {
      setActioningId(null);
    }
  };

  const handleDiscard = async (draft: DraftLesson) => {
    if (!confirm(`Discard "${draft.title}"? This cannot be undone.`)) return;
    setActioningId(draft.id);
    try {
      await discardLesson(draft.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    } catch (err) {
      console.error(err);
      setError(`Failed to discard "${draft.title}". Check RLS DELETE policies on lessons.`);
    } finally {
      setActioningId(null);
    }
  };

  const handlePreview = (draft: DraftLesson) => {
    setPreviewLesson(draft.lesson);
    setPreviewStatus(LoadingStatus.SUCCESS);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="border-4 border-black bg-zinc-100 p-6 flex gap-3 items-start">
        <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
        <div>
          <p className="font-black uppercase">Supabase Not Configured</p>
          <p className="text-sm font-bold opacity-70 mt-1">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to use the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Draft Review</h3>
            <p className="text-sm font-bold opacity-60">Review and publish lessons extracted from uploaded PDFs.</p>
          </div>
          <button
            onClick={loadDrafts}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black font-bold text-sm uppercase hover:bg-zinc-100 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="border-2 border-black bg-red-50 p-4 flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="shrink-0">
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-3 py-12 justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="font-bold text-lg">Loading drafts...</span>
          </div>
        ) : drafts.length === 0 ? (
          <div className="border-4 border-black bg-white p-10 text-center neo-shadow">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-black uppercase text-lg">No Drafts Awaiting Review</p>
            <p className="text-sm font-bold opacity-60 mt-1">Source documents are available in the library. Draft lesson publishing can be added after the import/review workflow is protected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => {
              const isExpanded = expandedId === draft.id;
              const isActioning = actioningId === draft.id;

              return (
                <div key={draft.id} className="border-4 border-black bg-white neo-shadow">
                  {/* Card header */}
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : draft.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isExpanded
                        ? <ChevronDown className="h-5 w-5" />
                        : <ChevronRight className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-block bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5">
                          DRAFT
                        </span>
                        <span className="font-black text-base uppercase truncate">{draft.title}</span>
                      </div>
                      <p className="text-xs font-bold opacity-60">
                        Topic: {draft.topicTitle}
                        {draft.sourceDocument && ` · Source: ${draft.sourceDocument.filename}`}
                        {` · ${new Date(draft.createdAt).toLocaleDateString()}`}
                      </p>
                      {draft.overview && (
                        <p className="text-sm font-medium opacity-70 mt-1 line-clamp-2">{draft.overview}</p>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail & actions */}
                  {isExpanded && (
                    <div className="border-t-2 border-black p-4 bg-zinc-50 space-y-3">
                      {draft.sourceDocument && (
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="opacity-60">Source document:</span>
                          <span className="truncate">{draft.sourceDocument.title}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => handlePreview(draft)}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white border-2 border-black font-bold text-sm uppercase hover:bg-black transition-all"
                        >
                          Preview Lesson
                        </button>
                        <button
                          onClick={() => handlePublish(draft)}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-black border-2 border-black font-bold text-sm uppercase hover:bg-black hover:text-[#FF6B00] transition-all disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Publish
                        </button>
                        <button
                          onClick={() => handleDiscard(draft)}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border-2 border-red-600 font-bold text-sm uppercase hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reuse LessonModal for preview */}
      <LessonModal
        status={previewStatus}
        lesson={previewLesson}
        onClose={() => {
          setPreviewLesson(null);
          setPreviewStatus(LoadingStatus.IDLE);
        }}
      />
    </>
  );
};

export default AdminReview;
