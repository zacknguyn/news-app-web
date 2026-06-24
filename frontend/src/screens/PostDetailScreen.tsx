import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Sparkles, ShieldCheck, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_POSTS } from '../lib/mockData';
import { CommentSection } from '../components/CommentSection';
import { AdCard } from '../components/AdCard';
import { Alert } from '../components/ui/Alert';
import { VoteControl } from '../components/ui/VoteControl';
import { ShareButton } from '../components/ui/ShareButton';
import { backendApi, type BackendAdCampaignDTO } from '../lib/api';
import { backendArticleToPost, backendPostToPost } from '../lib/backendAdapters';
import { addImageCaptions, isRichHtml, stripHtml } from '../lib/richContent';
import { useAuth } from '../context/AuthContext';
import { clearProgress } from '../lib/readingProgress';
import { getProfilePath } from '../lib/profileLinks';
import { getHighlightsForPost, saveHighlight, type SavedHighlight } from '../lib/highlights';
import { addRecentPost } from '../lib/recentlyViewed';
import type { Post } from '../types';

type SelectionMenu = {
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
};

const SELECTION_MENU_WIDTH = 280;

const applyHighlightsToHtml = (htmlContent: string, highlights: SavedHighlight[]): string => {
  if (!highlights || highlights.length === 0) return htmlContent;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
  const root = doc.body.firstChild as HTMLElement;

  if (!root) return htmlContent;

  const withOffsets = highlights.filter(h => h.start != null && h.end != null && h.start < h.end)
    .sort((a, b) => a.start! - b.start!);
  if (withOffsets.length === 0) return htmlContent;

  let globalOffset = 0;

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const nodeStart = globalOffset;
      const nodeEnd = globalOffset + text.length;
      globalOffset = nodeEnd;

      const overlapping = withOffsets.filter(h => h.start! < nodeEnd && h.end! > nodeStart);
      if (overlapping.length === 0) return;

      const fragment = document.createDocumentFragment();
      let cursor = 0;

      for (const hl of overlapping) {
        const hlStartInNode = Math.max(0, hl.start! - nodeStart);
        const hlEndInNode = Math.min(text.length, hl.end! - nodeStart);

        if (hlStartInNode > cursor) {
          fragment.appendChild(document.createTextNode(text.substring(cursor, hlStartInNode)));
        }

        const mark = document.createElement('mark');
        mark.className = 'reader-highlight-mark';
        mark.setAttribute('data-highlight-id', hl.id);
        mark.textContent = text.substring(hlStartInNode, hlEndInNode);
        fragment.appendChild(mark);

        cursor = hlEndInNode;
      }

      if (cursor < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(cursor)));
      }

      node.parentNode?.replaceChild(fragment, node);
    } else {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        walk(child);
      }
    }
  };

  walk(root);
  return root.innerHTML;
};

export const PostDetailScreen: React.FC = () => {
  const articleRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(() => MOCK_POSTS.find((candidate) => candidate.id === id) || null);
  const [isPostLoading, setIsPostLoading] = useState(true);
  const [postNotice, setPostNotice] = useState('');
  const [quoteDraft, setQuoteDraft] = useState<string | null>(null);
  const [isPostSaved, setIsPostSaved] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [savedHighlights, setSavedHighlights] = useState<SavedHighlight[]>([]);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenu | null>(null);

  const [activeSummary, setActiveSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isAiCollapsed, setIsAiCollapsed] = useState(false);
  const [sidebarAds, setSidebarAds] = useState<BackendAdCampaignDTO[]>([]);

  useEffect(() => {
    let active = true;
    backendApi.getActiveAds('feed', 0, 10).then((result) => {
      if (active) setSidebarAds(result.content ?? []);
    }).catch(() => {
      if (active) setSidebarAds([]);
    });
    return () => { active = false; };
  }, []);

  // Auto calculate credibility trust score
  const reliability = React.useMemo(() => {
    if (!post) return 93.8;
    const total = post.upvotes + post.downvotes;
    if (total === 0) return 93.8;
    const ratio = post.upvotes / total;
    return Number((90 + (ratio * 10)).toFixed(1));
  }, [post?.upvotes, post?.downvotes]);

  // Dynamically calculate excerpt/subtitle for editorial presentation
  const excerpt = React.useMemo(() => {
    if (!post) return '';
    const stripped = stripHtml(post.content);
    const firstPeriodIndex = stripped.indexOf('.');
    if (firstPeriodIndex !== -1 && firstPeriodIndex > 20 && firstPeriodIndex < 180) {
      return stripped.slice(0, firstPeriodIndex + 1);
    }
    return stripped.slice(0, 150) + '...';
  }, [post?.content]);

  // Unified rendered content with highlights applied
  const renderedContent = React.useMemo(() => {
    if (!post) return '';
    const contentWithCaptions = addImageCaptions(post.content);
    if (isRichHtml(post.content)) {
      return applyHighlightsToHtml(contentWithCaptions, savedHighlights);
    } else {
      const escaped = contentWithCaptions
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />');
      return applyHighlightsToHtml(escaped, savedHighlights);
    }
  }, [post?.content, savedHighlights]);

  useEffect(() => {
    let isMounted = true;
    const loadPost = async () => {
      if (!id) {
        setIsPostLoading(false);
        return;
      }
      setIsPostLoading(true);
      setPostNotice('');
      try {
        if (id.startsWith('article-')) {
          const articleId = Number(id.replace('article-', ''));
          if (Number.isNaN(articleId)) throw new Error('Article link is invalid.');
          const foundArticle = await backendApi.getArticle(articleId);
          if (isMounted) setPost(backendArticleToPost(foundArticle));
          backendApi.incrementArticleViews(articleId).catch(() => undefined);
          return;
        }
        const foundPost = await backendApi.getPost(id);
        if (isMounted) setPost(backendPostToPost(foundPost));
      } catch (error) {
        if (!isMounted) return;
        setPostNotice(error instanceof Error ? error.message : 'Backend detail unavailable. The post may have been removed or the server is offline.');
        setPost(null);
      } finally {
        if (isMounted) setIsPostLoading(false);
      }
    };
    loadPost();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const quote = (location.state as { quote?: string } | null)?.quote;
    if (quote) setQuoteDraft(quote);
  }, [location.state]);

  useEffect(() => {
    if (!post) return;
    let isMounted = true;
    getHighlightsForPost(post.id, post.backendArticleId)
      .then((highlights) => {
        if (isMounted) setSavedHighlights(highlights);
      })
      .catch(() => {
        if (isMounted) setSavedHighlights([]);
      });
    return () => {
      isMounted = false;
    };
  }, [post]);


  useEffect(() => {
    if (!post) return;
    addRecentPost(post.id, post.title, post.channelName, post.channelId);
  }, [post?.id]);

  useEffect(() => {
    let isMounted = true;
    if (!post) {
      setIsPostSaved(false);
      return;
    }

    if (!post.id.startsWith('article-')) {
      setIsPostSaved(Boolean(post.savedByMe));
      return;
    }

    const articleId = post.backendArticleId ? Number(post.backendArticleId) : null;
    if (!articleId || Number.isNaN(articleId)) {
      setIsPostSaved(false);
      return;
    }

    backendApi
      .getSavedArticles()
      .then((savedArticles) => {
        if (isMounted) setIsPostSaved(savedArticles.some((saved) => saved.article.id === articleId));
      })
      .catch(() => {
        if (isMounted) setIsPostSaved(false);
      });
    return () => {
      isMounted = false;
    };
  }, [post]);

  if (isPostLoading)
    return (
      <div className="px-6 py-20 flex justify-center items-center">
        <span className="swiss-loading text-sm">
          <span>.</span> Loading intelligence ledger...
        </span>
      </div>
    );

  if (!post) return <div className="px-6 py-20 text-sm italic text-app-faint">Dispatch ledger not found.</div>;

  const canDeletePost =
    !post.id.startsWith('article-') && Boolean(user && (user.role === 'ADMIN' || user.id === post.authorId || post.canModerate));
  const score = post.upvotes - post.downvotes;

  const handleVote = async (vote: 'up' | 'down') => {
    if (post.id.startsWith('article-')) {
      toast.message('Article votes are tracked through article views and comments.');
      return;
    }
    const previousPost = post;
    const previousVote = post.userVote;
    const clearedPost = {
      ...post,
      upvotes: previousVote === 'up' ? Math.max(0, post.upvotes - 1) : post.upvotes,
      downvotes: previousVote === 'down' ? Math.max(0, post.downvotes - 1) : post.downvotes,
    };
    setPost(
      previousVote === vote
        ? { ...clearedPost, userVote: null }
        : {
            ...clearedPost,
            upvotes: vote === 'up' ? clearedPost.upvotes + 1 : clearedPost.upvotes,
            downvotes: vote === 'down' ? clearedPost.downvotes + 1 : clearedPost.downvotes,
            userVote: vote,
          },
    );
    try {
      const voteResult = await backendApi.votePost(post.id, vote === 'up' ? 1 : -1);
      setPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              upvotes: Math.max(voteResult.score, 0),
              downvotes: Math.max(-voteResult.score, 0),
              userVote: voteResult.userVote === 1 ? 'up' : voteResult.userVote === -1 ? 'down' : null,
            }
          : currentPost,
      );
    } catch (error) {
      setPost(previousPost);
      toast.error(error instanceof Error ? error.message : 'Vote failed.');
    }
  };

  const handleToggleSavedPost = async () => {
    if (post.id.startsWith('article-')) {
      const articleId = post.backendArticleId ? Number(post.backendArticleId) : null;
      if (!articleId || Number.isNaN(articleId)) {
        toast.message('This article is not available for saving yet.');
        return;
      }
      const previousSavedState = isPostSaved;
      setIsPostSaved(!previousSavedState);
      setIsSavingPost(true);
      try {
        if (previousSavedState) await backendApi.unsaveArticle(articleId);
        else await backendApi.saveArticle(articleId);
        toast.success(previousSavedState ? 'Removed from saved dispatches.' : 'Saved dispatch.');
      } catch (error) {
        setIsPostSaved(previousSavedState);
        toast.error(error instanceof Error ? error.message : 'Unable to update saved article.');
      } finally {
        setIsSavingPost(false);
      }
      return;
    }

    const previousSavedState = isPostSaved;
    setIsPostSaved(!previousSavedState);
    setIsSavingPost(true);
    try {
      if (previousSavedState) await backendApi.unsavePost(post.id);
      else await backendApi.savePost(post.id);
      setPost((currentPost) => (currentPost ? { ...currentPost, savedByMe: !previousSavedState } : currentPost));
      toast.success(previousSavedState ? 'Removed from saved dispatches.' : 'Saved dispatch.');
    } catch (error) {
      setIsPostSaved(previousSavedState);
      toast.error(error instanceof Error ? error.message : 'Unable to update saved post.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const inspectSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    if (!selection || selection.rangeCount === 0 || selectedText.length < 2 || !articleRef.current) {
      setSelectionMenu(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setSelectionMenu(null);
      return;
    }
    const selectedNode =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;
    if (!selectedNode || !articleRef.current.contains(selectedNode)) {
      setSelectionMenu(null);
      return;
    }
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(articleRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const maxX = Math.max(16, window.innerWidth - SELECTION_MENU_WIDTH - 16);
    const x = Math.min(Math.max(16, rect.left + rect.width / 2 - SELECTION_MENU_WIDTH / 2), maxX);
    const preferredY = rect.top > 72 ? rect.top - 56 : rect.bottom + 12;
    const y = Math.min(Math.max(16, preferredY), window.innerHeight - 72);
    setSelectionMenu({ text: selectedText.slice(0, 500), start, end: start + selectedText.length, x, y });
  };

  const handleSaveHighlight = async () => {
    if (!selectionMenu) return;
    try {
      const created = await saveHighlight(post, selectionMenu.text, {
        start: selectionMenu.start,
        end: selectionMenu.end,
      });
      setSavedHighlights((current) => [created, ...current]);
      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
      toast.success('Highlight saved to private notebook.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Highlight failed.');
    }
  };

  const handleQuoteSelection = () => {
    if (!selectionMenu) return;
    setQuoteDraft(selectionMenu.text);
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerateSummary = async () => {
    if (!post || isSummaryLoading) return;
    setIsSummaryLoading(true);
    try {
      if (post.id.startsWith('article-')) {
        const articleId = post.backendArticleId ? Number(post.backendArticleId) : null;
        if (articleId) {
          const updatedArticle = await backendApi.summarizeArticle(articleId);
          setActiveSummary(updatedArticle.aiSummary || 'No summary returned.');
          setPost((current) => (current ? { ...current, aiSummary: updatedArticle.aiSummary || undefined } : current));
          toast.success('AI summary generated.');
        }
      } else {
        const postId = Number(post.id);
        if (!Number.isNaN(postId)) {
          const updatedPost = await backendApi.summarizePost(postId, 5, 'vi', true);
          setActiveSummary(updatedPost.aiSummary || 'No summary returned.');
          setPost((current) => (current ? { ...current, aiSummary: updatedPost.aiSummary || undefined } : current));
          toast.success('AI summary generated.');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate summary.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!canDeletePost || isDeletingPost) return;
    setIsDeletingPost(true);
    try {
      await backendApi.deletePost(post.id, deleteReason || undefined);
      await clearProgress(post.id).catch(() => undefined);
      toast.success('Dispatch deleted.');
      navigate('/app');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete dispatch.');
    } finally {
      setIsDeletingPost(false);
      setConfirmDelete(false);
      setDeleteReason('');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-app-bg text-app-heading">
        <main className="max-w-[1280px] mx-auto px-6 md:px-10 py-8 flex flex-col lg:flex-row gap-6 relative overflow-x-hidden">

          {/* Left Column: Article Content */}
          <article className="flex-1 max-w-[680px] pb-32 min-w-0">
            {postNotice && (
              <div className="mb-6">
                <Alert tone="warning">{postNotice}</Alert>
              </div>
            )}

            {/* Header Back / Action Control Bar */}
            <div className="flex items-center justify-between mb-8 py-2">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-app-faint hover:text-app-action uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSavedPost}
                  disabled={isSavingPost}
                  className={`p-2 rounded-full transition-all hover:bg-app-action-faint ${
                    isPostSaved
                      ? 'text-app-action'
                      : 'text-app-muted hover:text-app-action'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${isPostSaved ? 'fill-current' : ''}`} />
                </button>

                <ShareButton
                  title={post.title}
                  text={stripHtml(post.content).slice(0, 220)}
                  url={`/app/p/${post.id}`}
                  kind="post"
                  iconOnly={true}
                  className="p-2 text-app-muted hover:text-app-action hover:bg-app-action-faint rounded-full transition-all"
                  successMessage="Dispatch link copied to clipboard."
                />

                {canDeletePost && (
                  <button
                    onClick={() => setConfirmDelete(!confirmDelete)}
                    className="px-3.5 py-1.5 text-red-600 hover:bg-red-50 rounded-full text-xs font-bold transition-all"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Delete Confirm */}
            {confirmDelete && (
              <div className="mb-8 border border-red-200 bg-red-50 p-5 rounded-xl">
                <p className="text-sm font-semibold text-red-700">Delete this dispatch and its commentary history?</p>
                {user && user.id !== post.authorId && (
                  <textarea
                    value={deleteReason}
                    onChange={e => setDeleteReason(e.target.value)}
                    placeholder="Reason for removal (sent to author)..."
                    rows={2}
                    className="mt-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-400"
                  />
                )}
                <div className="mt-4 flex gap-3 text-xs font-bold uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    disabled={isDeletingPost}
                    className="bg-red-600 text-app-on-action px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(false); setDeleteReason(''); }}
                    className="bg-app-surface border border-app-border px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Metadata Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <img loading="lazy"
                  className="w-10 h-10 rounded-full border border-app-border object-cover animate-in fade-in"
                  src={post.author.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(post.author.username)}`}
                  alt=""
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <Link to={getProfilePath(post.author)} className="font-sans text-sm font-bold text-app-heading hover:text-app-action transition-colors">
                      {post.author.name}
                    </Link>
                    {post.author.isVerified && (
                      <span className="bg-app-action-soft text-app-action text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" /> EXPERT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-app-faint font-semibold uppercase tracking-wider">
                    Senior Intelligence Analyst • {post.author.trustScore} Karma
                  </p>
                </div>
              </div>
              <div className="h-4 w-[1px] bg-outline-variant/50"></div>
              <div className="flex items-center gap-1.5 text-app-muted text-[11px] font-bold tracking-wide">
                <span>⏱ 8 min read</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="serif-title text-4xl md:text-5xl font-black text-app-heading leading-tight mb-6 tracking-tight">
              {post.title}
            </h1>

            {/* Subtitle/Excerpt */}
            {excerpt && (
              <p className="text-xl text-app-muted italic mb-10 leading-relaxed bg-app-action-faint px-5 py-4 rounded-lg">
                {excerpt}
              </p>
            )}

            {/* Topic Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/app/tag/${tag.slug}`}
                    className="bg-app-surface border border-app-border px-3 py-1 rounded-full text-xs font-semibold text-app-muted hover:border-app-action transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Media Attachment */}
            {post.mediaUrl && post.mediaType === 'image' && (
              <figure className="my-12 rounded-xl overflow-hidden border border-app-border group relative">
                <img loading="lazy"
                  src={post.mediaUrl}
                  alt=""
                  className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-app-surface/80 backdrop-blur-md border-t border-app-border">
                  <p className="text-[11px] text-app-heading/80 uppercase font-semibold tracking-wider">
                    Fig 1.0: Real-time intelligence proof attached to ledger.
                  </p>
                </div>
              </figure>
            )}

            {/* Body Rich Text (Merriweather display) */}
            <div
              ref={articleRef}
              onMouseUp={() => window.setTimeout(inspectSelection, 80)}
              className="serif-title text-[18px] leading-[32px] text-app-heading space-y-8 select-text break-words"
            >
              <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
            </div>

            {/* Voting Bar in Article Footer */}
            <div className="mt-12 pt-6 border-t border-app-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <VoteControl label={post.title} score={score} vote={post.userVote} onVote={handleVote} orientation="horizontal" />
                <span className="text-xs text-app-faint font-semibold">Credibility Trust: {reliability}%</span>
              </div>
              <p className="text-[10px] text-app-faint font-bold uppercase tracking-widest">
                Ledger ID: {post.id}
              </p>
            </div>

            {/* Nested Commentary Stream */}
            <div id="comments" className="mt-16 border-t border-app-border pt-10">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-4 w-4 text-app-action" />
                <h3 className="font-sans text-sm font-bold text-app-heading uppercase tracking-widest">Nested Commentary</h3>
              </div>
              <CommentSection
                postId={post.id}
                backendArticleId={post.backendArticleId}
                postAuthorId={post.authorId}
                quoteDraft={quoteDraft}
                onQuoteDraftClear={() => setQuoteDraft(null)}
              />
            </div>
          </article>

          {/* floating select tooltip */}
          {selectionMenu && (
            <div
              className="fixed z-50 flex gap-2 border border-neutral-800 bg-neutral-900 text-app-on-action px-2 py-1.5 rounded-lg shadow-xl font-sans text-xs"
              style={{ left: selectionMenu.x, top: selectionMenu.y }}
            >
              <button
                type="button"
                onClick={handleSaveHighlight}
                className="flex items-center gap-1 px-3 py-1.5 hover:bg-app-surface/10 rounded-md transition-colors text-app-on-action font-bold cursor-pointer"
              >
                🖌 Highlight
              </button>
              <div className="w-[1px] h-4 bg-app-surface/20 my-auto" />
              <button
                type="button"
                onClick={handleQuoteSelection}
                className="flex items-center gap-1 px-3 py-1.5 hover:bg-app-surface/10 rounded-md transition-colors text-app-on-action font-bold cursor-pointer"
              >
                💬 Quote
              </button>
            </div>
          )}

          {/* Mobile Overlay for AI Drawer */}
          {!isAiCollapsed && (
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setIsAiCollapsed(true)}
            />
          )}

          {/* Right Column: AI Copilot Drawer */}
          <aside
            className={`fixed inset-y-0 right-0 z-50 lg:z-30 lg:sticky lg:top-24 h-screen lg:h-[calc(100vh-120px)] transition-all duration-300 ease-in-out shrink-0 flex flex-col ${
              isAiCollapsed
                ? 'w-0 pointer-events-none lg:w-16 lg:pointer-events-auto overflow-hidden'
                : 'w-[85vw] max-w-[340px]'
            }`}
          >
            <div className="bg-app-surface-alt border-l lg:border border-app-border lg:rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
              {/* Drawer Header */}
              <div className="p-5 border-b border-app-border flex justify-between items-center bg-app-surface/80">
                {!isAiCollapsed ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-app-action h-4.5 w-4.5" />
                      <span className="font-sans text-sm font-bold text-app-heading uppercase tracking-widest">AI Copilot</span>
                    </div>
                    <button
                      onClick={() => setIsAiCollapsed(true)}
                      className="p-1 hover:bg-app-surface-alt rounded-md transition-all text-app-muted hover:text-app-heading"
                      title="Collapse drawer"
                    >
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsAiCollapsed(false)}
                    className="w-full flex items-center justify-center py-2 hover:bg-app-surface-alt rounded-md transition-all text-app-muted hover:text-app-heading"
                    title="Expand drawer"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>

              {!isAiCollapsed && (
                <>
                  {/* Scrollable Intelligence Content */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                    {/* AI SUMMARY */}
                    <section>
                      <h3 className="font-sans text-[10px] text-app-action mb-4 uppercase tracking-widest flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 bg-app-action rounded-full"></span>
                        AI Summary
                      </h3>
                      {activeSummary ? (
                        <div className="space-y-3">
                          <div className="text-xs leading-relaxed text-app-muted bg-app-surface p-4 rounded-xl border border-app-border shadow-[0_2px_4px_rgba(0,0,0,0.02)] whitespace-pre-wrap">
                            {activeSummary}
                          </div>
                          <button
                            onClick={handleGenerateSummary}
                            disabled={isSummaryLoading}
                            className="text-[10px] text-app-action hover:underline font-bold flex items-center gap-1 mt-1 disabled:opacity-50"
                          >
                            {isSummaryLoading ? 'Regenerating...' : '✦ Regenerate Summary'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateSummary}
                          disabled={isSummaryLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-app-action text-app-on-action hover:bg-app-action-hover rounded-xl font-bold text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                        >
                          {isSummaryLoading ? (
                            <>
                              <span className="animate-spin text-sm">✦</span>
                              <span>Summarizing Dispatch...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              <span>Generate AI Summary</span>
                            </>
                          )}
                        </button>
                      )}
                    </section>

                    {/* Sponsored */}
                    {sidebarAds.length > 0 && (
                      <section>
                        <h3 className="font-sans text-[10px] text-app-action mb-4 uppercase tracking-widest flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          Sponsored
                        </h3>
                        <AdCard ad={sidebarAds[0]} compact />
                      </section>
                    )}

                    {/* Private Notebook Highlights */}
                    <section className="bg-app-surface p-4 rounded-xl border border-app-border">
                      <h3 className="font-sans text-[10px] text-app-action uppercase tracking-widest font-bold mb-3 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-app-action rounded-full"></span>
                        Notebook Highlights ({savedHighlights.length})
                      </h3>
                      {savedHighlights.length > 0 ? (
                        <div className="space-y-3.5 max-h-48 overflow-y-auto scrollbar-hide">
                          {savedHighlights.map((hl) => (
                            <div key={hl.id} className="p-3 bg-app-action-faint rounded-lg text-xs leading-relaxed text-app-muted italic">
                              "{hl.text}"
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-app-faint italic">Select any text in the article and click "Highlight" to add it to your research notebook.</p>
                      )}
                    </section>
                  </div>
                </>
              )}
            </div>
          </aside>
        </main>

        {/* Mobile FAB for AI Chat */}
        <button
          onClick={() => setIsAiCollapsed(false)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-app-action text-app-on-action rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      </div>
    </>
  );
};

export default PostDetailScreen;
