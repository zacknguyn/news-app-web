import React from 'react';
import { Toaster } from 'sonner';
import { AppTopBar } from '../components/AppTopBar';
import { BottomNav } from '../components/BottomNav';
import { Outlet } from 'react-router-dom';

export const RootLayout: React.FC = () => {
  return (
    <div className="app-shell flex h-dvh w-full flex-col overflow-hidden bg-[var(--color-app-canvas)] text-[var(--color-app-ink)] selection:bg-[var(--color-accent-blue-soft)] selection:text-[var(--color-app-ink)]">
      <AppTopBar />

      <main className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-app-canvas)] pb-16 lg:pb-0">
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
