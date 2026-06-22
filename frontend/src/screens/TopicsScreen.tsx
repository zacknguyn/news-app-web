import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Grid2X2, Plus, Sparkles } from 'lucide-react';
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
    <div className="app-page mx-auto max-w-[1280px]">
      <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="hidden lg:block"><div className="sticky top-24"><h2 className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-widest text-app-muted">Topic views</h2><nav className="space-y-1">{tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm ${activeTab === tab.id ? 'bg-app-action-soft font-semibold text-app-action' : 'text-app-muted hover:bg-app-surface-alt hover:text-app-heading'}`}><span className="flex items-center gap-3"><Grid2X2 className="h-4 w-4" />{tab.label}</span><span className="text-xs">{tab.count}</span></button>)}</nav><div className="mt-10"><h2 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-app-muted">Your interests</h2><div className="flex flex-wrap gap-2">{joinedTopics.slice(0,6).map(topic => <Link key={topic.id} to={`/app/c/${topic.slug}`} className="inline-flex items-center gap-1 rounded-full bg-app-action-soft px-3 py-1 text-xs text-app-action">{topic.name}<Check className="h-3 w-3" /></Link>)}</div></div></div></aside>
        <main className="min-w-0"><header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-app-action">Intelligence directory</p><h1 className="text-[34px] font-bold tracking-tight text-app-heading md:text-5xl">Explore Topics</h1><p className="mt-3 max-w-xl text-sm leading-6 text-app-muted">Curate your feed by following focused intelligence channels backed by the live topic directory.</p></div><SearchInput id="topics-search" value={query} onChange={e => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search topics" containerClassName="md:w-72" /></header>
          {notice && <Alert tone="error" className="mb-6">{notice}</Alert>}
          <div className="mb-6 flex gap-3 overflow-x-auto lg:hidden">{tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${activeTab === tab.id ? 'bg-app-action text-app-on-action' : 'bg-app-surface-alt text-app-muted'}`}>{tab.label} {tab.count}</button>)}</div>
          {visibleTopics.length ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleTopics.map(topic => <article key={topic.id} className={`group flex min-h-28 items-center justify-between rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-subtle)] ${topic.joined ? 'border-app-action bg-app-action text-app-on-action' : 'border-app-border bg-app-surface hover:border-app-action'}`}><Link to={`/app/c/${topic.slug}`} className="min-w-0 flex-1"><h2 className={`truncate text-sm font-bold ${topic.joined ? 'text-app-on-action' : 'text-app-heading'}`}>{topic.name}</h2><p className={`mt-1 line-clamp-2 text-xs leading-5 ${topic.joined ? 'text-white/70' : 'text-app-muted'}`}>{topic.description || `${formatCount(topic.memberCount)} followers`}</p><p className={`mt-2 font-mono text-[9px] ${topic.joined ? 'text-white/60' : 'text-app-faint'}`}>{formatCount(topic.memberCount)} followers · {formatCount(topic.postCount)} reports</p></Link><button type="button" onClick={() => toggleTopic(topic)} disabled={pendingTopicId === topic.id} aria-label={topic.joined ? `Unfollow ${topic.name}` : `Follow ${topic.name}`} className={`ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-full ${topic.joined ? 'bg-white/15 text-white' : 'bg-app-surface-alt text-app-action group-hover:bg-app-action-soft'}`}>{topic.joined ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button></article>)}</section> : <div className="rounded-xl border border-app-border bg-app-surface p-10 text-center text-sm italic text-app-muted">No topics found in this view.</div>}
          <section className="mt-16 grid gap-6 md:grid-cols-3"><div className="relative overflow-hidden rounded-2xl bg-app-action p-8 text-app-on-action md:col-span-2"><Sparkles className="mb-5 h-7 w-7" /><p className="font-mono text-[10px] uppercase tracking-widest text-white/70">Community spotlight</p><h2 className="mt-3 text-2xl font-bold">Start a focused intelligence channel</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/75">Build a collaborative space for source-backed analysis and reporting.</p><Link to="/app/c/new" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-app-action">Create channel <Plus className="h-4 w-4" /></Link></div><div className="rounded-2xl border border-app-border bg-app-surface-alt p-7"><h2 className="text-xl font-semibold text-app-heading">Weekly summary</h2><p className="mt-3 text-sm leading-6 text-app-muted">Get a curated digest from followed topics every Friday.</p><Link to="/app/settings" className="mt-8 inline-block text-sm font-bold text-app-action hover:underline">Configure email</Link></div></section>
        </main>
      </div>
    </div>
  );
};

export default TopicsScreen;
