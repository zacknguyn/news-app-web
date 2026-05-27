import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMotion } from '../hooks/usePageMotion';

const mechanics = [
  ['Source trail', 'Claims gain weight when documents, witnesses, or metadata stay attached.'],
  ['Reader review', 'Votes and replies matter most when they add verification context.'],
  ['Author trust', 'Reliable contributors accumulate visible reputation over time.'],
];

export const TrustScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();

  return (
    <div ref={pageRef} className="hex-page">
      <header data-motion="page" className="hex-page-header">
        <p className="hex-kicker">Trust mechanics</p>
        <h1 className="hex-title mt-2">Trust follows useful evidence.</h1>
        <p className="hex-copy mt-3 max-w-2xl">
          The public mission explains the standard. This app view keeps the mechanics close to the work.
        </p>
      </header>

      <section className="hex-card overflow-hidden divide-y divide-[var(--color-app-border-clean)]">
        {mechanics.map(([title, copy], index) => (
          <article data-motion="list" key={title} className="grid grid-cols-[44px_1fr] gap-4 px-5 py-5">
            <span className="text-sm font-semibold text-[var(--color-app-muted)]">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-app-action)]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-app-muted)]">{copy}</p>
            </div>
          </article>
        ))}
      </section>

      <Link data-motion="page" to="/app" className="hex-button-secondary mt-6 inline-flex min-h-11 items-center px-5 text-sm font-medium">
        Return to front page
      </Link>
    </div>
  );
};

export default TrustScreen;
