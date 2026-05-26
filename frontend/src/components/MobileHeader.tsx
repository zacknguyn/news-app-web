import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[var(--color-app-border-clean)] bg-white px-4 lg:hidden">
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="-ml-2 p-2 text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)]"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/app" className="flex flex-col leading-none">
          <span className="text-[11px] font-medium text-[var(--color-app-muted)]">Independent</span>
          <span className="text-sm font-semibold text-[var(--color-app-action)]">News Portal</span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <button type="button" aria-label="Search reports" className="p-2 text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)]">
          <Search className="w-5 h-5" />
        </button>
        <button type="button" aria-label="View notifications" className="p-2 text-[var(--color-app-muted)] transition-colors hover:text-[var(--color-app-action)]">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
