import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_POSTS } from '../lib/mockData';
import { CommentSection } from '../components/CommentSection';
import { Alert } from '../components/ui/Alert';
import { VoteControl } from '../components/ui/VoteControl';
import { ShareButton } from '../components/ui/ShareButton';
import { PostActionButton } from '../components/ui/PostActionButton';
import { Tooltip } from '../components/ui/Tooltip';
import { backendApi } from '../lib/api';
import { backendArticleToPost, backendPostToPost } from '../lib/backendAdapters';
import { addImageCaptions, isRichHtml, stripHtml } from '../lib/richContent';
import { useAuth } from '../context/AuthContext';
import { clearProgress } from '../lib/readingProgress';
import { getProfilePath } from '../lib/profileLinks';
import { getHighlightsForPost, saveHighlight, type SavedHighlight } from '../lib/highlights';
import type { Post } from '../types';

type SelectionMenu = {
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
};

const SELECTION_MENU_WIDTH = 286;

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
  const [savedHighlights, setSavedHighlights] = useState<SavedHighlight[]>([]);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenu | null>(null);

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
          return;
        }
        const foundPost = await backendApi.getPost(id);
        if (isMounted) setPost(backendPostToPost(foundPost));
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
      <div className="px-4 py-20">
        <span className="swiss-loading">
          <span>.</span> Loading post
        </span>
      </div>
    );
  if (!post) return <div className="px-4 py-20 text-sm italic text-app-muted">Post not found.</div>;

  const canDeletePost =
    !post.id.startsWith('article-') && Boolean(user && (user.role === 'ADMIN' || user.id === post.authorId));
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
        toast.success(previousSavedState ? 'Removed from saved articles.' : 'Saved article.');
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
      toast.success(previousSavedState ? 'Removed from saved posts.' : 'Saved post.');
    } catch (error) {
      setIsPostSaved(previousSavedState);
      toast.error(error instanceof Error ? error.message : 'Unable to update saved post.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!canDeletePost || isDeletingPost) return;
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
      setConfirmDelete(false);
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
      toast.success('Highlight saved.');
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

  return (
    <div className="grid w-full gap-8 px-4 pb-10 pt-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-10">
      <main className="min-w-0">
        {postNotice && (
          <Alert tone="warning" className="mb-6">
            {postNotice}
          </Alert>
        )}

        <div className="sticky top-16 z-30 -mx-4 mb-6 flex items-center border-b border-app-border bg-app-bg px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <Tooltip label="Return to the previous feed or page." side="bottom">
            <PostActionButton
              icon={<ArrowLeft strokeWidth={2.25} />}
              label="Back"
              onClick={() => navigate(-1)}
              ariaLabel="Back to previous page"
              title="Back"
              className="border-app-heading bg-app-heading text-app-bg hover:border-app-action hover:bg-app-action hover:text-app-on-action"
            />
          </Tooltip>
        </div>

        <article className="border-b border-app-border pb-8">
          <div className="grid gap-4 sm:grid-cols-[4rem_minmax(0,1fr)]">
            <VoteControl label={post.title} score={score} vote={post.userVote} onVote={handleVote} />
            <div className="min-w-0">
              <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.01em] text-app-heading sm:text-[32px]">
                {post.title}
              </h1>
              <p className="mt-3 font-mono text-[11px] text-app-muted">
                @{post.author.username} · {post.channelName} ·{' '}
                {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · share ·
                save · report
              </p>
              {post.mediaUrl && post.mediaType === 'image' && (
                <figure className="mt-6">
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="aspect-video w-full border border-app-border object-cover"
                  />
                  <figcaption className="mt-2 font-mono text-[11px] text-app-muted">
                    Image attached to dispatch.
                  </figcaption>
                </figure>
              )}
              <div
                ref={articleRef}
                onMouseUp={() => window.setTimeout(inspectSelection, 80)}
                className="tourane-rich-content mt-8 max-w-[68ch] text-[17px] leading-[1.7] text-app-text"
              >
                {isRichHtml(post.content) ? (
                  <div dangerouslySetInnerHTML={{ __html: addImageCaptions(post.content) }} />
                ) : (
                  <p className="whitespace-pre-wrap">{post.content}</p>
                )}
              </div>
              {selectionMenu && (
                <div
                  className="fixed z-50 flex w-[286px] gap-4 border border-app-border bg-app-surface p-3 font-mono text-[11px] uppercase tracking-wider shadow-modal"
                  style={{ left: selectionMenu.x, top: selectionMenu.y }}
                >
                  <Tooltip label="Save this selected text to your highlights." side="top">
                    <button type="button" onClick={handleSaveHighlight} className="text-app-action hover:underline">
                      Highlight
                    </button>
                  </Tooltip>
                  <Tooltip label="Insert this selected text into a comment draft." side="top">
                    <button type="button" onClick={handleQuoteSelection} className="text-app-action hover:underline">
                      Quote in comment
                    </button>
                  </Tooltip>
                  <button
                    type="button"
                    onClick={() => setSelectionMenu(null)}
                    className="text-app-muted hover:text-app-heading"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
                <Tooltip
                  label={isPostSaved ? 'Remove this item from your saved list.' : 'Add this item to your saved list.'}
                  side="top"
                >
                  <PostActionButton
                    icon={<Bookmark strokeWidth={2.25} className={isPostSaved ? 'fill-current' : undefined} />}
                    label={isPostSaved ? 'Saved' : post.id.startsWith('article-') ? 'Save article' : 'Save post'}
                    active={isPostSaved}
                    disabled={isSavingPost}
                    onClick={handleToggleSavedPost}
                    ariaLabel={isPostSaved ? 'Remove from saved posts' : 'Save this post'}
                    title={isPostSaved ? 'Saved' : 'Save post'}
                  />
                </Tooltip>
                <ShareButton
                  title={post.title}
                  text={stripHtml(post.content).slice(0, 220)}
                  url={`/app/p/${post.id}`}
                  kind="post"
                  className="inline-flex min-h-10 select-none items-center gap-2 border border-app-border bg-transparent px-3 font-mono text-[11px] uppercase leading-none tracking-wider text-app-heading transition-colors duration-150 hover:border-app-action hover:text-app-action"
                  successMessage="Report link copied."
                />
                {canDeletePost && !confirmDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex min-h-10 items-center px-3 font-mono text-[11px] uppercase leading-none tracking-wider text-app-action hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
              {confirmDelete && (
                <div className="mt-4 border border-app-border p-3">
                  <p className="text-sm text-app-text">Delete this post and its linked discussion data?</p>
                  <div className="mt-3 flex gap-4 font-mono text-[11px] uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={handleDeletePost}
                      disabled={isDeletingPost}
                      className="text-app-action hover:underline disabled:opacity-40"
                    >
                      {isDeletingPost ? 'Deleting' : 'Confirm delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-app-muted hover:text-app-heading"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        <CommentSection
          postId={post.id}
          backendArticleId={post.backendArticleId}
          postAuthorId={post.authorId}
          quoteDraft={quoteDraft}
          onQuoteDraftClear={() => setQuoteDraft(null)}
        />
      </main>

      <aside className="space-y-8 border-t border-app-border py-6 lg:sticky lg:top-16 lg:h-[calc(100dvh-64px)] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-4">
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Author</h2>
          <Link to={getProfilePath(post.author)} className="flex gap-3">
            <img
              src={
                post.author.avatarUrl ||
                `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(post.author.username)}`
              }
              alt=""
              className="h-12 w-12 border border-app-border object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-app-heading">{post.author.name}</span>
              <span className="font-mono text-[11px] text-app-muted">{post.author.trustScore} karma</span>
            </span>
          </Link>
        </section>
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Highlights</h2>
          <p className="font-mono text-[24px] font-semibold tabular-nums text-app-heading">{savedHighlights.length}</p>
          <p className="mt-2 text-sm leading-6 text-app-muted">Saved quotes from this dispatch.</p>
        </section>
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Related</h2>
          <ol className="space-y-3">
            {MOCK_POSTS.filter((candidate) => candidate.id !== post.id)
              .slice(0, 5)
              .map((candidate, index) => (
                <li key={candidate.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
                  <span className="font-mono text-[11px] text-app-muted">{String(index + 1).padStart(2, '0')}</span>
                  <Link
                    to={`/app/p/${candidate.id}`}
                    className="truncate text-sm text-app-heading hover:text-app-action"
                  >
                    {candidate.title}
                  </Link>
                </li>
              ))}
          </ol>
        </section>
      </aside>
    </div>
  );
};

export default PostDetailScreen;
