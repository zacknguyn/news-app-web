import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  AtSign,
  Bell,
  CheckCircle2,
  LogIn,
  MessageSquare,
  Sparkles,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { backendApi } from '../lib/api';
import { backendNotificationToNotification } from '../lib/backendAdapters';
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';
import type { NotificationItem } from '../types';

type TabId = 'all' | 'unread';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  reply: MessageSquare,
  mention: AtSign,
  vote: ThumbsUp,
  trust_change: Star,
  briefing_ready: Sparkles,
  invite: LogIn,
  post_removed: AlertTriangle,
};

const fallbackIcon = Bell;

export const NotificationsScreen: React.FC = () => {
  const isVi = isVietnamese(useAppLanguage());
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const page = await backendApi.getNotifications(0, 50);
      setNotifications(page.content.map(backendNotificationToNotification));
    } catch (err) {
      setError(err instanceof Error ? err.message : (isVi ? 'Không thể tải thông báo.' : 'Failed to load notifications.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await backendApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success(isVi ? 'Đã đánh dấu tất cả là đã đọc.' : 'All notifications marked as read.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isVi ? 'Không thể đánh dấu tất cả là đã đọc.' : 'Failed to mark all as read.'));
    }
  };

  const [actionBusy, setActionBusy] = useState<Set<string>>(new Set());

  const handleClick = async (notif: NotificationItem) => {
    if (pendingIds.has(notif.id) || notif.type === 'invite') return;
    setPendingIds(prev => new Set(prev).add(notif.id));

    try {
      if (!notif.isRead) {
        await backendApi.markNotificationRead(Number(notif.id));
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      }

      let path = '';
      if (notif.refType === 'post' && notif.refId) {
        path = `/app/p/${notif.refId}`;
      } else if (notif.refType === 'article' && notif.refId) {
        path = `/app/p/article-${notif.refId}`;
      } else if (notif.refType === 'topic' && notif.refSlug) {
        path = `/app/c/${notif.refSlug}`;
      }

      if (path) navigate(path);
    } catch {
      // silent — marking read failure shouldn't block navigation
    } finally {
      setPendingIds(prev => { const next = new Set(prev); next.delete(notif.id); return next; });
    }
  };

  const handleInviteAction = async (notifId: string, action: 'accept' | 'decline') => {
    if (actionBusy.has(notifId)) return;
    setActionBusy(prev => new Set(prev).add(notifId));

    try {
      const notif = notifications.find(n => n.id === notifId);
      if (!notif?.refId) return;
      if (action === 'accept') {
        const topic = await backendApi.acceptTopicInvite(notif.refId);
        toast.success(isVi ? `Đã tham gia ${topic.name}` : `Joined ${topic.name}`);
        navigate(`/app/c/${topic.slug}`);
      } else {
        await backendApi.declineTopicInvite(notif.refId);
        toast.success(isVi ? 'Đã từ chối lời mời' : 'Invitation declined');
      }
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isVi ? 'Không thể xử lý lời mời.' : 'Failed to process invitation.'));
    } finally {
      setActionBusy(prev => { const next = new Set(prev); next.delete(notifId); return next; });
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="app-page min-h-screen bg-app-bg pb-24 text-app-heading">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-app-heading">{isVi ? 'Hộp thư' : 'Inbox'}</h1>
            <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-app-faint">
              {isVi ? 'Thông báo' : 'Notifications'}
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-app-action px-1.5 py-0.5 text-[9px] text-app-on-action">{unreadCount}</span>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-xs font-semibold text-app-heading transition-all hover:border-app-action hover:bg-app-action-faint active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4 text-app-action" />
              <span>{isVi ? 'Đánh dấu đã đọc' : 'Mark all read'}</span>
            </button>
          )}
        </div>

        <div className="relative mb-8 flex items-center gap-6 overflow-x-auto border-b border-app-border text-xs font-semibold text-app-muted sm:gap-8">
          {(['all', 'unread'] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 capitalize transition-colors ${isActive ? 'text-app-action' : 'hover:text-app-heading'}`}
              >
                {isVi ? (tab === 'all' ? 'tất cả' : 'chưa đọc') : tab}
                {tab === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-app-action px-1.5 py-0.5 text-[9px] text-app-on-action">{unreadCount}</span>
                )}
                {isActive && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-app-action" />}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-app-border bg-app-surface p-5">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-app-border" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-app-border" />
                    <div className="h-3 w-1/2 rounded bg-app-border" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-xl border border-state-error-border bg-state-error-bg p-6 text-center text-sm text-state-error">
            <p>{error}</p>
            <button onClick={load} className="mt-3 font-semibold underline">{isVi ? 'Thử lại' : 'Try again'}</button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-app-border bg-app-surface p-16 text-center">
            <Bell className="mb-4 h-10 w-10 text-app-faint" />
            <p className="text-base font-semibold text-app-heading">{isVi ? 'Chưa có thông báo' : 'No notifications yet'}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-muted">
              {activeTab === 'unread'
                ? (isVi ? 'Bạn đã đọc hết. Không còn thông báo chưa đọc.' : 'All caught up! You have no unread notifications.')
                : (isVi ? 'Thông báo từ phản hồi, lượt bình chọn và hoạt động cộng đồng sẽ xuất hiện ở đây.' : 'Notifications from replies, upvotes, and community activity will appear here.')}
            </p>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-app-border shadow-[var(--shadow-subtle)]">
            {filtered.map(notif => {
              const Icon = iconMap[notif.type] || fallbackIcon;
              const isInvite = notif.type === 'invite';
              const isRemoved = notif.type === 'post_removed';
              return (
                <div
                  key={notif.id}
                  onClick={isInvite ? undefined : () => handleClick(notif)}
                  className={`flex gap-4 border-b border-app-border p-5 transition-colors last:border-b-0 ${
                    isInvite ? 'bg-app-surface' : 'cursor-pointer hover:bg-app-surface-alt'
                  } ${isRemoved ? 'bg-red-50' : notif.isRead ? 'bg-app-surface/80' : 'bg-app-action-soft'}`}
                >
                  <div className="relative shrink-0">
                    {notif.actorAvatar ? (
                      <img
                        loading="lazy"
                        className="h-10 w-10 rounded-full border border-app-border object-cover"
                        src={notif.actorAvatar}
                        alt=""
                      />
                    ) : (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isRemoved ? 'bg-red-100 text-red-600' : 'bg-app-action-soft text-app-action'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed text-app-heading">
                        {notif.actorName && <span className="font-bold">{notif.actorName} </span>}
                        {notif.title}
                      </p>
                      <span className="shrink-0 font-mono text-[10px] font-semibold text-app-faint">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    {notif.body && (
                      <p className="mt-1 text-xs leading-relaxed text-app-muted">{notif.body}</p>
                    )}
                    {isInvite ? (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionBusy.has(notif.id)}
                          onClick={() => handleInviteAction(notif.id, 'accept')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-app-action px-4 py-1.5 text-xs font-semibold text-app-on-action hover:brightness-110 disabled:opacity-40"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {actionBusy.has(notif.id) ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy.has(notif.id)}
                          onClick={() => handleInviteAction(notif.id, 'decline')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-4 py-1.5 text-xs font-semibold text-app-muted hover:text-app-heading disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </button>
                      </div>
                    ) : (
                      !notif.isRead && (
                        <span className="mt-2 inline-block rounded bg-app-action-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-app-action">
                          New
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;
