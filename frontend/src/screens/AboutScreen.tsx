import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const principles = [
  ['Raw sincerity', 'Content is primary. Interface decoration stays quiet so sources and claims remain inspectable.'],
  ['Sharp minimalism', 'Dense information is allowed, but hierarchy and whitespace keep it readable.'],
  ['Imaginative flow', 'The product should feel editorial without becoming precious or ornamental.'],
];

const trustLoop = [
  ['Report', 'A contributor posts a claim with context, attachments, and the first source trail.'],
  ['Inspect', 'Authenticated readers challenge, corroborate, and add competing evidence.'],
  ['Score', 'Trust changes as useful verification accumulates around the report and author.'],
];

export const AboutScreen: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      gsap.set('.about-reveal, .principle-row, .trust-step', { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.from('.about-reveal', {
      y: 20,
      autoAlpha: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
    });

    gsap.from('.principle-row', {
      y: 20,
      autoAlpha: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.principles',
        start: 'top 75%',
        once: true,
      },
    });

    gsap.from('.trust-step', {
      y: 24,
      autoAlpha: 0,
      duration: 0.65,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.trust-loop',
        start: 'top 74%',
        once: true,
      },
    });
  }, { scope: rootRef });

  return (
    <main ref={rootRef} className="min-h-dvh bg-[var(--color-off-white)] text-[var(--color-app-ink)]">
      <nav className="fixed left-0 right-0 top-0 z-50 px-3 py-3 sm:px-6">
        <div className="hex-floating-nav mx-auto flex min-h-14 max-w-[1180px] items-center justify-between rounded-[14px] px-4 sm:px-5">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Link to="/login" className="text-sm font-medium text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]">
          Login
        </Link>
        </div>
      </nav>

      <section className="grid min-h-dvh grid-cols-1 border-b border-[var(--color-app-border-clean)] pt-20 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="about-reveal border-b border-[var(--color-app-border-clean)] bg-[var(--color-near-white)] p-6 sm:p-10 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col justify-between">
            <p className="hex-kicker">
              Mission
            </p>
            <div className="mt-20">
              <p className="text-3xl font-semibold leading-tight text-[var(--color-app-action)]">
                The app is gated because scrutiny should have identity behind it.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex flex-col justify-center px-5 py-16 sm:px-10 lg:px-16">
          <p className="about-reveal hex-kicker mb-5">
            About the portal
          </p>
          <h1 className="about-reveal max-w-5xl text-5xl font-semibold leading-[1.02] text-[var(--color-app-action)] sm:text-7xl">
            Independent reporting should be judged by evidence, not proximity to power.
          </h1>
          <p className="about-reveal mt-8 max-w-2xl text-lg leading-8 text-[var(--color-app-muted)]">
            Public pages establish the standard. The app is where authenticated readers and contributors inspect reports, add context, vote, and build trust over time.
          </p>
          <div className="about-reveal mt-10">
            <Link to="/register" className="hex-button-primary inline-flex h-11 items-center gap-2 px-5 text-sm font-medium">
              Request credentials <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="principles divide-y divide-[var(--color-app-border-clean)] border-b border-[var(--color-app-border-clean)] bg-white">
        {principles.map(([title, copy], index) => (
          <div key={title} className="principle-row grid grid-cols-1 px-5 py-8 sm:px-10 md:grid-cols-[160px_1fr] lg:px-16">
            <div className="text-sm font-semibold text-[var(--color-app-muted)]">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="mt-5 md:mt-0">
              <h2 className="text-3xl font-semibold text-[var(--color-app-action)]">{title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-app-muted)]">{copy}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="trust-loop border-b border-[var(--color-app-border-clean)] px-5 py-12 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="hex-kicker">
              Trust loop
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-[var(--color-app-action)] sm:text-5xl">
              The product rewards useful scrutiny, not noise.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {trustLoop.map(([title, copy], index) => (
              <article key={title} className="trust-step hex-card p-5">
                <div className="mb-8 text-sm font-semibold text-[var(--color-app-muted)]">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-2xl font-semibold text-[var(--color-app-action)]">{title}</h3>
                <p className="mt-4 text-sm leading-6 text-[var(--color-app-muted)]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutScreen;
