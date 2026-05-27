import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bookmark, BookOpen, ChevronRight, Clock3, Flame, Hash, Mail, MessageSquare, Newspaper, PlusCircle, Search, Sparkles, TrendingUp } from 'lucide-react';
import { PostCard } from './PostCard';
import { clearProgress, readProgress, type ReadingProgress } from '../lib/readingProgress';
import { backendApi } from '../lib/api';
import { backendArticleToPost, backendPostToPost, backendTopicToChannel } from '../lib/backendAdapters';
import { Alert } from './ui/Alert';
import { VoteControl } from './ui/VoteControl';
import type { Channel, Post } from '../types';
import { stripHtml } from '../lib/richContent';

const HOME_FEED_PAGE_SIZE = 20;
const LOAD_MORE_PAGE_SIZE = 12;

const TOPIC_SECTION_TARGETS = [
  { label: 'Technology', slugs: ['cong-nghe', 'technology', 'tech'] },
  { label: 'Sports', slugs: ['the-thao', 'sports', 'sport'] },
  { label: 'Finance', slugs: ['tai-chinh', 'finance', 'business'] },
  { label: 'Culture', slugs: ['giai-tri', 'culture', 'entertainment'] },
];

type HomeTopicSection = {
  label: string;
  slug: string;
  viewHref: string;
  posts: Post[];
};

export const PostFeed: React.FC = () => {
  const { slug } = useParams();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [feedPage, setFeedPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedNotice, setFeedNotice] = useState('');
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Post[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Post[]>([]);
  const [topicSections, setTopicSections] = useState<HomeTopicSection[]>([]);
  const [savedArticlesCount, setSavedArticlesCount] = useState(0);
  const [readerHighlightsCount, setReaderHighlightsCount] = useState(0);

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
        const [
          backendTopics,
          featuredArticles,
          editorsPickArticles,
          trendingArticleResults,
          categories,
          savedArticles,
          readerHighlights,
        ] = await Promise.all([
          backendApi.getTopics(),
          backendApi.getFeaturedArticles().catch(() => []),
          backendApi.getEditorsPicks().catch(() => []),
          backendApi.getTrendingArticles(6).catch(() => []),
          backendApi.getCategories().catch(() => []),
          backendApi.getSavedArticles().catch(() => []),
          backendApi.getReaderHighlights().catch(() => []),
        ]);
        const nextChannels = backendTopics.map(backendTopicToChannel);
        const activeChannel = slug ? nextChannels.find(channel => channel.slug === slug || channel.id === slug) : null;
        const backendPosts = activeChannel
          ? await backendApi.getPostsByTopic(Number(activeChannel.id), 0, HOME_FEED_PAGE_SIZE)
          : await backendApi.getHotPosts(0, HOME_FEED_PAGE_SIZE);

        const nextTopicSections = slug
          ? []
          : await Promise.all(TOPIC_SECTION_TARGETS.map(async target => {
            const category = categories.find(candidate => target.slugs.includes(candidate.slug));
            if (!category) return null;

            const response = await backendApi.getArticlesByCategory(category.slug, 0, 3).catch(() => null);
            const sectionPosts = response?.content.map(backendArticleToPost) || [];
            if (sectionPosts.length === 0) return null;

            const matchingChannel = nextChannels.find(channel => target.slugs.includes(channel.slug));
            return {
              label: target.label,
              slug: category.slug,
              viewHref: matchingChannel ? `/app/c/${matchingChannel.slug}` : '/app/topics',
              posts: sectionPosts,
            };
          }));

        if (!isMounted) return;
        setChannels(nextChannels);
        setPosts(backendPosts.content.map(backendPostToPost));
        setFeedPage(0);
        setHasMorePosts(!backendPosts.last);
        setFeaturedPosts(featuredArticles.map(backendArticleToPost));
        setEditorsPicks(editorsPickArticles.map(backendArticleToPost));
        setTrendingArticles(trendingArticleResults.map(backendArticleToPost));
        setTopicSections(nextTopicSections.filter((section): section is HomeTopicSection => Boolean(section)));
        setSavedArticlesCount(savedArticles.length);
        setReaderHighlightsCount(readerHighlights.length);
      } catch (error) {
        if (!isMounted) return;
        setFeedNotice(error instanceof Error ? error.message : 'Backend feed unavailable.');
        setChannels([]);
        setPosts([]);
        setHasMorePosts(false);
        setFeaturedPosts([]);
        setEditorsPicks([]);
        setTrendingArticles([]);
        setTopicSections([]);
        setSavedArticlesCount(0);
        setReaderHighlightsCount(0);
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
  const leadPost = posts[0] || null;
  const secondaryPosts = posts.slice(1, 4);
  const latestPosts = posts.slice(leadPost ? 4 : 0);
  const activeChannelName = slug
    ? channels.find(channel => channel.slug === slug || channel.id === slug)?.name || 'Topic'
    : 'Front Page';
  const activeChannel = slug ? channels.find(channel => channel.slug === slug || channel.id === slug) || null : null;
  const digestPosts = posts.slice(0, 5);
  const isFrontPage = !slug;
  const trendingDiscussionPosts = posts
    .filter(post => post.commentCount > 0)
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 5);
  const featuredLead = featuredPosts[0] || editorsPicks[0] || null;
  const featuredRail = [
    ...featuredPosts.slice(featuredLead ? 1 : 0, 3),
    ...editorsPicks.filter(post => post.id !== featuredLead?.id),
  ].slice(0, 4);

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

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMorePosts) return;

    const nextPage = feedPage + 1;
    setIsLoadingMore(true);
    try {
      const response = activeChannel
        ? await backendApi.getPostsByTopic(Number(activeChannel.id), nextPage, LOAD_MORE_PAGE_SIZE)
        : await backendApi.getHotPosts(nextPage, LOAD_MORE_PAGE_SIZE);

      setPosts(currentPosts => [...currentPosts, ...response.content.map(backendPostToPost)]);
      setFeedPage(nextPage);
      setHasMorePosts(!response.last);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load more reports.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleJoin = async () => {
    if (!activeChannel) return;
    const previousChannels = channels;
    setChannels(current =>
      current.map(channel =>
        channel.id === activeChannel.id
          ? { ...channel, joined: !channel.joined, memberCount: Math.max(0, (channel.memberCount || 0) + (channel.joined ? -1 : 1)) }
          : channel
      )
    );

    try {
      const updated = activeChannel.joined
        ? await backendApi.leaveTopic(activeChannel.id)
        : await backendApi.joinTopic(activeChannel.id);
      const nextChannel = backendTopicToChannel(updated);
      setChannels(current => current.map(channel => channel.id === nextChannel.id ? nextChannel : channel));
    } catch (error) {
      setChannels(previousChannels);
      toast.error(error instanceof Error ? error.message : 'Unable to update channel membership.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] bg-[var(--color-app-bg)] px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      {visibleProgress && (
        <aside className="fixed bottom-20 left-4 right-4 z-30 border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-3 shadow-[var(--shadow-raised)] lg:hidden" aria-label="Continue reading">
          <div className="flex items-start gap-3">
            <Link to={`/app/p/${visibleProgress.postId}`} className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-action)]">
                <Bookmark className="h-3.5 w-3.5" />
                Resume
                <span className="text-[var(--color-app-muted)]">{visibleProgress.progress}%</span>
              </div>
              <h3 className="truncate text-sm font-bold text-[var(--color-app-heading)]">{visibleProgress.title}</h3>
              <div className="mt-2 h-1 bg-[var(--color-app-border)]">
                <div className="h-full bg-[var(--color-app-action)]" style={{ width: `${visibleProgress.progress}%` }} />
              </div>
            </Link>
            <button
              type="button"
              onClick={dismissProgress}
              className="min-h-10 px-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-faint)] hover:text-[var(--color-app-action)]"
            >
              Hide
            </button>
          </div>
        </aside>
      )}

      <header data-motion="page" className="mb-6 border-b-4 border-[var(--color-app-heading)] pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
              <Newspaper className="h-4 w-4" />
              Independent newsroom
            </div>
            <h1 className="font-[var(--font-display)] text-4xl font-bold leading-none text-[var(--color-app-heading)] sm:text-5xl">
              {activeChannelName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[var(--color-app-muted)]">
              Lead reporting, verified discussion, and community signals in one reading surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeChannel && (
              <button
                type="button"
                onClick={handleToggleJoin}
                className="inline-flex min-h-10 items-center border border-[var(--color-app-border)] px-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)] hover:border-[var(--color-app-action)]"
              >
                {activeChannel.joined ? 'Leave Channel' : 'Join Channel'}
              </button>
            )}
            <Link
              to="/app/c/new"
              className="inline-flex min-h-10 items-center gap-2 bg-[var(--color-app-heading)] px-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-surface)] hover:bg-[var(--color-app-action)]"
            >
              <PlusCircle className="h-4 w-4" />
              Start topic
            </Link>
          </div>
        </div>
      </header>

      <nav className="mb-8 flex gap-2 overflow-x-auto border-b border-[var(--color-app-border)] pb-4">
        <Link
          to="/app"
          className={`shrink-0 border px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${!slug ? 'border-[var(--color-app-action)] bg-[var(--color-brand-red-faint)] text-[var(--color-app-action)]' : 'border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]'}`}
        >
          All Topics
        </Link>
        {channels.map(channel => (
          <Link
            key={channel.id}
            to={`/app/c/${channel.slug}`}
            className={`shrink-0 border px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${slug === channel.slug || slug === channel.id ? 'border-[var(--color-app-action)] bg-[var(--color-brand-red-faint)] text-[var(--color-app-action)]' : 'border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]'}`}
          >
            {channel.name}
          </Link>
        ))}
      </nav>

      {feedNotice && (
        <Alert tone="warning" className="mb-8">
          {feedNotice}
        </Alert>
      )}

      {isLoadingPosts ? (
        <div data-motion="list" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <div className="h-72 animate-pulse bg-[var(--color-app-surface)]" />
            <div className="h-24 animate-pulse bg-[var(--color-app-surface)]" />
            <div className="h-24 animate-pulse bg-[var(--color-app-surface)]" />
          </div>
          <div className="hidden h-96 animate-pulse bg-[var(--color-app-surface)] lg:block" />
        </div>
      ) : posts.length > 0 && leadPost ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0">
            <article data-motion="list" className="grid gap-7 border-b border-[var(--color-app-border)] pb-7 lg:grid-cols-[minmax(0,1fr)_28rem]">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">
                  <span className="bg-[var(--color-app-action)] px-2 py-1 text-[var(--color-app-surface)]">Lead</span>
                  <Link to={`/app/c/${leadPost.channelId}`} className="text-[var(--color-app-action)] hover:underline">{leadPost.channelName}</Link>
                  <span>/</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {new Date(leadPost.createdAt).toLocaleDateString()}</span>
                </div>
                <Link to={`/app/p/${leadPost.id}`} className="block">
                  <h2 className="font-[var(--font-display)] text-4xl font-bold leading-[1.05] text-[var(--color-app-heading)] transition-colors hover:text-[var(--color-app-action)] sm:text-5xl">
                    {leadPost.title}
                  </h2>
                </Link>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-app-text)]">
                  {stripHtml(leadPost.content)}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <VoteControl label={leadPost.title} score={leadPost.upvotes - leadPost.downvotes} vote={leadPost.userVote} orientation="horizontal" onVote={(vote) => handleVote(leadPost.id, vote)} />
                  <Link to={`/app/p/${leadPost.id}#comments`} className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[var(--color-app-heading)] hover:text-[var(--color-app-action)]">
                    <MessageSquare className="h-4 w-4" />
                    {leadPost.commentCount} comments
                  </Link>
                </div>
              </div>
              {leadPost.mediaUrl && leadPost.mediaType === 'image' ? (
                <Link to={`/app/p/${leadPost.id}`} className="story-image-frame aspect-[16/11]">
                  <img src={leadPost.mediaUrl} alt="" className="story-image grayscale-[12%] transition-all hover:grayscale-0" />
                </Link>
              ) : (
                <div className="flex min-h-72 items-end border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Developing report</span>
                </div>
              )}
            </article>

            {secondaryPosts.length > 0 && (
              <div className="grid border-b border-[var(--color-app-border)] py-5 md:grid-cols-3 md:divide-x md:divide-[var(--color-app-border)]">
                {secondaryPosts.map((post, index) => (
                  <Link key={`secondary-${post.id}-${index}`} to={`/app/p/${post.id}`} className="group block border-t border-[var(--color-app-border)] py-4 first:border-t-0 md:border-t-0 md:px-4 md:first:pl-0 md:last:pr-0">
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-action)]">{post.channelName}</div>
                    <h3 className="font-[var(--font-display)] text-lg font-bold leading-tight text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">{post.title}</h3>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-app-muted)]">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {post.upvotes - post.downvotes} score
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {isFrontPage && featuredLead && (
              <section className="border-b border-[var(--color-app-border)] py-8">
                <div className="mb-4 flex items-end justify-between border-b-2 border-[var(--color-app-heading)] pb-3">
                  <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-app-heading)]">Featured</h2>
                  <Link to="/app/topics" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)] hover:underline">
                    Topics
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <Link to={`/app/p/${featuredLead.id}`} className="group grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                    {featuredLead.mediaUrl && featuredLead.mediaType === 'image' ? (
                      <span className="story-image-frame aspect-[4/3]">
                        <img src={featuredLead.mediaUrl} alt="" className="story-image grayscale-[14%] transition-all group-hover:grayscale-0" loading="lazy" />
                      </span>
                    ) : (
                      <span className="flex min-h-40 items-end border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Featured report</span>
                    )}
                    <span className="min-w-0">
                      <span className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-action)]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Curated by the newsroom
                      </span>
                      <span className="block font-[var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">
                        {featuredLead.title}
                      </span>
                      <span className="mt-3 block line-clamp-3 text-sm leading-6 text-[var(--color-app-muted)]">{stripHtml(featuredLead.content)}</span>
                    </span>
                  </Link>
                  {featuredRail.length > 0 && (
                    <div className="space-y-3 border-t border-[var(--color-app-border)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                      {featuredRail.map((post, index) => (
                        <Link key={`featured-rail-${post.id}-${index}`} to={`/app/p/${post.id}`} className="group block border-t border-[var(--color-app-border)] pt-3 first:border-t-0 first:pt-0">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">{post.channelName}</div>
                          <h3 className="mt-1 font-[var(--font-display)] text-lg font-bold leading-tight text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">{post.title}</h3>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="pt-7">
              <div className="mb-2 flex items-end justify-between border-b-2 border-[var(--color-app-heading)] pb-3">
                <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-app-heading)]">Latest Reports</h2>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">{posts.length} stories</span>
              </div>
              <div>
                {(latestPosts.length > 0 ? latestPosts : posts.slice(1)).map((post, index) => (
                  <PostCard key={`latest-${post.id}-${index}`} post={post} onVote={handleVote} />
                ))}
              </div>
              {hasMorePosts && (
                <div className="border-t border-[var(--color-app-border)] pt-5">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex min-h-10 items-center gap-2 border border-[var(--color-app-heading)] px-4 text-xs font-bold uppercase tracking-widest text-[var(--color-app-heading)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {isLoadingMore ? 'Loading' : 'Load more reports'}
                  </button>
                </div>
              )}
            </section>

            {isFrontPage && topicSections.length > 0 && (
              <section className="pt-10">
                <div className="mb-5 flex items-end justify-between border-b-2 border-[var(--color-app-heading)] pb-3">
                  <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-app-heading)]">Sections</h2>
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">By beat</span>
                </div>
                <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
                  {topicSections.map(section => (
                    <section key={section.slug} className="border-t-4 border-[var(--color-app-heading)] pt-4">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <h3 className="font-[var(--font-display)] text-xl font-bold text-[var(--color-app-heading)]">{section.label}</h3>
                        <Link to={section.viewHref} className="shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)] hover:underline">View topic</Link>
                      </div>
                      <div className="space-y-4">
                        {section.posts.map((post, index) => (
                          <Link key={`${section.slug}-${post.id}-${index}`} to={`/app/p/${post.id}`} className="group grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-[var(--color-app-border)] pt-4 first:border-t-0 first:pt-0">
                            <span className="font-mono text-sm font-bold text-[var(--color-app-muted)]">{String(index + 1).padStart(2, '0')}</span>
                            <span>
                              <span className="block font-[var(--font-display)] text-lg font-bold leading-tight text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">{post.title}</span>
                              <span className="mt-1 block text-xs font-semibold text-[var(--color-app-muted)]">{post.commentCount} comments / {post.upvotes} reads</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            )}

            {isFrontPage && (
              <>
                <section className="mt-12 border-y-4 border-[var(--color-app-action)] bg-[var(--color-news-ink)] px-4 py-7 text-[var(--color-news-paper)] sm:px-6">
                  <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-news-red-soft)]">
                        <Mail className="h-3.5 w-3.5" />
                        Reader membership
                      </div>
                      <h2 className="font-[var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-news-paper)]">Get the newsroom digest and support the reporting.</h2>
                    </div>
                    <Link to="/app/subscribe" className="inline-flex min-h-10 items-center justify-center bg-[var(--color-app-action)] px-5 text-sm font-bold uppercase tracking-widest text-[var(--color-app-surface)] hover:bg-[var(--color-app-action-hover)]">
                      Subscribe
                    </Link>
                  </div>
                </section>

                <section className="mt-8 border border-[var(--color-app-border)] p-5">
                  <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">
                        <Hash className="h-3.5 w-3.5" />
                        Topics
                      </div>
                      <h2 className="font-[var(--font-display)] text-xl font-bold text-[var(--color-app-heading)]">Looking for a specific beat or community?</h2>
                    </div>
                    <Link to="/app/topics" className="inline-flex min-h-10 items-center justify-center gap-2 border border-[var(--color-app-heading)] px-4 text-xs font-bold uppercase tracking-widest text-[var(--color-app-heading)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]">
                      <Search className="h-4 w-4" />
                      Browse topics
                    </Link>
                  </div>
                </section>
              </>
            )}
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {visibleProgress && (
              <section className="hidden border border-[var(--color-news-blue-soft)] bg-[var(--color-news-blue-wash)] p-4 shadow-[var(--shadow-subtle)] lg:block" aria-label="Continue reading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-news-blue)]">
                    <Bookmark className="h-3.5 w-3.5" />
                    Resume
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--color-app-muted)]">{visibleProgress.progress}%</span>
                </div>
                <Link to={`/app/p/${visibleProgress.postId}`} className="group block">
                  <h2 className="font-[var(--font-display)] text-lg font-bold leading-tight text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">
                    {visibleProgress.title}
                  </h2>
                  <div className="mt-4 h-1 bg-[var(--color-app-border)]">
                    <div className="h-full bg-[var(--color-news-blue)]" style={{ width: `${visibleProgress.progress}%` }} />
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={dismissProgress}
                  className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--color-app-faint)] hover:text-[var(--color-app-action)]"
                >
                  Hide resume
                </button>
              </section>
            )}

            {isFrontPage && (
              <section className="border border-[var(--color-news-blue-soft)] bg-[var(--color-news-blue-wash)] p-4">
                <h2 className="mb-3 flex items-center gap-2 font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">
                  <BookOpen className="h-4 w-4 text-[var(--color-news-blue)]" />
                  Reading History
                </h2>
                <div className="grid grid-cols-2 gap-3 border-b border-[var(--color-news-blue-soft)] pb-4 text-sm">
                  <div>
                    <div className="font-mono text-xl font-bold text-[var(--color-app-heading)]">{savedArticlesCount}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Saved</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-bold text-[var(--color-app-heading)]">{readerHighlightsCount}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Highlights</div>
                  </div>
                </div>
                {visibleProgress ? (
                  <Link to={`/app/p/${visibleProgress.postId}`} className="group mt-4 block">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Last progress</div>
                    <h3 className="font-[var(--font-display)] text-base font-bold leading-tight text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">{visibleProgress.title}</h3>
                    <div className="mt-3 h-1 bg-[var(--color-app-border)]">
                      <div className="h-full bg-[var(--color-news-blue)]" style={{ width: `${visibleProgress.progress}%` }} />
                    </div>
                  </Link>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-[var(--color-app-muted)]">Open a report to save reading progress and highlights here.</p>
                )}
              </section>
            )}

            {trendingDiscussionPosts.length > 0 && (
              <section className="border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-4">
                <h2 className="mb-3 flex items-center gap-2 font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">
                  <Flame className="h-4 w-4 text-[var(--color-app-action)]" />
                  Trending Discussions
                </h2>
                <div className="space-y-3">
                  {trendingDiscussionPosts.map((post, index) => (
                    <Link key={`discussion-${post.id}-${index}`} to={`/app/p/${post.id}#comments`} className="group block border-t border-[var(--color-app-border)] pt-3 first:border-t-0 first:pt-0">
                      <div className="mb-1 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">
                        <span>{post.channelName}</span>
                        <span>{post.commentCount} comments</span>
                      </div>
                      <h3 className="text-sm font-bold leading-5 text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">{post.title}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-4">
              <h2 className="mb-3 font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">Today&apos;s Brief</h2>
              <div className="space-y-3">
                {digestPosts.map((post, index) => (
                  <Link key={`digest-${post.id}-${index}`} to={`/app/p/${post.id}`} className="group grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-[var(--color-app-border)] pt-3 first:border-t-0 first:pt-0">
                    <span className="font-mono text-sm font-bold text-[var(--color-app-muted)]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-bold leading-5 text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">{post.title}</span>
                  </Link>
                ))}
              </div>
            </section>

            {isFrontPage && trendingArticles.length > 0 && (
              <section className="border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
                <h2 className="mb-3 font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">Most Read</h2>
                <div className="space-y-3">
                  {trendingArticles.slice(0, 4).map((post, index) => (
                    <Link key={`most-read-${post.id}-${index}`} to={`/app/p/${post.id}`} className="group block border-t border-[var(--color-app-border)] pt-3 first:border-t-0 first:pt-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">{post.channelName}</div>
                      <h3 className="mt-1 text-sm font-bold leading-5 text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">{post.title}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
              <h2 className="mb-2 font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">Reader Signals</h2>
              <p className="text-sm leading-6 text-[var(--color-app-muted)]">
                Votes and comments shape ranking, but stories stay structured like a reader first.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-mono text-xl font-bold text-[var(--color-app-heading)]">{posts.reduce((total, post) => total + post.commentCount, 0)}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Comments</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-[var(--color-app-heading)]">{channels.length}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Topics</div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div data-motion="list" className="border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-8">
          <div className="max-w-xl">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">No reports yet</div>
            <h2 className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-app-heading)]">This topic is waiting for its first story.</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-app-muted)]">Start with a sourced report, then let comments and votes build the discussion around it.</p>
            <Link to="/app/submit" className="mt-5 inline-flex min-h-10 items-center bg-[var(--color-app-heading)] px-4 text-sm font-bold text-[var(--color-app-surface)] hover:bg-[var(--color-app-action)]">
              Submit report
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
