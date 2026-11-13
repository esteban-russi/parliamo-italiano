import React from 'react';

interface UserBadgeProps {
  initial: string;
  className?: string;
  onClick?: () => void;
  title?: string;
}

/** Coral circle with the learner's initial. */
export const UserBadge: React.FC<UserBadgeProps> = ({
  initial,
  className = '',
  onClick,
  title
}) => {
  const baseClass = `w-10 h-10 shrink-0 rounded-full bg-coral text-canvas flex items-center justify-center text-base font-medium select-none ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || `Edit learner profile (${initial})`}
        aria-label={title || `Edit learner profile (${initial})`}
        className={`${baseClass} hover:bg-coral-strong transition-colors cursor-pointer`}
      >
        {initial}
      </button>
    );
  }

  return (
    <span role="img" aria-label={`Your profile (${initial})`} className={baseClass}>
      {initial}
    </span>
  );
};
