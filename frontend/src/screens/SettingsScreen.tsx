import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePageMotion } from '../hooks/usePageMotion';
import { backendApi } from '../lib/api';
import { backendUserToUser } from '../lib/backendAdapters';
import { Alert } from '../components/ui/Alert';
import type { BackendSavedArticleDTO } from '../lib/api';
import type { User } from '../types';

const rows = [
  ['Density', 'Compact', 'Keep feed and comments optimized for fast scanning.'],
  ['Motion', 'Reduced-aware', 'Animations follow your system motion preference.'],
  ['Alerts', 'Trust changes', 'Notify only when a followed report changes verification state.'],
];

export const SettingsScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const [user, setUser] = useState<User | null>(null);
  const [savedArticles, setSavedArticles] = useState<BackendSavedArticleDTO[]>([]);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const [currentUser, saved] = await Promise.all([
          backendApi.getCurrentUser(),
          backendApi.getSavedArticles().catch(() => []),
        ]);
        if (!isMounted) return;
        const nextUser = backendUserToUser(currentUser);
        setUser(nextUser);
        setName(nextUser.name);
        setAvatar(nextUser.avatarUrl || '');
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

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadError('');
    setIsSaving(true);

    try {
      const updated = await backendApi.updateCurrentUser({
        name: name.trim(),
        avatar: avatar.trim() || undefined,
      });
      const nextUser = backendUserToUser(updated);
      setUser(nextUser);
      setName(nextUser.name);
      setAvatar(nextUser.avatarUrl || '');
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

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
      </header>

      {loadError && (
        <Alert tone="error" className="mb-5">
          {loadError}
        </Alert>
      )}

      <form data-motion="page" className="hex-card mb-8 p-6" onSubmit={handleSaveProfile}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-name" className="text-sm font-semibold text-[var(--color-app-ink)]">
              Display name
            </label>
            <input
              id="settings-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="hex-input w-full px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-avatar" className="text-sm font-semibold text-[var(--color-app-ink)]">
              Avatar URL
            </label>
            <input
              id="settings-avatar"
              value={avatar}
              onChange={(event) => setAvatar(event.target.value)}
              className="hex-input w-full px-4 py-3 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-[var(--color-app-muted)]">
            {user ? `${user.username} · backend account` : 'Loading backend account'}
          </div>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="hex-button-primary min-h-11 px-5 py-2 text-sm font-medium"
          >
            {isSaving ? 'Saving' : 'Save Profile'}
          </button>
        </div>
      </form>

      <div className="hex-card overflow-hidden divide-y divide-[var(--color-app-border-clean)]">
        {rows.map(([label, value, copy]) => (
          <div data-motion="list" key={label} className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[160px_1fr_140px] sm:items-center">
            <div className="text-sm font-semibold text-[var(--color-app-ink)]">{label}</div>
            <p className="text-sm leading-6 text-[var(--color-app-muted)]">{copy}</p>
            <button type="button" className="hex-button-secondary min-h-10 justify-self-start px-4 py-1.5 text-sm font-medium sm:justify-self-end">
              {value}
            </button>
          </div>
        ))}
      </div>

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
