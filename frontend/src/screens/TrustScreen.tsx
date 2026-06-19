import React, { useEffect, useState } from 'react';
import { backendApi, type BackendTrustResponse } from '../lib/api';

export const TrustScreen: React.FC = () => {
  const [trust, setTrust] = useState<BackendTrustResponse | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    backendApi.getMyTrust()
      .then((data) => { if (isMounted) setTrust(data); })
      .catch((err) => { if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load trust data.'); });
    return () => { isMounted = false; };
  }, []);

  if (error) {
    return (
      <div className="app-page">
        <p className="mono-label mb-3 text-app-action">Your standing</p>
        <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Your trust score</h1>
        <p className="mt-5 max-w-[65ch] text-base leading-7 text-app-text">{error}</p>
      </div>
    );
  }

  if (!trust) {
    return (
      <div className="app-page">
        <p className="mono-label mb-3 text-app-action">Your standing</p>
        <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Your trust score</h1>
        <p className="mt-5 max-w-[65ch] text-base leading-7 text-app-text">
          <span className="swiss-loading"><span>.</span> Loading your trust score</span>
        </p>
      </div>
    );
  }

  return (
    <div className="app-page">
      <p className="mono-label mb-3 text-app-action">Your standing</p>
      <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Your trust score</h1>
      <div className="mt-8 font-mono text-[64px] font-semibold leading-none tabular-nums text-app-action">
        {trust.totalScore}
        <span className="text-[24px] text-app-muted"> / {trust.maxScore}</span>
      </div>
      <p className="mt-5 max-w-[65ch] text-base leading-7 text-app-text">
        Trust is calculated from account longevity, post quality, civility, profile completeness, and subscription tier.
        It helps readers understand contribution history without turning reputation into decoration.
      </p>

      <section className="mt-10">
        <h2 className="mono-label mb-4 text-app-muted">Breakdown</h2>
        <div className="space-y-5">
          {trust.factors.map((factor) => (
            <div key={factor.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-app-heading">{factor.label}</span>
                <span className="font-mono tabular-nums text-app-muted">{factor.score} / {factor.max}</span>
              </div>
              <div className="h-1 bg-app-border">
                <div className="h-full bg-app-action" style={{ width: `${(factor.score / factor.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-app-border pt-6">
        <h2 className="mono-label mb-4 text-app-muted">Recent deductions</h2>
        <p className="text-sm italic text-app-muted">No recent deductions.</p>
      </section>

      <section className="mt-8 border-t border-app-border pt-6">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mono-label text-app-action hover:underline"
        >
          How scores are calculated
        </button>
        {expanded && (
          <p className="mt-4 text-sm leading-6 text-app-muted">
            Scores reward verified sourcing, accurate corrections, useful replies, and sustained account history.
            Moderation events can reduce the score when they point to recurring quality issues.
          </p>
        )}
      </section>
    </div>
  );
};

export default TrustScreen;
