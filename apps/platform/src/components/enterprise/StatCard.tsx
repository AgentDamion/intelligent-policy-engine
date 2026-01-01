import React from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'positive' | 'warning' | 'danger'

export function StatCard({
  title,
  value,
  delta,
  tone = 'default',
  highlight = false,
  subtext,
  className,
}: {
  title: string
  value: string
  delta?: { dir: 'up' | 'down'; value: string }
  tone?: Tone
  highlight?: boolean
  subtext?: React.ReactNode
  className?: string
}) {
  const edgeColor = highlight ? 'border-l-aicomplyr-yellow' : 'border-l-aicomplyr-black'
  const bgColor = highlight ? 'bg-yellow-50' : 'bg-white'

  return (
    <div
      className={cn(
        'border-l-4 border border-neutral-200 p-4',
        edgeColor,
        bgColor,
        className
      )}
      role="region"
      aria-label={title}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl font-display text-aicomplyr-black">{value}</div>
        {delta && (
          <StatusBadge
            variant={delta.dir === 'up' ? 'approved' : 'denied'}
            className="text-xs"
          >
            {delta.dir === 'up' ? '↑' : '↓'} {delta.value}
          </StatusBadge>
        )}
      </div>
      {subtext && (
        <div className="text-xs text-neutral-600 mt-1">{subtext}</div>
      )}
    </div>
  )
}


