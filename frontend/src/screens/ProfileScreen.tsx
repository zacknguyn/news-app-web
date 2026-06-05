import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { backendApi } from '../lib/api';
import { backendArticleToPost, backendAuthorToUser, backendUserToUser } from '../lib/backendAdapters';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { Field, Input, TextArea } from '../components/ui/Input';
import { PostCard } from '../components/PostCard';
import type { Post, User } from '../types';

type ProfileTab = 'byline' | 'reports';

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

export const ProfileScreen: React.FC = () => {
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('byline');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
          if (!isMounted) return;
          setProfileUser(backendUserToUser(currentUser));
          setUserPosts(articles?.content.map(backendArticleToPost) || []);
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

  const beats = useMemo(
    () => Array.from(new Set(userPosts.map((post) => post.channelName).filter(Boolean))),
    [userPosts],
  );
  const entitlements = profileUser?.entitlements || [];
  const canUseTags = entitlements.includes('PROFILE_TAGS');
  const canUseBadges = entitlements.includes('PROFILE_BADGES');
  const canUseAccent = entitlements.includes('CUSTOM_PROFILE_ACCENT');
  const effectiveProfileAccent =
    isOwnProfile && isSettingsOpen ? profileDraft.profileAccent : profileUser?.profileAccent;
  const accentClass = profileAccentClasses[effectiveProfileAccent || ''] || defaultAccentClass;
  const accentLabel = accentOptions.find((option) => option.value === (effectiveProfileAccent || ''))?.label || 'None';

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

  if (isLoading)
    return (
      <div className="px-4 py-20">
        <span className="swiss-loading">
          <span>.</span> Loading profile
        </span>
      </div>
    );
  if (!profileUser) return <div className="px-4 py-20 text-sm italic text-app-muted">Contributor not found.</div>;

  return (
    <div className="app-page">
      <header className={`relative border-b-2 pb-6 ${accentClass.header}`}>
        <div className={`mb-6 h-2 border border-current ${accentClass.header} ${accentClass.plate}`} />
        <div className={`grid gap-5 p-4 md:grid-cols-[64px_minmax(0,1fr)_auto] ${accentClass.plate}`}>
          <img
            src={
              profileUser.avatarUrl ||
              `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
            }
            alt=""
            className={`h-16 w-16 border-2 object-cover outline outline-4 ${accentClass.avatar}`}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[32px] font-semibold leading-tight text-app-heading">{profileUser.name}</h1>
              {profileUser.isVerified && (
                <span className="font-mono text-[11px] uppercase tracking-wider text-app-action">Verified</span>
              )}
            </div>
            <p className="mt-1 font-mono text-[11px] text-app-muted">
              @{profileUser.username} · {profileUser.role === 'ADMIN' ? 'Editor' : 'Contributor'}
            </p>
            {profileUser.profileHeadline && (
              <p className="mt-2 max-w-[68ch] font-mono text-[11px] uppercase tracking-wider text-app-muted">
                {profileUser.profileHeadline}
              </p>
            )}
            {profileUser.selectedBadge && (
              <p
                className={`mt-3 inline-flex border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${accentClass.badge}`}
              >
                {profileUser.selectedBadge}
              </p>
            )}
            {(profileUser.profileBio || profileUser.bio) && (
              <p className="mt-4 max-w-[68ch] text-[17px] leading-7 text-app-text">
                {profileUser.profileBio || profileUser.bio}
              </p>
            )}
            <p className="mt-4 font-mono text-[12px] text-app-muted">
              Joined{' '}
              {profileUser.joinedDate
                ? new Date(profileUser.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'Unknown'}{' '}
              · {userPosts.length} reports · {profileUser.trustScore.toLocaleString('en-US')} karma
            </p>
          </div>
          <div className="flex gap-4 md:justify-end">
            {isOwnProfile ? (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
              >
                Account settings
              </button>
            ) : (
              <a
                href={`mailto:${profileUser.email || ''}`}
                className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
              >
                Pitch
              </a>
            )}
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="font-mono text-[11px] uppercase tracking-wider text-app-muted hover:text-app-action"
            >
              Share
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <Alert tone="info" className="mt-6">
          {notice}
        </Alert>
      )}

      <nav className="mt-8 flex gap-5 border-b border-app-border" aria-label="Profile sections">
        {[
          ['byline', 'Byline'],
          ['reports', 'Reports'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id as ProfileTab)}
            className={`border-b-2 pb-3 font-mono text-[11px] uppercase tracking-wider ${activeTab === id ? 'border-app-action text-app-action' : 'border-transparent text-app-muted hover:text-app-heading'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <main className="min-w-0">
          {activeTab === 'byline' ? (
            <div className="space-y-8">
              <section>
                <h2 className="mono-label mb-3 text-app-muted">Byline</h2>
                <p className="max-w-[68ch] text-[17px] leading-7 text-app-text">
                  {profileUser.profileBio ||
                    profileUser.bio ||
                    (isOwnProfile
                      ? 'Add a bio to introduce your reporting focus.'
                      : 'This contributor has not added a bio yet.')}
                </p>
              </section>
              <section>
                <h2 className="mono-label mb-3 text-app-muted">Beats</h2>
                {(profileUser.profileTags?.length || 0) > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {profileUser.profileTags?.map((tag) => (
                      <li
                        key={tag}
                        className={`border px-2 py-1 font-mono text-[11px] uppercase tracking-wider ${accentClass.tag}`}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : beats.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {beats.map((beat) => (
                      <li
                        key={beat}
                        className="border border-app-border px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-app-heading"
                      >
                        {beat}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-app-muted">No beats yet.</p>
                )}
              </section>
              <section>
                <h2 className="mono-label mb-3 text-app-muted">Latest dispatch</h2>
                {userPosts[0] ? (
                  <PostCard post={userPosts[0]} />
                ) : (
                  <p className="text-sm italic text-app-muted">No dispatches yet.</p>
                )}
              </section>
            </div>
          ) : (
            <div className="border-t border-app-border">
              {userPosts.length > 0 ? (
                userPosts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <p className="py-6 text-sm italic text-app-muted">
                  No dispatches yet. The first story is the hardest to file.
                </p>
              )}
            </div>
          )}
        </main>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section className={`border-l-2 pl-4 ${accentClass.section}`}>
            <h2 className={`mono-label mb-4 ${accentClass.label}`}>Card</h2>
            <div className="flex gap-3">
              <img
                src={
                  profileUser.avatarUrl ||
                  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
                }
                alt=""
                className={`h-12 w-12 border-2 object-cover ${accentClass.avatar}`}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-app-heading">{profileUser.name}</p>
                <p className="font-mono text-[11px] text-app-muted">@{profileUser.username}</p>
              </div>
            </div>
          </section>
          <section className={`border-l-2 pl-4 ${accentClass.section}`}>
            <h2 className={`mono-label mb-4 ${accentClass.label}`}>Activity</h2>
            <div className="grid grid-cols-3 border-y border-app-border">
              <Stat label="Reports" value={userPosts.length} />
              <Stat label="Karma" value={profileUser.trustScore} />
              <Stat label="Comments" value={0} />
            </div>
          </section>
          <section className={`border-l-2 pl-4 ${accentClass.section}`}>
            <h2 className={`mono-label mb-4 ${accentClass.label}`}>Verification</h2>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-app-muted">
              Accent: <span className={accentClass.label}>{accentLabel}</span>
            </p>
            <p className="text-sm leading-6 text-app-muted">
              {profileUser.isVerified
                ? 'Verified newsroom account.'
                : 'Contributor account. Trust grows through useful reporting and discussion.'}
            </p>
            {profileUser.unlockedBadges && profileUser.unlockedBadges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profileUser.unlockedBadges.map((badge) => (
                  <span key={badge} className="font-mono text-[11px] uppercase tracking-wider text-app-action">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {isOwnProfile && isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-app-heading/20" role="dialog" aria-modal="true">
          <div className="fixed right-0 top-0 h-full w-full overflow-y-auto border-l border-app-border bg-app-bg p-5 shadow-modal sm:w-[28rem] xl:w-[22rem]">
            <div className="flex items-start justify-between gap-4 border-b border-app-border pb-4">
              <div>
                <p className="mono-label text-app-action">Account settings</p>
                <h2 className="mt-2 text-xl font-semibold text-app-heading">Customize profile</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="font-mono text-[18px] leading-none text-app-muted hover:text-app-action"
                aria-label="Close account settings"
              >
                x
              </button>
            </div>

            <div className="mt-5 grid gap-5">
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

              <div className="border-y border-app-border py-4">
                <UnlockRow
                  title="Selected badge"
                  copy={canUseBadges ? 'Badge near your name.' : 'Unlock with Reader Plus.'}
                  locked={!canUseBadges}
                >
                  <select
                    value={profileDraft.selectedBadge}
                    disabled={!canUseBadges || !profileUser.unlockedBadges?.length}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, selectedBadge: event.target.value }))
                    }
                    className="h-10 w-full border border-app-border bg-app-bg px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading disabled:opacity-45"
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
                  locked={!canUseAccent}
                >
                  <div className="grid gap-2">
                    <div className={`border p-3 ${accentClass.section} ${accentClass.plate}`}>
                      <div className={`mb-3 h-1.5 border ${accentClass.header} ${accentClass.plate}`} />
                      <p className={`font-mono text-[10px] uppercase tracking-wider ${accentClass.label}`}>
                        Accent preview: {accentLabel}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={
                            profileUser.avatarUrl ||
                            `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
                          }
                          alt=""
                          className={`h-10 w-10 border-2 object-cover outline outline-4 ${accentClass.avatar}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-app-heading">{profileUser.name}</p>
                          <p
                            className={`mt-1 inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${accentClass.badge}`}
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
                          className={`border p-3 text-left ${
                            isLocked ? 'cursor-not-allowed opacity-45' : 'hover:bg-app-surface'
                          } ${isSelected ? optionAccentClass : 'border-app-border'}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-3 w-3 border ${swatchClass}`} aria-hidden="true" />
                            <span className="font-mono text-[11px] uppercase tracking-wider text-app-heading">
                              {option.label}
                            </span>
                            {isSelected && (
                              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-app-action">
                                Active
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-sm text-app-muted">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </UnlockRow>
              </div>

              <Link
                to="/app/subscribe"
                className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
              >
                Manage subscription
              </Link>

              <div className="sticky bottom-0 -mx-5 border-t border-app-border bg-app-bg px-5 py-4">
                <button
                  type="button"
                  onClick={handleSaveCustomization}
                  disabled={isSavingCustomization}
                  className="inline-flex h-11 w-full items-center justify-center border border-app-action bg-app-action px-6 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSavingCustomization ? 'Saving' : 'Save profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="border-r border-app-border px-2 py-3 last:border-r-0">
    <p className="font-mono text-[16px] font-semibold tabular-nums text-app-heading">{value.toLocaleString('en-US')}</p>
    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-app-muted">{label}</p>
  </div>
);

const UnlockRow: React.FC<{
  title: string;
  copy: string;
  locked: boolean;
  children: React.ReactNode;
}> = ({ title, copy, locked, children }) => (
  <div className="grid gap-3 border-b border-app-border py-4 last:border-b-0">
    <div>
      <p className="font-semibold text-app-heading">{title}</p>
      <p className="mt-1 text-sm leading-6 text-app-muted">{copy}</p>
      {locked && <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-app-action">Locked</p>}
    </div>
    <div>{children}</div>
  </div>
);

export default ProfileScreen;
