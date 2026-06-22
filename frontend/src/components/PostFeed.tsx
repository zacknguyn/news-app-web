import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bookmark, Plus } from 'lucide-react';
import { PostCard } from './PostCard';
import { clearProgress, readProgress, type ReadingProgress } from '../lib/readingProgress';
import { backendApi } from '../lib/api';
import { backendPostToPost, backendTopicToChannel } from '../lib/backendAdapters';
import { useKeyboard } from '../lib/useKeyboard';
import { Alert } from './ui/Alert';
import type { Channel, Post } from '../types';

const HOME_FEED_PAGE_SIZE = 20;
const LOAD_MORE_PAGE_SIZE = 12;

const sortTabs = ['Hot', 'New', 'Top', 'Controversial', 'Rising'];

const getChannelIcon = (name: string) => {
  const norm = name.toLowerCase();
  if (norm.includes('tech')) return '⚡';
  if (norm.includes('geopolitics') || norm.includes('politics')) return '🌐';
  if (norm.includes('economy') || norm.includes('finance') || norm.includes('market')) return '📈';
  if (norm.includes('science') || norm.includes('health') || norm.includes('biotech')) return '🧬';
  return '📑';
};

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
        const backendTopics = await backendApi.getTopics();
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
      } catch (error) {
        if (!isMounted) return;
        setFeedNotice(error instanceof Error ? error.message : 'Backend feed unavailable. The server may be offline — try again later or check your connection.');
        setChannels([]);
        setPosts([]);
        setHasMorePosts(false);
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
    ));

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

  return (
    <div className="bg-bg min-h-screen text-on-surface w-full">
      <div className="max-w-[640px] mx-auto px-4 py-8">
        {/* Resume reading toast */}
        {visibleProgress && (
          <aside className="border border-primary/20 bg-green-50/20 px-5 py-3.5 mb-6 rounded-xl animate-scale-in" aria-label="Continue reading">
            <div className="flex items-center justify-between gap-4">
              <Link to={`/app/p/${visibleProgress.postId}`} className="min-w-0 flex-grow">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-primary font-bold">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="uppercase tracking-wider">Resume dispatch reading</span>
                  <span className="bg-green-100 px-1.5 py-0.5 rounded text-[10px] tabular-nums">{visibleProgress.progress}%</span>
                </div>
                <h2 className="truncate text-xs font-bold text-on-surface hover:text-primary transition-colors">
                  {visibleProgress.title}
                </h2>
              </Link>
              <button
                type="button"
                onClick={dismissProgress}
                className="text-xs text-outline hover:text-primary font-bold"
              >
                Dismiss
              </button>
            </div>
          </aside>
        )}

        {/* Topic Pill Carousel (TopicRail) */}
        <section className="mb-8">
          <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
            <Link
              to="/app"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                !activeChannel
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high hover:text-primary'
              }`}
            >
              🔥 Global Live Feed
            </Link>
            {channels.map((channel) => {
              const active = activeChannel?.id === channel.id;
              const icon = getChannelIcon(channel.name);
              return (
                <Link
                  key={channel.id}
                  to={`/app/c/${channel.slug || channel.id}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    active
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high hover:text-primary'
                  }`}
                >
                  <span className="mr-1.5">{icon}</span>
                  {channel.name}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Feed Header / Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20 mb-6">
          <div>
            {activeChannel ? (
              <div>
                <h1 className="text-xl font-serif font-bold text-on-surface flex items-center gap-2">
                  {activeChannel.name}
                  <span className="bg-green-100 text-primary text-[10px] px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider">
                    Domain
                  </span>
                </h1>
                <p className="text-xs text-on-surface-variant mt-1">
                  {activeChannel.memberCount || 0} Contributors • {activeChannel.description}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-serif font-bold text-on-surface">Intelligence Hub</h1>
                <p className="text-xs text-on-surface-variant mt-1">Analyzing Live Signal Clusters</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeChannel && (
              <button
                type="button"
                onClick={handleToggleJoin}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activeChannel.joined
                    ? 'bg-surface-container border-outline-variant text-on-surface-variant'
                    : 'bg-primary text-white border-primary hover:brightness-110'
                }`}
              >
                {activeChannel.joined ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
            
            <div className="flex border border-outline-variant/30 rounded-full p-0.5 bg-surface-container-low">
              {sortTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveSort(tab)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
                    activeSort === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {feedNotice && (
          <div className="mb-6">
            <Alert tone="warning">{feedNotice}</Alert>
          </div>
        )}

        {/* Post List */}
        <div className="space-y-6">
          {isLoadingPosts ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl border border-outline-variant/30 bg-white/50 animate-skeleton space-y-4"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-1/4 bg-surface-container rounded" />
                    <div className="h-4 w-20 bg-surface-container rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-surface-container rounded" />
                  <div className="h-3 w-5/6 bg-surface-container rounded" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="space-y-6">
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
                <div className="py-8 text-center">
                  <span className="text-xs font-semibold text-outline">Fetching deeper signal clusters…</span>
                </div>
              ) : !hasMorePosts ? (
                <div className="py-8 text-center border-t border-outline-variant/20 mt-6">
                  <p className="text-xs font-semibold text-outline uppercase tracking-wider">End of Vetted Intel Stream</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-outline-variant/20 p-8">
              <p className="text-sm text-on-surface-variant">No signal dispatches detected in this domain.</p>
              <Link to="/app/submit" className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-full text-xs font-bold hover:brightness-110 transition-all">
                <Plus className="h-3.5 w-3.5" /> File First Dispatch
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostFeed;
