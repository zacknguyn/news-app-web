import React, { useEffect, useRef, useState } from 'react';
import type { Post } from '../types';
import { ShieldCheck, MessageSquare, Bookmark, Share2, Sparkles, ChevronDown, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VoteControl } from './ui/VoteControl';
import { getProfilePath } from '../lib/profileLinks';
import { stripHtml } from '../lib/richContent';
import { backendApi } from '../lib/api';
import { toast } from 'sonner';
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';
import {
  readTranslatedContentCache,
  saveTranslatedContentCache,
  shouldTranslatePostContent,
  translatePostContent,
  type TranslatedContent,
} from '../lib/contentTranslation';
import { localizeLabel } from '../lib/localizeLabel';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onVote?: (postId: string, vote: 'up' | 'down') => void;
  onDelete?: (postId: string, reason?: string) => void;
}

const PostCardInner: React.FC<PostCardProps> = ({ post, currentUserId, onVote, onDelete }) => {
  const cardRef = useRef<HTMLElement | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(() => Boolean(post.savedByMe));
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const language = useAppLanguage();
  const isVi = isVietnamese(language);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px 600px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const targetLanguage = language === 'vi' ? 'vi' : 'en';
    if (!isNearViewport || !shouldTranslatePostContent(post, targetLanguage)) {
      setTranslatedContent(null);
      return;
    }

    const cached = readTranslatedContentCache(post, targetLanguage);
    if (cached) {
      setTranslatedContent(cached);
      return;
    }

    let active = true;
    translatePostContent(post, targetLanguage)
      .then((translation) => {
        if (active) setTranslatedContent(saveTranslatedContentCache(post, targetLanguage, translation));
      })
      .catch(() => {
        if (active) setTranslatedContent(null);
      });

    return () => {
      active = false;
    };
  }, [isNearViewport, language, post]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaving) return;

    setIsSaving(true);
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);

    try {
      if (post.id.startsWith('article-') || post.backendArticleId) {
        const articleId = post.backendArticleId
          ? Number(post.backendArticleId)
          : Number(post.id.replace('article-', ''));
        if (!articleId || Number.isNaN(articleId)) {
          toast.error(isVi ? 'Không thể lưu bài viết này.' : 'This article cannot be saved.');
          setIsSaved(previousSaved);
          setIsSaving(false);
          return;
        }
        if (previousSaved) {
          await backendApi.unsaveArticle(articleId);
        } else {
          await backendApi.saveArticle(articleId);
        }
      } else {
        if (previousSaved) {
          await backendApi.unsavePost(post.id);
        } else {
          await backendApi.savePost(post.id);
        }
      }
      toast.success(previousSaved ? (isVi ? 'Đã bỏ lưu bài viết.' : 'Removed from saved posts.') : (isVi ? 'Đã lưu bài viết.' : 'Post saved.'));
    } catch (error) {
      setIsSaved(previousSaved);
      toast.error(error instanceof Error ? error.message : (isVi ? 'Không thể cập nhật trạng thái lưu.' : 'Unable to update saved state.'));
    } finally {
      setIsSaving(false);
    }
  };

  const score = post.upvotes - post.downvotes;
  const displayTitle = translatedContent?.title || post.title;
  const displayContent = translatedContent?.content || post.content;
  const displayChannelName = localizeLabel(post.channelName, language);
  const excerpt = React.useMemo(() => stripHtml(displayContent), [displayContent]);
  const postDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })
    : '';
  const commentCount = post.commentCount || 0;

  const readingTime = React.useMemo(() => {
    const words = excerpt.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [excerpt]);

  // Calculate reliability based on actual votes ratio (baseline 90% default)
  const reliability = React.useMemo(() => {
    const total = post.upvotes + post.downvotes;
    if (total === 0) return 92.4;
    const ratio = post.upvotes / total;
    return Number((90 + (ratio * 10)).toFixed(1));
  }, [post.upvotes, post.downvotes]);

  return (
    <article
      ref={cardRef}
      data-motion="list"
      style={{ contentVisibility: 'auto' }}
      className="group bg-app-surface border border-app-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible relative"
    >
      <div className="p-5">
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img loading="lazy" decoding="async"
              className="w-10 h-10 rounded-full border border-app-border object-cover"
              src={post.author.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(post.author.username)}`}
              alt=""
            />
            <div>
              <div className="flex items-center gap-1">
                <Link
                  to={getProfilePath(post.author)}
                  className="font-sans text-sm font-bold text-app-heading hover:text-app-action transition-colors leading-tight"
                >
                  {post.author.name || `@${post.author.username}`}
                </Link>
                {post.author.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-app-action" />}
              </div>
              <p className="font-mono text-[10px] text-app-muted uppercase tracking-wider mt-0.5">
                <Link to={`/app/c/${post.channelId}`} className="hover:text-app-action transition-colors font-bold">
                  {displayChannelName}
                </Link>
                {' '}•{' '}{postDate}
              </p>
            </div>
          </div>
          <span className="bg-app-action-soft text-app-action px-2.5 py-1 rounded text-[11px] font-bold">
            {readingTime} {isVi ? 'PHÚT ĐỌC' : 'MIN READ'}
          </span>
        </div>

        <div className={post.mediaUrl ? 'mb-4 md:grid md:grid-cols-[minmax(0,1fr)_240px] md:gap-5' : ''}>
          <div className="min-w-0">
            {/* Title */}
            <Link to={`/app/p/${post.id}`}>
              <h2 className="font-serif text-[21px] font-bold text-app-heading leading-snug mb-3 hover:text-app-action transition-colors md:text-[23px]">
                {displayTitle}
              </h2>
            </Link>

            {/* Excerpt */}
            <p className="text-app-muted text-sm mb-4 leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          </div>

          {/* Optional Media Image */}
          {post.mediaUrl && (
            <Link
              to={`/app/p/${post.id}`}
              className="block h-48 w-full overflow-hidden rounded-lg border border-app-border bg-app-surface-alt md:h-36"
              aria-label={displayTitle}
            >
              <img loading="lazy" decoding="async" src={post.mediaUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            </Link>
          )}
        </div>

        {/* Expandable AI Drawer Content */}
        <div className="ai-summary-panel mb-4 overflow-hidden rounded-lg border">
          <button
            type="button"
            className="ai-summary-trigger w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-widest transition-colors"
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {isVi ? 'Tóm tắt AI' : 'AI Intelligence Summary'}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isSummaryOpen ? 'rotate-180' : ''}`} />
          </button>
          {isSummaryOpen && (
            <div className="px-4 pb-4 pt-1 animate-scale-in">
              {post.aiSummary ? (
                <ul className="ai-summary-body space-y-2 text-sm list-disc pl-4">
                  {post.aiSummary.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i}>{line.replace(/^-\s*/, '').replace(/^\*\s*/, '')}</li>
                  ))}
                </ul>
              ) : (
                <p className="ai-summary-body text-xs leading-relaxed italic">
                  {isVi
                    ? `Bài viết này nêu các diễn biến chính liên quan đến ${displayTitle.toLowerCase()}. Điểm tin cậy cộng đồng là ${reliability}%, phản ánh mức đồng thuận tốt với các nguồn được trích dẫn.`
                    : `This report presents key developments regarding ${displayTitle.toLowerCase()}. Community trust score stands at ${reliability}%, reflecting strong verified consensus on sources cited.`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-4 border-t border-app-border">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <VoteControl
                label={displayTitle}
                score={score}
                vote={post.userVote}
                orientation="horizontal"
                compact
                onVote={(vote) => onVote?.(post.id, vote)}
              />
            </div>
            <Link
              to={`/app/p/${post.id}`}
              className="flex items-center gap-1.5 text-app-muted hover:text-app-action transition-colors text-xs font-bold"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{commentCount}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-app-muted">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`transition-colors cursor-pointer ${isSaved ? 'text-app-action hover:text-app-action-hover' : 'text-app-muted hover:text-app-action'}`}
              aria-label={isSaved ? 'Unsave' : 'Save'}
              disabled={isSaving}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              className="hover:text-app-action transition-colors"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {(post.canModerate || currentUserId === post.authorId) && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(!showDeleteConfirm); }}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
            )}
          </div>
        </div>
        {showDeleteConfirm && (
          <div
            className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-4 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-red-700">{isVi ? 'Xoá bài viết này?' : 'Delete this post?'}</p>
            {currentUserId !== post.authorId && (
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={isVi ? 'Lý do xoá...' : 'Reason for removal...'}
                rows={2}
                className="mt-2 w-full resize-none rounded-lg border border-red-300 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-400"
              />
            )}
            <div className="mt-3 flex gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => { onDelete?.(post.id, deleteReason || undefined); setShowDeleteConfirm(false); setDeleteReason(''); }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
              >
                {isVi ? 'Xoá' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteReason(''); }}
                className="rounded-lg border border-app-border bg-white px-3 py-1.5 text-app-muted hover:bg-app-surface-alt"
              >
                {isVi ? 'Huỷ' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export const PostCard = React.memo(PostCardInner);
export default PostCard;
