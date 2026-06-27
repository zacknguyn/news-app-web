import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShieldCheck,
  MessageSquare,
  TrendingUp,
  Settings,
  Mail,
  Share2,
  ImagePlus,
  Link2,
} from 'lucide-react';
import { backendApi, type BackendReadingProgressDTO } from '../lib/api';
import { backendPostToPost, backendAuthorToUser, backendUserToUser } from '../lib/backendAdapters';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { Field, Input, TextArea } from '../components/ui/Input';
import { HelperTip } from '../components/ui/Tooltip';
import type { Post, User } from '../types';
import { getHighlights, type SavedHighlight } from '../lib/highlights';
import { stripHtml } from '../lib/richContent';
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';
import { localizeLabel } from '../lib/localizeLabel';

type ProfileTab = 'articles' | 'quotes' | 'history';

type ProfileDraft = {
  name: string;
  avatarUrl: string;
  profileHeadline: string;
  profileBio: string;
  profileTags: string;
  profileAccent: string;
  selectedBadge: string;
};

type AccentStyle = {
  header: string;
  plate: string;
  avatar: string;
  badge: string;
  tag: string;
  section: string;
  label: string;
  option: string;
  swatch: string;
};

const accentOptions = [
  { value: '', label: 'None', description: 'Default editorial profile.' },
  { value: 'signal', label: 'Signal', description: 'Red accent for active supporters.' },
  { value: 'ink', label: 'Ink', description: 'High-contrast newsroom profile.' },
  { value: 'archive', label: 'Archive', description: 'Muted research-desk tone.' },
];

const defaultAccentClass: AccentStyle = {
  header: 'border-app-heading',
  plate: 'bg-app-surface',
  avatar: 'border-app-heading outline-app-border',
  badge: 'border-app-action bg-app-action-faint text-app-action',
  tag: 'border-app-border text-app-heading',
  section: 'border-app-border',
  label: 'text-app-muted',
  option: 'border-app-heading bg-app-surface',
  swatch: 'border-app-heading bg-app-heading',
};

const profileAccentClasses: Record<string, AccentStyle> = {
  signal: {
    header: 'border-app-action',
    plate: 'bg-app-action-faint',
    avatar: 'border-app-action outline-app-action-soft',
    badge: 'border-app-action bg-app-action text-app-on-action',
    tag: 'border-app-action bg-app-action-faint text-app-action',
    section: 'border-app-action',
    label: 'text-app-action',
    option: 'border-app-action bg-app-surface',
    swatch: 'border-app-action bg-app-action',
  },
  ink: {
    header: 'border-app-heading',
    plate: 'bg-app-surface-alt',
    avatar: 'border-app-heading outline-app-heading',
    badge: 'border-app-heading bg-app-heading text-app-bg',
    tag: 'border-app-heading bg-app-surface text-app-heading',
    section: 'border-app-heading',
    label: 'text-app-heading',
    option: 'border-app-heading bg-app-surface',
    swatch: 'border-app-heading bg-app-heading',
  },
  archive: {
    header: 'border-app-muted',
    plate: 'bg-app-surface-alt',
    avatar: 'border-app-muted outline-app-border',
    badge: 'border-app-muted bg-app-surface-alt text-app-muted',
    tag: 'border-app-muted bg-app-surface-alt text-app-muted',
    section: 'border-app-muted',
    label: 'text-app-muted',
    option: 'border-app-muted bg-app-surface',
    swatch: 'border-app-muted bg-app-muted',
  },
};

const formatTime = (date: string, locale = 'en-US') =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date),
  );

export const ProfileScreen: React.FC = () => {
  const language = useAppLanguage();
  const isVi = isVietnamese(language);
  const { username } = useParams();
  const { user: authUser, updateUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('articles');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [readingHistory, setReadingHistory] = useState<BackendReadingProgressDTO[]>([]);

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: '',
    avatarUrl: '',
    profileHeadline: '',
    profileBio: '',
    profileTags: '',
    profileAccent: '',
    selectedBadge: '',
  });
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const copy = isVi
    ? {
        contributorBackend: 'Tác giả này đăng bài qua hệ thống tòa soạn; lịch sử bài viết chưa hiển thị ở đây.',
        unavailable: 'Không tải được hồ sơ.',
        avatarUploaded: 'Đã tải ảnh đại diện.',
        avatarFailed: 'Không thể tải ảnh đại diện.',
        nameRequired: 'Tên hiển thị không được để trống.',
        saved: 'Đã lưu hồ sơ.',
        saveFailed: 'Không thể lưu hồ sơ.',
        loading: 'Đang tải hồ sơ...',
        notFound: 'Không tìm thấy tác giả.',
        seniorEditor: 'Biên tập viên',
        contributor: 'Cộng tác viên',
        bureau: 'Hồ sơ Tourane News',
        editProfile: 'Sửa hồ sơ',
        pitch: 'Liên hệ tác giả',
        share: 'Chia sẻ',
        copied: 'Đã sao chép liên kết hồ sơ.',
        reputation: 'Uy tín',
        top: 'Top',
        dispatches: 'Bài viết',
        bylines: 'Bài đã đăng',
        snippets: 'Trích đoạn',
        highlights: 'Highlight',
        articles: 'Bài viết',
        savedQuotes: 'Trích dẫn đã lưu',
        history: 'Lịch sử đọc',
        noReports: 'Chưa có bài viết nào.',
        minRead: 'phút đọc',
        noQuotes: 'Chưa lưu trích dẫn nào. Bôi đen nội dung trong bài đọc để lưu trích dẫn ở đây.',
        source: 'Nguồn',
        noHistory: 'Chưa có lịch sử đọc. Tiến độ đọc sẽ được ghi nhận khi bạn đọc bài.',
        read: 'đã đọc',
        global: 'Tin tức tổng hợp',
        lastRead: 'Đọc lần cuối',
        accountSettings: 'Cài đặt tài khoản',
        customize: 'Tùy chỉnh hồ sơ',
        close: 'Đóng cài đặt hồ sơ',
        publicIdentity: 'Danh tính công khai',
        identityHint: 'Đổi tên hiển thị và ảnh đại diện.',
        displayName: 'Tên hiển thị',
        displayPlaceholder: 'Tên công khai của bạn',
        avatarUrl: 'URL ảnh đại diện',
        avatarHint: 'Dán URL ảnh hoặc tải ảnh từ máy.',
        uploading: 'Đang tải...',
        upload: 'Tải ảnh',
        headline: 'Dòng giới thiệu',
        headlineHint: 'Dòng ngắn nằm trên byline.',
        headlinePlaceholder: 'Độc giả độc lập',
        bio: 'Tiểu sử',
        bioHint: 'Hiển thị trên hồ sơ của bạn.',
        bioPlaceholder: 'Bạn đọc, theo dõi hoặc quan tâm điều gì?',
        profileTags: 'Thẻ hồ sơ',
        tagsHint: 'Ngăn cách bằng dấu phẩy. Tối đa 8 thẻ.',
        tagsLocked: 'Mở khóa với Reader Plus hoặc cao hơn.',
        badge: 'Huy hiệu chọn',
        noBadge: 'Không chọn huy hiệu',
        profileAccent: 'Màu nhấn hồ sơ',
        active: 'Đang chọn',
        manage: 'Quản lý gói đăng ký',
        saving: 'Đang lưu...',
        saveProfile: 'Lưu hồ sơ',
      }
    : {
        contributorBackend: 'This contributor files through the newsroom backend; their dispatch history is not surfaced here yet.',
        unavailable: 'Profile unavailable.',
        avatarUploaded: 'Avatar uploaded.',
        avatarFailed: 'Unable to upload avatar.',
        nameRequired: 'Display name cannot be empty.',
        saved: 'Profile customization saved.',
        saveFailed: 'Unable to save profile customization.',
        loading: 'Loading profile...',
        notFound: 'Contributor not found.',
        seniorEditor: 'Senior Editor',
        contributor: 'Contributor',
        bureau: 'Global Intelligence Bureau',
        editProfile: 'Edit Profile',
        pitch: 'Pitch Contributor',
        share: 'Share',
        copied: 'Profile link copied to clipboard.',
        reputation: 'REPUTATION',
        top: 'TOP',
        dispatches: 'DISPATCHES',
        bylines: 'BYLINES',
        snippets: 'SNIPPETS',
        highlights: 'HIGHLIGHTS',
        articles: 'Articles',
        savedQuotes: 'Saved Quotes',
        history: 'Reading History',
        noReports: 'No reports filed yet.',
        minRead: 'MIN READ',
        noQuotes: 'No quotes saved yet. Highlight text inside any report to save a quote here.',
        source: 'Source',
        noHistory: 'No reading history recorded. Reading progress will be tracked as you read articles.',
        read: 'READ',
        global: 'Global Intelligence',
        lastRead: 'Last read',
        accountSettings: 'Account settings',
        customize: 'Customize profile',
        close: 'Close account settings',
        publicIdentity: 'Public identity',
        identityHint: 'Change your display name and avatar.',
        displayName: 'Display name',
        displayPlaceholder: 'Your public name',
        avatarUrl: 'Avatar image URL',
        avatarHint: 'Paste an image URL, or upload one from your device.',
        uploading: 'Uploading...',
        upload: 'Upload',
        headline: 'Headline',
        headlineHint: 'Short line above your byline.',
        headlinePlaceholder: 'Independent reader',
        bio: 'Bio',
        bioHint: 'Shown on your profile.',
        bioPlaceholder: 'What do you read, cover, or care about?',
        profileTags: 'Profile tags',
        tagsHint: 'Comma-separated. Up to 8 tags.',
        tagsLocked: 'Unlock with Reader Plus or higher.',
        badge: 'Selected badge',
        noBadge: 'No badge',
        profileAccent: 'Profile accent',
        active: 'Active',
        manage: 'Manage subscription',
        saving: 'Saving...',
        saveProfile: 'Save Profile',
      };

  const profileUserId = username && /^\d+$/.test(username) ? username : null;
  const isOwnProfile = Boolean(authUser && (username === authUser.username || username === authUser.id));

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (!username) return;
      setIsLoading(true);
      setNotice('');
      try {
        if (profileUserId) {
          const profile =
            authUser && profileUserId === authUser.id
              ? await backendApi.getCurrentUser()
              : await backendApi.getUserProfile(profileUserId);
          const [posts, hl, history] = await Promise.all([
            backendApi.getPostsByUser(profile.id, 0, 20).catch(() => null),
            authUser && profileUserId === authUser.id ? getHighlights().catch(() => []) : Promise.resolve([]),
            authUser && profileUserId === authUser.id ? backendApi.getReadingProgress().catch(() => []) : Promise.resolve([]),
          ]);
          if (!isMounted) return;
          setProfileUser(backendUserToUser(profile));
          setUserPosts(posts?.content.map(backendPostToPost) || []);
          setHighlights(hl);
          setHighlightsCount(hl.length);
          setReadingHistory(history);
          return;
        }
        if (authUser && username === authUser.username) {
          const currentUser = await backendApi.getCurrentUser();
          const [posts, hl, history] = await Promise.all([
            backendApi.getPostsByUser(currentUser.id, 0, 20).catch(() => null),
            getHighlights().catch(() => []),
            backendApi.getReadingProgress().catch(() => []),
          ]);
          if (!isMounted) return;
          setProfileUser(backendUserToUser(currentUser));
          setUserPosts(posts?.content.map(backendPostToPost) || []);
          setHighlights(hl);
          setHighlightsCount(hl.length);
          setReadingHistory(history);
          return;
        }
        const author = await backendApi.getAuthorBySlug(username || '');
        if (!isMounted) return;
        setProfileUser(backendAuthorToUser(author));
        setUserPosts([]);
        setNotice(copy.contributorBackend);
      } catch (error) {
        if (!isMounted) return;
        setProfileUser(null);
        setUserPosts([]);
        setNotice(error instanceof Error ? error.message : copy.unavailable);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [authUser, profileUserId, username]);

  const groupedPosts = useMemo(() => {
    const groups: Record<string, Post[]> = {};
    userPosts.forEach((post) => {
      const date = new Date(post.createdAt);
      const key = date.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(post);
    });
    return groups;
  }, [userPosts]);

  const entitlements = profileUser?.entitlements || [];
  const canUseTags = entitlements.includes('PROFILE_TAGS');
  const canUseBadges = entitlements.includes('PROFILE_BADGES');
  const canUseAccent = entitlements.includes('CUSTOM_PROFILE_ACCENT');
  const badgeOptions = useMemo(
    () => Array.from(new Set((profileUser?.unlockedBadges || []).map((badge) => badge.trim()).filter(Boolean))),
    [profileUser?.unlockedBadges],
  );
  const effectiveProfileAccent =
    isOwnProfile && isSettingsOpen ? profileDraft.profileAccent : profileUser?.profileAccent;
  const accentClass = profileAccentClasses[effectiveProfileAccent || ''] || defaultAccentClass;

  useEffect(() => {
    if (!profileUser) return;
    setProfileDraft({
      name: profileUser.name || '',
      avatarUrl: profileUser.avatarUrl || '',
      profileHeadline: profileUser.profileHeadline || '',
      profileBio: profileUser.profileBio || profileUser.bio || '',
      profileTags: (profileUser.profileTags || []).join(', '),
      profileAccent: profileUser.profileAccent || '',
      selectedBadge: profileUser.selectedBadge || '',
    });
  }, [profileUser]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const media = await backendApi.uploadMedia(file, 'profile avatar');
      setProfileDraft((current) => ({ ...current, avatarUrl: media.url }));
      toast.success(copy.avatarUploaded);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.avatarFailed);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleSaveCustomization = async () => {
    if (!profileUser || isSavingCustomization) return;
    const nextName = profileDraft.name.trim();
    const nextAvatar = profileDraft.avatarUrl.trim();
    if (!nextName) {
      toast.error(copy.nameRequired);
      return;
    }
    setIsSavingCustomization(true);
    try {
      if (nextName !== profileUser.name || nextAvatar !== (profileUser.avatarUrl || '')) {
        await backendApi.updateCurrentUser({
          name: nextName,
          avatar: nextAvatar,
        });
      }
      const updated = await backendApi.updateMyProfileCustomization({
        profileHeadline: profileDraft.profileHeadline,
        profileBio: profileDraft.profileBio,
        profileTags: profileDraft.profileTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        profileAccent: profileDraft.profileAccent,
        selectedBadge: profileDraft.selectedBadge || undefined,
      });
      const nextUser = backendUserToUser(updated);
      setProfileUser(nextUser);
      updateUser(nextUser);
      setIsSettingsOpen(false);
      toast.success(copy.saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.saveFailed);
    } finally {
      setIsSavingCustomization(false);
    }
  };

  const tabs = useMemo(() => {
    if (isOwnProfile) {
      return [
        { id: 'articles', label: copy.articles },
        { id: 'quotes', label: copy.savedQuotes },
        { id: 'history', label: copy.history },
      ];
    }
    return [{ id: 'articles', label: copy.articles }];
  }, [copy.articles, copy.history, copy.savedQuotes, isOwnProfile]);

  if (isLoading)
    return (
      <div className="px-4 py-20 flex justify-center items-center h-64">
        <span className="animate-pulse text-sm text-app-muted font-mono">
          {copy.loading}
        </span>
      </div>
    );
  if (!profileUser) return <div className="px-4 py-20 text-sm italic text-app-muted">{copy.notFound}</div>;

  return (
    <div className="w-full max-w-[640px] mx-auto pt-10 pb-20 px-4">
      {/* Profile Header */}
      <section className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-6">
          <img loading="lazy" decoding="async"
            className="w-32 h-32 rounded-full object-cover border-4 border-app-border shadow-lg"
            src={
              profileUser.avatarUrl ||
              `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
            }
            alt=""
          />
          {profileUser.isVerified && (
            <div className="absolute bottom-1 right-1 bg-app-action p-1.5 rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>
        <h1 className="font-serif text-3xl font-bold text-app-text mb-2">
          {profileUser.name}
        </h1>
        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-app-muted">
          <span className="px-3 py-1 rounded-full bg-app-action-soft text-app-action font-bold uppercase tracking-wider">
            {profileUser.role === 'ADMIN' ? copy.seniorEditor : copy.contributor}
          </span>
          <span>•</span>
          <span className="uppercase tracking-wider">
            {profileUser.selectedBadge || copy.bureau}
          </span>
        </div>
        {profileUser.profileHeadline && (
          <p className="text-[10px] text-app-muted uppercase tracking-wider mb-3 font-bold">
            {profileUser.profileHeadline}
          </p>
        )}
        {(profileUser.profileBio || profileUser.bio) && (
          <p className="font-serif text-[15px] leading-relaxed text-app-text max-w-md mx-auto italic">
            "{profileUser.profileBio || profileUser.bio}"
          </p>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex justify-center gap-3">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 bg-app-action text-app-on-action rounded-lg text-xs font-bold shadow hover:bg-app-action-hover transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> {copy.editProfile}
            </button>
          ) : (
            <a
              href={`mailto:${profileUser.email || ''}`}
              className="px-4 py-2 bg-app-action text-app-on-action rounded-lg text-xs font-bold shadow hover:bg-app-action-hover transition-all flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> {copy.pitch}
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success(copy.copied);
            }}
            className="px-4 py-2 bg-app-surface-alt text-app-text border border-app-border rounded-lg text-xs font-bold hover:bg-app-surface-alt transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-app-muted" /> {copy.share}
          </button>
        </div>
      </section>

      {notice && (
        <Alert tone="info" className="mb-8">
          {notice}
        </Alert>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-3 gap-4 mb-12">
        <div className="bg-app-surface border border-app-border p-5 rounded-xl text-center shadow-sm hover:border-app-action-soft hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-[10px] font-bold text-app-muted mb-1 tracking-wider uppercase">{copy.reputation}</div>
          <div className="font-serif text-[28px] font-bold text-app-text">{profileUser.trustScore}</div>
          <div className="flex items-center justify-center text-[10px] text-app-action mt-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> {copy.top} {profileUser.trustScore > 500 ? '2%' : profileUser.trustScore > 200 ? '10%' : '25%'}
          </div>
        </div>
        <div className="bg-app-surface border border-app-border p-5 rounded-xl text-center shadow-sm hover:border-app-action-soft hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-[10px] font-bold text-app-muted mb-1 tracking-wider uppercase">{copy.dispatches}</div>
          <div className="font-serif text-[28px] font-bold text-app-text">{userPosts.length}</div>
          <div className="text-[10px] text-app-muted mt-1 font-bold tracking-widest uppercase">{copy.bylines}</div>
        </div>
        <div className="bg-app-surface border border-app-border p-5 rounded-xl text-center shadow-sm hover:border-app-action-soft hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-[10px] font-bold text-app-muted mb-1 tracking-wider uppercase">{copy.snippets}</div>
          <div className="font-serif text-[28px] font-bold text-app-text">{isOwnProfile ? highlightsCount : Math.floor(profileUser.trustScore / 8) || 12}</div>
          <div className="text-[10px] text-app-muted mt-1 font-bold tracking-widest uppercase">{copy.highlights}</div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex border-b border-app-border mb-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ProfileTab)}
            className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-app-action text-app-action font-bold'
                : 'border-transparent text-app-muted hover:text-app-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <section className="space-y-12">
        {activeTab === 'articles' && (
          Object.keys(groupedPosts).length === 0 ? (
            <p className="py-6 text-sm italic text-app-muted text-center">
              {copy.noReports}
            </p>
          ) : (
            Object.entries(groupedPosts).map(([groupName, posts]) => (
              <div key={groupName} className="relative pl-8 border-l border-app-border ml-2">
                {/* Small bullet indicator on the line */}
                <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-app-action ring-4 ring-[var(--color-app-surface)]"></div>
                <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-6">
                  {groupName}
                </div>
                <div className="space-y-8">
                  {posts.map((post) => (
                    <article key={post.id} className="group cursor-pointer">
                      <Link to={`/app/p/${post.id}`} className="flex justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-app-action-soft"></span>
                            <span className="text-[10px] font-bold tracking-wider text-app-action uppercase">
                              {localizeLabel(post.channelName, language)}
                            </span>
                          </div>
                          <h3 className="font-serif text-[18px] font-bold text-app-text group-hover:text-app-action transition-colors mb-2 leading-snug">
                            {post.title}
                          </h3>
                          <p className="text-sm text-app-muted line-clamp-2 leading-relaxed">
                            {stripHtml(post.content)}
                          </p>
                          <div className="mt-4 flex items-center gap-4 text-xs text-app-muted font-bold">
                            <span>{Math.max(1, Math.ceil(stripHtml(post.content).split(/\s+/).length / 200))} {copy.minRead}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" /> {post.commentCount || 0}
                            </div>
                          </div>
                        </div>
                        {post.mediaUrl && (
                          <div className="w-24 h-24 rounded-lg bg-app-surface-alt overflow-hidden flex-shrink-0 border border-app-border">
                            <img loading="lazy" decoding="async" className="w-full h-full object-cover" src={post.mediaUrl} alt="" />
                          </div>
                        )}
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'quotes' && (
          highlights.length === 0 ? (
            <p className="py-6 text-sm italic text-app-muted text-center">
              {copy.noQuotes}
            </p>
          ) : (
            <div className="space-y-6">
              {highlights.map((hl) => (
                <div key={hl.id} className="border border-app-border rounded-xl p-5 bg-app-surface shadow-sm">
                  <p className="font-serif text-[15px] text-app-text italic leading-relaxed mb-4">
                    "{hl.text}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-app-muted font-semibold">
                    <Link to={`/app/p/${hl.postId}`} className="hover:text-app-action hover:underline">
                      {copy.source}: {hl.postTitle}
                    </Link>
                    <span>{formatTime(hl.createdAt, isVi ? 'vi-VN' : 'en-US')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'history' && (
          readingHistory.length === 0 ? (
            <p className="py-6 text-sm italic text-app-muted text-center">
              {copy.noHistory}
            </p>
          ) : (
            <div className="space-y-6">
              {readingHistory.map((history) => (
                <div key={history.id} className="border border-app-border rounded-xl p-5 bg-app-surface shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-app-text max-w-[80%]">
                      <Link to={`/app/p/${history.postId}`} className="hover:text-app-action hover:underline">
                        {history.title}
                      </Link>
                    </h4>
                    <span className="text-[10px] font-bold text-app-action bg-app-action-soft px-2 py-0.5 rounded border border-app-action-soft">
                      {history.progress}% {copy.read}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[var(--color-app-border)] rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-app-action" style={{ width: `${history.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-app-muted font-semibold">
                    <span>{localizeLabel(history.channelName, language) || copy.global}</span>
                    <span>{copy.lastRead}: {formatTime(history.updatedAt, isVi ? 'vi-VN' : 'en-US')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </section>

      {/* Account Settings Modal */}
      {isOwnProfile && isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative z-10 max-h-[min(90dvh,52rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-app-border pb-4 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-app-action">{copy.accountSettings}</p>
                <h2 id="profile-settings-title" className="mt-1 text-xl font-bold text-app-text">{copy.customize}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-app-surface-alt flex items-center justify-center text-app-muted hover:text-app-text transition-colors cursor-pointer"
                aria-label={copy.close}
              >
                x
              </button>
            </div>

            <div className="grid gap-5">
              <section className="rounded-xl border border-app-border bg-app-surface-alt/40 p-4">
                <div className="mb-4 flex items-center gap-4">
                    <img
                    loading="lazy"
                    decoding="async"
                    src={
                      profileDraft.avatarUrl ||
                      profileUser.avatarUrl ||
                      `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
                    }
                    alt=""
                    className="h-16 w-16 rounded-full border-2 border-app-border object-cover bg-app-surface"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-app-action">{copy.publicIdentity}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-app-heading">
                      {profileDraft.name || profileUser.name}
                    </p>
                    <p className="mt-0.5 text-xs text-app-muted">{copy.identityHint}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <Field id="profile-display-name" label={copy.displayName}>
                    <Input
                      id="profile-display-name"
                      value={profileDraft.name}
                      maxLength={100}
                      onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                      placeholder={copy.displayPlaceholder}
                    />
                  </Field>

                  <Field id="profile-avatar-url" label={copy.avatarUrl} hint={copy.avatarHint}>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-faint" />
                        <Input
                          id="profile-avatar-url"
                          value={profileDraft.avatarUrl}
                          onChange={(event) => setProfileDraft((current) => ({ ...current, avatarUrl: event.target.value }))}
                          placeholder="https://example.com/avatar.jpg"
                          className="pl-9"
                        />
                      </div>
                      <input
                        ref={avatarFileRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleAvatarUpload}
                      />
                      <button
                        type="button"
                        onClick={() => avatarFileRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 text-xs font-bold text-app-muted transition-colors hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ImagePlus className="h-4 w-4" />
                        {isUploadingAvatar ? copy.uploading : copy.upload}
                      </button>
                    </div>
                  </Field>
                </div>
              </section>

              <Field id="profile-headline" label={copy.headline} hint={copy.headlineHint}>
                <Input
                  id="profile-headline"
                  value={profileDraft.profileHeadline}
                  maxLength={160}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, profileHeadline: event.target.value }))
                  }
                  placeholder={copy.headlinePlaceholder}
                />
              </Field>
              <Field id="profile-bio" label={copy.bio} hint={copy.bioHint}>
                <TextArea
                  id="profile-bio"
                  value={profileDraft.profileBio}
                  maxLength={2000}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, profileBio: event.target.value }))}
                  placeholder={copy.bioPlaceholder}
                  className="min-h-[8rem]"
                />
              </Field>
              <Field
                id="profile-tags"
                label={copy.profileTags}
                hint={canUseTags ? copy.tagsHint : copy.tagsLocked}
              >
                <Input
                  id="profile-tags"
                  value={profileDraft.profileTags}
                  disabled={!canUseTags}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, profileTags: event.target.value }))}
                  placeholder={isVi ? 'Chính trị, Đà Nẵng, Dữ liệu' : 'Politics, Da Nang, Data'}
                />
              </Field>

              <div className="border-y border-app-border py-4">
                <UnlockRow
                  title={copy.badge}
                  copy={canUseBadges ? 'Badge near your name.' : 'Unlock with Reader Plus.'}
                  helper="Badges are subscription-linked profile markers. Free accounts keep the default profile without a selected badge."
                  locked={!canUseBadges}
                >
                  <select
                    value={profileDraft.selectedBadge}
                    disabled={!canUseBadges || !badgeOptions.length}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, selectedBadge: event.target.value }))
                    }
                    className="h-10 w-full border border-app-border bg-app-surface-alt px-3 text-xs font-semibold text-app-text rounded-lg disabled:opacity-45"
                  >
                    <option value="">{copy.noBadge}</option>
                    {badgeOptions.map((badge) => (
                      <option key={badge} value={badge}>
                        {badge}
                      </option>
                    ))}
                  </select>
                </UnlockRow>
                <UnlockRow
                  title={copy.profileAccent}
                  copy={canUseAccent ? 'Restrained accent preset.' : 'Unlock with Reader Plus.'}
                  helper="Profile accents change the visible framing, badge treatment, and avatar outline on your public profile."
                  locked={!canUseAccent}
                >
                  <div className="grid gap-2">
                    <div className={`border p-3 ${accentClass.section} ${accentClass.plate} rounded-lg`}>
                      <div className={`mb-3 h-1.5 border ${accentClass.header} ${accentClass.plate} rounded`} />
                      <p className={`font-mono text-[10px] uppercase tracking-wider ${accentClass.label}`}>
                        Accent preview: {profileDraft.profileAccent || 'None'}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <img loading="lazy" decoding="async"
                          src={
                            profileDraft.avatarUrl ||
                            profileUser.avatarUrl ||
                            `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
                          }
                          alt=""
                          className={`h-10 w-10 border-2 object-cover outline outline-4 ${accentClass.avatar} rounded-full`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-app-heading">{profileDraft.name || profileUser.name}</p>
                          <p
                            className={`mt-1 inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${accentClass.badge} rounded`}
                          >
                            {profileDraft.selectedBadge || profileUser.selectedBadge || 'Profile badge'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {accentOptions.map((option) => {
                      const isSelected = profileDraft.profileAccent === option.value;
                      const isLocked = !canUseAccent && option.value !== '';
                      const optionAccentClass = profileAccentClasses[option.value]?.option || defaultAccentClass.option;
                      const swatchClass = profileAccentClasses[option.value]?.swatch || defaultAccentClass.swatch;

                      return (
                        <button
                          key={option.value || 'none'}
                          type="button"
                          aria-disabled={isLocked}
                          onClick={() => {
                            if (isLocked) {
                            toast.info(isVi ? 'Màu nhấn hồ sơ mở khóa với Reader Plus.' : 'Profile accents unlock with Reader Plus.');
                              return;
                            }
                            setProfileDraft((current) => ({ ...current, profileAccent: option.value }));
                          }}
                          className={`border p-3 text-left rounded-lg transition-colors ${
                            isLocked ? 'cursor-not-allowed opacity-45' : 'hover:bg-app-surface-alt'
                          } ${isSelected ? optionAccentClass : 'border-app-border'}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-3 w-3 border rounded-full ${swatchClass}`} aria-hidden="true" />
                            <span className="font-mono text-[11px] uppercase tracking-wider text-app-text font-semibold">
                              {option.label}
                            </span>
                            {isSelected && (
                              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-app-action font-bold">
                                {copy.active}
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-xs text-app-muted">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </UnlockRow>
              </div>

              <Link
                to="/app/subscribe"
                className="text-xs font-bold text-app-action hover:underline inline-block"
              >
                {copy.manage}
              </Link>

              <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 border-t border-app-border bg-app-surface px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
                <button
                  type="button"
                  onClick={handleSaveCustomization}
                  disabled={isSavingCustomization}
                  className="inline-flex h-11 w-full items-center justify-center bg-app-action px-6 text-xs font-bold text-white rounded-lg hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer shadow-md transition-all"
                >
                  {isSavingCustomization ? copy.saving : copy.saveProfile}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



const UnlockRow: React.FC<{
  title: string;
  copy: string;
  helper?: string;
  locked: boolean;
  children: React.ReactNode;
}> = ({ title, copy, helper, locked, children }) => (
  <div className="grid gap-3 border-b border-app-border py-4 last:border-b-0">
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-app-text">{title}</p>
        {helper && <HelperTip label={helper} side="right" />}
      </div>
      <p className="mt-1 text-xs text-app-muted leading-relaxed">{copy}</p>
      {locked && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-app-action">Locked</p>}
    </div>
    <div>{children}</div>
  </div>
);

export default ProfileScreen;
