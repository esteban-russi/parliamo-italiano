import React, { useState } from 'react';
import { ArrowRight, Check, MapPin, Sparkles } from 'lucide-react';
import { CefrLevel, LearnerProfile, Persona } from '../types';
import { CEFR_LEVEL_OPTIONS, TUTORS } from '../data/personas';
import { UserBadge } from './UserBadge';

interface OnboardingPageProps {
  initialProfile?: LearnerProfile | null;
  onComplete: (profile: LearnerProfile) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  initialProfile,
  onComplete
}) => {
  const [name, setName] = useState<string>(initialProfile?.name ?? '');
  const [level, setLevel] = useState<CefrLevel>(initialProfile?.level ?? 'A2');
  const [selectedTutorId, setSelectedTutorId] = useState<string>(
    initialProfile?.personaId ?? TUTORS[0].id
  );

  const trimmedName = name.trim();
  const learnerInitial = (trimmedName.charAt(0) || '?').toUpperCase();
  const selectedTutor: Persona =
    TUTORS.find((t) => t.id === selectedTutorId) ?? TUTORS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName) return;
    onComplete({
      name: trimmedName,
      level,
      personaId: selectedTutor.id
    });
  };

  return (
    <div className="min-h-dvh w-full bg-canvas text-ink flex flex-col">
      {/* Top branding bar */}
      <header className="h-16 shrink-0 flex items-center justify-between px-5 sm:px-8 border-b border-line bg-canvas">
        <span className="font-serif text-[26px] leading-none font-semibold tracking-tight text-cobalt">
          Parliamo
        </span>
        <span className="text-xs font-medium tracking-[0.08em] uppercase text-ink-muted">
          Conversational Italian
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 sm:py-12">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto space-y-8"
          aria-label="Learner onboarding"
        >
          {/* Intro header */}
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cobalt-tint text-cobalt text-xs font-semibold tracking-[0.06em] uppercase">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Benvenuto
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
              Set up your Italian practice
            </h1>
            <p className="text-base text-ink-muted">
              Tell us your name, choose your Italian level so the conversation vocabulary adapts to you, and pick your tutor.
            </p>
          </div>

          {/* Step 1: Name */}
          <section
            aria-labelledby="onboarding-name-heading"
            className="p-5 sm:p-6 rounded-[24px] bg-surface border border-line shadow-soft space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold tracking-[0.08em] uppercase text-cobalt">
                  Step 1
                </span>
                <h2 id="onboarding-name-heading" className="font-serif text-xl text-ink mt-0.5">
                  Come ti chiami? · What is your name?
                </h2>
              </div>
              <UserBadge initial={learnerInitial} />
            </div>

            <div>
              <label htmlFor="learner-name-input" className="sr-only">
                Your name
              </label>
              <input
                id="learner-name-input"
                type="text"
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type your first name (e.g. Marco, Giulia)…"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-canvas border-[1.5px] border-line text-base text-ink placeholder:text-ink/40 focus:outline-none focus:border-cobalt transition-colors"
              />
            </div>
          </section>

          {/* Step 2: Level selection */}
          <section
            aria-labelledby="onboarding-level-heading"
            className="p-5 sm:p-6 rounded-[24px] bg-surface border border-line shadow-soft space-y-4"
          >
            <div>
              <span className="text-xs font-semibold tracking-[0.08em] uppercase text-cobalt">
                Step 2
              </span>
              <h2 id="onboarding-level-heading" className="font-serif text-xl text-ink mt-0.5">
                Pick your Italian level
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Your tutor adapts vocabulary richness, idioms, and sentence complexity to match your level.
              </p>
            </div>

            <div
              role="radiogroup"
              aria-labelledby="onboarding-level-heading"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {CEFR_LEVEL_OPTIONS.map((option) => {
                const isSelected = level === option.level;
                return (
                  <button
                    key={option.level}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setLevel(option.level)}
                    className={`text-left p-4 rounded-[20px] border-[1.5px] transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-cobalt-tint border-cobalt shadow-soft'
                        : 'bg-canvas border-line hover:border-cobalt/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono-data ${
                            isSelected
                              ? 'bg-cobalt text-canvas'
                              : 'bg-surface border border-line text-ink'
                          }`}
                        >
                          {option.level}
                        </span>
                        <span className="font-serif text-base font-semibold text-ink">
                          {option.title}
                        </span>
                      </div>
                      {isSelected && (
                        <span
                          className="w-5 h-5 rounded-full bg-cobalt text-canvas flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-ink-soft">
                      {option.vocabularyHint}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 3: Tutor selection */}
          <section
            aria-labelledby="onboarding-tutor-heading"
            className="p-5 sm:p-6 rounded-[24px] bg-surface border border-line shadow-soft space-y-4"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-xs font-semibold tracking-[0.08em] uppercase text-cobalt">
                  Step 3
                </span>
                <h2 id="onboarding-tutor-heading" className="font-serif text-xl text-ink mt-0.5">
                  Choose your tutor
                </h2>
              </div>
              <span className="text-xs text-ink-muted">
                More regional tutors coming soon
              </span>
            </div>

            <div
              role="radiogroup"
              aria-labelledby="onboarding-tutor-heading"
              className="grid grid-cols-1 gap-3"
            >
              {TUTORS.map((tutor) => {
                const isSelected = selectedTutor.id === tutor.id;
                return (
                  <button
                    key={tutor.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedTutorId(tutor.id)}
                    className={`w-full text-left p-4 sm:p-5 rounded-[20px] border-[1.5px] transition-all flex flex-col sm:flex-row items-start gap-4 ${
                      isSelected
                        ? 'bg-cobalt-tint/60 border-cobalt shadow-soft'
                        : 'bg-canvas border-line hover:border-cobalt/40'
                    }`}
                  >
                    <img
                      src={tutor.avatar.idle}
                      alt=""
                      className="w-16 h-20 rounded-2xl object-cover object-top bg-[#fbf3e6] shrink-0 ring-2 ring-cobalt"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-serif text-xl font-semibold text-ink">
                            {tutor.fullName}
                          </h3>
                          <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-coral shrink-0" aria-hidden="true" />
                            <span>
                              {tutor.role} · {tutor.city}, {tutor.region}
                            </span>
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-mint-tint border border-mint text-ink text-xs font-medium">
                          <Check className="w-3.5 h-3.5 text-mint-strong" aria-hidden="true" />
                          Selected
                        </span>
                      </div>

                      <p className="text-sm text-ink-soft leading-relaxed">
                        {tutor.bio}
                      </p>

                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {tutor.topics.map((topic) => (
                          <span
                            key={topic}
                            className="px-2.5 py-0.5 rounded-full bg-surface border border-line text-xs text-ink-muted"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Submit CTA */}
          <div className="flex items-center justify-end pt-2 pb-6">
            <button
              type="submit"
              disabled={!trimmedName}
              className="w-full sm:w-auto h-13 px-8 rounded-full bg-cobalt hover:bg-cobalt-strong text-canvas text-base font-medium flex items-center justify-center gap-2 shadow-soft transition-colors disabled:opacity-50 disabled:hover:bg-cobalt"
            >
              <span>Inizia a parlare with {selectedTutor.name}</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
