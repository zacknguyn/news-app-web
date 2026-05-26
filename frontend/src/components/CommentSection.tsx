import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CommentTree } from './Comment';
import { MOCK_COMMENTS } from '../lib/mockData';
import type { Comment } from '../types';
import { backendApi } from '../lib/api';
import { backendCommentToComment } from '../lib/backendAdapters';
import { Alert } from './ui/Alert';

type SortType = 'best' | 'top' | 'new';

interface CommentSectionProps {
  postId: string;
  backendArticleId?: string;
  postAuthorId?: string;
  quoteDraft?: string | null;
  onQuoteDraftClear?: () => void;
}

const countThread = (comments: Comment[]): number =>
  comments.reduce((total, comment) => total + 1 + countThread(comment.replies), 0);

const addReplyToThread = (comments: Comment[], parentId: string, reply: Comment): Comment[] =>
  comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...comment.replies, reply],
      };
    }

    return {
      ...comment,
      replies: addReplyToThread(comment.replies, parentId, reply),
    };
  });

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, backendArticleId, postAuthorId, quoteDraft, onQuoteDraftClear }) => {
  const [comments, setComments] = useState<Comment[]>(() => MOCK_COMMENTS.filter(c => c.postId === postId));
  const [sortBy, setSortBy] = useState<SortType>('best');
  const [commentText, setCommentText] = useState('');
  const [commentNotice, setCommentNotice] = useState('');
  const hasCommentContent = Boolean(commentText.trim() || quoteDraft?.trim());

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      setCommentNotice('');

      try {
        const response = await backendApi.getCommentsByPost(postId);
        if (!isMounted) return;
        setComments(response.content.map(comment => backendCommentToComment(comment, postId)));
      } catch (error) {
        if (!isMounted) return;
        if (backendArticleId) {
          try {
            const response = await backendApi.getCommentsByArticle(Number(backendArticleId));
            if (!isMounted) return;
            setComments(response.content.map(comment => backendCommentToComment(comment, postId)));
            setCommentNotice('Showing article-linked discussion for this post.');
          } catch {
            setComments(MOCK_COMMENTS.filter(c => c.postId === postId));
            setCommentNotice(error instanceof Error ? error.message : 'Backend comments unavailable. Showing local preview comments.');
          }
          return;
        }
        setComments([]);
        setCommentNotice(error instanceof Error ? error.message : 'Backend comments unavailable.');
      }
    };

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [backendArticleId, postId]);

  const handleAddComment = async () => {
    const body = commentText.trim();
    const quote = quoteDraft?.trim();
    const content = quote
      ? `> ${quote.replace(/\n+/g, '\n> ')}${body ? `\n\n${body}` : ''}`
      : body;
    if (!content) return;

    try {
      const createdComment = await backendApi.createPostComment(postId, { content });
      setComments(prev => [backendCommentToComment(createdComment, postId), ...prev]);
      setCommentText('');
      onQuoteDraftClear?.();
      toast.success('Comment posted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Comment failed.');
    }
  };

  const handleAddReply = async (parentId: string, content: string) => {
    try {
      const createdReply = await backendApi.createPostComment(postId, {
        content,
        parentId: Number(parentId),
      });
      const reply = backendCommentToComment(createdReply, postId);
      setComments(prev => addReplyToThread(prev, parentId, reply));
      toast.success('Reply posted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reply failed.');
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'new':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const totalComments = countThread(comments);
  const composerId = `comment-composer-${postId}`;
  const canUseBackendComments = true;

  const handleCommentLike = async (commentId: string) => {
    try {
      const updatedComment = await backendApi.likeComment(commentId);
      return Math.max(updatedComment.likes || 0, 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Comment like failed.');
      return null;
    }
  };

  return (
    <div className="mt-9 border-t border-[var(--color-comment-border-clean)] py-6">
      <div className="mb-5 flex items-center gap-4">
        <h3 className="text-sm font-semibold text-[var(--color-comment-ink)]">
          {totalComments} Comments
        </h3>
        <div className="ml-auto flex gap-1 text-[11px] font-semibold">
          {(['best', 'top', 'new'] as SortType[]).map(sort => (
            <button
              type="button"
              key={sort}
              onClick={() => setSortBy(sort)}
              aria-pressed={sortBy === sort}
              className={`px-2.5 py-1 transition-colors ${
                sortBy === sort
                  ? 'rounded-[4px] bg-[var(--color-comment-ink)] text-[var(--color-comment-surface)]'
                  : 'text-[var(--color-comment-muted)] hover:bg-[var(--color-comment-surface-lift)]'
              }`}
            >
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {commentNotice && (
        <Alert tone="warning" className="mb-4">
          {commentNotice}
        </Alert>
      )}

      <div className="mb-6">
        {quoteDraft && (
          <div className="mb-3 rounded-[8px] border border-[var(--color-comment-border-clean)] bg-[var(--color-comment-surface-lift)] p-3">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--color-comment-action)]">
                Quoted selection
              </span>
              <button
                type="button"
                onClick={onQuoteDraftClear}
                className="text-sm font-medium text-[var(--color-comment-muted)] hover:text-[var(--color-comment-ink)]"
              >
                Clear
              </button>
            </div>
            <p className="line-clamp-3 text-sm leading-5 text-[var(--color-comment-muted)]">
              {quoteDraft}
            </p>
          </div>
        )}
        <label htmlFor={composerId} className="sr-only">
          Add a comment
        </label>
        <textarea
          id={composerId}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Join the discussion..."
          disabled={!canUseBackendComments}
          className="min-h-[76px] w-full resize-y rounded-[7px] border border-[var(--color-comment-border)] bg-[var(--color-comment-surface)] p-3 font-sans text-sm text-[var(--color-comment-ink)] placeholder:text-[var(--color-comment-faint)] focus:border-[var(--color-comment-action)] focus:outline-none focus:ring-2 focus:ring-[var(--color-comment-focus)]"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!hasCommentContent || !canUseBackendComments}
            className="rounded-[4px] bg-[var(--color-comment-ink)] px-4 py-2 text-sm font-semibold text-[var(--color-comment-surface)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--color-comment-faint)]"
          >
            Comment
          </button>
        </div>
      </div>

      <CommentTree comments={sortedComments} postAuthorId={postAuthorId} onReply={handleAddReply} onLike={handleCommentLike} />
    </div>
  );
};
