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
}: SurfaceHeaderProps) {
  const styles = guardrail ? toneStyles(guardrail.tone) : toneStyles('neutral')

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="px-6 py-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 text-[11px] text-slate-500">
            <ol className="flex items-center gap-1 flex-wrap">
              {breadcrumbs.map((b, idx) => (
                <li key={`${b.label}-${idx}`} className="flex items-center gap-1">
                  {idx > 0 && <span className="text-slate-300">/</span>}
                  {b.href ? (
                    <a href={b.href} className="hover:text-slate-700">
                      {b.label}
                    </a>
                  ) : (
                    <span>{b.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
              {guardrail && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${styles.bg} ${styles.border} ${styles.text} text-[10px] font-bold uppercase tracking-wider`}
                >
                  {guardrail.icon ?? defaultGuardrailIcon(guardrail.tone)}
                  {guardrail.label}
                </span>
              )}
            </div>

            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}

            {meta && <div className="mt-2">{meta}</div>}
          </div>

          {(primaryActions || secondaryActions) && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {secondaryActions}
              {primaryActions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}








