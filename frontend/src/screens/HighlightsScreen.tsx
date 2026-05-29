import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Bookmark, Highlighter, MessageSquareQuote, Trash2, X } from 'lucide-react';
import { deleteHighlight, getHighlights, updateHighlightNote, type SavedHighlight } from '../lib/highlights';
import { usePageMotion } from '../hooks/usePageMotion';
import { Alert } from '../components/ui/Alert';
import { ShareButton } from '../components/ui/ShareButton';
import { backendApi, type BackendSavedArticleDTO } from '../lib/api';

type NotebookTab = 'highlights' | 'posts';

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));

export const HighlightsScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const [activeTab, setActiveTab] = useState<NotebookTab>('highlights');
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [savedPosts, setSavedPosts] = useState<BackendSavedArticleDTO[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getHighlights(),
      backendApi.getSavedArticles().catch(() => []),
    ])
      .then(([nextHighlights, nextSavedPosts]) => {
        if (!isMounted) return;
        setHighlights(nextHighlights);
        setSavedPosts(nextSavedPosts);
        setNoteDrafts(nextHighlights.reduce<Record<string, string>>((drafts, highlight) => {
          drafts[highlight.id] = highlight.note || '';
          return drafts;
        }, {}));
        setNotice('');
      })
      .catch(error => {
        if (isMounted) setNotice(error instanceof Error ? error.message : 'Unable to load highlights.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      Object.entries(noteDrafts).forEach(([id, note]) => {
        const saved = highlights.find(highlight => highlight.id === id);
        if (saved && (saved.note || '') !== note) {
          updateHighlightNote(id, note).catch(error => {
            toast.error(error instanceof Error ? error.message : 'Unable to update note.');
          });
        }
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [noteDrafts, highlights]);

  const groupedHighlights = useMemo(() => {
    return highlights.reduce<Record<string, SavedHighlight[]>>((groups, highlight) => {
      groups[highlight.postId] = groups[highlight.postId] || [];
      groups[highlight.postId].push(highlight);
      return groups;
    }, {});
  }, [highlights]);

  const handleDelete = async (id: string) => {
    await deleteHighlight(id).catch(error => {
      toast.error(error instanceof Error ? error.message : 'Unable to delete highlight.');
    });
    setHighlights(current => current.filter(highlight => highlight.id !== id));
    toast.success('Highlight deleted.');
    setNoteDrafts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleNoteChange = (id: string, note: string) => {
    setNoteDrafts(prev => ({ ...prev, [id]: note }));
  };

  const handleUnsavePost = async (articleId: number) => {
    try {
      await backendApi.unsaveArticle(articleId);
      setSavedPosts(current => current.filter(saved => saved.article.id !== articleId));
      toast.success('Removed from saved posts.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to remove saved post.');
    }
  };

  const tabs: Array<{ id: NotebookTab; label: string; count: number }> = [
    { id: 'highlights', label: 'Saved highlights', count: highlights.length },
    { id: 'posts', label: 'Saved posts', count: savedPosts.length },
  ];

  return (
    <div ref={pageRef} className="hex-page">
      <header data-motion="page" className="mb-6 grid gap-5 border-b border-[var(--color-app-border-clean)] pb-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div>
          <div className="hex-kicker mb-2 flex items-center gap-2">
            <Highlighter className="h-4 w-4" />
            Notebook
          </div>
          <h1 className="font-[var(--font-display)] text-4xl font-bold leading-none text-[var(--color-app-heading)] sm:text-5xl">
            Saved reading.
          </h1>
        </div>
        <div className="grid grid-cols-2 border border-[var(--color-app-border)]">
          <div className="border-r border-[var(--color-app-border)] p-4">
            <div className="font-mono text-2xl font-bold text-[var(--color-app-heading)]">{highlights.length}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Highlights</div>
          </div>
          <div className="p-4">
            <div className="font-mono text-2xl font-bold text-[var(--color-app-heading)]">{savedPosts.length}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Posts</div>
          </div>
        </div>
      </header>

      {notice && (
        <Alert tone="error" className="mb-5">
          {notice}
        </Alert>
      )}

      <div data-motion="page" className="mb-6 grid grid-cols-2 border border-[var(--color-app-border)] sm:inline-grid">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-bold ${
              activeTab === tab.id
                ? 'bg-[var(--color-app-heading)] text-[var(--color-app-bg)]'
                : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]'
            }`}
          >
            {tab.label}
            <span className="font-mono text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === 'highlights' && highlights.length === 0 ? (
        <section data-motion="page" className="hex-panel p-6">
          <h2 className="text-lg font-semibold text-[var(--color-app-ink)]">No highlights yet</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">
            Select text inside an article and save it from the popup.
          </p>
          <Link to="/app" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-app-action)] hover:text-[var(--color-app-action-hover)]">
            Return to feed
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : activeTab === 'highlights' ? (
        <div className="space-y-6">
          {Object.entries(groupedHighlights).map(([postId, items]) => (
            <section key={postId} data-motion="list" className="hex-card overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-app-border-clean)] bg-[var(--color-near-white)] px-5 py-4">
                <div className="min-w-0">
                  <div className="mb-1 text-sm text-[var(--color-app-muted)]">
                    {items[0].channelName} · {items.length} {items.length === 1 ? 'highlight' : 'highlights'}
                  </div>
                  <h2 className="truncate text-base font-semibold text-[var(--color-app-ink)]">{items[0].postTitle}</h2>
                </div>
                <Link to={postId ? `/app/p/${postId}` : '/app'} className="shrink-0 text-sm font-medium text-[var(--color-app-action)] hover:text-[var(--color-app-action-hover)]">
                  Open
                </Link>
              </div>

              <div className="divide-y divide-[var(--color-app-border-clean)]">
                {items.map((highlight) => (
                  <article key={highlight.id} className="group px-5 py-5">
                    <blockquote className="text-base leading-7 text-[var(--color-app-ink)]">
                      {highlight.text}
                    </blockquote>
                    <label htmlFor={`highlight-note-${highlight.id}`} className="sr-only">
                      Private note for saved highlight
                    </label>
                    <textarea
                      id={`highlight-note-${highlight.id}`}
                      value={noteDrafts[highlight.id] ?? highlight.note ?? ''}
                      onChange={(event) => handleNoteChange(highlight.id, event.target.value)}
                      placeholder="Private note..."
                      className="hex-input mt-3 min-h-16 w-full resize-y px-3 py-2 text-sm leading-6"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-[var(--color-app-muted)]">
                        {formatTime(highlight.createdAt)}
                      </span>
                      <div className="flex items-center gap-3">
                        <Link
                          to={highlight.postId ? `/app/p/${highlight.postId}` : '/app'}
                          state={{ quote: highlight.text }}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-app-action)] transition-colors hover:text-[var(--color-app-action-hover)]"
                        >
                          <MessageSquareQuote className="h-3.5 w-3.5" />
                          Discuss
                        </Link>
                        <ShareButton
                          title={highlight.postTitle || 'Saved highlight'}
                          text={highlight.text}
                          url={highlight.postId ? `/app/p/${highlight.postId}` : '/app'}
                          kind="quote"
                          label="Share"
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)]"
                          successMessage="Highlight copied with link."
                        />
                        <button
                          type="button"
                          onClick={() => handleDelete(highlight.id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-app-muted)] opacity-100 transition-colors hover:text-[var(--color-app-action)] sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : savedPosts.length === 0 ? (
        <section data-motion="page" className="hex-panel p-6">
          <h2 className="text-lg font-semibold text-[var(--color-app-ink)]">No saved posts yet</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">
            Use Save on an article to keep it here.
          </p>
          <Link to="/app" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-app-action)] hover:text-[var(--color-app-action-hover)]">
            Return to feed
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <div className="space-y-4">
          {savedPosts.map(saved => (
            <article key={saved.id} data-motion="list" className="hex-card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
                  <Bookmark className="h-3.5 w-3.5" />
                  Saved {formatTime(saved.savedAt)}
                </div>
                <h2 className="text-xl font-bold leading-7 text-[var(--color-app-heading)]">
                  <Link to={`/app/p/article-${saved.article.id}`} className="hover:text-[var(--color-app-action)]">
                    {saved.article.title}
                  </Link>
                </h2>
                {saved.article.subtitle && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-app-muted)]">
                    {saved.article.subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 sm:items-start">
                <Link to={`/app/p/article-${saved.article.id}`} className="inline-flex min-h-10 items-center justify-center bg-[var(--color-app-heading)] px-4 text-sm font-bold text-[var(--color-app-bg)] hover:bg-[var(--color-app-action)]">
                  Open
                </Link>
                <ShareButton
                  title={saved.article.title}
                  text={saved.article.subtitle || undefined}
                  url={`/app/p/article-${saved.article.id}`}
                  kind="saved"
                  iconOnly
                  label={`Share ${saved.article.title}`}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center border border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]"
                  successMessage="Saved post link copied."
                />
                <button
                  type="button"
                  onClick={() => handleUnsavePost(saved.article.id)}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center border border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]"
                  aria-label={`Remove ${saved.article.title} from saved posts`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
