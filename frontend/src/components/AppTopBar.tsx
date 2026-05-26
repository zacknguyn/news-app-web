import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogOut, PlusCircle, Search, Settings, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Tooltip } from './ui/Tooltip';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-9 items-center rounded-[4px] px-3 text-sm font-normal transition-colors ${
    isActive
      ? 'bg-[rgb(49_38_59/0.08)] text-[var(--color-app-action)]'
      : 'text-[var(--color-app-muted)] hover:bg-white/70 hover:text-[var(--color-app-action)]'
  }`;

export const AppTopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const profilePath = user ? `/app/u/${user.username}` : '/login';

  return (
    <header className="app-topbar sticky top-0 z-50 bg-transparent px-3 py-3 sm:px-5">
      <div className="hex-floating-nav mx-auto flex min-h-14 w-full max-w-[1180px] items-center gap-3 rounded-[14px] px-3 sm:px-4 lg:px-5">
        <Link to="/app" className="mr-2 flex shrink-0 items-baseline gap-2">
          <span className="text-lg font-semibold leading-none text-[var(--color-app-action)]">News Portal</span>
          <span className="hidden text-xs font-semibold text-[var(--color-app-faint)] sm:inline">Independent</span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
          <NavLink to="/app" end className={navLinkClass}>Feed</NavLink>
          <NavLink to="/app/explore" className={navLinkClass}>Explore</NavLink>
          <NavLink to="/app/highlights" className={navLinkClass}>Notes</NavLink>
          {isAdmin && (
            <NavLink to="/app/admin" className={navLinkClass}>
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip label="Search reports">
            <NavLink
              to="/app/explore"
              aria-label="Search"
              className={({ isActive }) => `inline-flex min-h-10 min-w-10 items-center justify-center rounded-[4px] transition-colors ${isActive ? 'bg-[rgb(49_38_59/0.08)] text-[var(--color-app-action)]' : 'text-[var(--color-app-muted)] hover:bg-white/70 hover:text-[var(--color-app-action)]'}`}
            >
              <Search className="h-4 w-4" />
            </NavLink>
          </Tooltip>
          <NavLink
            to="/app/submit"
            className="hidden min-h-10 items-center gap-2 rounded-[4px] border border-[var(--color-app-action)] bg-[var(--color-app-action)] px-4 text-sm font-normal text-white shadow-[0_8px_16px_-12px_rgb(49_38_59/0.75)] transition-colors hover:bg-[var(--color-app-action-hover)] sm:inline-flex"
          >
            <PlusCircle className="h-4 w-4" />
            Submit
          </NavLink>
          <Tooltip label="Settings">
            <NavLink
              to="/app/settings"
              aria-label="Settings"
              className={({ isActive }) => `hidden min-h-10 min-w-10 items-center justify-center rounded-[4px] transition-colors sm:inline-flex ${isActive ? 'bg-[rgb(49_38_59/0.08)] text-[var(--color-app-action)]' : 'text-[var(--color-app-muted)] hover:bg-white/70 hover:text-[var(--color-app-action)]'}`}
            >
              <Settings className="h-4 w-4" />
            </NavLink>
          </Tooltip>
          <Tooltip label="Profile">
            <NavLink
              to={profilePath}
              aria-label="Profile"
              className={({ isActive }) => `inline-flex min-h-10 min-w-10 items-center justify-center rounded-[4px] transition-colors ${isActive ? 'bg-[rgb(49_38_59/0.08)] text-[var(--color-app-action)]' : 'text-[var(--color-app-muted)] hover:bg-white/70 hover:text-[var(--color-app-action)]'}`}
            >
              <User className="h-4 w-4" />
            </NavLink>
          </Tooltip>
          <Tooltip label="Log out">
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="hidden min-h-10 min-w-10 items-center justify-center rounded-[4px] text-[var(--color-app-muted)] transition-colors hover:bg-white/70 hover:text-[var(--color-app-action)] sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
};
