import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Share2,
  Trash2,
  Calendar,
  Link2,
  Lightbulb,
  AlertTriangle,
  FileText,
  Sparkles,
  X,
  BookOpen,
} from 'lucide-react';
import { deleteHighlight, getHighlights, updateHighlightNote, type SavedHighlight } from '../lib/highlights';
import { Alert } from '../components/ui/Alert';
import { backendApi, type BackendSavedArticleDTO, type BackendSavedPostDTO } from '../lib/api';
import { PostCard } from '../components/PostCard';
import { backendArticleToPost, backendPostToPost } from '../lib/backendAdapters';
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';
import type { Post } from '../types';

type NotebookTab = 'highlights' | 'posts';

const formatTime = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date),
  );

export const HighlightsScreen: React.FC = () => {
  const language = useAppLanguage();
  const isVi = isVietnamese(language);
  const locale = isVi ? 'vi-VN' : 'en-US';
  const copy = {
    loadFailed: isVi ? 'Không thể tải sổ tay.' : 'Unable to load notebook.',
    updateNoteFailed: isVi ? 'Không thể cập nhật ghi chú.' : 'Unable to update note.',
    deleteFailed: isVi ? 'Không thể xoá điểm nổi bật.' : 'Unable to delete highlight.',
    saveSuccess: isVi ? 'Đã lưu thay đổi thành công.' : 'Changes saved.',
    saveFailed: isVi ? 'Lưu thay đổi thất bại.' : 'Unable to save changes.',
    exportSuccess: isVi ? 'Đã xuất PDF highlight.' : 'Highlight PDF exported.',
    exportFailed: isVi ? 'Xuất PDF thất bại.' : 'PDF export failed.',
    shareSuccess: isVi ? 'Đã sao chép liên kết bài viết.' : 'Article link copied.',
    shareFailed: isVi ? 'Sao chép liên kết thất bại.' : 'Unable to copy article link.',
    noNotes: isVi ? 'Chưa có ghi chú.' : 'No notes added.',
    searchHighlights: isVi ? 'Tìm kiếm điểm nổi bật, thẻ, hoặc nguồn...' : 'Search highlights, tags, or sources...',
    searchPosts: isVi ? 'Tìm kiếm bài đã lưu...' : 'Search saved articles...',
    highlightsCount: (count: number) => isVi ? `${count} ghi chú từ nguồn tin của bạn` : `${count} notes from your sources`,
    savedCount: (count: number) => isVi ? `${count} bài viết đã lưu` : `${count} saved articles`,
    highlightsTab: isVi ? 'Highlights' : 'Highlights',
    savedTab: isVi ? 'Bài Đã Lưu' : 'Saved',
    emptyHighlightsSearch: isVi ? 'Không tìm thấy điểm nổi bật phù hợp.' : 'No matching highlights found.',
    emptyHighlights: isVi ? 'Bạn chưa lưu trích dẫn nào. Hãy tô chọn văn bản trong bất kỳ bài viết nào để lưu tại đây.' : 'No highlights yet. Select text in any article to save it here.',
    generalNews: isVi ? 'Tin tức chung' : 'General news',
    emptyPostsSearch: isVi ? 'Không tìm thấy bài đã lưu phù hợp.' : 'No matching saved articles found.',
    emptyPosts: isVi ? 'Bạn chưa lưu bài viết nào.' : 'No saved articles yet.',
    detailTitle: isVi ? 'Chi Tiết Điểm Nổi Bật' : 'Highlight Details',
    originalQuote: isVi ? 'Trích Dẫn Gốc' : 'Original Quote',
    source: isVi ? 'Nguồn' : 'Source',
    personalNote: isVi ? 'Ghi Chú Cá Nhân' : 'Personal Note',
    hashtagSupport: isVi ? 'Hỗ Trợ Hashtag' : 'Hashtag Support',
    notePlaceholder: isVi ? 'Thêm suy nghĩ, hashtag, hoặc ghi chú hành động... (ví dụ: #chien-luoc, #rui-ro)' : 'Add thoughts, hashtags, or action notes... (for example: #strategy, #risk)',
    addTagPrompt: isVi ? 'Nhập thẻ mới (ví dụ: logistics, ai-trends):' : 'Enter new tag name (for example: logistics, ai-trends):',
    addTag: isVi ? 'Thêm Thẻ' : 'Add Tag',
    aiAnalysis: isVi ? 'Phân Tích AI' : 'AI Analysis',
    sentiment: isVi ? 'Cảm xúc' : 'Sentiment',
    confidence: isVi ? 'Độ tin cậy' : 'Confidence',
    saveChanges: isVi ? 'Lưu Thay Đổi' : 'Save Changes',
    export: isVi ? 'Xuất PDF' : 'Export PDF',
  };
  const [activeTab, setActiveTab] = useState<NotebookTab>('highlights');
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHighlight, setSelectedHighlight] = useState<SavedHighlight | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getHighlights(),
      backendApi.getSavedArticles().catch((): BackendSavedArticleDTO[] => []),
      backendApi.getSavedPosts().catch((): BackendSavedPostDTO[] => []),
    ])
      .then(([nextHighlights, nextSavedArticles, nextSavedPosts]) => {
        if (!isMounted) return;
        setHighlights(nextHighlights);
        setSavedPosts([
          ...nextSavedPosts.map((saved) => backendPostToPost(saved.post)),
          ...nextSavedArticles.map((saved) => ({ ...backendArticleToPost(saved.article), savedByMe: true })),
        ]);
        setNoteDrafts(
          nextHighlights.reduce<Record<string, string>>((drafts, highlight) => {
            drafts[highlight.id] = highlight.note || '';
            return drafts;
          }, {}),
        );
        if (nextHighlights.length > 0) {
          setSelectedHighlight(nextHighlights[0]);
        }
        setNotice('');
      })
      .catch((error) => {
        if (isMounted) setNotice(error instanceof Error ? error.message : copy.loadFailed);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Note auto-saving effect
  useEffect(() => {
    const timer = window.setTimeout(() => {
      Object.entries(noteDrafts).forEach(([id, note]) => {
        const saved = highlights.find((highlight) => highlight.id === id);
        if (saved && (saved.note || '') !== note) {
          updateHighlightNote(id, note)
            .then(() => {
              setHighlights((prev) =>
                prev.map((h) => (h.id === id ? { ...h, note } : h))
              );
            })
            .catch((error) =>
              toast.error(error instanceof Error ? error.message : copy.updateNoteFailed),
            );
        }
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [copy.updateNoteFailed, noteDrafts, highlights]);

  const handleDeleteHighlight = async (id: string) => {
    await deleteHighlight(id).catch((error) =>
      toast.error(error instanceof Error ? error.message : copy.deleteFailed),
    );
    setHighlights((current) => current.filter((highlight) => highlight.id !== id));
    setNoteDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (selectedHighlight?.id === id) {
      const remaining = highlights.filter((h) => h.id !== id);
      setSelectedHighlight(remaining[0] || null);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedHighlight) return;
    const note = noteDrafts[selectedHighlight.id] ?? '';
    try {
      await updateHighlightNote(selectedHighlight.id, note);
      setHighlights((prev) =>
        prev.map((h) => (h.id === selectedHighlight.id ? { ...h, note } : h))
      );
      toast.success(copy.saveSuccess);
    } catch {
      toast.error(copy.saveFailed);
    }
  };

  const handleExport = () => {
    if (!selectedHighlight) return;
    try {
      const note = noteDrafts[selectedHighlight.id] ?? selectedHighlight.note ?? '';
      const sourceUrl = `${window.location.origin}/app/p/${selectedHighlight.postId}`;
      const filenameBase = selectedHighlight.postTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 48) || 'tourane-highlight';
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      let y = 56;

      const writeBlock = (text: string, options?: { size?: number; style?: 'normal' | 'bold' | 'italic'; gap?: number }) => {
        doc.setFont('helvetica', options?.style ?? 'normal');
        doc.setFontSize(options?.size ?? 11);
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          if (y > 780) {
            doc.addPage();
            y = 56;
          }
          doc.text(line, margin, y);
          y += (options?.size ?? 11) + 6;
        });
        y += options?.gap ?? 10;
      };

      doc.setFillColor(36, 93, 63);
      doc.rect(0, 0, pageWidth, 12, 'F');
      writeBlock('Tourane News Highlight', { size: 18, style: 'bold', gap: 18 });
      writeBlock(selectedHighlight.postTitle, { size: 13, style: 'bold', gap: 12 });
      writeBlock(`"${selectedHighlight.text}"`, { size: 12, style: 'italic', gap: 18 });
      writeBlock(`${copy.source}: ${sourceUrl}`, { size: 10 });
      writeBlock(`Created: ${formatTime(selectedHighlight.createdAt, locale)}`, { size: 10 });
      if (parsedTags.length > 0) writeBlock(`Tags: ${parsedTags.join(', ')}`, { size: 10 });
      writeBlock('Notes', { size: 13, style: 'bold', gap: 8 });
      writeBlock(note || copy.noNotes, { size: 11 });

      doc.save(`${filenameBase}-highlight.pdf`);
      toast.success(copy.exportSuccess);
    } catch {
      toast.error(copy.exportFailed);
    }
  };

  const handleShareHighlight = () => {
    if (!selectedHighlight) return;
    const url = `${window.location.origin}/app/p/${selectedHighlight.postId}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success(copy.shareSuccess))
      .catch(() => toast.error(copy.shareFailed));
  };

  // Keyboard shortcut feedback (Meta/Ctrl + K focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        searchInput?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered lists
  const filteredHighlights = useMemo(() => {
    return highlights.filter((hl) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        hl.text.toLowerCase().includes(query) ||
        (hl.note || '').toLowerCase().includes(query) ||
        hl.postTitle.toLowerCase().includes(query)
      );
    });
  }, [highlights, searchQuery]);

  const filteredPosts = useMemo(() => {
    return savedPosts.filter((post) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        post.title.toLowerCase().includes(query) ||
        (post.content || '').toLowerCase().includes(query)
      );
    });
  }, [savedPosts, searchQuery]);

  // Dynamic category mapping based on notes
  const getHighlightCategory = (noteText: string) => {
    const text = noteText.toLowerCase();
    if (text.includes('#strategy') || text.includes('#growth') || text.includes('#fintech') || text.includes('#plan')) {
      return {
        label: 'STRATEGY',
        colorClass: 'bg-app-accent-soft text-app-accent',
        icon: Lightbulb
      };
    }
    if (text.includes('#risk') || text.includes('#warning') || text.includes('#security') || text.includes('#bug')) {
      return {
        label: 'RISK',
        colorClass: 'bg-red-500/10 text-state-error',
        icon: AlertTriangle
      };
    }
    return {
      label: 'INSIGHT',
      colorClass: 'bg-app-action-soft text-app-action',
      icon: Sparkles
    };
  };

  // Extract tags parsed from notes
  const currentNoteText = selectedHighlight ? (noteDrafts[selectedHighlight.id] ?? selectedHighlight.note ?? '') : '';
  const parsedTags = useMemo(() => {
    if (!currentNoteText) return [];
    const matches = currentNoteText.match(/#[a-zA-Z0-9_-]+/g);
    return matches ? Array.from(new Set(matches)) : [];
  }, [currentNoteText]);

  const handleDeleteTag = (tagToDelete: string) => {
    if (!selectedHighlight) return;
    const noteText = noteDrafts[selectedHighlight.id] ?? selectedHighlight.note ?? '';
    const updatedNote = noteText.replace(new RegExp(tagToDelete, 'g'), '').trim().replace(/\s+/g, ' ');
    setNoteDrafts((prev) => ({ ...prev, [selectedHighlight.id]: updatedNote }));
  };

  const handleAddTag = () => {
    if (!selectedHighlight) return;
    const tagName = prompt(copy.addTagPrompt);
    if (!tagName) return;
    const cleanTag = tagName.startsWith('#') ? tagName.trim() : `#${tagName.trim()}`;
    const noteText = noteDrafts[selectedHighlight.id] ?? selectedHighlight.note ?? '';
    const updatedNote = noteText ? `${noteText.trim()} ${cleanTag}` : cleanTag;
    setNoteDrafts((prev) => ({ ...prev, [selectedHighlight.id]: updatedNote }));
  };

  // Dynamic AI Intelligence Extraction Mock
  const aiAnalysis = useMemo(() => {
    if (!selectedHighlight) return null;
    const text = selectedHighlight.text.toLowerCase();
    let sentiment = 'Analytical';
    if (text.includes('growth') || text.includes('future') || text.includes('converge') || text.includes('mitigate') || text.includes('advancing')) {
      sentiment = 'Highly Bullish';
    } else if (text.includes('risk') || text.includes('warning') || text.includes('decryption') || text.includes('volatility')) {
      sentiment = 'Cautious / Risk';
    }
    const score = 80 + (selectedHighlight.text.length % 20);
    const filledDots = Math.max(1, Math.min(5, Math.round((score - 70) / 6)));
    return { sentiment, score, filledDots };
  }, [selectedHighlight]);



  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden w-full bg-app-bg">
      {/* Left side: Main Content Area */}
      <section className="flex-1 flex flex-col h-full overflow-hidden px-4 md:px-8 py-8">
        {/* Raycast-style Search Bar */}
        <div className="relative w-full max-w-3xl mx-auto mb-8 group shrink-0">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-app-muted" />
          </div>
          <input
            id="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-16 bg-app-surface border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-app-action-soft focus:border-app-action outline-none transition-all shadow-sm text-app-text"
            placeholder={activeTab === 'highlights' ? copy.searchHighlights : copy.searchPosts}
            type="text"
            aria-label={activeTab === 'highlights' ? copy.searchHighlights : copy.searchPosts}
          />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2 pointer-events-none">
            <kbd className="px-2 py-1 bg-app-surface-alt rounded text-[10px] text-app-muted font-mono border border-app-border">⌘</kbd>
            <kbd className="px-2 py-1 bg-app-surface-alt rounded text-[10px] text-app-muted font-mono border border-app-border">K</kbd>
          </div>
        </div>

        {/* Dashboard Headers */}
        <div className="flex justify-between items-end mb-6 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-app-text mb-1">Highlights</h1>
            <p className="text-app-muted text-sm">
              {activeTab === 'highlights'
                ? copy.highlightsCount(filteredHighlights.length)
                : copy.savedCount(filteredPosts.length)}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Tab selection */}
            {[
              ['highlights', copy.highlightsTab],
              ['posts', copy.savedTab],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as NotebookTab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  activeTab === id
                    ? 'bg-app-action text-app-on-action border-app-action'
                    : 'bg-app-surface border-app-border text-app-muted hover:bg-app-surface-alt'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <Alert tone="error" className="mb-6 shrink-0">
            {notice}
          </Alert>
        )}

        {/* Grid/List of Cards */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 hide-scrollbar pb-12">
          {activeTab === 'highlights' ? (
            filteredHighlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-app-border rounded-xl p-6 text-center">
                <BookOpen className="w-8 h-8 text-app-muted mb-2" />
                <p className="text-sm italic text-app-muted">
                  {searchQuery ? copy.emptyHighlightsSearch : copy.emptyHighlights}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredHighlights.map((hl) => {
                  const category = getHighlightCategory(noteDrafts[hl.id] ?? hl.note ?? '');
                  const CatIcon = category.icon;
                  const isSelected = selectedHighlight?.id === hl.id;

                  return (
                    <div
                      key={hl.id}
                      onClick={() => setSelectedHighlight(hl)}
                      className={`group bg-app-surface border rounded-xl p-6 shadow-sm cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-app-action ring-2 ring-app-action-soft'
                          : 'border-app-border hover:border-app-action-soft hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold tracking-wider ${category.colorClass}`}>
                          <CatIcon className="w-3 h-3" />
                          <span>{category.label}</span>
                        </div>
                        <span className="text-[11px] text-app-muted opacity-80">{formatTime(hl.createdAt, locale)}</span>
                      </div>
                      <p className="font-serif text-[15px] leading-relaxed text-app-text mb-4 line-clamp-3 italic">
                        "{hl.text}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-app-surface-alt flex items-center justify-center border border-app-border">
                          <FileText className="w-4 h-4 text-app-muted" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-app-text truncate max-w-[200px]">{hl.postTitle}</h3>
                          <p className="text-[10px] text-app-muted uppercase tracking-wider font-semibold">{hl.channelName || copy.generalNews}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-app-border rounded-xl p-6 text-center">
                <BookOpen className="w-8 h-8 text-app-muted mb-2" />
                <p className="text-sm italic text-app-muted">
                  {searchQuery ? copy.emptyPostsSearch : copy.emptyPosts}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )
          )}
        </div>
      </section>

      {/* Right side: Sliding Detail Panel */}
      {activeTab === 'highlights' && selectedHighlight && (
        <aside className="w-full max-w-md bg-app-surface border-l border-app-border h-full flex flex-col shadow-lg shrink-0">
          {/* Panel Header */}
          <div className="p-6 border-b border-app-border flex justify-between items-center bg-app-surface-alt/50 backdrop-blur-sm sticky top-0 shrink-0">
            <h2 className="text-sm font-bold text-app-text uppercase tracking-wider">{copy.detailTitle}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleShareHighlight}
                title="Share highlight link"
                className="p-2 hover:bg-app-surface-alt rounded-lg transition-colors text-app-muted hover:text-app-text"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteHighlight(selectedHighlight.id)}
                title="Delete highlight"
                className="p-2 hover:bg-red-500/10 hover:text-state-error rounded-lg transition-colors text-app-muted"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-6 hide-scrollbar space-y-8">
            {/* Full Quote Area */}
            <section>
              <span className="text-[10px] text-app-action font-bold tracking-widest block mb-3 uppercase">{copy.originalQuote}</span>
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-app-action rounded-full"></div>
                <blockquote className="font-serif text-[17px] text-app-text italic leading-relaxed">
                  "{selectedHighlight.text}"
                </blockquote>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-app-muted font-semibold">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {formatTime(selectedHighlight.createdAt, locale)}
                </span>
                <Link
                  to={`/app/p/${selectedHighlight.postId}`}
                  className="flex items-center gap-1 hover:text-app-action hover:underline"
                >
                  <Link2 className="w-3.5 h-3.5" /> {copy.source}: {selectedHighlight.postTitle}
                </Link>
              </div>
            </section>

            {/* Editable Annotations */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-app-muted font-bold uppercase tracking-wider block">{copy.personalNote}</span>
                <span className="text-[9px] bg-app-surface-alt px-1.5 py-0.5 rounded text-app-muted font-semibold border border-app-border">{copy.hashtagSupport}</span>
              </div>
              <textarea
                value={noteDrafts[selectedHighlight.id] ?? ''}
                onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [selectedHighlight.id]: e.target.value }))}
                className="w-full h-64 p-4 bg-app-surface-alt border border-app-border rounded-xl font-mono text-xs focus:ring-2 focus:ring-app-action-soft focus:border-app-action outline-none resize-none transition-all text-app-text"
                placeholder={copy.notePlaceholder}
              />
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {parsedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded bg-app-surface-alt text-[10px] font-bold text-app-muted border border-app-border flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2 py-1 rounded bg-app-action-soft text-app-action text-[10px] font-bold border border-app-action-soft flex items-center gap-1 hover:bg-app-action-faint transition-colors"
                >
                  <Plus className="w-3 h-3" /> {copy.addTag}
                </button>
              </div>
            </section>

            {/* AI Extraction / Metadata */}
            {aiAnalysis && (
              <section className="p-4 rounded-xl bg-app-action-faint border border-app-action-soft">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-app-action" />
                  <span className="text-[10px] text-app-action font-bold tracking-widest uppercase">{copy.aiAnalysis}</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex justify-between text-xs font-semibold">
                    <span className="text-app-muted">{copy.sentiment}</span>
                    <span className="text-app-action font-bold">{aiAnalysis.sentiment}</span>
                  </li>
                  <li className="flex justify-between text-xs font-semibold items-center">
                    <span className="text-app-muted">{copy.confidence}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <span
                          key={dot}
                          className={`w-3 h-1.5 rounded-full ${
                            dot <= aiAnalysis.filledDots ? 'bg-app-action' : 'bg-[var(--color-app-border)]'
                          }`}
                        ></span>
                      ))}
                    </div>
                  </li>
                </ul>
              </section>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-app-surface border-t border-app-border sticky bottom-0 flex gap-3 shrink-0">
            <button
              onClick={handleSaveChanges}
              className="flex-1 px-4 py-2.5 bg-app-action text-app-on-action rounded-lg text-xs font-bold shadow-md hover:bg-app-action-hover hover:shadow-lg transition-all active:scale-[0.98]"
            >
              {copy.saveChanges}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-app-surface-alt text-app-muted rounded-lg text-xs font-bold border border-app-border hover:bg-app-surface-alt hover:text-app-text transition-all"
            >
              {copy.export}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};

export default HighlightsScreen;
