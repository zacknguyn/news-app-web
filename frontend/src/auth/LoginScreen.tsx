import React, { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { Field, Input } from '../components/ui/Input';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

type RouterState = {
  from?: {
    pathname?: string;
  };
};

const loginImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85';

export const LoginScreen: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as RouterState | null)?.from?.pathname || '/app';

  useGSAP(
    () => {
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
    },
    { scope: rootRef },
  );

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
    <main
      ref={rootRef}
      className="grid min-h-dvh bg-[var(--color-app-bg)] text-[var(--color-app-text)] lg:grid-cols-[0.92fr_1.08fr]"
    >
      <section
        className="relative flex min-h-[42dvh] flex-col justify-between overflow-hidden border-b border-[var(--color-app-border)] bg-app-heading p-6 text-app-bg sm:p-10 lg:min-h-dvh lg:border-b-0 lg:border-r"
        style={{ backgroundImage: `url(${loginImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-app-heading/68" aria-hidden="true" />
        <Link
          to="/"
          className="auth-reveal relative z-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-app-bg/75 hover:text-app-bg"
        >
          <ArrowLeft className="h-4 w-4" />
          Public site
        </Link>
        <div className="relative z-10">
          <p className="auth-reveal mono-label mb-5 text-app-bg/75">Account access</p>
          <h1 className="auth-reveal max-w-xl text-[40px] font-semibold leading-[1.15] tracking-[-0.01em] text-app-bg">
            Sign in to the newsroom.
          </h1>
          <p className="auth-reveal mt-6 max-w-md text-base leading-7 text-app-bg/80">
            Use your approved account to read, publish, vote, and join article discussions.
          </p>
          <p className="auth-card mt-10 max-w-md border-y border-app-bg/25 py-4 font-mono text-[11px] uppercase tracking-wider text-app-bg/75">
            Reader access · verified discussions · saved reporting
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <header className="auth-reveal mb-10 border-b-2 border-[var(--color-app-heading)] pb-6">
            <h2 className="mb-2 text-2xl font-semibold leading-[1.2] text-app-heading">Sign In</h2>
            <p className="text-sm leading-6 text-[var(--color-app-muted)]">
              Use your account email and password. Seed admin:{' '}
              <code className="text-[var(--color-app-action)]">admin@gmail.com</code> /{' '}
              <code className="text-[var(--color-app-action)]">12345</code>.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {formError && (
              <Alert tone="error" className="mb-6">
                {formError}
              </Alert>
            )}
            <Field id="login-email" label="Email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="admin@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field id="login-password" label="Password">
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                required
                minLength={5}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 border border-app-action bg-app-action font-mono text-[12px] uppercase tracking-wider text-app-on-action transition-colors hover:bg-app-action-hover active:translate-y-px disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Log in
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-10 border-t border-[var(--color-app-border)] pt-8">
            <p className="mono-label mb-4 text-[var(--color-app-muted)]">Need access?</p>
            <Link to="/register" className="font-mono text-[12px] text-[var(--color-app-action)] hover:underline">
              Request credentials
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default LoginScreen;
