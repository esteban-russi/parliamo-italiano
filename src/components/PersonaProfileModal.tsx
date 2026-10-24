import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Volume2, 
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
  onStartVideoCall: () => void;
}

export const PersonaProfileModal: React.FC<PersonaProfileModalProps> = ({
  persona,
  isOpen,
  onClose,
  onStartVideoCall
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-purple-200 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Italian Tricolore Top Accent */}
        <div className="h-1.5 w-full flex">
          <span className="w-1/3 bg-emerald-500" />
          <span className="w-1/3 bg-white" />
          <span className="w-1/3 bg-red-500" />
        </div>

        {/* Header with Smooth Purple & Gradient */}
        <div className="relative p-6 bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-700 text-white flex items-start justify-between">
          <div className="flex items-center gap-4">
            <PersonaBadge
              persona={persona}
              size="lg"
              speakingState={isPlayingAudio ? 'speaking' : 'idle'}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight font-friendly">{persona.fullName}</h3>
                <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {persona.cefrLevel}
                </span>
              </div>
              <p className="text-sm text-purple-200">{persona.role}</p>
              <div className="flex items-center gap-1.5 text-xs text-purple-200/90 mt-1">
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-purple-950 text-xs sm:text-sm">
          
          {/* Native Saying Card */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/70 relative">
            <Quote className="w-5 h-5 text-purple-300 absolute top-3 right-3" />
            <div className="text-[11px] uppercase tracking-wider text-purple-700 font-bold mb-1">
              Motto & Philosophy
            </div>
            <p className="text-base font-friendly italic text-purple-950 font-semibold">
              &ldquo;{persona.nativeSaying}&rdquo;
            </p>
            <p className="text-xs text-purple-700/80 mt-1">
              {persona.nativeSayingTranslation}
            </p>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>About Me</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {persona.bio}
            </p>
          </div>

          {/* Dialect and Style */}
          <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/60">
            <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Linguistic Style & Regional Nuance</span>
            </div>
            <p className="text-xs text-slate-700">
              {persona.dialectSpecialty}
            </p>
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-2">
              Conversation Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {persona.topics.map((t, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Voice sample */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/70">
            <div>
              <div className="text-xs font-bold text-purple-950">Assigned AI Voice</div>
              <div className="text-[11px] text-purple-600 font-mono-data">{persona.voiceId} (Gemini 3.8 Server)</div>
            </div>
            <button
              onClick={handlePlayVoiceSample}
              disabled={isPlayingAudio}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 text-xs font-bold transition-colors shadow-xs disabled:opacity-60"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudio ? 'Playing voice...' : 'Listen to Voice'}</span>
            </button>
          </div>

        </div>

        {/* Modal Actions (Only Video Call button, standard audio call removed) */}
        <div className="p-4 border-t border-purple-100 bg-[#faf8ff] flex items-center justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              onStartVideoCall();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs transition-transform active:scale-95 shadow-md shadow-purple-500/20 font-friendly"
          >
            <Video className="w-4 h-4" />
            <span>Start Video Call</span>
          </button>
        </div>

      </div>
    </div>
  );
};
