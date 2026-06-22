import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfilePath } from '../lib/profileLinks';
import { BrandMark } from './BrandMark';
import { TopicRail } from './TopicRail';
import { SearchInput } from './ui/SearchInput';
import { useChannels } from '../lib/useChannels';
import {
  readAppPreferences,
  saveAppPreferences,
  subscribeAppPreferences,
  type AppPreferences,
} from '../lib/appPreferences';
import { backendApi } from '../lib/api';
import { backendArticleToPost } from '../lib/backendAdapters';
import { stripHtml } from '../lib/richContent';
import type { Post } from '../types';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-16 shrink-0 items-center border-b-2 px-1 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
    isActive
      ? 'border-[var(--color-app-action)] text-[var(--color-app-heading)]'
      : 'border-transparent text-[var(--color-app-faint)] hover:border-[var(--color-app-border)] hover:text-[var(--color-app-heading)]'
  }`;

const navItems = [
  { to: '/app', label: 'Home', end: true },
  { to: '/app/browse', label: 'Browse' },
  { to: '/app/highlights', label: 'Notebook' },
  { to: '/app/subscribe', label: 'Subscribe' },
];

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (value: T) => void;
};

const SegmentedControl = <T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) => (
  <div className="space-y-2">
    <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-muted)]">
      {label}
    </div>
    <div
      className="grid border border-[var(--color-app-border)]"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`min-h-10 px-3 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
            value === option.value
              ? 'bg-[var(--color-app-heading)] text-[var(--color-app-bg)]'
              : 'border-l border-[var(--color-app-border)] text-[var(--color-app-muted)] first:border-l-0 hover:text-[var(--color-app-action)]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

export const AppTopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';
  const isPartner = user?.role === 'PARTNER' || isAdmin;
  const profilePath = user ? getProfilePath(user) : '/login';
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const railDrawerRef = useRef<HTMLDivElement>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [preferences, setPreferences] = useState<AppPreferences>(() => readAppPreferences());
  const { channels } = useChannels();

  useEffect(() => {
    setIsRailOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    saveAppPreferences(preferences);
  }, [preferences]);

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  useEffect(() => {
    if (!isSettingsOpen && !isAccountOpen && !isSearchOpen && !isRailOpen) return;

    const closeMenus = (event: KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') {
          setIsSettingsOpen(false);
          setIsAccountOpen(false);
          setIsSearchOpen(false);
          setIsRailOpen(false);
        }
        return;
      }

      const target = event.target as Node;
      if (
        settingsMenuRef.current?.contains(target) ||
        accountMenuRef.current?.contains(target) ||
        searchRef.current?.contains(target)
      )
        return;
      if (railDrawerRef.current?.contains(target)) return;
      setIsSettingsOpen(false);
      setIsAccountOpen(false);
      setIsSearchOpen(false);
      setIsRailOpen(false);
    };

    document.addEventListener('keydown', closeMenus);
    document.addEventListener('mousedown', closeMenus);

    return () => {
      document.removeEventListener('keydown', closeMenus);
      document.removeEventListener('mousedown', closeMenus);
    };
  }, [isSettingsOpen, isAccountOpen, isSearchOpen, isRailOpen]);

  useEffect(() => {
    const keyword = searchQuery.trim();

    if (keyword.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError('');
      return;
    }

    let isCancelled = false;
    setIsSearching(true);
    setSearchError('');

    const timeout = window.setTimeout(async () => {
      try {
        const results = await backendApi.searchArticles(keyword, 0, 6);
        if (!isCancelled) {
          setSearchResults(results.content.map(backendArticleToPost));
          setIsSearchOpen(true);
        }
      } catch (error) {
        if (!isCancelled) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : 'Search failed.');
          setIsSearchOpen(true);
        }
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    }, 220);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  const openSearchResult = (post: Post) => {
    setIsSearchOpen(false);
    navigate(`/app/p/${post.id}`);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchResults.length === 1) {
      openSearchResult(searchResults[0]);
      return;
    }
    if (searchQuery.trim().length >= 2) setIsSearchOpen(true);
  };

  return (
    <header className="app-topbar sticky top-0 z-40 border-b border-[var(--color-app-border)] bg-[var(--color-app-bg)]">
      <div className="grid h-16 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 sm:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:gap-6">
          <button
            type="button"
            onClick={() => setIsRailOpen(true)}
            className="inline-flex h-9 shrink-0 items-center border border-[var(--color-app-border)] px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-muted)] transition-colors hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] xl:hidden"
            aria-label="Open communities"
            aria-expanded={isRailOpen}
          >
            Topics
          </button>
          <Link to="/app" className="shrink-0" aria-label="Tourane News home">
            <span className="sm:hidden">
              <BrandMark size="sm" showText={false} />
            </span>
            <span className="hidden sm:inline-flex">
              <BrandMark size="sm" />
            </span>
          </Link>

          <nav className="hidden min-w-0 items-center gap-5 overflow-x-auto lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
            {isPartner && (
              <NavLink to="/app/partner/ads" className={navLinkClass}>
                Ads
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        <div ref={searchRef} className="relative justify-self-end">
          <form onSubmit={handleSearchSubmit} className="hidden md:block" role="search">
            <label htmlFor="topbar-search" className="sr-only">
              Search reports
            </label>
            <SearchInput
              id="topbar-search"
              size="sm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setIsSearchOpen(true);
              }}
              onClear={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              placeholder="Search reports"
              containerClassName="w-[15rem] bg-[var(--color-app-surface-alt)] lg:w-[17rem] xl:w-[20rem]"
            />
          </form>

          <button
            type="button"
            onClick={() => setIsSearchOpen((open) => !open)}
            className="inline-flex h-9 items-center border border-[var(--color-app-border)] px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-muted)] transition-colors hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] md:hidden"
            aria-label="Search reports"
            aria-expanded={isSearchOpen}
          >
            Search
          </button>

          {isSearchOpen && (
            <div className="absolute right-0 top-12 z-50 w-[min(92vw,34rem)] border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-2 shadow-[var(--shadow-modal)]">
              <form onSubmit={handleSearchSubmit} className="mb-2 md:hidden" role="search">
                <label htmlFor="mobile-topbar-search" className="sr-only">
                  Search reports
                </label>
                <SearchInput
                  id="mobile-topbar-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onClear={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  placeholder="Search reports"
                  autoFocus
                />
              </form>

              <div className="max-h-[60vh] overflow-y-auto">
                {searchQuery.trim().length < 2 ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">
                    Type at least two characters.
                  </div>
                ) : isSearching ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">Searching...</div>
                ) : searchError ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-action)]">{searchError}</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">No posts found. Try a different search term or browse <Link to="/app" className="text-app-action hover:underline">the home page</Link>.</div>
                ) : (
                  <div className="divide-y divide-[var(--color-app-border)]">
                    {searchResults.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => openSearchResult(post)}
                        className="group grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 px-3 py-3 text-left hover:bg-[var(--color-app-surface-alt)]"
                      >
                        <span className="min-w-0">
                          <span className="block text-[10px] font-bold text-[var(--color-app-muted)]">
                            {post.channelName}
                          </span>
                          <span className="mt-1 block truncate font-[var(--font-display)] text-base font-bold text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">
                            {post.title}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--color-app-muted)]">
                            {stripHtml(post.content)}
                          </span>
                        </span>
                        <span className="pt-5 text-[10px] font-bold text-[var(--color-app-action)]">Open</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Link
            to="/app/submit"
            className="hidden h-9 items-center bg-[var(--color-app-heading)] px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-bg)] transition-colors hover:bg-[var(--color-app-action)] sm:inline-flex"
          >
            File
          </Link>
          <div ref={settingsMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen((open) => !open);
                setIsAccountOpen(false);
              }}
              className="hidden h-9 items-center border border-transparent px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-muted)] transition-colors hover:border-[var(--color-app-border)] hover:text-[var(--color-app-heading)] sm:inline-flex"
              aria-haspopup="dialog"
              aria-expanded={isSettingsOpen}
              aria-label="Open display preferences"
            >
              View
            </button>

            {isSettingsOpen && (
              <div
                className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-4 shadow-[var(--shadow-modal)]"
                role="dialog"
                aria-label="Display preferences"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-app-heading)]">
                      View settings
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-app-muted)]">
                      App-wide controls for this device.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  <SegmentedControl
                    label="App theme"
                    value={preferences.theme}
                    options={[
                      { value: 'system', label: 'System' },
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                    ]}
                    onChange={(theme) => setPreferences((current) => ({ ...current, theme }))}
                  />
                  <SegmentedControl
                    label="Density"
                    value={preferences.density}
                    options={[
                      { value: 'comfortable', label: 'Comfort' },
                      { value: 'compact', label: 'Compact' },
                    ]}
                    onChange={(density) => setPreferences((current) => ({ ...current, density }))}
                  />
                  <SegmentedControl
                    label="Motion"
                    value={preferences.motion}
                    options={[
                      { value: 'system', label: 'System' },
                      { value: 'reduced', label: 'Reduced' },
                    ]}
                    onChange={(motion) => setPreferences((current) => ({ ...current, motion }))}
                  />
                  <div className="flex min-h-14 items-center justify-between gap-4 border border-[var(--color-app-border)] px-3">
                    <span>
                      <span className="block text-sm font-semibold text-[var(--color-app-heading)]">Trust signals</span>
                      <span className="block text-xs leading-5 text-[var(--color-app-muted)]">
                        Evidence details on reports.
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreferences((current) => ({ ...current, trustAlerts: !current.trustAlerts }))}
                      aria-pressed={preferences.trustAlerts}
                      className={`relative h-7 w-12 shrink-0 border transition-colors ${
                        preferences.trustAlerts
                          ? 'border-[var(--color-app-action)] bg-[var(--color-app-action)]'
                          : 'border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]'
                      }`}
                      aria-label="Toggle trust signals"
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 bg-[var(--color-app-bg)] transition-transform ${
                          preferences.trustAlerts ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsAccountOpen((open) => !open);
                setIsSettingsOpen(false);
              }}
              className="flex h-9 max-w-[4.5rem] items-center border border-[var(--color-app-border)] px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-heading)] transition-colors hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] sm:max-w-[8.5rem]"
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
            >
              <span className="sm:hidden">{user ? 'Me' : 'Login'}</span>
              <span className="hidden truncate sm:inline">{user?.username ? `@${user.username}` : 'Account'}</span>
            </button>

            {isAccountOpen && (
              <div
                className="absolute right-0 top-12 z-50 w-56 border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-1 shadow-[var(--shadow-modal)]"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="flex min-h-10 w-full items-center px-3 text-left text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)] sm:hidden"
                  role="menuitem"
                >
                  View settings
                </button>
                <Link
                  to={profilePath}
                  onClick={() => setIsAccountOpen(false)}
                  className="flex min-h-10 items-center px-3 text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]"
                  role="menuitem"
                >
                  Account
                </Link>
                <Link
                  to="/app/subscribe"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex min-h-10 items-center px-3 text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]"
                  role="menuitem"
                >
                  Subscribe
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    logout();
                  }}
                  className="flex min-h-10 w-full items-center px-3 text-left text-sm font-semibold text-[var(--color-app-muted)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-action)]"
                  role="menuitem"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isRailOpen && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Communities">
          <div
            className="absolute inset-0 bg-[var(--color-app-heading)]/40 transition-opacity"
            onClick={() => setIsRailOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={railDrawerRef}
            className="app-drawer relative flex h-full w-[18rem] max-w-[85vw] flex-col border-r border-[var(--color-app-heading)] bg-[var(--color-app-bg)] shadow-[var(--shadow-modal)]"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-app-border)] px-4">
              <span className="edition-tag">Communities</span>
              <button
                type="button"
                onClick={() => setIsRailOpen(false)}
                className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)]"
                aria-label="Close communities"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <TopicRail channels={channels} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
