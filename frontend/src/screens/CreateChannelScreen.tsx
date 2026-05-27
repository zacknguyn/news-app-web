import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Send } from 'lucide-react';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import { usePageMotion } from '../hooks/usePageMotion';

export const CreateChannelScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = name.trim().length >= 3 && description.trim().length >= 20;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError('Add a channel name and a clear description first.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const created = await backendApi.createTopic({
        name: name.trim(),
        description: description.trim(),
        rules: rules.trim() || undefined,
        avatar: avatar.trim() || undefined,
        banner: banner.trim() || undefined,
      });
      const channel = backendTopicToChannel(created);
      navigate(`/app/c/${channel.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create channel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={pageRef} className="app-page-narrow">
      <button
        type="button"
        data-motion="page"
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div data-motion="page" className="mb-8 border-b border-[var(--color-app-border)] pb-5">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[8px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] text-[var(--color-app-action)]">
          <Hash className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-serif font-medium text-[var(--color-app-ink)]">
          Create channel
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-app-muted)]">
          Start a focused community for reporting, discussion, and source-backed updates.
        </p>
      </div>

      <form data-motion="page" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" onSubmit={handleSubmit}>
        <div className="space-y-5">
          {error && (
            <div className="rounded-[6px] border border-[var(--color-state-error-border)] bg-[var(--color-state-error-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-state-error)]">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[var(--color-app-ink)]">Channel name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="Investigations, Da Nang Watch, Open Source Intel..."
              className="hex-input min-h-12 w-full px-4 text-base"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[var(--color-app-ink)]">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              placeholder="What belongs here? Who is this channel for?"
              className="hex-input min-h-32 w-full resize-y px-4 py-3 text-base leading-7"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[var(--color-app-ink)]">Rules</span>
            <textarea
              value={rules}
              onChange={(event) => setRules(event.target.value)}
              maxLength={2000}
              placeholder="Source expectations, civility, moderation boundaries..."
              className="hex-input min-h-36 w-full resize-y px-4 py-3 text-base leading-7"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[var(--color-app-ink)]">Avatar URL</span>
              <input
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="Optional"
                className="hex-input min-h-11 w-full px-4 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[var(--color-app-ink)]">Banner URL</span>
              <input
                value={banner}
                onChange={(event) => setBanner(event.target.value)}
                placeholder="Optional"
                className="hex-input min-h-11 w-full px-4 text-sm"
              />
            </label>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-[8px] border border-[var(--color-app-border-clean)] bg-[var(--color-app-surface)] p-4">
            <h2 className="text-sm font-bold text-[var(--color-app-ink)]">Requirements</h2>
            <div className="mt-3 space-y-2 text-sm font-semibold text-[var(--color-app-muted)]">
              <p className={name.trim().length >= 3 ? 'text-[var(--color-app-ink)]' : ''}>Name, 3+ characters</p>
              <p className={description.trim().length >= 20 ? 'text-[var(--color-app-ink)]' : ''}>Description, 20+ characters</p>
              <p>Owner joins automatically</p>
            </div>
          </section>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="hex-button-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-5 text-sm font-semibold disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Create channel'}
          </button>
        </aside>
      </form>
    </div>
  );
};
