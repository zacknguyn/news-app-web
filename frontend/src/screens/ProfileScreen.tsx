import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShieldCheck,
  MessageSquare,
  TrendingUp,
  Settings,
  Mail,
  Share2,
} from 'lucide-react';
import { backendApi, type BackendReadingProgressDTO } from '../lib/api';
import { backendArticleToPost, backendAuthorToUser, backendUserToUser } from '../lib/backendAdapters';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { Field, Input, TextArea } from '../components/ui/Input';
import { HelperTip } from '../components/ui/Tooltip';
import type { Post, User } from '../types';
import { getHighlights, type SavedHighlight } from '../lib/highlights';
import { stripHtml } from '../lib/richContent';

type ProfileTab = 'articles' | 'quotes' | 'history';

type ProfileDraft = {
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

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date),
  );

export const ProfileScreen: React.FC = () => {
  const { username } = useParams();
  const { user: authUser } = useAuth();
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
    profileHeadline: '',
    profileBio: '',
    profileTags: '',
    profileAccent: '',
    selectedBadge: '',
  });
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);

  const profileUserId = username && /^\d+$/.test(username) ? username : null;
  const isOwnProfile = Boolean(authUser && (username === authUser.username || username === authUser.id));

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setIsLoading(true);
      setNotice('');
      try {
        if (authUser && (username === authUser.username || username === authUser.id)) {
          const currentUser = await backendApi.getCurrentUser();
          const articles = await backendApi.getArticlesByUser(currentUser.id, 0, 10).catch(() => null);
          const hl = await getHighlights().catch(() => []);
          const history = await backendApi.getReadingProgress().catch(() => []);

          if (!isMounted) return;
          setProfileUser(backendUserToUser(currentUser));
          setUserPosts(articles?.content.map(backendArticleToPost) || []);
          setHighlights(hl);
          setHighlightsCount(hl.length);
          setReadingHistory(history);
          return;
        }
        if (profileUserId) {
          const profile = await backendApi.getUserProfile(profileUserId);
          const articles = await backendApi.getArticlesByUser(profile.id, 0, 10).catch(() => null);
          if (!isMounted) return;
          setProfileUser(backendUserToUser(profile));
          setUserPosts(articles?.content.map(backendArticleToPost) || []);
          return;
        }
        const author = await backendApi.getAuthorBySlug(username || '');
        if (!isMounted) return;
        setProfileUser(backendAuthorToUser(author));
        setUserPosts([]);
        setNotice(
          'This contributor files through the newsroom backend; their dispatch history is not surfaced here yet.',
        );
      } catch (error) {
        if (!isMounted) return;
        setProfileUser(null);
        setUserPosts([]);
        setNotice(error instanceof Error ? error.message : 'Profile unavailable.');
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
      const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(post);
    });
    return groups;
  }, [userPosts]);

  const entitlements = profileUser?.entitlements || [];
  const canUseTags = entitlements.includes('PROFILE_TAGS');
  const canUseBadges = entitlements.includes('PROFILE_BADGES');
  const canUseAccent = entitlements.includes('CUSTOM_PROFILE_ACCENT');
  const effectiveProfileAccent =
    isOwnProfile && isSettingsOpen ? profileDraft.profileAccent : profileUser?.profileAccent;
  const accentClass = profileAccentClasses[effectiveProfileAccent || ''] || defaultAccentClass;

  useEffect(() => {
    if (!profileUser) return;
    setProfileDraft({
      profileHeadline: profileUser.profileHeadline || '',
      profileBio: profileUser.profileBio || profileUser.bio || '',
      profileTags: (profileUser.profileTags || []).join(', '),
      profileAccent: profileUser.profileAccent || '',
      selectedBadge: profileUser.selectedBadge || '',
    });
  }, [profileUser]);

  const handleSaveCustomization = async () => {
    if (!profileUser || isSavingCustomization) return;
    setIsSavingCustomization(true);
    try {
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
      setProfileUser(backendUserToUser(updated));
      setIsSettingsOpen(false);
      toast.success('Profile customization saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save profile customization.');
    } finally {
      setIsSavingCustomization(false);
    }
  };

  const tabs = useMemo(() => {
    if (isOwnProfile) {
      return [
        { id: 'articles', label: 'Articles' },
        { id: 'quotes', label: 'Saved Quotes' },
        { id: 'history', label: 'Reading History' },
      ];
    }
    return [{ id: 'articles', label: 'Articles' }];
  }, [isOwnProfile]);

  if (isLoading)
    return (
      <div className="px-4 py-20 flex justify-center items-center h-64">
        <span className="animate-pulse text-sm text-[var(--color-muted)] font-mono">
          Loading profile...
        </span>
      </div>
    );
  if (!profileUser) return <div className="px-4 py-20 text-sm italic text-app-muted">Contributor not found.</div>;

  return (
    <div className="w-full max-w-[640px] mx-auto pt-10 pb-20 px-4">
      {/* Profile Header */}
      <section className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-6">
          <img
            className="w-32 h-32 rounded-full object-cover border-4 border-[var(--color-border)] shadow-lg"
            src={
              profileUser.avatarUrl ||
              `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
            }
            alt=""
          />
          {profileUser.isVerified && (
            <div className="absolute bottom-1 right-1 bg-[var(--color-action)] p-1.5 rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>
        <h1 className="font-serif text-3xl font-bold text-[var(--color-text)] mb-2">
          {profileUser.name}
        </h1>
        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-[var(--color-muted)]">
          <span className="px-3 py-1 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] font-bold uppercase tracking-wider">
            {profileUser.role === 'ADMIN' ? 'Senior Editor' : 'Contributor'}
          </span>
          <span>•</span>
          <span className="uppercase tracking-wider">
            {profileUser.selectedBadge || 'Global Intelligence Bureau'}
          </span>
        </div>
        {profileUser.profileHeadline && (
          <p className="font-mono text-[10px] text-[var(--color-action)] uppercase tracking-widest mb-3 font-bold">
            {profileUser.profileHeadline}
          </p>
        )}
        {(profileUser.profileBio || profileUser.bio) && (
          <p className="font-serif text-[15px] leading-relaxed text-[var(--color-text)] max-w-md mx-auto italic">
            "{profileUser.profileBio || profileUser.bio}"
          </p>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex justify-center gap-3">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 bg-[var(--color-action)] text-[var(--color-on-action)] rounded-lg text-xs font-bold shadow hover:bg-[var(--color-action-hover)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> Edit Profile
            </button>
          ) : (
            <a
              href={`mailto:${profileUser.email || ''}`}
              className="px-4 py-2 bg-[var(--color-action)] text-[var(--color-on-action)] rounded-lg text-xs font-bold shadow hover:bg-[var(--color-action-hover)] transition-all flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> Pitch Contributor
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success('Profile link copied to clipboard.');
            }}
            className="px-4 py-2 bg-[var(--color-surface-alt)] text-[var(--color-text)] border border-[var(--color-border)] rounded-lg text-xs font-bold hover:bg-[var(--color-surface-container-high)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[var(--color-muted)]" /> Share
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
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-xl text-center shadow-sm hover:border-[var(--color-action-soft)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-[10px] font-bold text-[var(--color-muted)] mb-1 tracking-wider uppercase">REPUTATION</div>
          <div className="font-serif text-[28px] font-bold text-[var(--color-text)]">{profileUser.trustScore}</div>
          <div className="flex items-center justify-center text-[10px] text-[var(--color-action)] mt-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> TOP {profileUser.trustScore > 500 ? '2%' : profileUser.trustScore > 200 ? '10%' : '25%'}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-xl text-center shadow-sm hover:border-[var(--color-action-soft)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-[10px] font-bold text-[var(--color-muted)] mb-1 tracking-wider uppercase">DISPATCHES</div>
          <div className="font-serif text-[28px] font-bold text-[var(--color-text)]">{userPosts.length}</div>
          <div className="text-[10px] text-[var(--color-muted)] mt-1 font-bold tracking-widest uppercase">BYLINES</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-xl text-center shadow-sm hover:border-[var(--color-action-soft)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-[10px] font-bold text-[var(--color-muted)] mb-1 tracking-wider uppercase">SNIPPETS</div>
          <div className="font-serif text-[28px] font-bold text-[var(--color-text)]">{isOwnProfile ? highlightsCount : Math.floor(profileUser.trustScore / 8) || 12}</div>
          <div className="text-[10px] text-[var(--color-muted)] mt-1 font-bold tracking-widest uppercase">HIGHLIGHTS</div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[var(--color-border)] mb-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ProfileTab)}
            className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-[var(--color-action)] text-[var(--color-action)] font-bold'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
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
            <p className="py-6 text-sm italic text-[var(--color-muted)] text-center">
              No reports filed yet.
            </p>
          ) : (
            Object.entries(groupedPosts).map(([groupName, posts]) => (
              <div key={groupName} className="relative pl-8 border-l border-[var(--color-border)] ml-2">
                {/* Small bullet indicator on the line */}
                <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-[var(--color-action)] ring-4 ring-[var(--color-surface)]"></div>
                <div className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-6">
                  {groupName}
                </div>
                <div className="space-y-8">
                  {posts.map((post) => (
                    <article key={post.id} className="group cursor-pointer">
                      <Link to={`/app/p/${post.id}`} className="flex justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-action-soft)]"></span>
                            <span className="text-[10px] font-bold tracking-wider text-[var(--color-action)] uppercase">
                              {post.channelName}
                            </span>
                          </div>
                          <h3 className="font-serif text-[18px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-action)] transition-colors mb-2 leading-snug">
                            {post.title}
                          </h3>
                          <p className="text-sm text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                            {stripHtml(post.content)}
                          </p>
                          <div className="mt-4 flex items-center gap-4 text-xs text-[var(--color-muted)] font-bold">
                            <span>{Math.max(1, Math.ceil(stripHtml(post.content).split(/\s+/).length / 200))} MIN READ</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" /> {post.commentCount || 0}
                            </div>
                          </div>
                        </div>
                        {post.mediaUrl && (
                          <div className="w-24 h-24 rounded-lg bg-[var(--color-surface-alt)] overflow-hidden flex-shrink-0 border border-[var(--color-border)]">
                            <img className="w-full h-full object-cover" src={post.mediaUrl} alt="" />
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
            <p className="py-6 text-sm italic text-[var(--color-muted)] text-center">
              No quotes saved yet. Highlight text inside any report to save a quote here.
            </p>
          ) : (
            <div className="space-y-6">
              {highlights.map((hl) => (
                <div key={hl.id} className="border border-[var(--color-border)] rounded-xl p-5 bg-[var(--color-surface)] shadow-sm">
                  <p className="font-serif text-[15px] text-[var(--color-text)] italic leading-relaxed mb-4">
                    "{hl.text}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--color-muted)] font-semibold">
                    <Link to={`/app/p/${hl.postId}`} className="hover:text-[var(--color-action)] hover:underline">
                      Source: {hl.postTitle}
                    </Link>
                    <span>{formatTime(hl.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'history' && (
          readingHistory.length === 0 ? (
            <p className="py-6 text-sm italic text-[var(--color-muted)] text-center">
              No reading history recorded. Reading progress will be tracked as you read articles.
            </p>
          ) : (
            <div className="space-y-6">
              {readingHistory.map((history) => (
                <div key={history.id} className="border border-[var(--color-border)] rounded-xl p-5 bg-[var(--color-surface)] shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-[var(--color-text)] max-w-[80%]">
                      <Link to={`/app/p/${history.postId}`} className="hover:text-[var(--color-action)] hover:underline">
                        {history.title}
                      </Link>
                    </h4>
                    <span className="text-[10px] font-bold text-[var(--color-action)] bg-[var(--color-action-soft)] px-2 py-0.5 rounded border border-[var(--color-action-soft)]">
                      {history.progress}% READ
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[var(--color-border)] rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-[var(--color-action)]" style={{ width: `${history.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--color-muted)] font-semibold">
                    <span>{history.channelName || 'Global Intelligence'}</span>
                    <span>Last read: {formatTime(history.updatedAt)}</span>
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
          <div className="relative z-10 max-h-[min(90dvh,52rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-action)]">Account settings</p>
                <h2 id="profile-settings-title" className="mt-1 text-xl font-bold text-[var(--color-text)]">Customize profile</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--color-surface-container-high)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                aria-label="Close account settings"
              >
                x
              </button>
            </div>

            <div className="grid gap-5">
              <Field id="profile-headline" label="Headline" hint="Short line above your byline.">
                <Input
                  id="profile-headline"
                  value={profileDraft.profileHeadline}
                  maxLength={160}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, profileHeadline: event.target.value }))
                  }
                  placeholder="Independent reader"
                />
              </Field>
              <Field id="profile-bio" label="Bio" hint="Shown on your profile.">
                <TextArea
                  id="profile-bio"
                  value={profileDraft.profileBio}
                  maxLength={2000}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, profileBio: event.target.value }))}
                  placeholder="What do you read, cover, or care about?"
                  className="min-h-[8rem]"
                />
              </Field>
              <Field
                id="profile-tags"
                label="Profile tags"
                hint={canUseTags ? 'Comma-separated. Up to 8 tags.' : 'Unlock with Reader Plus or higher.'}
              >
                <Input
                  id="profile-tags"
                  value={profileDraft.profileTags}
                  disabled={!canUseTags}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, profileTags: event.target.value }))}
                  placeholder="Politics, Da Nang, Data"
                />
              </Field>

              <div className="border-y border-[var(--color-border)] py-4">
                <UnlockRow
                  title="Selected badge"
                  copy={canUseBadges ? 'Badge near your name.' : 'Unlock with Reader Plus.'}
                  helper="Badges are subscription-linked profile markers. Free accounts keep the default profile without a selected badge."
                  locked={!canUseBadges}
                >
                  <select
                    value={profileDraft.selectedBadge}
                    disabled={!canUseBadges || !profileUser.unlockedBadges?.length}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, selectedBadge: event.target.value }))
                    }
                    className="h-10 w-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 text-xs font-semibold text-[var(--color-text)] rounded-lg disabled:opacity-45"
                  >
                    <option value="">No badge</option>
                    {(profileUser.unlockedBadges || []).map((badge) => (
                      <option key={badge} value={badge}>
                        {badge}
                      </option>
                    ))}
                  </select>
                </UnlockRow>
                <UnlockRow
                  title="Profile accent"
                  copy={canUseAccent ? 'Restrained accent preset.' : 'Unlock with Backer or Newsroom Pro.'}
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
                        <img
                          src={
                            profileUser.avatarUrl ||
                            `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
                          }
                          alt=""
                          className={`h-10 w-10 border-2 object-cover outline outline-4 ${accentClass.avatar} rounded-full`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-app-heading">{profileUser.name}</p>
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
                              toast.info('Profile accents unlock with Backer or Newsroom Pro.');
                              return;
                            }
                            setProfileDraft((current) => ({ ...current, profileAccent: option.value }));
                          }}
                          className={`border p-3 text-left rounded-lg transition-colors ${
                            isLocked ? 'cursor-not-allowed opacity-45' : 'hover:bg-[var(--color-surface-alt)]'
                          } ${isSelected ? optionAccentClass : 'border-[var(--color-border)]'}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-3 w-3 border rounded-full ${swatchClass}`} aria-hidden="true" />
                            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text)] font-semibold">
                              {option.label}
                            </span>
                            {isSelected && (
                              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-[var(--color-action)] font-bold">
                                Active
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-xs text-[var(--color-muted)]">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </UnlockRow>
              </div>

              <Link
                to="/app/subscribe"
                className="text-xs font-bold text-[var(--color-action)] hover:underline inline-block"
              >
                Manage subscription
              </Link>

              <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
                <button
                  type="button"
                  onClick={handleSaveCustomization}
                  disabled={isSavingCustomization}
                  className="inline-flex h-11 w-full items-center justify-center bg-[var(--color-action)] px-6 text-xs font-bold text-white rounded-lg hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer shadow-md transition-all"
                >
                  {isSavingCustomization ? 'Saving...' : 'Save Profile'}
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
  <div className="grid gap-3 border-b border-[var(--color-border)] py-4 last:border-b-0">
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-[var(--color-text)]">{title}</p>
        {helper && <HelperTip label={helper} side="right" />}
      </div>
      <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">{copy}</p>
      {locked && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-action)]">Locked</p>}
    </div>
    <div>{children}</div>
  </div>
);

export default ProfileScreen;
