import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Search, User, Highlighter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const profilePath = user ? `/app/u/${user.username}` : '/login';

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-between border-t border-[var(--color-app-border-clean)] bg-[var(--color-app-surface)] px-3 shadow-[var(--shadow-hex-card)] pb-safe lg:hidden">
      <NavLink 
        to="/app" 
        className={({ isActive }) => `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-[var(--color-app-ink)]' : 'text-[var(--color-app-faint)]'}`}
      >
        <Home className="w-6 h-6" />
        <span className="text-[11px] font-medium">Home</span>
      </NavLink>

      <NavLink 
        to="/app/explore" 
        className={({ isActive }) => `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-[var(--color-app-ink)]' : 'text-[var(--color-app-faint)]'}`}
      >
        <Search className="w-6 h-6" />
        <span className="text-[11px] font-medium">Explore</span>
      </NavLink>

      <NavLink 
        to="/app/submit" 
        className="flex min-h-11 min-w-11 flex-col items-center justify-center -mt-8"
      >
        <div className="rounded-[12px] border-4 border-[var(--color-app-surface)] bg-[var(--color-app-action)] p-3 text-[var(--color-canvas-white)] shadow-[var(--shadow-hex-card-hover)] transition-transform active:scale-95">
          <PlusCircle className="w-7 h-7" />
        </div>
        <span className="mt-1 text-[11px] font-medium text-[var(--color-app-ink)]">Post</span>
      </NavLink>

      <NavLink 
        to="/app/highlights" 
        className={({ isActive }) => `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-[var(--color-app-ink)]' : 'text-[var(--color-app-faint)]'}`}
      >
        <Highlighter className="w-6 h-6" />
        <span className="text-[11px] font-medium">Notes</span>
      </NavLink>

      <NavLink 
        to={profilePath}
        className={({ isActive }) => `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-[var(--color-app-ink)]' : 'text-[var(--color-app-faint)]'}`}
      >
        <User className="w-6 h-6" />
        <span className="text-[11px] font-medium">Profile</span>
      </NavLink>
    </nav>
  );
};
