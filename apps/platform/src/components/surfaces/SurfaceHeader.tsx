import React from 'react'
import { ShieldCheck, Shield, Lock, Info } from 'lucide-react'

export type GuardrailTone = 'info' | 'warning' | 'success' | 'neutral'

export interface GuardrailPill {
  label: string
  tone: GuardrailTone
  icon?: React.ReactNode
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface SurfaceHeaderProps {
  title: string
  subtitle?: string
  guardrail?: GuardrailPill
  breadcrumbs?: BreadcrumbItem[]
  primaryActions?: React.ReactNode
  secondaryActions?: React.ReactNode
  meta?: React.ReactNode
  confidence?: number // 0-100
}

function toneStyles(tone: GuardrailTone) {
  switch (tone) {
    case 'success':
      return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' }
    case 'warning':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' }
    case 'info':
      return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' }
    case 'neutral':
    default:
      return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' }
  }
}

function defaultGuardrailIcon(tone: GuardrailTone) {
  switch (tone) {
    case 'success':
      return <ShieldCheck className="h-3.5 w-3.5" />
    case 'warning':
      return <Lock className="h-3.5 w-3.5" />
    case 'info':
      return <Shield className="h-3.5 w-3.5" />
    case 'neutral':
    default:
      return <Info className="h-3.5 w-3.5" />
  }
}

export default function SurfaceHeader({
  title,
  subtitle,
  guardrail,
  breadcrumbs,
  primaryActions,
  secondaryActions,
  meta,
  confidence,
}: SurfaceHeaderProps) {
  const styles = guardrail ? toneStyles(guardrail.tone) : toneStyles('neutral')

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="px-6 py-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-3 text-[11px] uppercase tracking-wider">
            <ol className="flex items-center gap-2 flex-wrap">
              {breadcrumbs.map((b, idx) => {
                const isLast = idx === breadcrumbs.length - 1
                return (
                  <li key={`${b.label}-${idx}`} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-neutral-300">/</span>}
                    {b.href && !isLast ? (
                      <a href={b.href} className="text-neutral-500 font-semibold hover:text-aicomplyr-black transition-colors">
                        {b.label}
                      </a>
                    ) : (
                      <span className={isLast ? 'text-aicomplyr-black font-black' : 'text-neutral-500 font-semibold'}>
                        {b.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-aicomplyr-black truncate">{title}</h1>
              {guardrail && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 border ${styles.bg} ${styles.border} ${styles.text} text-[10px] font-bold uppercase tracking-wider rounded-none`}
                >
                  {guardrail.icon ?? defaultGuardrailIcon(guardrail.tone)}
                  {guardrail.label}
                </span>
              )}
              {confidence !== undefined && (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-neutral-50 border border-neutral-200">
                  <div className="w-2 h-2 bg-status-approved" />
                  <span className="text-[10px] font-mono font-bold text-neutral-600">
                    {confidence}% CONFIDENCE
                  </span>
                </div>
              )}
            </div>

            {subtitle && <p className="text-xs text-neutral-500 font-medium mt-1 uppercase tracking-wide">{subtitle}</p>}

            {meta && <div className="mt-2">{meta}</div>}
          </div>

          {(primaryActions || secondaryActions) && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {secondaryActions}
              {primaryActions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}












