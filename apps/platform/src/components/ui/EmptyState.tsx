import React from 'react'

export interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actions?: EmptyStateAction[]
  secondary?: React.ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  actions = [],
  secondary,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-10 ${className}`}>
      {icon && (
        <div className="w-14 h-14 rounded-none bg-slate-100 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <div className="text-base font-bold text-slate-900">{title}</div>
      {description && <div className="text-sm text-slate-500 mt-1 max-w-md">{description}</div>}

      {actions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          {actions.map((a, idx) => {
            const base =
              'inline-flex items-center justify-center rounded-none font-semibold text-sm px-4 py-2 transition-colors'
            const variant = a.variant || 'outline'
            const variantClass =
              variant === 'primary'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : variant === 'secondary'
                  ? 'bg-slate-700 text-white hover:bg-slate-800'
                  : variant === 'ghost'
                    ? 'bg-transparent text-slate-700 hover:bg-slate-100'
                    : variant === 'danger'
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'

            if (a.href) {
              return (
                <a key={`${a.label}-${idx}`} href={a.href} className={`${base} ${variantClass}`}>
                  {a.label}
                </a>
              )
            }

            return (
              <button
                key={`${a.label}-${idx}`}
                type="button"
                onClick={a.onClick}
                className={`${base} ${variantClass}`}
              >
                {a.label}
              </button>
            )
          })}
        </div>
      )}

      {secondary && <div className="mt-4 text-sm text-slate-500">{secondary}</div>}
    </div>
  )
}












