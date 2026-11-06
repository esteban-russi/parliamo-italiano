import React from 'react';
import { Persona, CharacterSpeakingState } from '../types';

interface PersonaBadgeProps {
  persona: Persona;
  size?: 'sm' | 'md' | 'lg' | 'call';
  speakingState?: CharacterSpeakingState;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<PersonaBadgeProps['size']>, string> = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  call: 'w-44 h-44 sm:w-52 sm:h-52'
};

/** Circular tutor portrait that swaps to the speaking expression and shows a state ring. */
export const PersonaBadge: React.FC<PersonaBadgeProps> = ({
  persona,
  size = 'md',
  speakingState = 'idle',
  className = ''
}) => {
  const isSpeaking = speakingState === 'speaking';
  const isListening = speakingState === 'listening';
  const isThinking = speakingState === 'thinking';
  const isCall = size === 'call';

  const ringClass = isSpeaking
    ? 'ring-cobalt'
    : isListening
      ? 'ring-mint'
      : isThinking
        ? 'ring-cobalt/40'
        : isCall
          ? 'ring-mint'
          : 'ring-cobalt';

  return (
    <div className={`relative shrink-0 ${SIZE_CLASSES[size]} ${className}`}>
      {isSpeaking && (
        <span
          className="absolute -inset-1.5 rounded-full border-2 border-cobalt/30 animate-ping"
          style={{ animationDuration: '1.8s' }}
          aria-hidden="true"
        />
      )}
      {isThinking && (
        <span className="absolute -inset-1.5 rounded-full border-2 border-cobalt/40 animate-pulse" aria-hidden="true" />
      )}
      <img
        src={isSpeaking ? persona.avatar.speaking : persona.avatar.idle}
        alt=""
        draggable={false}
        className={`relative w-full h-full rounded-full object-cover bg-[#fbf3e6] select-none ring-offset-canvas transition-shadow ${
          isCall ? 'ring-[5px] ring-offset-4' : 'ring-2 ring-offset-0'
        } ${ringClass}`}
      />
    </div>
  );
};
