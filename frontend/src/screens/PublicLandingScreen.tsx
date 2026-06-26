import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';

const UNSPLASH_BASE = 'https://images.unsplash.com';

// Verified Unsplash photo IDs — all confirmed live
const images = {
  // Person reading newspaper by calm water — warm editorial tone
  hero: `${UNSPLASH_BASE}/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=1400&q=80`,
  // Abstract glowing AI neural network — fits "AI summaries" feature
  featureAi: `${UNSPLASH_BASE}/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1400&q=80`,
  // Dark laptop with glowing screen on a minimal desk
  productMockup: `${UNSPLASH_BASE}/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1400&q=80`,
  // Newspaper close-up, dramatic black & white — editorial texture
  ctaBg: `${UNSPLASH_BASE}/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1800&q=80`,
};

export const PublicLandingScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      navigate(`/register?email=${encodeURIComponent(email.trim())}`);
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text antialiased font-sans">

      {/* ── TOP NAV ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-app-surface/88 backdrop-blur-md border-b border-app-border">
        <div className="mx-auto max-w-[1120px] px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" aria-label="Tourane News home">
              <BrandMark size="md" showText={false} />
            </Link>
            <nav className="hidden md:flex gap-7">
              {[['Feed', '/app'], ['Browse', '/app/browse'], ['Highlights', '/app/highlights']].map(([label, href]) => (
                <Link
                  key={label}
                  to={href}
                  className="text-xs font-semibold tracking-wide text-app-muted hover:text-app-action transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="bg-app-action hover:bg-app-action-hover text-app-on-action px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24">

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1120px] px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left: copy + CTA */}
          <div className="flex flex-col items-start">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-[1.12] mb-5 text-app-heading">
              Read with clarity.
            </h1>
            <p className="text-base sm:text-lg text-app-muted leading-relaxed mb-10 max-w-[480px]">
              A reading platform designed for people who want deeper context, fewer distractions, and better tools for understanding the news.
            </p>
            <form onSubmit={handleWaitlistSubmit} className="relative w-full max-w-[440px] mb-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Work email address"
                aria-label="Work email address"
                className="w-full h-13 rounded-full border border-app-border pl-6 pr-[11rem] text-sm focus:border-app-action focus:ring-2 focus:ring-app-action-soft outline-none bg-app-surface text-app-text transition-all box-border"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 bg-app-action hover:bg-app-action-hover text-app-on-action rounded-full px-6 text-xs font-bold transition-colors cursor-pointer active:scale-[0.97]"
              >
                Request access
              </button>
            </form>
            <p className="text-[10px] text-app-faint tracking-wider uppercase font-bold">
              Early access for institutional partners.
            </p>
          </div>

          {/* Right: hero photo */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.3)] border border-app-border aspect-[4/3]">
            <img
              src={images.hero}
              alt="Person reading a newspaper peacefully — the clarity Tourane brings"
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Subtle dark gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            {/* Inner ring */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <section className="mx-auto max-w-[1000px] px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-app-heading mb-3">
              How it works.
            </h2>
            <p className="text-app-muted max-w-[480px] mx-auto leading-relaxed text-sm sm:text-base">
              Tourane is a community-driven reading platform with tools for deeper understanding.
            </p>
          </div>

          {/* AI feature image banner */}
          <div className="relative rounded-2xl overflow-hidden border border-app-border mb-8 shadow-subtle aspect-[21/6]">
            <img
              src={images.featureAi}
              alt="Abstract neural network representing AI-powered news intelligence"
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-app-bg/80 via-transparent to-app-bg/80 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/90 font-bold text-lg tracking-tight drop-shadow-md">
                Powered by intelligence, guided by humans.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-app-surface border border-app-border rounded-2xl p-7 hover:shadow-raised hover:border-app-action/30 hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-app-action-soft flex items-center justify-center text-xl mb-5 text-app-action">✨</div>
              <h3 className="font-bold text-base text-app-heading mb-2.5">AI summaries</h3>
              <p className="text-xs sm:text-sm text-app-muted leading-relaxed">Instant synthesis of long-form reports into digestible briefings. Skip the fluff and get straight to the key points.</p>
            </div>
            <div className="bg-app-surface border border-app-border rounded-2xl p-7 hover:shadow-raised hover:border-app-action/30 hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-app-action-soft flex items-center justify-center text-xl mb-5 text-app-action">🛡</div>
              <h3 className="font-bold text-base text-app-heading mb-2.5">Source transparency</h3>
              <p className="text-xs sm:text-sm text-app-muted leading-relaxed">Every article is scored on source quality and cross-referenced facts. Trust is earned, not assumed.</p>
            </div>
            <div className="bg-app-surface border border-app-border rounded-2xl p-7 hover:shadow-raised hover:border-app-action/30 hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-app-action-soft flex items-center justify-center text-xl mb-5 text-app-action">💡</div>
              <h3 className="font-bold text-base text-app-heading mb-2.5">Personal highlights</h3>
              <p className="text-xs sm:text-sm text-app-muted leading-relaxed">Sync your research highlights into a private knowledge base that grows with your interests.</p>
            </div>
          </div>
        </section>

        {/* ── PRODUCT MOCKUP ───────────────────────────────── */}
        <section className="mx-auto max-w-[900px] px-6 mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-app-heading mb-2">
              The feed, reimagined.
            </h2>
            <p className="text-sm text-app-muted max-w-[400px] mx-auto">
              A clean, distraction-free reading experience built for depth.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-app-border shadow-[0_32px_80px_rgba(0,0,0,0.35)] aspect-[16/9]">
            <img
              src={images.productMockup}
              alt="Dark laptop with glowing screen — representing the Tourane reading interface"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-app-bg/70 to-transparent pointer-events-none" />
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────── */}
        <section className="mx-auto max-w-[1000px] px-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="bg-app-surface border border-app-border rounded-2xl p-8 md:p-10">
              <span className="text-3xl mb-5 block">📋</span>
              <h3 className="text-xl font-bold text-app-heading mb-3">Briefings that respect your time</h3>
              <p className="text-sm text-app-muted leading-relaxed">Daily and weekly digests summarizing the stories that matter to you. Concise, editorial, and delivered on your schedule.</p>
            </div>
            <div className="bg-app-surface border border-app-border rounded-2xl p-8 md:p-10">
              <span className="text-3xl mb-5 block">🔖</span>
              <h3 className="text-xl font-bold text-app-heading mb-3">Research tools built in</h3>
              <p className="text-sm text-app-muted leading-relaxed">Highlight, save, and organize posts into notebooks. Export your research when you need it.</p>
            </div>
            <div className="bg-app-surface border border-app-border rounded-2xl p-8 md:p-10 md:col-span-2 md:max-w-[50%] md:mx-auto">
              <span className="text-3xl mb-5 block">🔒</span>
              <h3 className="text-xl font-bold text-app-heading mb-3">Privacy-first design</h3>
              <p className="text-sm text-app-muted leading-relaxed">Your reading data is yours. No tracking, no ads, no algorithms optimized for engagement over understanding.</p>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────── */}
        <section className="mx-auto max-w-[1000px] px-6 mb-20">
          <div
            className="rounded-[24px] p-12 sm:p-16 text-center relative overflow-hidden"
          >
            {/* Newspaper texture from Unsplash */}
            <div
              className="absolute inset-0 rounded-[24px]"
              style={{
                backgroundImage: `url(${images.ctaBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.25) saturate(0)',
              }}
            />
            {/* Colour tint overlay */}
            <div className="absolute inset-0 bg-app-action/70 rounded-[24px]" />
            {/* Dot pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24px_24px,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-[24px]" />

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-app-on-action tracking-tight mb-4">
                Ready to read better?
              </h2>
              <p className="text-white/80 text-xs sm:text-sm max-w-[420px] mx-auto mb-10 leading-relaxed">
                Join the waitlist and be the first to know when we launch.
              </p>
              <Link
                to="/register"
                className="inline-block bg-white text-app-action hover:bg-app-action-faint px-9 py-3.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-[0.97]"
              >
                Get early access
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-app-surface-alt border-t border-app-border py-12 px-6">
        <div className="mx-auto max-w-[1000px] grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12">
          <div>
            <div className="font-extrabold text-lg text-app-heading mb-3">Tourane News</div>
            <p className="text-app-muted text-sm leading-relaxed mb-4 max-w-[320px]">
              A community-driven reading platform with tools for deeper understanding.
            </p>
            <p className="text-[10px] text-app-faint tracking-wider uppercase font-bold">
              &copy; 2026 &middot; Tourane News. All rights reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 self-start">
            <div>
              <div className="text-[10px] text-app-action tracking-wider uppercase font-bold mb-3.5">Legal</div>
              <Link to="/privacy" className="block text-sm text-app-muted hover:text-app-action mb-2.5 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="block text-sm text-app-muted hover:text-app-action mb-2.5 transition-colors">Terms of Service</Link>
            </div>
            <div>
              <div className="text-[10px] text-app-action tracking-wider uppercase font-bold mb-3.5">Company</div>
              <Link to="/about" className="block text-sm text-app-muted hover:text-app-action mb-2.5 transition-colors">About</Link>
              <a href="mailto:support@touranenews.com" className="block text-sm text-app-muted hover:text-app-action mb-2.5 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingScreen;
