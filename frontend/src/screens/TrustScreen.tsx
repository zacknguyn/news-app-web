import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileCheck2, MessageSquareText, ShieldCheck } from 'lucide-react';
import { usePageMotion } from '../hooks/usePageMotion';

const mechanics = [
  {
    title: 'Source trail',
    copy: 'Claims gain weight when documents, witnesses, or metadata stay attached.',
    icon: FileCheck2,
  },
  {
    title: 'Reader review',
    copy: 'Votes and replies matter most when they add verification context.',
    icon: MessageSquareText,
  },
  {
    title: 'Author trust',
    copy: 'Reliable contributors accumulate visible reputation over time.',
    icon: ShieldCheck,
  },
];

export const TrustScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();

  return (
    <div ref={pageRef} className="hex-page">
      <section data-motion="page" className="grid gap-8 border-b-4 border-[var(--color-app-heading)] pb-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
        <div>
          <p className="hex-kicker">Trust mechanics</p>
          <h1 className="mt-3 max-w-3xl font-[var(--font-display)] text-4xl font-bold leading-[0.95] text-[var(--color-app-heading)] sm:text-5xl">
            Evidence should be visible before confidence is asked for.
          </h1>
        </div>
        <p className="max-w-sm text-sm font-medium leading-6 text-[var(--color-app-muted)]">
          Trust signals are not decorative badges. They are a compact audit trail for readers deciding what deserves attention.
        </p>
      </section>

      <section className="grid border-b border-[var(--color-app-border-clean)] lg:grid-cols-3">
        {mechanics.map(({ title, copy, icon: Icon }, index) => (
          <article data-motion="list" key={title} className="border-t border-[var(--color-app-border-clean)] py-6 lg:border-t-0 lg:border-l lg:px-6 lg:first:border-l-0">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--color-app-muted)]">{String(index + 1).padStart(2, '0')}</span>
              <Icon className="h-5 w-5 text-[var(--color-app-action)]" />
            </div>
            <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-app-heading)]">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-app-muted)]">{copy}</p>
          </article>
        ))}
      </section>

      <Link data-motion="page" to="/app" className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[var(--color-app-heading)] px-5 text-sm font-bold text-[var(--color-app-bg)] hover:bg-[var(--color-app-action)]">
        Return to front page
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default TrustScreen;
