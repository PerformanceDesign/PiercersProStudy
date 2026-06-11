import React, { useState } from 'react';
import { Topic } from '../types';
import { ChevronRight, ChevronDown, BookOpen } from 'lucide-react';

interface TopicNodeProps {
  topic: Topic;
  level: number;
  onGenerate: (title: string) => void;
  onExplore?: (id: string) => void;
  hasData?: (title: string) => boolean;
}

const TopicNode: React.FC<TopicNodeProps> = ({ topic, level, onGenerate, onExplore, hasData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  const available = hasData ? hasData(topic.title) : false;

  const handleToggle = () => {
    if (hasSubtopics) {
      const newState = !isOpen;
      setIsOpen(newState);
      if (newState && onExplore) {
        onExplore(topic.id);
      }
    }
  };

  return (
    <div className="mb-2 select-none">
      <div
        className={`
          group relative flex items-center p-3 border-2 border-black bg-white transition-all
          ${hasSubtopics ? 'cursor-pointer hover:bg-zinc-100' : 'cursor-default'}
          neo-shadow-hover
        `}
        onClick={handleToggle}
      >
        <div className="flex items-center flex-1 text-black">
          {hasSubtopics ? (
            isOpen ? <ChevronDown className="mr-2 h-5 w-5" /> : <ChevronRight className="mr-2 h-5 w-5" />
          ) : (
            <span className={`inline-block w-2.5 h-2.5 rounded-full mr-3 shrink-0 ${available ? 'bg-green-500' : 'bg-zinc-300'}`} />
          )}
          <span className={`font-bold ${level === 0 ? 'text-lg uppercase' : 'text-base'} ${!hasSubtopics && !available ? 'opacity-60' : ''}`}>
            {topic.title}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onGenerate(topic.title);
          }}
          className="
            opacity-0 group-hover:opacity-100 flex items-center gap-2 px-4 py-1.5
            bg-[#FF6B00] border-2 border-black font-bold text-sm text-black
            hover:bg-black hover:text-[#FF6B00] transition-all active:translate-y-0.5
          "
        >
          <BookOpen className="h-4 w-4" />
          OPEN LESSON
        </button>
      </div>

      {isOpen && hasSubtopics && (
        <div className="ml-8 mt-2 border-l-4 border-black pl-4">
          {topic.subtopics!.map((sub) => (
            <TopicNode
              key={sub.id}
              topic={sub}
              level={level + 1}
              onGenerate={onGenerate}
              onExplore={onExplore}
              hasData={hasData}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicNode;
