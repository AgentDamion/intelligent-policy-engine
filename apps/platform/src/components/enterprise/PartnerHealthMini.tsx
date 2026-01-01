import type { PartnerHealth } from '../../pages/enterprise/types'
import { EdgeCard } from '../ui/edge-card'

export function PartnerHealthMini({ items }: { items: PartnerHealth[] | null }) {
  if (!items) {
    return <div className="h-64 bg-neutral-200 border-l-4 border-l-aicomplyr-black animate-pulse" />
  }

  return (
    <EdgeCard>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Partner Health</h3>
          <div className="text-xs text-neutral-500">Last 7 days</div>
        </div>

        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center border border-dashed border-neutral-200 bg-neutral-50">
            <div className="text-sm text-neutral-500">No partner data available</div>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map(p => (
              <li key={p.partner} className="border-l-4 border-l-aicomplyr-black border border-neutral-200 p-3 hover:bg-neutral-50 transition-colors bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-aicomplyr-black">{p.partner}</div>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="text-neutral-600">
                        Compliance <span className="font-semibold text-aicomplyr-black">{Math.round(p.compliancePct * 100)}%</span>
                      </span>
                      <span className="text-neutral-600">
                        Open Items <span className="font-semibold text-aicomplyr-black">{p.openItems}</span>
                      </span>
                    </div>
                  </div>
                  <Sparkline series={p.series} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </EdgeCard>
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
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="text-aicomplyr-black">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={d} />
    </svg>
  )
}


