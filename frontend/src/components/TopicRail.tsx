import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Plus, Search } from 'lucide-react';
import type { Channel } from '../types';
import { Tooltip } from './ui/Tooltip';

interface TopicRailProps {
  channels: Channel[];
  activeSlug?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const TopicRail: React.FC<TopicRailProps> = ({
  channels,
  activeSlug,
  collapsed = true,
  onToggleCollapsed,
}) => {
  const { slug } = useParams();
  const currentSlug = activeSlug ?? slug;
  const [query, setQuery] = useState('');

  const joinedChannels = useMemo(
    () => channels.filter((c) => c.joined),
    [channels],
  );

  const filteredJoined = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return joinedChannels;
    return joinedChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [query, joinedChannels]);

  if (collapsed) {
    const displayChannels = joinedChannels.slice(0, 12);

    return (
      <aside aria-label="Collapsed community navigation" className="flex h-full min-h-0 flex-col items-center bg-app-bg pt-3">
        <nav className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto px-2" aria-label="Compact community index">
          {displayChannels.map((channel) => {
            const isActive = currentSlug === channel.slug;
            return (
              <div key={channel.id} className="relative flex items-center">
                {isActive && (
                  <div className="absolute -left-2 h-5 w-1 rounded-r-full bg-app-action" />
                )}
                <Link
                  to={`/app/c/${channel.slug}`}
                  title={channel.name}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold uppercase transition-all hover:rounded-xl ${
                    isActive
                      ? 'bg-app-action text-app-on-action shadow-sm'
                      : 'bg-app-surface-alt text-app-muted hover:bg-app-action-faint hover:text-app-action'
                  }`}
                >
                  {channel.avatarUrl ? (
                    <img src={channel.avatarUrl} alt="" className="h-full w-full rounded-2xl object-cover hover:rounded-xl transition-all" />
                  ) : (
                    getInitials(channel.name)
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="px-2 py-3">
          <Tooltip label="Expand community list" side="right">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-app-border text-app-muted hover:border-app-action hover:text-app-action transition-all"
              aria-label="Expand communities sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip label="Create community" side="right">
            <Link
              to="/app/c/new"
              className="mt-1.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-app-border text-app-muted hover:border-app-action hover:text-app-action transition-all"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </Tooltip>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Community navigation" className="flex h-full min-h-0 flex-col bg-app-bg">
      <div className="border-b border-app-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-app-heading">Communities</h2>
          {onToggleCollapsed && (
            <Tooltip label="Collapse to icons" side="left">
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted hover:bg-app-surface-alt hover:text-app-heading transition-colors"
                aria-label="Collapse communities sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>
        <label
          className="mt-3 flex h-8 items-center gap-2 rounded-lg border border-app-border px-2.5 focus-within:border-app-action focus-within:shadow-[var(--shadow-focus)]"
          htmlFor="community-rail-search"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-app-muted" />
          <input
            id="community-rail-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter communities"
            className="h-full min-w-0 flex-1 bg-transparent text-xs text-app-heading outline-none placeholder:text-app-faint"
          />
        </label>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto py-2" aria-label="Community index">
        {filteredJoined.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-app-muted">
            {query.trim() ? 'No communities match.' : 'Join a community to see it here.'}
          </p>
        ) : (
          <div className="space-y-px px-2">
            {filteredJoined.map((channel) => {
              const isActive = currentSlug === channel.slug;
              return (
                <Link
                  key={channel.id}
                  to={`/app/c/${channel.slug}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-app-action-faint text-app-action font-semibold'
                      : 'text-app-muted hover:bg-app-surface-alt hover:text-app-heading'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase ${
                    isActive
                      ? 'bg-app-action text-app-on-action'
                      : 'bg-app-surface-alt text-app-muted'
                  }`}>
                    {channel.avatarUrl ? (
                      <img src={channel.avatarUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      getInitials(channel.name)
                    )}
                  </div>
                  <span className="truncate">{channel.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="border-t border-app-border px-4 py-3">
        <Link
          to="/app/c/new"
          className="flex items-center gap-2 text-xs font-semibold text-app-action hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Create community
        </Link>
      </div>
    </aside>
  );
};

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

export { TopicRail };
