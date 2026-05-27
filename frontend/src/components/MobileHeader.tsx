import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { BrandMark } from './BrandMark';

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
        <Link to="/app" className="flex items-center">
          <BrandMark size="sm" />
        </Link>
      </div>
      <Link to="/app/submit" className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
        Report
      </Link>
    </header>
  );
};
