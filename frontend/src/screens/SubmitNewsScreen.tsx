import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import type { Channel } from '../types';
import { RichPostEditor } from '../components/RichPostEditor';
import { addImageCaptions, stripHtml } from '../lib/richContent';
import { Alert } from '../components/ui/Alert';
import { Field, Input } from '../components/ui/Input';

const DRAFT_KEY = 'tourane-news-submit-draft';

type SubmitDraft = {
  title: string;
  content: string;
  sourceUrl: string;
  thumbnailUrl: string;
  selectedChannel: string;
  updatedAt: string;
};

export const SubmitNewsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formError, setFormError] = useState('');

  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleSearchResults, setArticleSearchResults] = useState<{ id: number; title: string; sourceUrl?: string }[]>([]);
  const [linkedArticleId, setLinkedArticleId] = useState<number | undefined>(undefined);
  const [linkedArticleTitle, setLinkedArticleTitle] = useState('');
  const articleSearchRef = useRef<HTMLInputElement>(null);
  const articleSearchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleArticleSearch = (query: string) => {
    setArticleSearchQuery(query);
    if (articleSearchTimeout.current) clearTimeout(articleSearchTimeout.current);
    if (!query.trim()) {
      setArticleSearchResults([]);
      return;
    }
    articleSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await backendApi.searchArticles(query.trim(), 0, 5);
        setArticleSearchResults(
          res.content.map((a) => ({ id: a.id, title: a.title, sourceUrl: a.sourceUrl })),
        );
      } catch {
        setArticleSearchResults([]);
      }
    }, 300);
  };

  const pickArticle = (id: number, title: string, sourceUrl?: string) => {
    setLinkedArticleId(id);
    setLinkedArticleTitle(title);
    setArticleSearchQuery('');
    setArticleSearchResults([]);
    if (sourceUrl) setSourceUrl(sourceUrl);
  };

  const clearLinkedArticle = () => {
    setLinkedArticleId(undefined);
    setLinkedArticleTitle('');
  };

  const plainContent = stripHtml(content);
  const contentError = hasSubmitted && plainContent.length < 80 ? 'Add at least 80 characters of report context.' : '';
  const canSubmit = Boolean(title.trim()) && plainContent.length >= 80 && Boolean(selectedChannel);
  const joinedChannels = channels.filter((channel) => channel.joined);
  const otherChannels = channels.filter((channel) => !channel.joined);

  useEffect(() => {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) return;
    try {
      const draft = JSON.parse(stored) as SubmitDraft;
      setTitle(draft.title || '');
      setContent(draft.content || '');
      setSourceUrl(draft.sourceUrl || '');
      setThumbnailUrl(draft.thumbnailUrl || '');
      if (draft.selectedChannel) setSelectedChannel(draft.selectedChannel);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!title && !content && !sourceUrl && !thumbnailUrl) return;
    const timeout = window.setTimeout(() => {
      const draft: Partial<SubmitDraft> = {
        title,
        content,
        sourceUrl,
        thumbnailUrl,
        selectedChannel,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [title, content, sourceUrl, thumbnailUrl, selectedChannel]);

  useEffect(() => {
    let isMounted = true;
    const loadTopics = async () => {
      try {
        const topics = await backendApi.getTopics();
        if (!isMounted) return;
        const nextChannels = topics
          .map(backendTopicToChannel)
          .sort((a, b) => Number(Boolean(b.joined)) - Number(Boolean(a.joined)) || a.name.localeCompare(b.name));
        setChannels(nextChannels);
        if (!selectedChannel && nextChannels.length > 0) setSelectedChannel(nextChannels[0].id);
      } catch {
        if (isMounted) setChannels([]);
      }
    };
    loadTopics();
    return () => {
      isMounted = false;
    };
  }, [selectedChannel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setFormError('');
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const createdPost = await backendApi.createPost({
        title: title.trim(),
        content: addImageCaptions(content),
        topicId: Number(selectedChannel),
        sourceUrl: sourceUrl.trim() || undefined,
        imageUrl: thumbnailUrl.trim() || undefined,
        articleId: linkedArticleId,
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/app/p/${createdPost.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to publish report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="submit-report-form"
      className="app-page grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]"
      onSubmit={handleSubmit}
      noValidate
    >
      <main className="min-w-0">
        <p className="mono-label mb-3 text-app-action">File a dispatch</p>
        <h1 className="text-[32px] font-semibold leading-tight text-app-heading">File a report</h1>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-app-muted">
          Publish an evidence-backed report into a community feed.
        </p>

        {formError && (
          <Alert tone="error" className="mt-6">
            {formError}
          </Alert>
        )}

        <label htmlFor="report-title" className="sr-only">
          Headline
        </label>
        <input
          id="report-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Headline of your report"
          className="mt-8 h-16 w-full border-0 border-b border-app-border bg-transparent px-0 text-[32px] font-semibold leading-tight tracking-[-0.01em] text-app-heading outline-none placeholder:text-app-faint focus:border-app-action focus:shadow-none"
        />

        <div className="mt-8 min-h-[520px] border border-app-border bg-app-bg">
          {isPreviewing ? (
            <article className="p-6 sm:p-8">
              <h2 className="text-[28px] font-semibold leading-tight text-app-heading">{title || 'Untitled report'}</h2>
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="mt-6 aspect-video w-full border border-app-border object-cover"
                />
              )}
              <div
                className="tourane-rich-content mt-8 max-w-[68ch] text-[17px] leading-8 text-app-text"
                dangerouslySetInnerHTML={{ __html: addImageCaptions(content) }}
              />
            </article>
          ) : (
            <RichPostEditor
              value={content}
              onChange={setContent}
              onUploadImage={async (file) => {
                const uploaded = await backendApi.uploadMedia(file);
                setThumbnailUrl((current) => current || uploaded.url);
                return uploaded.url;
              }}
              error={contentError}
            />
          )}
        </div>
        <div className="border-x border-b border-app-border px-4 py-2 font-mono text-[11px] text-app-muted">
          {plainContent.length.toLocaleString('en-US')} characters
        </div>
      </main>

      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <section className="border-t border-app-border pt-4">
          <h2 className="mono-label mb-4 text-app-muted">Publishing</h2>
          <div className="space-y-5">
            <Field id="source-url" label="Source URL" optional>
              <Input
                id="source-url"
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field id="link-article" label="Link an article (optional)">
              <div className="relative">
                {linkedArticleId ? (
                  <div className="flex items-center justify-between gap-2 border border-app-border px-3 py-2">
                    <span className="truncate text-xs text-app-text">{linkedArticleTitle}</span>
                    <button type="button" onClick={clearLinkedArticle} className="shrink-0 text-app-faint hover:text-app-text">
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={articleSearchRef}
                      type="text"
                      value={articleSearchQuery}
                      onChange={(e) => handleArticleSearch(e.target.value)}
                      placeholder="Search articles..."
                      className="h-10 w-full border border-app-border bg-app-bg px-3 text-sm text-app-text outline-none placeholder:text-app-faint focus:border-app-action"
                    />
                    {articleSearchResults.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-10 max-h-48 overflow-y-auto border border-t-0 border-app-border bg-app-bg">
                        {articleSearchResults.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => pickArticle(a.id, a.title, a.sourceUrl)}
                              className="w-full px-3 py-2 text-left text-xs text-app-text hover:bg-app-bg-hover"
                            >
                              {a.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </Field>
            <Field id="dispatch-channel" label="Topic">
              <select
                id="dispatch-channel"
                value={selectedChannel}
                onChange={(event) => setSelectedChannel(event.target.value)}
                className="h-10 w-full border border-app-border bg-app-bg px-3 font-mono text-[11px] uppercase tracking-wider text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
              >
                {joinedChannels.length > 0 && (
                  <optgroup label="Joined topics">
                    {joinedChannels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherChannels.length > 0 && (
                  <optgroup label="Other topics">
                    {otherChannels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </Field>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="h-12 w-full bg-app-action font-mono text-[12px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:opacity-40"
            >
              {isSubmitting ? 'Publishing' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewing((prev) => !prev)}
              className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
            >
              {isPreviewing ? 'Return to editor' : 'Preview report'}
            </button>
          </div>
        </section>

        <section className="border-t border-app-border pt-4">
          <h2 className="mono-label mb-4 text-app-muted">Checklist</h2>
          <CheckRow label="Headline ready" ready={Boolean(title.trim())} />
          <CheckRow label="Body 80+ chars" ready={plainContent.length >= 80} />
          <CheckRow label="Topic selected" ready={Boolean(selectedChannel)} />
        </section>
      </aside>
    </form>
  );
};

const CheckRow: React.FC<{ label: string; ready: boolean }> = ({ label, ready }) => (
  <div className="flex items-center justify-between gap-3 border-b border-app-border py-3 font-mono text-[11px]">
    <span className="text-app-muted">{label}</span>
    <span className={ready ? 'text-app-action' : 'text-app-faint'}>{ready ? 'Ready' : 'Missing'}</span>
  </div>
);

export default SubmitNewsScreen;
