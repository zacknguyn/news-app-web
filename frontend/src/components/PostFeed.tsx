import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bookmark, Plus } from 'lucide-react';
import { PostCard } from './PostCard';
import { ContextPanel, type ContextMode } from './ContextPanel';
import { clearProgress, readProgress, type ReadingProgress } from '../lib/readingProgress';
import { backendApi } from '../lib/api';
import { backendArticleToPost, backendPostToPost, backendTopicToChannel } from '../lib/backendAdapters';
import { useKeyboard } from '../lib/useKeyboard';
import { Alert } from './ui/Alert';
import type { Channel, Post } from '../types';

const HOME_FEED_PAGE_SIZE = 20;
const LOAD_MORE_PAGE_SIZE = 12;

const sortTabs = ['Hot', 'New', 'Top', 'Controversial', 'Rising'];

export const PostFeed: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [feedPage, setFeedPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedNotice, setFeedNotice] = useState('');
  const [trendingArticles, setTrendingArticles] = useState<Post[]>([]);
  const [latestArticles, setLatestArticles] = useState<Post[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Post[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Post[]>([]);
  const [activeSort, setActiveSort] = useState('Hot');
  const feedSentinelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProgress = async () => {
      try {
        const nextProgress = await readProgress();
        if (isMounted) setProgress(nextProgress);
      } catch {
        if (isMounted) setProgress(null);
      }
    };

    loadProgress();
    window.addEventListener('focus', loadProgress);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', loadProgress);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setIsLoadingPosts(true);
      setFeedNotice('');

      try {
        const [backendTopics, trendingArticleResults, latestResults, editorsPicksResults, featuredResults] = await Promise.all([
          backendApi.getTopics(),
          backendApi.getTrendingArticles(6).catch(() => []),
          backendApi.getLatestArticles(4).catch(() => []),
          backendApi.getEditorsPicks().catch(() => []),
          backendApi.getFeaturedArticles().catch(() => []),
        ]);
        const nextChannels = backendTopics.map(backendTopicToChannel);
        let activeChannel = slug
          ? nextChannels.find((channel) => channel.slug === slug || channel.id === slug)
          : null;

        if (slug && !activeChannel) {
          const topicBySlug = await backendApi.getTopicBySlug(slug).catch(() => null);
          if (topicBySlug) {
            activeChannel = backendTopicToChannel(topicBySlug);
            nextChannels.push(activeChannel);
          }
        }

        const backendPosts = activeChannel
          ? await backendApi.getPostsByTopic(Number(activeChannel.id), 0, HOME_FEED_PAGE_SIZE)
          : await backendApi.getHotPosts(0, HOME_FEED_PAGE_SIZE);

        if (!isMounted) return;
        setChannels(nextChannels);
        setPosts(backendPosts.content.map(backendPostToPost));
        setFeedPage(0);
        setHasMorePosts(!backendPosts.last);
        setTrendingArticles(trendingArticleResults.map(backendArticleToPost));
        setLatestArticles(latestResults.map(backendArticleToPost));
        setEditorsPicks(editorsPicksResults.map(backendArticleToPost));
        setFeaturedArticles(featuredResults.map(backendArticleToPost));
      } catch (error) {
        if (!isMounted) return;
        setFeedNotice(error instanceof Error ? error.message : 'Backend feed unavailable. The server may be offline — try again later or check your connection.');
        setChannels([]);
        setPosts([]);
        setHasMorePosts(false);
        setTrendingArticles([]);
        setLatestArticles([]);
        setEditorsPicks([]);
        setFeaturedArticles([]);
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    };

    loadPosts();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const activeChannel = slug ? channels.find((channel) => channel.slug === slug || channel.id === slug) || null : null;
  const visibleProgress = progress && progress.progress < 98 ? progress : null;

  useEffect(() => {
    setFocusedIndex(-1);
    postRefs.current = [];
  }, [posts.length]);

  const enabled = !isLoadingPosts && posts.length > 0;
  useKeyboard([
    {
      key: 'j', handler: () => {
        if (!enabled) return;
        setFocusedIndex((prev) => {
          const next = Math.min(prev + 1, posts.length - 1);
          postRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
      }, enabled,
    },
    {
      key: 'k', handler: () => {
        if (!enabled) return;
        setFocusedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          postRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
      }, enabled,
    },
    {
      key: 'Enter', handler: () => {
        if (focusedIndex < 0 || focusedIndex >= posts.length) return;
        navigate(`/app/p/${posts[focusedIndex].id}`);
      }, enabled: enabled && focusedIndex >= 0,
    },
    {
      key: 'Escape', handler: () => {
        setFocusedIndex(-1);
      }, enabled: focusedIndex >= 0,
    },
  ]);

  useEffect(() => {
    const node = feedSentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) handleLoadMore();
        }
      },
      { rootMargin: '320px 0px 320px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedSentinelRef.current, hasMorePosts, isLoadingMore, activeChannel?.id]);

  const dismissProgress = async () => {
    if (!visibleProgress) return;
    await clearProgress(visibleProgress.postId).catch(() => undefined);
    setProgress(null);
  };

  const postsRef = useRef(posts);
  postsRef.current = posts;

  const handleVote = useCallback(async (postId: string, vote: 'up' | 'down') => {
    const previousPosts = postsRef.current;
    const voteDelta = vote === 'up' ? 1 : -1;

    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;
        const previousVote = post.userVote;
        const clearedPost = {
          ...post,
          upvotes: previousVote === 'up' ? Math.max(0, post.upvotes - 1) : post.upvotes,
          downvotes: previousVote === 'down' ? Math.max(0, post.downvotes - 1) : post.downvotes,
        };

        if (previousVote === vote) return { ...clearedPost, userVote: null };

        return {
          ...clearedPost,
          upvotes: vote === 'up' ? clearedPost.upvotes + 1 : clearedPost.upvotes,
          downvotes: vote === 'down' ? clearedPost.downvotes + 1 : clearedPost.downvotes,
          userVote: vote,
        };
      }),
    );

    try {
      const voteResult = await backendApi.votePost(postId, voteDelta);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                upvotes: Math.max(voteResult.score, 0),
                downvotes: Math.max(-voteResult.score, 0),
                userVote: voteResult.userVote === 1 ? 'up' : voteResult.userVote === -1 ? 'down' : null,
              }
            : post,
        ),
      );
    } catch (error) {
      setPosts(previousPosts);
      toast.error(error instanceof Error ? error.message : 'Vote failed.');
    }
  }, []);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMorePosts) return;
    const nextPage = feedPage + 1;
    setIsLoadingMore(true);

    try {
      const response = activeChannel
        ? await backendApi.getPostsByTopic(Number(activeChannel.id), nextPage, LOAD_MORE_PAGE_SIZE)
        : await backendApi.getHotPosts(nextPage, LOAD_MORE_PAGE_SIZE);

      setPosts((currentPosts) => [...currentPosts, ...response.content.map(backendPostToPost)]);
      setFeedPage(nextPage);
      setHasMorePosts(!response.last);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load more reports. Try scrolling again or refreshing the page.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleJoin = async () => {
    if (!activeChannel) return;
    const previousChannels = channels;
    setChannels((current) =>
      current.map((channel) =>
        channel.id === activeChannel.id
          ? {
              ...channel,
              joined: !channel.joined,
              memberCount: Math.max(0, (channel.memberCount || 0) + (channel.joined ? -1 : 1)),
            }
          : channel,
      ),
    );

    try {
      const updated = activeChannel.joined
        ? await backendApi.leaveTopic(activeChannel.id)
        : await backendApi.joinTopic(activeChannel.id);
      const nextChannel = backendTopicToChannel(updated);
      setChannels((current) => current.map((channel) => (channel.id === nextChannel.id ? nextChannel : channel)));
    } catch (error) {
      setChannels(previousChannels);
      toast.error(error instanceof Error ? error.message : 'Unable to update channel membership.');
    }
  };

  const contextMode: ContextMode = activeChannel
    ? { kind: 'channel', channel: activeChannel, topPosts: posts }
    : {
        kind: 'front-page',
        trendingPosts: trendingArticles,
        savedCount: 0,
        highlightsCount: progress?.highlightCount ?? 0,
        latestArticles,
        editorsPicks,
        featuredArticles,
      };

  return (
    <div className="grid w-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="min-w-0 border-r border-app-border">
        {visibleProgress && (
          <aside className="border-b border-app-border bg-app-surface-alt px-5 py-5" aria-label="Continue reading">
            <div className="flex items-start gap-4">
              <Link to={`/app/p/${visibleProgress.postId}`} className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2 text-[12px] text-app-action">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="font-semibold tracking-wider">Resume</span>
                  <span className="tabular-nums">{visibleProgress.progress}%</span>
                </div>
                <h2 className="truncate text-sm font-semibold text-app-heading hover:text-app-action">
                  {visibleProgress.title}
                </h2>
                <div className="mt-2 h-px bg-app-border">
                  <div className="h-full bg-app-action transition-all" style={{ width: `${visibleProgress.progress}%` }} />
                </div>
              </Link>
              <button
                type="button"
                onClick={dismissProgress}
                className="mt-1 min-h-10 px-2 text-[12px] text-app-muted hover:text-app-action"
              >
                Hide
              </button>
            </div>
          </aside>
        )}

        <div className="border-b border-app-border px-5 pb-6 pt-5">
          {activeChannel ? (
            <ChannelHeader channel={activeChannel} onToggleJoin={handleToggleJoin} />
          ) : (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-[28px] font-semibold tracking-[-0.01em] text-app-heading">Home</h1>
                  <p className="mt-1.5 text-[13px] text-app-muted">
                    {posts.length.toLocaleString('en-US')} posts
                  </p>
                </div>
                <Link
                  to="/app/c/new"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 border border-app-border px-4 text-[12px] font-medium text-app-action transition-colors hover:border-app-action"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create community
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="border-b border-app-border px-5">
          <nav aria-label="Sort reports" className="-mb-px flex gap-6 overflow-x-auto">
            {sortTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveSort(tab)}
                className={`relative shrink-0 pb-3 pt-2 text-[12px] font-medium tracking-wide transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:transition-colors ${
                  activeSort === tab
                    ? 'text-app-action after:bg-app-action'
                    : 'text-app-muted after:bg-transparent hover:text-app-heading'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {!activeChannel && (trendingArticles.length > 0 || editorsPicks.length > 0) && (
          <div className="border-b border-app-border px-5 py-4 lg:hidden">
            <div className="flex gap-6 overflow-x-auto pb-1">
              {trendingArticles.slice(0, 4).map((post) => (
                <Link
                  key={post.id}
                  to={`/app/p/${post.id}`}
                  className="min-w-0 shrink-0"
                >
                  <p className="text-[11px] font-semibold tracking-wider text-app-muted">Trending</p>
                  <p className="mt-1 w-48 truncate text-[13px] font-medium text-app-heading hover:text-app-action">{post.title}</p>
                </Link>
              ))}
              {editorsPicks.slice(0, 2).map((post) => (
                <Link
                  key={post.id}
                  to={`/app/p/${post.id}`}
                  className="min-w-0 shrink-0 border-l border-app-border pl-5"
                >
                  <p className="text-[11px] font-semibold tracking-wider text-app-accent">Editor&apos;s pick</p>
                  <p className="mt-1 w-48 truncate text-[13px] font-medium text-app-heading hover:text-app-action">{post.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {feedNotice && (
          <div className="px-4 pb-4 pt-5">
            <Alert tone="warning">{feedNotice}</Alert>
          </div>
        )}

        {isLoadingPosts ? (
          <div className="px-5 pb-8 pt-6">
            <span className="text-[12px] font-medium text-app-muted">Loading…</span>
            <div className="mt-6 space-y-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[3rem_minmax(0,1fr)_8rem] gap-3 border-b border-app-border pb-5 animate-skeleton"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="h-20 border border-app-border bg-app-surface-alt" />
                  <div className="space-y-3">
                    <div className="h-3 w-1/3 border border-app-border bg-app-surface-alt" />
                    <div className="h-5 w-5/6 border border-app-border bg-app-surface-alt" />
                    <div className="h-3 w-2/3 border border-app-border bg-app-surface-alt" />
                  </div>
                  <div className="hidden aspect-square border border-app-border bg-app-surface-alt sm:block" />
                </div>
              ))}
            </div>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div>
              {posts.map((post, index) => (
                <div
                  key={`feed-${post.id}-${index}`}
                  ref={(el) => { postRefs.current[index] = el; }}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(index * 40, 500)}ms` }}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <PostCard post={post} onVote={handleVote} />
                </div>
              ))}
            </div>
            <div ref={feedSentinelRef} className="h-px" aria-hidden="true" />
            {isLoadingMore ? (
              <div className="border-b border-app-border px-5 py-8">
                <span className="text-[12px] font-medium text-app-muted">Loading more…</span>
              </div>
            ) : !hasMorePosts ? (
              <div className="border-b border-app-border px-5 py-8">
                <p className="text-[13px] text-app-muted">No more reports.</p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="px-5 py-16">
            <p className="text-[14px] text-app-muted">No posts yet in this feed. <Link to="/app/submit" className="font-medium text-app-action hover:underline">Write the first one</Link>.</p>
          </div>
        )}
      </section>

      <ContextPanel mode={contextMode} />
    </div>
  );
};

const ChannelHeader: React.FC<{ channel: Channel; onToggleJoin: () => void }> = ({ channel, onToggleJoin }) => (
  <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] gap-4">
    <img
      src={channel.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(channel.name)}`}
      alt=""
      className="h-12 w-12 border border-app-border object-cover"
    />
    <div className="min-w-0">
      <p className="mb-1.5 text-[12px] font-semibold tracking-wider text-app-muted">Community</p>
      <h1 className="truncate text-2xl font-semibold tracking-[-0.01em] text-app-heading">{channel.name}</h1>
      <p className="mt-1.5 line-clamp-2 text-[14px] leading-6 text-app-text">{channel.description}</p>
      <p className="mt-2 text-[12px] text-app-muted">
        {(channel.memberCount || 0).toLocaleString('en-US')} members
        <span aria-hidden="true"> · </span>
        {(channel.postCount || 0).toLocaleString('en-US')} reports
      </p>
    </div>
    <button
      type="button"
      onClick={onToggleJoin}
      className="h-10 self-start border border-app-border px-4 text-[12px] font-medium text-app-action transition-colors hover:border-app-action hover:bg-app-action hover:text-app-on-action"
    >
      {channel.joined ? 'Joined' : 'Join'}
    </button>
  </div>
);
