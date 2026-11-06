import React from 'react';
import { AudioLines, CalendarDays, NotebookPen, X } from 'lucide-react';
import { GrammarNote, Persona, SavedPhrase } from '../types';

interface UtilityPanelProps {
  persona: Persona;
  /** Most recent grammar note from the tutor, highlighted in the notebook. */
  grammarHighlight: GrammarNote | null;
  savedPhrases: SavedPhrase[];
  /** Share of the conversation spoken by the learner, 0–100. */
  talkingShare: number;
  onSwitchToVoice: () => void;
  onOpenProfile: () => void;
  onRemovePhrase: (id: string) => void;
  /** Present when the panel is shown as a drawer on small screens. */
  onClose?: () => void;
  notebookHeadingRef?: React.Ref<HTMLHeadingElement>;
}

export const UtilityPanel: React.FC<UtilityPanelProps> = ({
  persona,
  grammarHighlight,
  savedPhrases,
  talkingShare,
  onSwitchToVoice,
  onOpenProfile,
  onRemovePhrase,
  onClose,
  notebookHeadingRef
}) => (
  <aside
    aria-label="Tutor and notebook"
    className="h-full w-full flex flex-col bg-surface border border-line rounded-[24px] shadow-soft overflow-hidden"
  >
    <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-4">
      {/* Compact character profile */}
      <section aria-label={`About ${persona.name}`}>
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={`View ${persona.fullName}'s profile`}
            className="shrink-0 rounded-2xl"
          >
            <img
              src={persona.avatar.idle}
              alt=""
              className="w-14 h-16 rounded-2xl object-cover object-top bg-[#fbf3e6]"
            />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-lg leading-tight text-ink">{persona.fullName}</h2>
            <p className="text-[13px] text-ink-muted mt-0.5">
              {persona.role} · {persona.city}
            </p>
            <p className="mt-2 pt-2 border-t border-line flex items-center gap-1.5 text-[13px] text-ink">
              <CalendarDays className="w-4 h-4 text-ink-soft shrink-0" aria-hidden="true" />
              <span>Today: {persona.dailyContext}</span>
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notebook"
              className="-mr-1 -mt-1 w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-ink-muted hover:bg-cobalt-tint hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onSwitchToVoice}
          className="mt-4 w-full h-11 rounded-full border-[1.5px] border-cobalt text-cobalt hover:bg-cobalt-tint flex items-center justify-center gap-2 text-[15px] font-medium transition-colors"
        >
          <AudioLines className="w-5 h-5" aria-hidden="true" />
          Switch to voice
        </button>
      </section>

      <hr className="my-5 border-line" />

      {/* Notebook */}
      <section aria-labelledby="notebook-heading">
        <div className="flex items-center justify-between">
          <h2
            id="notebook-heading"
            ref={notebookHeadingRef}
            tabIndex={-1}
            className="text-[13px] font-semibold tracking-[0.08em] text-ink focus:outline-none"
          >
            NOTEBOOK
          </h2>
          <span className="w-8 h-8 rounded-xl bg-mint-tint text-mint-strong flex items-center justify-center" aria-hidden="true">
            <NotebookPen className="w-4 h-4" />
          </span>
        </div>

        {grammarHighlight ? (
          <div className="mt-3 p-4 rounded-[20px] bg-mint-tint border border-mint">
            <p className="font-serif text-lg leading-snug text-ink">{grammarHighlight.wordOrPhrase}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{grammarHighlight.explanation}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">Grammar tips from {persona.name} will appear here.</p>
        )}

        <hr className="my-5 border-line" />

        <h3 className="font-serif text-lg text-ink">Saved phrases</h3>
        {savedPhrases.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {savedPhrases.map((phrase) => (
              <li
                key={phrase.id}
                className="group relative pl-4 pr-10 py-3 rounded-[18px] bg-coral-tint border border-coral/15"
              >
                <p className="font-serif text-[15px] font-semibold text-ink">{phrase.it}</p>
                {phrase.en && <p className="text-xs text-ink-muted mt-0.5">{phrase.en}</p>}
                <button
                  type="button"
                  onClick={() => onRemovePhrase(phrase.id)}
                  aria-label={`Remove "${phrase.it}" from saved phrases`}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-coral-strong opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-coral/10 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Tap Save on any message to keep a phrase here.</p>
        )}
      </section>
    </div>

    {/* Talking share */}
    <div className="shrink-0 px-5 py-4 border-t border-line">
      <div className="h-2 rounded-full bg-line overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-mint transition-[width] duration-500" style={{ width: `${talkingShare}%` }} />
      </div>
      <p className="mt-2.5 text-[13px] text-ink">You did {talkingShare}% of the talking today</p>
    </div>
  </aside>
);
