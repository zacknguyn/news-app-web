import React from 'react';

type BrandMarkProps = {
  size?: 'sm' | 'md';
  showText?: boolean;
  stacked?: boolean;
};

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 'md', showText = true, stacked = false }) => {
  const markSize = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs';

  return (
    <div className={`inline-flex items-center ${stacked ? 'gap-3' : 'gap-2.5'}`}>
      <span
        aria-hidden="true"
        className={`${markSize} grid shrink-0 place-items-center border border-app-action bg-app-action font-sans font-bold tracking-tight text-app-on-action`}
      >
        TN
      </span>
      {showText && (
        <span className={stacked ? 'flex flex-col leading-none' : 'flex items-baseline gap-1.5 leading-none'}>
          <span className="text-lg font-bold tracking-tight text-app-ink">Tourane</span>
          <span className="text-sm font-bold text-app-action">News</span>
        </span>
      )}
    </div>
  );
};
