import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

const upActive = 'text-app-action';
const downActive = 'text-app-muted';
const idle = 'text-app-faint hover:text-app-action';
const downIdle = 'text-app-faint hover:text-app-muted';

const arrowClass = 'inline-flex items-center justify-center transition-[color,transform] duration-150 ease-out hover:scale-110 active:scale-90';

const VoteControlInner: React.FC<VoteControlProps> = ({
  label,
  score,
  vote,
  orientation = 'vertical',
  compact = false,
  onVote,
}) => {
  const isHorizontal = orientation === 'horizontal';
  const size = 'h-11 w-11';
  const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  if (isHorizontal) {
    return (
      <div className="inline-flex items-center font-mono h-11 gap-0">
        <Tooltip label="Upvote" side="top">
          <button
            type="button"
            aria-label={`Upvote ${label}`}
            aria-pressed={vote === 'up'}
            onClick={() => onVote?.('up')}
            className={cn(arrowClass, size, vote === 'up' ? upActive : idle)}
          >
            <ChevronUp className={iconSize} strokeWidth={2.25} />
          </button>
        </Tooltip>
        <span
          className={cn(
            'min-w-7 text-center font-bold tabular-nums transition-colors duration-150',
            compact ? 'text-[13px]' : 'text-sm',
            vote === 'up' ? 'text-app-action' : vote === 'down' ? 'text-app-muted' : 'text-app-heading',
          )}
        >
          {score}
        </span>
        <Tooltip label="Downvote" side="top">
          <button
            type="button"
            aria-label={`Downvote ${label}`}
            aria-pressed={vote === 'down'}
            onClick={() => onVote?.('down')}
            className={cn(arrowClass, size, vote === 'down' ? downActive : downIdle)}
          >
            <ChevronDown className={iconSize} strokeWidth={2.25} />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex w-11 flex-col items-center gap-1" aria-label={`${score} votes`}>
      <Tooltip label="Upvote" side="right">
        <button
          type="button"
          aria-label={`Upvote ${label}`}
          aria-pressed={vote === 'up'}
          onClick={() => onVote?.('up')}
          className={cn(arrowClass, 'h-11 w-11', vote === 'up' ? upActive : idle)}
        >
          <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </Tooltip>
      <span
        className={cn(
          'grid h-7 min-w-7 place-items-center border px-1 font-mono text-[13px] font-semibold tabular-nums transition-[color,background-color,border-color] duration-150',
          vote === 'up'
            ? 'border-app-action bg-app-action-faint text-app-action'
            : vote === 'down'
              ? 'border-app-border text-app-muted'
              : 'border-app-border text-app-heading',
        )}
      >
        {score}
      </span>
      <Tooltip label="Downvote" side="right">
        <button
          type="button"
          aria-label={`Downvote ${label}`}
          aria-pressed={vote === 'down'}
          onClick={() => onVote?.('down')}
          className={cn(arrowClass, 'h-11 w-11', vote === 'down' ? downActive : downIdle)}
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </Tooltip>
    </div>
  );
};

export const VoteControl = React.memo(VoteControlInner);
