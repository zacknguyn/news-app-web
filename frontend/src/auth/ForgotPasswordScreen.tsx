import React, { useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field, Input } from '../components/ui/Input';
import { backendApi } from '../lib/api';
import { toast } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

type Step = 'email' | 'reset' | 'done';

export const ForgotPasswordScreen: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const { isAuthenticated, isLoading } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from('.auth-reveal', { y: 18, autoAlpha: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out' });
    },
    { scope: rootRef },
  );

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await backendApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 5) {
      toast.error('Password must be at least 5 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await backendApi.resetPassword(email, code, newPassword);
      toast.success('Password reset successfully');
      setStep('done');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main ref={rootRef} className="grid min-h-dvh bg-[var(--color-app-bg)] text-[var(--color-app-text)] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative flex min-h-[42dvh] flex-col justify-between overflow-hidden border-b border-[var(--color-app-border)] bg-app-heading p-6 text-app-bg sm:p-10 lg:min-h-dvh lg:border-b-0 lg:border-r">
        <div className="absolute inset-0 bg-app-heading/68" aria-hidden="true" />
        <Link to="/login" className="auth-reveal relative z-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-app-bg/75 hover:text-app-bg">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <div className="relative z-10">
          <p className="auth-reveal mono-label mb-5 text-app-bg/75">Password reset</p>
          <h1 className="auth-reveal max-w-xl text-[40px] font-semibold leading-[1.15] tracking-[-0.01em] text-app-bg">
            {step === 'done' ? 'All set.' : 'Reset your password.'}
          </h1>
          <p className="auth-reveal mt-6 max-w-md text-base leading-7 text-app-bg/80">
            {step === 'done'
              ? 'Your password has been updated. Sign in with your new credentials.'
              : 'Enter your account email to receive a 6-digit reset code.'}
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          {step === 'done' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-app-action">
                <CheckCircle className="h-8 w-8" />
                <h2 className="text-2xl font-semibold text-app-heading">Password reset</h2>
              </div>
              <p className="text-sm leading-6 text-app-muted">
                Your password was reset successfully. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 border border-app-action bg-app-action font-mono text-[12px] uppercase tracking-wider text-app-on-action transition-colors hover:bg-app-action-hover active:translate-y-px"
              >
                Sign in
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          ) : !sent ? (
            <>
              <header className="auth-reveal mb-10 border-b-2 border-[var(--color-app-heading)] pb-6">
                <h2 className="mb-2 text-2xl font-semibold text-app-heading">Forgot password</h2>
                <p className="text-sm leading-6 text-app-muted">
                  Enter the email address associated with your account.
                </p>
              </header>

              <form className="space-y-6" onSubmit={handleSendCode}>
                <Field id="reset-email" label="Email">
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <>Send reset code</>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <header className="auth-reveal mb-10 border-b-2 border-[var(--color-app-heading)] pb-6">
                <h2 className="mb-2 text-2xl font-semibold text-app-heading">Check your email</h2>
                <p className="text-sm leading-6 text-app-muted">
                  A 6-digit code was sent to <strong className="text-app-heading">{email}</strong>. It expires in 10 minutes.
                </p>
              </header>

              <form className="space-y-6" onSubmit={handleReset}>
                <Field id="reset-code" label="Reset code">
                  <Input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </Field>

                <Field id="new-password" label="New password">
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min. 5 characters"
                      required
                      minLength={5}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-app-muted hover:text-app-heading"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 border border-app-action bg-app-action font-mono text-[12px] uppercase tracking-wider text-app-on-action transition-colors hover:bg-app-action-hover active:translate-y-px disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Reset password</>
                  )}
                </button>
              </form>
            </>
          )}

          <footer className="mt-10 border-t border-[var(--color-app-border)] pt-8">
            <p className="mono-label mb-4 text-[var(--color-app-muted)]">Remember your password?</p>
            <Link to="/login" className="font-mono text-[12px] text-[var(--color-app-action)] hover:underline">
              Back to sign in
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default ForgotPasswordScreen;
