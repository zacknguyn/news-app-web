import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { backendApi } from '../lib/api';
import { backendArticleToPost, backendAuthorToUser, backendUserToUser } from '../lib/backendAdapters';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { PostCard } from '../components/PostCard';
import type { Post, User } from '../types';

type ProfileTab = 'byline' | 'reports';

export const ProfileScreen: React.FC = () => {
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('byline');

  const isOwnProfile = Boolean(authUser && username === authUser.username);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setIsLoading(true);
      setNotice('');
      try {
        if (authUser && username === authUser.username) {
          const currentUser = await backendApi.getCurrentUser();
          const articles = await backendApi.getArticlesByUser(currentUser.id, 0, 10).catch(() => null);
          if (!isMounted) return;
          setProfileUser(backendUserToUser(currentUser));
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
  }, [authUser, username]);

  const beats = useMemo(
    () => Array.from(new Set(userPosts.map((post) => post.channelName).filter(Boolean))),
    [userPosts],
  );

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
      <header className="grid gap-5 border-b-2 border-app-heading pb-6 md:grid-cols-[64px_minmax(0,1fr)_auto]">
        <img
          src={
            profileUser.avatarUrl ||
            `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
          }
          alt=""
          className="h-16 w-16 border border-app-border object-cover"
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
          {profileUser.bio && (
            <p className="mt-4 max-w-[68ch] text-[17px] leading-7 text-app-text">{profileUser.bio}</p>
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
            <Link
              to="/app/subscribe"
              className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
            >
              Account settings
            </Link>
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
                  {profileUser.bio ||
                    (isOwnProfile
                      ? 'Add a bio to introduce your reporting focus.'
                      : 'This contributor has not added a bio yet.')}
                </p>
              </section>
              <section>
                <h2 className="mono-label mb-3 text-app-muted">Beats</h2>
                {beats.length > 0 ? (
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
          <section>
            <h2 className="mono-label mb-4 text-app-muted">Card</h2>
            <div className="flex gap-3">
              <img
                src={
                  profileUser.avatarUrl ||
                  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profileUser.username)}`
                }
                alt=""
                className="h-12 w-12 border border-app-border object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-app-heading">{profileUser.name}</p>
                <p className="font-mono text-[11px] text-app-muted">@{profileUser.username}</p>
              </div>
            </div>
          </section>
          <section>
            <h2 className="mono-label mb-4 text-app-muted">Activity</h2>
            <div className="grid grid-cols-3 border-y border-app-border">
              <Stat label="Reports" value={userPosts.length} />
              <Stat label="Karma" value={profileUser.trustScore} />
              <Stat label="Comments" value={0} />
            </div>
          </section>
          <section>
            <h2 className="mono-label mb-4 text-app-muted">Verification</h2>
            <p className="text-sm leading-6 text-app-muted">
              {profileUser.isVerified
                ? 'Verified newsroom account.'
                : 'Contributor account. Trust grows through useful reporting and discussion.'}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="border-r border-app-border px-2 py-3 last:border-r-0">
    <p className="font-mono text-[16px] font-semibold tabular-nums text-app-heading">{value.toLocaleString('en-US')}</p>
    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-app-muted">{label}</p>
  </div>
);
