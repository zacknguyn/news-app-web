import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PostCard } from '../components/PostCard';
import { TrustBar } from '../components/ui/TrustBar';
import { ShieldCheck, Calendar, Award, BarChart3, Globe, Mail, UserCog } from 'lucide-react';
import { usePageMotion } from '../hooks/usePageMotion';
import { useAuth } from '../context/AuthContext';
import { backendApi, getAuthToken, setAuthSession } from '../lib/api';
import { backendArticleToPost, backendAuthorToUser, backendUserToUser } from '../lib/backendAdapters';
import { Alert } from '../components/ui/Alert';
import type { Post, User } from '../types';

export const ProfileScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const isOwnProfile = Boolean(authUser && username === authUser.username);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setNotice('');

      try {
        if (authUser && username === authUser.username) {
          const currentUser = await backendApi.getCurrentUser();
          const nextUser = backendUserToUser(currentUser);
          const articles = await backendApi.getArticlesByUser(currentUser.id, 0, 10).catch(() => null);
          if (!isMounted) return;
          setUser(nextUser);
          setName(nextUser.name);
          setAvatar(nextUser.avatarUrl || '');
          setUserPosts(articles?.content.map(backendArticleToPost) || []);
          return;
        }

        const author = await backendApi.getAuthorBySlug(username || '');
        if (!isMounted) return;
        setUser(backendAuthorToUser(author));
        setUserPosts([]);
        setNotice('Backend authors are separate from app users, so author report history is not exposed here yet.');
      } catch (error) {
        if (!isMounted) return;
        setUser(null);
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

  const handleSaveAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isOwnProfile) return;
    setIsSavingAccount(true);

    try {
      const updated = await backendApi.updateCurrentUser({
        name: name.trim(),
        avatar: avatar.trim() || undefined,
      });
      const nextUser = backendUserToUser(updated);
      const token = getAuthToken();
      if (token) setAuthSession(token, nextUser);
      setUser(nextUser);
      setName(nextUser.name);
      setAvatar(nextUser.avatarUrl || '');
      toast.success('Account updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update account.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center text-sm text-[var(--color-app-muted)]">Loading profile</div>;
  if (!user) return <div className="p-20 text-center text-sm text-[var(--color-app-muted)]">Journalist not found: database entry missing</div>;

  return (
    <div ref={pageRef} className="hex-page">
      <header data-motion="page" className="hex-card mb-10 p-6 sm:p-8">
        <div className="flex flex-col items-start gap-8 md:flex-row">
          <img src={user.avatarUrl} alt={user.name} className="h-28 w-28 rounded-[8px] border border-[var(--color-app-border)] object-cover grayscale" />
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-semibold text-[var(--color-app-action)]">
                  {user.name}
                  {user.isVerified && <ShieldCheck className="h-6 w-6 text-[var(--color-app-action)]" />}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-app-muted)]">
                  @{user.username}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} className="hex-button-secondary min-h-10 px-5 py-2 text-sm font-medium">
                  Share
                </button>
              </div>
            </div>

            <p className="max-w-2xl text-base leading-7 text-[var(--color-app-text)]">
              {user.bio}
            </p>

            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm text-[var(--color-app-muted)]">
                <Calendar className="h-4 w-4" />
                Joined {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-app-muted)]">
                <Globe className="h-4 w-4" />
                truth-portal.net/u/{user.username}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {notice && (
          <Alert tone="warning" className="lg:col-span-3">
            {notice}
          </Alert>
        )}
        <div data-motion="page" className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--color-app-border-clean)] pb-4">
            <h3 className="text-sm font-semibold text-[var(--color-app-ink)]">
              Recent Reports
            </h3>
            <span className="text-sm text-[var(--color-app-muted)]">{userPosts.length} posts</span>
          </div>
          <div className="space-y-5">
            {userPosts.length > 0 ? (
              userPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="hex-panel py-16 text-center text-sm text-[var(--color-app-muted)]">
                No archived reports found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trust Stats */}
        <div className="space-y-8">
          {isOwnProfile && (
            <section data-motion="list" className="hex-card p-6">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-app-ink)]">
                <UserCog className="h-4 w-4" />
                Account
              </h3>
              <form className="space-y-4" onSubmit={handleSaveAccount}>
                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Display name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="hex-input min-h-10 w-full px-3 text-sm"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">Avatar URL</span>
                  <input
                    value={avatar}
                    onChange={(event) => setAvatar(event.target.value)}
                    className="hex-input min-h-10 w-full px-3 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSavingAccount || !name.trim()}
                  className="hex-button-primary min-h-10 w-full px-4 text-sm font-semibold disabled:opacity-50"
                >
                  {isSavingAccount ? 'Saving' : 'Save account'}
                </button>
              </form>
            </section>
          )}

          <section data-motion="list" className="hex-card p-6">
            <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-app-ink)]">
              <Mail className="h-4 w-4" />
              Account Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--color-app-border)] pb-3">
                <span className="text-[var(--color-app-muted)]">Email</span>
                <span className="font-semibold text-[var(--color-app-heading)]">{user.email || 'Not exposed'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[var(--color-app-border)] pb-3">
                <span className="text-[var(--color-app-muted)]">Role</span>
                <span className="font-semibold text-[var(--color-app-heading)]">{user.role || 'USER'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--color-app-muted)]">Status</span>
                <span className="font-semibold text-[var(--color-app-action)]">{user.status || 'ACTIVE'}</span>
              </div>
            </div>
          </section>

          <section data-motion="list" className="hex-card p-6">
            <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold text-[var(--color-app-ink)]">
              <Award className="h-4 w-4" />
              Authority Metrics
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-[var(--color-app-muted)]">Trust Score</span>
                  <span className="text-2xl font-semibold text-[var(--color-app-action)]">{user.trustScore}</span>
                </div>
                <TrustBar score={user.trustScore} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[8px] border border-[var(--color-app-border-clean)] bg-white p-4">
                  <span className="mb-1 block text-xs text-[var(--color-app-muted)]">Upvoted Reports</span>
                  <span className="text-xl font-semibold text-[var(--color-app-ink)]">92%</span>
                </div>
                <div className="rounded-[8px] border border-[var(--color-app-border-clean)] bg-white p-4">
                   <span className="mb-1 block text-xs text-[var(--color-app-muted)]">Accuracy Rating</span>
                   <span className="text-xl font-semibold text-[var(--color-app-ink)]">A+</span>
                </div>
              </div>

              <div className="border-t border-[var(--color-app-border-clean)] pt-4">
                 <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-app-muted)]">
                    <BarChart3 className="h-4 w-4" />
                    Community Verdict: <span className="text-[var(--color-app-action)]">Highly Reliable</span>
                 </div>
              </div>
            </div>
          </section>

          <section data-motion="list" className="hex-card-soft p-6">
             <h3 className="mb-4 text-sm font-semibold text-[var(--color-app-ink)]">
               About Verification
             </h3>
             <p className="text-sm leading-6 text-[var(--color-app-muted)]">
               Verified authors have undergone manual community review of their prior independent work and maintain a Trust Score above 500.
             </p>
          </section>
        </div>
      </div>
    </div>
  );
};
