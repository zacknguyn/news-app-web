import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { AppTopBar } from '../components/AppTopBar';
import { BottomNav } from '../components/BottomNav';
import { Outlet } from 'react-router-dom';
import { readAppPreferences, subscribeAppPreferences } from '../lib/appPreferences';

export const RootLayout: React.FC = () => {
  const [preferences, setPreferences] = useState(() => readAppPreferences());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = preferences.theme === 'system' ? systemTheme : preferences.theme;

  return (
    <div
      className="app-shell flex min-h-svh w-full flex-col bg-[var(--color-app-bg)] text-[var(--color-app-ink)] selection:bg-[var(--color-brand-red-faint)] selection:text-[var(--color-app-ink)]"
      data-app-theme={resolvedTheme}
      data-app-density={preferences.density}
      data-app-motion={preferences.motion}
      data-trust-alerts={preferences.trustAlerts ? 'on' : 'off'}
    >
      <AppTopBar />

      <main className="flex-1 bg-[var(--color-app-bg)] pb-20 lg:pb-0">
        <Outlet />
      </main>

      <div className="app-bottom-nav">
        <BottomNav />
      </div>
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            borderRadius: '8px',
            borderColor: 'var(--color-app-border)',
            background: 'var(--color-app-surface)',
            color: 'var(--color-app-ink)',
            boxShadow: 'var(--shadow-hex-card-hover)',
          },
        }}
      />
    </div>
  );
};
