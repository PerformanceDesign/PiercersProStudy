
import React, { useState, useCallback, useMemo } from 'react';
import { CURRICULUM, PIERCING_ATLAS } from './constants';
import { LessonContent, LoadingStatus, SessionStats, Topic } from './types';
import { generateLesson, suggestTopics } from './services/geminiService';
import TopicNode from './components/TopicNode';
import LessonModal from './components/LessonModal';
import { Stethoscope, Skull, ShieldCheck, GraduationCap, RefreshCcw, Plus, Sparkles, Send, Loader2, Book, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.IDLE);
  const [activeLesson, setActiveLesson] = useState<LessonContent | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({ lessonsGenerated: 0, topicsExplored: 0 });
  const [exploredIds, setExploredIds] = useState<Set<string>>(new Set());
  
  const [dynamicTopics, setDynamicTopics] = useState<Topic[]>([]);
  const [customRequest, setCustomRequest] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);

  const handleGenerateLesson = useCallback(async (title: string, isDeepDive: boolean = false) => {
    setLoadingStatus(LoadingStatus.LOADING);
    setActiveLesson(null);
    try {
      const lesson = await generateLesson(title, isDeepDive);
      setActiveLesson(lesson);
      setLoadingStatus(LoadingStatus.SUCCESS);
      setStats(prev => ({ ...prev, lessonsGenerated: prev.lessonsGenerated + 1 }));
    } catch (error) {
      console.error(error);
      setLoadingStatus(LoadingStatus.ERROR);
    }
  }, []);

  const handleRandomLesson = useCallback(() => {
    const allTitles: string[] = [];
    const collectTitles = (topics: Topic[]) => {
      topics.forEach(t => {
        allTitles.push(t.title);
        if (t.subtopics) collectTitles(t.subtopics);
      });
    };
    collectTitles([...CURRICULUM, ...dynamicTopics]);
    PIERCING_ATLAS.forEach(cat => allTitles.push(...cat.piercings));
    
    if (allTitles.length > 0) {
      const random = allTitles[Math.floor(Math.random() * allTitles.length)];
      handleGenerateLesson(random, true);
    }
  }, [dynamicTopics, handleGenerateLesson]);

  const handleTopicExplored = useCallback((id: string) => {
    if (!exploredIds.has(id)) {
      setExploredIds(prev => {
        const next = new Set(prev);
        next.add(id);
        setStats(s => ({ ...s, topicsExplored: next.size }));
        return next;
      });
    }
  }, [exploredIds]);

  const closeModal = () => {
    setLoadingStatus(LoadingStatus.IDLE);
    setActiveLesson(null);
  };

  const handleExpandCurriculum = async () => {
    setIsExpanding(true);
    try {
      const existingTitles = [...CURRICULUM, ...dynamicTopics].map(t => t.title);
      const suggestions = await suggestTopics(existingTitles);
      setDynamicTopics(prev => [...prev, ...suggestions]);
    } catch (e) {
      console.error("Failed to expand curriculum", e);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRequest.trim()) return;
    const newTopic: Topic = { id: `custom-${Date.now()}`, title: customRequest.trim() };
    setDynamicTopics(prev => [newTopic, ...prev]);
    handleGenerateLesson(newTopic.title, true);
    setCustomRequest('');
  };

  const filteredCurriculum = useMemo(() => {
    const combined = [...CURRICULUM, ...dynamicTopics];
    if (!activeFilter) return combined;
    const filterMap: Record<string, string[]> = {
      'CLINICAL': ['anatomy-physiology', 'health-safety'],
      'CERTIFIED': ['jewelry-materials', 'aftercare-healing'],
      'MASTERCLASS': ['piercing-techniques', 'ethics-business', 'jewelry-metallurgy', 'advanced-piercing']
    };
    return combined.filter(c => 
      (filterMap[activeFilter]?.includes(c.id)) || 
      (activeFilter === 'MASTERCLASS' && c.id.startsWith('custom-'))
    );
  }, [activeFilter, dynamicTopics]);

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
            {[
              { id: 'CLINICAL', icon: Stethoscope },
              { id: 'CERTIFIED', icon: ShieldCheck },
              { id: 'MASTERCLASS', icon: GraduationCap }
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveFilter(activeFilter === id ? null : id)}
                className={`flex items-center gap-1 px-3 py-1.5 border-2 transition-all active:translate-y-0.5 ${
                  activeFilter === id ? 'bg-[#FF6B00] text-black border-black' : 'bg-black text-[#FF6B00] border-[#FF6B00] hover:bg-[#FF6B00]/10'
                }`}
              >
                <Icon className="h-4 w-4" /> {id}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-12 space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar / Stats */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border-4 border-black p-8 neo-shadow">
              <h2 className="text-4xl md:text-6xl font-black uppercase leading-[0.85] tracking-tighter mb-6">
                MASTER THE 
                <button 
                  onClick={handleRandomLesson}
                  className="bg-[#FF6B00] px-2 hover:bg-black hover:text-[#FF6B00] transition-colors inline-flex items-center group relative overflow-hidden mx-1 md:mx-2 align-baseline"
                >
                  ART <RefreshCcw className="ml-2 h-5 w-5 md:h-6 md:w-6 group-hover:rotate-180 transition-transform duration-500" />
                </button> 
                OF PIERCING.
              </h2>
              <p className="text-xl font-bold border-l-8 border-[#FF6B00] pl-6 py-2 mb-8">
                Generate high-precision technical guides for every known body modification procedure.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Units Mastered" value={stats.lessonsGenerated} />
                <StatBox label="Regions Mapped" value={stats.topicsExplored} />
              </div>
            </div>

            <div className="bg-black text-white p-6 border-4 border-black neo-shadow">
              <h3 className="text-xl font-black uppercase mb-4 text-[#FF6B00] flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Curricular Expansion
              </h3>
              <p className="font-bold opacity-90 text-sm mb-4">
                Identify new clinical research paths or submit custom requests below.
              </p>
              <button 
                onClick={handleExpandCurriculum}
                disabled={isExpanding}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6B00] text-black font-black uppercase border-2 border-[#FF6B00] hover:bg-white transition-all disabled:opacity-50"
              >
                {isExpanding ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5" />}
                Analyze Knowledge Gaps
              </button>
            </div>
          </div>

          {/* Curriculum Tree */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-3xl font-black uppercase tracking-tighter bg-white border-2 border-black px-4 py-2 inline-block">
              {activeFilter ? `${activeFilter} Focus` : 'Curriculum Engine'}
            </h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredCurriculum.map((topic) => (
                <TopicNode 
                  key={topic.id} 
                  topic={topic} 
                  level={0} 
                  onGenerate={(t) => handleGenerateLesson(t, false)}
                  onExplore={handleTopicExplored}
                />
              ))}
            </div>

            <form onSubmit={handleCustomRequest} className="mt-8 flex gap-2">
              <input 
                type="text" 
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="Request specialized procedure (e.g. Scapha piercing)..."
                className="flex-1 bg-white border-4 border-black p-4 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#FF6B00]/50 placeholder:opacity-50"
              />
              <button type="submit" className="bg-black text-[#FF6B00] px-6 border-4 border-black hover:bg-[#FF6B00] hover:text-black transition-all">
                <Send className="h-6 w-6" />
              </button>
            </form>
          </div>
        </div>

        {/* Technical Atlas Section */}
        <section className="bg-white border-8 border-black p-4 md:p-8 neo-shadow">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-10">
            <div className="bg-black p-3 text-[#FF6B00]">
              <Zap className="h-8 w-8 md:h-10 md:w-10 fill-current" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Technical Atlas</h2>
              <p className="text-base md:text-lg font-bold opacity-60">Complete Deep-Dive Encyclopedia of Procedures</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {PIERCING_ATLAS.map((category) => (
              <div key={category.category} className="space-y-4">
                <h4 className="text-xl font-black uppercase border-b-4 border-black inline-block">{category.category}</h4>
                <div className="flex flex-wrap gap-2">
                  {category.piercings.map(p => (
                    <button
                      key={p}
                      onClick={() => handleGenerateLesson(p, true)}
                      className="px-3 py-1.5 bg-zinc-100 border-2 border-black font-bold text-xs md:text-sm uppercase hover:bg-[#FF6B00] hover:-translate-y-1 transition-all active:translate-y-0"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <LessonModal status={loadingStatus} lesson={activeLesson} onClose={closeModal} />
    </div>
  );
};

const StatBox: React.FC<{ label: string, value: number | string }> = ({ label, value }) => (
  <div className="border-4 border-black p-4 bg-zinc-50 flex flex-col items-center">
    <span className="text-3xl md:text-4xl font-black">{value}</span>
    <span className="text-[10px] md:text-xs font-black uppercase opacity-60 text-center">{label}</span>
  </div>
);

export default App;
