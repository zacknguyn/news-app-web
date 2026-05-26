import React, { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export const LoginScreen: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/app';

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set('.auth-reveal, .auth-card', { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.from('.auth-reveal', {
      y: 18,
      autoAlpha: 0,
      duration: 0.65,
      stagger: 0.08,
      ease: 'power3.out',
    });

    gsap.from('.auth-card', {
      y: 18,
      autoAlpha: 0,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power3.out',
      delay: 0.15,
    });
  }, { scope: rootRef });

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to log in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main ref={rootRef} className="grid min-h-dvh bg-[var(--color-canvas-white)] text-[var(--color-obsidian-ink)] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex min-h-[42dvh] flex-col justify-between border-b border-[var(--color-app-border)] bg-[var(--color-platinum-mist)] p-6 text-[var(--color-obsidian-ink)] sm:p-10 lg:min-h-dvh lg:border-b-0 lg:border-r">
        <Link to="/" className="auth-reveal inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)]">
          <ArrowLeft className="h-4 w-4" />
          Public site
        </Link>
        <div>
          <p className="auth-reveal mb-5 text-xs font-semibold text-[var(--color-app-muted)]">
            Account access
          </p>
          <h1 className="auth-reveal max-w-xl font-serif text-5xl font-medium leading-none sm:text-6xl">
            Sign in to the newsroom.
          </h1>
          <p className="auth-reveal mt-6 max-w-md text-sm leading-6 text-[var(--color-app-muted)]">
            Use your approved account to read, publish, vote, and join article discussions.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-1 gap-3">
            {[
              ['Backend status', 'Local'],
              ['Access model', 'Approved users'],
              ['Current role', 'Reader / Admin'],
            ].map(([label, value]) => (
              <div key={label} className="auth-card flex items-center justify-between rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-canvas-white)] px-4 py-3 shadow-[var(--shadow-hex-card-hover)]">
                <span className="text-xs text-[var(--color-app-muted)]">{label}</span>
                <span className="font-mono text-sm font-bold text-[var(--color-app-ink)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <header className="auth-reveal mb-10">
            <p className="mb-3 text-xs font-semibold text-[var(--color-app-muted)]">
              Login
            </p>
            <h2 className="font-serif text-4xl font-medium text-[var(--color-app-ink)]">
              Log in
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-app-muted)]">
              Use your account email and password. Seed admin: admin@gmail.com / 12345.
            </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {formError && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-app-muted)]">
              Email
            </label>
            <input 
              type="email" 
              placeholder="admin@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3 text-sm text-[var(--color-app-ink)] outline-none transition-colors placeholder:text-[var(--color-app-faint)] focus:border-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-[var(--color-app-muted)]">
                Password
              </label>
            </div>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              minLength={5}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3 text-sm text-[var(--color-app-ink)] outline-none transition-colors placeholder:text-[var(--color-app-faint)] focus:border-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] focus:ring-0"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-[var(--color-app-action)] bg-[var(--color-app-action)] py-4 text-sm font-normal text-white transition-all hover:bg-[var(--color-app-action-hover)] disabled:border-[var(--color-lavender-field)] disabled:bg-[var(--color-lavender-field)] disabled:text-[var(--color-cement-gray)]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                Log in
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <footer className="mt-10 border-t border-[var(--color-app-border-clean)] pt-8">
          <p className="mb-4 text-sm text-[var(--color-app-muted)]">
            Need access?
          </p>
          <Link 
            to="/register" 
            className="text-sm font-semibold text-[var(--color-app-ink)] hover:underline"
          >
            Request credentials
          </Link>
        </footer>
        </div>
      </section>
    </main>
  );
};

export default LoginScreen;
