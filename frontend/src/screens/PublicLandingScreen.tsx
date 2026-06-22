import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen antialiased" style={{ backgroundColor: '#FAF9F6', color: '#1A1A1A', fontFamily: 'Geist Variable, -apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* ── TOP NAV ─────────────────────────────────────── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <Link to="/" style={{ fontSize: 20, fontWeight: 700, color: '#0F5132', textDecoration: 'none', letterSpacing: '-0.3px' }}>
              Tourane News
            </Link>
            <nav style={{ display: 'flex', gap: 28 }}>
              {[['Feed', '/app'], ['Intelligence', '/app'], ['Explore', '/app/browse'], ['Saved', '/app/highlights']].map(([label, href]) => (
                <Link key={label} to={href} style={{ fontSize: 14, fontWeight: 500, color: '#555555', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0F5132')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555555', padding: '4px 6px' }}
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <Link to="/login" style={{ backgroundColor: '#0F5132', color: '#FFFFFF', padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: 80 }}>

        {/* ── HERO ─────────────────────────────────────────── */}
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 40px', textAlign: 'center' }}>
          {/* Pulse badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#E7F3EF', color: '#0F5132', borderRadius: 999, padding: '6px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 32 }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#0F5132', opacity: 0.6, animation: 'ping 1.5s ease-in-out infinite' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0F5132', display: 'block' }} />
            </span>
            Now Powered by v4.0 Intelligence
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 6vw, 58px)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-1px', marginBottom: 20, color: '#1A1A1A' }}>
            Intelligence is the{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#0F5132', fontFamily: 'Merriweather, Georgia, serif' }}>
              New Headline.
            </em>
          </h1>

          <p style={{ fontSize: 18, color: '#555555', lineHeight: 1.65, marginBottom: 40, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
            A vetted, AI-powered reading space designed for analysts and researchers to bypass the noise and focus on signal.
          </p>

          {/* CTA form */}
          <form onSubmit={handleWaitlistSubmit} style={{ position: 'relative', maxWidth: 460, margin: '0 auto 14px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Work email address"
              style={{ width: '100%', height: 52, borderRadius: 999, border: '1.5px solid #E5E7EB', paddingLeft: 20, paddingRight: 180, fontSize: 14, outline: 'none', backgroundColor: '#FFFFFF', color: '#1A1A1A', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              style={{ position: 'absolute', right: 4, top: 4, bottom: 4, backgroundColor: '#0F5132', color: '#FFFFFF', border: 'none', borderRadius: 999, padding: '0 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Request Credentials
            </button>
          </form>
          <p style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Exclusive early access for institutional partners.
          </p>
        </section>

        {/* ── PRODUCT MOCKUP ───────────────────────────────── */}
        <section style={{ maxWidth: 820, margin: '0 auto 80px', padding: '0 24px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, border: '1px solid #E5E7EB', boxShadow: '0 20px 60px -20px rgba(0,0,0,0.12)', padding: '28px 32px', overflow: 'hidden' }}>
            {/* Hub header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#E7F3EF', border: '1px solid #C5E3D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  ⊞
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A' }}>Intelligence Hub</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Live Global Feed Analysis</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F87171', opacity: 0.5 }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FBBF24', opacity: 0.5 }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0F5132', opacity: 0.5 }} />
              </div>
            </div>

            {/* Feed items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Item 1 */}
              <div style={{ padding: '18px 20px', borderRadius: 12, border: '1px solid #E5E7EB', backgroundColor: '#FAF9F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ backgroundColor: '#E7F3EF', color: '#0F5132', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Macro-Economy
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>2 mins ago</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#555555' }}>
                    <span style={{ color: '#0F5132', fontSize: 12 }}>✓</span> 98.4% RELIABILITY
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A', marginBottom: 10 }}>
                  Yield Curve Inversion Signals Shift in Tech Infrastructure Investment
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {['#Treasury', '#TechEquity'].map(tag => (
                    <span key={tag} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#555555' }}>{tag}</span>
                  ))}
                </div>
                <div style={{ backgroundColor: '#FFFFFF', borderLeft: '3px solid #0F5132', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 12, color: '#555555', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "AI Summary: Global markets are pricing in a 15% reduction in data center expansion for Q3, shifting focus toward localized edge computing solutions."
                </div>
              </div>

              {/* Item 2 */}
              <div style={{ padding: '18px 20px', borderRadius: 12, border: '1px solid #E5E7EB', backgroundColor: '#FAF9F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Geopolitics
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>14 mins ago</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#555555' }}>
                    <span style={{ fontSize: 12 }}>🛡</span> 92.1% TRUST SCORE
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A', marginBottom: 12 }}>
                  Strategic Rare Earth Mineral Reserve Policy Update
                </div>
                <div style={{ backgroundColor: '#FFFFFF', borderLeft: '3px solid #D97706', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 12, color: '#555555', lineHeight: 1.6 }}>
                  "AI Insight: Policy shift indicates a 30% increase in supply chain redundancy for semiconductor manufacturing hubs."
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────── */}
        <section style={{ maxWidth: 1000, margin: '0 auto 80px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.5px', color: '#1A1A1A', marginBottom: 12 }}>
              Precision over Volume.
            </h2>
            <p style={{ color: '#555555', maxWidth: 480, margin: '0 auto', lineHeight: 1.65, fontSize: 15 }}>
              We've re-engineered the news stack from the ground up for high-stakes decision making.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: '✨', title: 'AI Summarization Copilot', desc: 'Instant synthesis of complex geopolitical reports into digestible, actionable briefings. Skip the fluff and get straight to the logic.' },
              { icon: '🛡', title: 'Accountability Ledger', desc: 'Every article is scored based on source pedigree, cross-referenced facts, and historical accuracy. Trust is no longer blind.' },
              { icon: '💡', title: 'Private Knowledge Highlights', desc: 'Seamlessly sync your personal research highlights into a secure, encrypted knowledge base that learns your interests.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 24px', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#E7F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>
                  {icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1A', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────── */}
        <section style={{ maxWidth: 1000, margin: '0 auto 80px', padding: '0 24px' }}>
          <div style={{ backgroundColor: '#0F5132', borderRadius: 24, padding: '64px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* subtle texture dots */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 42, fontWeight: 800, color: '#FFFFFF', marginBottom: 16, letterSpacing: '-0.5px' }}>
                Ready for the Signal?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, maxWidth: 420, margin: '0 auto 36px', lineHeight: 1.65 }}>
                Join the waitlist for the most sophisticated information environment ever built for professional researchers.
              </p>
              <Link
                to="/register"
                style={{ display: 'inline-block', backgroundColor: '#FFFFFF', color: '#0F5132', padding: '14px 36px', borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E7F3EF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                Claim Your Invite Code
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#F5F4F1', borderTop: '1px solid #E5E7EB', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 48 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1A1A1A', marginBottom: 12 }}>Tourane News</div>
            <p style={{ color: '#555555', fontSize: 14, maxWidth: 320, lineHeight: 1.65, marginBottom: 16 }}>
              Building the infrastructure for the future of truthful, AI-enhanced information consumption.
            </p>
            <p style={{ color: '#9CA3AF', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              © 2026 · Tourane News Intelligence. All rights reserved.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignSelf: 'start' }}>
            <div>
              <div style={{ fontSize: 11, color: '#0F5132', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Platform</div>
              {['Privacy Policy', 'Terms of Service'].map(label => (
                <a key={label} href="#" style={{ display: 'block', fontSize: 14, color: '#555555', textDecoration: 'none', marginBottom: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0F5132')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
                >{label}</a>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#0F5132', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Company</div>
              {['AI Ethics', 'Contact Support'].map(label => (
                <a key={label} href="#" style={{ display: 'block', fontSize: 14, color: '#555555', textDecoration: 'none', marginBottom: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0F5132')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
                >{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PublicLandingScreen;
