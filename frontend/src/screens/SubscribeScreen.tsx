import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, Minus, ShieldCheck } from 'lucide-react';
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

  const startCheckout = (plan: PlanId) =>
    updateSubscription({ subscriptionPlan: plan }, `${plans.find((item) => item.id === plan)?.name || 'Plan'} selected.`);

  return (
    <div className="app-page mx-auto max-w-[1280px]">
      <header className="mb-14 text-center">
        <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-app-action">Unrivaled intelligence</p>
        <h1 className="mx-auto max-w-3xl text-[38px] font-bold leading-tight tracking-[-0.03em] text-app-heading sm:text-5xl">Elevate Your Perspective with Premium Vetting</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-app-muted">Join informed decision-makers with deeper verification, focused intelligence feeds, and professional research tools.</p>
        <div className="mx-auto mt-8 grid w-fit grid-cols-2 rounded-xl border border-app-border bg-app-surface p-1 text-xs font-semibold">
          {(['monthly', 'annual'] as const).map((cadence) => <button key={cadence} type="button" onClick={() => updateSubscription({ billingCadence: cadence }, 'Billing cadence saved.')} className={`rounded-lg px-5 py-2.5 capitalize ${preferences.billingCadence === cadence ? 'bg-app-action text-app-on-action' : 'text-app-muted hover:text-app-heading'}`}>{cadence}</button>)}
        </div>
      </header>

      <section className="mb-24 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const selected = preferences.subscriptionPlan === plan.id;
          const featured = plan.id === 'backer';
          const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
          return <article key={plan.id} className={`relative flex flex-col rounded-3xl border bg-app-surface p-7 shadow-[var(--shadow-subtle)] transition-transform hover:-translate-y-1 ${featured ? 'border-2 border-app-action shadow-[0_0_24px_var(--color-app-action-soft)]' : 'border-app-border'}`}>
            {featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-app-action px-4 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-app-on-action">Most popular</span>}
            <h2 className="text-xl font-semibold text-app-heading">{plan.name}</h2><p className="mt-2 min-h-10 text-sm text-app-muted">{plan.position}</p>
            <p className="my-7"><strong className="text-4xl text-app-heading">${price}</strong><span className="text-sm text-app-muted">/{isAnnual ? 'yr' : 'mo'}</span></p>
            <ul className="mb-8 flex-grow space-y-4">{plan.features.map(feature => <li key={feature} className="flex gap-3 text-sm text-app-text"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-app-action" />{feature}</li>)}</ul>
            <button type="button" disabled={Boolean(isRedirectingPlan) || isCompletingCheckout} onClick={() => startCheckout(plan.id)} className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-45 ${featured || selected ? 'border-app-action bg-app-action text-app-on-action hover:bg-app-action-hover' : 'border-app-border text-app-heading hover:border-app-action hover:bg-app-action-faint'}`}>{isCompletingCheckout ? 'Verifying Stripe...' : isRedirectingPlan === plan.id ? 'Opening Stripe...' : selected ? 'Current plan' : plan.id === 'free' ? 'Use free' : 'Checkout with Stripe'}</button>
          </article>;
        })}
      </section>

      <section className="mb-24">
        <h2 className="mb-10 text-center text-2xl font-semibold text-app-heading">Detailed Verification Capabilities</h2>
        <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-surface"><table className="min-w-[720px] w-full text-left text-sm"><thead><tr className="border-b border-app-border font-mono text-[10px] uppercase tracking-widest text-app-muted"><th className="px-5 py-5">Capability</th><th className="px-5 py-5">Free</th><th className="px-5 py-5">Reader+</th><th className="px-5 py-5 text-app-action">Backer</th><th className="px-5 py-5">Newsroom</th></tr></thead><tbody className="divide-y divide-app-border">
          <CompareRow label="Source verification score" values={['-', 'Basic', 'Advanced', 'Advanced']} />
          <CompareRow label="Cross-reference mapping" values={['-', 'Basic', 'Advanced', 'Real-time']} />
          <CompareRow label="Shared research folders" values={['-', '-', '-', 'Included']} />
          <CompareRow label="Intelligence briefings" values={['Weekly', 'Daily', 'Daily', 'Priority']} />
          <CompareRow label="Research exports" values={['-', '-', 'Selected', 'Markdown / PDF']} />
        </tbody></table></div>
      </section>

      <section className="mx-auto mb-20 grid max-w-4xl overflow-hidden rounded-[2rem] border border-app-border bg-app-surface p-4 shadow-[var(--shadow-raised)] md:grid-cols-2">
        <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl bg-app-action p-9 text-app-on-action"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" /><ShieldCheck className="relative mb-7 h-10 w-10" /><h2 className="relative text-2xl font-semibold">Enterprise-grade security</h2><p className="relative mt-4 text-sm leading-6 text-white/75">Payments are handled by Stripe Checkout. Tourane News never collects or stores your card number. Saved research and account data remain protected by the application security layer.</p><p className="relative mt-auto pt-10 font-mono text-[10px] uppercase tracking-widest text-white/70">Secured by Stripe + Tourane</p></div>
        <div className="flex flex-col p-6 md:p-10"><p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-app-action">Secure checkout</p><h2 className="mt-3 text-2xl font-semibold text-app-heading">{selectedPlan.name}</h2><p className="mt-2 text-sm text-app-muted">{selectedPlan.bestFor}</p><div className="my-7 border-y border-app-border py-5"><div className="flex justify-between text-sm"><span className="text-app-muted">Billing</span><strong className="capitalize text-app-heading">{preferences.billingCadence}</strong></div><div className="mt-3 flex justify-between text-sm"><span className="text-app-muted">Total</span><strong className="text-app-heading">${isAnnual ? selectedPlan.priceAnnual : selectedPlan.priceMonthly}/{isAnnual ? 'year' : 'month'}</strong></div>{annualSavings > 0 && <p className="mt-3 text-xs text-app-action">Save ${annualSavings} with annual billing.</p>}</div>
          {selectedPlan.id === 'free' ? <p className="rounded-xl bg-app-surface-alt p-4 text-sm leading-6 text-app-muted">Choose a paid plan above to continue to Stripe Checkout.</p> : <button type="button" onClick={() => startCheckout(selectedPlan.id)} disabled={Boolean(isRedirectingPlan) || isCompletingCheckout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-heading px-5 py-4 text-sm font-semibold text-app-bg hover:bg-black disabled:opacity-45"><span>{isRedirectingPlan ? 'Opening Stripe...' : `Subscribe to ${selectedPlan.name}`}</span><ArrowRight className="h-4 w-4" /></button>}
          {preferences.subscriptionPlan !== 'free' && <button type="button" onClick={openPortal} disabled={isOpeningPortal} className="mt-3 rounded-xl border border-app-border px-5 py-3 text-sm font-semibold text-app-muted hover:border-app-action hover:text-app-action disabled:opacity-45">{isOpeningPortal ? 'Opening portal...' : 'Manage existing billing'}</button>}
          <p className="mt-5 text-center text-[10px] leading-4 text-app-faint">By continuing, you agree to the subscription and privacy terms.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl border-t border-app-border pt-10"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-widest text-app-action">Subscriber briefing</p><h2 className="mt-2 text-2xl font-semibold text-app-heading">Choose your signal cadence</h2></div><Link to="/app" className="text-sm font-semibold text-app-action hover:underline">Back to home</Link></div><div className="mt-6 grid gap-3 md:grid-cols-3">{briefingOptions.map(option => <PreferenceRow key={option.value} checked={preferences.newsletter === option.value} disabled={planRank[preferences.subscriptionPlan] === 0 && option.value === 'daily'} title={option.title} copy={planRank[preferences.subscriptionPlan] === 0 && option.value === 'daily' ? 'Daily briefing unlocks with Reader Plus.' : option.copy} onClick={() => updatePreferences({ newsletter: option.value }, 'Briefing preference saved.')} />)}</div></section>
    </div>
  );
};

const CompareRow: React.FC<{ label: string; values: string[] }> = ({ label, values }) => (
  <tr>
    <td className="px-5 py-5 font-semibold text-app-heading">{label}</td>
    {values.map((value, index) => (
      <td key={label + index} className={index === 2 ? 'px-5 py-5 font-semibold text-app-action' : 'px-5 py-5 text-app-muted'}>
        {value === '-' ? <Minus className="h-4 w-4 text-app-faint" /> : value}
      </td>
    ))}
  </tr>
);

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
