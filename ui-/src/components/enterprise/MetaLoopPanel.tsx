import * as React from "react";

type Phase = "observe" | "document" | "analyze" | "recommend";

export function MetaLoopPanel({
  phase,
  rec,
  onRouteToReview,
}: {
  phase: Phase;
  rec?: { id: string; title: string; confidence: number; rationale?: string };
  onRouteToReview: (id: string) => void;
}) {
  const phases: Phase[] = ["observe", "document", "analyze", "recommend"];

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Meta‑Loop Intelligence</h3>
        <span className="text-xs text-slate-500">Current Cycle Progress</span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {phases.map((p) => (
          <PhasePill key={p} active={p === phase} label={capitalize(p)} />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-1 text-xs text-slate-500">Latest Recommendation</div>
        {rec ? (
          <>
            <div className="text-sm font-medium text-slate-800">{rec.title}</div>
            <div className="mt-2 flex items-center gap-2">
              <Confidence value={rec.confidence} />
              <span className="text-xs text-slate-500">Confidence</span>
            </div>
            {rec.rationale && (
              <p className="mt-2 text-xs text-slate-600">{rec.rationale}</p>
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => onRouteToReview(rec.id)}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Send to Review
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-teal-500" />
              Recursive validation enabled
            </div>
          </>
        ) : (
          <div className="h-16 animate-pulse rounded-md bg-slate-100" />
        )}
      </div>
    </aside>
  );
}

function PhasePill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={
        "rounded-lg px-2.5 py-2 text-center text-xs font-medium " +
        (active
          ? "bg-teal-600 text-white"
          : "bg-slate-100 text-slate-600")
      }
      aria-current={active ? "step" : undefined}
    >
      {label}
    </div>
  );
}

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-teal-600" aria-hidden>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M4.5 8.2 7 10.5 11.5 5.5" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
      {pct}%
    </span>
  );
}

function capitalize(s: string) { 
  return s.charAt(0).toUpperCase() + s.slice(1); 
}
