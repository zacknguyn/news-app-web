import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import type { Channel, Post } from '../types';
import { getRecentPosts } from '../lib/recentlyViewed';

type ContextMode =
  | { kind: 'front-page'; trendingPosts: Post[]; savedCount: number; highlightsCount: number; latestArticles?: Post[]; editorsPicks?: Post[]; featuredArticles?: Post[] }
  | { kind: 'channel'; channel: Channel; topPosts: Post[] }
  | { kind: 'post-detail'; post: Post; relatedPosts: Post[]; recommendedArticles?: Post[] };

interface ContextPanelProps {
  mode: ContextMode;
}

const ContextPanel: React.FC<ContextPanelProps> = ({ mode }) => {
  return (
    <aside
      aria-label="Context"
      className="sticky top-[64px] hidden h-[calc(100dvh-64px)] w-72 overflow-y-auto bg-app-bg py-6 lg:block animate-fade-in"
    >
      <div className="space-y-8 px-4">
        {mode.kind === 'front-page' && <FrontPagePanel {...mode} />}
        {mode.kind === 'channel' && <ChannelPanel {...mode} />}
        {mode.kind === 'post-detail' && <PostDetailPanel {...mode} />}
      </div>
    </aside>
  );
};

const PanelHeader: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children, accent }) => (
  <h3 className="mb-3 text-[13px] font-semibold leading-none tracking-[-0.01em] text-app-heading">
    {accent && <span className="mr-2 inline-block h-2 w-2 rounded-full align-[-1px]" style={{ backgroundColor: accent }} />}
    {children}
  </h3>
);

const FrontPagePanel: React.FC<Extract<ContextMode, { kind: 'front-page' }>> = ({
  trendingPosts,
  savedCount,
  highlightsCount,
  latestArticles,
  editorsPicks,
  featuredArticles,
}) => (
  <>
    <section>
      <PanelHeader accent="var(--color-app-action)">Today</PanelHeader>
      <p className="text-[13px] italic leading-snug text-app-muted">
        The day&apos;s most reported, verified, and discussed stories.
      </p>
      <div className="mt-3 flex gap-4 text-[12px]">
        <Stat label="Saved" value={savedCount} />
        <Stat label="Highlights" value={highlightsCount} />
      </div>
    </section>

    <RecentSection />

    <section>
      <PanelHeader accent="var(--color-gold-500)">Most read</PanelHeader>
      <ol className="space-y-2.5">
        {trendingPosts.slice(0, 5).map((post, index) => (
          <li key={post.id} className="flex items-start gap-2.5">
            <span className="font-mono text-[11px] tabular-nums text-gold-500">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Link
              to={`/app/p/${post.id}`}
              className="min-w-0 text-[13px] font-semibold leading-snug text-app-heading transition-colors duration-150 hover:text-app-action"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>

    {editorsPicks && editorsPicks.length > 0 && (
      <section>
        <PanelHeader accent="var(--color-gold-500)">Editor&apos;s picks</PanelHeader>
        <ol className="space-y-2.5">
          {editorsPicks.slice(0, 4).map((post) => (
            <li key={post.id} className="flex items-start gap-2.5">
              <Link
                to={`/app/p/${post.id}`}
                className="min-w-0 text-[13px] font-semibold leading-snug text-app-heading transition-colors duration-150 hover:text-app-action"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    )}

    {featuredArticles && featuredArticles.length > 0 && (
      <section>
        <PanelHeader accent="var(--color-navy-500)">Featured</PanelHeader>
        <ol className="space-y-2.5">
          {featuredArticles.slice(0, 4).map((post) => (
            <li key={post.id} className="flex items-start gap-2.5">
              <Link
                to={`/app/p/${post.id}`}
                className="min-w-0 text-[13px] font-semibold leading-snug text-app-heading transition-colors duration-150 hover:text-app-action"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    )}

    {latestArticles && latestArticles.length > 0 && (
      <section>
        <PanelHeader accent="var(--color-navy-500)">Latest</PanelHeader>
        <ol className="space-y-2.5">
          {latestArticles.slice(0, 4).map((post) => (
            <li key={post.id} className="flex items-start gap-2.5">
              <Link
                to={`/app/p/${post.id}`}
                className="min-w-0 text-[13px] font-semibold leading-snug text-app-heading transition-colors duration-150 hover:text-app-action"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    )}

    <section>
      <PanelHeader>Daily brief</PanelHeader>
      <p className="text-[13px] italic leading-snug text-app-muted">Delivered at 7 a.m. local time.</p>
      <form className="mt-3 flex gap-2" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="daily-brief-email" className="sr-only">
          Email address
        </label>
        <input
          id="daily-brief-email"
          type="email"
          autoComplete="email"
          placeholder="you@domain.com"
          className="min-h-11 min-w-0 flex-1 border border-app-border bg-app-bg px-2.5 text-[13px] text-app-text outline-none transition-shadow placeholder:text-app-faint focus:border-app-action focus:shadow-[var(--shadow-focus)]"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center border border-app-action bg-app-action px-2.5 text-[12px] font-medium text-app-on-action transition-colors hover:bg-app-action-hover"
        >
          Subscribe
        </button>
      </form>
    </section>
  </>
);

const ChannelPanel: React.FC<Extract<ContextMode, { kind: 'channel' }>> = ({ channel, topPosts }) => (
  <>
    <section>
      <PanelHeader accent="var(--color-app-action)">About r/{channel.slug}</PanelHeader>
      <p className="text-[13px] italic leading-snug text-app-muted">
        {channel.description || 'A community for discussion and reporting on this beat.'}
      </p>
      <div className="mt-3 flex gap-4 text-[12px]">
        <Stat label="Members" value={channel.memberCount ?? 0} />
        <Stat label="Posts" value={channel.postCount ?? 0} />
      </div>
      <Link
        to={`/app/c/${channel.slug}/submit`}
        className="mt-4 inline-flex h-9 w-full items-center justify-center border border-app-heading bg-app-heading px-3 text-[12px] font-medium text-app-bg transition-colors hover:border-app-action hover:bg-app-action"
      >
        Submit to r/{channel.slug}
      </Link>
    </section>

    {channel.ownerName && (
      <section>
        <PanelHeader>Owner</PanelHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center border border-app-border bg-app-surface-alt font-mono text-[10px] font-bold text-app-faint">
            {channel.ownerName.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-[13px] font-semibold text-app-heading">@{channel.ownerName}</span>
          <ShieldCheck className="h-3.5 w-3.5 text-app-action" />
        </div>
      </section>
    )}

    {topPosts.length > 0 && (
      <section>
        <PanelHeader accent="var(--color-gold-500)">Top in this community</PanelHeader>
        <ol className="space-y-2.5">
          {topPosts.slice(0, 4).map((post, index) => (
            <li key={post.id} className="flex items-start gap-2.5">
              <span className="font-mono text-[11px] tabular-nums text-gold-500">
                {String(index + 1).padStart(2, '0')}
              </span>
              <Link
                to={`/app/p/${post.id}`}
                className="min-w-0 text-[13px] font-semibold leading-snug text-app-heading transition-colors duration-150 hover:text-app-action"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    )}

    <section>
      <PanelHeader>Rules</PanelHeader>
      <p className="text-[13px] italic leading-snug text-app-muted">
        Verified sources, on-topic discussion, no spam. Mods review flagged posts within 24 hours.
      </p>
    </section>
  </>
);

const PostDetailPanel: React.FC<Extract<ContextMode, { kind: 'post-detail' }>> = ({ post, relatedPosts, recommendedArticles }) => (
  <>
    <section>
      <PanelHeader accent="var(--color-app-action)">More from r/{post.channelName || 'community'}</PanelHeader>
      <ol className="space-y-2.5">
        {relatedPosts.slice(0, 5).map((related, index) => (
          <li key={related.id} className="flex items-start gap-2.5">
          <span className="font-mono text-[11px] tabular-nums" style={{ color: 'var(--color-app-action)' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
            <Link
              to={`/app/p/${related.id}`}
              className="min-w-0 text-[13px] font-semibold leading-snug text-app-heading transition-colors duration-150 hover:text-app-action"
            >
              {related.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>

    <section>
      <PanelHeader>Provenance</PanelHeader>
      <p className="text-[13px] italic leading-snug text-app-muted">
        Source verified, citations intact, and edits are disclosed in the changelog.
      </p>
      <Link
        to={`/app/p/${post.id}/trust`}
        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-app-action hover:underline"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        View full provenance
      </Link>
    </section>

    {recommendedArticles && recommendedArticles.length > 0 && (
      <section>
        <PanelHeader accent="var(--color-emerald-500)">Recommended</PanelHeader>
        <ol className="space-y-2.5">
          {recommendedArticles.slice(0, 4).map((article) => (
            <li key={article.id} className="flex items-start gap-2.5">
              <Link
                to={`/app/p/${article.id}`}
                className="min-w-0 text-[13px] font-semibold leading-snug text-app-heading transition-colors duration-150 hover:text-app-action"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    )}
  </>
);

const RecentSection: React.FC = () => {
  const recentPosts = getRecentPosts().slice(0, 5);
  if (recentPosts.length === 0) return null;
  return (
    <section>
      <PanelHeader accent="var(--color-emerald-500)">Continue reading</PanelHeader>
      <ol className="space-y-2.5">
        {recentPosts.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <Link
              to={`/app/p/${item.id}`}
              className="min-w-0 text-[13px] font-semibold leading-snug text-app-heading transition-colors duration-150 hover:text-app-action"
            >
              {item.title}
            </Link>
            <span className="shrink-0 font-mono text-[10px] text-app-faint">
              r/{item.channelName}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <span>
    <span className="text-base font-bold tabular-nums text-app-heading">{formatCount(value)}</span>
    <span className="ml-1 text-[12px] text-app-muted">{label}</span>
  </span>
);

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export { ContextPanel };
export type { ContextMode };
