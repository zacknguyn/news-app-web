import React, { useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field, Input, TextArea } from '../components/ui/Input';
import { executeRecaptcha, isRecaptchaConfigured } from '../lib/recaptcha';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const registerImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85';

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
      const recaptchaToken = await executeRecaptcha('credential_request');
      await register({
        name: name.trim(),
        email,
        password,
        reportingFocus: focus.trim() || undefined,
        recaptchaToken,
      });
      setRequestSubmitted(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to register.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main ref={rootRef} className="grid min-h-dvh bg-app-bg text-app-heading lg:grid-cols-[0.88fr_1.12fr]">
      <section
        className="relative flex min-h-[42dvh] flex-col justify-between overflow-hidden border-b border-[var(--color-app-border)] bg-app-heading p-6 text-app-bg sm:p-10 lg:min-h-dvh lg:border-b-0 lg:border-r"
        style={{ backgroundImage: `url(${registerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-app-heading/70" aria-hidden="true" />
        <Link
          to="/"
          className="auth-reveal relative z-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-app-bg/75 hover:text-app-bg"
        >
          <ArrowLeft className="h-4 w-4" />
          Public site
        </Link>
        <div className="relative z-10">
          <p className="auth-reveal mono-label mb-5 text-app-bg/75">Credential request</p>
          <h1 className="auth-reveal max-w-xl text-[40px] font-semibold leading-[1.15] tracking-[-0.01em] text-app-bg">
            Request newsroom access.
          </h1>
          <p className="auth-reveal mt-6 max-w-md text-base leading-7 text-app-bg/80">
            Submit your details for the credential request workflow. Admin review happens in the operations surface.
          </p>
          <div className="mt-10 border-y border-app-bg/25">
            {[
              ['01', 'Share who you are.'],
              ['02', 'Create an account password.'],
              ['03', 'Wait for admin approval.'],
            ].map(([step, copy]) => (
              <div
                key={step}
                className="auth-card grid grid-cols-[36px_1fr] gap-3 border-b border-app-bg/20 py-3 last:border-b-0"
              >
                <span className="font-mono text-[11px] text-app-bg/55">{step}</span>
                <span className="text-sm leading-6 text-app-bg/80">{copy}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-xl">
          <header className="auth-reveal mb-10">
            <p className="mb-3 text-xs font-semibold text-[var(--color-app-muted)]">Register</p>
            <h2 className="font-display text-3xl font-bold text-app-heading">Request access</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-app-muted)]">
              Current backend creates the account immediately. The pending approval flow still needs backend support.
            </p>
          </header>

          {requestSubmitted ? (
            <div className="border-y border-[var(--color-app-border)] py-8">
              <h3 className="text-2xl font-semibold text-app-heading">Request submitted.</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-app-muted)]">
                Your account is waiting for admin approval. You can log in after an admin approves your request.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex min-h-11 items-center border border-[var(--color-app-action)] bg-[var(--color-app-action)] px-5 py-2 font-mono text-[12px] uppercase tracking-wider text-app-on-action transition-colors hover:bg-[var(--color-app-action-hover)]"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              {formError && (
                <div className="sm:col-span-2 border border-state-error-border bg-state-error-bg px-4 py-3 text-sm font-semibold text-state-error">
                  {formError}
                </div>
              )}
              <Field id="register-name" label="Full Name">
                <Input
                  id="register-name"
                  autoComplete="name"
                  placeholder="Elena Vance"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field id="register-password" label="Password" hint="Minimum 6 characters">
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field id="register-email" label="Direct Contact (Email)">
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder="e.vance@truth-portal.net"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field
                  id="register-focus"
                  label="Reporting focus"
                  hint="The current registration endpoint does not store this yet; it is kept for the approval workflow design."
                >
                  <TextArea
                    id="register-focus"
                    placeholder="Briefly describe what you want to read, publish, or verify."
                    required
                    rows={4}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                {isRecaptchaConfigured && (
                  <p className="mb-3 text-xs leading-5 text-app-muted">
                    Protected by reCAPTCHA. Google may assess this request for abuse prevention.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 w-full items-center justify-center gap-2 border border-app-action bg-app-action font-mono text-[12px] uppercase tracking-wider text-app-on-action transition-colors hover:bg-app-action-hover active:translate-y-px disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Request access
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <footer className="mt-10 border-t border-[var(--color-app-border-clean)] pt-8">
            <p className="mono-label mb-4 text-[var(--color-app-muted)]">Already have an active ID?</p>
            <Link to="/login" className="font-mono text-[12px] text-[var(--color-app-action)] hover:underline">
              Log in
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default RegisterScreen;
