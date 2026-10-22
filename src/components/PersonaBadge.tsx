import React from 'react';
import { Persona, CharacterSpeakingState } from '../types';

interface PersonaBadgeProps {
  persona: Persona;
  size?: 'sm' | 'md' | 'lg' | 'call';
  speakingState?: CharacterSpeakingState;
  className?: string;
}

export const PersonaBadge: React.FC<PersonaBadgeProps> = ({
  persona,
  size = 'md',
  speakingState = 'idle',
  className = ''
}) => {
  const isSpeaking = speakingState === 'speaking';
  const isListening = speakingState === 'listening';
  const isThinking = speakingState === 'thinking';

  // Extract initials
  const initials = persona.fullName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs font-semibold',
    md: 'w-12 h-12 text-sm font-bold',
    lg: 'w-16 h-16 text-lg font-bold',
    call: 'w-44 h-44 sm:w-52 sm:h-52 text-4xl sm:text-5xl font-bold'
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      {/* Outer Audio Pulse Rings when speaking or listening in Call */}
      {isSpeaking && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          <span className="absolute -inset-3 rounded-full border-2 border-red-500/30 animate-pulse" />
        </>
      )}
      {isListening && (
        <span className="absolute -inset-2 rounded-full border-2 border-dashed border-red-400 animate-spin" style={{ animationDuration: '6s' }} />
      )}
      {isThinking && (
        <span className="absolute -inset-2 rounded-full border-2 border-amber-400 animate-pulse" />
      )}

      {/* Clean Monogram Circle Container with Italian Red & Stone Accents */}
      <div className={`w-full h-full rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center shadow-sm border border-red-100 ${
        isSpeaking 
          ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-red-200' 
          : 'bg-stone-50 hover:bg-stone-100 text-slate-800'
      } transition-colors select-none relative overflow-hidden`}>
        
        {/* Subtle background monogram watermark */}
        <span className="absolute text-[80px] font-black text-red-950/5 pointer-events-none select-none">
          {persona.city[0]}
        </span>

        {/* Initials */}
        <span className={`relative tracking-tight font-editorial ${isSpeaking ? 'text-white' : 'text-slate-900'}`}>
          {initials}
        </span>

        {/* Small City Pill on Large Badges */}
        {size === 'call' && (
          <span className={`relative text-xs tracking-widest uppercase mt-2 font-sans font-medium px-2.5 py-0.5 rounded-full ${
            isSpeaking ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700'
          }`}>
            {persona.city}
          </span>
        )}
      </div>

      {/* Online indicator for small/medium */}
      {size !== 'call' && persona.isOnline && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
          title="Disponibile per conversazione"
        />
      )}
    </div>
  );
};
