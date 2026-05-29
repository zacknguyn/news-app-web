import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Check, Clock3, Flame, Hash, Newspaper, Plus, Search, Users } from 'lucide-react';
import { backendApi } from '../lib/api';
import { backendPostToPost, backendTopicToChannel } from '../lib/backendAdapters';
import { useAuth } from '../context/AuthContext';
import { usePageMotion } from '../hooks/usePageMotion';
import { Alert } from '../components/ui/Alert';
import { ShareButton } from '../components/ui/ShareButton';
import type { Channel, Post } from '../types';

type SectionTab = 'following' | 'all' | 'trending';
type TopicPreviewMap = Record<string, Post[]>;

const PREVIEW_TOPIC_LIMIT = 12;

const byActivity = (a: Channel, b: Channel) =>
  (b.postCount || 0) - (a.postCount || 0) ||
  (b.memberCount || 0) - (a.memberCount || 0) ||
  a.name.localeCompare(b.name);

const formatCount = (value = 0) =>
  new Intl.NumberFormat('en-US', { notation: value >= 1000 ? 'compact' : 'standard' }).format(value);

const latestPostLabel = (post?: Post) => {
  if (!post) return 'No reports yet';
  return new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const TopicsScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const { isAuthenticated } = useAuth();
  const [topics, setTopics] = useState<Channel[]>([]);
  const [previewPosts, setPreviewPosts] = useState<TopicPreviewMap>({});
  const [activeTab, setActiveTab] = useState<SectionTab>('following');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [pendingTopicId, setPendingTopicId] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      try {
        const nextTopics = await backendApi.getTopics();
        if (!isMounted) return;

        const channels = nextTopics.map(backendTopicToChannel).sort(byActivity);
        setTopics(channels);
        setNotice('');
        setIsLoadingPreviews(true);

        const previewTargets = channels.slice(0, PREVIEW_TOPIC_LIMIT);
        const previewResults = await Promise.allSettled(
          previewTargets.map(async topic => {
            const response = await backendApi.getPostsByTopic(Number(topic.id), 0, 2);
            return [topic.id, response.content.map(backendPostToPost)] as const;
          })
        );

        if (!isMounted) return;
        setPreviewPosts(Object.fromEntries(
          previewResults
            .filter((result): result is PromiseFulfilledResult<readonly [string, Post[]]> => result.status === 'fulfilled')
            .map(result => result.value)
        ));
      } catch (error) {
        if (isMounted) setNotice(error instanceof Error ? error.message : 'Unable to load sections.');
      } finally {
        if (isMounted) setIsLoadingPreviews(false);
      }
    };

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  const joinedTopics = useMemo(() => topics.filter(topic => topic.joined).sort(byActivity), [topics]);
  const suggestedTopics = useMemo(() => topics.filter(topic => !topic.joined).sort(byActivity).slice(0, 6), [topics]);
  const trendingTopics = useMemo(() => [...topics].sort(byActivity), [topics]);

  const featuredTopic = useMemo(() => {
    return joinedTopics.find(topic => previewPosts[topic.id]?.length) ||
      trendingTopics.find(topic => previewPosts[topic.id]?.length) ||
      joinedTopics[0] ||
      trendingTopics[0] ||
      null;
  }, [joinedTopics, previewPosts, trendingTopics]);

  const visibleTopics = useMemo(() => {
    const base = activeTab === 'following'
      ? joinedTopics
      : activeTab === 'trending'
        ? trendingTopics
        : topics;
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? base.filter(topic =>
        topic.name.toLowerCase().includes(normalizedQuery) ||
        topic.description.toLowerCase().includes(normalizedQuery)
      )
      : base;

    return activeTab === 'all' ? [...filtered].sort((a, b) => a.name.localeCompare(b.name)) : filtered;
  }, [activeTab, joinedTopics, query, topics, trendingTopics]);

  const toggleTopic = async (topic: Channel) => {
    setPendingTopicId(topic.id);
    setTopics(current => current.map(candidate =>
      candidate.id === topic.id
        ? {
          ...candidate,
          joined: !candidate.joined,
          memberCount: Math.max(0, (candidate.memberCount || 0) + (candidate.joined ? -1 : 1)),
        }
        : candidate
    ));

    try {
      const updated = topic.joined
        ? await backendApi.leaveTopic(topic.id)
        : await backendApi.joinTopic(topic.id);
      const nextTopic = backendTopicToChannel(updated);
      setTopics(current => current.map(candidate => candidate.id === nextTopic.id ? nextTopic : candidate));
      toast.success(topic.joined ? 'Section removed from following.' : 'Section added to your front page.');
    } catch (error) {
      setTopics(current => current.map(candidate => candidate.id === topic.id ? topic : candidate));
      toast.error(error instanceof Error ? error.message : 'Unable to update section.');
    } finally {
      setPendingTopicId('');
    }
  };

  const tabs: Array<{ id: SectionTab; label: string; count: number }> = [
    { id: 'following', label: 'Following', count: joinedTopics.length },
    { id: 'all', label: 'All Sections', count: topics.length },
    { id: 'trending', label: 'Trending', count: trendingTopics.filter(topic => (topic.postCount || 0) > 0).length },
  ];

  const featuredPosts = featuredTopic ? previewPosts[featuredTopic.id] || [] : [];
  const featuredLead = featuredPosts[0];

  return (
    <div ref={pageRef} className="hex-page">
      <header data-motion="page" className="border-b border-[var(--color-app-border-clean)] pb-6">
        <div className="hex-kicker mb-2 flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Reader sections
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h1 className="hex-title">Sections</h1>
            <p className="hex-copy mt-2 max-w-3xl">
              Choose the beats that shape your front page. Every section remains readable; following decides what gets priority.
            </p>
          </div>
          {isAuthenticated && (
            <Link
              to="/app/c/new"
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-[var(--color-app-heading)] px-4 text-sm font-bold text-[var(--color-app-heading)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]"
            >
              <Plus className="h-4 w-4" />
              Start a section
            </Link>
          )}
        </div>
      </header>

      {notice && (
        <Alert tone="error" className="mt-5">
          {notice}
        </Alert>
      )}

      {joinedTopics.length > 0 ? (
        <section data-motion="page" className="border-b border-[var(--color-app-border-clean)] py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-app-muted)]">My reading sections</h2>
            <Link to="/app" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)] hover:underline">
              Front page
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {joinedTopics.slice(0, 8).map(topic => {
              const latest = previewPosts[topic.id]?.[0];
              return (
                <Link
                  key={topic.id}
                  to={`/app/c/${topic.slug}`}
                  className="min-w-[17rem] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-4 transition-colors hover:border-[var(--color-app-action)]"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-[var(--color-app-action)]" />
                      Following
                    </span>
                    <span>{formatCount(topic.postCount)} reports</span>
                  </div>
                  <h3 className="font-[var(--font-display)] text-lg font-bold leading-tight text-[var(--color-app-heading)]">{topic.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--color-app-muted)]">
                    {latest?.title || topic.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section data-motion="page" className="border-b border-[var(--color-app-border-clean)] py-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Choose sections for your front page</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {suggestedTopics.map(topic => (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic)}
                disabled={pendingTopicId === topic.id}
                className="min-h-24 border border-[var(--color-app-border)] p-4 text-left transition-colors hover:border-[var(--color-app-action)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-action)]">Recommended</span>
                <span className="mt-1 block font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">{topic.name}</span>
                <span className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--color-app-muted)]">{topic.description}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section data-motion="page" className="grid gap-6 py-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {featuredTopic && (
            <article className="mb-6 grid gap-5 border-b border-[var(--color-app-border-clean)] pb-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 bg-[var(--color-app-heading)] px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-bg)]">
                  <Newspaper className="h-3.5 w-3.5" />
                  Featured section
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link to={`/app/c/${featuredTopic.slug}`} className="block min-w-0">
                    <h2 className="font-[var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-app-heading)] hover:text-[var(--color-app-action)] md:text-4xl">
                      {featuredTopic.name}
                    </h2>
                  </Link>
                  <ShareButton
                    title={`${featuredTopic.name} section`}
                    text={featuredTopic.description}
                    url={`/app/c/${featuredTopic.slug}`}
                    kind="section"
                    className="inline-flex min-h-10 items-center gap-2 border border-[var(--color-app-border)] px-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]"
                    successMessage="Section link copied."
                  />
                </div>
                <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--color-app-text)]">{featuredTopic.description}</p>

                <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  {(featuredPosts.length ? featuredPosts : [undefined, undefined]).slice(0, 2).map((post, index) => (
                    post ? (
                      <Link key={post.id} to={`/app/p/${post.id}`} className="border-t border-[var(--color-app-border)] pt-3 hover:text-[var(--color-app-action)]">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Latest report</span>
                        <span className="mt-1 block font-[var(--font-display)] text-lg font-bold leading-tight">{post.title}</span>
                      </Link>
                    ) : (
                      <div key={`empty-${index}`} className="border-t border-[var(--color-app-border)] pt-3 text-sm leading-6 text-[var(--color-app-muted)]">
                        {isLoadingPreviews ? 'Loading reports...' : 'No recent reports in this section yet.'}
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
                {featuredLead?.mediaUrl && featuredLead.mediaType === 'image' ? (
                  <Link to={`/app/p/${featuredLead.id}`} className="story-image-frame block aspect-[4/3] border-0">
                    <img src={featuredLead.mediaUrl} alt="" className="story-image grayscale-[12%]" loading="lazy" />
                  </Link>
                ) : (
                  <div className="flex aspect-[4/3] items-end p-4">
                    <div>
                      <div className="mb-2 flex h-11 w-11 items-center justify-center border border-[var(--color-app-border)] bg-[var(--color-app-surface)] text-[var(--color-app-action)]">
                        <Hash className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold leading-5 text-[var(--color-app-muted)]">
                        {formatCount(featuredTopic.memberCount)} readers follow this section.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}

          <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className={`inline-flex min-h-10 items-center gap-2 px-4 text-sm font-bold ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-app-heading)] text-[var(--color-app-bg)]'
                      : 'border border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]'
                  }`}
                >
                  {tab.label}
                  <span className="font-mono text-xs">{tab.count}</span>
                </button>
              ))}
            </div>
            <label className="flex min-h-10 items-center gap-2 border border-[var(--color-app-border)] px-3">
              <Search className="h-4 w-4 text-[var(--color-app-muted)]" />
              <span className="sr-only">Search sections</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sections"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-app-muted)]"
              />
            </label>
          </div>

          {visibleTopics.length === 0 ? (
            <section data-motion="page" className="border border-[var(--color-app-border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-app-ink)]">
                {activeTab === 'following' ? 'No sections followed yet' : 'No sections found'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">
                {activeTab === 'following'
                  ? 'Follow a few sections to make your front page less generic.'
                  : 'Try a different search term or start a section.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'following' ? 'all' : 'following')}
                className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[var(--color-app-heading)] px-4 text-sm font-bold text-[var(--color-app-bg)] hover:bg-[var(--color-app-action)]"
              >
                {activeTab === 'following' ? 'Browse all sections' : 'View following'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          ) : (
            <div className="border-y border-[var(--color-app-border-clean)]">
              {visibleTopics.map(topic => {
                const latest = previewPosts[topic.id]?.[0];
                return (
                  <article key={`${activeTab}-${topic.id}`} data-motion="list" className="grid gap-4 border-t border-[var(--color-app-border-clean)] py-5 first:border-t-0 lg:grid-cols-[minmax(0,1fr)_11rem]">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">
                        {topic.joined ? (
                          <span className="inline-flex items-center gap-1 text-[var(--color-app-action)]">
                            <Check className="h-3.5 w-3.5" />
                            Following
                          </span>
                        ) : (
                          <span>Readable</span>
                        )}
                        <span aria-hidden="true">/</span>
                        <span>{formatCount(topic.memberCount)} readers</span>
                        <span aria-hidden="true">/</span>
                        <span>{formatCount(topic.postCount)} reports</span>
                      </div>
                      <Link to={`/app/c/${topic.slug}`} className="block">
                        <h2 className="font-[var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-app-heading)] hover:text-[var(--color-app-action)]">
                          {topic.name}
                        </h2>
                      </Link>
                      <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-[var(--color-app-text)]">{topic.description}</p>
                      <Link
                        to={latest ? `/app/p/${latest.id}` : `/app/c/${topic.slug}`}
                        className="mt-3 flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]"
                      >
                        <Clock3 className="h-4 w-4" />
                        <span className="line-clamp-1">
                          {latest ? latest.title : isLoadingPreviews ? 'Loading latest report...' : 'Open section'}
                        </span>
                        <span className="ml-auto shrink-0 text-xs">{latestPostLabel(latest)}</span>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <button
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        disabled={pendingTopicId === topic.id}
                        className={`inline-flex min-h-10 w-full items-center justify-center gap-2 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
                          topic.joined
                            ? 'border border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]'
                            : 'bg-[var(--color-app-heading)] text-[var(--color-app-bg)] hover:bg-[var(--color-app-action)]'
                        }`}
                      >
                        {topic.joined ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {topic.joined ? 'Following' : 'Follow'}
                      </button>
                      <ShareButton
                        title={`${topic.name} section`}
                        text={topic.description}
                        url={`/app/c/${topic.slug}`}
                        kind="section"
                        label="Share"
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[var(--color-app-border)] px-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]"
                        successMessage="Section link copied."
                      />
                      <Link to={`/app/c/${topic.slug}`} className="mt-3 hidden min-h-10 items-center justify-center gap-2 border border-[var(--color-app-border)] px-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] lg:flex">
                        Read section
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="border border-[var(--color-app-border)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-app-heading)]">
              <Flame className="h-4 w-4 text-[var(--color-app-action)]" />
              Active now
            </div>
            <div className="space-y-3">
              {trendingTopics.slice(0, 5).map((topic, index) => (
                <Link key={topic.id} to={`/app/c/${topic.slug}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 text-sm hover:text-[var(--color-app-action)]">
                  <span className="font-mono text-xs font-bold text-[var(--color-app-muted)]">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-[var(--color-app-heading)]">{topic.name}</span>
                    <span className="block text-xs text-[var(--color-app-muted)]">{formatCount(topic.postCount)} reports</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="border border-[var(--color-app-border)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-app-heading)]">
              <Users className="h-4 w-4 text-[var(--color-app-action)]" />
              Suggested
            </div>
            <div className="space-y-3">
              {suggestedTopics.slice(0, 5).map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  disabled={pendingTopicId === topic.id}
                  className="flex min-h-10 w-full items-center justify-between gap-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-[var(--color-app-heading)]">{topic.name}</span>
                    <span className="block text-xs text-[var(--color-app-muted)]">{formatCount(topic.memberCount)} readers</span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-[var(--color-app-action)]" />
                </button>
              ))}
              {suggestedTopics.length === 0 && (
                <p className="text-sm leading-6 text-[var(--color-app-muted)]">You are following every available section.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};
