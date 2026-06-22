import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import type { Post } from '../types';

type NotebookTab = 'highlights' | 'posts';

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date),
  );

export const HighlightsScreen: React.FC = () => {
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
          ...nextSavedArticles.map((saved) => backendArticleToPost(saved.article)),
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
        if (isMounted) setNotice(error instanceof Error ? error.message : 'Unable to load notebook.');
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
              toast.error(error instanceof Error ? error.message : 'Unable to update note.'),
            );
        }
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [noteDrafts, highlights]);

  const handleDeleteHighlight = async (id: string) => {
    await deleteHighlight(id).catch((error) =>
      toast.error(error instanceof Error ? error.message : 'Unable to delete highlight.'),
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
      toast.success('Changes saved successfully.');
    } catch {
      toast.error('Failed to save changes.');
    }
  };

  const handleExport = () => {
    if (!selectedHighlight) return;
    const note = noteDrafts[selectedHighlight.id] ?? selectedHighlight.note ?? '';
    const markdown = `> ${selectedHighlight.text}\n\n**Source:** [${selectedHighlight.postTitle}](http://localhost:5175/app/p/${selectedHighlight.postId})\n**Created:** ${formatTime(selectedHighlight.createdAt)}\n\n**Annotations:**\n${note || 'No notes added.'}`;
    navigator.clipboard.writeText(markdown)
      .then(() => toast.success('Copied highlight to clipboard in Markdown.'))
      .catch(() => toast.error('Failed to copy.'));
  };

  const handleShareHighlight = () => {
    if (!selectedHighlight) return;
    const url = `${window.location.origin}/app/p/${selectedHighlight.postId}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Article link copied to clipboard.'))
      .catch(() => toast.error('Failed to copy link.'));
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
        colorClass: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
        icon: Lightbulb
      };
    }
    if (text.includes('#risk') || text.includes('#warning') || text.includes('#security') || text.includes('#bug')) {
      return {
        label: 'RISK',
        colorClass: 'bg-red-500/10 text-[var(--color-error)]',
        icon: AlertTriangle
      };
    }
    return {
      label: 'INSIGHT',
      colorClass: 'bg-[var(--color-action-soft)] text-[var(--color-action)]',
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
    const tagName = prompt('Enter new tag name (e.g., logistics, ai-trends):');
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
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden w-full bg-[var(--color-bg)]">
      {/* Left side: Main Content Area */}
      <section className="flex-1 flex flex-col h-full overflow-hidden px-4 md:px-8 py-8">
        {/* Raycast-style Search Bar */}
        <div className="relative w-full max-w-3xl mx-auto mb-8 group shrink-0">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[var(--color-muted)]" />
          </div>
          <input
            id="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-action-soft)] focus:border-[var(--color-action)] outline-none transition-all shadow-sm text-[var(--color-text)]"
            placeholder={activeTab === 'highlights' ? "Search highlights, tags, or sources..." : "Search saved posts..."}
            type="text"
          />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2 pointer-events-none">
            <kbd className="px-2 py-1 bg-[var(--color-surface-alt)] rounded text-[10px] text-[var(--color-muted)] font-mono border border-[var(--color-border)]">⌘</kbd>
            <kbd className="px-2 py-1 bg-[var(--color-surface-alt)] rounded text-[10px] text-[var(--color-muted)] font-mono border border-[var(--color-border)]">K</kbd>
          </div>
        </div>

        {/* Dashboard Headers */}
        <div className="flex justify-between items-end mb-6 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-1">Knowledge Highlights</h1>
            <p className="text-[var(--color-muted)] text-sm">
              {activeTab === 'highlights'
                ? `${filteredHighlights.length} active notes from your intelligence feed`
                : `${filteredPosts.length} saved articles and posts`}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Tab selection */}
            {[
              ['highlights', 'Highlights'],
              ['posts', 'Saved Posts'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as NotebookTab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  activeTab === id
                    ? 'bg-[var(--color-action)] text-[var(--color-on-action)] border-[var(--color-action)]'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]'
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
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[var(--color-border)] rounded-xl p-6 text-center">
                <BookOpen className="w-8 h-8 text-[var(--color-muted)] mb-2" />
                <p className="text-sm italic text-[var(--color-muted)]">
                  {searchQuery ? 'No highlights found matching search query.' : 'You have not saved any quotes yet. Highlight text in any post to save it here.'}
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
                      className={`group bg-[var(--color-surface)] border rounded-xl p-6 shadow-sm cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-[var(--color-action)] ring-2 ring-[var(--color-action-soft)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-action-soft)] hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold tracking-wider ${category.colorClass}`}>
                          <CatIcon className="w-3 h-3" />
                          <span>{category.label}</span>
                        </div>
                        <span className="text-[11px] text-[var(--color-muted)] opacity-80">{formatTime(hl.createdAt)}</span>
                      </div>
                      <p className="font-serif text-[15px] leading-relaxed text-[var(--color-text)] mb-4 line-clamp-3 italic">
                        "{hl.text}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[var(--color-surface-alt)] flex items-center justify-center border border-[var(--color-border)]">
                          <FileText className="w-4 h-4 text-[var(--color-muted)]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-[var(--color-text)] truncate max-w-[200px]">{hl.postTitle}</h3>
                          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">{hl.channelName || 'Global Intelligence'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[var(--color-border)] rounded-xl p-6 text-center">
                <BookOpen className="w-8 h-8 text-[var(--color-muted)] mb-2" />
                <p className="text-sm italic text-[var(--color-muted)]">
                  {searchQuery ? 'No saved posts found matching search query.' : 'No saved posts yet.'}
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
        <aside className="w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] h-full flex flex-col shadow-lg shrink-0">
          {/* Panel Header */}
          <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface-alt)]/50 backdrop-blur-sm sticky top-0 shrink-0">
            <h2 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider">Highlight Detail</h2>
            <div className="flex gap-2">
              <button
                onClick={handleShareHighlight}
                title="Share highlight link"
                className="p-2 hover:bg-[var(--color-surface-container-high)] rounded-lg transition-colors text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteHighlight(selectedHighlight.id)}
                title="Delete highlight"
                className="p-2 hover:bg-red-500/10 hover:text-[var(--color-error)] rounded-lg transition-colors text-[var(--color-muted)]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-6 hide-scrollbar space-y-8">
            {/* Full Quote Area */}
            <section>
              <span className="text-[10px] text-[var(--color-action)] font-bold tracking-widest block mb-3 uppercase">Original Highlight</span>
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-action)] rounded-full"></div>
                <blockquote className="font-serif text-[17px] text-[var(--color-text)] italic leading-relaxed">
                  "{selectedHighlight.text}"
                </blockquote>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--color-muted)] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {formatTime(selectedHighlight.createdAt)}
                </span>
                <Link
                  to={`/app/p/${selectedHighlight.postId}`}
                  className="flex items-center gap-1 hover:text-[var(--color-action)] hover:underline"
                >
                  <Link2 className="w-3.5 h-3.5" /> Source: {selectedHighlight.postTitle}
                </Link>
              </div>
            </section>

            {/* Editable Annotations */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-wider block">Personal Annotations</span>
                <span className="text-[9px] bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded text-[var(--color-muted)] font-semibold border border-[var(--color-border)]">HASHTAGS SUPPORTED</span>
              </div>
              <textarea
                value={noteDrafts[selectedHighlight.id] ?? ''}
                onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [selectedHighlight.id]: e.target.value }))}
                className="w-full h-64 p-4 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl font-mono text-xs focus:ring-2 focus:ring-[var(--color-action-soft)] focus:border-[var(--color-action)] outline-none resize-none transition-all text-[var(--color-text)]"
                placeholder="Add your thoughts, hashtags, or action items here... (e.g., #strategy, #risk)"
              />
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {parsedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded bg-[var(--color-surface-alt)] text-[10px] font-bold text-[var(--color-muted)] border border-[var(--color-border)] flex items-center gap-1"
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
                  className="px-2 py-1 rounded bg-[var(--color-action-soft)] text-[var(--color-action)] text-[10px] font-bold border border-[var(--color-action-soft)] flex items-center gap-1 hover:bg-[var(--color-action-faint)] transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Tag
                </button>
              </div>
            </section>

            {/* AI Extraction / Metadata */}
            {aiAnalysis && (
              <section className="p-4 rounded-xl bg-[var(--color-action-faint)] border border-[var(--color-action-soft)]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[var(--color-action)]" />
                  <span className="text-[10px] text-[var(--color-action)] font-bold tracking-widest uppercase">AI Intelligence</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--color-muted)]">Sentiment</span>
                    <span className="text-[var(--color-action)] font-bold">{aiAnalysis.sentiment}</span>
                  </li>
                  <li className="flex justify-between text-xs font-semibold items-center">
                    <span className="text-[var(--color-muted)]">Confidence Score</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <span
                          key={dot}
                          className={`w-3 h-1.5 rounded-full ${
                            dot <= aiAnalysis.filledDots ? 'bg-[var(--color-action)]' : 'bg-[var(--color-border)]'
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
          <div className="p-6 bg-[var(--color-surface)] border-t border-[var(--color-border)] sticky bottom-0 flex gap-3 shrink-0">
            <button
              onClick={handleSaveChanges}
              className="flex-1 px-4 py-2.5 bg-[var(--color-action)] text-[var(--color-on-action)] rounded-lg text-xs font-bold shadow-md hover:bg-[var(--color-action-hover)] hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Save Changes
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-[var(--color-surface-alt)] text-[var(--color-muted)] rounded-lg text-xs font-bold border border-[var(--color-border)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text)] transition-all"
            >
              Export
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};

export default HighlightsScreen;
