import type { PartnerHealth } from '../../pages/enterprise/types'

export function PartnerHealthMini({ items }: { items: PartnerHealth[] | null }) {
  if (!items) {
    return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Partner Health</h3>
        <div className="text-xs text-slate-500">Last 7 days</div>
      </div>

      {items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-200">
          <div className="text-sm text-slate-500">No partner data available</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(p => (
            <li key={p.partner} className="rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">{p.partner}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="text-slate-600">
                      Compliance <b className="text-slate-800">{Math.round(p.compliancePct * 100)}%</b>
                    </span>
                    <span className="text-slate-600">
                      Open Items <b className="text-slate-800">{p.openItems}</b>
                    </span>
                  </div>
                </div>
                <Sparkline series={p.series} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

function Sparkline({ series }: { series: number[] }) {
  const w = 96
  const h = 28
  const max = Math.max(...series, 1)
  const min = Math.min(...series, 0)

  const norm = (v: number, i: number) => {
    const x = (i / (series.length - 1 || 1)) * w
    const y = h - ((v - min) / (max - min || 1)) * h
    return `${x},${y}`
  }

  const d = series.map(norm).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="text-teal-600">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={d} />
    </svg>
  )
}


