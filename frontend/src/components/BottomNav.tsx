import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfilePath } from '../lib/profileLinks';

const bottomLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-14 min-w-0 flex-1 items-center justify-center border-t-2 px-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
    isActive
      ? 'border-[var(--color-app-action)] text-[var(--color-app-heading)]'
      : 'border-transparent text-[var(--color-app-faint)] hover:text-[var(--color-app-heading)]'
  }`;

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const profilePath = user ? getProfilePath(user) : '/login';

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 grid h-14 w-full grid-cols-5 border-t border-[var(--color-app-border)] bg-[var(--color-app-bg)] pb-safe lg:hidden"
      aria-label="Mobile primary"
    >
      <NavLink to="/app" end className={bottomLinkClass}>
        Front
      </NavLink>
      <NavLink to="/app/submit" className={bottomLinkClass}>
        File
      </NavLink>
      <NavLink to="/app/highlights" className={bottomLinkClass}>
        Notes
      </NavLink>
      <NavLink to="/app/topics" className={bottomLinkClass}>
        Topics
      </NavLink>
      <NavLink to={profilePath} className={bottomLinkClass}>
        Me
      </NavLink>
    </nav>
  );
};
