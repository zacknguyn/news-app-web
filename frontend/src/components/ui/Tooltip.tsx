import React from 'react';
import { cn } from '../../lib/utils';

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
};

const sideClass: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2',
  bottom: 'top-[calc(100%+8px)] left-1/2 -translate-x-1/2',
  left: 'right-[calc(100%+8px)] top-1/2 -translate-y-1/2',
  right: 'left-[calc(100%+8px)] top-1/2 -translate-y-1/2',
};

export const Tooltip: React.FC<TooltipProps> = ({ label, children, side = 'bottom', className }) => (
  <span className={cn('group/tooltip relative inline-flex', className)}>
    {children}
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-50 hidden whitespace-nowrap bg-app-heading px-2 py-1 font-mono text-[11px] text-app-bg group-hover/tooltip:block group-focus-within/tooltip:block',
        sideClass[side],
      )}
    >
      {label}
    </span>
  </span>
);
