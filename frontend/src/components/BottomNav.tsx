import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, User, Hash, Highlighter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const profilePath = user ? `/app/u/${user.username}` : '/login';

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-between border-t border-[var(--color-app-border-clean)] bg-[var(--color-app-surface)] px-3 pb-safe lg:hidden">
      <NavLink 
        to="/app" 
        className={({ isActive }) => `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-[var(--color-app-ink)]' : 'text-[var(--color-app-faint)]'}`}
      >
        <Home className="w-6 h-6" />
        <span className="text-[11px] font-medium">Home</span>
      </NavLink>

      <NavLink 
        to="/app/submit" 
        className={({ isActive }) => `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-[var(--color-app-ink)]' : 'text-[var(--color-app-faint)]'}`}
      >
        <PlusCircle className="w-6 h-6" />
        <span className="text-[11px] font-medium">Post</span>
      </NavLink>

      <NavLink 
        to="/app/highlights" 
        className={({ isActive }) => `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-[var(--color-app-ink)]' : 'text-[var(--color-app-faint)]'}`}
      >
        <Highlighter className="w-6 h-6" />
        <span className="text-[11px] font-medium">Notes</span>
      </NavLink>

      <NavLink 
        to="/app/topics" 
        className={({ isActive }) => `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-[var(--color-app-ink)]' : 'text-[var(--color-app-faint)]'}`}
      >
        <Hash className="w-6 h-6" />
        <span className="text-[11px] font-medium">Topics</span>
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
