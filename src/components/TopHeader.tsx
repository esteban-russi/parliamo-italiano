import React from 'react';
import { NotebookText } from 'lucide-react';
import { Persona } from '../types';
import { UserBadge } from './UserBadge';

interface TopHeaderProps {
  persona: Persona;
  learnerInitial: string;
  mode: 'text' | 'voice';
  onSelectVoice: () => void;
  onOpenNotebook: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  persona,
  learnerInitial,
  mode,
  onSelectVoice,
  onOpenNotebook
}) => (
  <header className="h-16 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-6 bg-canvas">
    <span className="font-serif text-[26px] leading-none font-semibold tracking-tight text-cobalt">
      Parliamo
    </span>

    <h1 className="hidden sm:block font-serif text-lg font-semibold text-ink whitespace-nowrap">
      {persona.name} <span aria-hidden="true">·</span>
      <span className="sr-only">in</span> {persona.city}
    </h1>

    <div className="col-start-3 flex items-center justify-end gap-2 sm:gap-4">
      <div role="group" aria-label="Conversation mode" className="flex items-center p-1 rounded-full bg-surface border border-line shadow-soft">
        <button
          type="button"
          aria-pressed={mode === 'text'}
          className={`px-4 sm:px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === 'text' ? 'bg-cobalt text-canvas' : 'text-ink hover:bg-cobalt-tint'
          }`}
        >
          Text
        </button>
        <button
          type="button"
          aria-pressed={mode === 'voice'}
          onClick={onSelectVoice}
          className={`px-4 sm:px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === 'voice' ? 'bg-cobalt text-canvas' : 'text-ink hover:bg-cobalt-tint'
          }`}
        >
          Voice
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenNotebook}
        aria-label="Open notebook"
        title="Notebook"
        className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center border border-line bg-surface text-ink hover:bg-cobalt-tint transition-colors"
      >
        <NotebookText className="w-[18px] h-[18px]" />
      </button>

      <UserBadge initial={learnerInitial} />
    </div>
  </header>
);
