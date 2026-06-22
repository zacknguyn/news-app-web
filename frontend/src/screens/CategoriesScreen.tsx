import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, ChartNoAxesCombined, Cpu, FlaskConical, Globe2, Palette, Scale } from 'lucide-react';
import { backendApi } from '../lib/api';
import { backendArticleToPost } from '../lib/backendAdapters';
import { Alert } from '../components/ui/Alert';
import { PostCard } from '../components/PostCard';
import type { Post } from '../types';

type BackendCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  articleCount?: number | null;
};

export const CategoriesScreen: React.FC = () => {
  const { slug } = useParams();
  const location = useLocation();
  const isTagRoute = location.pathname.startsWith('/app/tag');
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [articles, setArticles] = useState<Post[]>([]);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setNotice('');

      try {
        if (slug) {
          const data = isTagRoute
            ? await backendApi.getArticlesByTag(slug)
            : await backendApi.getArticlesByCategory(slug);
          if (!isMounted) return;
          setArticles(data.content.map(backendArticleToPost));
        } else {
          const [data, latest] = await Promise.all([backendApi.getCategories(), backendApi.getLatestArticles(3)]);
          if (!isMounted) return;
          setCategories(data);
          setArticles(latest.map(backendArticleToPost));
        }
      } catch (error) {
        if (isMounted) setNotice(error instanceof Error ? error.message : 'Unable to load data. The server may be unavailable — try again shortly.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [slug, isTagRoute]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0)),
    [categories],
  );

  if (isLoading) {
    return (
      <div className="app-page px-4 py-20">
        <span className="text-[12px] font-medium text-app-muted">Loading categories…</span>
      </div>
    );
  }

  if (slug) {
    const backLink = isTagRoute ? '/app/topics' : '/app/categories';
    const backLabel = isTagRoute ? 'All topics' : 'All categories';
    return (
      <div className="app-page">
        <div className="border-b border-app-border px-5 py-4 lg:px-10">
          <Link to={backLink} className="text-[12px] font-medium text-app-action hover:underline">
            &larr; {backLabel}
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold text-app-heading">
            {isTagRoute ? 'Tag' : 'Category'}: {slug}
          </h1>
        </div>

        {notice && <div className="px-4 py-4 lg:px-10"><Alert tone="warning">{notice}</Alert></div>}

        <div className="px-4 lg:px-10">
          {articles.length === 0 ? (
            <p className="py-8 text-sm italic text-app-muted">No articles found in this category. Try browsing <Link to="/app" className="text-app-action hover:underline">the feed</Link> or <Link to="/app/explore" className="text-app-action hover:underline">explore</Link>.</p>
          ) : (
            articles.map((post) => <PostCard key={post.id} post={post} onVote={undefined} />)
          )}
        </div>
      </div>
    );
  }

  const icons = [Cpu, Globe2, ChartNoAxesCombined, FlaskConical, Palette, Scale];

  return (
    <div className="app-page mx-auto max-w-[1280px]">
      <header className="mb-12">
        <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-app-action">Sector intelligence</p>
        <h1 className="text-[34px] font-bold tracking-tight text-app-heading md:text-5xl">Category Directories</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">Browse curated dispatches organized by primary impact sectors and operational themes.</p>
      </header>
      {notice && <Alert tone="error" className="mb-6">{notice}</Alert>}
      {sortedCategories.length ? (
        <section className="mb-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map((category, index) => {
            const Icon = icons[index % icons.length];
            return (
              <Link key={category.id} to={"/app/category/" + category.slug} className="group flex min-h-72 flex-col rounded-xl border border-app-border bg-app-surface p-6 shadow-[var(--shadow-subtle)] transition-all hover:-translate-y-1 hover:border-app-action hover:bg-app-surface-alt">
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-app-action-soft text-app-action"><Icon className="h-6 w-6" /></span>
                  <span className="rounded bg-app-surface-alt px-2 py-1 font-mono text-[9px] uppercase text-app-muted">{(category.articleCount || 0).toLocaleString()} dispatches</span>
                </div>
                <h2 className="text-2xl font-semibold text-app-heading group-hover:text-app-action">{category.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-app-muted">{category.description || "Live reporting, analysis, and source-backed intelligence covering " + category.name + "."}</p>
                <div className="mt-auto pt-6"><span className="flex w-full items-center justify-center gap-2 rounded-lg border border-app-border py-2.5 text-sm font-semibold text-app-muted group-hover:border-app-action group-hover:text-app-action">View hub <ArrowRight className="h-4 w-4" /></span></div>
              </Link>
            );
          })}
        </section>
      ) : (
        <p className="mb-20 rounded-xl border border-app-border bg-app-surface p-8 text-sm italic text-app-muted">No categories available.</p>
      )}
      <section className="border-t border-app-border pt-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-app-heading">Top Intelligence Stories</h2>
          <Link to="/app" className="text-sm font-bold text-app-action hover:underline">View all news</Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-app-border bg-app-surface">
          {articles.length ? articles.map((post) => <PostCard key={post.id} post={post} onVote={undefined} />) : <p className="p-8 text-sm italic text-app-muted">No recent intelligence stories.</p>}
        </div>
      </section>
    </div>
  );
};

export default CategoriesScreen;
