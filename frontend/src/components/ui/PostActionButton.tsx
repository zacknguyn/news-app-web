import React from 'react';
import { cn } from '../../lib/utils';

type PostActionButtonProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  title?: string;
};

export const PostActionButton: React.FC<PostActionButtonProps> = ({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  className,
  ariaLabel,
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-pressed={active || undefined}
    title={title}
    className={cn(
      'inline-flex min-h-11 select-none items-center gap-2 border bg-transparent px-3 font-mono text-xs uppercase leading-none tracking-wider transition-colors duration-150',
      active
        ? 'border-app-action bg-app-action text-app-on-action hover:bg-app-action-hover'
        : 'border-app-border text-app-heading hover:border-app-action hover:text-app-action',
      disabled && 'cursor-not-allowed opacity-40 hover:border-app-border hover:bg-transparent hover:text-app-heading',
      className,
    )}
  >
    <span
      className={cn(
        'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center transition-colors duration-150',
        active ? 'text-app-on-action' : 'text-current',
      )}
      aria-hidden="true"
    >
      {icon}
    </span>
    <span className="inline-flex items-baseline gap-1.5">{label}</span>
  </button>
);
