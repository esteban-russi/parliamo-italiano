import React from 'react';
import { Home, NotebookText, Settings } from 'lucide-react';
import { UserBadge } from './UserBadge';

interface IconRailProps {
  learnerInitial: string;
  onOpenNotebook: () => void;
  onOpenVoiceLab: () => void;
}

const railButton =
  'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors text-ink-faint hover:text-ink hover:bg-cobalt-tint';

/** 72px navigation rail on the left edge (md and up). */
export const IconRail: React.FC<IconRailProps> = ({ learnerInitial, onOpenNotebook, onOpenVoiceLab }) => (
  <nav
    aria-label="Main"
    className="hidden md:flex w-[72px] shrink-0 flex-col items-center gap-3 py-5 bg-surface border-r border-line"
  >
    <a
      href="#chat"
      aria-current="page"
      aria-label="Conversation"
      title="Conversation"
      className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cobalt text-canvas shadow-soft"
    >
      <Home className="w-5 h-5" />
    </a>
    <button type="button" onClick={onOpenNotebook} className={railButton} aria-label="Notebook" title="Notebook">
      <NotebookText className="w-5 h-5" />
    </button>
    <button type="button" onClick={onOpenVoiceLab} className={railButton} aria-label="Voice Lab settings" title="Voice Lab settings">
      <Settings className="w-5 h-5" />
    </button>

    <UserBadge initial={learnerInitial} className="mt-auto" />
  </nav>
);
