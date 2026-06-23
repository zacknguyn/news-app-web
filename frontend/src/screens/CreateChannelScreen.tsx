import React, { useEffect, useRef, useState } from 'react';
import { FileUp, Info, Layers3, Palette, PencilLine, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import { refreshChannels } from '../lib/useChannels';

const accents = ['var(--color-app-action)', '#2563EB', '#904900', '#ba1a1a', '#18181b'];
const slugify = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const CreateChannelScreen: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [accent, setAccent] = useState(accents[0]);
  const [banner, setBanner] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canSubmit = name.trim().length >= 3 && name.trim().length <= 100 && description.trim().length >= 20 && description.trim().length <= 500;

  useEffect(() => {
    if (!banner) { setPreview(''); return; }
    const url = URL.createObjectURL(banner); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [banner]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return setError('Title must be 3-100 characters and description 20-500 characters.');
    setBusy(true); setError('');
    try {
      const media = banner ? await backendApi.uploadMedia(banner, `${name.trim()} banner`) : null;
      const topic = await backendApi.createTopic({ name: name.trim(), description: description.trim(), visibility, banner: media?.url });
      refreshChannels();
      navigate(`/app/c/${backendTopicToChannel(topic).slug}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create channel.'); }
    finally { setBusy(false); }
  };

  return <div className="app-page mx-auto max-w-[1280px]">
    <header className="mb-8">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-app-muted">Channel builder</p>
      <h1 className="text-[32px] font-bold tracking-tight text-app-heading md:text-[40px]">Create Intelligence Channel</h1>
      <p className="mt-2 text-sm text-app-muted">Design a collaborative workspace for focused news analysis and reporting.</p>
    </header>
    <div className="grid items-start gap-8 lg:grid-cols-12">
      <form onSubmit={submit} className="space-y-8 rounded-xl border border-app-border bg-app-surface p-5 shadow-[var(--shadow-subtle)] sm:p-8 lg:col-span-7">
        {error && <div role="alert" className="rounded-lg border border-state-error-border bg-state-error-bg px-4 py-3 text-sm text-state-error">{error}</div>}
        <section className="space-y-6">
          <Section icon={PencilLine}>Identity &amp; Naming</Section>
          <Field label="Channel title" id="title" note={`${name.trim().length}/100 - minimum 3`}><input id="title" className="channel-input" value={name} maxLength={100} placeholder="e.g., Global Semiconductor Intelligence" onChange={e => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} /></Field>
          <Field label="Description" id="description" note={`${description.trim().length}/500 - minimum 20`}><textarea id="description" className="channel-input min-h-28 resize-y" rows={3} value={description} maxLength={500} placeholder="Define the scope and mission of this channel..." onChange={e => setDescription(e.target.value)} /></Field>
          <Field label="Custom slug" id="slug"><div className="flex min-w-0"><span className="flex shrink-0 items-center rounded-l-lg border border-r-0 border-app-border bg-app-surface-alt px-3 text-xs text-app-muted">tourane.news/c/</span><input id="slug" className="channel-input min-w-0 rounded-l-none" value={slug} placeholder="global-tech" onChange={e => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} /></div></Field>
        </section>
        <section className="space-y-6">
          <Section icon={ShieldCheck}>Visibility</Section>
          <Field label="Community type" id="visibility"><select id="visibility" className="channel-input" value={visibility} onChange={e => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}><option value="PUBLIC">Public — Anyone can join and post</option><option value="PRIVATE">Private — Invite-only, controlled posting</option></select><p className="mt-2 text-xs leading-relaxed text-app-muted">Private communities require invitations to join. The owner can grant or revoke posting permissions per member.</p></Field>
        </section>
        <section className="space-y-6">
          <Section icon={Palette}>Visual Branding</Section>
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Accent color"><div className="flex gap-3">{accents.map(color => <button key={color} type="button" aria-label={`Select ${color}`} onClick={() => setAccent(color)} className={`h-8 w-8 rounded-full hover:scale-110 ${accent === color ? 'ring-2 ring-app-action ring-offset-2' : ''}`} style={{ backgroundColor: color }} />)}</div></Field>
            <Field label="Banner photo"><input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={e => setBanner(e.target.files?.[0] ?? null)} /><button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-20 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-app-border bg-app-surface-alt/40 p-4 hover:border-app-action"><FileUp className="mb-1 h-5 w-5 text-app-faint" /><span className="max-w-full truncate text-xs text-app-muted">{banner?.name || 'Choose an image to upload'}</span></button></Field>
          </div>
        </section>
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-app-border pt-6 sm:flex-row"><button type="button" onClick={() => navigate(-1)} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-app-muted hover:bg-app-surface-alt">Discard draft</button><button type="submit" disabled={!canSubmit || busy} className="rounded-lg bg-app-action px-8 py-2.5 text-sm font-semibold text-app-on-action shadow-lg hover:bg-app-action-hover disabled:opacity-40">{busy ? 'Creating channel...' : 'Create channel'}</button></div>
      </form>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-5">
        <div className="flex justify-between px-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-app-muted"><span>Live preview</span><span className="flex items-center gap-2"><i className="h-2 w-2 animate-pulse rounded-full bg-red-600" />Editor view</span></div>
        <div className="overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-[var(--shadow-raised)]">
          <div className="relative h-32" style={{ backgroundColor: accent }}><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,.65),transparent_55%)] opacity-50" />{preview && <img loading="lazy" src={preview} alt="Channel banner preview" className="absolute inset-0 h-full w-full object-cover" />}<div className="absolute -bottom-8 left-6 z-10 grid h-16 w-16 place-items-center rounded-xl border-[6px] border-white text-white shadow-md" style={{ backgroundColor: accent }}><Layers3 className="h-7 w-7" /></div></div>
          <div className="p-6 pt-12"><div className="mb-4 flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-2xl font-semibold text-app-heading">{name.trim() || 'Global Tech News'}</h2><p className="truncate text-xs font-bold" style={{ color: accent }}>tourane.news/c/{slug || slugify(name) || 'global-tech'}</p></div><span className="shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase" style={{ borderColor: `${accent}33`, backgroundColor: `${accent}14`, color: accent }}>{visibility === 'PRIVATE' ? 'Private' : 'Public'}</span></div><p className="mb-6 min-h-16 text-sm leading-relaxed text-app-muted">{description.trim() || 'The live description of your channel will appear here. Start typing to shape its mission in real time.'}</p><div className="grid grid-cols-3 border-t border-app-border pt-6 text-center"><Stat v="0" l="Members" /><Stat v="0" l="Posts" border /><Stat v={visibility === 'PRIVATE' ? 'Invite' : 'Open'} l="Access" /></div></div>
          <div className="flex justify-end bg-app-surface-alt px-6 py-4"><button disabled className="rounded-lg px-4 py-1.5 text-xs font-bold opacity-50" style={{ backgroundColor: `${accent}14`, color: accent }}>Join channel</button></div>
        </div>
        <div className="flex gap-3 rounded-xl border border-app-border bg-app-surface-alt/50 p-4"><Info className="h-4 w-4 shrink-0 text-app-action" /><p className="text-xs text-app-muted">This is how your channel card will appear in the <strong className="text-app-heading">Intelligence Directory</strong> and user dashboards.</p></div>
      </aside>
    </div>
  </div>;
};

type Icon = React.ComponentType<{ className?: string }>;
const Section = ({ icon: I, children }: { icon: Icon; children: React.ReactNode }) => <div className="flex items-center gap-2 border-b border-app-border pb-2"><I className="h-5 w-5 text-app-action" /><h2 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-app-muted">{children}</h2></div>;
const Field = ({ label, id, note, children }: { label: string; id?: string; note?: string; children: React.ReactNode }) => <div><label htmlFor={id} className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-app-muted">{label}</label>{children}{note && <p className="mt-2 text-right font-mono text-[10px] text-app-faint">{note}</p>}</div>;
const Stat = ({ v, l, border = false }: { v: string; l: string; border?: boolean }) => <div className={border ? 'border-x border-app-border' : ''}><b className="block text-xl text-app-heading">{v}</b><span className="text-[10px] font-bold uppercase text-app-muted">{l}</span></div>;
export default CreateChannelScreen;
