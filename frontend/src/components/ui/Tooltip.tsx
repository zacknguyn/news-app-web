import React from 'react';
import { cn } from '../../lib/utils';

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
};

export const Tooltip: React.FC<TooltipProps> = ({ label, children, side = 'bottom', className }) => (
  <span className={cn('group/tooltip relative inline-flex', className)}>
    {children}
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-[var(--color-app-ink)] px-2 py-1 text-xs font-medium text-white shadow-[var(--shadow-hex-card)] group-hover/tooltip:block group-focus-within/tooltip:block',
        side === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
      )}
    >
      {label}
    </span>
  </span>
);
