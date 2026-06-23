import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, CircleDot, Pencil, Plus, Search, Send, WalletCards, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { backendApi, type BackendAdCampaignDTO } from '../lib/api';
import { Alert } from '../components/ui/Alert';
import { Field, Input } from '../components/ui/Input';

type AdFormState = {
  brandName: string;
  headline: string;
  body: string;
  landingUrl: string;
  imageUrl: string;
  placement: string;
  targetAudience: string;
  startsAt: string;
  endsAt: string;
  budgetNote: string;
};

const emptyForm: AdFormState = {
  brandName: '',
  headline: '',
  body: '',
  landingUrl: '',
  imageUrl: '',
  placement: 'feed',
  targetAudience: '',
  startsAt: '',
  endsAt: '',
  budgetNote: '',
};

const editableStatuses = ['DRAFT', 'NEEDS_CHANGES', 'REJECTED'];

export const PartnerAdsScreen: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<BackendAdCampaignDTO[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<BackendAdCampaignDTO | null>(null);
  const [form, setForm] = useState<AdFormState>(emptyForm);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');

  const canUsePartnerDesk = user?.role === 'PARTNER' || user?.role === 'ADMIN';

  const loadCampaigns = async () => {
    setIsLoading(true);
    setError('');
    try {
      const page = await backendApi.getPartnerAdCampaigns(0, 40);
      setCampaigns(page.content || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Ad proposals could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canUsePartnerDesk) {
      loadCampaigns();
    }
  }, [canUsePartnerDesk]);

  if (!canUsePartnerDesk) {
    return <Navigate to="/app" replace />;
  }

  const updateField = (field: keyof AdFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectCampaign = (campaign: BackendAdCampaignDTO) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
    setForm({
      brandName: campaign.brandName || '',
      headline: campaign.headline || '',
      body: campaign.body || '',
      landingUrl: campaign.landingUrl || '',
      imageUrl: campaign.imageUrl || '',
      placement: campaign.placement || 'feed',
      targetAudience: campaign.targetAudience || '',
      startsAt: toDateTimeInput(campaign.startsAt),
      endsAt: toDateTimeInput(campaign.endsAt),
      budgetNote: campaign.budgetNote || '',
    });
  };

  const resetForm = () => {
    setSelectedCampaign(null);
    setIsModalOpen(false);
    setForm(emptyForm);
  };

  const saveCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = toPayload(form);
      if (selectedCampaign) {
        await backendApi.updatePartnerAdCampaign(selectedCampaign.id, payload);
        toast.success('Ad draft updated.');
      } else {
        await backendApi.createPartnerAdCampaign(payload);
        toast.success('Ad draft created.');
      }
      resetForm();
      await loadCampaigns();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Ad draft could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const submitCampaign = async (campaign: BackendAdCampaignDTO) => {
    setIsSaving(true);
    setError('');
    try {
      await backendApi.submitPartnerAdCampaign(campaign.id);
      toast.success('Ad proposal submitted for review.');
      await loadCampaigns();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Ad proposal could not be submitted.');
    } finally {
      setIsSaving(false);
    }
  };

  const visibleCampaigns = campaigns.filter(campaign => `${campaign.brandName} ${campaign.headline}`.toLowerCase().includes(query.toLowerCase()));
  const metrics = [
    ['Total campaigns', campaigns.length, BarChart3],
    ['Drafts', campaigns.filter(c => editableStatuses.includes(c.status)).length, Pencil],
    ['In review', campaigns.filter(c => ['SUBMITTED', 'PENDING'].includes(c.status)).length, CircleDot],
    ['Approved', campaigns.filter(c => c.status === 'APPROVED').length, WalletCards],
  ] as const;

  return (
    <main className="app-page mx-auto min-h-[calc(100svh-4rem)] max-w-[1280px] text-app-text">
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-app-muted">Partners</p><h1 className="text-[34px] font-bold tracking-tight text-app-heading md:text-5xl">Campaign Dashboard</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">Manage sponsored placements and approval status across Tourane News Intelligence.</p></div><button type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-app-action px-5 py-3 text-sm font-semibold text-app-on-action hover:bg-app-action-hover"><Plus className="h-4 w-4" />New campaign</button></header>
      {error && <Alert tone="error" className="mb-6">{error}</Alert>}
      <section className="mb-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value, Icon]) => <article key={label} className="rounded-xl border border-app-border bg-app-surface p-6 shadow-[var(--shadow-subtle)]"><div className="mb-5 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">{label}</span><Icon className="h-4 w-4 text-app-action" /></div><strong className="text-3xl text-app-heading">{isLoading ? '—' : value}</strong><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-app-border"><div className="h-full rounded-full bg-app-action" style={{ width: campaigns.length ? `${Math.max(8, Number(value) / campaigns.length * 100)}%` : '0%' }} /></div></article>)}</section>
      <section className="overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-[var(--shadow-subtle)]"><div className="flex flex-col justify-between gap-4 border-b border-app-border p-5 sm:flex-row sm:items-center"><div><h2 className="text-xl font-semibold text-app-heading">Active sponsorships</h2><p className="mt-1 text-xs text-app-muted">Drafts and submitted campaigns from your partner account.</p></div><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-faint" /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Filter campaigns" placeholder="Filter campaigns" className="focus-ring channel-input h-10 pl-9 sm:w-64" /></label></div>
        {isLoading ? <div className="p-6"><div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex items-center gap-4"><div className="h-8 w-8 shrink-0 rounded-full bg-app-surface-alt animate-pulse" /><div className="flex flex-1 gap-6"><div className="h-4 flex-1 rounded bg-app-surface-alt animate-pulse" /><div className="h-4 w-20 rounded bg-app-surface-alt animate-pulse" /><div className="h-4 w-24 rounded bg-app-surface-alt animate-pulse" /><div className="h-4 w-16 rounded bg-app-surface-alt animate-pulse" /><div className="h-8 w-16 rounded bg-app-surface-alt animate-pulse" /></div></div>)}</div></div> : visibleCampaigns.length ? <div className="overflow-x-auto"><table className="min-w-[820px] w-full text-left"><thead className="bg-app-surface-alt font-mono text-[9px] uppercase tracking-wider text-app-muted"><tr>{['Sponsor','Campaign title','Placement','Schedule','Status','Actions'].map(h => <th key={h} className="px-5 py-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-app-border">{visibleCampaigns.map(campaign => <tr key={campaign.id} className="hover:bg-app-surface-alt"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-app-action-soft text-xs font-bold text-app-action">{campaign.brandName.slice(0,1).toUpperCase()}</span><b className="text-sm">{campaign.brandName}</b></div></td><td className="max-w-xs px-5 py-4"><p className="truncate text-sm text-app-muted">{campaign.headline}</p>{campaign.reviewNote && <p className="mt-1 truncate text-xs text-state-error">{campaign.reviewNote}</p>}</td><td className="px-5 py-4 text-sm capitalize text-app-muted">{campaign.placement || 'Feed'}</td><td className="px-5 py-4 font-mono text-[10px] text-app-muted">{campaign.startsAt ? new Date(campaign.startsAt).toLocaleDateString() : 'Unscheduled'}</td><td className="px-5 py-4"><StatusBadge status={campaign.status} /></td><td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => selectCampaign(campaign)} disabled={!editableStatuses.includes(campaign.status)} className="focus-ring rounded-md border border-app-border p-2 text-app-muted hover:border-app-action hover:text-app-action disabled:opacity-30" aria-label="Edit campaign"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => submitCampaign(campaign)} disabled={isSaving || !editableStatuses.includes(campaign.status)} className="focus-ring rounded-md bg-app-action p-2 text-app-on-action hover:bg-app-action-hover disabled:opacity-30" aria-label="Submit campaign"><Send className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div> : <p className="p-8 text-sm italic text-app-muted">No campaigns found.</p>}
      </section>

      {isModalOpen && <div className="fixed inset-0 z-[100] overflow-y-auto bg-app-heading/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="campaign-title"><div className="mx-auto my-8 max-w-2xl rounded-2xl bg-app-surface shadow-[var(--shadow-modal)]"><div className="flex items-center justify-between border-b border-app-border px-6 py-5"><div><p className="font-mono text-[9px] uppercase tracking-widest text-app-action">Campaign editor</p><h2 id="campaign-title" className="mt-1 text-xl font-semibold text-app-heading">{selectedCampaign ? 'Edit campaign' : 'Create new campaign'}</h2></div><button type="button" onClick={resetForm} className="focus-ring rounded-full p-2 text-app-muted hover:bg-app-surface-alt"><X className="h-5 w-5" /></button></div><form onSubmit={saveCampaign} className="grid gap-5 p-6"><div className="grid gap-4 sm:grid-cols-2"><Field id="ad-brand" label="Sponsor name"><Input id="ad-brand" required value={form.brandName} onChange={e => updateField('brandName', e.target.value)} /></Field><Field id="ad-placement" label="Placement"><Input id="ad-placement" value={form.placement} onChange={e => updateField('placement', e.target.value)} /></Field></div><Field id="ad-headline" label="Ad headline"><Input id="ad-headline" required value={form.headline} onChange={e => updateField('headline', e.target.value)} /></Field><label className="grid gap-2"><span className="mono-label text-app-muted">Body</span><textarea required value={form.body} onChange={e => updateField('body', e.target.value)} className="channel-input min-h-24 resize-y" /></label><div className="grid gap-4 sm:grid-cols-2"><Field id="ad-url" label="Landing URL"><Input id="ad-url" required value={form.landingUrl} onChange={e => updateField('landingUrl', e.target.value)} /></Field><Field id="ad-image" label="Image URL"><Input id="ad-image" value={form.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} /></Field></div><Field id="ad-target" label="Target audience"><Input id="ad-target" value={form.targetAudience} onChange={e => updateField('targetAudience', e.target.value)} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field id="ad-start" label="Starts"><Input id="ad-start" type="datetime-local" value={form.startsAt} onChange={e => updateField('startsAt', e.target.value)} /></Field><Field id="ad-end" label="Ends"><Input id="ad-end" type="datetime-local" value={form.endsAt} onChange={e => updateField('endsAt', e.target.value)} /></Field></div><Field id="ad-budget" label="Budget note"><Input id="ad-budget" value={form.budgetNote} onChange={e => updateField('budgetNote', e.target.value)} /></Field><div className="flex justify-end gap-3 border-t border-app-border pt-5"><button type="button" onClick={resetForm} className="focus-ring rounded-lg px-5 py-2.5 text-sm font-semibold text-app-muted hover:bg-app-surface-alt">Cancel</button><button type="submit" disabled={isSaving || Boolean(selectedCampaign && !editableStatuses.includes(selectedCampaign.status))} className="focus-ring rounded-lg bg-app-action px-6 py-2.5 text-sm font-semibold text-app-on-action hover:bg-app-action-hover disabled:opacity-40">{isSaving ? 'Saving...' : 'Save campaign'}</button></div></form></div></div>}
    </main>
  );
};

const StatusBadge = ({ status }: { status?: string | null }) => (
  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-app-muted">
    <span className="h-1.5 w-1.5 bg-current [clip-path:circle(50%)]" aria-hidden="true" />
    {status || 'Unknown'}
  </span>
);

const toPayload = (form: AdFormState) => ({
  brandName: form.brandName,
  headline: form.headline,
  body: form.body,
  landingUrl: form.landingUrl,
  imageUrl: form.imageUrl || undefined,
  placement: form.placement || undefined,
  targetAudience: form.targetAudience || undefined,
  startsAt: form.startsAt || undefined,
  endsAt: form.endsAt || undefined,
  budgetNote: form.budgetNote || undefined,
});

const toDateTimeInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

export default PartnerAdsScreen;
