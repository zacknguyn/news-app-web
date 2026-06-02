import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import { Field, Input, TextArea } from '../components/ui/Input';

export const CreateChannelScreen: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const requirements = [
    ['Name, 3 to 100 characters', name.trim().length >= 3 && name.trim().length <= 100],
    ['Description, 20 to 500 characters', description.trim().length >= 20 && description.trim().length <= 500],
    ['Owner joins automatically', true],
  ] as const;
  const canSubmit = requirements.every(([, ready]) => ready);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError('Complete the requirements before creating a community.');
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
      navigate(`/app/c/${backendTopicToChannel(created).slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create community.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <main>
        <p className="mono-label mb-3 text-app-action">New community</p>
        <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Start a community</h1>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-app-muted">
          Create a focused place for reporting, discussion, and source-backed updates.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <p className="border border-state-error-border px-3 py-2 font-mono text-[11px] text-state-error">{error}</p>
          )}
          <Field id="channel-name" label="Channel name" hint="3 to 100 characters">
            <Input
              id="channel-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="Da Nang Watch"
            />
          </Field>
          <Field id="channel-description" label="Description" hint="20 to 500 characters">
            <TextArea
              id="channel-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              placeholder="What belongs here? Who is this community for?"
              className="min-h-32"
            />
          </Field>
          <Field id="channel-rules" label="Rules" optional hint="Up to 2,000 characters">
            <TextArea
              id="channel-rules"
              value={rules}
              onChange={(event) => setRules(event.target.value)}
              maxLength={2000}
              placeholder="Source expectations, civility, moderation boundaries..."
              className="min-h-40"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="channel-avatar" label="Avatar URL" optional>
              <Input
                id="channel-avatar"
                type="url"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field id="channel-banner" label="Banner URL" optional>
              <Input
                id="channel-banner"
                type="url"
                value={banner}
                onChange={(event) => setBanner(event.target.value)}
                placeholder="https://"
              />
            </Field>
          </div>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="h-12 bg-app-action px-5 font-mono text-[12px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:opacity-40"
          >
            {isSubmitting ? 'Creating' : 'Create community'}
          </button>
        </form>
      </main>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section className="border-t border-app-border pt-4">
          <h2 className="mono-label mb-4 text-app-muted">Requirements</h2>
          <div className="space-y-3">
            {requirements.map(([label, ready]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b border-app-border pb-3 font-mono text-[11px]"
              >
                <span className="text-app-muted">{label}</span>
                <span className={ready ? 'text-app-action' : 'text-app-faint'}>{ready ? 'Ready' : 'Missing'}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-app-border p-4">
          <h2 className="mono-label mb-4 text-app-muted">Preview</h2>
          <div className="flex gap-3">
            <img
              src={
                avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || 'Community')}`
              }
              alt=""
              className="h-12 w-12 border border-app-border object-cover"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-app-heading">{name || 'Community name'}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-app-muted">
                {description || 'Description preview appears here.'}
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
};
