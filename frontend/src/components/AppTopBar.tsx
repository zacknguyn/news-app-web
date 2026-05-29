import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, CreditCard, LogOut, Search, Settings, Share2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Tooltip } from './ui/Tooltip';
import { BrandMark } from './BrandMark';
import { readAppPreferences, saveAppPreferences, subscribeAppPreferences, type AppPreferences } from '../lib/appPreferences';
import { backendApi } from '../lib/api';
import { backendArticleToPost } from '../lib/backendAdapters';
import { stripHtml } from '../lib/richContent';
import type { Post } from '../types';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-11 shrink-0 items-center border-b-2 px-1 text-[12px] font-bold uppercase tracking-widest transition-colors ${
    isActive
      ? 'border-[var(--color-app-action)] text-[var(--color-app-heading)]'
      : 'border-transparent text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]'
  }`;

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
    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">{label}</div>
    <div className="grid border border-[var(--color-app-border)]" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`min-h-10 px-3 text-sm font-bold transition-colors ${
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
  const isAdmin = user?.role === 'ADMIN';
  const profilePath = user ? `/app/u/${user.username}` : '/login';
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [preferences, setPreferences] = useState<AppPreferences>(() => readAppPreferences());

  useEffect(() => {
    saveAppPreferences(preferences);
  }, [preferences]);

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  useEffect(() => {
    if (!isSettingsOpen && !isAccountOpen && !isSearchOpen) return;

    const closeMenus = (event: KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') {
          setIsSettingsOpen(false);
          setIsAccountOpen(false);
          setIsSearchOpen(false);
        }
        return;
      }

      const target = event.target as Node;
      if (settingsMenuRef.current?.contains(target) || accountMenuRef.current?.contains(target) || searchRef.current?.contains(target)) return;
      setIsSettingsOpen(false);
      setIsAccountOpen(false);
      setIsSearchOpen(false);
    };

    document.addEventListener('keydown', closeMenus);
    document.addEventListener('mousedown', closeMenus);

    return () => {
      document.removeEventListener('keydown', closeMenus);
      document.removeEventListener('mousedown', closeMenus);
    };
  }, [isSettingsOpen, isAccountOpen, isSearchOpen]);

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

  const shareApp = async () => {
    const shareData = {
      title: 'Tourane News',
      text: 'Independent reports and reader discussion.',
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
  };

  return (
    <header className="app-topbar sticky top-0 z-40 border-b border-[var(--color-app-border)] bg-[var(--color-app-bg)]">
      <div className="mx-auto flex min-h-16 w-full max-w-[1320px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/app" className="shrink-0">
          <BrandMark size="sm" />
        </Link>

        <div ref={searchRef} className="relative ml-auto min-w-0 md:max-w-lg md:flex-1">
          <form
            onSubmit={handleSearchSubmit}
            className="hidden h-10 min-w-0 items-center gap-2 border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 text-sm text-[var(--color-app-heading)] transition-colors focus-within:border-[var(--color-app-action)] focus-within:shadow-[var(--shadow-hex-focus)] md:flex"
            role="search"
          >
            <Search className="h-4 w-4 shrink-0 text-[var(--color-app-muted)]" />
            <label htmlFor="topbar-search" className="sr-only">Search reports</label>
            <input
              id="topbar-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setIsSearchOpen(true);
              }}
              placeholder="Search reports"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--color-app-muted)]"
              autoComplete="off"
            />
          </form>

          <button
            type="button"
            onClick={() => setIsSearchOpen(open => !open)}
            className="flex h-10 w-10 items-center justify-center text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)] md:hidden"
            aria-label="Search reports"
            aria-expanded={isSearchOpen}
          >
            <Search className="h-4 w-4" />
          </button>

          {isSearchOpen && (
            <div className="absolute right-0 top-12 z-50 w-[min(92vw,34rem)] border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-2 shadow-[var(--shadow-raised)]">
              <form onSubmit={handleSearchSubmit} className="mb-2 flex h-10 items-center gap-2 border border-[var(--color-app-border)] px-3 md:hidden" role="search">
                <Search className="h-4 w-4 shrink-0 text-[var(--color-app-muted)]" />
                <label htmlFor="mobile-topbar-search" className="sr-only">Search reports</label>
                <input
                  id="mobile-topbar-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search reports"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--color-app-muted)]"
                  autoComplete="off"
                  autoFocus
                />
              </form>

              <div className="max-h-[60vh] overflow-y-auto">
                {searchQuery.trim().length < 2 ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">Type at least two characters.</div>
                ) : isSearching ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">Searching...</div>
                ) : searchError ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-action)]">{searchError}</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">No reports found.</div>
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
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">{post.channelName}</span>
                          <span className="mt-1 block truncate font-[var(--font-display)] text-base font-bold text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">{post.title}</span>
                          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--color-app-muted)]">{stripHtml(post.content)}</span>
                        </span>
                        <span className="pt-5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-action)]">Open</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Tooltip label="Share">
            <button
              type="button"
              onClick={shareApp}
              className="flex h-10 w-10 items-center justify-center text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)]"
              aria-label="Share Tourane News"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </Tooltip>

          <Link
            to="/app/submit"
            className="hidden h-10 items-center bg-[var(--color-app-heading)] px-3 text-sm font-bold text-[var(--color-app-bg)] transition-colors hover:bg-[var(--color-app-action)] sm:inline-flex"
          >
            Report
          </Link>
          <div ref={settingsMenuRef} className="relative">
            <Tooltip label="Preferences">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(open => !open);
                  setIsAccountOpen(false);
                }}
                className="flex h-10 w-10 items-center justify-center text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)]"
                aria-haspopup="dialog"
                aria-expanded={isSettingsOpen}
                aria-label="Open display preferences"
              >
                <Settings className="h-4 w-4" />
              </button>
            </Tooltip>

            {isSettingsOpen && (
              <div className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-4 shadow-[var(--shadow-raised)]" role="dialog" aria-label="Display preferences">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--color-app-heading)]">Preferences</h2>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-app-muted)]">App-wide controls for this device.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]"
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
                    onChange={(theme) => setPreferences(current => ({ ...current, theme }))}
                  />
                  <SegmentedControl
                    label="Density"
                    value={preferences.density}
                    options={[
                      { value: 'comfortable', label: 'Comfort' },
                      { value: 'compact', label: 'Compact' },
                    ]}
                    onChange={(density) => setPreferences(current => ({ ...current, density }))}
                  />
                  <SegmentedControl
                    label="Motion"
                    value={preferences.motion}
                    options={[
                      { value: 'system', label: 'System' },
                      { value: 'reduced', label: 'Reduced' },
                    ]}
                    onChange={(motion) => setPreferences(current => ({ ...current, motion }))}
                  />
                  <div className="flex min-h-14 items-center justify-between gap-4 border border-[var(--color-app-border)] px-3">
                    <span>
                      <span className="block text-sm font-semibold text-[var(--color-app-heading)]">Show trust signals</span>
                      <span className="block text-xs leading-5 text-[var(--color-app-muted)]">Evidence details on reports.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreferences(current => ({ ...current, trustAlerts: !current.trustAlerts }))}
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
                setIsAccountOpen(open => !open);
                setIsSettingsOpen(false);
              }}
              className="flex h-10 items-center gap-2 border border-[var(--color-app-border)] px-2 text-sm font-bold text-[var(--color-app-heading)] transition-colors hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)]"
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
            >
              <User className="h-4 w-4" />
              <span className="hidden max-w-24 truncate sm:inline">{user?.username || 'Account'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-1 shadow-[var(--shadow-raised)]" role="menu">
                <Link
                  to={profilePath}
                  onClick={() => setIsAccountOpen(false)}
                  className="flex min-h-10 items-center gap-3 px-3 text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]"
                  role="menuitem"
                >
                  <User className="h-4 w-4" />
                  Account
                </Link>
                <Link
                  to="/app/subscribe"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex min-h-10 items-center gap-3 px-3 text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]"
                  role="menuitem"
                >
                  <CreditCard className="h-4 w-4" />
                  Subscribe
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    logout();
                  }}
                  className="flex min-h-10 w-full items-center gap-3 px-3 text-left text-sm font-semibold text-[var(--color-app-muted)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-action)]"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="mx-auto flex h-11 w-full max-w-[1320px] items-center gap-5 overflow-x-auto border-t border-[var(--color-app-border)] px-4 sm:px-6 lg:px-10">
        <NavLink to="/app" end className={navLinkClass}>Home</NavLink>
        <NavLink to="/app/topics" className={navLinkClass}>Topics</NavLink>
        <NavLink to="/app/highlights" className={navLinkClass}>Notebook</NavLink>
        <NavLink to="/app/trust" className={navLinkClass}>Trust</NavLink>
        <NavLink to="/app/subscribe" className={navLinkClass}>Subscribe</NavLink>
        {isAdmin && <NavLink to="/app/admin" className={navLinkClass}>Admin</NavLink>}
      </nav>
    </header>
  );
};
