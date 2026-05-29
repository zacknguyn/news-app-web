import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MOCK_POSTS } from '../lib/mockData';
import { ArrowLeft, ShieldCheck, BookOpen, Copy, MessageSquareQuote, Highlighter, Info, X, SlidersHorizontal, Bookmark, Trash2, MessageSquare, StickyNote } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { Alert } from '../components/ui/Alert';
import { Tooltip } from '../components/ui/Tooltip';
import { usePageMotion } from '../hooks/usePageMotion';
import { clearProgress, readProgress, saveProgress } from '../lib/readingProgress';
import { getHighlightsForPost, saveHighlight, type SavedHighlight } from '../lib/highlights';
import { readReaderSettings, saveReaderSettings, subscribeReaderSettings, type ReaderSettings } from '../lib/readerSettings';
import { getPostTrust } from '../lib/trust';
import { TrustLabel } from '../components/ui/TrustLabel';
import { VoteControl } from '../components/ui/VoteControl';
import { ShareButton } from '../components/ui/ShareButton';
import { backendApi } from '../lib/api';
import { backendArticleToPost, backendPostToPost } from '../lib/backendAdapters';
import { addImageCaptions, isRichHtml, stripHtml } from '../lib/richContent';
import { readAppPreferences, subscribeAppPreferences, type AppPreferences } from '../lib/appPreferences';
import { useAuth } from '../context/AuthContext';
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

type ArticleMarkRange = {
  start: number;
  end: number;
  highlight?: SavedHighlight;
};

const READER_MODE_SESSION_KEY = 'tourane-reader-mode-active';

const readReaderModeSession = () => {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(READER_MODE_SESSION_KEY) === 'true';
};

const buildArticleMarkRanges = (contentText: string, highlights: SavedHighlight[]): ArticleMarkRange[] => (
  highlights.flatMap<ArticleMarkRange>((highlight) => {
      const start = typeof highlight.start === 'number' ? highlight.start : contentText.indexOf(highlight.text);
      const end = typeof highlight.end === 'number' ? highlight.end : start + highlight.text.length;
      return start >= 0 && end > start ? [{ start, end, highlight }] : [];
    })
    .sort((a, b) => a.start - b.start)
);

const buildHighlightedSegments = (
  content: string,
  highlights: SavedHighlight[]
): ArticleSegment[] => {
  const matches = buildArticleMarkRanges(content, highlights);

  const segments: ArticleSegment[] = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start < cursor) return;
    if (match.start > cursor) segments.push({ text: content.slice(cursor, match.start) });
    segments.push({
      text: content.slice(match.start, match.end),
      highlight: match.highlight,
    });
    cursor = match.end;
  });

  if (cursor < content.length) segments.push({ text: content.slice(cursor) });
  return segments.length ? segments : [{ text: content }];
};

const markRichHtmlHighlights = (html: string, highlights: SavedHighlight[]) => {
  if (!highlights.length || typeof document === 'undefined') return html;

  const template = document.createElement('template');
  template.innerHTML = html;
  const contentText = template.content.textContent || '';
  const ranges = buildArticleMarkRanges(contentText, highlights);
  if (!ranges.length) return html;

  let textCursor = 0;
  let rangeCursor = 0;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const value = textNode.nodeValue || '';
    const nodeStart = textCursor;
    const nodeEnd = nodeStart + value.length;
    textCursor = nodeEnd;

    while (rangeCursor < ranges.length && ranges[rangeCursor].end <= nodeStart) {
      rangeCursor += 1;
    }

    const fragments: Node[] = [];
    let localCursor = 0;
    let localRangeCursor = rangeCursor;

    while (localRangeCursor < ranges.length) {
      const range = ranges[localRangeCursor];
      if (range.start >= nodeEnd) break;

      const start = Math.max(range.start, nodeStart) - nodeStart;
      const end = Math.min(range.end, nodeEnd) - nodeStart;
      if (start > localCursor) {
        fragments.push(document.createTextNode(value.slice(localCursor, start)));
      }
      if (end > start) {
        const mark = document.createElement('mark');
        mark.className = 'reader-highlight-mark';
        mark.textContent = value.slice(start, end);
        fragments.push(mark);
      }
      localCursor = Math.max(localCursor, end);
      if (range.end <= nodeEnd) localRangeCursor += 1;
      else break;
    }

    if (!fragments.length) return;
    if (localCursor < value.length) {
      fragments.push(document.createTextNode(value.slice(localCursor)));
    }
    textNode.replaceWith(...fragments);
  });

  return template.innerHTML;
};

const readerThemeClasses: Record<ReaderSettings['theme'], string> = {
  light: 'bg-[var(--color-reader-page)] text-[var(--color-reader-ink)]',
  paper: 'bg-[var(--color-reader-page)] text-[var(--color-reader-ink)]',
  night: 'bg-[var(--color-reader-page)] text-[var(--color-reader-ink)]',
};

const readerTextClasses = (settings: ReaderSettings) => [
  settings.family === 'serif' ? 'reader-serif' : 'reader-sans',
  settings.size === 'large' ? 'text-[1.55rem]' : 'text-[1.32rem]',
  settings.lineHeight === 'open' ? 'leading-[2.55]' : 'leading-[2.12]',
  'text-[var(--color-reader-ink)]',
].join(' ');

const readerFontLabel: Record<ReaderSettings['family'], string> = {
  serif: 'Serif',
  sans: 'Sans',
};

type ArticleBodyProps = {
  content: string;
  isReadingMode: boolean;
  readerSettings: ReaderSettings;
  savedHighlights: SavedHighlight[];
};

const ArticleBody = React.memo<ArticleBodyProps>(({ content, isReadingMode, readerSettings, savedHighlights }) => {
  const hasRichContent = isRichHtml(content);

  if (hasRichContent) {
    return (
      <div
        className={`tourane-rich-content ${isReadingMode ? readerTextClasses(readerSettings) : 'reader-serif text-lg leading-8 text-[var(--color-app-ink)]'}`}
        dangerouslySetInnerHTML={{ __html: markRichHtmlHighlights(addImageCaptions(content), savedHighlights) }}
      />
    );
  }

  const highlightedSegments = buildHighlightedSegments(content, savedHighlights);

  return (
    <p className={`whitespace-pre-wrap ${isReadingMode ? readerTextClasses(readerSettings) : 'reader-serif text-lg leading-8 text-[var(--color-app-ink)]'}`}>
      {isReadingMode
        ? highlightedSegments.map((segment, index) => segment.highlight ? (
          <mark
            key={`${segment.highlight.id}-${index}`}
            className="reader-highlight-mark"
          >
            {segment.text}
          </mark>
        ) : (
          <React.Fragment key={`segment-${index}`}>{segment.text}</React.Fragment>
        ))
        : content}
    </p>
  );
});

const getWindowScrollTop = () => (
  window.scrollY ||
  document.documentElement.scrollTop ||
  document.body.scrollTop ||
  0
);

const getAppScroller = (pageElement: HTMLElement | null) => (
  pageElement?.closest('main') as HTMLElement | null
);

const getActiveScrollState = (pageElement: HTMLElement | null) => {
  const appScroller = getAppScroller(pageElement);
  const appScrollTop = appScroller?.scrollTop ?? 0;
  const windowScrollTop = getWindowScrollTop();
  const appCanScroll = Boolean(appScroller && appScroller.scrollHeight > appScroller.clientHeight + 1);
  const useWindow = !appCanScroll || windowScrollTop > appScrollTop;

  if (useWindow || !appScroller) {
    return {
      rootTop: 0,
      scrollTop: windowScrollTop,
      viewportHeight: window.innerHeight,
    };
  }

  return {
    rootTop: appScroller.getBoundingClientRect().top,
    scrollTop: appScrollTop,
    viewportHeight: appScroller.clientHeight,
  };
};

const restoreScrollPosition = (pageElement: HTMLElement | null, scrollY: number) => {
  const appScroller = getAppScroller(pageElement);
  appScroller?.scrollTo({ top: scrollY, behavior: 'auto' });
  window.scrollTo({ top: scrollY, behavior: 'auto' });
};

export const PostDetailScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const articleTextRef = useRef<HTMLDivElement>(null);
  const selectionToolbarRef = useRef<HTMLDivElement>(null);
  const selectionMenuRef = useRef<SelectionMenu | null>(null);
  const selectionInspectTimeoutRef = useRef<number | null>(null);
  const lastSavedProgressRef = useRef({ scrollY: -1, progress: -1, time: 0 });
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(() => MOCK_POSTS.find(p => p.id === id) || null);
  const [isPostLoading, setIsPostLoading] = useState(true);
  const [postNotice, setPostNotice] = useState('');
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenu | null>(null);
  const [quoteDraft, setQuoteDraft] = useState<string | null>(null);
  const [isReadingMode, setIsReadingMode] = useState(() => readReaderModeSession());
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [isTrustOpen, setIsTrustOpen] = useState(false);
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [isReaderNotesOpen, setIsReaderNotesOpen] = useState(false);
  const [readingPercent, setReadingPercent] = useState(0);
  const [isArticleSaved, setIsArticleSaved] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => readReaderSettings());
  const [preferences, setPreferences] = useState<AppPreferences>(() => readAppPreferences());
  const [savedHighlights, setSavedHighlights] = useState<SavedHighlight[]>([]);

  useEffect(() => {
    selectionMenuRef.current = selectionMenu;
  }, [selectionMenu]);

  useEffect(() => {
    window.sessionStorage.setItem(READER_MODE_SESSION_KEY, String(isReadingMode));
    if (!isReadingMode) {
      setIsReaderSettingsOpen(false);
      setIsReaderNotesOpen(false);
    }
  }, [isReadingMode]);

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
          if (!isMounted) return;
          setPost(backendArticleToPost(foundArticle));
          return;
        }

        const foundPost = await backendApi.getPost(id);
        if (!isMounted) return;
        setPost(backendPostToPost(foundPost));
      } catch (error) {
        if (!isMounted) return;
        setPostNotice(error instanceof Error ? error.message : 'Backend detail unavailable.');
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
    if (!post) return;
    let isMounted = true;

    getHighlightsForPost(post.id, post.backendArticleId)
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

  useEffect(() => subscribeReaderSettings(setReaderSettings), []);

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  useEffect(() => {
    if (!preferences.trustAlerts) setIsTrustOpen(false);
  }, [preferences.trustAlerts]);

  useEffect(() => {
    if (!post) return;

    let cancelled = false;

    readProgress()
      .then(saved => {
        if (cancelled || saved?.postId !== post.id || saved.scrollY <= 0) return;
        window.requestAnimationFrame(() => {
          if (cancelled) return;
          restoreScrollPosition(pageRef.current, saved.scrollY);
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [post?.id]);

  useEffect(() => {
    if (!post) return;

    const appScroller = getAppScroller(pageRef.current);

    let frame = 0;
    const trackProgress = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        const articleElement = articleTextRef.current ?? pageRef.current;
        const { rootTop, scrollTop, viewportHeight } = getActiveScrollState(pageRef.current);
        const articleRect = articleElement?.getBoundingClientRect();
        const articleTop = articleRect ? scrollTop + articleRect.top - rootTop : 0;
        const articleHeight = Math.max(1, articleElement?.scrollHeight ?? articleRect?.height ?? 1);
        const start = Math.max(0, articleTop - viewportHeight * 0.12);
        const end = Math.max(start + 1, articleTop + articleHeight - viewportHeight * 0.62);
        const progress = Math.min(100, Math.max(0, Math.round(((scrollTop - start) / (end - start)) * 100)));
        const now = Date.now();
        const previous = lastSavedProgressRef.current;
        setReadingPercent(progress);
        if (
          Math.abs(progress - previous.progress) >= 2 ||
          Math.abs(scrollTop - previous.scrollY) >= 240 ||
          now - previous.time >= 1200
        ) {
          saveProgress({
            postId: post.id,
            articleId: post.backendArticleId,
            title: post.title,
            channelName: post.channelName,
            scrollY: scrollTop,
            progress,
          }).catch(() => undefined);
          lastSavedProgressRef.current = { scrollY: scrollTop, progress, time: now };
        }
        frame = 0;
      });
    };

    trackProgress();
    appScroller?.addEventListener('scroll', trackProgress, { passive: true });
    window.addEventListener('scroll', trackProgress, { passive: true });
    window.addEventListener('resize', trackProgress);

    return () => {
      appScroller?.removeEventListener('scroll', trackProgress);
      window.removeEventListener('scroll', trackProgress);
      window.removeEventListener('resize', trackProgress);
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
      if (event.key !== 'Escape') return;
      if (isReaderNotesOpen) {
        setIsReaderNotesOpen(false);
        return;
      }
      if (isReaderSettingsOpen) {
        setIsReaderSettingsOpen(false);
        return;
      }
      setIsReadingMode(false);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isReadingMode, isReaderSettingsOpen, isReaderNotesOpen]);

  useEffect(() => {
    if (!post) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectionMenuRef.current) {
        setSelectionMenu(null);
        clearNativeSelection();
      }
    };

    const inspectAfterSelectionSettles = () => {
      if (selectionInspectTimeoutRef.current) {
        window.clearTimeout(selectionInspectTimeoutRef.current);
      }
      selectionInspectTimeoutRef.current = window.setTimeout(inspectSelection, 280);
    };

    const clearMenuOutsideReader = (event: PointerEvent) => {
      if (selectionInspectTimeoutRef.current) {
        window.clearTimeout(selectionInspectTimeoutRef.current);
        selectionInspectTimeoutRef.current = null;
      }
      if (!selectionMenuRef.current) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (selectionToolbarRef.current?.contains(target)) return;
      if (articleTextRef.current?.contains(target)) return;
      setSelectionMenu(null);
    };

    document.addEventListener('pointerup', inspectAfterSelectionSettles);
    document.addEventListener('pointerdown', clearMenuOutsideReader);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', inspectAfterSelectionSettles);

    return () => {
      document.removeEventListener('pointerup', inspectAfterSelectionSettles);
      document.removeEventListener('pointerdown', clearMenuOutsideReader);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', inspectAfterSelectionSettles);
      if (selectionInspectTimeoutRef.current) {
        window.clearTimeout(selectionInspectTimeoutRef.current);
        selectionInspectTimeoutRef.current = null;
      }
    };
  }, [post?.id]);

  if (isPostLoading) return <div className="p-20 text-center text-sm font-semibold text-[var(--color-app-muted)]">Loading transmission</div>;
  if (!post) return <div className="p-20 text-center text-sm font-semibold text-[var(--color-app-muted)]">Transmission lost: post not found</div>;

  const trust = getPostTrust(post);
  const trustScore = post.upvotes - post.downvotes;
  const highlightCount = savedHighlights.length;
  const canDeletePost = !post.id.startsWith('article-') && Boolean(user && (user.role === 'ADMIN' || user.id === post.authorId));
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
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedNode = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer;

    if (!selectedNode || !articleTextRef.current.contains(selectedNode)) {
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      return;
    }

    const offsets = getSelectionOffsets(range);
    if (!offsets) {
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

  const handleDeletePost = async () => {
    if (!canDeletePost || isDeletingPost) return;
    const confirmed = window.confirm('Delete this post? This removes its votes, comments, highlights, and reading progress.');
    if (!confirmed) return;

    setIsDeletingPost(true);
    try {
      await backendApi.deletePost(post.id);
      await clearProgress(post.id).catch(() => undefined);
      toast.success('Post deleted.');
      navigate('/app');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete post.');
    } finally {
      setIsDeletingPost(false);
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

  const readerInactiveControl = 'border border-[var(--color-reader-border)] text-[var(--color-reader-muted)] hover:border-[var(--color-reader-control)] hover:text-[var(--color-reader-control)]';
  const readerActiveControl = 'border border-[var(--color-reader-control)] bg-[var(--color-reader-control)] text-[var(--color-reader-control-text)]';
  const readerIconControl = `inline-flex min-h-10 min-w-10 items-center justify-center ${readerInactiveControl}`;
  const readerSecondaryText = 'text-[var(--color-reader-muted)]';
  const readerFontClass = readerSettings.family === 'serif' ? 'reader-serif' : 'reader-sans';
  const readerHeadingClass = isReadingMode ? `${readerFontClass} text-[var(--color-reader-ink)]` : 'font-[var(--font-display)] text-[var(--color-app-heading)]';
  const readerSummaryClass = isReadingMode ? readerFontClass : '';
  const readerMutedClass = isReadingMode ? 'text-[var(--color-reader-muted)]' : 'text-[var(--color-app-muted)]';
  const readerDividerClass = isReadingMode ? 'border-[var(--color-reader-border)]' : 'border-[var(--color-app-heading)]';
  const readerMetaLinkClass = isReadingMode ? 'text-[var(--color-reader-ink)] hover:text-[var(--color-reader-control)]' : 'text-[var(--color-app-heading)] hover:text-[var(--color-app-action)]';

  const readerDisplayControls = (
    <div className="grid gap-4">
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-reader-faint)]">Text size</div>
        <div className="flex gap-2">
      {(['regular', 'large'] as const).map(size => (
        <button
          key={size}
          type="button"
          onClick={() => updateReaderSettings('size', size)}
          aria-pressed={readerSettings.size === size}
          className={`h-9 px-3 text-sm font-bold uppercase tracking-widest transition-all ${readerSettings.size === size ? readerActiveControl : readerInactiveControl}`}
        >
          {size === 'regular' ? 'A' : 'A+'}
        </button>
      ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-reader-faint)]">Typeface</div>
        <div className="grid grid-cols-2 border border-[var(--color-reader-border)]">
      {(['serif', 'sans'] as const).map(family => (
        <button
          key={family}
          type="button"
          onClick={() => updateReaderSettings('family', family)}
          aria-pressed={readerSettings.family === family}
          className={`h-10 px-3 text-sm font-bold uppercase tracking-widest transition-all ${readerSettings.family === family ? readerActiveControl : 'text-[var(--color-reader-muted)] hover:text-[var(--color-reader-control)]'}`}
        >
          {readerFontLabel[family]}
        </button>
      ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-reader-faint)]">Line spacing</div>
        <div className="grid grid-cols-2 border border-[var(--color-reader-border)]">
      {(['relaxed', 'open'] as const).map(lineHeight => (
        <button
          key={lineHeight}
          type="button"
          onClick={() => updateReaderSettings('lineHeight', lineHeight)}
          aria-pressed={readerSettings.lineHeight === lineHeight}
          className={`h-10 px-3 text-sm font-bold uppercase tracking-widest transition-all ${readerSettings.lineHeight === lineHeight ? readerActiveControl : 'text-[var(--color-reader-muted)] hover:text-[var(--color-reader-control)]'}`}
        >
          {lineHeight === 'relaxed' ? 'Standard' : 'Roomy'}
        </button>
      ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-reader-faint)]">Theme</div>
        <div className="grid grid-cols-3 gap-2">
      {(['light', 'paper', 'night'] as const).map(theme => (
        <button
          key={theme}
          type="button"
          onClick={() => updateReaderSettings('theme', theme)}
          aria-pressed={readerSettings.theme === theme}
          className={`h-12 border text-xs font-bold uppercase tracking-widest transition-all ${
            readerSettings.theme === theme
              ? 'border-[var(--color-reader-control)] shadow-[var(--shadow-focus)]'
              : 'border-[var(--color-reader-border)] hover:border-[var(--color-reader-control)]'
          } ${
            theme === 'light'
              ? 'bg-[oklch(98.5%_0.006_78)] text-[oklch(20%_0.01_70)]'
              : theme === 'paper'
                ? 'bg-[oklch(97%_0.012_83)] text-[oklch(22%_0.015_70)]'
                : 'bg-[oklch(18%_0.008_70)] text-[oklch(91%_0.006_80)]'
          }`}
        >
          {theme}
        </button>
      ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={pageRef}
      data-reader-theme={isReadingMode ? readerSettings.theme : undefined}
      className={`mx-auto px-4 py-7 sm:px-6 sm:py-9 ${isReadingMode ? `reader-theme-scope min-h-svh max-w-none lg:px-16 ${readerShellClass}` : 'max-w-[1320px] lg:px-10'}`}
    >
      <div className={`${isReadingMode ? 'hidden' : 'fixed'} left-0 right-0 top-0 z-30 h-1 bg-[var(--color-reader-progress-track)]`}>
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
          ref={selectionToolbarRef}
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
          <Tooltip label="Share selected quote" side="bottom">
            <ShareButton
              title={post.title}
              text={selectionMenu.text}
              url={`/app/p/${post.id}`}
              kind="quote"
              label="Share"
              className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold hover:bg-[var(--color-reader-surface-lift)]/20"
              successMessage="Quote copied with link."
              onDiscuss={handleQuoteComment}
            />
          </Tooltip>
        </div>
      )}

      {postNotice && !isReadingMode && (
        <Alert tone="warning" className="mb-5">
          {postNotice}
        </Alert>
      )}

      {isReadingMode && (
        <div className="sticky top-0 z-50 -mx-4 mb-14 border-b border-[var(--color-reader-border)] bg-[var(--color-reader-surface)]/96 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-16 lg:px-16">
          <div className="relative mx-auto grid max-w-6xl grid-cols-[auto_minmax(8rem,1fr)_auto] items-center gap-4">
            <div className="flex items-center gap-2">
            <Link to="/app" className={readerIconControl}>
              <span className="sr-only">Back to feed</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsReadingMode(false)}
              className={`hidden min-h-10 px-3 py-1.5 text-sm font-semibold sm:inline-flex ${readerInactiveControl}`}
            >
              Exit
            </button>
            </div>
            <div className="min-w-0">
              <div className="h-1 overflow-hidden rounded-full bg-[var(--color-reader-progress-track)]">
                <div className="h-full bg-[var(--color-reader-progress-fill)]" style={{ width: `${readingPercent}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className={`hidden text-sm font-semibold sm:inline ${readerSecondaryText}`}>
                {readingPercent}%
              </span>
            <Tooltip label="Display" side="bottom">
              <button
                type="button"
                onClick={() => setIsReaderSettingsOpen(prev => !prev)}
                aria-expanded={isReaderSettingsOpen}
                className={readerIconControl}
                aria-label="Reader display settings"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label="Notes" side="bottom">
            <button
              type="button"
              onClick={() => setIsReaderNotesOpen(true)}
              className={readerIconControl}
              aria-label={`${highlightCount} notes`}
            >
              <StickyNote className="h-4 w-4" />
            </button>
            </Tooltip>
            <ShareButton
              title={post.title}
              text={stripHtml(post.content).slice(0, 220)}
              url={`/app/p/${post.id}`}
              kind="post"
              iconOnly
              label="Share report"
              className={readerIconControl}
              successMessage="Report link copied."
            />
            <Tooltip label="Discussion" side="bottom">
              <button
                type="button"
                onClick={openDiscussion}
                className={readerIconControl}
                aria-label="Open discussion"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </Tooltip>
            </div>
          </div>
        </div>
      )}

      {isReadingMode && isReaderSettingsOpen && (
        <div
          className="fixed inset-0 z-[80] grid min-h-dvh place-items-center overflow-y-auto bg-[rgba(0,0,0,0.32)] px-4 py-10"
          role="presentation"
          onClick={() => setIsReaderSettingsOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Reader display settings"
            className="max-h-[calc(100dvh-5rem)] w-[min(92vw,32rem)] overflow-y-auto border border-[var(--color-reader-border)] bg-[var(--color-reader-popover)] p-5 text-[var(--color-reader-popover-text)] shadow-[var(--shadow-modal)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-[var(--color-reader-border)] pb-4">
              <div>
                <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-reader-ink)]">Display</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-reader-muted)]">Tune this article without leaving reader mode.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReaderSettingsOpen(false)}
                className="inline-flex min-h-10 min-w-10 items-center justify-center text-[var(--color-reader-muted)] hover:text-[var(--color-reader-control)]"
                aria-label="Close display settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {readerDisplayControls}
          </div>
        </div>
      )}

      {isReadingMode && isReaderNotesOpen && (
        <div
          className="fixed inset-0 z-[80] grid min-h-dvh place-items-center overflow-y-auto bg-[rgba(0,0,0,0.32)] px-4 py-10"
          role="presentation"
          onClick={() => setIsReaderNotesOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Reader notes"
            className="max-h-[calc(100dvh-5rem)] w-[min(92vw,36rem)] overflow-y-auto border border-[var(--color-reader-border)] bg-[var(--color-reader-popover)] p-5 text-[var(--color-reader-popover-text)] shadow-[var(--shadow-modal)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-[var(--color-reader-border)] pb-4">
              <div>
                <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-reader-ink)]">Notes</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-reader-muted)]">
                  {highlightCount === 0 ? 'Saved highlights from this article will appear here.' : `${highlightCount} saved ${highlightCount === 1 ? 'highlight' : 'highlights'} in this article.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReaderNotesOpen(false)}
                className="inline-flex min-h-10 min-w-10 items-center justify-center text-[var(--color-reader-muted)] hover:text-[var(--color-reader-control)]"
                aria-label="Close notes"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {savedHighlights.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--color-reader-muted)]">
                Select text in the story and choose Highlight to save a passage without leaving reader mode.
              </p>
            ) : (
              <div className="space-y-4">
                {savedHighlights.map(highlight => (
                  <article key={highlight.id} className="border border-[var(--color-reader-border)] bg-[var(--color-reader-surface)] p-4">
                    <blockquote className="text-base leading-7 text-[var(--color-reader-ink)]">
                      {highlight.text}
                    </blockquote>
                    {highlight.note && (
                      <p className="mt-3 text-sm leading-6 text-[var(--color-reader-muted)]">{highlight.note}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsReaderNotesOpen(false);
                        quoteHighlight(highlight.text);
                      }}
                      className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--color-reader-progress-fill)] hover:text-[var(--color-reader-control-hover)]"
                    >
                      Quote in discussion
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Link data-motion="page" to="/app" className={`mb-7 items-center gap-2 text-sm font-semibold text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-ink)] ${isReadingMode ? 'hidden' : 'inline-flex'}`}>
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <article className={`space-y-10 ${isReadingMode ? `mx-auto max-w-[960px] ${readerFontClass}` : ''}`}>
        <header data-motion="page" className={`border-b-4 ${isReadingMode ? 'pb-12 pt-8' : 'pb-8'} ${readerDividerClass}`}>
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
            <Link to={`/app/c/${post.channelId}`} className={readerMetaLinkClass}>{post.channelName}</Link>
            <span className={isReadingMode ? 'text-[var(--color-reader-border)]' : 'text-[var(--color-app-border)]'}>|</span>
            <span className={readerMutedClass}>{new Date(post.createdAt).toLocaleDateString()}</span>
              {preferences.trustAlerts ? (
                <button
                  type="button"
                  onClick={() => setIsTrustOpen(true)}
                  className="ml-auto flex items-center gap-1 hover:underline"
                >
                  <TrustLabel trust={trust} className="tracking-widest" />
                  <Info className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="ml-auto">
                  <TrustLabel trust={trust} className="tracking-widest" />
                </span>
              )}
          </div>
          
          <h1 className={`max-w-5xl font-bold leading-[1.08] ${isReadingMode ? 'text-[3rem] sm:text-[4rem]' : 'text-4xl sm:text-6xl'} ${readerHeadingClass}`}>
            {post.title}
          </h1>
          <p className={`mt-5 max-w-3xl text-lg leading-8 ${isReadingMode ? 'hidden' : ''} ${readerMutedClass} ${readerSummaryClass}`}>
            {stripHtml(post.content).slice(0, 260)}{stripHtml(post.content).length > 260 ? '...' : ''}
          </p>

          {post.mediaUrl && post.mediaType === 'image' && (
            <figure className="story-image-frame mt-8 max-h-[680px]">
              <img src={post.mediaUrl} alt="" className="story-image max-h-[680px] grayscale-[10%]" />
            </figure>
          )}

          <div className={`mt-7 flex flex-wrap items-center justify-between gap-6 pt-2 ${isReadingMode ? 'hidden' : ''}`}>
            <Link to={`/app/u/${post.author.username}`} className="flex items-center gap-4 group">
              <img src={post.author.avatarUrl} className="h-12 w-12 rounded-full border border-[var(--color-app-border)] grayscale transition-all group-hover:grayscale-0" alt="" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="editorial-label !text-sm !font-bold uppercase tracking-widest group-hover:underline">@{post.author.username}</span>
                  {post.author.isVerified && <ShieldCheck className="w-4 h-4 text-[var(--color-app-action)]" />}
                </div>
                <span className="text-xs font-bold text-[var(--color-app-muted)] uppercase tracking-tighter">Credibility: {post.author.trustScore}</span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsReadingMode(prev => !prev)}
                className="bulwark-button-ghost border border-[var(--color-app-border)] !h-11 !px-4"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Reader
              </button>
              {post.backendArticleId && (
                <button
                  type="button"
                  onClick={handleToggleSavedArticle}
                  disabled={isSavingArticle}
                  className={`bulwark-button-ghost border !h-11 !px-4 ${isArticleSaved ? 'bg-[var(--color-brand-red-faint)] border-[var(--color-app-action)] text-[var(--color-app-action)]' : 'border-[var(--color-app-border)]'}`}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isArticleSaved ? 'fill-current' : ''}`} />
                  {isArticleSaved ? 'Saved' : 'Save'}
                </button>
              )}
              <VoteControl label={post.title} score={post.upvotes - post.downvotes} vote={post.userVote} orientation="horizontal" onVote={handleVote} />
              {canDeletePost && (
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={isDeletingPost}
                  className="bulwark-button-ghost border border-[var(--color-state-error-border)] !h-11 !px-4 text-[var(--color-state-error)] hover:border-[var(--color-state-error)] hover:text-[var(--color-state-error)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeletingPost ? 'Deleting' : 'Delete'}
                </button>
              )}
              <ShareButton
                title={post.title}
                text={stripHtml(post.content).slice(0, 220)}
                url={`/app/p/${post.id}`}
                kind="post"
                className="bulwark-button-ghost border border-[var(--color-app-border)] !h-11 !px-4"
                successMessage="Report link copied."
              />
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

          <div className={isReadingMode ? 'block' : 'grid gap-12 xl:grid-cols-[minmax(0,76ch)_20rem]'}>
            <div ref={articleTextRef} className={isReadingMode ? 'mx-auto max-w-[84ch]' : 'max-w-[76ch]'}>
            <ArticleBody
              key={`${readerSettings.family}-${readerSettings.size}-${readerSettings.lineHeight}-${isReadingMode ? 'reader' : 'standard'}`}
              content={post.content}
              isReadingMode={isReadingMode}
                readerSettings={readerSettings}
                savedHighlights={savedHighlights}
              />
            </div>

            {!isReadingMode && (
              <aside className="hidden xl:block">
                <div className="sticky top-8 space-y-5">
                  <section className="border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
                      Community signal
                    </div>
                    <VoteControl label={post.title} score={post.upvotes - post.downvotes} vote={post.userVote} orientation="horizontal" onVote={handleVote} />
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--color-app-border)] pt-4">
                      <div>
                        <div className="font-mono text-xl font-bold text-[var(--color-app-heading)]">{post.commentCount}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Comments</div>
                      </div>
                      <div>
                        <div className="font-mono text-xl font-bold text-[var(--color-app-heading)]">{highlightCount}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Notes</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openDiscussion}
                      className="mt-4 inline-flex min-h-10 w-full items-center justify-center bg-[var(--color-app-heading)] px-3 text-sm font-bold text-[var(--color-app-surface)] hover:bg-[var(--color-app-action)]"
                    >
                      Open discussion
                    </button>
                  </section>

                  <section className="border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
                      Reader tools
                    </div>
                    <p className="text-sm leading-6 text-[var(--color-app-muted)]">
                      Select text in the story to save highlights, copy passages, or quote into the comments.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsReadingMode(true)}
                      className="mt-4 inline-flex min-h-10 w-full items-center justify-center border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 text-sm font-bold text-[var(--color-app-heading)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]"
                    >
                      Focus reader
                    </button>
                  </section>
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
