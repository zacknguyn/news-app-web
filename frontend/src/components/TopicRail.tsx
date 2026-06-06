import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Pin, Search } from 'lucide-react';
import type { Channel } from '../types';
import { Tooltip } from './ui/Tooltip';

interface TopicRailProps {
  channels: Channel[];
  activeSlug?: string;
  totalPostCount?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const TopicRail: React.FC<TopicRailProps> = ({
  channels,
  activeSlug,
  totalPostCount,
  collapsed = false,
  onToggleCollapsed,
}) => {
  const { slug } = useParams();
  const currentSlug = activeSlug ?? slug;
  const [showAllJoined, setShowAllJoined] = useState(false);
  const [query, setQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readStoredList('tourane-pinned-communities'));
  const [recentSlugs, setRecentSlugs] = useState<string[]>(() => readStoredList('tourane-recent-communities'));

  const sortedChannels = useMemo(
    () => [...channels].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0)),
    [channels],
  );
  const filteredChannels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortedChannels;
    return sortedChannels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(normalizedQuery) ||
        channel.slug.toLowerCase().includes(normalizedQuery) ||
        channel.description.toLowerCase().includes(normalizedQuery),
    );
  }, [query, sortedChannels]);
  const pinnedChannels = useMemo(
    () =>
      pinnedIds
        .map((id) => filteredChannels.find((channel) => channel.id === id))
        .filter((channel): channel is Channel => Boolean(channel)),
    [filteredChannels, pinnedIds],
  );
  const recentChannels = useMemo(
    () =>
      recentSlugs
        .map((recentSlug) => filteredChannels.find((channel) => channel.slug === recentSlug))
        .filter((channel): channel is Channel => Boolean(channel))
        .filter((channel) => !pinnedIds.includes(channel.id))
        .slice(0, 4),
    [filteredChannels, pinnedIds, recentSlugs],
  );
  const joinedChannels = useMemo(
    () => filteredChannels.filter((channel) => channel.joined && !pinnedIds.includes(channel.id)),
    [filteredChannels, pinnedIds],
  );
  const visibleJoined = showAllJoined ? joinedChannels : joinedChannels.slice(0, 6);
  const discover = filteredChannels.filter((channel) => !channel.joined && !pinnedIds.includes(channel.id)).slice(0, 4);
  const hiddenJoinedCount = Math.max(0, joinedChannels.length - 6);

  const persistPinnedIds = (nextPinnedIds: string[]) => {
    setPinnedIds(nextPinnedIds);
    writeStoredList('tourane-pinned-communities', nextPinnedIds);
  };

  const togglePinned = (channelId: string) => {
    persistPinnedIds(
      pinnedIds.includes(channelId)
        ? pinnedIds.filter((id) => id !== channelId)
        : [channelId, ...pinnedIds].slice(0, 8),
    );
  };

  const rememberRecent = (channel: Channel) => {
    const nextRecentSlugs = [channel.slug, ...recentSlugs.filter((recentSlug) => recentSlug !== channel.slug)].slice(
      0,
      6,
    );
    setRecentSlugs(nextRecentSlugs);
    writeStoredList('tourane-recent-communities', nextRecentSlugs);
  };

  if (collapsed) {
    const compactChannels = [...pinnedChannels, ...joinedChannels, ...discover].slice(0, 8);

    return (
      <aside aria-label="Collapsed community navigation" className="flex h-full min-h-0 flex-col bg-app-bg">
        <div className="border-b border-app-border px-2 py-3">
          <Tooltip label="Expand the community sidebar." side="right" className="w-full">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex h-10 w-full items-center justify-center border border-app-border text-app-action hover:border-app-action"
              aria-label="Expand communities sidebar"
              aria-expanded={false}
              title="Expand communities"
            >
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto py-2" aria-label="Compact community index">
          {compactChannels.map((channel) => (
            <Link
              key={channel.id}
              to={`/app/c/${channel.slug}`}
              onClick={() => rememberRecent(channel)}
              title={channel.name}
              className={`flex h-12 items-center justify-center border-b border-app-border font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors hover:bg-app-surface-alt hover:text-app-heading ${
                currentSlug === channel.slug ? 'text-app-action' : 'text-app-muted'
              }`}
            >
              {getInitials(channel.name)}
            </Link>
          ))}
        </nav>
        <Link
          to="/app/c/new"
          title="Create community"
          className="flex h-12 items-center justify-center border-t border-app-border font-mono text-[14px] text-app-action hover:bg-app-surface-alt"
        >
          +
        </Link>
      </aside>
    );
  }

  return (
    <aside aria-label="Community navigation" className="flex h-full min-h-0 flex-col bg-app-bg">
      <div className="border-b border-app-border px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold leading-none tracking-[-0.01em] text-app-heading">Communities</h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-app-muted">
              {filteredChannels.length} indexed
            </p>
          </div>
          {onToggleCollapsed && (
            <Tooltip label="Collapse the sidebar and keep quick community initials visible." side="left">
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="flex h-9 w-9 items-center justify-center border border-app-border text-app-muted hover:border-app-action hover:text-app-action"
                aria-label="Collapse communities sidebar"
                aria-expanded
                title="Collapse communities"
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </button>
            </Tooltip>
          )}
        </div>
        <label
          className="mt-4 flex h-9 items-center gap-2 border border-app-border px-2.5 focus-within:border-app-action focus-within:shadow-[var(--shadow-focus)]"
          htmlFor="community-rail-search"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-app-muted" aria-hidden="true" />
          <span className="sr-only">Filter communities</span>
          <input
            id="community-rail-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter communities"
            className="h-full min-w-0 flex-1 bg-transparent font-mono text-[11px] uppercase tracking-wider text-app-heading outline-none placeholder:text-app-faint"
          />
        </label>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto" aria-label="Community index">
        {pinnedChannels.length > 0 && (
          <RailSection label="Pinned" count={pinnedChannels.length}>
            {pinnedChannels.map((channel, index) => (
              <ChannelRow
                key={channel.id}
                index={index + 1}
                channel={channel}
                active={currentSlug === channel.slug}
                pinned
                onPinToggle={togglePinned}
                onOpen={rememberRecent}
              />
            ))}
          </RailSection>
        )}

        {recentChannels.length > 0 && !query.trim() && (
          <RailSection label="Recent">
            {recentChannels.map((channel, index) => (
              <ChannelRow
                key={channel.id}
                index={index + 1}
                channel={channel}
                active={currentSlug === channel.slug}
                pinned={pinnedIds.includes(channel.id)}
                onPinToggle={togglePinned}
                onOpen={rememberRecent}
              />
            ))}
          </RailSection>
        )}

        <RailSection label="Your communities" count={joinedChannels.length}>
          {visibleJoined.length === 0 ? (
            <p className="px-4 py-3 text-[12px] italic text-app-muted">
              {query.trim() ? 'No followed communities match.' : 'Join a community to see it here.'}
            </p>
          ) : (
            visibleJoined.map((channel, index) => (
              <ChannelRow
                key={channel.id}
                index={index + 1}
                channel={channel}
                active={currentSlug === channel.slug}
                pinned={pinnedIds.includes(channel.id)}
                onPinToggle={togglePinned}
                onOpen={rememberRecent}
              />
            ))
          )}
          {hiddenJoinedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllJoined(!showAllJoined)}
              className="grid min-h-10 w-full grid-cols-[2rem_minmax(0,1fr)] items-center border-t border-app-border px-4 text-left font-mono text-[11px] uppercase tracking-wider text-app-action hover:bg-app-surface-alt"
            >
              <span aria-hidden="true">+</span>
              <span>{showAllJoined ? 'Show less' : `Show ${hiddenJoinedCount} more`}</span>
            </button>
          )}
        </RailSection>

        <RailSection label="Discover">
          {discover.length === 0 ? (
            <p className="px-4 py-3 text-[12px] italic text-app-muted">
              {query.trim() ? 'No discoverable communities match.' : 'No new communities.'}
            </p>
          ) : (
            discover.map((channel, index) => (
              <ChannelRow
                key={channel.id}
                index={index + 1}
                channel={channel}
                active={currentSlug === channel.slug}
                pinned={pinnedIds.includes(channel.id)}
                onPinToggle={togglePinned}
                onOpen={rememberRecent}
              />
            ))
          )}
        </RailSection>
      </nav>

      <div className="border-t border-app-border px-4 py-4">
        <Link
          to="/app/c/new"
          className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
        >
          Create community
        </Link>
        {totalPostCount !== undefined && (
          <p className="mt-3 font-mono text-[10px] text-app-muted">{formatCount(totalPostCount)} reports in rotation</p>
        )}
      </div>
    </aside>
  );
};

const RailSection: React.FC<{ label: string; count?: number; children: React.ReactNode }> = ({
  label,
  count,
  children,
}) => (
  <section className="border-b border-app-border py-4">
    <div className="mb-2 flex items-center justify-between px-4">
      <h3 className="mono-label text-app-muted">{label}</h3>
      {count !== undefined && <span className="font-mono text-[10px] tabular-nums text-app-muted">{count}</span>}
    </div>
    <div>{children}</div>
  </section>
);

const ChannelRow: React.FC<{
  channel: Channel;
  active: boolean;
  index: number;
  pinned?: boolean;
  onPinToggle: (channelId: string) => void;
  onOpen: (channel: Channel) => void;
}> = ({ channel, active, index, pinned = false, onPinToggle, onOpen }) => (
  <div
    className={`grid min-h-12 grid-cols-[2rem_minmax(0,1fr)_2.25rem] items-center gap-2 border-t border-app-border px-4 text-[13px] transition-colors hover:bg-app-surface-alt ${
      active ? 'text-app-heading' : 'text-app-muted'
    }`}
  >
    <span className={`font-mono text-[10px] tabular-nums ${active ? 'text-app-action' : 'text-app-faint'}`}>
      {String(index).padStart(2, '0')}
    </span>
    <Link to={`/app/c/${channel.slug}`} onClick={() => onOpen(channel)} className="min-w-0 hover:text-app-heading">
      <span className={`block truncate ${active ? 'font-semibold text-app-heading' : 'font-medium'}`}>
        {channel.name}
      </span>
      <span className="block truncate font-mono text-[10px] tabular-nums text-app-muted">
        {formatCount(channel.memberCount || 0)} members / {formatCount(channel.postCount || 0)} reports
      </span>
    </Link>
    <Tooltip label={pinned ? 'Remove this community from pinned.' : 'Pin this community to the top.'} side="left">
      <button
        type="button"
        onClick={() => onPinToggle(channel.id)}
        className={`flex h-8 w-8 items-center justify-center border border-transparent transition-colors hover:border-app-border ${
          pinned ? 'text-app-action' : 'text-app-faint hover:text-app-heading'
        }`}
        aria-label={pinned ? `Unpin ${channel.name}` : `Pin ${channel.name}`}
        title={pinned ? 'Unpin community' : 'Pin community'}
      >
        <Pin className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </Tooltip>
  </div>
);

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'TN'
  );
}

function readStoredList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeStoredList(key: string, value: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export { TopicRail };
