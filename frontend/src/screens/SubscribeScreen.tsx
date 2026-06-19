import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  readAppPreferences,
  saveAppPreferences,
  subscribeAppPreferences,
  type AppPreferences,
} from '../lib/appPreferences';
import { backendApi } from '../lib/api';

type PlanId = AppPreferences['subscriptionPlan'];

const plans: Array<{
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  position: string;
  bestFor: string;
  features: string[];
}> = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    position: 'Public newsroom access',
    bestFor: 'Reading, voting, commenting, and saving basic reports.',
    features: ['Front page access', 'Community discussion', 'Basic saved posts'],
  },
  {
    id: 'reader-plus',
    name: 'Reader Plus',
    priceMonthly: 2,
    priceAnnual: 20,
    position: 'Better signal, quieter reading',
    bestFor: 'Readers who want briefings, advanced saves, and contributor alerts.',
    features: [
      'Daily or weekly briefing',
      'Advanced saved library',
      'Follow journalist alerts',
      'Ad-free reading mode',
    ],
  },
  {
    id: 'backer',
    name: 'Backer',
    priceMonthly: 5,
    priceAnnual: 50,
    position: 'Fund independent reporting',
    bestFor: 'Supporters who want deeper context and higher-signal discussion.',
    features: [
      'Everything in Reader Plus',
      'Source notes on selected reports',
      'Subscriber discussions',
      'Support allocation',
    ],
  },
  {
    id: 'newsroom-pro',
    name: 'Newsroom Pro',
    priceMonthly: 10,
    priceAnnual: 100,
    position: 'Research and archive tools',
    bestFor: 'Power readers, researchers, and small editorial teams.',
    features: [
      'Shared saved folders',
      'Export to Markdown/PDF',
      'Research archive tools',
      'Priority briefing controls',
    ],
  },
];

const briefingOptions: Array<{ value: AppPreferences['newsletter']; title: string; copy: string }> = [
  { value: 'daily', title: 'Daily briefing', copy: 'A concise morning read based on followed communities.' },
  { value: 'weekly', title: 'Weekly briefing', copy: 'A slower digest for weekend reading and saved stories.' },
  { value: 'none', title: 'No briefing', copy: 'Keep subscription benefits inside the app only.' },
];

const planRank: Record<PlanId, number> = {
  free: 0,
  'reader-plus': 1,
  backer: 2,
  'newsroom-pro': 3,
};

const backendPlanToUi = (plan?: string | null): PlanId => {
  const normalized = (plan || '').toLowerCase().replace(/_/g, '-');
  return plans.some((candidate) => candidate.id === normalized) ? (normalized as PlanId) : 'free';
};

const uiPlanToBackend = (plan: PlanId) => plan.toUpperCase().replace(/-/g, '_');

const backendCadenceToUi = (cadence?: string | null): AppPreferences['billingCadence'] =>
  cadence === 'ANNUAL' ? 'annual' : 'monthly';

export const SubscribeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stripeStatus = searchParams.get('stripe');
  const stripeSessionId = searchParams.get('session_id');
  const [preferences, setPreferences] = useState<AppPreferences>(() => readAppPreferences());
  const [isRedirectingPlan, setIsRedirectingPlan] = useState<PlanId | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isCompletingCheckout, setIsCompletingCheckout] = useState(
    () => stripeStatus === 'success' && Boolean(stripeSessionId),
  );
  const selectedPlan = plans.find((plan) => plan.id === preferences.subscriptionPlan) || plans[0];
  const isAnnual = preferences.billingCadence === 'annual';

  useEffect(() => saveAppPreferences(preferences), [preferences]);
  useEffect(() => subscribeAppPreferences(setPreferences), []);

  useEffect(() => {
    let isMounted = true;

    if (stripeStatus === 'success' && stripeSessionId) {
      backendApi
        .completeSubscriptionCheckout(stripeSessionId)
        .then((subscription) => {
          if (!isMounted) return;
          setPreferences((current) => ({
            ...current,
            subscriptionPlan: backendPlanToUi(subscription.subscriptionPlan),
            billingCadence: backendCadenceToUi(subscription.billingCadence),
          }));
          toast.success('Stripe subscription activated.');
          navigate('/app/subscribe', { replace: true });
        })
        .catch((error) => {
          if (!isMounted) return;
          toast.error(error instanceof Error ? error.message : 'Stripe checkout could not be completed.');
        })
        .finally(() => {
          if (isMounted) setIsCompletingCheckout(false);
        });
      return () => {
        isMounted = false;
      };
    }

    if (stripeStatus === 'cancel') {
      toast.info('Stripe checkout canceled.');
      navigate('/app/subscribe', { replace: true });
    }

    backendApi
      .getMySubscription()
      .then((subscription) => {
        if (!isMounted) return;
        setPreferences((current) => ({
          ...current,
          subscriptionPlan: backendPlanToUi(subscription.subscriptionPlan),
          billingCadence: backendCadenceToUi(subscription.billingCadence),
        }));
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [navigate, stripeSessionId, stripeStatus]);

  const annualSavings = useMemo(
    () => Math.max(0, selectedPlan.priceMonthly * 12 - selectedPlan.priceAnnual),
    [selectedPlan],
  );

  const updatePreferences = (next: Partial<AppPreferences>, message: string) => {
    setPreferences((current) => ({ ...current, ...next }));
    toast.success(message);
  };

  const openPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const session = await backendApi.createSubscriptionPortalSession();
      window.location.assign(session.url);
    } catch (error) {
      setIsOpeningPortal(false);
      toast.error(error instanceof Error ? error.message : 'Stripe portal could not be opened.');
    }
  };

  const updateSubscription = async (next: Partial<AppPreferences>, message: string) => {
    const optimistic = { ...preferences, ...next };
    if (optimistic.subscriptionPlan !== 'free') {
      setPreferences(optimistic);
      setIsRedirectingPlan(optimistic.subscriptionPlan);
      try {
        const session = await backendApi.createSubscriptionCheckout({
          plan: uiPlanToBackend(optimistic.subscriptionPlan),
          billingCadence: optimistic.billingCadence.toUpperCase(),
        });
        window.location.assign(session.url);
      } catch (error) {
        setIsRedirectingPlan(null);
        setPreferences(preferences);
        toast.error(error instanceof Error ? error.message : 'Stripe checkout could not be started.');
      }
      return;
    }

    setPreferences(optimistic);
    try {
      const updated = await backendApi.updateMySubscription({
        plan: uiPlanToBackend(optimistic.subscriptionPlan),
        billingCadence: optimistic.billingCadence.toUpperCase(),
      });
      setPreferences((current) => ({
        ...current,
        subscriptionPlan: backendPlanToUi(updated.subscriptionPlan),
        billingCadence: backendCadenceToUi(updated.billingCadence),
      }));
      toast.success(message);
    } catch (error) {
      setPreferences(preferences);
      toast.error(error instanceof Error ? error.message : 'Subscription update failed.');
    }
  };

  return (
    <div className="app-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <main className="min-w-0">
        <p className="mono-label mb-3 text-app-action">Subscription</p>
        <div className="border-b-2 border-app-heading pb-6">
          <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Support the newsroom</h1>
          <p className="mt-3 max-w-[68ch] text-sm leading-6 text-app-muted">
            Keep public reporting open. Subscribers get stronger signal, better reading tools, and a closer line to the
            contributors they trust.
          </p>
        </div>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-app-border pb-4">
          <div>
            <h2 className="mono-label text-app-muted">Choose plan</h2>
            <p className="mt-2 text-sm text-app-muted">
              Paid tiers use Stripe Checkout test mode. Free keeps the local account on public access.
            </p>
          </div>
          <div className="grid grid-cols-2 border border-app-border font-mono text-[11px] uppercase tracking-wider">
            {(['monthly', 'annual'] as const).map((cadence) => (
              <button
                key={cadence}
                type="button"
                onClick={() => updateSubscription({ billingCadence: cadence }, 'Billing cadence saved.')}
                className={`px-4 py-3 ${
                  preferences.billingCadence === cadence
                    ? 'bg-app-heading text-app-bg'
                    : 'text-app-muted hover:text-app-heading'
                }`}
              >
                {cadence === 'monthly' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {plans.map((plan) => {
            const isSelected = preferences.subscriptionPlan === plan.id;
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;

            return (
              <article
                key={plan.id}
                className={`border p-5 ${
                  isSelected ? 'border-app-heading bg-app-surface' : 'border-app-border bg-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-app-heading">{plan.name}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-app-action">
                      {plan.position}
                    </p>
                  </div>
                  <p className="font-mono text-[24px] font-semibold tabular-nums text-app-heading">
                    {price === 0 ? '$0' : `$${price}`}
                    <span className="ml-1 text-[11px] font-normal text-app-muted">/{isAnnual ? 'yr' : 'mo'}</span>
                  </p>
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-app-muted">{plan.bestFor}</p>
                <ul className="mt-5 space-y-2 border-t border-app-border pt-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-2 text-sm text-app-text">
                      <span className="font-mono text-app-action">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => updateSubscription({ subscriptionPlan: plan.id }, `${plan.name} selected.`)}
                  disabled={Boolean(isRedirectingPlan) || isCompletingCheckout}
                  className={`mt-5 h-11 w-full border font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    isSelected
                      ? 'border-app-heading bg-app-heading text-app-bg'
                      : 'border-app-border text-app-heading hover:border-app-action hover:text-app-action'
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {isCompletingCheckout
                    ? 'Verifying Stripe'
                    : isRedirectingPlan === plan.id
                      ? 'Opening Stripe'
                      : isSelected
                        ? 'Current plan'
                        : plan.priceMonthly === 0
                          ? 'Use free'
                          : 'Checkout with Stripe'}
                </button>
              </article>
            );
          })}
        </section>

        <section className="mt-10">
          <h2 className="mono-label mb-3 text-app-muted">Subscriber briefing</h2>
          <div className="border-y border-app-border">
            {briefingOptions.map((option) => (
              <PreferenceRow
                key={option.value}
                checked={preferences.newsletter === option.value}
                disabled={planRank[preferences.subscriptionPlan] === 0 && option.value === 'daily'}
                title={option.title}
                copy={
                  planRank[preferences.subscriptionPlan] === 0 && option.value === 'daily'
                    ? 'Daily briefing unlocks with Reader Plus.'
                    : option.copy
                }
                onClick={() => updatePreferences({ newsletter: option.value }, 'Briefing preference saved.')}
              />
            ))}
          </div>
        </section>
      </main>

      <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Current</h2>
          <p className="text-2xl font-semibold text-app-heading">{selectedPlan.name}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-app-muted">
            {isAnnual ? 'Annual billing' : 'Monthly billing'}
          </p>
          {annualSavings > 0 && (
            <p className="mt-3 text-sm leading-6 text-app-muted">
              Annual saves ${annualSavings} compared with monthly.
            </p>
          )}
        </section>
        {preferences.subscriptionPlan !== 'free' && (
          <section>
            <h2 className="mono-label mb-4 text-app-muted">Stripe</h2>
            <button
              type="button"
              onClick={openPortal}
              disabled={isOpeningPortal}
              className="h-9 w-full border border-app-border bg-app-bg px-4 font-mono text-[11px] uppercase tracking-wider text-app-heading hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isOpeningPortal ? 'Opening Portal...' : 'Manage Billing'}
            </button>
          </section>
        )}
        <section>
          <h2 className="mono-label mb-4 text-app-muted">What unlocks</h2>
          <ol className="space-y-3">
            {['Briefings', 'Advanced saves', 'Source notes', 'Subscriber discussions'].map((item, index) => (
              <li key={item} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 text-sm text-app-muted">
                <span className="font-mono text-[11px] text-app-action">{String(index + 1).padStart(2, '0')}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="mono-label mb-4 text-app-muted">Back</h2>
          <Link to="/app" className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline">
            Back to home
          </Link>
        </section>
      </aside>
    </div>
  );
};

const PreferenceRow: React.FC<{
  checked: boolean;
  disabled?: boolean;
  title: string;
  copy: string;
  onClick: () => void;
}> = ({ checked, disabled = false, title, copy, onClick }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className="grid w-full grid-cols-[24px_minmax(0,1fr)] gap-3 border-b border-app-border py-4 text-left last:border-b-0 disabled:cursor-not-allowed disabled:opacity-45"
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

export default SubscribeScreen;
