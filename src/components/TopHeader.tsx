import React from 'react';
import { NotebookText } from 'lucide-react';
import { CefrLevel, Persona } from '../types';
import { UserBadge } from './UserBadge';

interface TopHeaderProps {
  persona: Persona;
  learnerInitial: string;
  learnerLevel?: CefrLevel;
  mode: 'text' | 'voice';
  onSelectVoice: () => void;
  onOpenNotebook: () => void;
  onEditProfile?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  persona,
  learnerInitial,
  learnerLevel,
  mode,
  onSelectVoice,
  onOpenNotebook,
  onEditProfile
}) => (
  <header className="h-16 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-6 bg-canvas">
    <span className="font-serif text-[26px] leading-none font-semibold tracking-tight text-cobalt">
      Parliamo
    </span>

    <div className="hidden sm:flex items-center gap-2">
      <h1 className="font-serif text-lg font-semibold text-ink whitespace-nowrap">
        {persona.name} <span aria-hidden="true">·</span>
        <span className="sr-only">in</span> {persona.city}
      </h1>
      {learnerLevel && (
        <span
          title={`Italian level ${learnerLevel}`}
          className="px-2.5 py-0.5 rounded-full bg-cobalt-tint text-cobalt text-xs font-semibold font-mono-data"
        >
          {learnerLevel}
        </span>
      )}
    </div>

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

      <UserBadge
        initial={learnerInitial}
        onClick={onEditProfile}
        title="Change name, level, or tutor"
      />
    </div>
  </header>
);
