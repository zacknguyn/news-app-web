import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type SearchInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  onClear?: () => void;
  containerClassName?: string;
  size?: 'md' | 'sm';
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, containerClassName, onClear, value, size = 'md', ...rest },
  ref,
) {
  const hasValue = typeof value === 'string' && value.length > 0;
  const sizeClass = size === 'sm' ? 'h-9 text-[13px]' : 'h-10 text-[14px]';

  return (
    <div
      role="search"
      className={cn(
        'flex items-center gap-2 border border-app-border bg-app-bg px-3 transition-shadow focus-within:border-app-action focus-within:shadow-[var(--shadow-focus)]',
        sizeClass,
        containerClassName,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-app-muted" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        value={value}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent text-app-text outline-none placeholder:text-app-faint',
          className,
        )}
        autoComplete="off"
        {...rest}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-app-muted transition-colors hover:text-app-heading"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});
