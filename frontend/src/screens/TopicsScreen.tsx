import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Check, Hash, Plus, Search, Users } from 'lucide-react';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import { usePageMotion } from '../hooks/usePageMotion';
import { Alert } from '../components/ui/Alert';
import type { Channel } from '../types';

type TopicTab = 'mine' | 'discover';

export const TopicsScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const [topics, setTopics] = useState<Channel[]>([]);
  const [activeTab, setActiveTab] = useState<TopicTab>('mine');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingTopicId, setPendingTopicId] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      try {
        const nextTopics = await backendApi.getTopics();
        if (!isMounted) return;
        setTopics(nextTopics.map(backendTopicToChannel));
        setNotice('');
      } catch (error) {
        if (isMounted) setNotice(error instanceof Error ? error.message : 'Unable to load topics.');
      }
    };

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  const joinedTopics = useMemo(() => topics.filter(topic => topic.joined), [topics]);
  const visibleTopics = useMemo(() => {
    const base = activeTab === 'mine' ? joinedTopics : topics;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return base;
    return base.filter(topic =>
      topic.name.toLowerCase().includes(normalizedQuery) ||
      topic.description.toLowerCase().includes(normalizedQuery)
    );
  }, [activeTab, joinedTopics, query, topics]);

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
      toast.success(topic.joined ? 'Left topic.' : 'Joined topic.');
    } catch (error) {
      setTopics(current => current.map(candidate => candidate.id === topic.id ? topic : candidate));
      toast.error(error instanceof Error ? error.message : 'Unable to update topic.');
    } finally {
      setPendingTopicId('');
    }
  };

  const tabs: Array<{ id: TopicTab; label: string; count: number }> = [
    { id: 'mine', label: 'My Topics', count: joinedTopics.length },
    { id: 'discover', label: 'Discover', count: topics.length },
  ];

  return (
    <div ref={pageRef} className="hex-page">
      <header data-motion="page" className="hex-page-header">
        <div className="hex-kicker mb-2 flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Communities
        </div>
        <h1 className="hex-title">Topics</h1>
        <p className="hex-copy mt-2 max-w-2xl">
          Read any topic freely. Join the ones you want in your daily rotation and posting workflow.
        </p>
      </header>

      {notice && (
        <Alert tone="error" className="mb-5">
          {notice}
        </Alert>
      )}

      <section data-motion="page" className="mb-6 grid gap-4 border-b border-[var(--color-app-border-clean)] pb-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
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
          <span className="sr-only">Search topics</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-app-muted)]"
          />
        </label>
      </section>

      {visibleTopics.length === 0 ? (
        <section data-motion="page" className="hex-panel p-6">
          <h2 className="text-lg font-semibold text-[var(--color-app-ink)]">
            {activeTab === 'mine' ? 'No joined topics yet' : 'No topics found'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">
            {activeTab === 'mine'
              ? 'Switch to Discover and join topics you want to follow.'
              : 'Try a different search term or create a new topic.'}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'mine' ? 'discover' : 'mine')}
            className="mt-4 inline-flex min-h-10 items-center gap-2 bg-[var(--color-app-heading)] px-4 text-sm font-bold text-[var(--color-app-bg)] hover:bg-[var(--color-app-action)]"
          >
            {activeTab === 'mine' ? 'Discover topics' : 'View my topics'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleTopics.map(topic => (
            <article key={`${activeTab}-${topic.id}`} data-motion="list" className="hex-card grid gap-4 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] text-[var(--color-app-heading)]">
                  <Hash className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Link to={`/app/c/${topic.slug}`} className="font-[var(--font-display)] text-xl font-bold leading-6 text-[var(--color-app-heading)] hover:text-[var(--color-app-action)]">
                      {topic.name}
                    </Link>
                    {topic.joined && (
                      <span className="inline-flex items-center gap-1 bg-[var(--color-state-success-bg)] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-state-success)]">
                        <Check className="h-3 w-3" />
                        Joined
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-[var(--color-app-muted)]">
                    {topic.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-app-border-clean)] pt-4">
                <div className="flex items-center gap-4 text-xs font-semibold text-[var(--color-app-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {topic.memberCount || 0} members
                  </span>
                  <span>{topic.postCount || 0} posts</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  disabled={pendingTopicId === topic.id}
                  className={`inline-flex min-h-10 items-center gap-2 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
                    topic.joined
                      ? 'border border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]'
                      : 'bg-[var(--color-app-heading)] text-[var(--color-app-bg)] hover:bg-[var(--color-app-action)]'
                  }`}
                >
                  {topic.joined ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {topic.joined ? 'Joined' : 'Join'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
