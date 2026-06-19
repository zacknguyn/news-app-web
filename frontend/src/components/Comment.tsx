import React, { useState } from 'react';
import type { Comment as CommentType } from '../types';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { TextArea } from './ui/Input';
import { PostActionButton } from './ui/PostActionButton';
import { getProfilePath } from '../lib/profileLinks';

interface CommentProps {
  comment: CommentType;
  depth?: number;
  postAuthorId?: string;
  currentUserId?: string;
  currentUserRole?: string;
  onReply: (parentId: string, content: string) => void;
  onLike?: (commentId: string) => Promise<number | null> | number | null;
  onUnlike?: (commentId: string) => Promise<number | null> | number | null;
  onDelete?: (commentId: string) => Promise<void>;
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
    year: days > 365 ? 'numeric' : undefined,
  });
}

function countReplies(comment: CommentType): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
}

const TREE_INDENT = 24;

const CommentNode: React.FC<CommentProps> = ({ comment, depth = 0, postAuthorId, currentUserId, currentUserRole, onReply, onLike, onUnlike, onDelete }) => {
  const [showReplies, setShowReplies] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [displayLikes, setDisplayLikes] = useState(comment.upvotes);
  const [hasLiked, setHasLiked] = useState(Boolean(comment.likedByMe || comment.userVote === 'up'));
  const [isLiking, setIsLiking] = useState(false);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const canDelete = onDelete && (currentUserRole === 'ADMIN' || comment.author.id === currentUserId);

  const handleDeleteComment = async () => {
    if (!onDelete || isDeletingComment) return;
    setIsDeletingComment(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsDeletingComment(false);
      setConfirmDeleteComment(false);
    }
  };

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const previousLikedState = hasLiked;
    setHasLiked(!previousLikedState);
    setDisplayLikes((prev) => Math.max(previousLikedState ? prev - 1 : prev + 1, 0));

    try {
      const action = previousLikedState ? onUnlike : onLike;
      if (action) {
        const nextLikes = await action(comment.id);
        if (nextLikes !== null) {
          setDisplayLikes(Math.max(nextLikes, 0));
        } else {
          setHasLiked(previousLikedState);
          setDisplayLikes((prev) => Math.max(previousLikedState ? prev + 1 : prev - 1, 0));
        }
      }
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
    <div
      className={
        depth > 0 ? 'relative border-l border-app-border pl-6' : 'border-t border-app-border py-5 first:border-t-0'
      }
      style={depth > 0 ? { marginLeft: TREE_INDENT } : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] leading-5 text-app-muted">
            <Link
              to={getProfilePath(comment.author)}
              className={cn('hover:text-app-action hover:underline', isOP ? 'text-app-action' : 'text-app-heading')}
            >
              @{comment.author.username}
            </Link>
            {isOP && <span className="text-app-action">OP</span>}
            <span>{timeAgo(comment.createdAt)}</span>
            <span className="tabular-nums">{displayLikes}</span>
            <button type="button" onClick={() => setIsReplying(true)} className="hover:text-app-action">
              Reply
            </button>
            <button type="button" className="hover:text-app-action">
              Share
            </button>
            <button type="button" className="hover:text-app-action">
              Save
            </button>
            <button type="button" className="hover:text-app-action">
              Report
            </button>
            {canDelete && !confirmDeleteComment && (
              <button
                type="button"
                onClick={() => setConfirmDeleteComment(true)}
                className="text-app-action hover:underline"
              >
                Delete
              </button>
            )}
            {confirmDeleteComment && (
              <span role="alert" aria-live="polite" className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteComment}
                  disabled={isDeletingComment}
                  className="text-app-action hover:underline disabled:opacity-40"
                >
                  {isDeletingComment ? 'Deleting' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteComment(false)}
                  className="hover:text-app-action"
                >
                  Cancel
                </button>
              </span>
            )}
          </div>

          {comment.quote && (
            <blockquote className="my-2 max-w-[68ch] border-l-2 border-app-action px-3 py-2 text-sm italic text-app-text">
              {comment.quote}
            </blockquote>
          )}

          {comment.content && (
            <p className="mb-2 max-w-[68ch] text-[15px] leading-relaxed text-app-text">{comment.content}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-app-muted">
            <PostActionButton
              icon={<Heart strokeWidth={2.25} className={hasLiked ? 'fill-current' : undefined} />}
              label={
                <span className="inline-flex items-baseline gap-1.5">
                  <span>{hasLiked ? 'Liked' : 'Like'}</span>
                  <span className="tabular-nums">{displayLikes}</span>
                </span>
              }
              active={hasLiked}
              disabled={isLiking}
              onClick={handleToggleLike}
              ariaLabel={
                hasLiked
                  ? `You liked this comment (${displayLikes} total)`
                  : `Like this comment (${displayLikes} total)`
              }
              title={hasLiked ? 'Liked' : 'Like'}
            />
            {hasReplies && (
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className="inline-flex min-h-11 items-center px-2 font-mono text-[11px] uppercase tracking-wider text-app-muted transition-colors hover:text-app-heading"
              >
                {showReplies ? 'Collapse' : 'Expand'} {replyCount}
              </button>
            )}
          </div>

          {isReplying && (
            <div className="mt-3 border-t border-app-border pt-3">
              <TextArea
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder={`Reply to @${comment.author.username}...`}
                className="min-h-[72px] w-full max-w-[68ch] text-[15px] leading-relaxed"
                autoFocus
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyDraft('');
                    setIsReplying(false);
                  }}
                  className="font-mono text-[11px] uppercase tracking-wider text-app-muted transition-colors hover:text-app-heading"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReply}
                  disabled={!trimmedReply}
                  className="inline-flex h-8 items-center justify-center border border-app-action bg-app-action px-4 font-mono text-[11px] uppercase tracking-wider text-app-on-action transition-colors hover:bg-app-action-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Post reply
                </button>
              </div>
            </div>
          )}

          {hasReplies && showReplies && (
            <div className="mt-5 space-y-5">
              {comment.replies.map((reply) => (
                <CommentNode
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  postAuthorId={postAuthorId}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onReply={onReply}
                  onLike={onLike}
                  onUnlike={onUnlike}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}

interface CommentTreeProps {
  comments: CommentType[];
  postAuthorId?: string;
  currentUserId?: string;
  currentUserRole?: string;
  onReply: (parentId: string, content: string) => void;
  onLike?: (commentId: string) => Promise<number | null> | number | null;
  onUnlike?: (commentId: string) => Promise<number | null> | number | null;
  onDelete?: (commentId: string) => Promise<void>;
}

export const CommentTree: React.FC<CommentTreeProps> = ({ comments, postAuthorId, currentUserId, currentUserRole, onReply, onLike, onUnlike, onDelete }) => {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          postAuthorId={postAuthorId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onReply={onReply}
          onLike={onLike}
          onUnlike={onUnlike}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export const Comment = CommentNode;
