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
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';

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
  const isVi = isVietnamese(useAppLanguage());
  const isArticle = postId.startsWith('article-');
  const [comments, setComments] = useState<Comment[]>(() => MOCK_COMMENTS.filter((c) => c.postId === postId));
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [commentNotice, setCommentNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasCommentContent = Boolean(commentText.trim() || quoteDraft?.trim());
  const copy = isVi
    ? {
        articleDiscussion: 'Đang hiển thị thảo luận liên kết với bài báo này.',
        unavailable: 'Bình luận hiện không khả dụng. Máy chủ có thể đang offline, hãy thử tải lại.',
        posted: 'Đã đăng bình luận.',
        failed: 'Đăng bình luận thất bại.',
        replyPosted: 'Đã đăng phản hồi.',
        replyFailed: 'Đăng phản hồi thất bại.',
        likeFailed: 'Thích bình luận thất bại.',
        unlikeFailed: 'Bỏ thích bình luận thất bại.',
        deleted: 'Đã xóa bình luận.',
        deleteFailed: 'Xóa thất bại.',
        comments: 'bình luận',
        quote: 'Trích dẫn',
        removeQuote: 'Bỏ trích dẫn',
        addResponse: 'Thêm phản hồi',
        placeholder: 'Tham gia thảo luận. Dẫn nguồn, đặt câu hỏi, phản biện bằng bằng chứng.',
        markdown: 'Hỗ trợ Markdown. Viết cụ thể và dẫn chứng rõ ràng.',
        posting: 'Đang đăng...',
        postResponse: 'Đăng phản hồi',
      }
    : {
        articleDiscussion: 'Showing article-linked discussion for this post.',
        unavailable: 'Comments are currently unavailable. The server may be offline — try refreshing.',
        posted: 'Comment posted.',
        failed: 'Comment failed.',
        replyPosted: 'Reply posted.',
        replyFailed: 'Reply failed.',
        likeFailed: 'Comment like failed.',
        unlikeFailed: 'Comment unlike failed.',
        deleted: 'Comment deleted.',
        deleteFailed: 'Delete failed.',
        comments: 'comments',
        quote: 'Quote',
        removeQuote: 'Remove quote',
        addResponse: 'Add a response',
        placeholder: 'Add to the discussion. Cite sources, ask questions, disagree with evidence.',
        markdown: 'Markdown supported. Be specific. Back claims with evidence.',
        posting: 'Posting...',
        postResponse: 'Post response',
      };

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
            setCommentNotice(copy.articleDiscussion);
          } catch {
            setComments([]);
setCommentNotice(error instanceof Error ? error.message : copy.unavailable);
          }
          return;
        }
        setComments([]);
        setCommentNotice(error instanceof Error ? error.message : copy.unavailable);
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
    if (isSubmitting) return;
    const body = commentText.trim();
    const quote = quoteDraft?.trim();
    const content = quote ? `> ${quote.replace(/\n+/g, '\n> ')}${body ? `\n\n${body}` : ''}` : body;
    if (!content) return;

    setIsSubmitting(true);
    try {
      const createdComment = await createComment({ content });
      setComments((prev) => [backendCommentToComment(createdComment, postId), ...prev]);
      setCommentText('');
      onQuoteDraftClear?.();
      toast.success(copy.posted);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (parentId: string, content: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const createdReply = await createComment({ content, parentId: Number(parentId) });
      const reply = backendCommentToComment(createdReply, postId);
      setComments((prev) => addReplyToThread(prev, parentId, reply));
      toast.success(copy.replyPosted);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.replyFailed);
    } finally {
      setIsSubmitting(false);
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
      toast.error(error instanceof Error ? error.message : copy.likeFailed);
      return null;
    }
  };

  const handleCommentUnlike = async (commentId: string) => {
    try {
      const updatedComment = await backendApi.unlikeComment(commentId);
      return Math.max(updatedComment.likes || 0, 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.unlikeFailed);
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
      toast.success(copy.deleted);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.deleteFailed);
      throw error;
    }
  };

  return (
    <section id="comments" aria-labelledby="responses-heading" className="mt-10 border-t border-app-border pt-8">
      <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-2">
        <h3 id="responses-heading" className="mono-label text-app-muted">
          {totalComments} {copy.comments}
        </h3>
      </div>

      {commentNotice && (
        <Alert tone="warning" className="mb-6">
          {commentNotice}
        </Alert>
      )}

      <div className={comments.length ? 'mb-10' : 'mb-0'}>
        {quoteDraft && (
          <aside className="mb-4 rounded-lg bg-app-action-soft px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="mono-label text-app-action">{copy.quote}</span>
              <button
                type="button"
                onClick={onQuoteDraftClear}
                className="font-mono text-[11px] uppercase tracking-wider text-app-muted transition-colors hover:text-app-action"
              >
                {copy.removeQuote}
              </button>
            </div>
            <p className="text-sm italic leading-relaxed text-app-text">&ldquo;{quoteDraft}&rdquo;</p>
          </aside>
        )}
        <label htmlFor={composerId} className="sr-only">
          {copy.addResponse}
        </label>
        <TextArea
          id={composerId}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={copy.placeholder}
          disabled={!canUseBackendComments}
          className="min-h-[120px] w-full max-w-[68ch] text-[15px] leading-relaxed"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-app-muted">
            {copy.markdown}
          </p>
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!hasCommentContent || !canUseBackendComments || isSubmitting}
              className="inline-flex h-9 items-center justify-center border border-app-action bg-app-action px-5 font-mono text-[11px] uppercase tracking-wider text-app-on-action transition-colors hover:bg-app-action-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? copy.posting : copy.postResponse}
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
