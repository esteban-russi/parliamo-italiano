import React from 'react';

/** Coral circle with the learner's initial. */
export const UserBadge: React.FC<{ initial: string; className?: string }> = ({ initial, className = '' }) => (
  <span
    role="img"
    aria-label={`Your profile (${initial})`}
    className={`w-10 h-10 shrink-0 rounded-full bg-coral text-canvas flex items-center justify-center text-base font-medium select-none ${className}`}
  >
    {initial}
  </span>
);
