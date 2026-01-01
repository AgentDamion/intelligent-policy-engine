import type { TimelineItem } from '../../pages/enterprise/types'
import { EdgeCard } from '../ui/edge-card'

export function TimelineFeed({ items, onOpen }: { items: TimelineItem[] | null; onOpen: (id: string) => void }) {
  if (!items) {
    return <div className="h-64 bg-neutral-200 border-l-4 border-l-aicomplyr-black animate-pulse" />
  }

  return (
    <EdgeCard>
      <div className="p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Live Activity Timeline</h3>

        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center border border-dashed border-neutral-200 bg-neutral-50">
            <div className="text-sm text-neutral-500">No recent activity to display</div>
          </div>
        ) : (
          <ol className="relative ml-2 border-l-4 border-l-aicomplyr-black">
            {items.map(ev => (
              <li key={ev.id} className="mb-6 ml-4">
                <span className="absolute -left-2.5 mt-1.5 h-4 w-4 bg-aicomplyr-black" />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-left text-neutral-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aicomplyr-black font-semibold"
                    onClick={() => onOpen(ev.id)}
                  >
                    {ev.label}
                  </button>
                  <time className="text-xs text-neutral-500 mono-id">{ev.ts}</time>
                </div>
                <div className="mt-1 text-xs text-neutral-600">
                  {ev.actor} {ev.tags?.length ? '·' : ''}
                  {ev.tags?.map(t => (
                    <span key={t} className="ml-1 inline-flex bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-700 font-semibold uppercase tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </EdgeCard>
  )
}


