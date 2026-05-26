import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Fingerprint, Radio, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const signals = [
  ['02:14', 'source memo attached', 'verified chain'],
  ['02:27', 'municipal ledger leak', 'awaiting second witness'],
  ['02:39', 'field image authenticated', 'geotag match'],
  ['03:02', 'official statement disputed', 'community review'],
];

export const PublicLandingScreen: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      gsap.set('.landing-reveal, .signal-row, .public-section, .preview-panel', { autoAlpha: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.landing-reveal', {
      y: 22,
      autoAlpha: 0,
      duration: 0.75,
      stagger: 0.08,
    }).from('.signal-row', {
      x: 24,
      autoAlpha: 0,
      duration: 0.55,
      stagger: 0.08,
    }, '-=0.35');

    gsap.to('.signal-board', {
      yPercent: -5,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-grid',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });

    gsap.from('.public-section', {
      y: 26,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.public-sections',
        start: 'top 78%',
        once: true,
      },
    });

    gsap.from('.preview-panel', {
      y: 24,
      autoAlpha: 0,
      duration: 0.65,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: '.product-preview',
        start: 'top 74%',
        once: true,
      },
    });
  }, { scope: rootRef });

  return (
    <main ref={rootRef} className="min-h-dvh bg-[var(--color-off-white)] text-[var(--color-app-ink)]">
      <nav className="fixed left-0 right-0 top-0 z-50 px-3 py-3 sm:px-6">
        <div className="hex-floating-nav mx-auto flex min-h-14 max-w-[1180px] items-center justify-between rounded-[14px] px-4 sm:px-5">
        <Link to="/" className="text-lg font-semibold leading-none text-[var(--color-app-action)]">
          Independent<br />News Portal
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/about" className="hidden text-[var(--color-app-muted)] hover:text-[var(--color-app-action)] sm:inline">About</Link>
          <Link to="/login" className="text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]">Login</Link>
          <Link to="/register" className="hex-button-primary px-4 py-2">Register</Link>
        </div>
        </div>
      </nav>

      <section className="hero-grid grid min-h-dvh grid-cols-1 border-b border-[var(--color-app-border-clean)] pt-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center px-5 py-16 sm:px-10 lg:px-16">
          <p className="landing-reveal hex-kicker mb-5">
            Public record, private access
          </p>
          <h1 className="landing-reveal max-w-5xl text-5xl font-semibold leading-[0.98] text-[var(--color-app-action)] sm:text-7xl lg:text-8xl">
            Follow the report before it becomes a narrative.
          </h1>
          <p className="landing-reveal mt-8 max-w-2xl text-lg leading-8 text-[var(--color-app-muted)]">
            Independent News Portal is a high-trust reporting network for readers, journalists, and insiders who want evidence kept close to the story.
          </p>
          <div className="landing-reveal mt-10 flex flex-wrap gap-3">
            <Link to="/register" className="hex-button-primary inline-flex h-11 items-center gap-2 px-5 text-sm font-medium">
              Request credentials <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/app" className="hex-button-secondary inline-flex h-11 items-center px-5 text-sm font-medium">
              Enter app
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden border-t border-[var(--color-app-border-clean)] bg-[var(--color-near-white)] p-5 sm:p-10 lg:border-l lg:border-t-0">
          <div className="signal-board flex min-h-[520px] flex-col justify-end">
            <div className="mb-8 flex items-center justify-between border-b border-[var(--color-app-border-clean)] pb-4">
              <div className="text-sm font-semibold text-[var(--color-app-ink)]">Live source ledger</div>
              <Radio className="h-5 w-5 text-[var(--color-app-action)]" />
            </div>
            <div className="space-y-3">
              {signals.map(([time, title, status]) => (
                <div key={title} className="signal-row hex-card grid grid-cols-[56px_1fr] gap-4 p-4">
                  <span className="text-xs font-semibold text-[var(--color-app-muted)]">{time}</span>
                  <div>
                    <p className="text-xl font-semibold leading-7 text-[var(--color-app-action)]">{title}</p>
                    <p className="mt-2 text-sm text-[var(--color-app-muted)]">{status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="public-sections grid grid-cols-1 border-b border-[var(--color-app-border-clean)] bg-white md:grid-cols-3">
        {[
          [FileText, 'Claims stay inspectable', 'Reports keep context, comments, and verification trails near the primary claim.'],
          [ShieldCheck, 'Trust is earned in public', 'Reputation follows useful verification, not institutional proximity or volume.'],
          [Fingerprint, 'Access is intentional', 'The working app is gated so contribution, voting, and reply behavior carries identity.'],
        ].map(([Icon, title, copy]) => {
          const IconComponent = Icon as typeof FileText;
          return (
            <div key={title as string} className="public-section border-b border-[var(--color-app-border-clean)] p-8 md:border-b-0 md:border-r last:md:border-r-0">
              <IconComponent className="mb-10 h-6 w-6 text-[var(--color-app-action)]" />
              <h2 className="text-3xl font-semibold leading-tight text-[var(--color-app-action)]">{title as string}</h2>
              <p className="mt-5 text-sm leading-6 text-[var(--color-app-muted)]">{copy as string}</p>
            </div>
          );
        })}
      </section>

      <section className="product-preview border-b border-[var(--color-app-border-clean)] px-5 py-12 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="hex-kicker">
              Product preview
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-[var(--color-app-action)] sm:text-5xl">
              The app keeps the evidence and the argument in the same room.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-6 text-[var(--color-app-muted)]">
              A report is not just a headline. It carries source notes, dispute state, trust movement, and reader scrutiny.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="preview-panel hex-card p-5">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--color-app-border-clean)] pb-3">
                <span className="text-sm font-medium text-[var(--color-app-muted)]">Report</span>
                <span className="text-sm font-medium text-[var(--color-app-action)]">Verified truth</span>
              </div>
              <h3 className="text-3xl font-semibold leading-[1.08] text-[var(--color-app-ink)]">
                Encryption bypass confirmed by two data center workers
              </h3>
              <p className="mt-4 text-sm leading-6 text-[var(--color-app-muted)]">
                Internal logs point to a nightly backup cycle that exposes records outside the published retention policy.
              </p>
              <div className="mt-6 grid grid-cols-3 border-y border-[var(--color-app-border-clean)] py-4 text-center text-xs text-[var(--color-app-muted)]">
                <div><strong className="block text-lg text-[var(--color-app-action)]">+43</strong> score</div>
                <div><strong className="block text-lg text-[var(--color-app-action)]">12</strong> source notes</div>
                <div><strong className="block text-lg text-[var(--color-app-action)]">89</strong> comments</div>
              </div>
            </article>

            <div className="space-y-4">
              <article className="preview-panel hex-card-soft p-5">
                <span className="text-sm font-medium text-[var(--color-app-muted)]">Trust movement</span>
                <div className="mt-5 space-y-4">
                  {['Witness corroborated', 'Metadata checked', 'Official rebuttal disputed'].map((item, index) => (
                    <div key={item} className="flex items-center justify-between border-t border-[var(--color-app-border-clean)] pt-3">
                      <span className="text-sm text-[var(--color-app-muted)]">{item}</span>
                      <span className="text-xs font-semibold text-[var(--color-app-action)]">+{index + 2}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="preview-panel hex-card p-5">
                <span className="text-sm font-medium text-[var(--color-app-muted)]">Reader scrutiny</span>
                <p className="mt-4 border-l border-[var(--color-app-border)] pl-4 text-xl leading-7 text-[var(--color-app-ink)]">
                  “The backup window lines up with the contractor badge logs.”
                </p>
                <p className="mt-3 text-sm text-[var(--color-app-muted)]">@thorne_reports</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PublicLandingScreen;
