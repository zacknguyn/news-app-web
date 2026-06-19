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
        <span className="swiss-loading"><span>.</span> Loading categories</span>
      </div>
    );
  }

  if (slug) {
    const backLink = isTagRoute ? '/app/topics' : '/app/categories';
    const backLabel = isTagRoute ? 'All topics' : 'All categories';
    return (
      <div className="app-page">
        <div className="border-b border-app-border px-4 py-4 lg:px-10">
          <Link to={backLink} className="mono-label text-app-action hover:underline">
            &larr; {backLabel}
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold text-app-heading">
            {isTagRoute ? 'Tag' : 'Category'}: {slug}
          </h1>
        </div>

        {notice && <div className="px-4 py-4 lg:px-10"><Alert tone="warning">{notice}</Alert></div>}

        <div className="px-4 lg:px-10">
          {articles.length === 0 ? (
            <p className="py-8 text-sm italic text-app-muted">No articles found in this category. Try browsing <Link to="/app" className="text-app-action hover:underline">the front page</Link> or <Link to="/app/explore" className="text-app-action hover:underline">explore</Link>.</p>
          ) : (
            articles.map((post) => <PostCard key={post.id} post={post} onVote={undefined} />)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page px-4 pb-10 lg:px-10">
      <div className="border-b border-app-border pb-5">
        <p className="mono-label mb-3 text-app-action">Categories</p>
        <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Browse by category</h1>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-app-muted">
          Explore articles organized by topic area.
        </p>
      </div>

      {notice && <Alert tone="error" className="mt-5">{notice}</Alert>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedCategories.map((category) => (
          <Link
            key={category.id}
            to={`/app/category/${category.slug}`}
            className="border border-app-border p-4 transition-colors hover:border-app-action"
          >
            <h2 className="text-lg font-semibold text-app-heading">{category.name}</h2>
            {category.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-app-text">{category.description}</p>
            )}
            <p className="mt-3 font-mono text-[11px] text-app-muted">
              {(category.articleCount || 0).toLocaleString()} articles
            </p>
          </Link>
        ))}
      </div>

      {sortedCategories.length === 0 && (
        <p className="py-8 text-sm italic text-app-muted">No categories available.</p>
      )}
    </div>
  );
};

export default CategoriesScreen;
