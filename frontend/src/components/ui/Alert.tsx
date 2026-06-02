import React from 'react';
import { cn } from '../../lib/utils';

type AlertTone = 'info' | 'success' | 'warning' | 'error';

type AlertProps = {
  tone?: AlertTone;
  children: React.ReactNode;
  className?: string;
};

const toneClass: Record<AlertTone, string> = {
  info: 'border-[var(--color-app-border)] bg-[var(--color-app-bg)] text-[var(--color-app-ink)]',
  success:
    'border-[var(--color-state-success-border)] bg-[var(--color-state-success-bg)] text-[var(--color-state-success)]',
  warning:
    'border-[var(--color-state-warning-border)] bg-[var(--color-state-warning-bg)] text-[var(--color-state-warning)]',
  error: 'border-[var(--color-state-error-border)] bg-[var(--color-state-error-bg)] text-[var(--color-state-error)]',
};

export const Alert: React.FC<AlertProps> = ({ tone = 'info', children, className }) => (
  <div className={cn('flex items-start gap-3 border px-4 py-3 text-sm leading-6', toneClass[tone], className)}>
    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-current" aria-hidden="true" />
    <div className="min-w-0">{children}</div>
  </div>
);
