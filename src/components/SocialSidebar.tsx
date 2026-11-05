import React, { useState } from 'react';
import { 
  Search, 
  Video, 
  Flame, 
  Play, 
  Sliders,
  Sparkles,
  MapPin,
  Heart
} from 'lucide-react';
import { Persona } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { CULTURAL_STORIES } from '../data/personas';
import { speechService } from '../utils/speech';

interface SocialSidebarProps {
  personas: Persona[];
  selectedPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  onStartVideoCall: (persona: Persona) => void;
  onOpenDevLab: () => void;
  onGoHome?: () => void;
  className?: string;
}

export const SocialSidebar: React.FC<SocialSidebarProps> = ({
  personas,
  selectedPersona,
  onSelectPersona,
  onStartVideoCall,
  onOpenDevLab,
  onGoHome,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [activeStory, setActiveStory] = useState<typeof CULTURAL_STORIES[0] | null>(null);

  const filteredPersonas = personas.filter(p => {
    const matchesSearch = 
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (levelFilter === 'all') return true;
    if (levelFilter === 'A') return p.cefrLevel === 'A1' || p.cefrLevel === 'A2';
    if (levelFilter === 'B') return p.cefrLevel === 'B1' || p.cefrLevel === 'B2';
    if (levelFilter === 'C') return p.cefrLevel === 'C1';
    return true;
  });

  const handlePlayStory = (story: typeof CULTURAL_STORIES[0]) => {
    setActiveStory(story);
    const storyPersona = personas.find(p => p.id === story.personaId);
    speechService.speakItalian(
      `${story.title}. ${story.subtitle}. ${story.snippet}`,
      {
        rate: 0.92,
        gender: storyPersona?.voiceGender || 'female',
        onEnd: () => {
          setTimeout(() => setActiveStory(null), 1000);
        }
      }
    );
  };

  return (
    <aside className={`w-full lg:w-80 xl:w-96 flex flex-col bg-white border-r border-purple-100 h-full shrink-0 select-none ${className}`}>
      
      {/* Italian Flag Tricolore Top Accent */}
      <div className="h-1 w-full flex">
        <span className="w-1/3 bg-emerald-500" />
        <span className="w-1/3 bg-white" />
        <span className="w-1/3 bg-red-500" />
      </div>

      {/* Header Bar */}
      <div className="p-4 border-b border-purple-100/70 bg-[#faf8ff]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onGoHome}
              className="text-xl sm:text-2xl font-friendly font-extrabold tracking-tight text-purple-950 hover:text-purple-700 flex items-center gap-1.5 transition-colors text-left min-w-0"
              title="Torna alla Home"
            >
              <span className="truncate">Parliamo Italiano</span>
              <span className="hidden sm:inline text-[11px] font-sans font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                Italiano AI
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-purple-100/70 hover:bg-purple-200 text-purple-800 transition-colors"
                title="Back to Home"
              >
                Home
              </button>
            )}

            {/* Learning Streak with Tricolore friendly badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-purple-200 text-xs text-purple-700 font-bold shadow-2xs" title="5-day streak" role="img" aria-label="5-day learning streak">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="font-mono-data">5d</span>
            </div>

            {/* Dev Lab button */}
            <button
              onClick={onOpenDevLab}
              className="p-1.5 rounded-xl bg-purple-100/70 hover:bg-purple-200 text-purple-700 transition-colors"
              title="Voice Lab & Parameters"
              aria-label="Open Voice Lab settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutor, city, or topic..."
            aria-label="Search tutors by name, city, or topic"
            className="w-full bg-white border border-purple-200/80 rounded-2xl pl-9 pr-3 py-2 text-xs text-purple-950 placeholder-purple-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Cultural Audio Stories Bar */}
      <div className="py-3 px-3 border-b border-purple-100/60 bg-[#fdfbff]">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Cultural Espresso</span>
          </span>
          <span className="text-[10px] text-purple-400">Audio snippets</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {CULTURAL_STORIES.map(story => {
            const persona = personas.find(p => p.id === story.personaId);
            const isPlaying = activeStory?.id === story.id;
            return (
              <button
                key={story.id}
                onClick={() => handlePlayStory(story)}
                aria-label={`Play audio story: ${story.title}`}
                aria-pressed={isPlaying}
                className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
              >
                <div className={`relative p-0.5 rounded-2xl transition-all ${
                  isPlaying 
                    ? 'ring-2 ring-purple-600 ring-offset-2' 
                    : 'bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-emerald-500'
                }`}>
                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white p-0.5 flex items-center justify-center">
                    {persona && (
                      <PersonaBadge
                        persona={persona}
                        size="sm"
                        speakingState={isPlaying ? 'speaking' : 'idle'}
                        showTricolore={false}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  {isPlaying && (
                    <span className="absolute inset-0 flex items-center justify-center bg-purple-950/40 rounded-2xl">
                      <Play className="w-4 h-4 fill-white text-white animate-pulse" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-purple-900 font-semibold max-w-[62px] truncate text-center">
                  {story.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CEFR Level Filters */}
      <div className="px-3 py-2 border-b border-purple-100/60 flex items-center gap-1 bg-white overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All' },
          { id: 'A', label: 'A1-A2 Beginner' },
          { id: 'B', label: 'B1-B2 Intermediate' },
          { id: 'C', label: 'C1 Advanced' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setLevelFilter(filter.id)}
            aria-pressed={levelFilter === filter.id}
            className={`px-3 py-1 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              levelFilter === filter.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700/70 hover:text-purple-950 hover:bg-purple-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Contacts List */}
      <ul className="flex-1 overflow-y-auto divide-y divide-purple-100/50" aria-label="Tutors">
        {filteredPersonas.map(persona => {
          const isSelected = selectedPersona.id === persona.id;

          return (
            <li
              key={persona.id}
              className={`pr-3.5 transition-all flex items-center gap-2 relative group ${
                isSelected
                  ? 'bg-purple-50/90 border-l-4 border-purple-600'
                  : 'hover:bg-purple-50/40'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectPersona(persona)}
                aria-current={isSelected ? 'true' : undefined}
                className="flex-1 min-w-0 flex items-center gap-3 p-3.5 pr-0 text-left cursor-pointer focus-visible:outline-offset-[-2px]"
              >
                <PersonaBadge
                  persona={persona}
                  size="md"
                  speakingState={isSelected ? 'idle' : 'idle'}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-xs text-purple-950 truncate font-friendly">
                        {persona.fullName}
                      </span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-full font-mono font-bold">
                        {persona.cefrLevel}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono-data shrink-0">
                      {persona.lastMessageTime}
                    </span>
                  </div>

                  <div className="text-[11px] text-purple-600/80 truncate flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-purple-500" />
                    <span>{persona.city}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{persona.role}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {persona.lastMessageSnippet}
                  </p>
                </div>
              </button>

              {/* ONLY Video Call Button: always visible on touch screens, revealed on hover/focus with a pointer */}
              <div className="flex items-center transition-opacity shrink-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-within:opacity-100">
                <button
                  onClick={() => onStartVideoCall(persona)}
                  aria-label={`Start video call with ${persona.fullName}`}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                  title={`Start Video Call with ${persona.name}`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Video Call</span>
                </button>
              </div>
            </li>
          );
        })}

        {filteredPersonas.length === 0 && (
          <li className="p-8 text-center text-xs text-purple-600" role="status">
            No tutors match your search or level filter.
          </li>
        )}
      </ul>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-purple-100 bg-[#faf8ff] text-xs">
        <div className="text-[11px] font-semibold text-purple-900 truncate">
          &ldquo;{selectedPersona.nativeSaying}&rdquo;
        </div>
        <div className="text-[10px] text-purple-500 italic truncate mt-0.5">
          {selectedPersona.nativeSayingTranslation}
        </div>
      </div>

    </aside>
  );
};
