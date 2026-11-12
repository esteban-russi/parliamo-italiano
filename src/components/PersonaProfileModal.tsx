import React, { useRef, useState } from 'react';
import { 
  X, 
  MapPin, 
  Volume2, 
  AudioLines, 
  BookOpen, 
  Sparkles, 
  Quote
} from 'lucide-react';
import { Persona } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { speechService } from '../utils/speech';
import { useDialog } from '../hooks/useDialog';

interface PersonaProfileModalProps {
  persona: Persona;
  isOpen: boolean;
  onClose: () => void;
  onStartVideoCall: () => void;
}

export const PersonaProfileModal: React.FC<PersonaProfileModalProps> = ({
  persona,
  isOpen,
  onClose,
  onStartVideoCall
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  const handlePlayVoiceSample = async () => {
    setIsPlayingAudio(true);
    await speechService.speakSmart(persona.sampleAudioText, {
      provider: 'gemini_live',
      voiceName: persona.voiceId,
      gender: persona.voiceGender,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-profile-title"
        tabIndex={-1}
        className="w-full max-w-lg bg-surface border border-line rounded-[24px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] focus:outline-none"
      >

        {/* Header */}
        <div className="relative p-6 bg-cobalt-tint text-ink flex items-start justify-between">
          <div className="flex items-center gap-4">
            <PersonaBadge
              persona={persona}
              size="lg"
              speakingState={isPlayingAudio ? 'speaking' : 'idle'}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 id="persona-profile-title" className="font-serif text-2xl leading-tight">{persona.fullName}</h3>
                <span className="text-xs bg-cobalt text-canvas px-2.5 py-0.5 rounded-full font-semibold">
                  {persona.cefrLevel}
                </span>
              </div>
              <p className="text-sm text-ink-muted">{persona.role}</p>
              <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{persona.city}, {persona.region}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-surface hover:bg-canvas text-ink border border-line transition-colors"
            aria-label="Close profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-ink text-xs sm:text-sm">
          
          {/* Native Saying Card */}
          <div className="p-4 rounded-2xl bg-cobalt-tint border border-line relative">
            <Quote className="w-5 h-5 text-cobalt absolute top-3 right-3" aria-hidden="true" />
            <div className="text-[11px] uppercase tracking-wider text-cobalt font-bold mb-1">
              Motto & Philosophy
            </div>
            <p className="font-serif text-lg italic text-ink">
              &ldquo;{persona.nativeSaying}&rdquo;
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {persona.nativeSayingTranslation}
            </p>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cobalt" />
              <span>About Me</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {persona.bio}
            </p>
          </div>

          {/* Dialect and Style */}
          <div className="p-3.5 rounded-2xl bg-cobalt-tint border border-line">
            <div className="text-[11px] font-bold text-ink uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cobalt" />
              <span>Linguistic Style & Regional Nuance</span>
            </div>
            <p className="text-xs text-slate-700">
              {persona.dialectSpecialty}
            </p>
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-2">
              Conversation Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {persona.topics.map((t, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-coral-tint text-ink border border-coral/20 text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Voice sample */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cobalt-tint border border-line">
            <div>
              <div className="text-xs font-bold text-ink">Assigned AI Voice</div>
              <div className="text-[11px] text-cobalt font-mono-data">{persona.voiceId} (Gemini Native Audio)</div>
            </div>
            <button
              onClick={handlePlayVoiceSample}
              disabled={isPlayingAudio}
              className="px-3.5 py-1.5 rounded-full bg-cobalt hover:bg-cobalt-strong text-white flex items-center gap-1.5 text-xs font-bold transition-colors shadow-xs disabled:opacity-60"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span aria-live="polite">{isPlayingAudio ? 'Playing voice...' : 'Listen to Voice'}</span>
            </button>
          </div>

        </div>

        {/* Modal Actions (Only Video Call button, standard audio call removed) */}
        <div className="p-4 border-t border-line bg-canvas flex items-center justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              onStartVideoCall();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-cobalt hover:bg-cobalt-strong text-white font-bold text-xs transition-transform active:scale-95 "
          >
            <AudioLines className="w-4 h-4" />
            <span>Start voice call</span>
          </button>
        </div>

      </div>
    </div>
  );
};
