import React from 'react';
import { Persona, CharacterSpeakingState } from '../types';

interface PersonaBadgeProps {
  persona: Persona;
  size?: 'sm' | 'md' | 'lg' | 'call';
  speakingState?: CharacterSpeakingState;
  className?: string;
  showTricolore?: boolean;
}

export const PersonaBadge: React.FC<PersonaBadgeProps> = ({
  persona,
  size = 'md',
  speakingState = 'idle',
  className = '',
  showTricolore = true
}) => {
  const isSpeaking = speakingState === 'speaking';
  const isListening = speakingState === 'listening';
  const isThinking = speakingState === 'thinking';

  const initials = persona.fullName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs font-bold rounded-2xl',
    md: 'w-12 h-12 text-sm font-bold rounded-2xl',
    lg: 'w-16 h-16 text-lg font-bold rounded-3xl',
    call: 'w-40 h-40 sm:w-48 sm:h-48 text-4xl sm:text-5xl font-extrabold rounded-[36px]'
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      {/* Outer audio pulse rings when speaking */}
      {isSpeaking && (
        <>
          <span className="absolute inset-0 rounded-[inherit] bg-purple-500/25 animate-ping" />
          <span className="absolute -inset-2.5 rounded-[inherit] border-2 border-purple-400/40 animate-pulse" />
        </>
      )}
      {isListening && (
        <span className="absolute -inset-2 rounded-[inherit] border-2 border-dashed border-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
      )}
      {isThinking && (
        <span className="absolute -inset-2 rounded-[inherit] border-2 border-amber-400 animate-pulse" />
      )}

      {/* Smooth Purple Container */}
      <div className={`w-full h-full rounded-[inherit] flex flex-col items-center justify-center shadow-sm transition-all duration-300 relative overflow-hidden select-none ${
        isSpeaking 
          ? 'bg-gradient-to-tr from-purple-700 via-violet-600 to-fuchsia-600 text-white shadow-purple-300/50 shadow-md' 
          : 'bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100/70 border border-purple-200/80 text-purple-950 hover:shadow-xs'
      }`}>
        
        {/* Soft background watermark letter */}
        <span className="absolute text-[75px] font-black text-purple-900/5 pointer-events-none select-none">
          {persona.city[0]}
        </span>

        {/* Initials */}
        <span className={`relative tracking-tight font-friendly ${isSpeaking ? 'text-white' : 'text-purple-900'}`}>
          {initials}
        </span>

        {/* City tag on call view */}
        {size === 'call' && (
          <span className={`relative text-xs tracking-wider uppercase mt-2 font-medium px-3 py-0.5 rounded-full ${
            isSpeaking ? 'bg-white/20 text-white' : 'bg-purple-200/70 text-purple-900'
          }`}>
            {persona.city}
          </span>
        )}

        {/* Italian Flag Tricolore Mini Badge */}
        {showTricolore && size !== 'sm' && (
          <div 
            className="absolute top-1.5 right-1.5 flex h-1.5 w-4 rounded-full overflow-hidden shadow-xs border border-white/60"
            title="Bandiera Italiana (Verde, Bianco, Rosso)"
          >
            <span className="w-1/3 bg-emerald-500" />
            <span className="w-1/3 bg-white" />
            <span className="w-1/3 bg-red-500" />
          </div>
        )}
      </div>

      {/* Online indicator */}
      {size !== 'call' && persona.isOnline && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
          title="Online su Parlami"
        />
      )}
    </div>
  );
};
