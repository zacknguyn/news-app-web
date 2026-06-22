import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { executeRecaptcha, isRecaptchaConfigured } from '../lib/recaptcha';

const AVAILABLE_TOPICS = [
  { id: 'tech', label: 'Technology', icon: '⚡' },
  { id: 'geopolitics', label: 'Geopolitics', icon: '🌐' },
  { id: 'economy', label: 'Economy', icon: '📈' },
  { id: 'science', label: 'Science', icon: '🧬' },
];

export const RegisterScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const { register, isAuthenticated, isLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [purpose, setPurpose] = useState('');
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const recaptchaToken = await executeRecaptcha('credential_request');
      const fullFocus = `Org: ${organization}. Purpose: ${purpose}. Topics: ${selectedTopics.join(', ')}`;
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        reportingFocus: fullFocus.trim() || undefined,
        recaptchaToken,
      });
      setStep(3);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to request access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-bg text-on-surface min-h-screen flex flex-col font-ui-medium antialiased">
      {/* TopAppBar Shell */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        <nav className="flex justify-between items-center h-16 px-4 md:px-10 max-w-7xl mx-auto">
          <Link to="/" className="text-headline-md font-bold text-primary tracking-tight">
            Tourane News
          </Link>
          <div className="hidden md:flex gap-8 items-center">
            <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              Intelligent Intelligence Platform
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors text-sm">
              Back to Public Site
            </Link>
          </div>
        </nav>
      </header>

      {/* Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-[520px] bg-white border border-outline-variant rounded-xl shadow-sm p-8 md:p-10 relative overflow-hidden">
          {/* Stepper Progress Indicator */}
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex flex-col items-center gap-2 cursor-default">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  step >= 1 ? 'bg-primary ring-4 ring-green-100' : 'bg-outline-variant'
                }`}
              />
              <span className={`text-[10px] uppercase tracking-wider font-bold ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>
                Interest Tuning
              </span>
            </div>
            <div className={`flex-grow h-[1px] mx-4 mb-4 ${step >= 2 ? 'bg-primary' : 'bg-outline-variant'}`} />
            <div className="flex flex-col items-center gap-2 cursor-default">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  step >= 2 ? 'bg-primary ' + (step === 2 ? 'ring-4 ring-green-100' : '') : 'bg-outline-variant'
                }`}
              />
              <span className={`text-[10px] uppercase tracking-wider font-bold ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>
                Vetting Details
              </span>
            </div>
            <div className={`flex-grow h-[1px] mx-4 mb-4 ${step >= 3 ? 'bg-primary' : 'bg-outline-variant'}`} />
            <div className="flex flex-col items-center gap-2 cursor-default">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  step >= 3 ? 'bg-primary ' + (step === 3 ? 'ring-4 ring-green-100' : '') : 'bg-outline-variant'
                }`}
              />
              <span className={`text-[10px] uppercase tracking-wider font-bold ${step >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>
                Complete
              </span>
            </div>
          </div>

          {/* View Container */}
          <div className="min-h-[320px] flex flex-col justify-between">
            {step === 1 && (
              <section className="step-transition">
                <h2 className="text-xl font-bold text-on-surface mb-2">Personalize your feed</h2>
                <p className="text-xs text-on-surface-variant mb-8">
                  Select the domains you wish to monitor for real-time intelligence gathering.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_TOPICS.map((topic) => {
                    const active = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        className={`flex items-center justify-between px-5 py-4 border rounded-lg text-sm text-left transition-all active:scale-98 ${
                          active
                            ? 'bg-primary border-primary text-white'
                            : 'border-outline-variant text-on-surface hover:border-primary/50'
                        }`}
                      >
                        {topic.label}
                        <span className="text-lg">{topic.icon}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="step-transition space-y-4">
                <h2 className="text-xl font-bold text-on-surface mb-2">Intelligence Vetting</h2>
                <p className="text-xs text-on-surface-variant mb-6">
                  Tourane requires professional verification to grant access to high-tier signal clusters.
                </p>

                {formError && (
                  <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600 rounded-lg">
                    {formError}
                  </div>
                )}

                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Elena Vance"
                      className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block">
                      Direct Contact (Email)
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.vance@truth-portal.net"
                      className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block">
                      Vetting Password (min 6 chars)
                    </label>
                    <input
                      required
                      minLength={6}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create security password"
                      className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block">
                      Organization
                    </label>
                    <input
                      required
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Horizon Analytics"
                      className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block">
                      Statement of Purpose
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Describe your primary research goals..."
                      className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                {isRecaptchaConfigured && (
                  <p className="text-[10px] text-outline leading-tight">
                    Protected by reCAPTCHA. Google may assess this request for abuse prevention.
                  </p>
                )}
              </form>
            )}

            {step === 3 && (
              <section className="step-transition text-center py-6">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 text-primary rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-3xl">✓</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-on-surface mb-3">Application Submitted</h2>
                <p className="text-xs text-on-surface-variant mb-8 max-w-sm mx-auto leading-relaxed">
                  Our editors are reviewing your credentials. You will receive access within 24 hours.
                </p>
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 text-left">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-3 block">
                    Sandbox Access Details
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Email</span>
                      <span className="text-on-surface font-semibold">{email || 'admin@gmail.com'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Access Status</span>
                      <span className="text-amber-600 font-semibold uppercase tracking-wider">Pending Review</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Bottom Action Bar */}
            <div className="mt-12 flex justify-between items-center">
              {step === 1 && (
                <>
                  <Link to="/login" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
                    Already registered? Log In
                  </Link>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={selectedTopics.length === 0}
                    className="bg-primary hover:brightness-110 text-white px-8 py-3 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-98 disabled:opacity-50"
                  >
                    Next
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="text-xs text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !name || !email || !password || !organization || !purpose}
                    className="bg-primary hover:brightness-110 text-white px-8 py-3 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-98 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </>
              )}

              {step === 3 && (
                <div className="w-full text-center">
                  <Link
                    to="/login"
                    className="inline-block bg-primary hover:brightness-110 text-white px-8 py-3 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-98"
                  >
                    Back to Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer className="bg-surface-container-low py-8 border-t border-outline-variant mt-auto text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-10 max-w-7xl mx-auto">
          <div>
            <h2 className="text-sm font-bold text-on-surface">Tourane News</h2>
            <p className="text-[10px] text-outline uppercase tracking-widest font-semibold mt-1">
              © 2026 Tourane News Intelligence. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 md:justify-end items-center text-xs">
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
              AI Ethics
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegisterScreen;
