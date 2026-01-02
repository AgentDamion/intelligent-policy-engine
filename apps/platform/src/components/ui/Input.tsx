import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leadingIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leadingIcon, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[12px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leadingIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              block w-full rounded-none border-neutral-300 shadow-none
              focus:border-aicomplyr-black focus:ring-0 sm:text-sm
              ${leadingIcon ? 'pl-10' : 'pl-3'}
              ${error ? 'border-status-denied text-status-denied placeholder-status-denied focus:border-status-denied' : ''}
              ${className}
            `}
            aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-neutral-400 font-medium">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-sm text-status-denied font-medium">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

