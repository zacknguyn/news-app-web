import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { AdCard } from './AdCard';
import type { Post } from '../types';
import type { BackendAdCampaignDTO } from '../lib/api';

export type PostDetailSidebarStrings = {
  aiSummary: string;
  generate: string;
  summarizing: string;
  regenerating: string;
  regenerate: string;
  sponsored: string;
  notebook: string;
  notebookEmpty: string;
  youMightLike: string;
};

type PostDetailSidebarProps = {
  activeSummary: string | null;
  isSummaryLoading: boolean;
  onGenerateSummary: () => void;
  ad: BackendAdCampaignDTO | null;
  highlights: { id: string; text: string }[];
  relatedPosts: Post[];
  strings: PostDetailSidebarStrings;
};

export function PostDetailSidebar({
  activeSummary,
  isSummaryLoading,
  onGenerateSummary,
  ad,
  highlights,
  relatedPosts,
  strings,
}: PostDetailSidebarProps) {
  const [notebookOpen, setNotebookOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section>
            <h2 className="font-sans text-xs text-app-heading font-bold mb-3 flex items-center gap-1.5">
              <span className="w-1 h-1 bg-app-action rounded-full" />
              {strings.youMightLike}
            </h2>
            <div className="space-y-2">
              {relatedPosts.slice(0, 4).map((rp) => (
                <Link
                  key={rp.id}
                  to={`/app/p/${rp.id}`}
                  className="flex gap-3 p-3 bg-app-surface rounded-xl border border-app-border hover:border-app-action/30 hover:shadow-sm transition-all group"
                >
                  {rp.mediaUrl && rp.mediaType === 'image' && (
                    <div className="shrink-0 w-[96px] h-[72px] rounded-md overflow-hidden bg-app-surface-alt">
                      <img
                        src={rp.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 self-center">
                    <p className="text-sm font-semibold text-app-heading line-clamp-2 group-hover:text-app-action transition-colors leading-snug">
                      {rp.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {rp.author?.avatarUrl && (
                        <img
                          src={rp.author.avatarUrl}
                          alt=""
                          className="w-3.5 h-3.5 rounded-full"
                        />
                      )}
                        <span className="text-[11px] text-app-faint truncate">
                        {rp.author?.name ?? 'unknown'}
                      </span>
                        <span className="text-[11px] text-app-faint shrink-0">
                        in {rp.channelName}
                      </span>
                      <span className="text-[11px] text-app-faint">·</span>
                      <span className="text-[11px] text-app-faint shrink-0 font-semibold">
                        {rp.upvotes - rp.downvotes}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        {relatedPosts.length > 0 && <div className="border-t border-app-border/50" />}

        {/* AI Summary */}
        <section>
          <h2 className="font-sans text-xs text-app-heading font-bold mb-3 flex items-center gap-1.5">
            <span className="w-1 h-1 bg-app-action rounded-full" />
            {strings.aiSummary}
          </h2>
          {activeSummary ? (
            <div className="space-y-2.5">
              <div className="text-sm leading-7 text-app-muted bg-app-surface p-4 rounded-xl border border-app-border whitespace-pre-wrap">
                {activeSummary}
              </div>
              <button
                onClick={onGenerateSummary}
                disabled={isSummaryLoading}
                className="text-xs text-app-action hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                {isSummaryLoading ? strings.regenerating : `✦ ${strings.regenerate}`}
              </button>
            </div>
          ) : (
            <button
              onClick={onGenerateSummary}
              disabled={isSummaryLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-app-action text-app-on-action hover:bg-app-action-hover rounded-xl font-bold text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSummaryLoading ? (
                <>
                  <span className="animate-spin text-sm">✦</span>
                  <span>{strings.summarizing}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{strings.generate}</span>
                </>
              )}
            </button>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-app-border/50" />

        {/* Notebook - collapsible accordion */}
        <section className="bg-app-surface rounded-xl border border-app-border overflow-hidden">
          <button
            onClick={() => setNotebookOpen(!notebookOpen)}
            aria-expanded={notebookOpen}
            aria-controls="sidebar-notebook-content"
            className="w-full flex items-center justify-between p-3 hover:bg-app-surface-alt transition-colors"
          >
            <h2 className="font-sans text-xs text-app-heading font-bold flex items-center gap-1.5">
              <span className="w-1 h-1 bg-app-action rounded-full" />
              {strings.notebook}
              {highlights.length > 0 && (
                <span className="text-[10px] bg-app-action/10 text-app-action px-1.5 py-0.5 rounded-full font-bold">
                  {highlights.length}
                </span>
              )}
            </h2>
            {notebookOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-app-muted" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-app-muted" />
            )}
          </button>
          {notebookOpen && (
            <div id="sidebar-notebook-content" className="px-3 pb-3">
              {highlights.length > 0 ? (
                <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                  {highlights.map((hl) => (
                    <div
                      key={hl.id}
                    className="p-3 bg-app-action-faint rounded-md text-sm leading-relaxed text-app-muted"
                    >
                      &ldquo;{hl.text}&rdquo;
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-app-faint italic px-1">{strings.notebookEmpty}</p>
              )}
            </div>
          )}
        </section>

        {/* Sponsored */}
        {ad && (
          <div className="pt-1">
            <p className="font-sans text-[9px] text-app-faint uppercase tracking-widest font-semibold mb-2">
              {strings.sponsored}
            </p>
            <AdCard ad={ad} compact />
          </div>
        )}
      </div>
    </div>
  );
}
