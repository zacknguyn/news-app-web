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
    'coarse-touch-target inline-flex items-center justify-center rounded text-[var(--color-vote-muted)] transition-colors hover:bg-[var(--color-vote-hover)]',
    compact ? 'min-h-11 min-w-11 p-0.5 sm:min-h-6 sm:min-w-6' : 'min-h-11 min-w-11 p-1 sm:min-h-7 sm:min-w-7'
  );

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        isHorizontal ? 'border border-[var(--color-vote-border)] bg-[var(--color-vote-surface)] px-2 py-1 text-[var(--color-comment-ink)]' : 'min-w-[34px] flex-col gap-0.5 pt-0.5'
      )}
    >
      <Tooltip label="Upvote" side={isHorizontal ? 'top' : 'bottom'}>
        <button
          type="button"
          aria-label={`Upvote ${label}`}
          aria-pressed={vote === 'up'}
          onClick={() => onVote?.('up')}
          className={cn(buttonClass, vote === 'up' && 'bg-[var(--color-vote-up-surface)] text-[var(--color-vote-up)]')}
        >
          <ArrowBigUp className="h-5 w-5" />
        </button>
      </Tooltip>
      <span className={cn('text-center font-mono font-bold', isHorizontal ? 'min-w-8 text-sm' : 'text-xs')}>
        {score}
      </span>
      <Tooltip label="Downvote" side={isHorizontal ? 'top' : 'bottom'}>
        <button
          type="button"
          aria-label={`Downvote ${label}`}
          aria-pressed={vote === 'down'}
          onClick={() => onVote?.('down')}
          className={cn(buttonClass, vote === 'down' && 'bg-[var(--color-vote-down-surface)] text-[var(--color-vote-down)]')}
        >
          <ArrowBigDown className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
};
