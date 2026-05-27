import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Send } from 'lucide-react';
import { usePageMotion } from '../hooks/usePageMotion';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import type { Channel } from '../types';
import { RichPostEditor } from '../components/RichPostEditor';
import { addImageCaptions, stripHtml } from '../lib/richContent';
import { Alert } from '../components/ui/Alert';

const DRAFT_KEY = 'tourane-news-submit-draft';

type SubmitDraft = {
  title: string;
  content: string;
  sourceUrl: string;
  thumbnailUrl: string;
  selectedChannel: string;
  selectedArticleId: string;
  updatedAt: string;
};

export const SubmitNewsScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
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

  const titleId = 'report-title';
  const plainContent = stripHtml(content);
  const contentError = hasSubmitted && plainContent.length < 80 ? 'Add at least 80 characters of report context.' : '';
  const canSubmit = Boolean(title.trim()) && plainContent.length >= 80;
  const joinedChannels = channels.filter(channel => channel.joined);
  const otherChannels = channels.filter(channel => !channel.joined);

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
        if (nextChannels.length > 0) setSelectedChannel(nextChannels[0].id);
      } catch {
        if (!isMounted) return;
        setChannels([]);
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
        content: addImageCaptions(content),
        topicId: Number(selectedChannel),
        sourceUrl: sourceUrl.trim() || undefined,
        imageUrl: thumbnailUrl.trim() || undefined,
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
    <div ref={pageRef} className="app-page">
      <button 
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex min-h-10 items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)]"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel Dispatch
      </button>

      <header data-motion="page" className="mb-8 flex flex-col gap-6 border-b-4 border-[var(--color-app-heading)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
            Compose
          </p>
          <h1 className="font-[var(--font-display)] text-4xl font-bold leading-none text-[var(--color-app-heading)] sm:text-5xl">
            Draft Dispatch
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[var(--color-app-muted)]">
            Publish an authoritative report with evidence and verification.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setIsPreviewing(prev => !prev)} className="inline-flex min-h-10 items-center border border-[var(--color-app-border)] px-4 text-sm font-bold uppercase tracking-widest text-[var(--color-app-heading)] hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]">
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewing ? 'Edit' : 'Preview'}
          </button>
          <button 
            type="submit"
            form="submit-report-form"
            disabled={!canSubmit || isSubmitting}
            className="inline-flex min-h-10 items-center bg-[var(--color-app-heading)] px-5 text-sm font-bold uppercase tracking-widest text-[var(--color-app-bg)] hover:bg-[var(--color-app-action)] disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Dispatch'}
          </button>
        </div>
      </header>

      <form id="submit-report-form" className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]" onSubmit={handleSubmit} noValidate>
        {formError && (
          <Alert tone="error" className="xl:col-span-2">
            {formError}
          </Alert>
        )}
        
        <div className="min-w-0 space-y-8">
          <div className="border-b-2 border-[var(--color-app-border)] pb-4">
            <label htmlFor={titleId} className="sr-only">
              Dispatch Headline
            </label>
            <input 
              id={titleId}
              type="text"
              placeholder="The Headline of your Story..."
              className="w-full border-none bg-transparent px-0 font-[var(--font-display)] text-4xl font-bold leading-tight text-[var(--color-app-heading)] outline-none placeholder:text-[var(--color-app-border)] sm:text-5xl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="min-h-[640px] border border-[var(--color-app-border)] bg-[var(--color-app-bg)]">
            {isPreviewing ? (
              <article className="min-h-full bg-[var(--color-app-bg)] p-6 sm:p-10">
                <h2 className="mb-8 font-[var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-app-heading)]">{title || 'Untitled Dispatch'}</h2>
                {thumbnailUrl && (
                  <span className="story-image-frame mb-10 aspect-[16/9]">
                    <img src={thumbnailUrl} alt="" className="story-image" />
                  </span>
                )}
                <div className="tourane-rich-content editorial-label !text-xl !leading-relaxed" dangerouslySetInnerHTML={{ __html: addImageCaptions(content) }} />
              </article>
            ) : (
              <div className="min-h-full bg-[var(--color-app-bg)]">
                <RichPostEditor
                  value={content}
                  onChange={setContent}
                  onUploadImage={async (file) => {
                    const uploaded = await backendApi.uploadMedia(file);
                    setThumbnailUrl(current => current || uploaded.url);
                    return uploaded.url;
                  }}
                  error={contentError}
                />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-32 xl:self-start">
          <section className="border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-4">
            <h2 className="mb-4 font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">
              Publishing
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="source-url" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Source Evidence URL</label>
                <input
                  id="source-url"
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                  className="hex-input min-h-10 w-full px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dispatch-channel" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Topic</label>
                <select
                  id="dispatch-channel"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="hex-input min-h-10 w-full px-3 text-sm"
                >
                  {joinedChannels.length > 0 && (
                    <optgroup label="Joined topics">
                      {joinedChannels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  )}
                  {otherChannels.length > 0 && (
                    <optgroup label="Other topics">
                      {otherChannels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  )}
                </select>
                <p className="text-xs leading-5 text-[var(--color-app-muted)]">
                  Joined topics appear first. You can still post to other readable topics.
                </p>
              </div>
            </div>
          </section>

          <section className="border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-4">
            <h2 className="mb-3 font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">
              Checklist
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-app-muted)]">Headline</span>
                <span className={title.trim() ? 'font-bold text-[var(--color-app-action)]' : 'font-bold text-[var(--color-app-muted)]'}>
                  {title.trim() ? 'Ready' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-app-muted)]">Body context</span>
                <span className={plainContent.length >= 80 ? 'font-bold text-[var(--color-app-action)]' : 'font-bold text-[var(--color-app-muted)]'}>
                  {plainContent.length}/80
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-app-muted)]">Topic</span>
                <span className={selectedChannel ? 'font-bold text-[var(--color-app-action)]' : 'font-bold text-[var(--color-app-muted)]'}>
                  {selectedChannel ? 'Selected' : 'Missing'}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </form>

      <footer className="mt-12 border-t border-[var(--color-app-border)] pt-8">
        <p className="editorial-label !text-sm !italic text-[var(--color-app-muted)]">
          All dispatches are recorded to the immutable ledger. Misinformation will penalize your global Trust Score.
        </p>
      </footer>
    </div>
  );
};
