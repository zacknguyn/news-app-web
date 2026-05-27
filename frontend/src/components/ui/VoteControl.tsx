import React from 'react';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from './Tooltip';

type VoteControlProps = {
  label: string;
  score: number;
  vote?: 'up' | 'down' | null;
  orientation?: 'vertical' | 'horizontal';
  compact?: boolean;
  onVote?: (vote: 'up' | 'down') => void;
};

export const VoteControl: React.FC<VoteControlProps> = ({
  label,
  score,
  vote,
  orientation = 'vertical',
  compact = false,
  onVote,
}) => {
  const isHorizontal = orientation === 'horizontal';
  const buttonClass = cn(
    'coarse-touch-target inline-flex items-center justify-center rounded transition-colors',
    compact ? 'min-h-11 min-w-11 p-0.5 sm:min-h-6 sm:min-w-6' : 'min-h-11 min-w-11 p-1 sm:min-h-7 sm:min-w-7'
  );

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        isHorizontal ? 'border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-1' : 'min-w-[34px] flex-col gap-0.5'
      )}
    >
      <Tooltip label="Upvote" side={isHorizontal ? 'top' : 'bottom'}>
        <button
          type="button"
          aria-label={`Upvote ${label}`}
          aria-pressed={vote === 'up'}
          onClick={() => onVote?.('up')}
          className={cn(
            buttonClass, 
            vote === 'up' 
              ? 'text-[var(--color-app-action)] bg-[var(--color-brand-red-faint)]' 
              : 'text-[var(--color-app-faint)] hover:text-[var(--color-app-action)] hover:bg-[var(--color-app-surface-alt)]'
          )}
        >
          <ArrowBigUp className="h-5 w-5" />
        </button>
      </Tooltip>
      <span className={cn('text-center font-bold font-mono', isHorizontal ? 'min-w-8 text-sm' : 'text-xs text-[var(--color-app-heading)]')}>
        {score}
      </span>
      <Tooltip label="Downvote" side={isHorizontal ? 'top' : 'bottom'}>
        <button
          type="button"
          aria-label={`Downvote ${label}`}
          aria-pressed={vote === 'down'}
          onClick={() => onVote?.('down')}
          className={cn(
            buttonClass, 
            vote === 'down' 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-[var(--color-app-faint)] hover:text-blue-600 hover:bg-blue-50'
          )}
        >
          <ArrowBigDown className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
};
