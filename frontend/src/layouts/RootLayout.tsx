import React from 'react';
import { Toaster } from 'sonner';
import { AppTopBar } from '../components/AppTopBar';
import { BottomNav } from '../components/BottomNav';
import { Outlet } from 'react-router-dom';

export const RootLayout: React.FC = () => {
  return (
    <div className="app-shell flex min-h-svh w-full flex-col bg-[var(--color-app-bg)] text-[var(--color-app-ink)] selection:bg-[var(--color-brand-red-faint)] selection:text-[var(--color-app-ink)]">
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
