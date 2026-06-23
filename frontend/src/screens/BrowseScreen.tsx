import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, MessageSquarePlus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { backendPostToPost } from '../lib/backendAdapters';
import { backendApi } from '../lib/api';
import { stripHtml } from '../lib/richContent';
import type { Post } from '../types';

const elapsed = (date: string) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const BrowseScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('All Sources');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [pendingSaveId, setPendingSaveId] = useState('');

  useEffect(() => {
    let mounted = true;
    backendApi.getHotPosts(0, 50)
      .then(page => { if (mounted) setPosts(page.content.map(backendPostToPost)); })
      .catch(error => { if (mounted) setNotice(error instanceof Error ? error.message : 'Unable to load posts.'); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, []);

  const sources = useMemo(() => ['All Sources', ...Array.from(new Set(posts.map(post => post.channelName))).slice(0, 8)], [posts]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return posts.filter(post => (source === 'All Sources' || post.channelName === source) && (!keyword || `${post.title} ${stripHtml(post.content)} ${post.author.name} ${post.channelName}`.toLowerCase().includes(keyword)));
  }, [posts, query, source]);

  useEffect(() => setVisibleCount(6), [query, source]);

  const toggleSaved = async (post: Post) => {
    setPendingSaveId(post.id);
    setPosts(current => current.map(item => item.id === post.id ? { ...item, savedByMe: !item.savedByMe } : item));
    try {
      if (post.savedByMe) await backendApi.unsavePost(post.id); else await backendApi.savePost(post.id);
      toast.success(post.savedByMe ? 'Post removed from saved items.' : 'Post saved.');
    } catch (error) {
      setPosts(current => current.map(item => item.id === post.id ? { ...item, savedByMe: post.savedByMe } : item));
      toast.error(error instanceof Error ? error.message : 'Unable to update saved items.');
    } finally { setPendingSaveId(''); }
  };

  return <div className="app-page mx-auto max-w-[720px]">
    <header className="mb-6">
      <p className="mb-3 text-[10px] font-semibold tracking-wide text-app-muted">Browse</p>
      <h1 className="text-[32px] font-bold tracking-tight text-app-heading">All posts</h1>
      <p className="mt-2 text-sm text-app-muted">Search and filter community discussions.</p>
    </header>

    <section className="sticky top-16 z-30 -mx-2 mb-8 bg-app-bg/90 px-2 py-4 backdrop-blur-xl">
      <label className="flex items-center rounded-xl border border-app-border bg-app-surface px-4 py-3 transition-shadow focus-within:border-app-action focus-within:shadow-[var(--shadow-focus)]">
        <Search className="mr-3 h-5 w-5 shrink-0 text-app-faint" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          aria-label="Search posts"
          placeholder="Search posts..."
          className="w-full border-0 bg-transparent p-0 text-sm text-app-heading outline-none placeholder:text-app-faint focus:ring-0"
        />
        {query && <button type="button" onClick={() => setQuery('')} className="font-mono text-[10px] text-app-action">Clear</button>}
      </label>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {sources.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setSource(item)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              source === item ? 'bg-app-action text-app-on-action' : 'bg-app-surface-alt text-app-muted hover:text-app-heading'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </section>

    {notice && (
      <div className="mb-6 bg-app-surface rounded-xl p-6 text-center shadow-[var(--shadow-tinted)]">
        <p className="text-sm text-app-muted">{notice}</p>
      </div>
    )}

    {isLoading ? (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="p-5 rounded-xl bg-app-surface animate-skeleton space-y-4 shadow-[var(--shadow-tinted)]">
            <div className="flex items-center justify-between">
              <div className="h-3 w-1/4 bg-app-surface-alt rounded" />
              <div className="h-4 w-16 bg-app-surface-alt rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-app-surface-alt rounded" />
            <div className="h-3 w-5/6 bg-app-surface-alt rounded" />
          </div>
        ))}
      </div>
    ) : filtered.length ? (
      <div className="space-y-6">
        {filtered.slice(0, visibleCount).map(post => {
          const excerpt = stripHtml(post.content);
          return (
            <article
              key={post.id}
              className="group rounded-xl bg-app-surface p-5 shadow-[var(--shadow-tinted)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <img loading="lazy" src={post.author.avatarUrl} alt="" className="h-9 w-9 rounded-lg border border-app-border object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-app-muted">{post.channelName}</p>
                    <p className="mt-0.5 truncate text-xs text-app-faint">{post.author.name} &middot; {elapsed(post.createdAt)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSaved(post)}
                  disabled={pendingSaveId === post.id}
                  aria-label={post.savedByMe ? 'Remove bookmark' : 'Bookmark post'}
                  className={`rounded-lg p-2 transition-colors ${
                    post.savedByMe ? 'bg-app-action-soft text-app-action' : 'text-app-faint hover:bg-app-surface-alt hover:text-app-action'
                  } disabled:opacity-40`}
                >
                  <Bookmark className="h-5 w-5" fill={post.savedByMe ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className={`mt-4 ${post.mediaType === 'image' && post.mediaUrl ? 'grid gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]' : ''}`}>
                <Link to={`/app/p/${post.id}`} className="min-w-0">
                  <h2 className="font-serif text-lg font-bold leading-snug text-app-heading transition-colors group-hover:text-app-action">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-app-muted">
                    {excerpt || 'Open this post to read the full discussion.'}
                  </p>
                </Link>
                {post.mediaType === 'image' && post.mediaUrl && (
                  <img loading="lazy" src={post.mediaUrl} alt="" className="h-24 w-full rounded-lg border border-app-border object-cover" />
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-app-border pt-4">
                <p className="text-xs text-app-muted">
                  {post.upvotes - post.downvotes} points &middot; {post.commentCount} comments
                </p>
                <Link
                  to={`/app/p/${post.id}`}
                  className="rounded-lg bg-app-action text-app-on-action px-4 py-2 text-xs font-semibold hover:brightness-110 transition-all"
                >
                  Read post
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    ) : (
      <div className="bg-app-surface rounded-xl p-10 text-center shadow-[var(--shadow-tinted)]">
        <p className="text-sm text-app-muted">No posts match this search.</p>
        <button
          onClick={() => { setQuery(''); setSource('All Sources'); }}
          className="mt-4 text-sm font-semibold text-app-action hover:underline"
        >
          Reset filters
        </button>
      </div>
    )}

    {visibleCount < filtered.length && (
      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={() => setVisibleCount(count => count + 6)}
          className="rounded-full border border-app-border px-8 py-3 text-sm font-semibold text-app-heading hover:bg-app-surface-alt active:scale-[0.97] transition-all"
        >
          Load more posts
        </button>
      </div>
    )}
  </div>;
};

export default BrowseScreen;
