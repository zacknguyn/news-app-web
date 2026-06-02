import React, { useState } from 'react';

const breakdown = [
  ['Source quality', 82],
  ['Accuracy', 91],
  ['Civility', 76],
  ['Longevity', 68],
] as const;

export const TrustScreen: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const score = 847;

  return (
    <div className="app-page">
      <p className="mono-label mb-3 text-app-action">Your standing</p>
      <h1 className="text-[32px] font-semibold leading-tight text-app-heading">Your trust score</h1>
      <div className="mt-8 font-mono text-[64px] font-semibold leading-none tabular-nums text-app-action">
        {score}
        <span className="text-[24px] text-app-muted"> / 1000</span>
      </div>
      <p className="mt-5 max-w-[65ch] text-base leading-7 text-app-text">
        Trust is calculated from source quality, accuracy, civility, and account longevity. It helps readers understand
        contribution history without turning reputation into decoration.
      </p>

      <section className="mt-10">
        <h2 className="mono-label mb-4 text-app-muted">Breakdown</h2>
        <div className="space-y-5">
          {breakdown.map(([label, value]) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-app-heading">{label}</span>
                <span className="font-mono tabular-nums text-app-muted">{value}</span>
              </div>
              <div className="h-1 bg-app-border">
                <div className="h-full bg-app-action" style={{ width: `${value}%` }} />
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
