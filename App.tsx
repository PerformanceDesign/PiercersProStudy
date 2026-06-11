import React, { useState, useCallback, useEffect } from 'react';
import { CURRICULUM, PIERCING_ATLAS } from './constants';
import { LessonContent, LoadingStatus, SessionStats, Topic } from './types';
import { getLessonByTopic, listPublishedTopics } from './services/lessonService';
import TopicNode from './components/TopicNode';
import LessonModal from './components/LessonModal';
import DocumentUpload from './components/DocumentUpload';
import AdminReview from './components/AdminReview';
import { Skull, RefreshCcw, Loader as Loader2, Zap, Settings, Database, FileText } from 'lucide-react';

const PLACEHOLDER_LESSON = (title: string): LessonContent => ({
  title,
  overview: 'No documentation has been uploaded for this topic yet.',
  anatomy: 'Upload and publish source documentation before this section becomes available.',
  tools: 'Upload and publish source documentation before this section becomes available.',
  procedure: 'Upload and publish source documentation before this section becomes available.',
  aftercare: 'Upload and publish source documentation before this section becomes available.',
  complications: 'Upload and publish source documentation before this section becomes available.',
});

const App: React.FC = () => {
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.IDLE);
  const [activeLesson, setActiveLesson] = useState<LessonContent | null>(null);
  const [stats, setStats] = useState<SessionStats>({ lessonsGenerated: 0, topicsExplored: 0 });
  const [exploredIds, setExploredIds] = useState<Set<string>>(new Set());
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'review' | 'documents'>('review');
  const [publishedTopics, setPublishedTopics] = useState<Set<string>>(new Set());
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);

  useEffect(() => {
    setIsLoadingTopics(true);
    listPublishedTopics()
      .then((topics) => setPublishedTopics(new Set(topics)))
      .catch((err) => console.error('Failed to load published topics', err))
      .finally(() => setIsLoadingTopics(false));
  }, []);

  const hasData = useCallback(
    (title: string) => publishedTopics.has(title.toLowerCase()),
    [publishedTopics]
  );

  const handleGenerateLesson = useCallback(async (title: string) => {
    setLoadingStatus(LoadingStatus.LOADING);
    setActiveLesson(null);
    try {
      const lesson = await getLessonByTopic(title);
      setActiveLesson(lesson ?? PLACEHOLDER_LESSON(title));
      setLoadingStatus(LoadingStatus.SUCCESS);
      setStats((prev) => ({ ...prev, lessonsGenerated: prev.lessonsGenerated + 1 }));
    } catch (error) {
      console.error(error);
      setLoadingStatus(LoadingStatus.ERROR);
    }
  }, []);

  const handleRandomLesson = useCallback(() => {
    const allTitles: string[] = [];
    const collectTitles = (topics: Topic[]) => {
      topics.forEach((t) => {
        allTitles.push(t.title);
        if (t.subtopics) collectTitles(t.subtopics);
      });
    };
    collectTitles(CURRICULUM);
    PIERCING_ATLAS.forEach((cat) => allTitles.push(...cat.piercings));
    const available = allTitles.filter((t) => publishedTopics.has(t.toLowerCase()));
    const pool = available.length > 0 ? available : allTitles;
    if (pool.length > 0) {
      handleGenerateLesson(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [publishedTopics, handleGenerateLesson]);

  const handleTopicExplored = useCallback((id: string) => {
    if (!exploredIds.has(id)) {
      setExploredIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        setStats((s) => ({ ...s, topicsExplored: next.size }));
        return next;
      });
    }
  }, [exploredIds]);

  const availableCount = publishedTopics.size;

  return (
    <div className="min-h-screen pb-20 text-black">
      <header className="sticky top-0 z-40 bg-black text-[#FF6B00] p-4 border-b-8 border-[#FF6B00]">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FF6B00] text-black border-4 border-[#FF6B00]">
              <Skull className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
              Piercer's Pro-Study
            </h1>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold uppercase">
            <button
              onClick={() => {
                setIsAdminMode((v) => !v);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 border-2 transition-all active:translate-y-0.5 ${
                isAdminMode
                  ? 'bg-[#FF6B00] text-black border-black'
                  : 'bg-black text-[#FF6B00] border-[#FF6B00] hover:bg-[#FF6B00]/10'
              }`}
            >
              <Settings className="h-4 w-4" /> ADMIN
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-12 space-y-20">
        {isAdminMode ? (
          <div className="space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => setAdminTab('review')}
                className={`flex items-center gap-2 px-5 py-2.5 border-4 border-black font-black uppercase text-sm transition-all ${
                  adminTab === 'review'
                    ? 'bg-[#FF6B00] text-black'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
              >
                <FileText className="h-4 w-4" /> Draft Review
              </button>
              <button
                onClick={() => setAdminTab('documents')}
                className={`flex items-center gap-2 px-5 py-2.5 border-4 border-black font-black uppercase text-sm transition-all ${
                  adminTab === 'documents'
                    ? 'bg-[#FF6B00] text-black'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
              >
                <Database className="h-4 w-4" /> Documents
              </button>
            </div>
            {adminTab === 'review' ? <AdminReview /> : <DocumentUpload />}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Sidebar */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border-4 border-black p-8 neo-shadow">
                  <h2 className="text-4xl md:text-6xl font-black uppercase leading-[0.85] tracking-tighter mb-6">
                    MASTER THE{' '}
                    <button
                      onClick={handleRandomLesson}
                      className="bg-[#FF6B00] px-2 hover:bg-black hover:text-[#FF6B00] transition-colors inline-flex items-center group relative overflow-hidden mx-1 md:mx-2 align-baseline"
                    >
                      ART <RefreshCcw className="ml-2 h-5 w-5 md:h-6 md:w-6 group-hover:rotate-180 transition-transform duration-500" />
                    </button>{' '}
                    OF PIERCING.
                  </h2>
                  <p className="text-xl font-bold border-l-8 border-[#FF6B00] pl-6 py-2 mb-8">
                    Source-backed reference documentation for body modification procedures.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <StatBox label="Lessons Viewed" value={stats.lessonsGenerated} />
                    <StatBox label="Topics Explored" value={stats.topicsExplored} />
                    <StatBox label="Sources Available" value={isLoadingTopics ? '...' : availableCount} />
                  </div>
                </div>
              </div>

              {/* Curriculum Tree */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black uppercase tracking-tighter bg-white border-2 border-black px-4 py-2 inline-block">
                    Curriculum Engine
                  </h3>
                  <Legend />
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {CURRICULUM.map((topic) => (
                    <TopicNode
                      key={topic.id}
                      topic={topic}
                      level={0}
                      onGenerate={handleGenerateLesson}
                      onExplore={handleTopicExplored}
                      hasData={hasData}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Technical Atlas */}
            <section className="bg-white border-8 border-black p-4 md:p-8 neo-shadow">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="bg-black p-3 text-[#FF6B00]">
                  <Zap className="h-8 w-8 md:h-10 md:w-10 fill-current" />
                </div>
                <div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Technical Atlas</h2>
                  <p className="text-base md:text-lg font-bold opacity-60">Procedure Encyclopedia</p>
                </div>
                <div className="md:ml-auto"><Legend /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {PIERCING_ATLAS.map((category) => (
                  <div key={category.category} className="space-y-4">
                    <h4 className="text-xl font-black uppercase border-b-4 border-black inline-block">{category.category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.piercings.map((p) => {
                        const available = hasData(p);
                        return (
                          <button
                            key={p}
                            onClick={() => handleGenerateLesson(p)}
                            className={`px-3 py-1.5 border-2 border-black font-bold text-xs md:text-sm uppercase hover:-translate-y-1 transition-all active:translate-y-0 ${
                              available
                                ? 'bg-green-50 hover:bg-[#FF6B00]'
                                : 'bg-zinc-100 hover:bg-zinc-200 opacity-70'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={`inline-block w-2 h-2 rounded-full ${available ? 'bg-green-500' : 'bg-zinc-300'}`} />
                              {p}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <LessonModal
        status={loadingStatus}
        lesson={activeLesson}
        onClose={() => { setLoadingStatus(LoadingStatus.IDLE); setActiveLesson(null); }}
      />
    </div>
  );
};

const Legend: React.FC = () => (
  <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Has Data</span>
    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-zinc-300" /> No Data Yet</span>
  </div>
);

const StatBox: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="border-4 border-black p-4 bg-zinc-50 flex flex-col items-center">
    <span className="text-3xl md:text-4xl font-black">{value}</span>
    <span className="text-[10px] md:text-xs font-black uppercase opacity-60 text-center">{label}</span>
  </div>
);

export default App;
