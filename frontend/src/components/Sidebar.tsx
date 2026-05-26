import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MOCK_CHANNELS } from '../lib/mockData';
import { Sword, Cpu, Building, CloudRain, Hash, Info, PlusCircle, Settings, LogOut, LogIn, Highlighter, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import type { Channel } from '../types';
import { BrandMark } from './BrandMark';

const ICON_MAP: Record<string, any> = {
  Sword,
  Cpu,
  Building,
  CloudRain
};

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    let isMounted = true;

    const loadChannels = async () => {
      try {
        const topics = await backendApi.getTopics();
        if (isMounted) setChannels(topics.map(backendTopicToChannel));
      } catch {
        if (isMounted) setChannels(MOCK_CHANNELS);
      }
    };

    loadChannels();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-[var(--color-app-border-clean)] bg-[var(--color-app-surface)] lg:w-60">
      {/* Brand Header */}
      <div className="px-5 pb-3 pt-5">
        <Link to="/app" className="block group">
          <div className="mb-1 text-xs font-semibold text-[var(--color-app-faint)] transition-colors group-hover:text-[var(--color-app-action)]">
            Independent
          </div>
          <BrandMark stacked />
        </Link>
      </div>

      <div className="custom-scrollbar flex-1 space-y-7 overflow-y-auto px-3 py-3">
        {/* Action Call */}
        <div className="px-1">
          {isAuthenticated ? (
            <Link 
              to="/app/submit" 
              className="flex min-h-10 items-center justify-center gap-2 w-full rounded-[3px] border border-[var(--color-eggplant-gray)] bg-[var(--color-app-surface)] px-3 text-sm font-semibold text-[var(--color-app-ink)] transition-all hover:bg-[var(--color-app-surface-lift)] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              Submit report
            </Link>
          ) : (
            <Link 
              to="/register" 
              className="flex min-h-10 items-center justify-center gap-2 w-full rounded-[3px] border border-[var(--color-app-border)] px-3 text-sm font-semibold text-[var(--color-app-ink)] transition-all hover:border-[var(--color-eggplant-gray)] hover:bg-[var(--color-app-surface-lift)]"
            >
              Request access
            </Link>
          )}
        </div>

        {/* Navigation Sections */}
        <section>
          <h3 className="mb-2 px-2 text-xs font-semibold text-[var(--color-app-faint)]">
            Channels
          </h3>
          <nav className="space-y-1">
            {channels.map(channel => {
              const Icon = ICON_MAP[channel.iconName] || Hash;
              return (
                <NavLink
                  key={channel.id}
                  to={`/app/c/${channel.slug}`}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-all group
                    ${isActive 
                      ? 'bg-[var(--color-app-surface-lift)] text-[var(--color-app-ink)] shadow-[var(--shadow-hex-focus)]' 
                      : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)] hover:bg-[var(--color-app-surface-lift)]'}
                  `}
                >
                  <Icon className="w-4 h-4 text-[var(--color-app-faint)] group-hover:text-[var(--color-app-ink)] transition-colors" />
                  {channel.name}
                </NavLink>
              );
            })}
          </nav>
        </section>

        <section>
          <h3 className="mb-2 px-2 text-xs font-semibold text-[var(--color-app-faint)]">
            Resources
          </h3>
          <nav className="space-y-1">
            <NavLink
              to="/app/highlights"
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-all
                ${isActive ? 'bg-[var(--color-app-surface-lift)] text-[var(--color-app-ink)] shadow-[var(--shadow-hex-focus)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)] hover:bg-[var(--color-app-surface-lift)]'}
              `}
            >
              <Highlighter className="w-4 h-4" />
              Highlights
            </NavLink>
            <NavLink
              to="/app/trust"
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-all
                ${isActive ? 'bg-[var(--color-app-surface-lift)] text-[var(--color-app-ink)] shadow-[var(--shadow-hex-focus)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)] hover:bg-[var(--color-app-surface-lift)]'}
              `}
            >
              <Info className="w-4 h-4" />
              Trust Mechanics
            </NavLink>
            <NavLink
              to="/app/settings"
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-all
                ${isActive ? 'bg-[var(--color-app-surface-lift)] text-[var(--color-app-ink)] shadow-[var(--shadow-hex-focus)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)] hover:bg-[var(--color-app-surface-lift)]'}
              `}
            >
              <Settings className="w-4 h-4" />
              Preferences
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/app/admin"
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-all
                  ${isActive ? 'bg-[var(--color-app-surface-lift)] text-[var(--color-app-ink)] shadow-[var(--shadow-hex-focus)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)] hover:bg-[var(--color-app-surface-lift)]'}
                `}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </NavLink>
            )}
          </nav>
        </section>
      </div>

      {/* User Footer */}
      <div className="border-t border-[var(--color-app-border-clean)] bg-[var(--color-app-surface)] p-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-sm grayscale" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-[var(--color-app-ink)] truncate">@{user.username}</span>
              <span className="text-xs text-[var(--color-app-action)] font-semibold">{user.role === 'ADMIN' ? 'Admin' : 'Verified'}</span>
            </div>
            <button 
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--color-app-faint)] transition-colors hover:text-[var(--color-app-ink)] lg:min-h-8 lg:min-w-8"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-[var(--color-app-muted)] transition-all hover:bg-[var(--color-app-surface-lift)] hover:text-[var(--color-app-ink)]"
          >
            <LogIn className="w-4 h-4" />
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
};
