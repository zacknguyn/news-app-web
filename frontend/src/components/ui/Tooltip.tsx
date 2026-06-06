import React from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '../../lib/utils';

type TooltipProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  contentClassName?: string;
};

const sideClass: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2',
  bottom: 'top-[calc(100%+8px)] left-1/2 -translate-x-1/2',
  left: 'right-[calc(100%+8px)] top-1/2 -translate-y-1/2',
  right: 'left-[calc(100%+8px)] top-1/2 -translate-y-1/2',
};

export const Tooltip: React.FC<TooltipProps> = ({ label, children, side = 'bottom', className, contentClassName }) => (
  <span className={cn('group/tooltip relative inline-flex', className)}>
    {children}
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-50 hidden max-w-72 bg-app-heading px-2.5 py-2 text-left font-mono text-[11px] leading-5 text-app-bg shadow-modal group-hover/tooltip:block group-focus-within/tooltip:block',
        sideClass[side],
        contentClassName,
      )}
    >
      {label}
    </span>
  </span>
);

export const HelperTip: React.FC<{
  label: React.ReactNode;
  side?: TooltipProps['side'];
  className?: string;
}> = ({ label, side = 'top', className }) => (
  <Tooltip label={label} side={side} className={className} contentClassName="w-64 normal-case tracking-normal">
    <button
      type="button"
      className="inline-flex h-5 w-5 items-center justify-center text-app-faint transition-colors hover:text-app-action focus:text-app-action focus:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      aria-label="Show helper"
    >
      <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  </Tooltip>
);
