import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { deleteHighlight, getHighlights, updateHighlightNote, type SavedHighlight } from '../lib/highlights';
import { Alert } from '../components/ui/Alert';
import { TextArea } from '../components/ui/Input';
import { backendApi, type BackendSavedArticleDTO } from '../lib/api';
import { PostCard } from '../components/PostCard';
import { backendArticleToPost } from '../lib/backendAdapters';

type NotebookTab = 'highlights' | 'posts';

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(
    new Date(date),
  );

export const HighlightsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NotebookTab>('highlights');
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [savedPosts, setSavedPosts] = useState<BackendSavedArticleDTO[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([getHighlights(), backendApi.getSavedArticles().catch(() => [])])
      .then(([nextHighlights, nextSavedPosts]) => {
        if (!isMounted) return;
        setHighlights(nextHighlights);
        setSavedPosts(nextSavedPosts);
        setNoteDrafts(
          nextHighlights.reduce<Record<string, string>>((drafts, highlight) => {
            drafts[highlight.id] = highlight.note || '';
            return drafts;
          }, {}),
        );
        setNotice('');
      })
      .catch((error) => {
        if (isMounted) setNotice(error instanceof Error ? error.message : 'Unable to load notebook.');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      Object.entries(noteDrafts).forEach(([id, note]) => {
        const saved = highlights.find((highlight) => highlight.id === id);
        if (saved && (saved.note || '') !== note)
          updateHighlightNote(id, note).catch((error) =>
            toast.error(error instanceof Error ? error.message : 'Unable to update note.'),
          );
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [noteDrafts, highlights]);

  const groupedHighlights = useMemo(
    () =>
      highlights.reduce<Record<string, SavedHighlight[]>>((groups, highlight) => {
        groups[highlight.postId] = groups[highlight.postId] || [];
        groups[highlight.postId].push(highlight);
        return groups;
      }, {}),
    [highlights],
  );

  const handleDelete = async (id: string) => {
    await deleteHighlight(id).catch((error) =>
      toast.error(error instanceof Error ? error.message : 'Unable to delete highlight.'),
    );
    setHighlights((current) => current.filter((highlight) => highlight.id !== id));
    setNoteDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const savedPostRows = savedPosts.map((saved) => backendArticleToPost(saved.article));

  return (
    <div className="app-page">
      <p className="mono-label mb-3 text-app-action">Notebook</p>
      <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Highlights and saved posts</h1>
      <p className="mt-3 max-w-[65ch] text-sm leading-6 text-app-muted">
        Your saved quotes from dispatches you have read.
      </p>

      {notice && (
        <Alert tone="error" className="mt-6">
          {notice}
        </Alert>
      )}

      <nav className="mt-8 flex gap-5 border-b border-app-border" aria-label="Notebook tabs">
        {[
          ['highlights', 'Highlights', highlights.length],
          ['posts', 'Saved posts', savedPosts.length],
        ].map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id as NotebookTab)}
            className={`border-b-2 pb-3 font-mono text-[11px] uppercase tracking-wider ${activeTab === id ? 'border-app-action text-app-action' : 'border-transparent text-app-muted hover:text-app-heading'}`}
          >
            {label} <span className="tabular-nums">{count}</span>
          </button>
        ))}
      </nav>

      {activeTab === 'highlights' ? (
        <div className="mt-8">
          {highlights.length === 0 ? (
            <p className="text-sm italic text-app-muted">
              You have not saved any quotes yet. Highlight text in any post to save it here.
            </p>
          ) : (
            Object.entries(groupedHighlights).map(([postId, items]) => (
              <section key={postId} className="border-b border-app-border py-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-app-muted">
                      {items[0].channelName} · {items.length} saved
                    </p>
                    <h2 className="mt-1 truncate text-base font-semibold text-app-heading">{items[0].postTitle}</h2>
                  </div>
                  <Link
                    to={postId ? `/app/p/${postId}` : '/app'}
                    className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
                  >
                    Open
                  </Link>
                </div>
                <div className="space-y-5">
                  {items.map((highlight) => (
                    <article key={highlight.id}>
                      <blockquote className="border-l-2 border-app-action pl-4 text-base italic leading-7 text-app-text">
                        {highlight.text}
                      </blockquote>
                      <TextArea
                        value={noteDrafts[highlight.id] ?? highlight.note ?? ''}
                        onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [highlight.id]: event.target.value }))}
                        placeholder="Private note..."
                        className="mt-3 min-h-16 text-sm leading-6"
                      />
                      <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[11px] text-app-muted">
                        <span>{formatTime(highlight.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(highlight.id)}
                          className="text-app-action hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <div className="mt-8 border-t border-app-border">
          {savedPostRows.length === 0 ? (
            <p className="py-6 text-sm italic text-app-muted">No saved posts yet.</p>
          ) : (
            savedPostRows.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      )}
    </div>
  );
};
