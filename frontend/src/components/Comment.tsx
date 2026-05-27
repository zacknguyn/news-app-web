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
    <article className={depth > 0 ? 'ml-6 border-l-2 border-[var(--color-app-border)] pl-6' : 'border-b border-[var(--color-app-border)] pb-8 last:border-0'}>
      <div className="flex gap-4">
        <Link to={`/app/u/${comment.author.username}`} className="shrink-0 pt-1">
          <img 
            src={comment.author.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${comment.author.username}`}
            alt=""
            className="h-10 w-10 rounded-full border border-[var(--color-app-border)] grayscale"
          />
        </Link>
        
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
            <Link to={`/app/u/${comment.author.username}`} className={`hover:underline ${isOP ? 'text-[var(--color-app-action)]' : 'text-[var(--color-app-heading)]'}`}>
              @{comment.author.username}
            </Link>
            {isOP && (
              <span className="bg-[var(--color-app-action)] px-1.5 py-0.5 text-[10px] text-white">OP</span>
            )}
            <span className="text-[var(--color-app-muted)]">|</span>
            <span className="text-[var(--color-app-muted)]">{timeAgo(comment.createdAt)}</span>
          </div>

          {comment.quote && (
            <div className="mb-4 border-l-2 border-[var(--color-app-action)] bg-[var(--color-app-surface-alt)] p-4 italic text-sm text-[var(--color-app-muted)]">
              "{comment.quote}"
            </div>
          )}

          {comment.content && (
            <p className="editorial-label !text-base leading-relaxed text-[var(--color-app-text)] mb-4">
              {comment.content}
            </p>
          )}

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleLike}
              disabled={isLiking}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:text-[var(--color-app-action)] transition-colors"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{displayLikes} Authority</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReplying(true)}
              className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:text-[var(--color-app-action)] transition-colors"
            >
              Reply
            </button>
            <button type="button" className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:text-[var(--color-app-action)] transition-colors">Share</button>
          </div>

          {isReplying && (
            <div className="mt-6 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
              <textarea
                id={`reply-${comment.id}`}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder={`Enter your response to @${comment.author.username}...`}
                className="bulwark-input min-h-[100px] w-full !p-4"
                autoFocus
              />
              <div className="mt-3 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setReplyDraft('');
                    setIsReplying(false);
                  }}
                  className="bulwark-button-ghost uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReply}
                  disabled={!trimmedReply}
                  className="bulwark-button-primary uppercase tracking-widest"
                >
                  Post Reply
                </button>
              </div>
            </div>
          )}

          {hasReplies && !showReplies && (
              <button
                type="button"
                onClick={() => setShowReplies(true)}
                className="mt-6 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)] hover:underline"
              >
                Show {replyCount} Responses
              </button>
          )}

          {hasReplies && showReplies && (
            <div className="mt-8 space-y-8">
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
                  className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:text-[var(--color-app-action)] transition-colors"
                >
                  Collapse Thread
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
