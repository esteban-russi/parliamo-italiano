import React, { useState } from 'react';
import { 
  Search, 
  Phone, 
  Video, 
  Flame, 
  Play, 
  Sliders,
  Sparkles,
  MapPin
} from 'lucide-react';
import { Persona } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { CULTURAL_STORIES } from '../data/personas';
import { speechService } from '../utils/speech';

interface SocialSidebarProps {
  personas: Persona[];
  selectedPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  onStartCall: (persona: Persona, mode: 'audio' | 'video') => void;
  onOpenDevLab: () => void;
  className?: string;
}

export const SocialSidebar: React.FC<SocialSidebarProps> = ({
  personas,
  selectedPersona,
  onSelectPersona,
  onStartCall,
  onOpenDevLab,
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
    <aside className={`w-full lg:w-80 xl:w-96 flex flex-col bg-white border-r border-slate-200 h-full shrink-0 select-none ${className}`}>
      
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-editorial font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              Parlami
              <span className="text-[11px] font-sans font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200/60">
                Italiano
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Learning Streak */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-xs text-red-600 font-semibold" title="5 giorni di fila">
              <Flame className="w-3.5 h-3.5 fill-red-600" />
              <span className="font-mono-data">5d</span>
            </div>

            {/* Dev Lab button */}
            <button
              onClick={onOpenDevLab}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-600 hover:text-red-700 transition-colors"
              title="Voice Lab & Parametri Backend"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per nome, città o argomento..."
            className="w-full bg-stone-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Cultural Audio Stories Bar */}
      <div className="py-3 px-3 border-b border-slate-100 bg-stone-50/60">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-red-600" />
            <span>Espresso Culturale</span>
          </span>
          <span className="text-[10px] text-slate-400">Audio pillole</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {CULTURAL_STORIES.map(story => {
            const persona = personas.find(p => p.id === story.personaId);
            const isPlaying = activeStory?.id === story.id;
            return (
              <button
                key={story.id}
                onClick={() => handlePlayStory(story)}
                className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
              >
                <div className={`relative p-0.5 rounded-2xl transition-all ${
                  isPlaying 
                    ? 'ring-2 ring-red-600 ring-offset-2' 
                    : 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500'
                }`}>
                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white p-0.5 flex items-center justify-center">
                    {persona && (
                      <PersonaBadge
                        persona={persona}
                        size="sm"
                        speakingState={isPlaying ? 'speaking' : 'idle'}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  {isPlaying && (
                    <span className="absolute inset-0 flex items-center justify-center bg-red-900/30 rounded-2xl">
                      <Play className="w-4 h-4 fill-white text-white animate-pulse" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-700 font-medium max-w-[62px] truncate text-center">
                  {story.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CEFR Level Filters */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1 bg-white">
        {[
          { id: 'all', label: 'Tutti' },
          { id: 'A', label: 'A1-A2 Base' },
          { id: 'B', label: 'B1-B2 Medio' },
          { id: 'C', label: 'C1 Avanzato' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setLevelFilter(filter.id)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${
              levelFilter === filter.id
                ? 'bg-red-50 text-red-700 border border-red-200 font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-stone-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredPersonas.map(persona => {
          const isSelected = selectedPersona.id === persona.id;

          return (
            <div
              key={persona.id}
              onClick={() => onSelectPersona(persona)}
              className={`p-3 transition-all cursor-pointer flex items-center gap-3 relative group ${
                isSelected
                  ? 'bg-red-50/70 border-l-4 border-red-600'
                  : 'hover:bg-stone-50/80'
              }`}
            >
              {/* Monogram Badge */}
              <PersonaBadge
                persona={persona}
                size="md"
                speakingState={isSelected ? 'idle' : 'idle'}
              />

              {/* Persona Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {persona.fullName}
                    </span>
                    <span className="text-[10px] text-red-700 bg-red-50 px-1 py-0.2 rounded font-mono font-medium">
                      {persona.cefrLevel}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono-data shrink-0">
                    {persona.lastMessageTime}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                  <span>{persona.city}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{persona.role}</span>
                </div>

                <p className="text-[11px] text-slate-600 truncate mt-0.5">
                  {persona.lastMessageSnippet}
                </p>
              </div>

              {/* Direct Call Actions on Hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(persona, 'audio');
                  }}
                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                  title={`Chiama ${persona.name}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(persona, 'video');
                  }}
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 border border-slate-200 transition-colors"
                  title={`Videochiama ${persona.name}`}
                >
                  <Video className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredPersonas.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            Nessun tutor trovato con questi filtri.
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-100 bg-stone-50/50 text-xs">
        <div className="text-[11px] font-medium text-slate-700 truncate">
          &ldquo;{selectedPersona.nativeSaying}&rdquo;
        </div>
        <div className="text-[10px] text-slate-400 italic truncate mt-0.5">
          {selectedPersona.nativeSayingTranslation}
        </div>
      </div>

    </aside>
  );
};
