import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { SearchInput } from '../components/ui/SearchInput';
import type { Channel } from '../types';

type SectionTab = 'following' | 'all' | 'trending';

const byActivity = (a: Channel, b: Channel) =>
  (b.postCount || 0) - (a.postCount || 0) ||
  (b.memberCount || 0) - (a.memberCount || 0) ||
  a.name.localeCompare(b.name);

const formatCount = (value = 0) =>
  new Intl.NumberFormat('en-US', { notation: value >= 1000 ? 'compact' : 'standard' }).format(value);

export const TopicsScreen: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [topics, setTopics] = useState<Channel[]>([]);
  const [activeTab, setActiveTab] = useState<SectionTab>('following');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingTopicId, setPendingTopicId] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadTopics = async () => {
      try {
        const [nextTopics, myTopics] = await Promise.all([
          backendApi.getTopics(),
          isAuthenticated ? backendApi.getMyTopics().catch(() => [] as never[]) : ([] as never[]),
        ]);
        if (!isMounted) return;
        const myTopicIds = new Set((myTopics as Array<{ id: number }>).map((t) => t.id));
        setTopics(
          nextTopics
            .map((topic) => {
              const channel = backendTopicToChannel(topic);
              if (myTopicIds.size > 0) channel.joined = myTopicIds.has(topic.id);
              return channel;
            })
            .sort(byActivity),
        );
        setNotice('');
      } catch (error) {
        if (isMounted) setNotice(error instanceof Error ? error.message : 'Unable to load topics. The server may be offline — try refreshing the page.');
      }
    };
    loadTopics();
    return () => {
      isMounted = false;
    };
  }, []);

  const joinedTopics = useMemo(() => topics.filter((topic) => topic.joined).sort(byActivity), [topics]);
  const trendingTopics = useMemo(() => [...topics].sort(byActivity), [topics]);
  const suggestedTopics = useMemo(
    () =>
      topics
        .filter((topic) => !topic.joined)
        .sort(byActivity)
        .slice(0, 5),
    [topics],
  );

  const visibleTopics = useMemo(() => {
    const base = activeTab === 'following' ? joinedTopics : activeTab === 'trending' ? trendingTopics : topics;
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? base.filter(
          (topic) =>
            topic.name.toLowerCase().includes(normalizedQuery) ||
            topic.description.toLowerCase().includes(normalizedQuery),
        )
      : base;
  }, [activeTab, joinedTopics, query, topics, trendingTopics]);

  const toggleTopic = async (topic: Channel) => {
    setPendingTopicId(topic.id);
    setTopics((current) =>
      current.map((candidate) =>
        candidate.id === topic.id
          ? {
              ...candidate,
              joined: !candidate.joined,
              memberCount: Math.max(0, (candidate.memberCount || 0) + (candidate.joined ? -1 : 1)),
            }
          : candidate,
      ),
    );

    try {
      const updated = topic.joined ? await backendApi.leaveTopic(topic.id) : await backendApi.joinTopic(topic.id);
      const nextTopic = backendTopicToChannel(updated);
      setTopics((current) => current.map((candidate) => (candidate.id === nextTopic.id ? nextTopic : candidate)));
      toast.success(topic.joined ? 'Community removed from following.' : 'Community added to your feed.');
    } catch (error) {
      setTopics((current) => current.map((candidate) => (candidate.id === topic.id ? topic : candidate)));
      toast.error(error instanceof Error ? error.message : 'Unable to update community.');
    } finally {
      setPendingTopicId('');
    }
  };

  const tabs: Array<{ id: SectionTab; label: string; count: number }> = [
    { id: 'following', label: 'Following', count: joinedTopics.length },
    { id: 'all', label: 'All', count: topics.length },
    { id: 'trending', label: 'Trending', count: trendingTopics.length },
  ];

  return (
    <div className="app-page grid gap-8 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <main className="min-w-0">
        <div className="flex flex-col gap-4 border-b border-app-border pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mono-label mb-3 text-app-action">Topics</p>
            <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Reading communities</h1>
            <p className="mt-3 max-w-[65ch] text-sm leading-6 text-app-muted">
              Follow communities to shape your feed.
            </p>
          </div>
          {isAuthenticated && (
            <Link
              to="/app/c/new"
              className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
            >
              Start a new community
            </Link>
          )}
        </div>

        {notice && (
          <Alert tone="error" className="mt-5">
            {notice}
          </Alert>
        )}

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex gap-4" aria-label="Topic sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 pb-2 font-mono text-[11px] uppercase tracking-wider ${activeTab === tab.id ? 'border-app-action text-app-action' : 'border-transparent text-app-muted hover:text-app-heading'}`}
              >
                {tab.label} <span className="tabular-nums">{tab.count}</span>
              </button>
            ))}
          </nav>
          <SearchInput
            id="topics-search"
            size="sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            placeholder="Search communities"
            containerClassName="lg:w-72"
          />
        </div>

        <div className="mt-6 border-y border-app-border">
          {visibleTopics.length === 0 ? (
            <p className="py-8 text-sm italic text-app-muted">
              {activeTab === 'following' ? 'No followed communities yet. Browse the list below and join one to get started.' : 'No communities found. Create the first one to rally a readership.'}
            </p>
          ) : (
            visibleTopics.map((topic) => (
              <article
                key={topic.id}
                className="grid gap-4 border-b border-app-border py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_9rem]"
              >
                <div className="min-w-0">
                  <p className="mb-1 font-mono text-[11px] text-app-muted">
                    {formatCount(topic.memberCount)} members · {formatCount(topic.postCount)} reports
                  </p>
                  <Link to={`/app/c/${topic.slug}`} className="block">
                    <h2 className="text-xl font-semibold text-app-heading hover:text-app-action">{topic.name}</h2>
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-app-text">{topic.description}</p>
                </div>
                <div className="flex items-start justify-between gap-3 md:block">
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    disabled={pendingTopicId === topic.id}
                    className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline disabled:opacity-40"
                  >
                    {topic.joined ? 'Joined' : 'Join'}
                  </button>
                  <Link
                    to={`/app/c/${topic.slug}`}
                    className="font-mono text-[11px] uppercase tracking-wider text-app-muted hover:text-app-action md:mt-4 md:block"
                  >
                    Open
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      <aside className="space-y-8 xl:sticky xl:top-24 xl:self-start">
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Your followed communities</h2>
          <div className="space-y-3">
            {joinedTopics.slice(0, 8).map((topic) => (
              <Link
                key={topic.id}
                to={`/app/c/${topic.slug}`}
                className="block border-b border-app-border pb-3 text-sm hover:text-app-action"
              >
                <span className="block truncate font-semibold text-app-heading">{topic.name}</span>
                <span className="font-mono text-[11px] text-app-muted">{formatCount(topic.memberCount)} members</span>
              </Link>
            ))}
            {joinedTopics.length === 0 && <p className="text-sm italic text-app-muted">No followed communities yet. Join one from the list above to see it here.</p>}
          </div>
        </section>
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Start a new community</h2>
          <p className="text-sm leading-6 text-app-muted">Create a topic for focused reporting and discussion.</p>
          <Link
            to="/app/c/new"
            className="mt-3 inline-flex font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
          >
            Create community
          </Link>
        </section>
        {suggestedTopics.length > 0 && (
          <section>
            <h2 className="mono-label mb-4 text-app-muted">Suggested</h2>
            <div className="space-y-3">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className="flex w-full items-center justify-between gap-3 border-b border-app-border pb-3 text-left"
                >
                  <span className="truncate text-sm font-semibold text-app-heading">{topic.name}</span>
                  <span className="font-mono text-[11px] text-app-action">Join</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
};

export default TopicsScreen;
