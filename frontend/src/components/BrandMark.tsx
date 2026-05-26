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
        className={`${markSize} grid shrink-0 place-items-center rounded-[8px] border border-[var(--color-app-action)] bg-[var(--color-app-action)] font-serif font-bold leading-none text-white shadow-[0_10px_22px_-16px_rgb(49_38_59/0.9)]`}
      >
        TN
      </span>
      {showText && (
        <span className={stacked ? 'flex flex-col leading-none' : 'flex items-baseline gap-1.5 leading-none'}>
          <span className="font-serif text-lg font-semibold text-[var(--color-app-ink)]">Tourane</span>
          <span className="text-sm font-semibold text-[var(--color-app-action)]">News</span>
        </span>
      )}
    </div>
  );
};
