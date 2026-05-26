import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MOCK_POSTS } from '../lib/mockData';
import { ArrowLeft, Share2, ShieldCheck, BookOpen, Copy, MessageSquareQuote, Highlighter, Info, X, SlidersHorizontal, Bookmark } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { Alert } from '../components/ui/Alert';
import { Tooltip } from '../components/ui/Tooltip';
import { usePageMotion } from '../hooks/usePageMotion';
import { readProgress, saveProgress } from '../lib/readingProgress';
import { getHighlightsForPost, saveHighlight, type SavedHighlight } from '../lib/highlights';
import { readReaderSettings, saveReaderSettings, type ReaderSettings } from '../lib/readerSettings';
import { getPostTrust } from '../lib/trust';
import { TrustLabel } from '../components/ui/TrustLabel';
import { VoteControl } from '../components/ui/VoteControl';
import { backendApi } from '../lib/api';
import { backendPostToPost } from '../lib/backendAdapters';
import type { Post } from '../types';

type SelectionMenu = {
  text: string;
  x: number;
  y: number;
  start: number;
  end: number;
};

type ArticleSegment = {
  text: string;
  highlight?: SavedHighlight;
};

const buildHighlightedSegments = (content: string, highlights: SavedHighlight[]): ArticleSegment[] => {
  const matches = highlights
    .map((highlight) => {
      const start = typeof highlight.start === 'number' ? highlight.start : content.indexOf(highlight.text);
      const end = typeof highlight.end === 'number' ? highlight.end : start + highlight.text.length;
      return start >= 0 ? { start, end, highlight } : null;
    })
    .filter((match): match is { start: number; end: number; highlight: SavedHighlight } => Boolean(match))
    .sort((a, b) => a.start - b.start);

  const segments: ArticleSegment[] = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start < cursor) return;
    if (match.start > cursor) segments.push({ text: content.slice(cursor, match.start) });
    segments.push({ text: content.slice(match.start, match.end), highlight: match.highlight });
    cursor = match.end;
  });

  if (cursor < content.length) segments.push({ text: content.slice(cursor) });
  return segments.length ? segments : [{ text: content }];
};

const readerThemeClasses: Record<ReaderSettings['theme'], string> = {
  light: 'bg-[var(--color-paper)] text-[var(--color-ink)]',
  paper: 'bg-[var(--color-reader-paper)] text-[var(--color-reader-paper-ink)]',
  night: 'bg-[var(--color-reader-night)] text-zinc-100',
};

const readerTextClasses = (settings: ReaderSettings) => [
  settings.family === 'serif' ? 'reader-serif' : 'reader-sans',
  settings.size === 'large' ? 'text-2xl' : 'text-xl',
  settings.lineHeight === 'open' ? 'leading-[2.35]' : 'leading-10',
  settings.theme === 'night' ? 'text-zinc-200' : 'text-zinc-700',
].join(' ');

export const PostDetailScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const articleTextRef = useRef<HTMLDivElement>(null);
  const lastSavedProgressRef = useRef({ scrollY: -1, progress: -1, time: 0 });
  const { id } = useParams();
  const location = useLocation();
  const [post, setPost] = useState<Post | null>(() => MOCK_POSTS.find(p => p.id === id) || null);
  const [isPostLoading, setIsPostLoading] = useState(true);
  const [postNotice, setPostNotice] = useState('');
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenu | null>(null);
  const [quoteDraft, setQuoteDraft] = useState<string | null>(null);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [isTrustOpen, setIsTrustOpen] = useState(false);
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [readingPercent, setReadingPercent] = useState(0);
  const [isArticleSaved, setIsArticleSaved] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => readReaderSettings());
  const [savedHighlights, setSavedHighlights] = useState<SavedHighlight[]>([]);

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
        const foundPost = await backendApi.getPost(id);
        if (!isMounted) return;
        setPost(backendPostToPost(foundPost));
      } catch (error) {
        if (!isMounted) return;
        const fallbackPost = MOCK_POSTS.find(candidate => candidate.id === id) || null;
        setPost(fallbackPost);
        setPostNotice(error instanceof Error ? error.message : 'Backend detail unavailable. Showing local preview data.');
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
    if (!post) return;
    let isMounted = true;

    getHighlightsForPost(post.id)
      .then(highlights => {
        if (isMounted) setSavedHighlights(highlights);
      })
      .catch(() => {
        if (isMounted) setSavedHighlights([]);
      });

    return () => {
      isMounted = false;
    };
  }, [post?.id]);

  useEffect(() => {
    let isMounted = true;
    const articleId = post?.backendArticleId ? Number(post.backendArticleId) : null;

    if (!articleId || Number.isNaN(articleId)) {
      setIsArticleSaved(false);
      return;
    }

    const loadSavedState = async () => {
      try {
        const savedArticles = await backendApi.getSavedArticles();
        if (!isMounted) return;
        setIsArticleSaved(savedArticles.some(saved => saved.article.id === articleId));
      } catch {
        if (isMounted) setIsArticleSaved(false);
      }
    };

    loadSavedState();

    return () => {
      isMounted = false;
    };
  }, [post?.backendArticleId]);

  useEffect(() => {
    const quote = (location.state as { quote?: string } | null)?.quote;
    if (!quote) return;

    setQuoteDraft(quote);
    setIsDiscussionOpen(true);
    window.setTimeout(() => {
      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, [location.state]);

  useEffect(() => {
    saveReaderSettings(readerSettings);
  }, [readerSettings]);

  useEffect(() => {
    if (!post) return;

    let cancelled = false;

    readProgress()
      .then(saved => {
        if (cancelled || saved?.postId !== post.id || saved.scrollY <= 0) return;
        window.requestAnimationFrame(() => {
          if (cancelled) return;
          const scroller = document.querySelector('main') as HTMLElement | null;
          scroller?.scrollTo({ top: saved.scrollY, behavior: 'auto' });
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [post?.id]);

  useEffect(() => {
    if (!post) return;

    const scroller = document.querySelector('main') as HTMLElement | null;
    if (!scroller) return;

    let frame = 0;
    const trackProgress = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
        const progress = Math.min(100, Math.max(0, Math.round((scroller.scrollTop / maxScroll) * 100)));
        const now = Date.now();
        const previous = lastSavedProgressRef.current;
        setReadingPercent(progress);
        if (
          Math.abs(progress - previous.progress) >= 2 ||
          Math.abs(scroller.scrollTop - previous.scrollY) >= 240 ||
          now - previous.time >= 1200
        ) {
          saveProgress({
            postId: post.id,
            articleId: post.backendArticleId,
            scrollY: scroller.scrollTop,
            progress,
          }).catch(() => undefined);
          lastSavedProgressRef.current = { scrollY: scroller.scrollTop, progress, time: now };
        }
        frame = 0;
      });
    };

    trackProgress();
    scroller.addEventListener('scroll', trackProgress, { passive: true });

    return () => {
      scroller.removeEventListener('scroll', trackProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [post]);

  useEffect(() => {
    document.body.classList.toggle('reading-mode-active', isReadingMode);

    return () => {
      document.body.classList.remove('reading-mode-active');
    };
  }, [isReadingMode]);

  useEffect(() => {
    if (!isReadingMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsReadingMode(false);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isReadingMode]);

  useEffect(() => {
    if (!post) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectionMenu) {
        setSelectionMenu(null);
        clearNativeSelection();
      }
    };

    const inspectAfterSelectionSettles = () => {
      window.setTimeout(inspectSelection, 80);
    };

    document.addEventListener('selectionchange', inspectAfterSelectionSettles);
    document.addEventListener('pointerup', inspectAfterSelectionSettles);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('selectionchange', inspectAfterSelectionSettles);
      document.removeEventListener('pointerup', inspectAfterSelectionSettles);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [post?.id, selectionMenu]);

  if (isPostLoading) return <div className="p-20 text-center text-sm font-semibold text-[var(--color-app-muted)]">Loading transmission</div>;
  if (!post) return <div className="p-20 text-center text-sm font-semibold text-[var(--color-app-muted)]">Transmission lost: post not found</div>;

  const trust = getPostTrust(post);
  const trustScore = post.upvotes - post.downvotes;
  const highlightCount = savedHighlights.length;
  const highlightedSegments = buildHighlightedSegments(post.content, savedHighlights);
  const readerShellClass = isReadingMode ? readerThemeClasses[readerSettings.theme] : '';

  const clearNativeSelection = () => {
    window.getSelection()?.removeAllRanges();
  };

  const getSelectionOffsets = (range: Range) => {
    if (!articleTextRef.current) return null;

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(articleTextRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + range.toString().length;

    return { start, end };
  };

  const inspectSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    if (!selection || selection.rangeCount === 0 || selectedText.length < 2 || !articleTextRef.current) {
      setSelectionMenu(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedNode = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer;

    if (!selectedNode || !articleTextRef.current.contains(selectedNode)) {
      setSelectionMenu(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setSelectionMenu(null);
      return;
    }

    const offsets = getSelectionOffsets(range);
    if (!offsets) {
      setSelectionMenu(null);
      return;
    }

    setSelectionMenu({
      text: selectedText.slice(0, 500),
      x: Math.min(window.innerWidth - 24, Math.max(24, rect.left + rect.width / 2)),
      y: Math.max(76, rect.top - 12),
      start: offsets.start,
      end: offsets.end,
    });
  };

  const handleSaveHighlight = async () => {
    if (!selectionMenu) return;
    try {
      const created = await saveHighlight(post, selectionMenu.text, { start: selectionMenu.start, end: selectionMenu.end });
      setSavedHighlights(current => [created, ...current]);
      toast.success('Highlight saved.');
      setSelectionMenu(null);
      clearNativeSelection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Highlight failed.');
    }
  };

  const handleCopySelection = async () => {
    if (!selectionMenu || !navigator.clipboard) return;
    await navigator.clipboard.writeText(selectionMenu.text);
    toast.success('Copied selected text.');
    setSelectionMenu(null);
    clearNativeSelection();
  };

  const handleQuoteComment = () => {
    if (!selectionMenu) return;
    setQuoteDraft(selectionMenu.text);
    setIsDiscussionOpen(true);
    setSelectionMenu(null);
    clearNativeSelection();
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openDiscussion = () => {
    setIsDiscussionOpen(true);
    window.setTimeout(() => {
      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleVote = async (vote: 'up' | 'down') => {
    const previousPost = post;
    const previousVote = post.userVote;
    const clearedPost = {
      ...post,
      upvotes: previousVote === 'up' ? Math.max(0, post.upvotes - 1) : post.upvotes,
      downvotes: previousVote === 'down' ? Math.max(0, post.downvotes - 1) : post.downvotes,
    };

    setPost(previousVote === vote
      ? { ...clearedPost, userVote: null }
      : {
        ...clearedPost,
        upvotes: vote === 'up' ? clearedPost.upvotes + 1 : clearedPost.upvotes,
        downvotes: vote === 'down' ? clearedPost.downvotes + 1 : clearedPost.downvotes,
        userVote: vote,
    });

    try {
      const voteResult = await backendApi.votePost(post.id, vote === 'up' ? 1 : -1);
      setPost(currentPost => currentPost ? {
        ...currentPost,
        upvotes: Math.max(voteResult.score, 0),
        downvotes: Math.max(-voteResult.score, 0),
        userVote: voteResult.userVote === 1 ? 'up' : voteResult.userVote === -1 ? 'down' : null,
      } : currentPost);
    } catch (error) {
      setPost(previousPost);
      toast.error(error instanceof Error ? error.message : 'Vote failed.');
    }
  };

  const handleToggleSavedArticle = async () => {
    const articleId = post.backendArticleId ? Number(post.backendArticleId) : null;
    if (!articleId || Number.isNaN(articleId)) {
      toast.message('This post is not attached to a backend article yet.');
      return;
    }

    const previousSavedState = isArticleSaved;
    setIsArticleSaved(!previousSavedState);
    setIsSavingArticle(true);
    setPostNotice('');

    try {
      if (previousSavedState) {
        await backendApi.unsaveArticle(articleId);
      } else {
        await backendApi.saveArticle(articleId);
      }
      toast.success(previousSavedState ? 'Removed from saved articles.' : 'Saved article.');
    } catch (error) {
      setIsArticleSaved(previousSavedState);
      toast.error(error instanceof Error ? error.message : 'Unable to update saved article.');
    } finally {
      setIsSavingArticle(false);
    }
  };

  const updateReaderSettings = <Key extends keyof ReaderSettings>(key: Key, value: ReaderSettings[Key]) => {
    setReaderSettings(prev => ({ ...prev, [key]: value }));
  };

  const quoteHighlight = (text: string) => {
    setQuoteDraft(text);
    setIsDiscussionOpen(true);
    window.setTimeout(() => {
      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const readerInactiveControl = 'border border-[var(--color-reader-border)] text-[var(--color-reader-muted)] hover:border-[var(--color-reader-control)] hover:text-[var(--color-reader-ink)]';
  const readerActiveControl = 'bg-[var(--color-reader-control)] text-[var(--color-reader-control-text)]';
  const readerSecondaryText = 'text-[var(--color-reader-muted)]';

  const readerControls = (
    <>
      {(['regular', 'large'] as const).map(size => (
        <button
          key={size}
          type="button"
          onClick={() => updateReaderSettings('size', size)}
          aria-pressed={readerSettings.size === size}
          className={`min-h-10 px-3 py-1 text-sm font-semibold sm:min-h-8 ${readerSettings.size === size ? readerActiveControl : readerInactiveControl}`}
        >
          {size === 'regular' ? 'A' : 'A+'}
        </button>
      ))}
      {(['serif', 'sans'] as const).map(family => (
        <button
          key={family}
          type="button"
          onClick={() => updateReaderSettings('family', family)}
          aria-pressed={readerSettings.family === family}
          className={`min-h-10 px-3 py-1 text-sm font-semibold sm:min-h-8 ${readerSettings.family === family ? readerActiveControl : readerInactiveControl}`}
        >
          {family}
        </button>
      ))}
      {(['light', 'paper', 'night'] as const).map(theme => (
        <button
          key={theme}
          type="button"
          onClick={() => updateReaderSettings('theme', theme)}
          aria-pressed={readerSettings.theme === theme}
          className={`min-h-10 px-3 py-1 text-sm font-semibold capitalize sm:min-h-8 ${readerSettings.theme === theme ? readerActiveControl : readerInactiveControl}`}
        >
          {theme}
        </button>
      ))}
      <button
        type="button"
        onClick={() => updateReaderSettings('lineHeight', readerSettings.lineHeight === 'relaxed' ? 'open' : 'relaxed')}
        aria-pressed={readerSettings.lineHeight === 'open'}
        className={`min-h-10 px-3 py-1 text-sm font-semibold sm:min-h-8 ${readerInactiveControl}`}
      >
        Line
      </button>
    </>
  );

  return (
    <div
      ref={pageRef}
      data-reader-theme={isReadingMode ? readerSettings.theme : undefined}
      className={`mx-auto px-4 py-7 sm:px-6 sm:py-9 ${isReadingMode ? `reader-theme-scope min-h-dvh max-w-none ${readerShellClass}` : 'max-w-3xl'}`}
    >
      <div className="fixed left-0 right-0 top-0 z-30 h-1 bg-[var(--color-reader-progress-track)]">
        <div
          className="h-full bg-[var(--color-reader-progress-fill)] transition-[width]"
          style={{ width: `${readingPercent}%` }}
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={readingPercent}
        />
      </div>

      {selectionMenu && (
        <div
          role="toolbar"
          aria-label="Selected text actions"
          className="fixed z-40 flex -translate-x-1/2 -translate-y-full items-center gap-1 border border-[var(--color-reader-border)] bg-[var(--color-reader-popover)] p-1 text-[var(--color-reader-popover-text)] shadow-xl"
          style={{ left: selectionMenu.x, top: selectionMenu.y }}
        >
          <Tooltip label="Save selected text" side="bottom">
            <button type="button" onClick={handleSaveHighlight} aria-label="Save selected text as highlight" className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold hover:bg-[var(--color-reader-surface-lift)]/20">
              <Highlighter className="h-3.5 w-3.5" />
              Highlight
            </button>
          </Tooltip>
          <Tooltip label="Quote in discussion" side="bottom">
            <button type="button" onClick={handleQuoteComment} aria-label="Quote selected text in a comment" className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold hover:bg-[var(--color-reader-surface-lift)]/20">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              Comment
            </button>
          </Tooltip>
          <Tooltip label="Copy selected text" side="bottom">
            <button type="button" onClick={handleCopySelection} aria-label="Copy selected text" className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold hover:bg-[var(--color-reader-surface-lift)]/20">
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </Tooltip>
        </div>
      )}

      {postNotice && !isReadingMode && (
        <Alert tone="warning" className="mb-5">
          {postNotice}
        </Alert>
      )}

      {isReadingMode && (
        <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-[var(--color-reader-border)] bg-[var(--color-reader-surface)]/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
            <Link to="/app" className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm hover:bg-[var(--color-reader-surface-lift)] hover:text-[var(--color-reader-ink)] sm:min-h-8 sm:min-w-8 ${readerSecondaryText}`}>
              <span className="sr-only">Back to feed</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsReadingMode(false)}
              className={`min-h-10 px-3 py-1.5 text-sm font-semibold sm:min-h-8 ${readerInactiveControl}`}
            >
              Exit
            </button>
            <div className="min-w-0 flex-1 px-2">
              <div className="h-1 overflow-hidden rounded-full bg-[var(--color-reader-progress-track)]">
                <div className="h-full bg-[var(--color-reader-progress-fill)]" style={{ width: `${readingPercent}%` }} />
              </div>
            </div>
            <span className={`hidden text-sm font-semibold sm:inline ${readerSecondaryText}`}>
              {readingPercent}%
            </span>
            <Tooltip label="Open discussion" side="bottom">
              <button
                type="button"
                onClick={openDiscussion}
                className="hidden min-h-10 bg-[var(--color-comment-ink)] px-3 py-1.5 text-sm font-semibold text-[var(--color-comment-surface)] hover:opacity-90 sm:inline-flex sm:min-h-8"
              >
                Discussion
              </button>
            </Tooltip>
            <Link to="/app/highlights" className={`hidden min-h-10 px-3 py-1.5 text-sm font-semibold sm:inline-flex sm:min-h-8 ${readerInactiveControl}`}>
              {highlightCount} Notes
            </Link>
            <Tooltip label="Reader settings" side="bottom">
              <button
                type="button"
                onClick={() => setIsReaderSettingsOpen(prev => !prev)}
                aria-expanded={isReaderSettingsOpen}
                className={`ml-auto min-h-11 min-w-11 rounded-sm p-1.5 sm:hidden ${readerInactiveControl}`}
                aria-label="Reader settings"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </Tooltip>
            <div className="ml-auto hidden items-center gap-1 sm:flex">
              {readerControls}
            </div>
            {isReaderSettingsOpen && (
              <div className="grid w-full grid-cols-2 gap-2 border-t border-[var(--color-reader-border)] pt-2 sm:hidden">
                <button
                  type="button"
                  onClick={openDiscussion}
                  className="min-h-10 bg-[var(--color-comment-ink)] px-3 py-1.5 text-sm font-semibold text-[var(--color-comment-surface)]"
                >
                  Discussion
                </button>
                <Link to="/app/highlights" className={`inline-flex min-h-10 items-center justify-center px-3 py-1.5 text-sm font-semibold ${readerInactiveControl}`}>
                  {highlightCount} Notes
                </Link>
                {readerControls}
              </div>
            )}
          </div>
        </div>
      )}

      <Link data-motion="page" to="/app" className={`mb-7 items-center gap-2 text-sm font-semibold text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-ink)] ${isReadingMode ? 'hidden' : 'inline-flex'}`}>
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <article className={`space-y-6 ${isReadingMode ? 'mx-auto max-w-5xl' : ''}`}>
        <header data-motion="page" className={isReadingMode ? 'space-y-5 border-b border-[var(--color-reader-border-clean)] pb-6' : 'space-y-3'}>
          <div className={`flex items-center gap-2 text-sm ${isReadingMode ? 'text-[var(--color-reader-muted)]' : 'text-[var(--color-app-muted)]'}`}>
            <span className={isReadingMode ? 'font-bold text-[var(--color-reader-ink)]' : 'font-bold text-[var(--color-app-ink)]'}>{post.channelName}</span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <Tooltip label="View trust details" side="bottom">
                <button
                  type="button"
                  onClick={() => setIsTrustOpen(true)}
                  className="ml-auto inline-flex items-center gap-1"
                >
                  <TrustLabel trust={trust} />
                  <Info className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
          </div>
          
          <h1 className={`${isReadingMode ? 'reader-serif max-w-3xl text-4xl font-semibold text-[var(--color-reader-ink)] sm:text-5xl' : 'text-3xl font-semibold text-[var(--color-app-ink)] sm:text-4xl'} leading-tight`}>
            {post.title}
          </h1>

          <div className={`flex flex-wrap items-center justify-between gap-3 border-y border-[var(--color-app-border-clean)] py-4 ${isReadingMode ? 'hidden' : ''}`}>
            <Link to={`/app/u/${post.author.username}`} className="flex items-center gap-3 group">
              <img src={post.author.avatarUrl} className="h-9 w-9 rounded-full grayscale transition-all group-hover:grayscale-0" alt="" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm group-hover:underline">@{post.author.username}</span>
                  {post.author.isVerified && <ShieldCheck className="w-4 h-4 text-[var(--color-app-action)]" />}
                </div>
                <span className="text-xs text-[var(--color-app-muted)]">Trust score: {post.author.trustScore}</span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Tooltip label="Open reader mode" side="top">
                <button
                  type="button"
                  onClick={() => setIsReadingMode(prev => !prev)}
                  aria-pressed={isReadingMode}
                  className={`flex min-h-10 items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-normal transition-colors ${isReadingMode ? 'border border-[var(--color-app-action)] bg-[var(--color-app-action)] text-white' : 'border border-[var(--color-app-border)] bg-white text-[var(--color-app-muted)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-app-action)]'}`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Read</span>
                </button>
              </Tooltip>
              {post.backendArticleId && (
                <Tooltip label={isArticleSaved ? 'Remove saved article' : 'Save article'} side="top">
                  <button
                    type="button"
                    onClick={handleToggleSavedArticle}
                    disabled={isSavingArticle}
                    aria-pressed={isArticleSaved}
                    className={`flex min-h-10 items-center gap-2 rounded-[4px] border px-3 py-2 text-sm font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      isArticleSaved
                        ? 'border-[var(--color-app-action)] bg-[rgb(49_38_59/0.08)] text-[var(--color-app-action)]'
                        : 'border-[var(--color-app-border)] bg-white text-[var(--color-app-muted)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-app-action)]'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${isArticleSaved ? 'fill-current' : ''}`} />
                    <span>{isArticleSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </Tooltip>
              )}
              <VoteControl label={post.title} score={post.upvotes - post.downvotes} vote={post.userVote} orientation="horizontal" onVote={handleVote} />
              <Tooltip label="Share article" side="top">
                <button type="button" aria-label={`Share ${post.title}`} className="flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--color-app-border)] bg-white px-3 py-2 text-[var(--color-app-muted)] transition-colors hover:bg-[var(--color-off-white)] hover:text-[var(--color-app-action)] sm:min-h-8">
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">Share</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </header>

        <div data-motion="page">
          {isTrustOpen && (
            <section className="mb-5 border border-[var(--color-reader-border)] bg-[var(--color-reader-surface-lift)] p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-reader-ink)]">Trust signal</h2>
                  <p className="mt-1 text-sm text-[var(--color-reader-muted)]">This post is marked {trust.label.toLowerCase()} from live community signals in the prototype.</p>
                </div>
                <button type="button" onClick={() => setIsTrustOpen(false)} aria-label="Close trust signal details" className="min-h-11 min-w-11 rounded-sm p-1 text-[var(--color-reader-muted)] hover:bg-[var(--color-reader-surface)] hover:text-[var(--color-reader-ink)] sm:min-h-7 sm:min-w-7">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="border border-[var(--color-reader-border)] bg-[var(--color-reader-surface)] p-3">
                  <div className="text-xs font-semibold text-[var(--color-reader-faint)]">Net score</div>
                  <div className="mt-1 text-lg font-bold text-[var(--color-reader-ink)]">{trustScore}</div>
                </div>
                <div className="border border-[var(--color-reader-border)] bg-[var(--color-reader-surface)] p-3">
                  <div className="text-xs font-semibold text-[var(--color-reader-faint)]">Challenge rate</div>
                  <div className="mt-1 text-lg font-bold text-[var(--color-reader-ink)]">{Math.round((post.downvotes / Math.max(1, post.upvotes + post.downvotes)) * 100)}%</div>
                </div>
                <div className="border border-[var(--color-reader-border)] bg-[var(--color-reader-surface)] p-3">
                  <div className="text-xs font-semibold text-[var(--color-reader-faint)]">Reader notes</div>
                  <div className="mt-1 text-lg font-bold text-[var(--color-reader-ink)]">{highlightCount}</div>
                </div>
              </div>
            </section>
          )}

          <div className={isReadingMode ? 'grid gap-8 xl:grid-cols-[minmax(0,68ch)_18rem]' : ''}>
            <div ref={articleTextRef} className={isReadingMode ? 'max-w-[68ch]' : 'max-w-none'}>
              <p className={`whitespace-pre-wrap ${isReadingMode ? readerTextClasses(readerSettings) : 'reader-serif text-lg leading-8 text-[var(--color-app-ink)]'}`}>
                {isReadingMode
                  ? highlightedSegments.map((segment, index) => segment.highlight ? (
                    <mark
                      key={`${segment.highlight.id}-${index}`}
                      className="rounded-sm bg-[var(--color-reader-highlight)] px-0.5 text-inherit"
                    >
                      {segment.text}
                    </mark>
                  ) : (
                    <React.Fragment key={`segment-${index}`}>{segment.text}</React.Fragment>
                  ))
                  : post.content}
              </p>
            </div>

            {isReadingMode && (
              <aside className="hidden xl:block">
                <div className="sticky top-20 border border-[var(--color-reader-border)] bg-[var(--color-reader-surface-lift)]/70 p-3">
                  <div className={`mb-3 text-sm font-semibold ${readerSecondaryText}`}>
                    Margin notes
                  </div>
                  {savedHighlights.length === 0 ? (
                    <p className={`text-sm leading-6 ${readerSecondaryText}`}>Select article text to save highlights here.</p>
                  ) : (
                    <div className="space-y-3">
                      {savedHighlights.slice(0, 5).map(highlight => (
                        <div key={highlight.id} className="space-y-2 border-l border-[var(--color-reader-progress-fill)] pl-3">
                          <blockquote className="text-sm leading-6 text-[var(--color-reader-muted)]">
                            {highlight.text}
                          </blockquote>
                          {highlight.note && (
                            <p className={`text-xs leading-5 ${readerSecondaryText}`}>{highlight.note}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => quoteHighlight(highlight.text)}
                            className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--color-reader-progress-fill)] hover:text-[var(--color-reader-control-hover)] sm:min-h-8"
                          >
                            Quote in discussion
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>

          <div id="comments">
            {isReadingMode && !isDiscussionOpen ? (
              <section className="mt-10 border-t border-[var(--color-comment-border-clean)] pt-6 text-center">
                <button
                  type="button"
                  onClick={openDiscussion}
                  className="inline-flex min-h-10 items-center justify-center bg-[var(--color-comment-ink)] px-4 py-2 text-sm font-semibold text-[var(--color-comment-surface)] hover:opacity-90"
                >
                  Open discussion
                </button>
              </section>
            ) : (
              <CommentSection
                postId={post.id}
                backendArticleId={post.backendArticleId}
                postAuthorId={post.authorId}
                quoteDraft={quoteDraft}
                onQuoteDraftClear={() => setQuoteDraft(null)}
              />
            )}
          </div>
        </div>
      </article>
    </div>
  );
};
