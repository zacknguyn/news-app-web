import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  readAppPreferences,
  saveAppPreferences,
  subscribeAppPreferences,
  type AppPreferences,
} from '../lib/appPreferences';

const frequencies: Array<{ value: AppPreferences['newsletter']; title: string; copy: string }> = [
  { value: 'daily', title: 'Daily briefing', copy: 'Delivered at 7 a.m. local time.' },
  { value: 'weekly', title: 'Weekly briefing', copy: 'A slower digest for weekend reading.' },
  { value: 'none', title: 'No digest', copy: 'Keep updates inside the app only.' },
];

const themes: Array<{ value: AppPreferences['theme']; title: string; copy: string }> = [
  { value: 'light', title: 'Light', copy: 'Paper white reading surface.' },
  { value: 'dark', title: 'Dark', copy: 'Ink black surface for low light.' },
  { value: 'system', title: 'System', copy: 'Follow this device preference.' },
];

export const SubscribeScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<AppPreferences>(() => readAppPreferences());

  useEffect(() => saveAppPreferences(preferences), [preferences]);
  useEffect(() => subscribeAppPreferences(setPreferences), []);

  const updatePreferences = (next: Partial<AppPreferences>) => {
    setPreferences((current) => ({ ...current, ...next }));
    toast.success('Preference saved.');
  };

  return (
    <div className="app-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <main>
        <p className="mono-label mb-3 text-app-action">Newsletter</p>
        <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Reading preferences</h1>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-app-muted">
          Tune digest cadence and reader defaults for this device.
        </p>

        <section className="mt-8">
          <h2 className="mono-label mb-3 text-app-muted">Frequency</h2>
          <div className="border-y border-app-border">
            {frequencies.map((option) => (
              <PreferenceRow
                key={option.value}
                checked={preferences.newsletter === option.value}
                title={option.title}
                copy={option.copy}
                onClick={() => updatePreferences({ newsletter: option.value })}
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mono-label mb-3 text-app-muted">Theme</h2>
          <div className="border-y border-app-border">
            {themes.map((option) => (
              <PreferenceRow
                key={option.value}
                checked={preferences.theme === option.value}
                title={option.title}
                copy={option.copy}
                onClick={() => updatePreferences({ theme: option.value })}
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mono-label mb-3 text-app-muted">Feed behavior</h2>
          <div className="border-y border-app-border">
            <ToggleRow
              title="Show verified first"
              copy="Surface verified reports ahead of unresolved posts."
              checked={preferences.trustAlerts}
              onClick={() => updatePreferences({ trustAlerts: !preferences.trustAlerts })}
            />
            <ToggleRow
              title="Compact post rows"
              copy="Reduce feed spacing for denser scanning."
              checked={preferences.density === 'compact'}
              onClick={() =>
                updatePreferences({ density: preferences.density === 'compact' ? 'comfortable' : 'compact' })
              }
            />
            <ToggleRow
              title="Reduced motion"
              copy="Use instant state changes with minimal animation."
              checked={preferences.motion === 'reduced'}
              onClick={() => updatePreferences({ motion: preferences.motion === 'reduced' ? 'system' : 'reduced' })}
            />
          </div>
        </section>
      </main>

      <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Account</h2>
          <p className="text-sm leading-6 text-app-muted">
            Preferences sync through local app settings today. Backend account sync can attach to the same controls
            later.
          </p>
        </section>
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Back</h2>
          <a href="/app" className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline">
            Back to home
          </a>
        </section>
      </aside>
    </div>
  );
};

const PreferenceRow: React.FC<{ checked: boolean; title: string; copy: string; onClick: () => void }> = ({
  checked,
  title,
  copy,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="grid w-full grid-cols-[24px_minmax(0,1fr)] gap-3 border-b border-app-border py-4 text-left last:border-b-0"
  >
    <span
      className={`mt-1 h-[18px] w-[18px] border ${checked ? 'border-app-action bg-app-action' : 'border-app-border'}`}
      aria-hidden="true"
    />
    <span>
      <span className="block text-sm font-semibold text-app-heading">{title}</span>
      <span className="mt-1 block font-mono text-[11px] text-app-muted">{copy}</span>
    </span>
  </button>
);

const ToggleRow = PreferenceRow;

export default SubscribeScreen;
