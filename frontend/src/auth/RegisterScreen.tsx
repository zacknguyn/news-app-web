import React, { useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export const RegisterScreen: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focus, setFocus] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, isAuthenticated, isLoading } = useAuth();

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
      await register({ name: name.trim(), email, password, reportingFocus: focus.trim() || undefined });
      setRequestSubmitted(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to register.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main ref={rootRef} className="grid min-h-dvh bg-[var(--color-canvas-white)] text-[var(--color-obsidian-ink)] lg:grid-cols-[0.88fr_1.12fr]">
      <section className="flex min-h-[42dvh] flex-col justify-between border-b border-[var(--color-app-border)] bg-[var(--color-platinum-mist)] p-6 text-[var(--color-obsidian-ink)] sm:p-10 lg:min-h-dvh lg:border-b-0 lg:border-r">
        <Link to="/" className="auth-reveal inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)]">
          <ArrowLeft className="h-4 w-4" />
          Public site
        </Link>
        <div>
          <p className="auth-reveal mb-5 text-xs font-semibold text-[var(--color-app-muted)]">
            Credential request
          </p>
          <h1 className="auth-reveal max-w-xl font-serif text-5xl font-medium leading-none sm:text-6xl">
            Request newsroom access.
          </h1>
          <p className="auth-reveal mt-6 max-w-md text-sm leading-6 text-[var(--color-app-muted)]">
            Submit your details for an account. Backend approval will replace instant registration when that contract is ready.
          </p>
          <div className="mt-10 space-y-3">
            {[
              ['1', 'Share who you are.'],
              ['2', 'Create an account password.'],
              ['3', 'Wait for admin approval once backend support is added.'],
            ].map(([step, copy]) => (
              <div key={step} className="auth-card grid grid-cols-[36px_1fr] gap-3 rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-canvas-white)] p-4 shadow-[var(--shadow-hex-card-hover)]">
                <span className="font-mono text-xs font-bold text-[var(--color-app-muted)]">{step}</span>
                <span className="text-sm leading-6 text-[var(--color-app-ink)]">{copy}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-xl">
          <header className="auth-reveal mb-10">
            <p className="mb-3 text-xs font-semibold text-[var(--color-app-muted)]">
              Register
            </p>
            <h2 className="font-serif text-4xl font-medium text-[var(--color-app-ink)]">
              Request access
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-app-muted)]">
              Current backend creates the account immediately. The pending approval flow still needs backend support.
            </p>
        </header>

        {requestSubmitted ? (
          <div className="border-y border-[var(--color-app-border)] py-8">
            <h3 className="font-serif text-3xl font-medium text-[var(--color-app-ink)]">Request submitted.</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-app-muted)]">
              Your account is waiting for admin approval. You can log in after an admin approves your request.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex min-h-11 items-center rounded-[4px] border border-[var(--color-app-action)] bg-[var(--color-app-action)] px-5 py-2 text-sm font-normal text-white transition-colors hover:bg-[var(--color-app-action-hover)]"
            >
              Back to login
            </Link>
          </div>
        ) : (
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          {formError && (
            <div className="sm:col-span-2 border border-[var(--color-state-error-border)] bg-[var(--color-state-error-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-state-error)]">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="register-name" className="text-sm font-semibold text-[var(--color-app-muted)]">
              Full Name
            </label>
            <input 
              id="register-name"
              type="text" 
              placeholder="Elena Vance"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3 text-sm text-[var(--color-app-ink)] outline-none transition-colors placeholder:text-[var(--color-app-faint)] focus:border-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="register-password" className="text-sm font-semibold text-[var(--color-app-muted)]">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3 text-sm text-[var(--color-app-ink)] outline-none transition-colors placeholder:text-[var(--color-app-faint)] focus:border-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] focus:ring-0"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label htmlFor="register-email" className="text-sm font-semibold text-[var(--color-app-muted)]">
              Direct Contact (Email)
            </label>
            <input 
              id="register-email"
              type="email" 
              placeholder="e.vance@truth-portal.net"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3 text-sm text-[var(--color-app-ink)] outline-none transition-colors placeholder:text-[var(--color-app-faint)] focus:border-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] focus:ring-0"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label htmlFor="register-focus" className="text-sm font-semibold text-[var(--color-app-muted)]">
              Reporting focus
            </label>
            <textarea 
              id="register-focus"
              placeholder="Briefly describe what you want to read, publish, or verify."
              required
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="h-32 w-full resize-none rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 py-3 text-sm text-[var(--color-app-ink)] outline-none transition-colors placeholder:text-[var(--color-app-faint)] focus:border-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] focus:ring-0"
            />
            <p className="text-sm leading-6 text-[var(--color-app-muted)]">
              This field is kept for the approval workflow design. The current backend registration endpoint does not store it yet.
            </p>
          </div>

          <div className="sm:col-span-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-[var(--color-app-action)] bg-[var(--color-app-action)] py-4 text-sm font-normal text-white transition-all hover:bg-[var(--color-app-action-hover)] disabled:border-[var(--color-lavender-field)] disabled:bg-[var(--color-lavender-field)] disabled:text-[var(--color-cement-gray)]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Request access
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
        )}

        <footer className="mt-10 border-t border-[var(--color-app-border-clean)] pt-8">
          <p className="mb-4 text-sm text-[var(--color-app-muted)]">
            Already have an active ID?
          </p>
          <Link 
            to="/login" 
            className="text-sm font-semibold text-[var(--color-app-ink)] hover:underline"
          >
            Log in
          </Link>
        </footer>
        </div>
      </section>
    </main>
  );
};

export default RegisterScreen;
