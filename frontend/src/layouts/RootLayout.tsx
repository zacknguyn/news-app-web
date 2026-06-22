import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { AppTopBar } from '../components/AppTopBar';
import { BottomNav } from '../components/BottomNav';
import { Outlet, useLocation } from 'react-router-dom';
import { readAppPreferences, subscribeAppPreferences } from '../lib/appPreferences';
import { useChannels } from '../lib/useChannels';
import { TopicRail } from '../components/TopicRail';

export const RootLayout: React.FC = () => {
  const [preferences, setPreferences] = useState(() => readAppPreferences());
  const [isRailCollapsed, setIsRailCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('tourane-left-rail') === 'collapsed';
  });
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  useEffect(() => {
    window.localStorage.setItem('tourane-left-rail', isRailCollapsed ? 'collapsed' : 'expanded');
  }, [isRailCollapsed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = preferences.theme === 'system' ? systemTheme : preferences.theme;
  const { channels } = useChannels();
  const location = useLocation();
  const isFeedPage = location.pathname === '/app' || location.pathname.startsWith('/app/c/') || location.pathname.startsWith('/app/p/');

  return (
    <div
      className="app-shell flex min-h-svh w-full flex-col bg-[var(--color-app-bg)] text-[var(--color-app-ink)] selection:bg-[var(--color-brand-red-faint)] selection:text-[var(--color-app-ink)]"
      data-app-theme={resolvedTheme}
      data-app-density={preferences.density}
      data-app-motion={preferences.motion}
      data-trust-alerts={preferences.trustAlerts ? 'on' : 'off'}
    >
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <AppTopBar />

      <div className="flex w-full flex-1 bg-[var(--color-app-bg)] pb-20 lg:pb-0">
        {!isFeedPage && (
          <div
            className={`sticky top-[64px] hidden h-[calc(100dvh-64px)] shrink-0 border-r border-app-border transition-[width] duration-150 xl:block ${isRailCollapsed ? 'w-16' : 'w-64'}`}
          >
            <TopicRail
              channels={channels}
              collapsed={isRailCollapsed}
              onToggleCollapsed={() => setIsRailCollapsed((current) => !current)}
            />
          </div>
        )}
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <div className="app-bottom-nav">
        <BottomNav />
      </div>
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            borderRadius: '0',
            borderColor: 'var(--color-app-border)',
            background: 'var(--color-app-surface)',
            color: 'var(--color-app-ink)',
            boxShadow: 'var(--shadow-modal)',
          },
        }}
      />
    </div>
  );
};
