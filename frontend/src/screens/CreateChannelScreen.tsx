import React, { useEffect, useRef, useState } from 'react';
import { FileUp, Info, Layers3, Palette, PencilLine, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import { refreshChannels } from '../lib/useChannels';
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';

const accents = ['var(--color-app-action)', '#2563EB', '#904900', '#ba1a1a', '#18181b'];
const slugify = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const CreateChannelScreen: React.FC = () => {
  const isVi = isVietnamese(useAppLanguage());
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
  const copy = isVi
    ? {
        validation: 'Tên phải dài 3-100 ký tự và mô tả dài 20-500 ký tự.',
        createFailed: 'Không thể tạo kênh.',
        builder: 'Trình tạo kênh',
        title: 'Tạo kênh phân tích',
        subtitle: 'Thiết kế không gian cộng tác cho phân tích và đăng tin theo chủ đề.',
        identity: 'Định danh & đặt tên',
        channelTitle: 'Tên kênh',
        titlePlaceholder: 'VD: Tin công nghệ toàn cầu',
        description: 'Mô tả',
        descriptionPlaceholder: 'Mô tả phạm vi và mục tiêu của kênh...',
        customSlug: 'Slug tùy chỉnh',
        visibility: 'Quyền truy cập',
        communityType: 'Loại cộng đồng',
        publicOption: 'Công khai - Ai cũng có thể tham gia và đăng bài',
        privateOption: 'Riêng tư - Chỉ tham gia bằng lời mời',
        privateHint: 'Cộng đồng riêng tư cần lời mời để tham gia. Chủ kênh có thể cấp hoặc thu hồi quyền đăng bài cho từng thành viên.',
        visual: 'Nhận diện hình ảnh',
        accent: 'Màu nhấn',
        banner: 'Ảnh banner',
        chooseImage: 'Chọn ảnh để tải lên',
        discard: 'Bỏ bản nháp',
        creating: 'Đang tạo kênh...',
        create: 'Tạo kênh',
        livePreview: 'Xem trước',
        editorView: 'Góc nhìn biên tập',
        sampleName: 'Tin công nghệ toàn cầu',
        private: 'Riêng tư',
        public: 'Công khai',
        descriptionPreview: 'Mô tả kênh sẽ hiển thị ở đây. Bắt đầu nhập để xem trước theo thời gian thực.',
        members: 'Thành viên',
        posts: 'Bài viết',
        invite: 'Mời',
        open: 'Mở',
        access: 'Truy cập',
        join: 'Tham gia',
        cardHint: 'Đây là cách thẻ kênh của bạn xuất hiện trong danh mục cộng đồng và dashboard người dùng.',
      }
    : {
        validation: 'Title must be 3-100 characters and description 20-500 characters.',
        createFailed: 'Unable to create channel.',
        builder: 'Channel builder',
        title: 'Create Intelligence Channel',
        subtitle: 'Design a collaborative workspace for focused news analysis and reporting.',
        identity: 'Identity & Naming',
        channelTitle: 'Channel title',
        titlePlaceholder: 'e.g., Global Semiconductor Intelligence',
        description: 'Description',
        descriptionPlaceholder: 'Define the scope and mission of this channel...',
        customSlug: 'Custom slug',
        visibility: 'Visibility',
        communityType: 'Community type',
        publicOption: 'Public - Anyone can join and post',
        privateOption: 'Private - Invite-only, controlled posting',
        privateHint: 'Private communities require invitations to join. The owner can grant or revoke posting permissions per member.',
        visual: 'Visual Branding',
        accent: 'Accent color',
        banner: 'Banner photo',
        chooseImage: 'Choose an image to upload',
        discard: 'Discard draft',
        creating: 'Creating channel...',
        create: 'Create channel',
        livePreview: 'Live preview',
        editorView: 'Editor view',
        sampleName: 'Global Tech News',
        private: 'Private',
        public: 'Public',
        descriptionPreview: 'The live description of your channel will appear here. Start typing to shape its mission in real time.',
        members: 'Members',
        posts: 'Posts',
        invite: 'Invite',
        open: 'Open',
        access: 'Access',
        join: 'Join channel',
        cardHint: 'This is how your channel card will appear in the Intelligence Directory and user dashboards.',
      };

  useEffect(() => {
    if (!banner) { setPreview(''); return; }
    const url = URL.createObjectURL(banner); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [banner]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return setError(copy.validation);
    setBusy(true); setError('');
    try {
      const media = banner ? await backendApi.uploadMedia(banner, `${name.trim()} banner`) : null;
      const topic = await backendApi.createTopic({ name: name.trim(), description: description.trim(), visibility, banner: media?.url });
      refreshChannels();
      navigate(`/app/c/${backendTopicToChannel(topic).slug}`);
    } catch (err) { setError(err instanceof Error ? err.message : copy.createFailed); }
    finally { setBusy(false); }
  };

  return <div className="app-page mx-auto max-w-[1280px]">
    <header className="mb-8">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-app-muted">{copy.builder}</p>
      <h1 className="text-[32px] font-bold tracking-tight text-app-heading md:text-[40px]">{copy.title}</h1>
      <p className="mt-2 text-sm text-app-muted">{copy.subtitle}</p>
    </header>
    <div className="grid items-start gap-8 lg:grid-cols-12">
      <form onSubmit={submit} className="space-y-8 rounded-xl border border-app-border bg-app-surface p-5 shadow-[var(--shadow-subtle)] sm:p-8 lg:col-span-7">
        {error && <div role="alert" className="rounded-lg border border-state-error-border bg-state-error-bg px-4 py-3 text-sm text-state-error">{error}</div>}
        <section className="space-y-6">
          <Section icon={PencilLine}>{copy.identity}</Section>
          <Field label={copy.channelTitle} id="title" note={`${name.trim().length}/100 - ${isVi ? 'tối thiểu 3' : 'minimum 3'}`}><input id="title" className="channel-input" value={name} maxLength={100} placeholder={copy.titlePlaceholder} onChange={e => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} /></Field>
          <Field label={copy.description} id="description" note={`${description.trim().length}/500 - ${isVi ? 'tối thiểu 20' : 'minimum 20'}`}><textarea id="description" className="channel-input min-h-28 resize-y" rows={3} value={description} maxLength={500} placeholder={copy.descriptionPlaceholder} onChange={e => setDescription(e.target.value)} /></Field>
          <Field label={copy.customSlug} id="slug"><div className="flex min-w-0"><span className="flex shrink-0 items-center rounded-l-lg border border-r-0 border-app-border bg-app-surface-alt px-3 text-xs text-app-muted">tourane.news/c/</span><input id="slug" className="channel-input min-w-0 rounded-l-none" value={slug} placeholder="global-tech" onChange={e => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} /></div></Field>
        </section>
        <section className="space-y-6">
          <Section icon={ShieldCheck}>{copy.visibility}</Section>
          <Field label={copy.communityType} id="visibility"><select id="visibility" className="channel-input" value={visibility} onChange={e => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}><option value="PUBLIC">{copy.publicOption}</option><option value="PRIVATE">{copy.privateOption}</option></select><p className="mt-2 text-xs leading-relaxed text-app-muted">{copy.privateHint}</p></Field>
        </section>
        <section className="space-y-6">
          <Section icon={Palette}>{copy.visual}</Section>
          <div className="grid gap-6 md:grid-cols-2">
            <Field label={copy.accent}><div className="flex gap-3">{accents.map(color => <button key={color} type="button" aria-label={`${isVi ? 'Chọn' : 'Select'} ${color}`} onClick={() => setAccent(color)} className={`h-8 w-8 rounded-full hover:scale-110 ${accent === color ? 'ring-2 ring-app-action ring-offset-2' : ''}`} style={{ backgroundColor: color }} />)}</div></Field>
            <Field label={copy.banner}><input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={e => setBanner(e.target.files?.[0] ?? null)} /><button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-20 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-app-border bg-app-surface-alt/40 p-4 hover:border-app-action"><FileUp className="mb-1 h-5 w-5 text-app-faint" /><span className="max-w-full truncate text-xs text-app-muted">{banner?.name || copy.chooseImage}</span></button></Field>
          </div>
        </section>
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-app-border pt-6 sm:flex-row"><button type="button" onClick={() => navigate(-1)} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-app-muted hover:bg-app-surface-alt">{copy.discard}</button><button type="submit" disabled={!canSubmit || busy} className="rounded-lg bg-app-action px-8 py-2.5 text-sm font-semibold text-app-on-action shadow-lg hover:bg-app-action-hover disabled:opacity-40">{busy ? copy.creating : copy.create}</button></div>
      </form>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-5">
        <div className="flex justify-between px-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-app-muted"><span>{copy.livePreview}</span><span className="flex items-center gap-2"><i className="h-2 w-2 animate-pulse rounded-full bg-red-600" />{copy.editorView}</span></div>
        <div className="overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-[var(--shadow-raised)]">
          <div className="relative h-32" style={{ backgroundColor: accent }}><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,.65),transparent_55%)] opacity-50" />{preview && <img loading="lazy" src={preview} alt="Channel banner preview" className="absolute inset-0 h-full w-full object-cover" />}<div className="absolute -bottom-8 left-6 z-10 grid h-16 w-16 place-items-center rounded-xl border-[6px] border-white text-white shadow-md" style={{ backgroundColor: accent }}><Layers3 className="h-7 w-7" /></div></div>
          <div className="p-6 pt-12"><div className="mb-4 flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-2xl font-semibold text-app-heading">{name.trim() || copy.sampleName}</h2><p className="truncate text-xs font-bold" style={{ color: accent }}>tourane.news/c/{slug || slugify(name) || 'global-tech'}</p></div><span className="shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase" style={{ borderColor: `${accent}33`, backgroundColor: `${accent}14`, color: accent }}>{visibility === 'PRIVATE' ? copy.private : copy.public}</span></div><p className="mb-6 min-h-16 text-sm leading-relaxed text-app-muted">{description.trim() || copy.descriptionPreview}</p><div className="grid grid-cols-3 border-t border-app-border pt-6 text-center"><Stat v="0" l={copy.members} /><Stat v="0" l={copy.posts} border /><Stat v={visibility === 'PRIVATE' ? copy.invite : copy.open} l={copy.access} /></div></div>
          <div className="flex justify-end bg-app-surface-alt px-6 py-4"><button disabled className="rounded-lg px-4 py-1.5 text-xs font-bold opacity-50" style={{ backgroundColor: `${accent}14`, color: accent }}>{copy.join}</button></div>
        </div>
        <div className="flex gap-3 rounded-xl border border-app-border bg-app-surface-alt/50 p-4"><Info className="h-4 w-4 shrink-0 text-app-action" /><p className="text-xs text-app-muted">{copy.cardHint}</p></div>
      </aside>
    </div>
  </div>;
};

type Icon = React.ComponentType<{ className?: string }>;
const Section = ({ icon: I, children }: { icon: Icon; children: React.ReactNode }) => <div className="flex items-center gap-2 border-b border-app-border pb-2"><I className="h-5 w-5 text-app-action" /><h2 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-app-muted">{children}</h2></div>;
const Field = ({ label, id, note, children }: { label: string; id?: string; note?: string; children: React.ReactNode }) => <div><label htmlFor={id} className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-app-muted">{label}</label>{children}{note && <p className="mt-2 text-right font-mono text-[10px] text-app-faint">{note}</p>}</div>;
const Stat = ({ v, l, border = false }: { v: string; l: string; border?: boolean }) => <div className={border ? 'border-x border-app-border' : ''}><b className="block text-xl text-app-heading">{v}</b><span className="text-[10px] font-bold uppercase text-app-muted">{l}</span></div>;
export default CreateChannelScreen;
