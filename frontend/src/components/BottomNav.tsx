import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfilePath } from '../lib/profileLinks';
import { readAppPreferences, subscribeAppPreferences } from '../lib/appPreferences';

const bottomLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-14 min-w-0 flex-1 items-center justify-center border-t-2 px-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
    isActive
      ? 'border-[var(--color-app-action)] text-[var(--color-app-heading)]'
      : 'border-transparent text-[var(--color-app-faint)] hover:text-[var(--color-app-heading)]'
  }`;

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(() => readAppPreferences());
  const profilePath = user ? getProfilePath(user) : '/login';
  const isVi = preferences.language === 'vi';

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 grid h-14 w-full grid-cols-5 border-t border-[var(--color-app-border)] bg-[var(--color-app-bg)] pb-safe lg:hidden"
      aria-label="Mobile primary"
    >
      <NavLink to="/app" end className={bottomLinkClass}>
        {isVi ? 'Trang chủ' : 'Home'}
      </NavLink>
      <NavLink to="/app/submit" className={bottomLinkClass}>
        {isVi ? 'Đăng bài' : 'Submit'}
      </NavLink>
      <NavLink to="/app/browse" className={bottomLinkClass}>
        {isVi ? 'Khám phá' : 'Browse'}
      </NavLink>
      <NavLink to="/app/highlights" className={bottomLinkClass}>
        {isVi ? 'Ghi chú' : 'Notes'}
      </NavLink>
      <NavLink to={profilePath} className={bottomLinkClass}>
        {isVi ? 'Tôi' : 'Me'}
      </NavLink>
    </nav>
  );
};
