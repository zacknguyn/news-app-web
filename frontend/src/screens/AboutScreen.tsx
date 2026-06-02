import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';

const timeline = [
  ['2024', 'Prototype newsroom begins as a reader-first reporting surface.'],
  ['2025', 'Credential requests, topics, posts, comments, votes, and admin review come online.'],
  ['2026', 'Tourane Swiss system aligns every surface around dense editorial clarity.'],
  ['Now', 'Readers, contributors, and moderators share one trust-first workflow.'],
];

const principles = [
  'Evidence before confidence',
  'Identity behind scrutiny',
  'Reader context near every claim',
  'Moderation that leaves an audit trail',
  'No visual noise around reporting',
];

export const AboutScreen: React.FC = () => (
  <main className="min-h-dvh bg-app-bg text-app-heading">
    <header className="border-b border-app-border">
      <div className="flex min-h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link to="/">
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-wider">
          <Link to="/" className="text-app-muted hover:text-app-action">
            Home
          </Link>
          <Link to="/login" className="text-app-action hover:underline">
            Sign in
          </Link>
        </nav>
      </div>
    </header>

    <section className="grid w-full gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-10 lg:py-16">
      <article className="max-w-[68ch]">
        <p className="mono-label mb-4 text-app-action">About</p>
        <h1 className="text-[40px] font-semibold leading-[1.12] tracking-[-0.01em] text-app-heading">
          A working newsroom
        </h1>
        <div className="mt-8 space-y-6 text-[17px] leading-[1.65] text-app-text">
          <p>Tourane News is built for independent reporting that has to survive scrutiny.</p>
          <p>
            Every product decision keeps the reader close to the claim: source trails, comment threads, votes, saves,
            highlights, and moderator actions all sit in the same sober interface.
          </p>
          <p>
            The app borrows the density of community forums and the restraint of a printed broadsheet. The result is a
            tool for reading and verification, not a portal for noise.
          </p>
          <p>
            Contributors earn trust through consistent accuracy. Readers earn influence by adding useful context.
            Moderators keep the record clear without changing the visual language.
          </p>
        </div>
      </article>

      <aside className="border-t border-app-border pt-6 lg:border-t-0 lg:border-l lg:pl-6">
        <h2 className="mono-label mb-4 text-app-muted">Timeline</h2>
        <div className="space-y-4">
          {timeline.map(([year, event]) => (
            <div key={year} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border-b border-app-border pb-4">
              <span className="font-mono text-[11px] text-app-action">{year}</span>
              <p className="text-sm leading-6 text-app-text">{event}</p>
            </div>
          ))}
        </div>
        <h2 className="mono-label mb-4 mt-8 text-app-muted">Editorial principles</h2>
        <ol className="space-y-3">
          {principles.map((principle, index) => (
            <li key={principle} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm text-app-text">
              <span className="font-mono text-[11px] text-app-muted">{String(index + 1).padStart(2, '0')}</span>
              <span>{principle}</span>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  </main>
);

export default AboutScreen;
