import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
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

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-app-bg text-app-text">
      <header className="border-b border-app-border px-5 py-6">
        <p className="mono-label text-app-action">Partner desk</p>
        <h1 className="mt-2 text-2xl font-semibold text-app-heading">Ad proposals</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
          Draft sponsored placements, upload creative URLs, and submit campaigns for admin review.
        </p>
      </header>

      {error && (
        <div className="px-5 pt-5">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="border-b border-app-border xl:border-b-0 xl:border-r">
          <div className="border-b border-app-border px-5 py-4">
            <h2 className="text-lg font-semibold text-app-heading">Your campaigns</h2>
            <p className="mt-1 text-sm text-app-muted">Only submitted proposals are visible for admin approval.</p>
          </div>
          {isLoading ? (
            <div className="px-5 py-6">
              <span className="swiss-loading">
                <span>.</span> Loading ad proposals
              </span>
            </div>
          ) : campaigns.length === 0 ? (
            <p className="px-5 py-6 text-sm italic text-app-muted">No ad proposals yet.</p>
          ) : (
            <div className="divide-y divide-app-border">
              {campaigns.map((campaign) => (
                <article key={campaign.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <button type="button" onClick={() => selectCampaign(campaign)} className="text-left">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-app-heading">{campaign.brandName}</h3>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="mt-1 text-sm text-app-muted">{campaign.headline}</p>
                    {campaign.reviewNote && (
                      <p className="mt-2 border-l-2 border-app-action pl-3 text-sm leading-6 text-app-muted">
                        {campaign.reviewNote}
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => selectCampaign(campaign)}
                      disabled={!editableStatuses.includes(campaign.status)}
                      className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => submitCampaign(campaign)}
                      disabled={isSaving || !editableStatuses.includes(campaign.status)}
                      className="h-9 border border-app-action bg-app-action px-3 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Submit
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="px-5 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="mono-label text-app-muted">{selectedCampaign ? 'Edit draft' : 'New draft'}</h2>
            {selectedCampaign && (
              <button type="button" onClick={resetForm} className="font-mono text-[11px] uppercase text-app-action">
                New
              </button>
            )}
          </div>
          <form onSubmit={saveCampaign} className="grid gap-4">
            <Field id="ad-brand" label="Brand name">
              <Input
                id="ad-brand"
                required
                value={form.brandName}
                onChange={(event) => updateField('brandName', event.target.value)}
              />
            </Field>
            <Field id="ad-headline" label="Headline">
              <Input
                id="ad-headline"
                required
                value={form.headline}
                onChange={(event) => updateField('headline', event.target.value)}
              />
            </Field>
            <label className="grid gap-2">
              <span className="mono-label text-app-muted">Body</span>
              <textarea
                required
                value={form.body}
                onChange={(event) => updateField('body', event.target.value)}
                className="min-h-28 resize-y border border-app-border bg-app-bg p-3 text-sm text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
              />
            </label>
            <Field id="ad-url" label="Landing URL">
              <Input
                id="ad-url"
                required
                value={form.landingUrl}
                onChange={(event) => updateField('landingUrl', event.target.value)}
              />
            </Field>
            <Field id="ad-image" label="Image URL">
              <Input
                id="ad-image"
                value={form.imageUrl}
                onChange={(event) => updateField('imageUrl', event.target.value)}
              />
            </Field>
            <Field id="ad-placement" label="Placement">
              <Input
                id="ad-placement"
                value={form.placement}
                onChange={(event) => updateField('placement', event.target.value)}
              />
            </Field>
            <Field id="ad-target" label="Target audience">
              <Input
                id="ad-target"
                value={form.targetAudience}
                onChange={(event) => updateField('targetAudience', event.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="ad-start" label="Starts">
                <Input
                  id="ad-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => updateField('startsAt', event.target.value)}
                />
              </Field>
              <Field id="ad-end" label="Ends">
                <Input
                  id="ad-end"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => updateField('endsAt', event.target.value)}
                />
              </Field>
            </div>
            <Field id="ad-budget" label="Budget note">
              <Input
                id="ad-budget"
                value={form.budgetNote}
                onChange={(event) => updateField('budgetNote', event.target.value)}
              />
            </Field>
            <button
              type="submit"
              disabled={isSaving || Boolean(selectedCampaign && !editableStatuses.includes(selectedCampaign.status))}
              className="h-10 border border-app-action bg-app-action font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              Save draft
            </button>
          </form>
        </aside>
      </div>
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
