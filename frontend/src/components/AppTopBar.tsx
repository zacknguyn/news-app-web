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
import { backendPostToPost } from '../lib/backendAdapters';
import { stripHtml } from '../lib/richContent';
import type { Post } from '../types';
import { Languages, Monitor, Moon, Sun } from 'lucide-react';
import { localizeLabel } from '../lib/localizeLabel';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-16 shrink-0 items-center border-b-2 px-1 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
    isActive
      ? 'border-[var(--color-app-action)] text-[var(--color-app-heading)]'
      : 'border-transparent text-[var(--color-app-faint)] hover:border-[var(--color-app-border)] hover:text-[var(--color-app-heading)]'
  }`;

export const AppTopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';
  const isPartner = user?.role === 'PARTNER' || isAdmin;
  const profilePath = user ? getProfilePath(user) : '/login';
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const systemMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const railDrawerRef = useRef<HTMLDivElement>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [preferences, setPreferences] = useState<AppPreferences>(() => readAppPreferences());
  const [unreadCount, setUnreadCount] = useState(0);
  const { channels } = useChannels();
  const isVi = preferences.language === 'vi';
  const copy = {
    topics: isVi ? 'Chủ đề' : 'Topics',
    home: isVi ? 'Trang chủ' : 'Home',
    communities: isVi ? 'Cộng đồng' : 'Communities',
    notebook: isVi ? 'Sổ tay' : 'Notebook',
    subscribe: isVi ? 'Gói thành viên' : 'Subscribe',
    ads: isVi ? 'Quảng cáo' : 'Ads',
    admin: 'Admin',
    searchReports: isVi ? 'Tìm bài viết' : 'Search reports',
    search: isVi ? 'Tìm kiếm' : 'Search',
    typeTwo: isVi ? 'Nhập ít nhất hai ký tự.' : 'Type at least two characters.',
    searching: isVi ? 'Đang tìm...' : 'Searching...',
    noPosts: isVi ? 'Không tìm thấy bài viết. Thử từ khoá khác hoặc về trang chủ.' : 'No posts found. Try a different search term or browse the home page.',
    open: isVi ? 'Mở' : 'Open',
    file: isVi ? 'Đăng bài' : 'File',
    me: isVi ? 'Tôi' : 'Me',
    login: isVi ? 'Đăng nhập' : 'Login',
    account: isVi ? 'Tài khoản' : 'Account',
    inbox: isVi ? 'Hộp thư' : 'Inbox',
    settings: isVi ? 'Cài đặt' : 'Settings',
    system: isVi ? 'Hệ thống' : 'System',
    appearance: isVi ? 'Giao diện' : 'Appearance',
    language: isVi ? 'Ngôn ngữ' : 'Language',
    reading: isVi ? 'Đọc bài' : 'Reading',
    light: isVi ? 'Sáng' : 'Light',
    dark: isVi ? 'Tối' : 'Dark',
    auto: isVi ? 'Hệ thống' : 'System',
    english: 'English',
    vietnamese: 'Tiếng Việt',
    fontSize: isVi ? 'Cỡ chữ' : 'Font size',
    feedWidth: isVi ? 'Độ rộng feed' : 'Feed width',
    standard: isVi ? 'Chuẩn' : 'Standard',
    wide: isVi ? 'Rộng' : 'Wide',
    logout: isVi ? 'Đăng xuất' : 'Log out',
  };
  const navItems = [
    { to: '/app', label: copy.home, end: true },
    { to: '/app/topics', label: copy.communities },
    { to: '/app/highlights', label: copy.notebook },
    { to: '/app/subscribe', label: copy.subscribe },
  ];

  useEffect(() => {
    setIsRailOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    saveAppPreferences(preferences);
  }, [preferences]);

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    let mounted = true;
    const fetchCount = () =>
      backendApi.getUnreadNotificationCount()
        .then(res => { if (mounted) setUnreadCount(res.count); })
        .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [user]);

  useEffect(() => {
    if (!isAccountOpen && !isSystemOpen && !isSearchOpen && !isRailOpen) return;

    const closeMenus = (event: KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') {
          setIsAccountOpen(false);
          setIsSearchOpen(false);
          setIsRailOpen(false);
        }
        return;
      }

      const target = event.target as Node;
      if (
        accountMenuRef.current?.contains(target) ||
        systemMenuRef.current?.contains(target) ||
        searchRef.current?.contains(target)
      )
        return;
      if (railDrawerRef.current?.contains(target)) return;
      setIsAccountOpen(false);
      setIsSystemOpen(false);
      setIsSearchOpen(false);
      setIsRailOpen(false);
    };

    document.addEventListener('keydown', closeMenus);
    document.addEventListener('mousedown', closeMenus);

    return () => {
      document.removeEventListener('keydown', closeMenus);
      document.removeEventListener('mousedown', closeMenus);
    };
  }, [isAccountOpen, isSystemOpen, isSearchOpen, isRailOpen]);

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
        const results = await backendApi.searchPosts(keyword, 0, 6);
        if (!isCancelled) {
          setSearchResults(results.content.map(backendPostToPost));
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

  const updatePreferences = (next: AppPreferences) => {
    setPreferences(next);
    saveAppPreferences(next);
  };

  const setTheme = (theme: AppPreferences['theme']) => {
    updatePreferences({ ...preferences, theme });
  };

  const setLanguage = (language: AppPreferences['language']) => {
    updatePreferences({ ...preferences, language });
  };

  const setReaderFontSize = (readerFontSize: number) => {
    updatePreferences({ ...preferences, readerFontSize });
  };

  const setLayoutWidth = (layoutWidth: AppPreferences['layoutWidth']) => {
    updatePreferences({ ...preferences, layoutWidth });
  };

  const segmentClass = (active: boolean) =>
    `inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
      active
        ? 'bg-[var(--color-app-action)] text-[var(--color-app-on-action)]'
        : 'text-[var(--color-app-muted)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-heading)]'
    }`;

  return (
    <header className="app-topbar sticky top-0 z-40 border-b border-[var(--color-app-border)] bg-[var(--color-app-bg)]">
      <div className="grid h-16 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 sm:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:gap-6">
          <button
            type="button"
            onClick={() => setIsRailOpen(true)}
            className="inline-flex h-9 shrink-0 items-center border border-[var(--color-app-border)] px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-muted)] transition-colors hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] xl:hidden"
            aria-label={copy.communities}
            aria-expanded={isRailOpen}
          >
            {copy.topics}
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
                {copy.ads}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                {copy.admin}
              </NavLink>
            )}
          </nav>
        </div>

        <div ref={searchRef} className="relative justify-self-end">
          <form onSubmit={handleSearchSubmit} className="hidden md:block" role="search">
            <label htmlFor="topbar-search" className="sr-only">
              {copy.searchReports}
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
              placeholder={copy.searchReports}
              containerClassName="w-[15rem] bg-[var(--color-app-surface-alt)] lg:w-[17rem] xl:w-[20rem]"
            />
          </form>

          <button
            type="button"
            onClick={() => setIsSearchOpen((open) => !open)}
            className="inline-flex h-9 items-center border border-[var(--color-app-border)] px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-muted)] transition-colors hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] md:hidden"
            aria-label={copy.searchReports}
            aria-expanded={isSearchOpen}
          >
            {copy.search}
          </button>

          {isSearchOpen && (
            <div className="absolute right-0 top-12 z-50 w-[min(92vw,34rem)] border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-2 shadow-[var(--shadow-modal)]">
              <form onSubmit={handleSearchSubmit} className="mb-2 md:hidden" role="search">
                <label htmlFor="mobile-topbar-search" className="sr-only">
                  {copy.searchReports}
                </label>
                <SearchInput
                  id="mobile-topbar-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onClear={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  placeholder={copy.searchReports}
                  autoFocus
                />
              </form>

              <div className="max-h-[60vh] overflow-y-auto">
                {searchQuery.trim().length < 2 ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">
                    {copy.typeTwo}
                  </div>
                ) : isSearching ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">{copy.searching}</div>
                ) : searchError ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-action)]">{searchError}</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-4 text-sm font-semibold text-[var(--color-app-muted)]">{copy.noPosts}</div>
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
                            {localizeLabel(post.channelName, preferences.language)}
                          </span>
                          <span className="mt-1 block truncate font-[var(--font-display)] text-base font-bold text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">
                            {post.title}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--color-app-muted)]">
                            {stripHtml(post.content)}
                          </span>
                        </span>
                        <span className="pt-5 text-[10px] font-bold text-[var(--color-app-action)]">{copy.open}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <div ref={systemMenuRef} className="relative order-2">
            <button
              type="button"
              onClick={() => {
                setIsSystemOpen((open) => !open);
                setIsAccountOpen(false);
              }}
              className="hidden h-9 items-center border border-[var(--color-app-border)] px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-heading)] transition-colors hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] sm:inline-flex"
              aria-haspopup="menu"
              aria-expanded={isSystemOpen}
            >
              {copy.system}
            </button>

            {isSystemOpen && (
              <div
                className="absolute right-0 top-12 z-50 w-[20rem] border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-4 shadow-[var(--shadow-modal)]"
                role="menu"
              >
                <div className="space-y-5">
                  <section>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-faint)]">
                      <Monitor className="h-3.5 w-3.5" />
                      {copy.appearance}
                    </div>
                    <div className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-1">
                      <button type="button" onClick={() => setTheme('system')} className={segmentClass(preferences.theme === 'system')}>
                        <Monitor className="h-3.5 w-3.5" /> {copy.auto}
                      </button>
                      <button type="button" onClick={() => setTheme('light')} className={segmentClass(preferences.theme === 'light')}>
                        <Sun className="h-3.5 w-3.5" /> {copy.light}
                      </button>
                      <button type="button" onClick={() => setTheme('dark')} className={segmentClass(preferences.theme === 'dark')}>
                        <Moon className="h-3.5 w-3.5" /> {copy.dark}
                      </button>
                    </div>
                  </section>

                  <section>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-faint)]">
                      <Languages className="h-3.5 w-3.5" />
                      {copy.language}
                    </div>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-1">
                      <button type="button" onClick={() => setLanguage('en')} className={segmentClass(preferences.language === 'en')}>
                        {copy.english}
                      </button>
                      <button type="button" onClick={() => setLanguage('vi')} className={segmentClass(preferences.language === 'vi')}>
                        {copy.vietnamese}
                      </button>
                    </div>
                  </section>

                  <section className="border-t border-[var(--color-app-border)] pt-4">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-faint)]">{copy.fontSize}</span>
                      <span className="font-mono text-xs font-bold text-[var(--color-app-heading)]">{preferences.readerFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={preferences.readerFontSize}
                      onChange={(event) => setReaderFontSize(Number(event.target.value))}
                      className="h-1 w-full cursor-pointer accent-[var(--color-app-action)]"
                      aria-label={copy.fontSize}
                    />
                  </section>

                  <section>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-app-faint)]">{copy.feedWidth}</div>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-1">
                      <button type="button" onClick={() => setLayoutWidth('standard')} className={segmentClass(preferences.layoutWidth === 'standard')}>
                        {copy.standard}
                      </button>
                      <button type="button" onClick={() => setLayoutWidth('wide')} className={segmentClass(preferences.layoutWidth === 'wide')}>
                        {copy.wide}
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/app/submit"
            className="order-1 hidden h-9 items-center bg-[var(--color-app-heading)] px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-bg)] transition-colors hover:bg-[var(--color-app-action)] sm:inline-flex"
          >
            {copy.file}
          </Link>
          
          <div ref={accountMenuRef} className="relative order-3">
            <button
              type="button"
              onClick={() => {
                setIsAccountOpen((open) => !open);
              }}
              className="flex h-9 max-w-[4.5rem] items-center border border-[var(--color-app-border)] px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-app-heading)] transition-colors hover:border-[var(--color-app-action)] hover:text-[var(--color-app-action)] sm:max-w-[8.5rem]"
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
            >
              <span className="sm:hidden">{user ? copy.me : copy.login}</span>
              <span className="hidden truncate sm:inline">{user?.username ? `@${user.username}` : copy.account}</span>
            </button>

            {isAccountOpen && (
              <div
                className="absolute right-0 top-12 z-50 w-56 border border-[var(--color-app-border)] bg-[var(--color-app-bg)] p-1 shadow-[var(--shadow-modal)]"
                role="menu"
              >
                <Link
                  to={profilePath}
                  onClick={() => setIsAccountOpen(false)}
                  className="flex min-h-10 items-center px-3 text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]"
                  role="menuitem"
                >
                  {copy.account}
                </Link>
                <Link
                  to="/app/subscribe"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex min-h-10 items-center px-3 text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]"
                  role="menuitem"
                >
                  {copy.subscribe}
                </Link>
                <Link
                  to="/app/notifications"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]"
                  role="menuitem"
                >
                  {copy.inbox}
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[var(--color-app-action)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-app-on-action)]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/app/settings"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex min-h-10 items-center px-3 text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]"
                  role="menuitem"
                >
                  {copy.settings}
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
                  {copy.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isRailOpen && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label={copy.communities}>
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
              <span className="edition-tag">{copy.communities}</span>
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
