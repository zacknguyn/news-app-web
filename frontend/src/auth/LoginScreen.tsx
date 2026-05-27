import React, { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
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
    <main ref={rootRef} className="grid min-h-dvh bg-white text-[var(--color-app-text)] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex min-h-[42dvh] flex-col justify-between border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-6 sm:p-10 lg:min-h-dvh lg:border-b-0 lg:border-r">
        <Link to="/" className="auth-reveal inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-app-muted)] hover:text-[var(--color-app-action)]">
          <ArrowLeft className="h-4 w-4" />
          Public site
        </Link>
        <div>
          <p className="auth-reveal mb-5 text-xs font-bold uppercase tracking-widest text-[var(--color-app-action)]">
            Account access
          </p>
          <h1 className="auth-reveal editorial-h2 max-w-xl !text-5xl sm:!text-6xl">
            Sign in to the newsroom.
          </h1>
          <p className="auth-reveal mt-6 max-w-md text-lg leading-relaxed text-[var(--color-app-muted)]">
            Use your approved account to read, publish, vote, and join article discussions.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-1 gap-3">
            {[
              ['Backend status', 'Local / Live'],
              ['Access model', 'Approved users'],
              ['Current role', 'Reader / Admin'],
            ].map(([label, value]) => (
              <div key={label} className="auth-card flex items-center justify-between border border-[var(--color-app-border)] bg-white px-4 py-3 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">{label}</span>
                <span className="font-mono text-sm font-bold text-[var(--color-app-heading)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <header className="auth-reveal mb-10 border-b-4 border-[var(--color-app-heading)] pb-6">
            <h2 className="editorial-h2 mb-2">
              Sign In
            </h2>
            <p className="text-sm font-medium text-[var(--color-app-muted)]">
              Use your account email and password. Seed admin: <code className="text-[var(--color-app-action)]">admin@gmail.com</code> / <code className="text-[var(--color-app-action)]">12345</code>.
            </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {formError && (
            <Alert tone="error" className="mb-6">
              {formError}
            </Alert>
          )}
          <div className="space-y-2">
            <label htmlFor="login-email" className="editorial-label !text-sm !font-bold uppercase tracking-widest">
              Email
            </label>
            <input 
              id="login-email"
              type="email" 
              placeholder="admin@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bulwark-input w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="login-password" className="editorial-label !text-sm !font-bold uppercase tracking-widest">
                Password
              </label>
            </div>
            <input 
              id="login-password"
              type="password" 
              placeholder="••••••••"
              required
              minLength={5}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bulwark-input w-full"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="bulwark-button-primary w-full !h-14 !text-base uppercase tracking-widest"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                Log in
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <footer className="mt-10 border-t border-[var(--color-app-border)] pt-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)]">
            Need access?
          </p>
          <Link 
            to="/register" 
            className="text-sm font-bold text-[var(--color-app-action)] hover:underline"
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
