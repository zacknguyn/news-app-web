import React, { useEffect, useRef, useState } from 'react';
import { Copy, Link2, Mail, Quote, Send, Share2, X } from 'lucide-react';
import { absoluteShareUrl, copyShareText, openEmailShare, shareViaDevice } from '../../lib/share';

type ShareButtonProps = {
  title: string;
  text?: string;
  url: string;
  kind?: 'post' | 'quote' | 'section' | 'saved';
  label?: string;
  iconOnly?: boolean;
  className?: string;
  successMessage?: string;
  onDiscuss?: () => void;
};

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  kind = 'post',
  label = 'Share',
  iconOnly = false,
  className = 'inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]',
  successMessage,
  onDiscuss,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shareUrl = absoluteShareUrl(url);
  const compactText = (text || title).trim();
  const quoteText = compactText.startsWith('"') ? compactText : `"${compactText}"`;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const runAction = async (action: () => unknown | Promise<unknown>) => {
    await action();
    setIsOpen(false);
  };

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen((current) => !current);
  };

  const optionClass =
    'flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm font-semibold text-[var(--color-app-heading)] hover:bg-[var(--color-app-surface-alt)]';
  const isQuote = kind === 'quote';
  const isSection = kind === 'section';

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={className}
        aria-label={iconOnly ? label : undefined}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={iconOnly ? label : undefined}
      >
        <Share2 className="h-4 w-4" />
        {!iconOnly && label}
      </button>

      {isOpen && (
        <span
          ref={panelRef}
          role="dialog"
          aria-label={`Share ${title}`}
          className="fixed inset-x-3 bottom-3 z-50 block border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-2 shadow-[var(--shadow-modal)] sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-72"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="mb-2 flex items-start justify-between gap-3 border-b border-[var(--color-app-border-clean)] px-2 pb-2">
            <span className="min-w-0">
              <span className="block text-xs font-bold text-[var(--color-app-muted)]">Share</span>
              <span className="mt-1 block truncate text-sm font-bold text-[var(--color-app-heading)]">{title}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex min-h-9 min-w-9 items-center justify-center text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]"
              aria-label="Close share panel"
            >
              <X className="h-4 w-4" />
            </button>
          </span>

          <button
            type="button"
            className={optionClass}
            onClick={() =>
              runAction(() => copyShareText(shareUrl, successMessage || `${isSection ? 'Section' : 'Link'} copied.`))
            }
          >
            <Link2 className="h-4 w-4 text-[var(--color-app-action)]" />
            Copy link
          </button>

          {isQuote ? (
            <>
              <button
                type="button"
                className={optionClass}
                onClick={() => runAction(() => copyShareText(compactText, 'Quote copied.'))}
              >
                <Quote className="h-4 w-4 text-[var(--color-app-action)]" />
                Copy quote
              </button>
              <button
                type="button"
                className={optionClass}
                onClick={() =>
                  runAction(() => copyShareText(`${quoteText}\n\n${title}\n${shareUrl}`, 'Quote copied with link.'))
                }
              >
                <Copy className="h-4 w-4 text-[var(--color-app-action)]" />
                Copy quote + link
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={optionClass}
                onClick={() => runAction(() => copyShareText(`${title}\n${shareUrl}`, 'Title copied with link.'))}
              >
                <Copy className="h-4 w-4 text-[var(--color-app-action)]" />
                Copy title + link
              </button>
              {text && (
                <button
                  type="button"
                  className={optionClass}
                  onClick={() =>
                    runAction(() =>
                      copyShareText(
                        `${title}\n\n${text}\n\n${shareUrl}`,
                        successMessage || 'Summary copied with link.',
                      ),
                    )
                  }
                >
                  <Quote className="h-4 w-4 text-[var(--color-app-action)]" />
                  Copy {isSection ? 'description' : 'summary'} + link
                </button>
              )}
            </>
          )}

          <button
            type="button"
            className={optionClass}
            onClick={() => runAction(() => shareViaDevice({ title, text: isQuote ? quoteText : text, url }))}
          >
            <Send className="h-4 w-4 text-[var(--color-app-action)]" />
            Share via device
          </button>

          <button
            type="button"
            className={optionClass}
            onClick={() => runAction(() => openEmailShare({ title, text: isQuote ? quoteText : text, url }))}
          >
            <Mail className="h-4 w-4 text-[var(--color-app-action)]" />
            Email
          </button>

          {isQuote && onDiscuss && (
            <button type="button" className={optionClass} onClick={() => runAction(onDiscuss)}>
              <Quote className="h-4 w-4 text-[var(--color-app-action)]" />
              Discuss quote
            </button>
          )}
        </span>
      )}
    </span>
  );
};
