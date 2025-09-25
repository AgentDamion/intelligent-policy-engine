import * as React from 'react'
import type { TimelineItem } from '../../pages/enterprise/types'

export function TimelineFeed({ items, onOpen }: { items: TimelineItem[] | null; onOpen: (id: string) => void }) {
  if (!items) {
    return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-slate-700">Live Activity Timeline</h3>

      {items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-200">
          <div className="text-sm text-slate-500">No recent activity to display</div>
        </div>
      ) : (
        <ol className="relative ml-2 border-l border-slate-200">
          {items.map(ev => (
            <li key={ev.id} className="mb-6 ml-4">
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-teal-500" />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-left text-slate-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
                  onClick={() => onOpen(ev.id)}
                >
                  {ev.label}
                </button>
                <time className="text-xs text-slate-500">{ev.ts}</time>
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {ev.actor} {ev.tags?.length ? '·' : ''}
                {ev.tags?.map(t => (
                  <span key={t} className="ml-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                    {t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}


