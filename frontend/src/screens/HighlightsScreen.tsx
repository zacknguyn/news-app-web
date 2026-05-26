import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Highlighter, MessageSquareQuote, Trash2 } from 'lucide-react';
import { deleteHighlight, getHighlights, updateHighlightNote, type SavedHighlight } from '../lib/highlights';
import { usePageMotion } from '../hooks/usePageMotion';
import { Alert } from '../components/ui/Alert';

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));

export const HighlightsScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    getHighlights()
      .then(nextHighlights => {
        if (!isMounted) return;
        setHighlights(nextHighlights);
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

  return (
    <div ref={pageRef} className="hex-page">
      <header data-motion="page" className="hex-page-header">
        <div className="hex-kicker mb-2 flex items-center gap-2">
          <Highlighter className="h-4 w-4" />
          Reader memory
        </div>
        <h1 className="hex-title">Saved highlights</h1>
        <p className="hex-copy mt-2 max-w-xl">
          Keep the parts worth returning to. Highlights are saved to your account.
        </p>
      </header>

      {notice && (
        <Alert tone="error" className="mb-5">
          {notice}
        </Alert>
      )}

      {highlights.length === 0 ? (
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
      ) : (
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
                <Link to={`/app/p/${postId}`} className="shrink-0 text-sm font-medium text-[var(--color-app-action)] hover:text-[var(--color-app-action-hover)]">
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
                          to={`/app/p/${highlight.postId}`}
                          state={{ quote: highlight.text }}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-app-action)] transition-colors hover:text-[var(--color-app-action-hover)]"
                        >
                          <MessageSquareQuote className="h-3.5 w-3.5" />
                          Discuss
                        </Link>
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
      )}
    </div>
  );
};
