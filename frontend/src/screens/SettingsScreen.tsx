import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePageMotion } from '../hooks/usePageMotion';
import { backendApi } from '../lib/api';
import { Alert } from '../components/ui/Alert';
import type { BackendSavedArticleDTO } from '../lib/api';
import { readReaderSettings, saveReaderSettings, type ReaderSettings } from '../lib/readerSettings';
import { readAppPreferences, saveAppPreferences, type AppPreferences } from '../lib/appPreferences';

export const SettingsScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const [savedArticles, setSavedArticles] = useState<BackendSavedArticleDTO[]>([]);
  const [loadError, setLoadError] = useState('');
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => readReaderSettings());
  const [preferences, setPreferences] = useState<AppPreferences>(() => readAppPreferences());

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const saved = await backendApi.getSavedArticles().catch(() => []);
        if (!isMounted) return;
        setSavedArticles(saved);
      } catch (error) {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Unable to load settings.');
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    saveReaderSettings(readerSettings);
  }, [readerSettings]);

  useEffect(() => {
    saveAppPreferences(preferences);
  }, [preferences]);

  const handleUnsave = async (articleId: number) => {
    setLoadError('');
    try {
      await backendApi.unsaveArticle(articleId);
      setSavedArticles(current => current.filter(saved => saved.article.id !== articleId));
      toast.success('Removed from saved articles.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to remove saved article.');
    }
  };

  return (
    <div ref={pageRef} className="hex-page">
      <header data-motion="page" className="hex-page-header">
        <p className="hex-kicker">Preferences</p>
        <h1 className="hex-title mt-2">Tune the working surface.</h1>
        <p className="hex-copy mt-3 max-w-2xl">
          Reader defaults, notification behavior, and saved article controls. Account identity now lives on your account page.
        </p>
      </header>

      {loadError && (
        <Alert tone="error" className="mb-5">
          {loadError}
        </Alert>
      )}

      <section data-motion="page" className="grid gap-8 lg:grid-cols-2">
        <div className="hex-card p-5">
          <h2 className="font-[var(--font-display)] text-xl font-bold text-[var(--color-app-heading)]">Reader Defaults</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">
            These settings apply when you open a story in reader mode.
          </p>
          <div className="mt-5 space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Text size</span>
              <select
                value={readerSettings.size}
                onChange={(event) => setReaderSettings(current => ({ ...current, size: event.target.value as ReaderSettings['size'] }))}
                className="hex-input min-h-10 w-full px-3 text-sm"
              >
                <option value="regular">Regular</option>
                <option value="large">Large</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Typeface</span>
              <select
                value={readerSettings.family}
                onChange={(event) => setReaderSettings(current => ({ ...current, family: event.target.value as ReaderSettings['family'] }))}
                className="hex-input min-h-10 w-full px-3 text-sm"
              >
                <option value="serif">Serif</option>
                <option value="sans">Sans</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Reader theme</span>
              <select
                value={readerSettings.theme}
                onChange={(event) => setReaderSettings(current => ({ ...current, theme: event.target.value as ReaderSettings['theme'] }))}
                className="hex-input min-h-10 w-full px-3 text-sm"
              >
                <option value="light">Light</option>
                <option value="paper">Paper</option>
                <option value="night">Night</option>
              </select>
            </label>
          </div>
        </div>

        <div className="hex-card p-5">
          <h2 className="font-[var(--font-display)] text-xl font-bold text-[var(--color-app-heading)]">App Behavior</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">
            Preferences are saved on this device and affect how the app presents your reading workflow.
          </p>
          <div className="mt-5 space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Density</span>
              <select
                value={preferences.density}
                onChange={(event) => setPreferences(current => ({ ...current, density: event.target.value as AppPreferences['density'] }))}
                className="hex-input min-h-10 w-full px-3 text-sm"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Motion</span>
              <select
                value={preferences.motion}
                onChange={(event) => setPreferences(current => ({ ...current, motion: event.target.value as AppPreferences['motion'] }))}
                className="hex-input min-h-10 w-full px-3 text-sm"
              >
                <option value="system">Use system preference</option>
                <option value="reduced">Reduce motion</option>
              </select>
            </label>
            <label className="flex min-h-10 items-center justify-between gap-4 border border-[var(--color-app-border)] px-3">
              <span className="text-sm font-semibold text-[var(--color-app-heading)]">Trust change alerts</span>
              <input
                type="checkbox"
                checked={preferences.trustAlerts}
                onChange={(event) => setPreferences(current => ({ ...current, trustAlerts: event.target.checked }))}
                className="h-4 w-4 accent-[var(--color-app-action)]"
              />
            </label>
          </div>
        </div>
      </section>

      <section data-motion="page" className="mt-8">
        <div className="mb-3 flex items-center justify-between border-b border-[var(--color-app-border-clean)] pb-3">
          <h2 className="text-sm font-semibold text-[var(--color-app-ink)]">
            Saved Articles
          </h2>
          <span className="text-sm text-[var(--color-app-muted)]">{savedArticles.length}</span>
        </div>
        <div className="hex-card overflow-hidden divide-y divide-[var(--color-app-border-clean)]">
          {savedArticles.length > 0 ? savedArticles.map(saved => (
            <div key={saved.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="text-lg font-semibold leading-snug text-[var(--color-app-ink)]">{saved.article.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-app-muted)]">
                  Saved {new Date(saved.savedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleUnsave(saved.article.id)}
                className="hex-button-secondary min-h-10 justify-self-start px-4 py-1.5 text-sm font-medium sm:justify-self-end"
              >
                Remove
              </button>
            </div>
          )) : (
            <div className="px-4 py-10 text-center text-sm text-[var(--color-app-muted)]">
              No saved articles yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsScreen;
