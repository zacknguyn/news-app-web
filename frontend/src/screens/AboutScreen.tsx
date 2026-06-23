import React from 'react';
import { GitBranch, LockKeyhole, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// Verified Unsplash photo — journalist desk at night with city lights
const ABOUT_HERO_IMG = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1800&q=80';
// Open blank notebook — used for the empty/lost feeling on 404
export const NOTFOUND_IMG = 'https://images.unsplash.com/photo-1586339949216-35c2747cc36d?auto=format&fit=crop&w=800&q=80';
import { BrandMark } from '../components/BrandMark';

const philosophies = [
  { icon: GitBranch, title: 'Decentralized Moderation', text: 'Validation through a distributed network of subject-matter experts. No single authority dictates the truth; collective expertise ensures multi-faceted objectivity.' },
  { icon: Sparkles, title: 'AI Augmentation', text: 'We use language models to detect bias and verify cross-references, not to replace reporting. Humans remain the architects of every narrative we publish.' },
  { icon: LockKeyhole, title: 'Privacy Ledger', text: 'Your reading habits are yours alone. Personalized insights are designed to preserve privacy without identifying the individual behind the screen.' },
];

const team = [
  { name: 'Dr. Elena Voss', role: 'Chief of Ethics', rep: '99+ REP', bio: 'Former investigative lead at Reuters. Specialist in algorithmic bias mitigation.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYJkpgygXQxVnbhRgvs74hBblqk5FphsM_AM9s3J7BnwwBaBesk3YhW_vSYIFIiyqkmTzuhtyh2K5X6KbNBltAi4gSV2Vo_q8K2TSAP8DM7XfXafNlPZKWKM-DmRp8cm4T-eTpGSt8U0I4Jn73KtgKKtQ_c0r2AM5jNTz_BEAXOr22mdwcA94Ue00Jq-KI-NkBfK8AW1yU1r1wBy1AYBQ_0S2uVuGpWmg5cB41k8iXphA04u3FmkCFACFh-waxSPtAYcBOz3Y-4A' },
  { name: 'Julian Thorne', role: 'AI Architect', rep: '94 REP', bio: 'Developer of the Vetted-LLM protocol. Pioneering human-in-the-loop validation.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR4R_NfM_hF3RiL97pb7TU227CjUvUzR6ZsLA43pFeovUzaHcRv1sKYBgl-8XanYs_K-hUo6sVIdlZBHzeeII-gtu2oopc1zggEJSoUYNe_wuwWSHsZFxC0hQzzRDBDIXYcl5HyYRF44s4V_hW9247SEdhDFQEijdTcAq0fV7LKlSIhhPNjfdsbPSDehyKc5zUZ5E72NsWRPGhzBSYmh-qvLnF1AAEDsNcilRBFEix0KCTc2E3iGkWT5tODj75AHYkAvict_feNg' },
  { name: 'Sarah Cheng', role: 'Data Integrity', rep: '88 REP', bio: 'Quantitative analyst focused on disinformation patterns and network theory.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0sEK4105xxX63boQYtX7tUkKLf0mNSlNMbghk7nwGerpqyXsdSdMc4kJWtW0kqrLc90FjX_dgjYk0hRN90xyUdgw1kPydsQPVHMftOGOzmAxXNUlG4yL6PtFWnugtYKdOv-Ga1UcrQXNaVKi4ExxcqTWrfKX1tvuHUU3Em4eNWBsup7BgxMiC6wg0_XuuXkVFtYOuURd7SDb7cVp8_vh1IzWu2OBdZGQqmkJVert-Xj8q0Gc1hEfWVcPr_URLjp-9fzUBVCYitw' },
  { name: 'Marcus Bale', role: 'Lead Strategy', rep: '91 REP', bio: 'Expert in decentralized governance and economic models for journalism.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn9JuOcurX1WlPoXPJiymfzTzTfWHQTIM5LapFxq0RHXdmnOwhmuwh3nabhv1YQkoc16YI9ueNZPZ7I2rF4Y0PGegiU7A0ieOT_F8nnNzrAprTL8GrHdMqUuj2hoicucOg2WlqWAdtqzc-oC6n-B-6c2evT6NEMRUrCyyNVJfTJtHemZED3vAM46ZSS7sL4qR-X0uZQaj8SWLSaZIKLM5dru0BxVqBUmRRCuTwl0if3FvdSxZ_9vxfN0-doRRS8yODH5Ujb_PqUA' },
];

export const AboutScreen: React.FC = () => (
  <div className="min-h-dvh overflow-x-hidden bg-app-bg text-app-heading">
    <header className="sticky top-0 z-50 border-b border-app-border bg-app-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-8"><Link to="/" aria-label="Tourane News home"><BrandMark size="sm" /></Link><nav className="hidden items-center gap-6 md:flex">{[['Feed', '/app'], ['Intelligence', '/app'], ['Explore', '/app/browse'], ['Saved', '/app/highlights']].map(([label, to]) => <Link key={label} to={to} className="text-sm font-medium text-app-muted transition-colors hover:text-app-action">{label}</Link>)}</nav></div>
        <div className="flex items-center gap-3"><Link to="/app/browse" aria-label="Search reports" className="rounded-full p-2 text-app-muted hover:bg-app-surface-alt hover:text-app-action"><Search className="h-5 w-5" /></Link><Link to="/login" className="rounded-lg bg-app-action px-5 py-2 text-sm font-semibold text-app-on-action transition-colors hover:bg-app-action-hover">Sign in</Link></div>
      </div>
    </header>

    <main>
      {/* ── PHOTO HERO ────────────────────────────────────── */}
      <section id="editorial-ethos" className="relative overflow-hidden">
        {/* Full-width editorial photo */}
        <div className="relative h-[420px] sm:h-[520px] lg:h-[600px] w-full">
          <img
            src={ABOUT_HERO_IMG}
            alt="Journalist's desk at night — newspapers, laptop, notes and city lights through the window"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />
          {/* Dark overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-app-bg" />
          {/* Text on top */}
          <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 h-full flex flex-col justify-end pb-14">
            <div className="max-w-3xl">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-white/60">About</p>
              <h1 className="font-serif text-[40px] font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[56px]">A Sanctuary for <em className="font-normal">Vetted Journalism</em>.</h1>
              <p className="mt-6 font-serif text-[17px] leading-8 text-white/75 sm:text-lg max-w-2xl">In an era of synthetic noise and algorithmic echo chambers, Tourane News Intelligence stands as a bastion of verified clarity. We believe information is a public utility, and its integrity is non-negotiable.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-6 lg:px-10 lg:pb-32"><div className="grid gap-6 md:grid-cols-3">{philosophies.map(({ icon: Icon, title, text }) => <article key={title} className="group rounded-xl border border-app-border bg-app-surface p-7 shadow-[var(--shadow-subtle)] transition-all hover:-translate-y-1 hover:border-app-action/30 hover:shadow-[var(--shadow-raised)]"><div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-app-action-soft text-app-action transition-colors group-hover:bg-app-action group-hover:text-app-on-action"><Icon className="h-5 w-5" /></div><h2 className="mb-4 font-serif text-xl font-bold text-app-heading">{title}</h2><p className="text-sm leading-6 text-app-muted">{text}</p></article>)}</div></section>

      <section className="bg-app-surface-alt py-20 lg:py-24"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10"><div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-app-muted">Team</p><h2 className="font-serif text-4xl font-bold tracking-tight text-app-heading sm:text-5xl">The Intelligence Unit</h2></div><Link to="/register" className="w-fit border-b border-app-action pb-1 text-sm font-semibold text-app-action hover:text-app-action-hover">Join the fellows</Link></div><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">{team.map(member => <article key={member.name} className="text-center"><div className="relative mx-auto mb-6 w-fit"><img loading="lazy" src={member.image} alt={`${member.name}, ${member.role}`} className="h-40 w-40 rounded-full border-4 border-app-surface object-cover grayscale shadow-lg transition duration-500 hover:grayscale-0" /><span className="absolute bottom-2 right-0 rounded-full bg-app-action px-2 py-1 font-mono text-[9px] font-bold text-app-on-action">{member.rep}</span></div><h3 className="font-serif text-xl font-bold text-app-heading">{member.name}</h3><p className="mb-4 mt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-app-action">{member.role}</p><p className="text-[13px] leading-5 text-app-muted">{member.bio}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-[1280px] px-4 py-24 sm:px-6 lg:px-10 lg:py-32"><div className="relative overflow-hidden rounded-3xl bg-app-action p-8 text-app-on-action sm:p-12 lg:p-20"><div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" /><div className="relative max-w-2xl"><h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">Join our Researcher Circle.</h2><p className="mb-10 mt-6 font-serif text-lg leading-8 text-white/80">We are looking for seasoned journalists and data scientists to join our decentralized validation network. Help us build the future of news.</p><div className="flex flex-col gap-4 sm:flex-row"><Link to="/register" className="rounded-xl bg-white px-8 py-4 text-center text-sm font-semibold text-app-action transition-transform hover:scale-[1.02]">Request access</Link><Link to="/about#editorial-ethos" className="rounded-xl border border-white/30 px-8 py-4 text-center text-sm font-semibold text-white hover:bg-white/10">Read our charter</Link></div></div></div></section>
    </main>

    <footer className="border-t border-app-border bg-app-surface-alt py-12"><div className="mx-auto grid max-w-[1280px] gap-10 px-4 sm:px-6 md:grid-cols-2 lg:px-10"><div><BrandMark /><p className="mt-5 max-w-sm text-sm leading-6 text-app-muted">High-performance information consumption for the modern strategist.</p><p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-app-faint">© 2026 Tourane News Intelligence. All rights reserved.</p></div><div className="grid grid-cols-2 gap-8 md:justify-self-end"><div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase text-app-faint">Legal</span><Link to="/about#editorial-ethos" className="text-sm text-app-muted hover:text-app-action">Privacy policy</Link><Link to="/about#editorial-ethos" className="text-sm text-app-muted hover:text-app-action">Terms of service</Link></div><div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase text-app-faint">Community</span><Link to="/about#editorial-ethos" className="text-sm text-app-muted hover:text-app-action">AI ethics</Link><Link to="/register" className="text-sm text-app-muted hover:text-app-action">Contact support</Link></div></div></div></footer>
  </div>
);

export default AboutScreen;
