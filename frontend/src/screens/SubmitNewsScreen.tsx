import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CHANNELS } from '../lib/mockData';
import { ArrowLeft, Send, Image as ImageIcon, Link as LinkIcon, Eye } from 'lucide-react';
import { usePageMotion } from '../hooks/usePageMotion';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import type { Channel } from '../types';
import type { BackendArticleDTO } from '../lib/api';

export const SubmitNewsScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState(MOCK_CHANNELS[0].id);
  const [articles, setArticles] = useState<BackendArticleDTO[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const titleId = 'report-title';
  const contentId = 'report-content';
  const titleErrorId = 'report-title-error';
  const contentErrorId = 'report-content-error';
  const titleError = hasSubmitted && !title.trim() ? 'Add a headline before posting.' : '';
  const contentError = hasSubmitted && content.trim().length < 80 ? 'Add at least 80 characters of report context.' : '';
  const canSubmit = Boolean(title.trim()) && content.trim().length >= 80;

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      try {
        const [topics, latestArticles] = await Promise.all([
          backendApi.getTopics(),
          backendApi.getLatestArticles(20),
        ]);
        if (!isMounted) return;
        const nextChannels = topics.map(backendTopicToChannel);
        setChannels(nextChannels);
        setSelectedChannel(nextChannels[0]?.id || MOCK_CHANNELS[0].id);
        setArticles(latestArticles);
      } catch {
        if (!isMounted) return;
        setChannels(MOCK_CHANNELS);
        setSelectedChannel(MOCK_CHANNELS[0].id);
        setArticles([]);
      }
    };

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setFormError('');
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const createdPost = await backendApi.createPost({
        title: title.trim(),
        content: content.trim(),
        topicId: Number(selectedChannel),
        articleId: selectedArticleId ? Number(selectedArticleId) : undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
      navigate(`/app/p/${createdPost.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to publish report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={pageRef} className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
      <button 
        type="button"
        data-motion="page"
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-ink)]"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel draft
      </button>

      <div data-motion="page" className="mb-8 flex flex-col gap-4 border-b border-[var(--color-app-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-medium text-[var(--color-app-ink)]">
            Draft report
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-app-muted)]">
            Publish a focused report with evidence, source links, and a clear channel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button type="button" className="flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--color-app-border)] bg-white px-4 py-2 text-sm font-normal text-[var(--color-app-action)] transition-colors hover:border-[var(--color-cement-gray)] hover:bg-[var(--color-off-white)]">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button 
            type="submit"
            form="submit-report-form"
            disabled={!canSubmit || isSubmitting}
            className="flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--color-app-action)] bg-[var(--color-app-action)] px-5 py-2 text-sm font-normal text-white transition-colors hover:bg-[var(--color-app-action-hover)] disabled:cursor-not-allowed disabled:border-[var(--color-lavender-field)] disabled:bg-[var(--color-lavender-field)] disabled:text-[var(--color-cement-gray)]"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Posting...' : 'Post report'}
          </button>
        </div>
      </div>

      <form id="submit-report-form" className="space-y-8" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div data-motion="page" className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {formError}
          </div>
        )}
        <fieldset data-motion="page" className="space-y-2">
          <legend className="text-sm font-semibold text-[var(--color-app-muted)]">
            Channel
          </legend>
          <div className="flex flex-wrap gap-2">
            {channels.map(channel => (
              <button
                key={channel.id}
                type="button"
                onClick={() => setSelectedChannel(channel.id)}
                aria-pressed={selectedChannel === channel.id}
                className={`min-h-10 rounded-full border px-3 py-2 text-sm font-semibold transition-all ${
                  selectedChannel === channel.id 
                  ? 'border-[var(--color-app-action)] bg-[var(--color-app-action)] text-white' 
                  : 'border-[var(--color-app-border)] bg-white text-[var(--color-app-muted)] hover:border-[var(--color-cement-gray)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-app-action)]'
                }`}
              >
                {channel.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset data-motion="page" className="space-y-2">
          <legend className="text-sm font-semibold text-[var(--color-app-muted)]">
            Linked Article
          </legend>
          <select
            value={selectedArticleId}
            onChange={(event) => setSelectedArticleId(event.target.value)}
            className="w-full rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3 text-sm text-[var(--color-app-ink)] outline-none transition-colors focus:border-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] focus:ring-0"
          >
            <option value="">No article link, discussion comments disabled</option>
            {articles.map(article => (
              <option key={article.id} value={article.id}>
                {article.title}
              </option>
            ))}
          </select>
          <p className="text-sm leading-6 text-[var(--color-app-muted)]">
            Link an article when this report is part of an existing newsroom story.
          </p>
        </fieldset>

        <div data-motion="page" className="space-y-4">
          <div>
            <label htmlFor={titleId} className="sr-only">
              Report headline
            </label>
          <input 
            id={titleId}
            type="text"
            placeholder="Headline of the story..."
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? titleErrorId : undefined}
            className="w-full border-none bg-transparent px-0 text-4xl font-serif font-medium leading-tight text-[var(--color-app-ink)] focus:ring-0 placeholder:text-[var(--color-app-border)]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
            {titleError && (
              <p id={titleErrorId} className="mt-2 text-xs font-bold text-red-600">
                {titleError}
              </p>
            )}
          </div>
          
          <div className="grid gap-3 border-y border-[var(--color-app-border-clean)] py-4 sm:grid-cols-2">
            <label className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 shrink-0 text-[var(--color-app-faint)]" />
              <input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="Image URL"
                className="min-w-0 flex-1 border-none bg-transparent px-0 text-sm text-[var(--color-app-ink)] outline-none placeholder:text-[var(--color-app-faint)] focus:ring-0"
              />
            </label>
            <label className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 shrink-0 text-[var(--color-app-faint)]" />
              <input
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="Source URL"
                className="min-w-0 flex-1 border-none bg-transparent px-0 text-sm text-[var(--color-app-ink)] outline-none placeholder:text-[var(--color-app-faint)] focus:ring-0"
              />
            </label>
          </div>

          <div>
            <label htmlFor={contentId} className="sr-only">
              Report body
            </label>
          <textarea 
            id={contentId}
            placeholder="Tell the truth here. Use evidence, cite sources where possible..."
              aria-invalid={Boolean(contentError)}
              aria-describedby={contentError ? contentErrorId : undefined}
            className="w-full min-h-[420px] resize-none border-none bg-transparent px-0 text-xl font-serif leading-relaxed text-[var(--color-app-ink)] focus:ring-0 placeholder:text-[var(--color-app-border)]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
            {contentError && (
              <p id={contentErrorId} className="mt-2 text-xs font-bold text-red-600">
                {contentError}
              </p>
            )}
          </div>
        </div>
      </form>

      <footer data-motion="page" className="mt-12 border-t border-[var(--color-app-border-clean)] pt-6">
        <p className="max-w-xl text-sm leading-6 text-[var(--color-app-muted)]">
          By posting, you agree that this information is accurate to the best of your knowledge. 
          Intentional misinformation will result in a permanent Trust Score penalty.
        </p>
      </footer>
    </div>
  );
};
