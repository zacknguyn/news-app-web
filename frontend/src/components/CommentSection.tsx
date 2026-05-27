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
            setComments([]);
            setCommentNotice(error instanceof Error ? error.message : 'Backend comments unavailable.');
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
    <div className="mt-14 border-t-4 border-[var(--color-app-heading)] pb-4 pt-10 sm:mt-20 sm:pb-10 sm:pt-12">
      <div className="mb-8 flex items-center gap-6">
        <h3 className="editorial-h2 !text-2xl">
          {totalComments} Responses
        </h3>
        <div className="ml-auto flex gap-2">
          {(['best', 'top', 'new'] as SortType[]).map(sort => (
            <button
              type="button"
              key={sort}
              onClick={() => setSortBy(sort)}
              aria-pressed={sortBy === sort}
              className={`h-9 px-4 text-xs font-bold uppercase tracking-widest transition-all ${
                sortBy === sort
                  ? 'bg-[var(--color-app-heading)] text-white'
                  : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]'
              }`}
            >
              {sort}
            </button>
          ))}
        </div>
      </div>

      {commentNotice && (
        <Alert tone="warning" className="mb-8">
          {commentNotice}
        </Alert>
      )}

      <div className={sortedComments.length ? 'mb-8 sm:mb-10' : 'mb-0'}>
        {quoteDraft && (
          <div className="mb-6 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-6">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
                Referencing Dispatch
              </span>
              <button
                type="button"
                onClick={onQuoteDraftClear}
                className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]"
              >
                Remove Quote
              </button>
            </div>
            <p className="editorial-label !text-base italic leading-relaxed text-[var(--color-app-muted)]">
              "{quoteDraft}"
            </p>
          </div>
        )}
        <label htmlFor={composerId} className="sr-only">
          Add a response
        </label>
        <textarea
          id={composerId}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Enter your response..."
          disabled={!canUseBackendComments}
          className="bulwark-input min-h-[120px] w-full !p-4 !text-base leading-relaxed"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!hasCommentContent || !canUseBackendComments}
            className="bulwark-button-primary !h-12 !px-8 uppercase tracking-widest"
          >
            Post Response
          </button>
        </div>
      </div>

      {sortedComments.length > 0 && (
        <CommentTree comments={sortedComments} postAuthorId={postAuthorId} onReply={handleAddReply} onLike={handleCommentLike} />
      )}
    </div>
  );
};
