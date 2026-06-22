import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, AtSign, Star, Sparkles, Download } from 'lucide-react';
import { toast } from 'sonner';

type NotificationItem = {
  id: string;
  type: 'mention' | 'reputation' | 'ai' | 'reply';
  actor: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
  targetTitle: string;
  targetLink: string;
  time: string;
  excerpt?: string;
  isRead: boolean;
  metaBadge?: string;
};

export const NotificationsScreen: React.FC = () => {
  // Mock notifications ledger
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'mention',
      actor: {
        name: 'Sarah Jenkins',
        username: 'sarah_j',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ145yDnHCr-No0XaQVJFDukbDXy6FRnbnJRedDu4eycpz4Uoju_NH2rJ3Xzny9tLCbh2wgRQmP6kgOvaPMZ5WrXaOZuoIhRXOCTNQIZuQSP9Xz8NV2YtLtc1p3n-_uETrO4Ret-ToteH-LPQ_ixX-QR8-ZvH788qE_Zr2OHsokt14_zrmz4y9tcuy0K2TZ_kPjw-yh-LzL7uonJM3NS5uqaaakiGobTjBFEru-vYhs2v-EIlJFLEPfO0K0dPEHa1z6FWTtTXAHw'
      },
      targetTitle: 'Quantum Computing Forecast 2025',
      targetLink: '#',
      time: '2m ago',
      excerpt: '"@David, the market sentiment analysis on page 4 seems to contradict the hardware roadmap. Should we re-evaluate?"',
      isRead: false
    },
    {
      id: 'notif-2',
      type: 'reputation',
      actor: {
        name: 'Reputation Milestone',
        username: 'system'
      },
      targetTitle: 'Green Hydrogen Analysis',
      targetLink: '#',
      time: '1h ago',
      metaBadge: 'Top 1% of the Feed',
      isRead: false
    },
    {
      id: 'notif-3',
      type: 'ai',
      actor: {
        name: 'AI Analyst Brief',
        username: 'tourane_ai'
      },
      targetTitle: 'Daily Briefing (Semiconductors, EU Regulation)',
      targetLink: '#',
      time: '3h ago',
      excerpt: 'Daily_Briefing_Oct14.pdf',
      isRead: false
    },
    {
      id: 'notif-4',
      type: 'reply',
      actor: {
        name: 'Elena Rodriguez',
        username: 'elena_r',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwTD1_wRQr9iUiWH7Ve8Oe5cd7ID0kZa2BlmbnEPkOoBtT3Xh6iF3QQu4T_MZ9Qnv3nMZFEt80XYNHPjUVvXG0aKgZBsx54cZOhML35JYyod-ZXhCWLxyox-HPZ3NvCLEv3V-jgtaPwXFBTs8yxW268kcmkw8MveW25c0sQhIV5VsxvjOzM-X99sxWkXy6e7GKSbBgyWd8niR_9OYCnhANk8py6Che24FdI0sU_9CiqjH__C52CktkuL-pxzhYgbYOC2Sgpd-uWg'
      },
      targetTitle: 'SaaS Retention Metrics',
      targetLink: '#',
      time: '5h ago',
      excerpt: '"Spot on analysis, Elena. I\'d add that the Churn-to-LTV ratio is also heavily influenced by customer onboarding quality."',
      isRead: true
    }
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'replies' | 'mentions' | 'reputation'>('all');

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'replies') return notif.type === 'reply';
    if (activeTab === 'mentions') return notif.type === 'mention';
    if (activeTab === 'reputation') return notif.type === 'reputation';
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    toast.success('All notifications marked as read.');
  };

  const toggleReadStatus = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: !notif.isRead } : notif))
    );
  };

  return (
    <div className="app-page min-h-screen bg-app-bg pb-24 text-app-heading">
      <div className="mx-auto max-w-[640px]">
        
        {/* Inbox Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-app-heading">Inbox</h1>
            <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-app-faint">Intelligence Signals</p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-xs font-semibold text-app-heading transition-all hover:border-app-action hover:bg-app-action-faint active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4 text-app-action" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Tab List */}
        <div className="relative mb-8 flex items-center gap-6 overflow-x-auto border-b border-app-border text-xs font-semibold text-app-muted sm:gap-8">
          {(['all', 'replies', 'mentions', 'reputation'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 capitalize transition-colors relative ${
                  isActive ? 'text-app-action' : 'hover:text-app-heading'
                }`}
              >
                {tab}
                {tab === 'reputation' && <span className="ml-1.5 rounded-full bg-app-accent-soft px-1.5 py-0.5 text-[9px] text-app-muted">New</span>}
                {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-app-action" />}
              </button>
            );
          })}
        </div>

        {/* Timeline list container */}
        <div className="overflow-hidden rounded-xl border border-app-border bg-app-border shadow-[var(--shadow-subtle)]">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => toggleReadStatus(notif.id)}
                className={`group flex cursor-pointer gap-4 border-l-2 p-5 transition-all hover:bg-app-surface-alt ${
                  notif.isRead 
                    ? 'opacity-65 border-transparent bg-app-surface/80' 
                    : 'border-app-action bg-app-surface'
                }`}
              >
                {/* Badge Avatar Column */}
                <div className="relative shrink-0">
                  {notif.actor.avatarUrl ? (
                    <img
                      className="h-10 w-10 rounded-full border border-app-border object-cover"
                      src={notif.actor.avatarUrl}
                      alt=""
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      notif.type === 'reputation' ? 'bg-app-accent-soft text-app-muted' : 'bg-app-action-soft text-app-action'
                    }`}>
                      {notif.type === 'reputation' && <Star className="h-5 w-5 fill-current" />}
                      {notif.type === 'ai' && <Sparkles className="h-5 w-5" />}
                    </div>
                  )}

                  {/* Indicator Icon overlay */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-app-surface flex items-center justify-center text-app-on-action bg-app-action">
                    {notif.type === 'mention' && <AtSign className="h-3 w-3" />}
                    {notif.type === 'reply' && <MessageSquare className="h-3 w-3" />}
                    {notif.type === 'ai' && <Sparkles className="h-3 w-3" />}
                    {notif.type === 'reputation' && <Star className="h-3 w-3 fill-current" />}
                  </div>
                </div>

                {/* Content info column */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <p className="text-sm text-app-heading leading-relaxed">
                      <span className="font-bold">{notif.actor.name}</span>{' '}
                      {notif.type === 'mention' && (
                        <span>
                          mentioned you in <span className="text-app-action font-bold">{notif.targetTitle}</span>
                        </span>
                      )}
                      {notif.type === 'reputation' && (
                        <span>
                          Your dispatch on <span className="text-app-action font-bold">"{notif.targetTitle}"</span> was vetted as{' '}
                          <span className="font-bold text-amber-600">{notif.metaBadge}</span>.
                        </span>
                      )}
                      {notif.type === 'ai' && (
                        <span>
                          A new Daily intelligence dossier is compiled for your watchlists.
                        </span>
                      )}
                      {notif.type === 'reply' && (
                        <span>
                          replied to your commentary in <span className="text-app-action font-bold">{notif.targetTitle}</span>
                        </span>
                      )}
                    </p>
                    <span className="font-mono text-[10px] text-app-faint font-semibold whitespace-nowrap">{notif.time}</span>
                  </div>

                  {/* Excerpt Details */}
                  {notif.excerpt && (
                    <div className="mt-2.5">
                      {notif.type === 'ai' ? (
                        <div className="flex items-center justify-between rounded-lg border border-app-border bg-app-surface-alt p-3 transition-colors hover:border-app-action">
                          <div className="flex items-center gap-2 text-xs font-bold text-app-heading">
                            <Sparkles className="h-4 w-4 text-app-action" />
                            <span>{notif.excerpt}</span>
                          </div>
                          <Download className="h-4 w-4 text-app-muted" />
                        </div>
                      ) : (
                        <p className="mt-2 border-l-2 border-app-border pl-3 text-xs italic leading-5 text-app-muted">
                          {notif.excerpt}
                        </p>
                      )}
                    </div>
                  )}

                  {!notif.isRead && (
                    <div className="mt-3 flex gap-2">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-app-action bg-app-action-soft px-2 py-0.5 rounded">
                        Action Required
                      </span>
                    </div>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="bg-app-surface p-10 text-center text-xs italic text-app-muted">No dispatches found in this tab.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NotificationsScreen;
