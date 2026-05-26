import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MOCK_CHANNELS, MOCK_POSTS } from '../lib/mockData';
import { usePageMotion } from '../hooks/usePageMotion';
import { backendApi } from '../lib/api';
import { backendPostToPost, backendTopicToChannel } from '../lib/backendAdapters';
import { Alert } from '../components/ui/Alert';
import type { Channel, Post } from '../types';
import type { BackendCategoryDTO, BackendTagDTO } from '../lib/api';

export const ExploreScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [categories, setCategories] = useState<BackendCategoryDTO[]>([]);
  const [tags, setTags] = useState<BackendTagDTO[]>([]);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadExplore = async () => {
      try {
        const [topics, backendPosts, backendCategories, backendTags] = await Promise.all([
          backendApi.getTopics(),
          backendApi.getHotPosts(0, 8),
          backendApi.getCategories(),
          backendApi.getTags(),
        ]);
        if (!isMounted) return;
        setChannels(topics.map(backendTopicToChannel));
        setPosts(backendPosts.content.map(backendPostToPost));
        setCategories(backendCategories);
        setTags(backendTags);
        setNotice('');
      } catch (error) {
        if (!isMounted) return;
        setChannels(MOCK_CHANNELS);
        setPosts(MOCK_POSTS);
        setCategories([]);
        setTags([]);
        setNotice(error instanceof Error ? error.message : 'Backend explore data unavailable. Showing local preview data.');
      }
    };

    loadExplore();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;

    try {
      const results = await backendApi.searchArticles(keyword, 0, 12);
      setPosts(results.content.map(article => ({
        id: `article-${article.id}`,
        authorId: String(article.userId || 'newsroom'),
        author: {
          id: String(article.userId || 'newsroom'),
          name: article.authorName || 'Newsroom',
          username: (article.authorName || 'newsroom').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          avatarUrl: article.authorAvatar || undefined,
          trustScore: 500,
          isVerified: true,
        },
        channelId: article.categories?.[0]?.slug || 'articles',
        channelName: article.categories?.[0]?.name || 'Articles',
        title: article.title,
        content: article.subtitle || article.aiSummary || article.content,
        mediaUrl: article.imageUrl || undefined,
        mediaType: article.imageUrl ? 'image' : 'link',
        upvotes: Math.max(article.views || 0, 0),
        downvotes: 0,
        commentCount: article.commentsCount || 0,
        createdAt: article.publishedAt || new Date().toISOString(),
        userVote: null,
        backendArticleId: String(article.id),
      })));
      setNotice('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed.');
    }
  };

  return (
    <div ref={pageRef} className="hex-page">
      <header data-motion="page" className="hex-page-header">
        <p className="hex-kicker">Explore</p>
        <h1 className="hex-title mt-2">Find the active beats.</h1>
      </header>

      <form data-motion="page" className="hex-card-soft mb-6 flex gap-3 p-3" onSubmit={handleSearch}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search backend articles..."
          className="hex-input min-w-0 flex-1 px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="hex-button-primary min-h-11 px-5 text-sm font-medium"
        >
          Search
        </button>
      </form>

      <section data-motion="page" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            to={`/app/c/${channel.slug}`}
            className="hex-card p-5 transition-colors hover:border-[var(--color-cement-gray)] hover:shadow-[var(--shadow-hex-card-hover)]"
          >
            <p className="text-xs font-medium text-[var(--color-app-muted)]">Channel</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-app-action)]">{channel.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">{channel.description}</p>
          </Link>
        ))}
      </section>

      {(categories.length > 0 || tags.length > 0) && (
        <section data-motion="page" className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-app-ink)]">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={async () => {
                    const response = await backendApi.getArticlesByCategory(category.slug, 0, 12);
                    setPosts(response.content.map(article => ({
                      id: `article-${article.id}`,
                      authorId: String(article.userId || 'newsroom'),
                      author: {
                        id: String(article.userId || 'newsroom'),
                        name: article.authorName || 'Newsroom',
                        username: (article.authorName || 'newsroom').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        avatarUrl: article.authorAvatar || undefined,
                        trustScore: 500,
                        isVerified: true,
                      },
                      channelId: category.slug,
                      channelName: category.name,
                      title: article.title,
                      content: article.subtitle || article.aiSummary || article.content,
                      mediaUrl: article.imageUrl || undefined,
                      mediaType: article.imageUrl ? 'image' : 'link',
                      upvotes: Math.max(article.views || 0, 0),
                      downvotes: 0,
                      commentCount: article.commentsCount || 0,
                      createdAt: article.publishedAt || new Date().toISOString(),
                      userVote: null,
                      backendArticleId: String(article.id),
                    })));
                  }}
                  className="hex-pill min-h-10 px-4 py-2 text-sm"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-app-ink)]">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 12).map(tag => (
                <span key={tag.id} className="hex-pill px-4 py-2 text-sm">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 data-motion="page" className="mb-3 text-sm font-semibold text-[var(--color-app-ink)]">
          High-signal reports
        </h2>
        {notice && (
          <Alert tone="warning" className="mb-3">
            {notice}
          </Alert>
        )}
        <div className="hex-card overflow-hidden divide-y divide-[var(--color-app-border-clean)]">
          {posts.map((post) => (
            <Link data-motion="list" key={post.id} to={`/app/p/${post.id}`} className="block bg-white px-5 py-4 hover:bg-[var(--color-near-white)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold leading-snug text-[var(--color-app-ink)]">{post.title}</h3>
                <span className="shrink-0 text-sm font-semibold text-[var(--color-app-muted)]">{post.upvotes - post.downvotes}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-app-muted)]">{post.channelName}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ExploreScreen;
