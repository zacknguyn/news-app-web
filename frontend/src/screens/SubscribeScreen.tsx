import React, { useEffect, useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { usePageMotion } from '../hooks/usePageMotion';
import { readAppPreferences, saveAppPreferences, subscribeAppPreferences, type AppPreferences } from '../lib/appPreferences';

const plans: Array<{
  id: AppPreferences['subscriptionPlan'];
  name: string;
  price: string;
  copy: string;
  features: string[];
}> = [
  {
    id: 'reader',
    name: 'Reader',
    price: 'Free',
    copy: 'Follow reporting, save highlights, and join discussion.',
    features: ['Front page access', 'Reader highlights', 'Discussion voting'],
  },
  {
    id: 'supporter',
    name: 'Supporter',
    price: '$5/mo',
    copy: 'Back independent reporting and receive a tighter reading digest.',
    features: ['Weekly briefing', 'Supporter badge', 'Priority newsletter'],
  },
  {
    id: 'newsroom',
    name: 'Newsroom',
    price: '$15/mo',
    copy: 'For teams that review, archive, and share reports together.',
    features: ['Team digest', 'Shared archive', 'Editorial workflow'],
  },
];

export const SubscribeScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const [preferences, setPreferences] = useState<AppPreferences>(() => readAppPreferences());

  useEffect(() => {
    saveAppPreferences(preferences);
  }, [preferences]);

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  const selectPlan = (subscriptionPlan: AppPreferences['subscriptionPlan']) => {
    setPreferences(current => ({ ...current, subscriptionPlan }));
    toast.success('Subscription preference saved.');
  };

  return (
    <div ref={pageRef} className="app-page">
      <header data-motion="page" className="grid gap-6 border-b-4 border-[var(--color-app-heading)] pb-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div>
          <p className="hex-kicker">Subscribe</p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl font-bold leading-none text-[var(--color-app-heading)] sm:text-5xl">
            Fund the reporting, tune the digest.
          </h1>
        </div>
        <div className="border border-[var(--color-app-border)] p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Current plan</div>
          <div className="mt-2 font-[var(--font-display)] text-2xl font-bold text-[var(--color-app-heading)]">
            {plans.find(plan => plan.id === preferences.subscriptionPlan)?.name || 'Reader'}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">
            Frontend preferences are active. Billing can connect when the API exists.
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.15fr_1fr]">
        {plans.map(plan => {
          const selected = preferences.subscriptionPlan === plan.id;
          return (
            <article
              data-motion="list"
              key={plan.id}
              className={`border p-5 ${selected ? 'border-[var(--color-app-action)] bg-[var(--color-news-red-wash)] shadow-[var(--shadow-focus)] lg:-mt-4 lg:pb-9 lg:pt-7' : 'border-[var(--color-app-border)]'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-app-heading)]">{plan.name}</h2>
                  <p className="mt-1 text-sm font-bold text-[var(--color-app-action)]">{plan.price}</p>
                </div>
                {selected && <Check className="h-5 w-5 text-[var(--color-app-action)]" />}
              </div>
              <p className="mt-4 min-h-16 text-sm leading-6 text-[var(--color-app-muted)]">{plan.copy}</p>
              <ul className="mt-5 space-y-2 border-t border-[var(--color-app-border)] pt-4">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[var(--color-app-heading)]">
                    <Check className="h-4 w-4 text-[var(--color-app-action)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => selectPlan(plan.id)}
                className={`mt-6 inline-flex min-h-10 w-full items-center justify-center px-4 text-sm font-bold ${
                  selected
                    ? 'border border-[var(--color-app-action)] text-[var(--color-app-action)]'
                    : 'bg-[var(--color-app-heading)] text-[var(--color-app-bg)] hover:bg-[var(--color-app-action)]'
                }`}
              >
                {selected ? 'Selected' : 'Choose plan'}
              </button>
            </article>
          );
        })}
      </section>

      <section data-motion="page" className="mt-8 grid gap-5 border-t border-[var(--color-app-border-clean)] pt-6 lg:grid-cols-[1fr_18rem] lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
            <Mail className="h-4 w-4" />
            Newsletter
          </div>
          <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-app-heading)]">Digest frequency</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">
            Choose how often the app should prepare a reading digest for your account.
          </p>
        </div>
        <select
          value={preferences.newsletter}
          onChange={(event) => {
            setPreferences(current => ({ ...current, newsletter: event.target.value as AppPreferences['newsletter'] }));
            toast.success('Newsletter preference saved.');
          }}
          className="hex-input min-h-11 w-full px-3 text-sm"
        >
          <option value="daily">Daily briefing</option>
          <option value="weekly">Weekly briefing</option>
          <option value="none">No digest</option>
        </select>
      </section>
    </div>
  );
};

export default SubscribeScreen;
