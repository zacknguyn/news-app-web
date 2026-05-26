import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PostCard } from './PostCard';
import { MOCK_CHANNELS, MOCK_POSTS } from '../lib/mockData';
import { clearProgress, readProgress, type ReadingProgress } from '../lib/readingProgress';
import { backendApi } from '../lib/api';
import { backendPostToPost, backendTopicToChannel } from '../lib/backendAdapters';
import { Alert } from './ui/Alert';
import type { Channel, Post } from '../types';

const formatLastActive = (date: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const PostFeed: React.FC = () => {
  const { slug } = useParams();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [feedNotice, setFeedNotice] = useState('');

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
        const activeChannel = slug ? nextChannels.find(channel => channel.slug === slug || channel.id === slug) : null;
        const backendPosts = activeChannel
          ? await backendApi.getPostsByTopic(Number(activeChannel.id))
          : await backendApi.getHotPosts();

        if (!isMounted) return;
        setChannels(nextChannels);
        setPosts(backendPosts.content.map(backendPostToPost));
      } catch (error) {
        if (!isMounted) return;
        const fallbackChannel = slug ? MOCK_CHANNELS.find(channel => channel.slug === slug || channel.id === slug) : null;
        setChannels(MOCK_CHANNELS);
        setPosts(fallbackChannel ? MOCK_POSTS.filter(post => post.channelId === fallbackChannel.id) : MOCK_POSTS);
        setFeedNotice(error instanceof Error ? error.message : 'Backend feed unavailable. Showing local preview data.');
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const visibleProgress = progress && progress.progress < 98 ? progress : null;

  const dismissProgress = async () => {
    if (!visibleProgress) return;
    await clearProgress(visibleProgress.postId).catch(() => undefined);
    setProgress(null);
  };

  const handleVote = async (postId: string, vote: 'up' | 'down') => {
    const previousPosts = posts;
    const voteDelta = vote === 'up' ? 1 : -1;

    setPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id !== postId) return post;
        const previousVote = post.userVote;
        const clearedPost = {
          ...post,
          upvotes: previousVote === 'up' ? Math.max(0, post.upvotes - 1) : post.upvotes,
          downvotes: previousVote === 'down' ? Math.max(0, post.downvotes - 1) : post.downvotes,
        };

        if (previousVote === vote) {
          return { ...clearedPost, userVote: null };
        }

        return {
          ...clearedPost,
          upvotes: vote === 'up' ? clearedPost.upvotes + 1 : clearedPost.upvotes,
          downvotes: vote === 'down' ? clearedPost.downvotes + 1 : clearedPost.downvotes,
          userVote: vote,
        };
      })
    );

    try {
      const voteResult = await backendApi.votePost(postId, voteDelta);
      setPosts(currentPosts => currentPosts.map(post => {
        if (post.id !== postId) return post;
        return {
          ...post,
          upvotes: Math.max(voteResult.score, 0),
          downvotes: Math.max(-voteResult.score, 0),
          userVote: voteResult.userVote === 1 ? 'up' : voteResult.userVote === -1 ? 'down' : null,
        };
      }));
    } catch (error) {
      setPosts(previousPosts);
      toast.error(error instanceof Error ? error.message : 'Vote failed.');
    }
  };

  const activeChannelName = slug
    ? channels.find(channel => channel.slug === slug || channel.id === slug)?.name || 'Channel'
    : 'Truth Feed';

  return (
    <div className="mx-auto max-w-[1040px] px-4 pb-10 pt-8 sm:px-6 lg:px-10">
      {visibleProgress && (
        <div data-motion="page" className="mb-5 flex items-center gap-3 rounded-[8px] border border-[var(--color-app-border)] bg-white px-5 py-4 shadow-[var(--shadow-hex-card)]">
          <Link to={`/app/p/${visibleProgress.postId}`} className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--color-app-action)]">
              <span>Continue Reading</span>
              <span className="text-[var(--color-app-border)]">/</span>
              <span className="text-[var(--color-app-muted)]">{visibleProgress.progress}%</span>
            </div>
            <div className="truncate text-sm font-semibold text-[var(--color-app-ink)]">{visibleProgress.title}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-app-muted)]">
              <span>{visibleProgress.channelName}</span>
              <span>•</span>
              <span>{visibleProgress.trustLabel}</span>
              <span>•</span>
              <span>{formatLastActive(visibleProgress.updatedAt)}</span>
              {(visibleProgress.highlightCount || 0) > 0 && (
                <>
                  <span>•</span>
                  <span>{visibleProgress.highlightCount} notes</span>
                </>
              )}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-app-border)]">
              <div className="h-full bg-[var(--color-app-action)]" style={{ width: `${visibleProgress.progress}%` }} />
            </div>
          </Link>
          <button
            type="button"
            onClick={dismissProgress}
            className="min-h-10 shrink-0 rounded-[4px] border border-[var(--color-app-border)] bg-white px-3 py-1 text-sm font-normal text-[var(--color-app-muted)] transition-colors hover:border-[var(--color-app-muted)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-app-ink)]"
          >
            Dismiss
          </button>
        </div>
      )}
      <div data-motion="page" className="sticky top-3 z-10 mb-5 rounded-[8px] border border-[var(--color-app-border)] bg-white/90 px-5 py-4 shadow-[var(--shadow-hex-card)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-sm font-semibold text-[var(--color-app-muted)]">
            {activeChannelName}
          </h1>
          <select className="cursor-pointer rounded-[7px] border-none bg-white px-3 py-2 text-sm font-normal text-[var(--color-app-muted)] shadow-[inset_0_0_0_1px_var(--color-app-border)] transition-colors hover:text-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] focus:ring-0">
            <option>Most Trusted</option>
            <option>Latest Reports</option>
            <option>Disputed</option>
          </select>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Link
            to="/app"
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-normal transition-colors ${!slug ? 'border-[var(--color-app-action)] bg-[var(--color-app-action)] text-white' : 'border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-muted)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-app-action)]'}`}
          >
            All
          </Link>
          {channels.map(channel => (
            <Link
              key={channel.id}
              to={`/app/c/${channel.slug}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-normal transition-colors ${slug === channel.slug || slug === channel.id ? 'border-[var(--color-app-action)] bg-[var(--color-app-action)] text-white' : 'border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-muted)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-app-action)]'}`}
            >
              {channel.name}
            </Link>
          ))}
        </nav>
      </div>
      {feedNotice && (
        <Alert tone="warning" className="mb-5">
          {feedNotice}
        </Alert>
      )}
      {isLoadingPosts ? (
        <div data-motion="list" className="p-6 text-center text-sm font-semibold text-[var(--color-app-faint)]">
          Loading reports
        </div>
      ) : posts.length > 0 ? posts.map(post => (
        <PostCard key={post.id} post={post} onVote={handleVote} />
      )) : (
        <div data-motion="list" className="p-6 text-center text-sm font-semibold text-[var(--color-app-faint)]">
          No reports found
        </div>
      )}
      <div data-motion="list" className="p-6 text-center text-sm font-semibold text-[var(--color-app-faint)]">
        End of feed
      </div>
    </div>
  );
};
