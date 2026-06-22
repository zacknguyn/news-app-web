import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { backendApi } from '../lib/api';
import { Alert } from '../components/ui/Alert';

type BackendTopic = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  memberCount?: number | null;
  postCount?: number | null;
  joined: boolean;
  avatarUrl?: string | null;
  ownerName: string;
};

type BackendCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  articleCount?: number | null;
};

const tabs = ['Communities', 'Categories'] as const;
type Tab = (typeof tabs)[number];

export const BrowseScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Communities');
  const [topics, setTopics] = useState<BackendTopic[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setNotice('');
      try {
        const [fetchedTopics, fetchedCategories] = await Promise.all([
          backendApi.getTopics().catch(() => []),
          backendApi.getCategories().catch(() => []),
        ]);
        if (!isMounted) return;
        setTopics(fetchedTopics);
        setCategories(fetchedCategories);
      } catch (error) {
        if (isMounted) setNotice(error instanceof Error ? error.message : 'Unable to load.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0)),
    [categories],
  );

  const handleToggleJoin = async (topicId: number) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    try {
      const updated = topic.joined
        ? await backendApi.leaveTopic(topicId)
        : await backendApi.joinTopic(topicId);
      setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, joined: updated.joined } : t)));
    } catch {
      // silent
    }
  };

  if (isLoading) {
    return (
      <div className="app-page px-5 py-20">
        <span className="text-[12px] font-medium text-app-muted">Loading…</span>
      </div>
    );
  }

  return (
    <div className="app-page px-5 pb-10 lg:px-10">
      <div className="border-b border-app-border pb-6">
        <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Browse</h1>
        <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-app-muted">
          Discover communities and topics.
        </p>
      </div>

      <nav className="-mb-px mt-6 flex gap-6 border-b border-app-border" aria-label="Browse sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative pb-3 pt-1 text-[12px] font-medium tracking-wide transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:transition-colors ${
              activeTab === tab
                ? 'text-app-action after:bg-app-action'
                : 'text-app-muted after:bg-transparent hover:text-app-heading'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {notice && <Alert tone="warning" className="mt-5">{notice}</Alert>}

      {activeTab === 'Communities' && (
        <div className="mt-6 space-y-3">
          {topics.length === 0 && (
            <p className="py-8 text-[14px] text-app-muted">No communities yet.</p>
          )}
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center gap-4 border border-app-border px-4 py-3"
            >
              <img
                src={topic.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(topic.name)}`}
                alt=""
                className="h-10 w-10 shrink-0 border border-app-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link to={`/app/c/${topic.slug}`} className="font-semibold text-app-heading hover:text-app-action">
                  {topic.name}
                </Link>
                {topic.description && (
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-app-text">{topic.description}</p>
                )}
                <p className="mt-0.5 text-[12px] text-app-muted">
                  {(topic.memberCount || 0).toLocaleString()} members
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleJoin(topic.id)}
                className={`h-8 shrink-0 border px-3 text-[12px] font-medium transition-colors ${
                  topic.joined
                    ? 'border-app-border text-app-muted hover:border-app-action hover:text-app-action'
                    : 'border-app-action text-app-action hover:bg-app-action hover:text-app-on-action'
                }`}
              >
                {topic.joined ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Categories' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.length === 0 && (
            <p className="py-8 text-[14px] text-app-muted sm:col-span-2 lg:col-span-3">No categories yet.</p>
          )}
          {sortedCategories.map((category) => {
            const count = category.articleCount || 0;
            const isPopular = count > 50;
            return (
              <Link
                key={category.id}
                to={`/app/category/${category.slug}`}
                className={`group border px-4 py-4 transition-all ${
                  isPopular
                    ? 'border-app-action bg-app-action-faint hover:bg-app-action-soft'
                    : 'border-app-border bg-app-bg hover:border-app-action'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`font-semibold text-app-heading group-hover:text-app-action ${isPopular ? 'text-lg' : 'text-base'}`}>
                    {category.name}
                  </h3>
                  {isPopular && (
                    <span className="shrink-0 text-[11px] font-semibold tracking-wider text-app-action">Popular</span>
                  )}
                </div>
                {category.description && (
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-app-text">{category.description}</p>
                )}
                <p className="mt-3 text-[12px] text-app-muted">{count.toLocaleString()} articles</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseScreen;