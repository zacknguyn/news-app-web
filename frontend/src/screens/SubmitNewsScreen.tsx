import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import type { Channel } from '../types';
import { RichPostEditor } from '../components/RichPostEditor';
import { addImageCaptions, stripHtml } from '../lib/richContent';
import { Alert } from '../components/ui/Alert';
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';
import { localizeLabel } from '../lib/localizeLabel';

const DRAFT_KEY = 'tourane-news-submit-draft';

type SubmitDraft = {
  title: string;
  content: string;
  sourceUrl: string;
  thumbnailUrl: string;
  selectedChannel: string;
  updatedAt: string;
};

const CoverUploadButton: React.FC<{ onUpload: (url: string) => void; uploadLabel: string; uploadingLabel: string }> = ({ onUpload, uploadLabel, uploadingLabel }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await backendApi.uploadMedia(file, 'cover image');
      onUpload(media.url);
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 px-3.5 py-2 border border-app-border rounded-lg text-xs font-semibold text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45 bg-app-surface"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? uploadingLabel : uploadLabel}
      </button>
    </>
  );
};

export const SubmitNewsScreen: React.FC = () => {
  const language = useAppLanguage();
  const isVi = isVietnamese(language);
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
  const copy = isVi
    ? {
        upload: 'Tải ảnh',
        uploading: 'Đang tải...',
        contentError: 'Thêm ít nhất 80 ký tự ngữ cảnh cho bài viết.',
        publishFailed: 'Không thể đăng bài.',
        cancel: 'Hủy',
        saved: 'Đã lưu',
        saving: 'Đang lưu...',
        edit: 'Sửa',
        preview: 'Xem trước',
        publishing: 'Đang đăng...',
        publish: 'Đăng bài',
        headlinePlaceholder: 'Tiêu đề bài viết...',
        headlineAria: 'Tiêu đề bài viết',
        coverImage: 'Ảnh bìa',
        coverHint: 'Tải ảnh hoặc dán liên kết',
        coverAria: 'URL ảnh bìa',
        previewTitle: 'Bài viết chưa có tiêu đề',
        characters: 'ký tự đã viết',
        targetDomain: 'Chuyên mục đăng bài',
        citations: 'Nguồn tham khảo',
        sourceUrl: 'URL nguồn',
        linkArticle: 'Liên kết bài báo (tùy chọn)',
        searchArticles: 'Tìm bài báo...',
        checklist: 'Checklist trước khi đăng',
        headlineDrafted: 'Đã có tiêu đề',
        bodyReady: 'Nội dung bài (80+ ký tự)',
        domainReady: 'Đã chọn chuyên mục',
        ready: 'Đủ',
        missing: 'Thiếu',
      }
    : {
        upload: 'Upload',
        uploading: 'Uploading...',
        contentError: 'Add at least 80 characters of report context.',
        publishFailed: 'Unable to publish report.',
        cancel: 'Cancel',
        saved: 'Saved',
        saving: 'Saving...',
        edit: 'Edit',
        preview: 'Preview',
        publishing: 'Pub...',
        publish: 'Publish',
        headlinePlaceholder: 'Headline of your report...',
        headlineAria: 'Report headline',
        coverImage: 'Cover Image',
        coverHint: 'Upload or paste a link',
        coverAria: 'Cover image URL',
        previewTitle: 'Untitled Dispatch',
        characters: 'characters written',
        targetDomain: 'Target Intelligence Domain',
        citations: 'Citations Ledger',
        sourceUrl: 'Source URL',
        linkArticle: 'Link an Article (optional)',
        searchArticles: 'Search articles...',
        checklist: 'Submission Checklist',
        headlineDrafted: 'Headline Drafted',
        bodyReady: 'Body content (80+ chars)',
        domainReady: 'Domain Categorized',
        ready: 'Ready',
        missing: 'Missing',
      };

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
  const contentError = hasSubmitted && plainContent.length < 80 ? copy.contentError : '';
  const canSubmit = Boolean(title.trim()) && plainContent.length >= 80 && Boolean(selectedChannel);
  const trimmedThumbnailUrl = thumbnailUrl.trim();
  const hasCoverImage = /^(https?:\/\/|blob:|data:image\/)/i.test(trimmedThumbnailUrl);

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
        imageUrl: hasCoverImage ? trimmedThumbnailUrl : undefined,
        articleId: linkedArticleId,
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/app/p/${createdPost.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : copy.publishFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="submit-report-form"
      className="bg-app-bg min-h-screen text-app-text flex flex-col"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Fixed top toolbar */}
      <header className="fixed top-0 w-full z-50 bg-app-surface/80 backdrop-blur-md border-b border-app-border h-14 sm:h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-xs font-bold text-app-faint hover:text-app-action transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{copy.cancel}</span>
            </button>
            <div className="hidden sm:block h-4 w-[1px] bg-app-border"></div>
            <div className="flex items-center gap-1.5 text-app-muted text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${draftSaved ? 'bg-state-success' : 'bg-state-warning animate-pulse'}`} />
              <span className="hidden sm:inline">{draftSaved ? copy.saved : copy.saving}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsPreviewing(!isPreviewing)}
              className="text-xs font-bold text-app-muted hover:text-app-action transition-all px-3 sm:px-4 py-2 border border-app-border rounded-full hover:bg-app-action-faint bg-app-surface"
            >
              {isPreviewing ? copy.edit : copy.preview}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="bg-app-action text-app-on-action text-xs font-bold px-4 sm:px-6 py-2 rounded-full hover:brightness-110 active:scale-98 transition-all disabled:opacity-40"
            >
              {isSubmitting ? copy.publishing : copy.publish}
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
            placeholder={copy.headlinePlaceholder}
            rows={1}
            aria-label={copy.headlineAria}
            className="w-full bg-transparent border-none focus:ring-0 font-sans text-3xl md:text-4xl font-extrabold text-app-heading resize-none placeholder:text-app-faint/60 leading-tight outline-none"
          />

          {/* Cover Media Dropzone / URL Input */}
          <div className="border border-app-border rounded-2xl bg-app-surface p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-app-action-soft text-app-action rounded-xl">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-app-heading uppercase tracking-wider">{copy.coverImage}</span>
                  <span className="text-[10px] text-app-faint font-semibold">{copy.coverHint}</span>
                </div>
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  aria-label={copy.coverAria}
                  className="flex-1 md:w-64 px-3.5 py-2 border border-app-border rounded-lg text-xs outline-none focus:border-app-action focus:ring-2 focus:ring-[var(--color-app-action-soft)] bg-app-surface"
                />
                <CoverUploadButton onUpload={(url) => setThumbnailUrl(url)} uploadLabel={copy.upload} uploadingLabel={copy.uploading} />
              </div>
            </div>
            {hasCoverImage && (
              <div className="mt-4 rounded-xl overflow-hidden border border-app-border">
                <img loading="lazy" src={trimmedThumbnailUrl} alt="Cover preview" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>

          {/* Editor Canvas */}
          <div className="min-h-[480px]">
            {isPreviewing ? (
              <div className="bg-app-surface rounded-2xl border border-app-border p-6 md:p-10 space-y-6">
                <h1 className="text-3xl font-extrabold leading-tight text-app-heading">{title || copy.previewTitle}</h1>
                {hasCoverImage && (
                  <img loading="lazy"
                    src={trimmedThumbnailUrl}
                    alt=""
                    className="aspect-video w-full rounded-xl border border-app-border object-cover"
                  />
                )}
                <div
                  className="serif-title text-[17px] leading-relaxed text-app-heading space-y-4"
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

          <div className="text-[10px] font-bold text-app-faint uppercase tracking-wider">
            {plainContent.length.toLocaleString(isVi ? 'vi-VN' : 'en-US')} {copy.characters}
          </div>
        </div>

        {/* Sidebar settings */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          
          {/* Categories Pill Selector */}
          <div className="bg-app-surface p-5 rounded-2xl border border-app-border shadow-sm space-y-4">
            <span className="block text-[10px] uppercase tracking-widest font-bold text-app-faint">{copy.targetDomain}</span>
            <div className="flex flex-wrap gap-2">
              {channels.map((channel) => {
                const selected = selectedChannel === channel.id;
                const displayName = localizeLabel(channel.name, language);
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      selected
                        ? 'bg-app-action text-app-on-action border-app-action shadow-sm'
                        : 'bg-app-surface-alt border-app-border text-app-muted hover:border-app-action/50'
                      }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Linked Source metadata */}
          <div className="bg-app-surface p-5 rounded-2xl border border-app-border shadow-sm space-y-4">
            <span className="block text-[10px] uppercase tracking-widest font-bold text-app-faint">{copy.citations}</span>
            
            <div className="space-y-4">
              <label className="block">
                <span className="block text-[10px] font-semibold text-app-muted mb-1">{copy.sourceUrl}</span>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-app-border rounded-lg text-xs outline-none focus:border-app-action focus:ring-2 focus:ring-[var(--color-app-action-soft)] bg-app-surface"
                />
              </label>

              <div className="block">
                <span className="block text-[10px] font-semibold text-app-muted mb-1">{copy.linkArticle}</span>
                {linkedArticleId ? (
                  <div className="flex items-center justify-between gap-2 border border-app-border rounded-lg px-3 py-2 bg-app-surface-alt">
                    <span className="truncate text-xs text-app-muted">{linkedArticleTitle}</span>
                    <button type="button" onClick={clearLinkedArticle} className="text-xs font-bold text-app-faint hover:text-app-heading">
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
                      placeholder={copy.searchArticles}
                      aria-label={copy.linkArticle}
                      className="w-full px-3 py-2 border border-app-border rounded-lg text-xs outline-none focus:border-app-action focus:ring-2 focus:ring-[var(--color-app-action-soft)] bg-app-surface"
                    />
                    {articleSearchResults.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-10 max-h-48 overflow-y-auto border border-app-border bg-app-surface rounded-xl shadow-lg mt-1">
                        {articleSearchResults.map((a) => (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => pickArticle(a.id, a.title, a.sourceUrl)}
                              className="w-full px-3 py-2.5 text-left text-xs text-app-heading hover:bg-app-surface-alt transition-all"
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
          <div className="bg-app-surface p-5 rounded-2xl border border-app-border shadow-sm space-y-4">
            <span className="block text-[10px] uppercase tracking-widest font-bold text-app-faint">{copy.checklist}</span>
            
            <div className="space-y-3">
              <CheckRow label={copy.headlineDrafted} ready={Boolean(title.trim())} readyLabel={copy.ready} missingLabel={copy.missing} />
              <CheckRow label={copy.bodyReady} ready={plainContent.length >= 80} readyLabel={copy.ready} missingLabel={copy.missing} />
              <CheckRow label={copy.domainReady} ready={Boolean(selectedChannel)} readyLabel={copy.ready} missingLabel={copy.missing} />
            </div>
          </div>
        </aside>
      </main>
    </form>
  );
};

const CheckRow: React.FC<{ label: string; ready: boolean; readyLabel: string; missingLabel: string }> = ({ label, ready, readyLabel, missingLabel }) => (
  <div className="flex items-center justify-between gap-3 border-b border-app-border/10 pb-2 text-xs font-semibold text-app-muted">
    <span>{label}</span>
    {ready ? (
      <span className="text-state-success flex items-center gap-0.5 uppercase tracking-wider text-[10px] font-bold">
        <CheckCircle2 className="h-3.5 w-3.5" /> {readyLabel}
      </span>
    ) : (
      <span className="text-state-warning flex items-center gap-0.5 uppercase tracking-wider text-[10px] font-bold">
        <AlertTriangle className="h-3.5 w-3.5" /> {missingLabel}
      </span>
    )}
  </div>
);

export default SubmitNewsScreen;
