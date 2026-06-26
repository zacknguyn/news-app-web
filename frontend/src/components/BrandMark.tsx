import React from 'react';

type BrandMarkProps = {
  size?: 'sm' | 'md';
  showText?: boolean;
  stacked?: boolean;
};

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 'md', showText = false, stacked = false }) => {
  const markSize = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';

  return (
    <div className={`inline-flex items-center ${stacked ? 'gap-3' : 'gap-2.5'}`}>
      <img
        src="/logo.svg"
        alt="Tourane News"
        className={`${markSize} shrink-0 object-contain`}
      />
      {showText && (
        <span className={stacked ? 'flex flex-col leading-none' : 'flex items-baseline gap-1.5 leading-none'}>
          <span className="text-lg font-bold tracking-tight text-app-ink">Tourane</span>
          <span className="text-sm font-bold text-app-action">News</span>
        </span>
      )}
    </div>
  );
};
