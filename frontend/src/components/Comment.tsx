import React, { useState } from 'react';
import type { Comment as CommentType } from '../types';
import { Link } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';

interface CommentProps {
  comment: CommentType;
  depth?: number;
  postAuthorId?: string;
  onReply: (parentId: string, content: string) => void;
  onLike?: (commentId: string) => Promise<number | null> | number | null;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: days > 365 ? 'numeric' : undefined 
  });
}

function countReplies(comment: CommentType): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
}

export const Comment: React.FC<CommentProps> = ({ 
  comment, 
  depth = 0, 
  postAuthorId,
  onReply,
  onLike
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [displayLikes, setDisplayLikes] = useState(comment.upvotes);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (onLike) {
        const nextLikes = await onLike(comment.id);
        if (nextLikes === null) return;
        setDisplayLikes(nextLikes);
        return;
      }

      setDisplayLikes(prev => prev + 1);
    } finally {
      setIsLiking(false);
    }
  };

  const isOP = comment.author.id === postAuthorId;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = countReplies(comment);
  const trimmedReply = replyDraft.trim();

  const handleSubmitReply = () => {
    if (!trimmedReply) return;
    onReply(comment.id, trimmedReply);
    setReplyDraft('');
    setIsReplying(false);
    setShowReplies(true);
  };

  return (
    <article className={depth > 0 ? 'comment-reply' : 'comment-top'}>
      <div className="flex gap-2.5">
        <div className="relative flex w-6 flex-shrink-0 flex-col items-center">
          <Link to={`/app/u/${comment.author.username}`} className="z-20">
            <img 
              src={comment.author.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.author.username}`}
              alt=""
              className={depth > 0 ? 'h-5 w-5 rounded-full bg-[var(--color-comment-surface)] ring-[3px] ring-[var(--color-comment-surface)]' : 'h-6 w-6 rounded-full bg-[var(--color-comment-surface)] ring-[3px] ring-[var(--color-comment-surface)]'}
            />
          </Link>
        </div>
        
        <div className="min-w-0 flex-1 pb-3">
          <div className="mb-1 flex items-center gap-2 text-[11px]">
            <Link to={`/app/u/${comment.author.username}`} className={`font-semibold hover:underline ${isOP ? 'text-[var(--color-comment-action)]' : 'text-[var(--color-comment-ink)]'}`}>
              {comment.author.username}
            </Link>
            {isOP && (
              <span className="bg-[var(--color-comment-surface-lift)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-comment-muted)]">OP</span>
            )}
            {comment.author.isVerified && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[var(--color-comment-action)]">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            <span className="text-[var(--color-comment-faint)]">·</span>
            <span className="text-[var(--color-comment-faint)]">{timeAgo(comment.createdAt)}</span>
          </div>

          {comment.quote && (
            <div className="mb-2 rounded-[8px] border border-[var(--color-comment-border-clean)] bg-[var(--color-comment-surface-lift)] px-3 py-2">
              <div className="mb-1 text-[11px] font-semibold text-[var(--color-comment-action)]">Quoted selection</div>
              <blockquote className="line-clamp-4 text-[13px] leading-5 text-[var(--color-comment-muted)]">
                {comment.quote}
              </blockquote>
            </div>
          )}

          {comment.content && (
            <p className="mb-2 text-[14px] leading-6 text-[var(--color-comment-ink)]">
              {comment.content}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={isLiking}
              aria-label={`Like comment by ${comment.author.username}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border border-[var(--color-vote-border)] bg-[var(--color-vote-surface)] px-2.5 text-[11px] font-semibold text-[var(--color-comment-muted)] transition-colors hover:bg-[var(--color-vote-hover)] hover:text-[var(--color-comment-action)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-7"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>Like</span>
              <span className="font-mono text-[var(--color-comment-ink)]">{displayLikes}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReplying(true)}
              className="min-h-11 px-2 text-[11px] font-semibold text-[var(--color-comment-muted)] transition-colors hover:text-[var(--color-comment-action)] sm:min-h-6 sm:px-0"
            >
              Reply
            </button>
            <button type="button" aria-label={`Share comment by ${comment.author.username}`} className="min-h-11 px-2 text-[11px] font-semibold text-[var(--color-comment-muted)] transition-colors hover:text-[var(--color-comment-action)] sm:min-h-6 sm:px-0">Share</button>
          </div>

          {isReplying && (
            <div className="mt-2 border-l border-[var(--color-comment-border-clean)] pl-3">
              <textarea
                id={`reply-${comment.id}`}
                aria-label={`Reply to ${comment.author.username}`}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder={`Reply to ${comment.author.username}`}
                className="min-h-[60px] w-full resize-y border border-[var(--color-comment-border)] bg-[var(--color-comment-surface)] px-3 py-2 text-sm text-[var(--color-comment-ink)] outline-none transition-colors placeholder:text-[var(--color-comment-faint)] focus:border-[var(--color-comment-action)] focus:ring-2 focus:ring-[var(--color-comment-focus)]"
                autoFocus
              />
              <div className="mt-1.5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyDraft('');
                    setIsReplying(false);
                  }}
                  className="min-h-11 px-3 text-xs font-bold text-[var(--color-comment-muted)] transition-colors hover:text-[var(--color-comment-ink)] sm:min-h-8"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReply}
                  disabled={!trimmedReply}
                  className="min-h-11 bg-[var(--color-comment-ink)] px-4 text-xs font-bold text-[var(--color-comment-surface)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--color-comment-faint)] sm:min-h-8"
                >
                  Post reply
                </button>
              </div>
            </div>
          )}

          {hasReplies && !showReplies && (
              <button
                type="button"
                onClick={() => setShowReplies(true)}
                className="mt-3 inline-flex min-h-11 items-center border border-[var(--color-comment-border)] bg-[var(--color-comment-surface)] px-2.5 text-[11px] font-bold text-[var(--color-comment-muted)] transition-colors hover:border-[var(--color-comment-action)] hover:text-[var(--color-comment-action)] sm:min-h-7"
              >
                Show {replyCount} hidden {replyCount === 1 ? 'reply' : 'replies'}
              </button>
          )}

          {hasReplies && showReplies && (
            <div className="comment-reply-group mt-3 space-y-4">
              {comment.replies.map((reply) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  postAuthorId={postAuthorId}
                  onReply={onReply}
                  onLike={onLike}
                />
              ))}
              {depth === 0 && (
                <button
                  type="button"
                  onClick={() => setShowReplies(false)}
                  className="text-xs font-bold text-[var(--color-comment-muted)] transition-colors hover:text-[var(--color-comment-action)]"
                >
                  Hide replies
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

interface CommentTreeProps {
  comments: CommentType[];
  postAuthorId?: string;
  onReply: (parentId: string, content: string) => void;
  onLike?: (commentId: string) => Promise<number | null> | number | null;
}

export const CommentTree: React.FC<CommentTreeProps> = ({ comments, postAuthorId, onReply, onLike }) => {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          postAuthorId={postAuthorId}
          onReply={onReply}
          onLike={onLike}
        />
      ))}
    </div>
  );
};
