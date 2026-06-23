import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, ReceiptText, Search, SlidersHorizontal } from 'lucide-react';
import { backendApi, type BackendTrustResponse } from '../lib/api';

const ledger = [
  ['2026-06-23 09:12', 'Global Energy Markets Volatility Analysis', 'VERIFIED', 98.2, '0x8f2a...1e9z'],
  ['2026-06-23 08:45', 'Quantum Computing Scalability Milestones', 'PARTIAL', 65.4, '0x4c31...99a0'],
  ['2026-06-22 22:30', 'Regional Trade Accord Draft', 'VERIFIED', 92.1, '0xef88...bb22'],
];

export const TrustScreen: React.FC = () => {
  const [trust, setTrust] = useState<BackendTrustResponse | null>(null);
  const [error, setError] = useState('');
  const [reliability, setReliability] = useState(85);
  const [decay, setDecay] = useState(2);
  const [width, setWidth] = useState(12);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    backendApi.getMyTrust().then(data => mounted && setTrust(data)).catch(err => mounted && setError(err instanceof Error ? err.message : 'Unable to load trust data.'));
    return () => { mounted = false; };
  }, []);

  const score = useMemo(() => Math.min(99.9, Math.max(10, reliability * 0.7 + width * 0.8 - decay * 0.4)), [reliability, decay, width]);
  const rows = ledger.filter(row => String(row[1]).toLowerCase().includes(query.toLowerCase()) || String(row[4]).toLowerCase().includes(query.toLowerCase()));

  if (error) return <div className="app-page"><h1 className="text-3xl font-semibold text-app-heading">Consensus Trust Framework</h1><p className="mt-5 text-state-error">{error}</p></div>;
  if (!trust) return <div className="app-page"><span className="swiss-loading"><span>.</span> Loading trust framework</span></div>;
  const percent = trust.maxScore ? (trust.totalScore / trust.maxScore) * 100 : 0;

  return <div className="app-page mx-auto max-w-[1280px]">
    <header className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-app-muted">Methodology</p><h1 className="text-[34px] font-bold tracking-tight text-app-heading md:text-5xl">Consensus Trust Framework</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">A data-driven approach to information integrity using multi-source verification and reputation scoring.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-app-action-soft px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-app-action"><i className="h-2 w-2 animate-pulse rounded-full bg-app-action" />Live audit active</span></header>

    <section className="mb-6 flex flex-col items-center gap-10 overflow-hidden rounded-xl border border-app-border bg-app-surface p-7 shadow-[var(--shadow-subtle)] md:flex-row">
      <div className="relative grid h-44 w-44 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-app-action) ${percent * 3.6}deg,var(--color-app-border) 0)` }}><div className="grid h-36 w-36 place-items-center rounded-full bg-app-surface text-center"><div><strong className="block text-3xl text-app-action">{percent.toFixed(1)}%</strong><span className="font-mono text-[9px] uppercase tracking-widest text-app-muted">Score</span></div></div></div>
      <div className="min-w-0 flex-1"><h2 className="mb-5 text-2xl font-semibold text-app-heading">Current account health</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{trust.factors.slice(0, 4).map(f => <div key={f.label} className="rounded-lg bg-app-action-soft p-4"><p className="font-mono text-[9px] uppercase tracking-wider text-app-muted">{f.label}</p><p className="mt-1 text-xl font-semibold text-app-heading">{f.score} / {f.max}</p></div>)}</div></div>
    </section>

    <div className="grid gap-6 lg:grid-cols-12">
      <section className="rounded-xl border border-app-border bg-app-surface p-6 shadow-[var(--shadow-subtle)] lg:col-span-4"><div className="mb-6 flex items-center gap-3"><Calculator className="h-5 w-5 text-app-action" /><h2 className="text-xl font-semibold">Scoring formula</h2></div><div className="mb-6 rounded-lg border border-app-border bg-app-surface-alt p-5 text-center font-mono text-sm"><b className="text-app-action">TS</b> = (Σ Vᵢ × Rᵢ) / (ln(Δt + 1) × β)</div><ul className="space-y-4 text-sm leading-6">{[['Vᵢ — Verification Index', 'Independent cross-references.'], ['Rᵢ — Source Reputation', 'Historical provider accuracy.'], ['β — Bias Scalar', 'Penalty for hyperbolic language.']].map(([a,b]) => <li key={a} className="flex gap-3"><i className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-app-action" /><span><b>{a}</b><small className="block text-app-muted">{b}</small></span></li>)}</ul></section>
      <section className="rounded-xl border border-app-border bg-app-surface p-6 shadow-[var(--shadow-subtle)] lg:col-span-8"><div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-3"><SlidersHorizontal className="h-5 w-5 text-app-action" /><h2 className="text-xl font-semibold">Reputation simulator</h2></div><button onClick={() => { setReliability(85); setDecay(2); setWidth(12); }} className="font-mono text-[10px] uppercase text-app-action">Reset</button></div><div className="grid gap-9 md:grid-cols-2"><div className="space-y-7"><Slider label="Source reliability" value={reliability} max={100} suffix="%" onChange={setReliability} /><Slider label="Temporal decay" value={decay} max={30} onChange={setDecay} /><Slider label="Consensus width" value={width} min={1} max={50} onChange={setWidth} /></div><div className="flex flex-col items-center justify-center rounded-xl border border-app-border bg-app-surface-alt p-6 text-center"><p className="font-mono text-[10px] uppercase tracking-widest text-app-muted">Simulated score</p><strong className={`my-3 text-6xl ${score > 85 ? 'text-app-action' : score > 60 ? 'text-state-warning' : 'text-state-error'}`}>{score.toFixed(1)}%</strong><p className="text-sm text-app-muted">Categorized as <b>{score > 85 ? 'Highly Credible' : score > 60 ? 'Review Required' : 'Low Confidence'}</b>.</p><div className="mt-5 h-2 w-full rounded-full bg-app-border"><div className="h-full rounded-full bg-app-action" style={{ width: `${score}%` }} /></div></div></div></section>

      <section className="overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-[var(--shadow-subtle)] lg:col-span-12"><div className="flex flex-col justify-between gap-4 border-b border-app-border bg-app-surface-alt/50 p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><ReceiptText className="h-5 w-5 text-app-action" /><h2 className="text-xl font-semibold">Audit ledger</h2></div><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-faint" /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search hash or title" placeholder="Search hash or title" className="channel-input h-10 pl-9 sm:w-64" /></label></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left"><thead className="font-mono text-[9px] uppercase tracking-wider text-app-muted"><tr>{['Timestamp','Article / entity','Verdict','Confidence','Node hash'].map(h => <th key={h} className="border-b border-app-border px-5 py-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-app-border">{rows.map(row => <tr key={row[4]} className="hover:bg-app-surface-alt"><td className="px-5 py-4 font-mono text-xs text-app-muted">{row[0]}</td><td className="px-5 py-4 text-sm font-semibold">{row[1]}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row[2] === 'VERIFIED' ? 'bg-app-action-soft text-app-action' : 'bg-app-accent-soft text-app-muted'}`}>{row[2]}</span></td><td className="px-5 py-4 text-sm font-bold">{row[3]}%</td><td className="px-5 py-4 font-mono text-xs text-app-muted">{row[4]}</td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
};

const Slider = ({ label, value, min = 0, max, suffix = '', onChange }: { label: string; value: number; min?: number; max: number; suffix?: string; onChange: (value: number) => void }) => <label className="block"><span className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-app-muted"><span>{label}</span><b className="text-app-action">{value}{suffix}</b></span><input type="range" value={value} min={min} max={max} onChange={e => onChange(Number(e.target.value))} className="w-full accent-[var(--color-app-action)]" /></label>;
export default TrustScreen;
