import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
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
          const data = await backendApi.getCategories();
          if (!isMounted) return;
          setCategories(data);
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

  return (
    <div className="app-page px-5 pb-10 lg:px-10">
      <div className="border-b border-app-border pb-6">
        <p className="mb-2 text-[12px] font-semibold tracking-wider text-app-muted">Categories</p>
        <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Browse by category</h1>
        <p className="mt-3 max-w-[65ch] text-[14px] leading-6 text-app-muted">
          Explore articles organized by topic area.
        </p>
      </div>

      {notice && <Alert tone="error" className="mt-5">{notice}</Alert>}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sortedCategories.map((category) => {
          const count = category.articleCount || 0;
          const isPopular = count > 50;
          const isActive = count > 10;
          return (
            <Link
              key={category.id}
              to={`/app/category/${category.slug}`}
              className={`group border transition-all ${
                isPopular
                  ? 'border-app-action bg-app-action-faint hover:bg-app-action-soft'
                  : isActive
                    ? 'border-app-border bg-app-bg hover:border-app-action'
                    : 'border-app-border bg-app-surface-alt hover:border-app-action'
              } ${isPopular ? 'p-5' : 'p-4'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className={`font-semibold text-app-heading group-hover:text-app-action ${
                  isPopular ? 'text-xl' : 'text-lg'
                }`}>
                  {category.name}
                </h2>
                {isPopular && (
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-app-action">Popular</span>
                )}
              </div>
              {category.description && (
                <p className={`line-clamp-2 text-sm leading-6 text-app-text ${
                  isPopular ? 'mt-2' : 'mt-2'
                }`}>{category.description}</p>
              )}
              <p className={`text-[12px] text-app-muted ${isPopular ? 'mt-4' : 'mt-3'}`}>
                {count.toLocaleString()} articles
              </p>
            </Link>
          );
        })}
      </div>

      {sortedCategories.length === 0 && (
        <p className="py-8 text-sm italic text-app-muted">No categories available.</p>
      )}
    </div>
  );
};

export default CategoriesScreen;
