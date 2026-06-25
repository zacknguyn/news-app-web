import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
type Language = AppPreferences['language'];

const plans: Array<{
  id: PlanId;
  name: Record<Language, string>;
  priceMonthly: number;
  priceAnnual: number;
  position: Record<Language, string>;
  bestFor: Record<Language, string>;
  features: Record<Language, string[]>;
}> = [
  {
    id: 'free',
    name: { en: 'Free', vi: 'Miễn phí' },
    priceMonthly: 0,
    priceAnnual: 0,
    position: { en: 'Public newsroom access', vi: 'Truy cập phòng tin công khai' },
    bestFor: { en: 'Reading, voting, commenting, and saving basic reports.', vi: 'Đọc, bình chọn, bình luận và lưu các bài cơ bản.' },
    features: {
      en: ['Front page access', 'Community discussion', 'Basic saved posts'],
      vi: ['Truy cập trang chủ', 'Thảo luận cộng đồng', 'Lưu bài viết cơ bản'],
    },
  },
  {
    id: 'reader-plus',
    name: { en: 'Reader Plus', vi: 'Độc giả Plus' },
    priceMonthly: 2,
    priceAnnual: 20,
    position: { en: 'Better signal, quieter reading', vi: 'Ít nhiễu hơn, đọc tập trung hơn' },
    bestFor: { en: 'Readers who want advanced saves and contributor alerts.', vi: 'Độc giả muốn lưu nâng cao và nhận thông báo từ tác giả.' },
    features: {
      en: ['Advanced saved library', 'Follow journalist alerts', 'Ad-free reading mode'],
      vi: ['Thư viện đã lưu nâng cao', 'Theo dõi thông báo tác giả', 'Chế độ đọc không quảng cáo'],
    },
  },
  {
    id: 'backer',
    name: { en: 'Backer', vi: 'Người ủng hộ' },
    priceMonthly: 5,
    priceAnnual: 50,
    position: { en: 'Fund independent reporting', vi: 'Ủng hộ tin tức độc lập' },
    bestFor: { en: 'Supporters who want deeper context and higher-signal discussion.', vi: 'Người muốn ngữ cảnh sâu hơn và thảo luận chất lượng hơn.' },
    features: {
      en: ['Everything in Reader Plus', 'Source notes on selected reports', 'Subscriber discussions', 'Support allocation'],
      vi: ['Toàn bộ quyền lợi Độc giả Plus', 'Ghi chú nguồn ở bài chọn lọc', 'Thảo luận dành cho thành viên', 'Phân bổ khoản ủng hộ'],
    },
  },
  {
    id: 'newsroom-pro',
    name: { en: 'Newsroom Pro', vi: 'Tòa soạn Pro' },
    priceMonthly: 10,
    priceAnnual: 100,
    position: { en: 'Research and archive tools', vi: 'Công cụ nghiên cứu và lưu trữ' },
    bestFor: { en: 'Power readers, researchers, and small editorial teams.', vi: 'Độc giả chuyên sâu, nhà nghiên cứu và nhóm biên tập nhỏ.' },
    features: {
      en: ['Shared saved folders', 'Export to Markdown/PDF', 'Research archive tools'],
      vi: ['Thư mục lưu chia sẻ', 'Xuất Markdown/PDF', 'Công cụ lưu trữ nghiên cứu'],
    },
  },
];


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
  const language = preferences.language;
  const isVi = language === 'vi';
  const copy = {
    eyebrow: isVi ? 'Tin tức đã kiểm chứng' : 'Unrivaled intelligence',
    title: isVi ? 'Nâng cấp trải nghiệm với gói thành viên' : 'Elevate Your Perspective with Premium Vetting',
    subtitle: isVi
      ? 'Dành cho độc giả muốn kiểm chứng sâu hơn, nguồn tin tập trung hơn và công cụ nghiên cứu chuyên nghiệp.'
      : 'Join informed decision-makers with deeper verification, focused intelligence feeds, and professional research tools.',
    monthly: isVi ? 'Hằng tháng' : 'Monthly',
    annual: isVi ? 'Hằng năm' : 'Annual',
    billingSaved: isVi ? 'Đã lưu chu kỳ thanh toán.' : 'Billing cadence saved.',
    mostPopular: isVi ? 'Phổ biến nhất' : 'Most popular',
    verifying: isVi ? 'Đang xác minh Stripe...' : 'Verifying Stripe...',
    openingStripe: isVi ? 'Đang mở Stripe...' : 'Opening Stripe...',
    currentPlan: isVi ? 'Gói hiện tại' : 'Current plan',
    useFree: isVi ? 'Dùng miễn phí' : 'Use free',
    checkout: isVi ? 'Thanh toán bằng Stripe' : 'Checkout with Stripe',
    capabilities: isVi ? 'Khả năng kiểm chứng chi tiết' : 'Detailed Verification Capabilities',
    capability: isVi ? 'Tính năng' : 'Capability',
    sourceScore: isVi ? 'Điểm kiểm chứng nguồn' : 'Source verification score',
    crossRef: isVi ? 'Liên kết đối chiếu nguồn' : 'Cross-reference mapping',
    sharedFolders: isVi ? 'Thư mục nghiên cứu chia sẻ' : 'Shared research folders',
    exports: isVi ? 'Xuất tài liệu nghiên cứu' : 'Research exports',
    basic: isVi ? 'Cơ bản' : 'Basic',
    advanced: isVi ? 'Nâng cao' : 'Advanced',
    realTime: isVi ? 'Thời gian thực' : 'Real-time',
    included: isVi ? 'Bao gồm' : 'Included',
    selected: isVi ? 'Chọn lọc' : 'Selected',
    securityTitle: isVi ? 'Bảo mật chuẩn doanh nghiệp' : 'Enterprise-grade security',
    securityBody: isVi
      ? 'Thanh toán được xử lý bởi Stripe Checkout. Tourane News không thu thập hoặc lưu số thẻ của bạn. Dữ liệu tài khoản và mục đã lưu vẫn được bảo vệ bởi lớp bảo mật của ứng dụng.'
      : 'Payments are handled by Stripe Checkout. Tourane News never collects or stores your card number. Saved research and account data remain protected by the application security layer.',
    securityFooter: isVi ? 'Bảo vệ bởi Stripe + Tourane' : 'Secured by Stripe + Tourane',
    secureCheckout: isVi ? 'Thanh toán an toàn' : 'Secure checkout',
    billing: isVi ? 'Chu kỳ' : 'Billing',
    total: isVi ? 'Tổng cộng' : 'Total',
    year: isVi ? 'năm' : 'year',
    month: isVi ? 'tháng' : 'month',
    yr: isVi ? 'năm' : 'yr',
    mo: isVi ? 'tháng' : 'mo',
    saveAnnual: (amount: number) => isVi ? `Tiết kiệm $${amount} khi thanh toán hằng năm.` : `Save $${amount} with annual billing.`,
    choosePaid: isVi ? 'Chọn một gói trả phí ở trên để tiếp tục tới Stripe Checkout.' : 'Choose a paid plan above to continue to Stripe Checkout.',
    subscribeTo: (name: string) => isVi ? `Đăng ký ${name}` : `Subscribe to ${name}`,
    manageBilling: isVi ? 'Quản lý thanh toán hiện có' : 'Manage existing billing',
    openingPortal: isVi ? 'Đang mở cổng thanh toán...' : 'Opening portal...',
    terms: isVi ? 'Khi tiếp tục, bạn đồng ý với điều khoản đăng ký và quyền riêng tư.' : 'By continuing, you agree to the subscription and privacy terms.',
    activated: isVi ? 'Đã kích hoạt gói Stripe.' : 'Stripe subscription activated.',
    checkoutFailed: isVi ? 'Không thể hoàn tất thanh toán Stripe.' : 'Stripe checkout could not be completed.',
    canceled: isVi ? 'Đã hủy thanh toán Stripe.' : 'Stripe checkout canceled.',
    portalFailed: isVi ? 'Không thể mở cổng Stripe.' : 'Stripe portal could not be opened.',
    startFailed: isVi ? 'Không thể bắt đầu thanh toán Stripe.' : 'Stripe checkout could not be started.',
    updateFailed: isVi ? 'Cập nhật gói thất bại.' : 'Subscription update failed.',
    selectedMessage: (name: string) => isVi ? `Đã chọn gói ${name}.` : `${name} selected.`,
  };

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
          toast.success(copy.activated);
          navigate('/app/subscribe', { replace: true });
        })
        .catch((error) => {
          if (!isMounted) return;
          toast.error(error instanceof Error ? error.message : copy.checkoutFailed);
        })
        .finally(() => {
          if (isMounted) setIsCompletingCheckout(false);
        });
      return () => {
        isMounted = false;
      };
    }

    if (stripeStatus === 'cancel') {
      toast.info(copy.canceled);
      navigate('/app/subscribe', { replace: true });
    }

    backendApi
      .getCurrentUser()
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
  }, [copy.activated, copy.canceled, copy.checkoutFailed, navigate, stripeSessionId, stripeStatus]);

  const annualSavings = useMemo(
    () => Math.max(0, selectedPlan.priceMonthly * 12 - selectedPlan.priceAnnual),
    [selectedPlan],
  );


  const openPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const session = await backendApi.createSubscriptionPortalSession();
      window.location.assign(session.url);
    } catch (error) {
      setIsOpeningPortal(false);
      toast.error(error instanceof Error ? error.message : copy.portalFailed);
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
        toast.error(error instanceof Error ? error.message : copy.startFailed);
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
      toast.error(error instanceof Error ? error.message : copy.updateFailed);
    }
  };

  const startCheckout = (plan: PlanId) =>
    updateSubscription({ subscriptionPlan: plan }, copy.selectedMessage(plans.find((item) => item.id === plan)?.name[language] || 'Plan'));

  return (
    <div className="app-page mx-auto max-w-[1280px]">
      <header className="mb-14 text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-app-muted">{copy.eyebrow}</p>
        <h1 className="mx-auto max-w-3xl text-[38px] font-bold leading-tight text-app-heading sm:text-5xl">{copy.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-app-muted">{copy.subtitle}</p>
        <div className="mx-auto mt-8 grid w-fit grid-cols-2 rounded-xl border border-app-border bg-app-surface p-1 text-xs font-semibold">
          {(['monthly', 'annual'] as const).map((cadence) => <button key={cadence} type="button" onClick={() => updateSubscription({ billingCadence: cadence }, copy.billingSaved)} className={`rounded-lg px-5 py-2.5 ${preferences.billingCadence === cadence ? 'bg-app-action text-app-on-action' : 'text-app-muted hover:text-app-heading'}`}>{cadence === 'monthly' ? copy.monthly : copy.annual}</button>)}
        </div>
      </header>

      <section className="mb-24 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const selected = preferences.subscriptionPlan === plan.id;
          const featured = plan.id === 'backer';
          const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
          return <article key={plan.id} className={`relative flex flex-col rounded-3xl border bg-app-surface p-7 shadow-[var(--shadow-subtle)] transition-transform hover:-translate-y-1 ${featured ? 'border-2 border-app-action shadow-[0_0_24px_var(--color-app-action-soft)]' : 'border-app-border'}`}>
            {featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-app-action px-4 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-app-on-action">{copy.mostPopular}</span>}
            <h2 className="text-xl font-semibold text-app-heading">{plan.name[language]}</h2><p className="mt-2 min-h-10 text-sm text-app-muted">{plan.position[language]}</p>
            <p className="my-7"><strong className="text-4xl text-app-heading">${price}</strong><span className="text-sm text-app-muted">/{isAnnual ? copy.yr : copy.mo}</span></p>
            <ul className="mb-8 flex-grow space-y-4">{plan.features[language].map(feature => <li key={feature} className="flex gap-3 text-sm text-app-text"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-app-action" />{feature}</li>)}</ul>
            <button type="button" disabled={Boolean(isRedirectingPlan) || isCompletingCheckout} onClick={() => startCheckout(plan.id)} className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-45 ${featured || selected ? 'border-app-action bg-app-action text-app-on-action hover:bg-app-action-hover' : 'border-app-border text-app-heading hover:border-app-action hover:bg-app-action-faint'}`}>{isCompletingCheckout ? copy.verifying : isRedirectingPlan === plan.id ? copy.openingStripe : selected ? copy.currentPlan : plan.id === 'free' ? copy.useFree : copy.checkout}</button>
          </article>;
        })}
      </section>

      <section className="mb-24">
        <h2 className="mb-10 text-center text-2xl font-semibold text-app-heading">{copy.capabilities}</h2>
        <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-surface"><table className="min-w-[720px] w-full text-left text-sm"><thead><tr className="border-b border-app-border font-mono text-[10px] uppercase tracking-widest text-app-muted"><th className="px-5 py-5">{copy.capability}</th><th className="px-5 py-5">{plans[0].name[language]}</th><th className="px-5 py-5">{plans[1].name[language]}</th><th className="px-5 py-5 text-app-action">{plans[2].name[language]}</th><th className="px-5 py-5">{plans[3].name[language]}</th></tr></thead><tbody className="divide-y divide-app-border">
          <CompareRow label={copy.sourceScore} values={['-', copy.basic, copy.advanced, copy.advanced]} />
          <CompareRow label={copy.crossRef} values={['-', copy.basic, copy.advanced, copy.realTime]} />
          <CompareRow label={copy.sharedFolders} values={['-', '-', '-', copy.included]} />
          <CompareRow label={copy.exports} values={['-', '-', copy.selected, 'Markdown / PDF']} />
        </tbody></table></div>
      </section>

      <section className="mx-auto mb-20 grid max-w-4xl overflow-hidden rounded-[2rem] border border-app-border bg-app-surface p-4 shadow-[var(--shadow-raised)] md:grid-cols-2">
        <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl bg-app-action p-9 text-app-on-action"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" /><ShieldCheck className="relative mb-7 h-10 w-10" /><h2 className="relative text-2xl font-semibold">{copy.securityTitle}</h2><p className="relative mt-4 text-sm leading-6 text-white/75">{copy.securityBody}</p><p className="relative mt-auto pt-10 font-mono text-[10px] uppercase tracking-widest text-white/70">{copy.securityFooter}</p></div>
        <div className="flex flex-col p-6 md:p-10"><p className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">{copy.secureCheckout}</p><h2 className="mt-3 text-2xl font-semibold text-app-heading">{selectedPlan.name[language]}</h2><p className="mt-2 text-sm text-app-muted">{selectedPlan.bestFor[language]}</p><div className="my-7 border-y border-app-border py-5"><div className="flex justify-between text-sm"><span className="text-app-muted">{copy.billing}</span><strong className="text-app-heading">{isAnnual ? copy.annual : copy.monthly}</strong></div><div className="mt-3 flex justify-between text-sm"><span className="text-app-muted">{copy.total}</span><strong className="text-app-heading">${isAnnual ? selectedPlan.priceAnnual : selectedPlan.priceMonthly}/{isAnnual ? copy.year : copy.month}</strong></div>{annualSavings > 0 && <p className="mt-3 text-xs text-app-action">{copy.saveAnnual(annualSavings)}</p>}</div>
          {selectedPlan.id === 'free' ? <p className="rounded-xl bg-app-surface-alt p-4 text-sm leading-6 text-app-muted">{copy.choosePaid}</p> : <button type="button" onClick={() => startCheckout(selectedPlan.id)} disabled={Boolean(isRedirectingPlan) || isCompletingCheckout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-heading px-5 py-4 text-sm font-semibold text-app-bg hover:bg-black disabled:opacity-45"><span>{isRedirectingPlan ? copy.openingStripe : copy.subscribeTo(selectedPlan.name[language])}</span><ArrowRight className="h-4 w-4" /></button>}
          {preferences.subscriptionPlan !== 'free' && <button type="button" onClick={openPortal} disabled={isOpeningPortal} className="mt-3 rounded-xl border border-app-border px-5 py-3 text-sm font-semibold text-app-muted hover:border-app-action hover:text-app-action disabled:opacity-45">{isOpeningPortal ? copy.openingPortal : copy.manageBilling}</button>}
          <p className="mt-5 text-center text-[10px] leading-4 text-app-faint">{copy.terms}</p>
        </div>
      </section>


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


export default SubscribeScreen;
