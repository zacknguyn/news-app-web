import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';

const steps = [
  ['01', 'File', 'Journalists and readers submit source-backed dispatches.'],
  ['02', 'Inspect', 'Authenticated readers challenge claims and add context.'],
  ['03', 'Rank', 'Votes and trust signals lift the clearest reporting.'],
];

const trustNotes = [
  ['Source trail', 'Reports keep context, comments, and verification near the claim.'],
  ['Visible identity', 'Voting and replies carry account history.'],
  ['Editorial restraint', 'The interface stays quiet so the content remains inspectable.'],
];

const heroImage = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1600&q=85';
const newsroomImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=85';

export const PublicLandingScreen: React.FC = () => (
  <main className="min-h-dvh bg-app-bg text-app-heading">
    <header className="border-b border-app-border">
      <div className="flex min-h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link to="/" aria-label="Tourane News">
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-wider">
          <Link to="/about" className="text-app-muted hover:text-app-action">
            About
          </Link>
          <Link to="/login" className="text-app-muted hover:text-app-action">
            Sign in
          </Link>
          <Link to="/register" className="bg-app-action px-3 py-2 text-app-on-action hover:bg-app-action-hover">
            Request access
          </Link>
        </nav>
      </div>
    </header>

    <section className="grid w-full border-b border-app-border lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.86fr)]">
      <div className="px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <p className="mono-label mb-5 text-app-action">Independent newsroom</p>
        <h1 className="max-w-4xl text-[44px] font-semibold leading-[1.08] tracking-[-0.01em] text-app-heading sm:text-[64px]">
          Independent reporting, verified by readers.
        </h1>
        <p className="mt-6 max-w-[65ch] text-lg leading-8 text-app-text">
          Tourane News is a newsroom for working journalists, freelance correspondents, and the readers who back them.
          Every dispatch is voted on, every source is cited, every contributor is accountable.
        </p>
        <Link
          to="/app"
          className="mt-8 inline-flex h-12 items-center bg-app-action px-5 font-mono text-[12px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover"
        >
          Read today's edition
        </Link>
      </div>
      <figure className="min-h-[22rem] border-t border-app-border lg:min-h-0 lg:border-l lg:border-t-0">
        <img
          src={heroImage}
          alt="Printed newspapers stacked on a newsroom desk"
          className="h-full w-full object-cover"
        />
      </figure>
    </section>

    <section className="grid w-full border-b border-app-border px-4 sm:px-6 md:grid-cols-3 lg:px-10">
      {steps.map(([number, title, copy]) => (
        <article
          key={number}
          className="border-b border-app-border py-8 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"
        >
          <p className="font-mono text-[11px] text-app-muted">{number}</p>
          <h2 className="mt-5 text-xl font-semibold text-app-heading">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-app-muted">{copy}</p>
        </article>
      ))}
    </section>

    <section className="grid w-full gap-8 border-b border-app-border px-4 py-12 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-10">
      <h2 className="mono-label text-app-muted">Trust model</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {trustNotes.map(([title, copy]) => (
          <article key={title}>
            <h3 className="text-base font-semibold text-app-heading">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-app-muted">{copy}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="grid w-full border-b border-app-border lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]">
      <figure className="min-h-[18rem] border-b border-app-border lg:border-b-0 lg:border-r">
        <img
          src={newsroomImage}
          alt="News pages and notes arranged for editorial review"
          className="h-full w-full object-cover"
        />
      </figure>
      <div className="px-4 py-12 sm:px-6 lg:px-10">
        <p className="mono-label text-app-muted">Visual verification</p>
        <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-app-heading">
          Built for screenshots, reviews, and live editorial workflows.
        </h2>
        <p className="mt-4 max-w-[62ch] text-base leading-7 text-app-text">
          The interface keeps article media, source context, profile identity, and admin review close to the action so
          project evaluators can inspect the system without guessing what each workflow does.
        </p>
      </div>
    </section>

    <section className="grid w-full gap-5 border-b border-app-border px-4 py-12 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-10">
      <h2 className="mono-label text-app-muted">Join the newsroom</h2>
      <div>
        <p className="max-w-[65ch] text-base leading-7 text-app-text">
          Access is intentionally gated. Request credentials to publish, vote, save dispatches, and join authenticated
          discussion.
        </p>
        <Link
          to="/register"
          className="mt-4 inline-flex font-mono text-[12px] uppercase tracking-wider text-app-action hover:underline"
        >
          Request credentials
        </Link>
      </div>
    </section>

    <footer className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-[11px] text-app-muted sm:px-6 lg:px-10">
      <span>© 2026 · Tourane News · Independent newsroom, all rights reserved.</span>
      <Link to="/login" className="text-app-action hover:underline">
        Sign in
      </Link>
    </footer>
  </main>
);

export default PublicLandingScreen;
