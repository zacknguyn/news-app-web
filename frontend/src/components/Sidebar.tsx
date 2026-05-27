import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MOCK_CHANNELS } from '../lib/mockData';
import { Sword, Cpu, Building, CloudRain, Hash, Info, PlusCircle, Settings, LogOut, LogIn, Highlighter, ShieldCheck, Newspaper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backendApi } from '../lib/api';
import { backendTopicToChannel } from '../lib/backendAdapters';
import type { Channel } from '../types';

const ICON_MAP: Record<string, any> = {
  Sword,
  Cpu,
  Building,
  CloudRain
};

const sortChannels = (channels: Channel[]) =>
  [...channels].sort((a, b) => Number(Boolean(b.joined)) - Number(Boolean(a.joined)) || a.name.localeCompare(b.name));

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
        if (isMounted) setChannels([]);
      }
    };

    loadChannels();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-[var(--color-app-border-clean)] bg-[var(--color-app-surface)] lg:w-64">
      <div className="border-b border-[var(--color-app-border-clean)] px-5 py-5">
        <Link to="/app" className="block group">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-action)]">
            News reader
          </div>
          <div className="mt-1 font-[var(--font-display)] text-2xl font-bold leading-none text-[var(--color-app-heading)] group-hover:text-[var(--color-app-action)]">
            Front Page
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--color-app-muted)]">
            Reporting first, discussion second.
          </p>
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
          <h3 className="mb-2 px-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-faint)]">
            Reader
          </h3>
          <nav className="space-y-1">
            <NavLink
              to="/app"
              end
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-all
                ${isActive ? 'bg-[var(--color-app-surface-lift)] text-[var(--color-app-ink)] shadow-[var(--shadow-hex-focus)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)] hover:bg-[var(--color-app-surface-lift)]'}
              `}
            >
              <Newspaper className="w-4 h-4" />
              Front Page
            </NavLink>
            <NavLink
              to="/app/topics"
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-all
                ${isActive ? 'bg-[var(--color-app-surface-lift)] text-[var(--color-app-ink)] shadow-[var(--shadow-hex-focus)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)] hover:bg-[var(--color-app-surface-lift)]'}
              `}
            >
              <Hash className="w-4 h-4" />
              Topics
            </NavLink>
          </nav>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-faint)]">
              Topics
            </h3>
            <Link to="/app/c/new" className="text-[var(--color-app-faint)] transition-colors hover:text-[var(--color-app-action)]" aria-label="Create channel">
              <PlusCircle className="h-4 w-4" />
            </Link>
          </div>
          <nav className="space-y-1">
            {sortChannels(channels).map(channel => {
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
                  <span className="min-w-0 flex-1 truncate">{channel.name}</span>
                  {channel.joined && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-app-action)]" />}
                </NavLink>
              );
            })}
          </nav>
        </section>

        <section>
          <h3 className="mb-2 px-2 text-xs font-bold uppercase tracking-widest text-[var(--color-app-faint)]">
            Reading Tools
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
