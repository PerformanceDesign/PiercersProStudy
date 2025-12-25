
import React from 'react';
import { LessonContent, LoadingStatus } from '../types';
import { X, Download, Loader2, AlertCircle, Info, ShieldAlert, Thermometer, Wrench, HelpCircle, MessageCircle, Star, Scale, Activity } from 'lucide-react';
import { exportLessonToPDF } from '../services/pdfService';

interface LessonModalProps {
  status: LoadingStatus;
  lesson: LessonContent | null;
  onClose: () => void;
}

const LessonModal: React.FC<LessonModalProps> = ({ status, lesson, onClose }) => {
  if (status === LoadingStatus.IDLE) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-6xl max-h-[95vh] bg-white border-4 border-black neo-shadow flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#FF6B00] border-b-4 border-black flex justify-between items-center sticky top-0 z-20 text-black">
          <div className="flex flex-col">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">
              {status === LoadingStatus.LOADING ? 'Consulting Master Database...' : lesson?.title}
            </h2>
            {lesson?.difficulty && (
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-black uppercase bg-black text-[#FF6B00] px-2 py-0.5">
                  Difficulty: {lesson.difficulty}
                </span>
                {lesson.painAndHealing && (
                  <span className="text-[10px] font-black uppercase bg-white text-black px-2 py-0.5 border border-black">
                    Deep Dive Enabled
                  </span>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black hover:text-[#FF6B00] border-2 border-black transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-zinc-50">
          {status === LoadingStatus.LOADING && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 text-black">
              <Loader2 className="h-16 w-16 animate-spin" />
              <p className="text-xl font-bold animate-pulse text-center">
                Generating comprehensive technical brief...<br/>
                <span className="text-sm opacity-60 font-medium italic">Cross-referencing jewelry standards and clinical protocols.</span>
              </p>
            </div>
          )}

          {status === LoadingStatus.ERROR && (
            <div className="flex flex-col items-center justify-center space-y-4 py-20 text-red-600">
              <AlertCircle className="h-16 w-16" />
              <p className="text-xl font-bold">Generation failed. Please retry in a few moments.</p>
            </div>
          )}

          {status === LoadingStatus.SUCCESS && lesson && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-black">
              {/* Top Summary Section */}
              <div className="lg:col-span-3">
                <Section title="Technical Overview" content={lesson.overview} icon={<Info className="h-5 w-5"/>} />
              </div>
              
              <Section title="Clinical Anatomy" content={lesson.anatomy} icon={<Activity className="h-5 w-5"/>} />
              <Section title="Instruments & Tools" content={lesson.tools} icon={<Wrench className="h-5 w-5"/>} />
              <Section title="Jewelry Standards" content={lesson.jewelrySpecs || 'See general standards.'} icon={<Star className="h-5 w-5"/>} />
              
              <Section title="Sensation & Recovery" content={lesson.painAndHealing || 'Standard healing protocols apply.'} icon={<Thermometer className="h-5 w-5"/>} />
              <Section title="Pros & Cons" content={lesson.prosCons || 'Standard considerations.'} icon={<Scale className="h-5 w-5"/>} />
              <Section title="Clinical Red Flags" content={lesson.redFlags || 'Standard health screening.'} icon={<ShieldAlert className="h-5 w-5 text-red-600"/>} />

              <div className="lg:col-span-3">
                <Section title="Step-by-Step Procedure" content={lesson.procedure} />
              </div>

              {lesson.setup && (
                <div className="lg:col-span-3">
                  <Section title="Tray & Workspace Configuration" content={lesson.setup} icon={<Wrench className="h-5 w-5"/>} />
                </div>
              )}

              <Section title="Aftercare Protocol" content={lesson.aftercare} />
              <Section title="Known Complications" content={lesson.complications} />
              <Section title="Common Healing Issues" content={lesson.commonIssues || 'No specific common issues recorded.'} />

              {lesson.clientDiscussion && (
                <div className="lg:col-span-3">
                   <Section title="Consultation & Consent Script" content={lesson.clientDiscussion} icon={<MessageCircle className="h-5 w-5"/>} />
                </div>
              )}
              {lesson.faqs && (
                <div className="lg:col-span-3">
                  <Section title="Frequent Professional Questions" content={lesson.faqs} icon={<HelpCircle className="h-5 w-5"/>} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {status === LoadingStatus.SUCCESS && lesson && (
          <div className="p-4 md:p-6 border-t-4 border-black bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
            <span className="text-xs font-black text-black uppercase tracking-widest bg-zinc-100 px-3 py-1 border-2 border-black">
              Pro-Study Engine v3.0 / High Fidelity
            </span>
            <button 
              onClick={() => exportLessonToPDF(lesson)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#FF6B00] border-4 border-black font-black uppercase text-lg text-black hover:bg-black hover:text-[#FF6B00] transition-all active:translate-y-1"
            >
              <Download className="h-6 w-6" />
              Export Full Technical PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; content: string; icon?: React.ReactNode }> = ({ title, content, icon }) => (
  <div className="border-4 border-black bg-white p-6 neo-shadow-hover transition-all h-full">
    <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
      {icon}
      <h3 className="text-lg font-black uppercase text-black">
        {title}
      </h3>
    </div>
    <p className="text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap font-medium">
      {content}
    </p>
  </div>
);

export default LessonModal;
