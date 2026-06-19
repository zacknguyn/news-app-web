import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CommentTree } from './Comment';
import { MOCK_COMMENTS } from '../lib/mockData';
import type { Comment } from '../types';
import { backendApi } from '../lib/api';
import { backendCommentToComment } from '../lib/backendAdapters';
import { useAuth } from '../context/AuthContext';
import { Alert } from './ui/Alert';
import { TextArea } from './ui/Input';

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
      return { ...comment, replies: [...comment.replies, reply] };
    }
    return {
      ...comment,
      replies: addReplyToThread(comment.replies, parentId, reply),
    };
  });

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  backendArticleId,
  postAuthorId,
  quoteDraft,
  onQuoteDraftClear,
}) => {
  const isArticle = postId.startsWith('article-');
  const [comments, setComments] = useState<Comment[]>(() => MOCK_COMMENTS.filter((c) => c.postId === postId));
  const { user } = useAuth();
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
        setComments(response.content.map((comment) => backendCommentToComment(comment, postId)));
      } catch (error) {
        if (!isMounted) return;
        if (backendArticleId) {
          try {
            const response = await backendApi.getCommentsByArticle(Number(backendArticleId));
            if (!isMounted) return;
            setComments(response.content.map((comment) => backendCommentToComment(comment, postId)));
            setCommentNotice('Showing article-linked discussion for this post.');
          } catch {
            setComments([]);
setCommentNotice(error instanceof Error ? error.message : 'Comments are currently unavailable. The server may be offline — try refreshing.');
          }
          return;
        }
        setComments([]);
        setCommentNotice(error instanceof Error ? error.message : 'Comments are currently unavailable. The server may be offline — try refreshing.');
      }
    };

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [backendArticleId, postId]);

  const createComment = async (input: { content: string; parentId?: number }) => {
    if (isArticle && backendArticleId) {
      return backendApi.createArticleComment(Number(backendArticleId), input);
    }
    return backendApi.createPostComment(postId, input);
  };

  const handleAddComment = async () => {
    const body = commentText.trim();
    const quote = quoteDraft?.trim();
    const content = quote ? `> ${quote.replace(/\n+/g, '\n> ')}${body ? `\n\n${body}` : ''}` : body;
    if (!content) return;

    try {
      const createdComment = await createComment({ content });
      setComments((prev) => [backendCommentToComment(createdComment, postId), ...prev]);
      setCommentText('');
      onQuoteDraftClear?.();
      toast.success('Comment posted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Comment failed.');
    }
  };

  const handleAddReply = async (parentId: string, content: string) => {
    try {
      const createdReply = await createComment({ content, parentId: Number(parentId) });
      const reply = backendCommentToComment(createdReply, postId);
      setComments((prev) => addReplyToThread(prev, parentId, reply));
      toast.success('Reply posted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reply failed.');
    }
  };

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

  const handleCommentUnlike = async (commentId: string) => {
    try {
      const updatedComment = await backendApi.unlikeComment(commentId);
      return Math.max(updatedComment.likes || 0, 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Comment unlike failed.');
      return null;
    }
  };

  const removeCommentFromTree = (comments: Comment[], id: string): Comment[] =>
    comments
      .filter((c) => c.id !== id)
      .map((c) => ({ ...c, replies: removeCommentFromTree(c.replies, id) }));

  const handleDeleteComment = async (commentId: string) => {
    try {
      await backendApi.deleteComment(commentId);
      setComments((prev) => removeCommentFromTree(prev, commentId));
      toast.success('Comment deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed.');
      throw error;
    }
  };

  return (
    <section id="comments" aria-labelledby="responses-heading" className="mt-10 border-t border-app-border pt-8">
      <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-2">
        <h3 id="responses-heading" className="mono-label text-app-muted">
          {totalComments} comments
        </h3>
      </div>

      {commentNotice && (
        <Alert tone="warning" className="mb-6">
          {commentNotice}
        </Alert>
      )}

      <div className={comments.length ? 'mb-10' : 'mb-0'}>
        {quoteDraft && (
          <aside className="mb-4 border-l-2 border-app-action px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="mono-label text-app-action">Quote</span>
              <button
                type="button"
                onClick={onQuoteDraftClear}
                className="font-mono text-[11px] uppercase tracking-wider text-app-muted transition-colors hover:text-app-action"
              >
                Remove quote
              </button>
            </div>
            <p className="text-sm italic leading-relaxed text-app-text">&ldquo;{quoteDraft}&rdquo;</p>
          </aside>
        )}
        <label htmlFor={composerId} className="sr-only">
          Add a response
        </label>
        <TextArea
          id={composerId}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add to the discussion. Cite sources, ask questions, disagree with evidence."
          disabled={!canUseBackendComments}
          className="min-h-[120px] w-full max-w-[68ch] text-[15px] leading-relaxed"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-app-muted">
            Markdown supported. Be specific. Back claims with evidence.
          </p>
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!hasCommentContent || !canUseBackendComments}
            className="inline-flex h-10 items-center justify-center border border-app-action bg-app-action px-6 font-mono text-[11px] uppercase tracking-wider text-app-on-action transition-colors hover:bg-app-action-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
          >
            Post response
          </button>
        </div>
      </div>

      {comments.length > 0 && (
        <CommentTree
          comments={comments}
          postAuthorId={postAuthorId}
          currentUserId={user?.id}
          currentUserRole={user?.role}
          onReply={handleAddReply}
          onLike={handleCommentLike}
          onUnlike={handleCommentUnlike}
          onDelete={handleDeleteComment}
        />
      )}
    </section>
  );
};
