import * as React from "react";
import { cn } from "../../utils/cn";

type Tone = "default" | "positive" | "warning" | "danger";

export function StatCard({
  title,
  value,
  delta,
  tone = "default",
  className,
}: {
  title: string;
  value: string;
  delta?: { dir: "up" | "down"; value: string };
  tone?: Tone;
  className?: string;
}) {
  const toneClasses: Record<Tone, string> = {
    default: "border-slate-200",
    positive: "border-emerald-200",
    warning: "border-amber-200",
    danger: "border-rose-200",
  };
  
  const chipTone: Record<Tone, string> = {
    default: "bg-slate-100 text-slate-700",
    positive: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 bg-white shadow-sm",
        toneClasses[tone],
        className
      )}
      role="region"
      aria-label={title}
    >
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl font-semibold text-slate-900">{value}</div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
              chipTone[tone]
            )}
          >
            <svg
              viewBox="0 0 12 12"
              className={cn(
                "h-3 w-3",
                delta.dir === "up" ? "rotate-0" : "rotate-180"
              )}
              aria-hidden
            >
              <path
                d="M6 2l4 6H2l4-6z"
                fill="currentColor"
              />
            </svg>
            {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}
