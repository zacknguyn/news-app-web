import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  const articleSearchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [draftSaved, setDraftSaved] = useState(true);

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
          res.content.map((a) => ({ id: a.id, title: a.title, sourceUrl: a.slug ? `/app/article/${a.slug}` : undefined })),
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
    setDraftSaved(false);
  };

  const clearLinkedArticle = () => {
    setLinkedArticleId(undefined);
    setLinkedArticleTitle('');
    setDraftSaved(false);
  };

  const plainContent = stripHtml(content);
  const contentError = hasSubmitted && plainContent.length < 80 ? 'Add at least 80 characters of report context.' : '';
  const canSubmit = Boolean(title.trim()) && plainContent.length >= 80 && Boolean(selectedChannel);

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
    setDraftSaved(false);
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
      setDraftSaved(true);
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
      className="bg-bg min-h-screen text-on-surface flex flex-col"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Fixed top toolbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/30 h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-6 md:px-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-xs font-bold text-outline hover:text-primary transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <div className="h-4 w-[1px] bg-outline-variant/40"></div>
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${draftSaved ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>{draftSaved ? 'Draft Saved' : 'Saving Draft...'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPreviewing(!isPreviewing)}
              className="text-xs font-bold text-on-surface-variant hover:text-primary transition-all px-4 py-2 border border-outline-variant/40 rounded-full hover:bg-primary/5 bg-white"
            >
              {isPreviewing ? 'Edit' : 'Preview'}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="bg-primary text-white text-xs font-bold px-6 py-2 rounded-full hover:brightness-110 active:scale-98 transition-all disabled:opacity-40"
            >
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="pt-24 pb-32 px-6 max-w-7xl w-full mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-8">
        <div className="space-y-6">
          {formError && <Alert tone="error">{formError}</Alert>}

          {/* Headline Textarea Input */}
          <textarea
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Headline of your report..."
            rows={1}
            className="w-full bg-transparent border-none focus:ring-0 font-sans text-3xl md:text-4xl font-extrabold text-on-background resize-none placeholder:text-outline-variant/60 leading-tight outline-none"
          />

          {/* Cover Media Dropzone / URL Input */}
          <div className="border border-outline-variant/30 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 text-primary rounded-xl">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-on-surface uppercase tracking-wider">Cover Image Link</span>
                  <span className="text-[10px] text-outline font-semibold">Optionally attach illustration media</span>
                </div>
              </div>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full md:w-80 px-3.5 py-2 border border-outline-variant/40 rounded-lg text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
              />
            </div>
            {thumbnailUrl && (
              <div className="mt-4 rounded-xl overflow-hidden border border-outline-variant/20">
                <img src={thumbnailUrl} alt="Cover preview" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>

          {/* Editor Canvas */}
          <div className="min-h-[480px]">
            {isPreviewing ? (
              <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 md:p-10 space-y-6">
                <h1 className="text-3xl font-extrabold leading-tight text-on-surface">{title || 'Untitled Dispatch'}</h1>
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="aspect-video w-full rounded-xl border border-outline-variant/30 object-cover"
                  />
                )}
                <div
                  className="serif-title text-[17px] leading-relaxed text-on-surface space-y-4"
                  dangerouslySetInnerHTML={{ __html: addImageCaptions(content) }}
                />
              </div>
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

          <div className="text-[10px] font-bold text-outline uppercase tracking-wider">
            {plainContent.length.toLocaleString('en-US')} characters written
          </div>
        </div>

        {/* Sidebar settings */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          
          {/* Categories Pill Selector */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
            <span className="block text-[10px] uppercase tracking-widest font-bold text-outline">Target Intelligence Domain</span>
            <div className="flex flex-wrap gap-2">
              {channels.map((channel) => {
                const selected = selectedChannel === channel.id;
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      selected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-container border-outline-variant/40 text-on-surface-variant hover:border-primary/50'
                    }`}
                  >
                    {channel.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Linked Source metadata */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
            <span className="block text-[10px] uppercase tracking-widest font-bold text-outline">Citations Ledger</span>
            
            <div className="space-y-4">
              <label className="block">
                <span className="block text-[10px] font-semibold text-on-surface-variant mb-1">Source URL</span>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                />
              </label>

              <div className="block">
                <span className="block text-[10px] font-semibold text-on-surface-variant mb-1">Link an Article (optional)</span>
                {linkedArticleId ? (
                  <div className="flex items-center justify-between gap-2 border border-outline-variant/30 rounded-lg px-3 py-2 bg-surface-container-low">
                    <span className="truncate text-xs text-on-surface-variant">{linkedArticleTitle}</span>
                    <button type="button" onClick={clearLinkedArticle} className="text-xs font-bold text-outline hover:text-on-surface">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      ref={articleSearchRef}
                      type="text"
                      value={articleSearchQuery}
                      onChange={(e) => handleArticleSearch(e.target.value)}
                      placeholder="Search articles..."
                      className="w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                    />
                    {articleSearchResults.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-10 max-h-48 overflow-y-auto border border-outline-variant/30 bg-white rounded-xl shadow-lg mt-1">
                        {articleSearchResults.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => pickArticle(a.id, a.title, a.sourceUrl)}
                              className="w-full px-3 py-2.5 text-left text-xs text-on-surface hover:bg-surface-container transition-all"
                            >
                              {a.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vetting Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
            <span className="block text-[10px] uppercase tracking-widest font-bold text-outline">Submission Checklist</span>
            
            <div className="space-y-3">
              <CheckRow label="Headline Drafted" ready={Boolean(title.trim())} />
              <CheckRow label="Body content (80+ chars)" ready={plainContent.length >= 80} />
              <CheckRow label="Domain Categorized" ready={Boolean(selectedChannel)} />
            </div>
          </div>
        </aside>
      </main>
    </form>
  );
};

const CheckRow: React.FC<{ label: string; ready: boolean }> = ({ label, ready }) => (
  <div className="flex items-center justify-between gap-3 border-b border-outline-variant/10 pb-2 text-xs font-semibold text-on-surface-variant">
    <span>{label}</span>
    {ready ? (
      <span className="text-green-600 flex items-center gap-0.5 uppercase tracking-wider text-[10px] font-bold">
        <CheckCircle2 className="h-3.5 w-3.5" /> Ready
      </span>
    ) : (
      <span className="text-amber-600 flex items-center gap-0.5 uppercase tracking-wider text-[10px] font-bold">
        <AlertTriangle className="h-3.5 w-3.5" /> Missing
      </span>
    )}
  </div>
);

export default SubmitNewsScreen;
