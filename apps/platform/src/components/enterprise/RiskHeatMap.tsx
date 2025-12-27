import type { HeatMap } from '../../pages/enterprise/types'

export function RiskHeatMap({
  data,
  onSelect,
}: {
  data: HeatMap | null
  onSelect: (partner: string, category: string) => void
}) {
  if (!data) {
    return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
  }

  const riskToClass: Record<'low' | 'medium' | 'high', string> = {
    low: 'bg-emerald-500/85 hover:bg-emerald-600',
    medium: 'bg-amber-500/85 hover:bg-amber-600',
    high: 'bg-rose-500/85 hover:bg-rose-600',
  }

  const key = (p: string, c: string) => `${p}__${c}`
  const matrix = data.matrix || []
  const cellMap = new Map(matrix.map(m => [key(m.partner, m.category), m]))

  const categories = data.categories || []
  const partners = data.partners || []

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Risk Heat Map</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <Legend color="bg-emerald-500" label="Low Risk" />
          <Legend color="bg-amber-500" label="Medium Risk" />
          <Legend color="bg-rose-500" label="High Risk" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white p-2 text-left text-xs font-medium text-slate-500" />
              {categories.map(c => (
                <th key={c} className="p-2 text-left text-xs font-medium text-slate-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partners.map(p => (
              <tr key={p}>
                <th className="sticky left-0 z-10 bg-white py-1.5 pr-4 text-left text-xs font-medium text-slate-600">{p}</th>
                {categories.map(c => {
                  const cell = cellMap.get(key(p, c))
                  const risk = cell?.risk ?? 'low'
                  return (
                    <td key={c} className="p-1">
                      <button
                        type="button"
                        onClick={() => onSelect?.(p, c)}
                        className={`h-7 w-20 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${riskToClass[risk]}`}
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
          <div className="py-12 text-center text-sm text-slate-400">
            No risk data available for the current selection.
          </div>
        )}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  )
}


