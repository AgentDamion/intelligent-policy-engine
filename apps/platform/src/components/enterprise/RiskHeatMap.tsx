import type { HeatMap } from '../../pages/enterprise/types'
import { EdgeCard } from '../ui/edge-card'

export function RiskHeatMap({
  data,
  onSelect,
}: {
  data: HeatMap | null
  onSelect: (partner: string, category: string) => void
}) {
  if (!data) {
    return <div className="h-64 bg-neutral-200 border-l-4 border-l-aicomplyr-black animate-pulse" />
  }

  const riskToClass: Record<'low' | 'medium' | 'high', string> = {
    low: 'bg-status-approved/85 hover:bg-status-approved',
    medium: 'bg-status-escalated/85 hover:bg-status-escalated',
    high: 'bg-status-denied/85 hover:bg-status-denied',
  }

  const key = (p: string, c: string) => `${p}__${c}`
  const matrix = data.matrix || []
  const cellMap = new Map(matrix.map(m => [key(m.partner, m.category), m]))

  const categories = data.categories || []
  const partners = data.partners || []

  return (
    <EdgeCard>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Risk Heat Map</h3>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <Legend color="bg-status-approved" label="Low Risk" />
            <Legend color="bg-status-escalated" label="Medium Risk" />
            <Legend color="bg-status-denied" label="High Risk" />
          </div>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white p-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500" />
              {categories.map(c => (
                <th key={c} className="p-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partners.map(p => (
              <tr key={p}>
                <th className="sticky left-0 z-10 bg-white py-1.5 pr-4 text-left text-xs font-semibold text-neutral-700">{p}</th>
                {categories.map(c => {
                  const cell = cellMap.get(key(p, c))
                  const risk = cell?.risk ?? 'low'
                  return (
                    <td key={c} className="p-1">
                      <button
                        type="button"
                        onClick={() => onSelect?.(p, c)}
                        className={`h-7 w-20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aicomplyr-black ${riskToClass[risk]}`}
                        aria-label={`${p} / ${c} risk ${risk}`}
                        title={`${p} / ${c} — ${risk.toUpperCase()}`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {partners.length === 0 && (
          <div className="py-12 text-center text-sm text-neutral-400">
            No risk data available for the current selection.
          </div>
        )}
      </div>
      </div>
    </EdgeCard>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 ${color}`} />
      {label}
    </span>
  )
}


