import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Volume2, 
  Phone, 
  Video, 
  BookOpen, 
  Sparkles,
  Quote
} from 'lucide-react';
import { Persona } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { speechService } from '../utils/speech';

interface PersonaProfileModalProps {
  persona: Persona;
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (mode: 'audio' | 'video') => void;
}

export const PersonaProfileModal: React.FC<PersonaProfileModalProps> = ({
  persona,
  isOpen,
  onClose,
  onStartCall
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header with Italian Red Accent */}
        <div className="relative p-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-start justify-between">
          <div className="flex items-center gap-4">
            <PersonaBadge
              persona={persona}
              size="lg"
              speakingState={isPlayingAudio ? 'speaking' : 'idle'}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight font-editorial">{persona.fullName}</h3>
                <span className="text-xs bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-mono font-semibold">
                  {persona.cefrLevel}
                </span>
              </div>
              <p className="text-sm text-red-100">{persona.role}</p>
              <div className="flex items-center gap-1.5 text-xs text-red-100/90 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{persona.city}, {persona.region}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-700 text-xs sm:text-sm">
          
          {/* Native Saying Card */}
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 relative">
            <Quote className="w-5 h-5 text-red-300 absolute top-3 right-3" />
            <div className="text-[11px] uppercase tracking-wider text-red-700 font-bold mb-1">
              Motto & Filosofia
            </div>
            <p className="text-base font-editorial italic text-slate-900">
              &ldquo;{persona.nativeSaying}&rdquo;
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {persona.nativeSayingTranslation}
            </p>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-red-600" />
              <span>Chi Sono</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {persona.bio}
            </p>
          </div>

          {/* Dialect and Style */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Stile Linguistico & Dialetto</span>
            </div>
            <p className="text-xs text-slate-600">
              {persona.dialectSpecialty}
            </p>
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Argomenti di Conversazione
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {persona.topics.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 text-slate-700 border border-slate-200 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Voice sample */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-900">Voce AI Assegnata</div>
              <div className="text-[11px] text-slate-500 font-mono-data">{persona.voiceId} (Gemini 3.8 Server)</div>
            </div>
            <button
              onClick={handlePlayVoiceSample}
              disabled={isPlayingAudio}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-xs disabled:opacity-60"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudio ? 'In riproduzione...' : 'Ascolta Voce'}</span>
            </button>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 bg-stone-50 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              onStartCall('audio');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-transform active:scale-95 shadow-xs"
          >
            <Phone className="w-4 h-4" />
            <span>Chiama (Audio)</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onStartCall('video');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-slate-800 font-semibold text-xs transition-transform active:scale-95"
          >
            <Video className="w-4 h-4 text-red-600" />
            <span>Videochiamata</span>
          </button>
        </div>

      </div>
    </div>
  );
};
