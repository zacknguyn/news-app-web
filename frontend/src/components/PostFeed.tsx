import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bookmark, Lock, Plus, RefreshCw, UserPlus, Users, X } from 'lucide-react';
import { PostCard } from './PostCard';
import { AdCard } from './AdCard';
import { clearProgress, readProgress, type ReadingProgress } from '../lib/readingProgress';
import { backendApi, type BackendAdCampaignDTO } from '../lib/api';
import { backendPostToPost, backendTopicToChannel } from '../lib/backendAdapters';
import { useKeyboard } from '../lib/useKeyboard';
import { useAuth } from '../context/AuthContext';
import type { Channel, Post } from '../types';

const HOME_FEED_PAGE_SIZE = 20;
const LOAD_MORE_PAGE_SIZE = 12;

const sortTabs = ['Hot', 'New', 'Top', 'Controversial', 'Rising'];

export const PostFeed: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [feedPage, setFeedPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedNotice, setFeedNotice] = useState('');
  const [activeSort, setActiveSort] = useState('Hot');
  const [retryKey, setRetryKey] = useState(0);
  const [ads, setAds] = useState<BackendAdCampaignDTO[]>([]);
  const feedSentinelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProgress = async () => {
      try {
        const nextProgress = await readProgress();
        if (isMounted) setProgress(nextProgress);
      } catch {
        if (isMounted) setProgress(null);
      }
    };

    loadProgress();
    window.addEventListener('focus', loadProgress);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', loadProgress);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setIsLoadingPosts(true);
      setFeedNotice('');

      try {
        const backendTopics = await backendApi.getTopics();
        const nextChannels = backendTopics.map(backendTopicToChannel);
        let activeChannel = slug
          ? nextChannels.find((channel) => channel.slug === slug || channel.id === slug)
          : null;

        if (slug && !activeChannel) {
          const topicBySlug = await backendApi.getTopicBySlug(slug).catch(() => null);
          if (topicBySlug) {
            activeChannel = backendTopicToChannel(topicBySlug);
            nextChannels.push(activeChannel);
          }
        }

        const sortParam = activeSort.toLowerCase();
        const backendPosts = activeChannel
          ? await backendApi.getPostsByTopic(Number(activeChannel.id), 0, HOME_FEED_PAGE_SIZE, sortParam)
          : await backendApi.getHotPosts(0, HOME_FEED_PAGE_SIZE, sortParam);

        if (!isMounted) return;
        setChannels(nextChannels);
        setPosts(backendPosts.content.map(backendPostToPost));
        setFeedPage(0);
        setHasMorePosts(!backendPosts.last);
      } catch (error) {
        if (!isMounted) return;
        setFeedNotice(error instanceof Error ? error.message : 'Backend feed unavailable. The server may be offline — try again later or check your connection.');
        setChannels([]);
        setPosts([]);
        setHasMorePosts(false);
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    };

    loadPosts();
    return () => {
      isMounted = false;
    };
  }, [slug, retryKey, activeSort]);

  useEffect(() => {
    let active = true;
    const loadAds = async () => {
      try {
        const result = await backendApi.getActiveAds('feed', 0, 20);
        if (active) setAds(result.content ?? []);
      } catch {
        if (active) setAds([]);
      }
    };
    loadAds();
    return () => { active = false; };
  }, []);

  const activeChannel = slug ? channels.find((channel) => channel.slug === slug || channel.id === slug) || null : null;
  const visibleProgress = progress && progress.progress < 98 ? progress : null;

  useEffect(() => {
    setFocusedIndex(-1);
    postRefs.current = [];
  }, [posts.length]);

  const enabled = !isLoadingPosts && posts.length > 0;
  useKeyboard([
    {
      key: 'j', handler: () => {
        if (!enabled) return;
        setFocusedIndex((prev) => {
          const next = Math.min(prev + 1, posts.length - 1);
          postRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
      }, enabled,
    },
    {
      key: 'k', handler: () => {
        if (!enabled) return;
        setFocusedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          postRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
      }, enabled,
    },
    {
      key: 'Enter', handler: () => {
        if (focusedIndex < 0 || focusedIndex >= posts.length) return;
        navigate(`/app/p/${posts[focusedIndex].id}`);
      }, enabled: enabled && focusedIndex >= 0,
    },
    {
      key: 'Escape', handler: () => {
        setFocusedIndex(-1);
      }, enabled: focusedIndex >= 0,
    },
  ]);

  useEffect(() => {
    const node = feedSentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) handleLoadMore();
        }
      },
      { rootMargin: '320px 0px 320px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [feedSentinelRef.current, hasMorePosts, isLoadingMore, activeChannel?.id, activeSort]);

  const dismissProgress = async () => {
    if (!visibleProgress) return;
    await clearProgress(visibleProgress.postId).catch(() => undefined);
    setProgress(null);
  };

  const postsRef = useRef(posts);
  postsRef.current = posts;

  const handleVote = useCallback(async (postId: string, vote: 'up' | 'down') => {
    const previousPosts = postsRef.current;
    const voteDelta = vote === 'up' ? 1 : -1;

    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;
        const previousVote = post.userVote;
        const clearedPost = {
          ...post,
          upvotes: previousVote === 'up' ? Math.max(0, post.upvotes - 1) : post.upvotes,
          downvotes: previousVote === 'down' ? Math.max(0, post.downvotes - 1) : post.downvotes,
        };

        if (previousVote === vote) return { ...clearedPost, userVote: null };

        return {
          ...clearedPost,
          upvotes: vote === 'up' ? clearedPost.upvotes + 1 : clearedPost.upvotes,
          downvotes: vote === 'down' ? clearedPost.downvotes + 1 : clearedPost.downvotes,
          userVote: vote,
        };
      }),
    );

    try {
      const voteResult = await backendApi.votePost(postId, voteDelta);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                upvotes: Math.max(voteResult.score, 0),
                downvotes: Math.max(-voteResult.score, 0),
                userVote: voteResult.userVote === 1 ? 'up' : voteResult.userVote === -1 ? 'down' : null,
              }
            : post,
        ),
      );
    } catch (error) {
      setPosts(previousPosts);
      toast.error(error instanceof Error ? error.message : 'Vote failed.');
    }
  }, []);

  const handleDeletePost = useCallback(async (postId: string, reason?: string) => {
    setPosts((current) => current.filter((p) => p.id !== postId));
    try {
      await backendApi.deletePost(postId, reason);
      toast.success('Post deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete post.');
    }
  }, []);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMorePosts) return;
    const nextPage = feedPage + 1;
    setIsLoadingMore(true);

    try {
      const sortParam = activeSort.toLowerCase();
      const response = activeChannel
        ? await backendApi.getPostsByTopic(Number(activeChannel.id), nextPage, LOAD_MORE_PAGE_SIZE, sortParam)
        : await backendApi.getHotPosts(nextPage, LOAD_MORE_PAGE_SIZE, sortParam);

      setPosts((currentPosts) => [...currentPosts, ...response.content.map(backendPostToPost)]);
      setFeedPage(nextPage);
      setHasMorePosts(!response.last);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load more reports. Try scrolling again or refreshing the page.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState<Array<{ id: number; name: string; email: string; avatar?: string; role: string; canPost: boolean }>>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [togglingMember, setTogglingMember] = useState<Set<number>>(new Set());

  const handleToggleJoin = async () => {
    if (!activeChannel) return;
    const previousChannels = channels;
    setChannels((current) =>
      current.map((channel) =>
        channel.id === activeChannel.id
          ? {
              ...channel,
              joined: !channel.joined,
              memberCount: Math.max(0, (channel.memberCount || 0) + (channel.joined ? -1 : 1)),
            }
          : channel,
    ));

    try {
      const updated = activeChannel.joined
        ? await backendApi.leaveTopic(activeChannel.id)
        : await backendApi.joinTopic(activeChannel.id);
      const nextChannel = backendTopicToChannel(updated);
      setChannels((current) => current.map((channel) => (channel.id === nextChannel.id ? nextChannel : channel)));
    } catch (error) {
      setChannels(previousChannels);
      toast.error(error instanceof Error ? error.message : 'Unable to update channel membership.');
    }
  };

  const loadMembers = async (query?: string) => {
    if (!activeChannel) return;
    setMembersLoading(true);
    try {
      const data = await backendApi.getTopicMembers(activeChannel.id, query);
      setMembers(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load members.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!activeChannel) return;
    setTogglingMember(prev => new Set(prev).add(userId));
    try {
      await backendApi.setMemberRole(activeChannel.id, String(userId), newRole);
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setTogglingMember(prev => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  const handleToggleCanPost = async (userId: number, current: boolean) => {
    if (!activeChannel) return;
    setTogglingMember(prev => new Set(prev).add(userId));
    try {
      await backendApi.setMemberCanPost(activeChannel.id, String(userId), !current);
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, canPost: !current } : m));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update permission.');
    } finally {
      setTogglingMember(prev => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  const handleInvite = async () => {
    if (!activeChannel || !inviteEmail.trim()) return;
    setInviteBusy(true);
    try {
      await backendApi.inviteToTopic(activeChannel.id, inviteEmail.trim());
      toast.success('Invitation sent.');
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation.');
    } finally {
      setInviteBusy(false);
    }
  };

  const isOwner = auth.isAuthenticated && activeChannel?.ownerId === auth.user?.id;

  return (
    <div className="bg-app-bg text-app-text w-full">
      <div className="max-w-[896px] mx-auto px-4 py-8">
        {/* Resume reading toast */}
        {visibleProgress && (
          <aside className="bg-app-action-soft px-5 py-3.5 mb-6 rounded-xl animate-scale-in shadow-[var(--shadow-tinted)]" aria-label="Continue reading">
            <div className="flex items-center justify-between gap-4">
              <Link to={`/app/p/${visibleProgress.postId}`} className="min-w-0 flex-grow">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-app-muted font-bold">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="tracking-wide">Resume reading</span>
                  <span className="bg-app-action-soft px-1.5 py-0.5 rounded text-[10px] tabular-nums">{visibleProgress.progress}%</span>
                </div>
                <h2 className="truncate text-xs font-bold text-app-heading hover:text-app-action transition-colors">
                  {visibleProgress.title}
                </h2>
              </Link>
              <button
                type="button"
                onClick={dismissProgress}
                className="text-xs text-app-muted hover:text-app-action font-bold active:scale-[0.97] transition-transform"
              >
                Dismiss
              </button>
            </div>
          </aside>
        )}

        {/* Community Banner */}
        {activeChannel?.bannerUrl && (
          <div className="relative -mx-4 -mt-4 mb-6 overflow-hidden rounded-none sm:rounded-xl h-48">
            <img
              src={activeChannel.bannerUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              {activeChannel.avatarUrl && (
                <img
                  src={activeChannel.avatarUrl}
                  alt=""
                  className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-md"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-sm">{activeChannel.name}</h1>
                <p className="text-xs text-white/80">{activeChannel.memberCount || 0} contributors</p>
              </div>
            </div>
          </div>
        )}

        {/* Feed Header / Filter Bar */}
        {activeChannel && !feedNotice && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-app-border mb-6">
            <div>
              <h1 className="text-xl font-serif font-bold text-app-heading flex items-center gap-2">
                {activeChannel.name}
                {activeChannel.visibility === 'PRIVATE' && (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-sans font-bold border border-amber-200">
                    <Lock className="h-3 w-3" /> Private
                  </span>
                )}
                <span className="bg-app-action-faint text-app-action text-[10px] px-2 py-0.5 rounded-full font-sans font-bold">
                  Domain
                </span>
              </h1>
              <p className="text-xs text-app-muted mt-1">
                {activeChannel.memberCount || 0} Contributors &bull; {activeChannel.description}
              </p>
            </div>

          <div className="flex items-center gap-3">
            {activeChannel && !isLoadingPosts && (
              <>
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setShowInviteModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-app-border bg-app-surface text-app-muted hover:text-app-action hover:border-app-action transition-all active:scale-[0.97]"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Invite
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowMembersModal(true); setMemberSearch(''); loadMembers(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-app-border bg-app-surface text-app-muted hover:text-app-action hover:border-app-action transition-all active:scale-[0.97]"
                    >
                      <Users className="h-3.5 w-3.5" /> Manage
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleToggleJoin}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border active:scale-[0.97] ${
                    activeChannel.joined
                      ? 'bg-app-surface border-app-border text-app-muted'
                      : 'bg-app-action text-app-on-action border-app-action hover:brightness-110'
                  }`}
                >
                  {activeChannel.joined ? 'Subscribed' : 'Subscribe'}
                </button>
              </>
            )}

            {!feedNotice && !isLoadingPosts && (
              <div className="flex border border-app-border rounded-full p-0.5 bg-app-surface">
                {sortTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSort(tab)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all active:scale-[0.97] ${
                      activeSort === tab
                        ? 'bg-app-action text-app-on-action shadow-sm'
                        : 'text-app-muted hover:text-app-action'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {activeChannel?.joined && activeChannel.canPost === false && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            You don't have permission to post in this community.
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowInviteModal(false)}>
            <div className="w-full max-w-sm rounded-xl bg-app-surface p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-app-heading">Invite to {activeChannel?.name}</h3>
                <button type="button" onClick={() => setShowInviteModal(false)} className="text-app-muted hover:text-app-heading">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-4 text-xs text-app-muted">Enter the user&apos;s email to send an invitation.</p>
              <input
                className="channel-input mb-4 w-full"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowInviteModal(false)} className="rounded-lg px-4 py-2 text-sm text-app-muted hover:bg-app-surface-alt">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteBusy}
                  className="rounded-lg bg-app-action px-4 py-2 text-sm font-semibold text-app-on-action hover:brightness-110 disabled:opacity-40"
                >
                  {inviteBusy ? 'Sending...' : 'Send invite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMembersModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-12" onClick={() => setShowMembersModal(false)}>
            <div className="w-full max-w-lg rounded-xl bg-app-surface p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-app-heading">Members — {activeChannel?.name}</h3>
                <button type="button" onClick={() => setShowMembersModal(false)} className="text-app-muted hover:text-app-heading">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                className="channel-input mb-4 w-full"
                type="text"
                placeholder="Search members by name or email..."
                value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); loadMembers(e.target.value || undefined); }}
              />
              {membersLoading ? (
                <p className="py-8 text-center text-sm text-app-muted">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="py-8 text-center text-sm text-app-muted">No members found.</p>
              ) : (
                <div className="divide-y divide-app-border">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-app-action-soft flex items-center justify-center text-xs font-bold text-app-action">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-app-heading truncate">{m.name}</p>
                          <p className="text-[11px] text-app-muted truncate">{m.email}</p>
                          <span className={`text-[10px] font-bold uppercase ${m.role === 'OWNER' ? 'text-amber-600' : m.role === 'MODERATOR' ? 'text-blue-600' : 'text-app-faint'}`}>
                            {m.role}
                          </span>
                        </div>
                      </div>
                      {m.role !== 'OWNER' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={togglingMember.has(m.id)}
                            onClick={() => handleRoleChange(m.id, m.role === 'MODERATOR' ? 'MEMBER' : 'MODERATOR')}
                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                              m.role === 'MODERATOR'
                                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                : 'border-app-border text-app-muted hover:text-app-heading'
                            } ${togglingMember.has(m.id) ? 'opacity-50' : ''}`}
                          >
                            {m.role === 'MODERATOR' ? 'Demote' : 'Mod'}
                          </button>
                          <label className="flex cursor-pointer items-center gap-2 text-[10px] text-app-muted">
                            <span className={m.canPost ? 'font-semibold text-app-action' : ''}>Post</span>
                            <button
                              type="button"
                              disabled={togglingMember.has(m.id)}
                              onClick={() => handleToggleCanPost(m.id, m.canPost)}
                              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                                m.canPost ? 'bg-app-action' : 'bg-app-border'
                              } ${togglingMember.has(m.id) ? 'opacity-50' : ''}`}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                m.canPost ? 'translate-x-[14px]' : 'translate-x-[1px]'
                              }`} />
                            </button>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Home feed sort tabs */}
        {!activeChannel && !feedNotice && !isLoadingPosts && (
          <div className="flex items-center justify-between pb-4 border-b border-app-border mb-6">
            <h1 className="text-xl font-serif font-bold text-app-heading">Feed</h1>
            <div className="flex border border-app-border rounded-full p-0.5 bg-app-surface">
              {sortTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveSort(tab)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all active:scale-[0.97] ${
                    activeSort === tab
                      ? 'bg-app-action text-app-on-action shadow-sm'
                      : 'text-app-muted hover:text-app-action'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}

        {feedNotice && (
          <div className="mb-6">
            <div className="bg-app-surface rounded-2xl p-10 text-center shadow-[var(--shadow-tinted)]">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-app-action-soft flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-app-action" />
              </div>
              <h2 className="text-lg font-bold text-app-heading mb-2">Connection Interrupted</h2>
              <p className="text-sm text-app-muted mb-6 max-w-sm mx-auto leading-relaxed">
                The server appears to be offline. Data will load automatically once the connection is restored.
              </p>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="inline-flex items-center gap-2 bg-app-action text-app-on-action px-5 py-2.5 rounded-full text-xs font-bold hover:brightness-110 active:scale-[0.97] transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry connection
              </button>
            </div>
          </div>
        )}

        {/* Post List */}
        <div className="space-y-6">
          {isLoadingPosts ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-app-surface animate-skeleton space-y-4 shadow-[var(--shadow-tinted)]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-1/4 bg-app-surface-alt rounded" />
                    <div className="h-4 w-20 bg-app-surface-alt rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-app-surface-alt rounded" />
                  <div className="h-3 w-5/6 bg-app-surface-alt rounded" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              {!feedNotice && (
                <div className="space-y-6">
                  {posts.flatMap((post, index) => {
                    const items: React.ReactNode[] = [];
                    items.push(
                      <div
                        key={`feed-${post.id}-${index}`}
                        ref={(el) => { postRefs.current[index] = el; }}
                        className="animate-fade-up"
                        style={{ animationDelay: `${Math.min(index * 40, 500)}ms` }}
                        onMouseEnter={() => setFocusedIndex(index)}
                      >
                        <PostCard post={post} currentUserId={auth.user?.id} onVote={handleVote} onDelete={handleDeletePost} />
                      </div>
                    );
                    if (ads.length > 0 && (index + 1) % 4 === 0) {
                      const ad = ads[(Math.floor((index + 1) / 4) - 1) % ads.length];
                      items.push(
                        <div key={`ad-${index}`} className="animate-fade-up">
                          <AdCard ad={ad} compact />
                        </div>
                      );
                    }
                    return items;
                  })}
                </div>
              )}
              <div ref={feedSentinelRef} className="h-px" aria-hidden="true" />
              {isLoadingMore ? (
                <div className="py-8 text-center">
                  <span className="text-xs font-semibold text-app-muted">Loading more posts&hellip;</span>
                </div>
              ) : !hasMorePosts ? (
                <div className="py-12 text-center border-t border-app-border mt-6">
                  <p className="text-xs font-semibold text-app-muted">You&rsquo;ve reached the end</p>
                  <p className="text-xs text-app-muted mt-1">Check back later for new posts</p>
                </div>
              ) : null}
            </>
          ) : !feedNotice ? (
            <div className="bg-app-surface rounded-2xl p-12 text-center shadow-[var(--shadow-tinted)]">
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-app-action-faint flex items-center justify-center">
                <Plus className="h-7 w-7 text-app-action" />
              </div>
              <h2 className="text-lg font-bold text-app-heading mb-2">No posts yet</h2>
              <p className="text-sm text-app-muted mb-6 max-w-sm mx-auto leading-relaxed">
                This domain doesn&rsquo;t have any posts yet. Be the first to share intelligence with the community.
              </p>
              <Link
                to="/app/submit"
                className="inline-flex items-center gap-2 bg-app-action text-app-on-action px-5 py-2.5 rounded-full text-xs font-bold hover:brightness-110 active:scale-[0.97] transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Create first post
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PostFeed;
