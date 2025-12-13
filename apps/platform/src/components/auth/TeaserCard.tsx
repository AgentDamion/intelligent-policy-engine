import React from 'react'

export interface TeaserCardProps {
  title: string
  body: string
  status?: 'neutral' | 'warn' | 'success'
  onLearnMore?: () => void
  icon?: React.ReactNode
}

const statusStyles = {
  neutral: 'bg-gray-50 border-gray-200 text-gray-700',
  warn: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  success: 'bg-green-50 border-green-200 text-green-800',
} as const

const defaultIcons = {
  neutral: (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warn: (
    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
} as const

export const TeaserCard: React.FC<TeaserCardProps> = ({
  title,
  body,
  status = 'neutral',
  onLearnMore,
  icon,
}) => {
  return (
    <div className={`rounded-lg border p-4 ${statusStyles[status]}`}>
      <div className="flex">
        <div className="flex-shrink-0">{icon || defaultIcons[status]}</div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-sm opacity-90">{body}</p>
          {onLearnMore && (
            <button
              onClick={onLearnMore}
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Learn more
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

