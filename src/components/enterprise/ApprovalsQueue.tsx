import * as React from 'react'
import type { Approval } from '../../pages/enterprise/types'

export function ApprovalsQueue({
  rows,
  onBulk,
}: {
  rows: Approval[] | null
  onBulk: (ids: string[], action: 'approve' | 'request_changes' | 'assign') => void
}) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const ids = React.useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected])

  function toggleAll(checked: boolean) {
    if (!rows) return
    const next: Record<string, boolean> = {}
    rows.forEach(r => (next[r.id] = checked))
    setSelected(next)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Approvals Queue</h3>

        <div className="flex items-center gap-2">
          <BulkButton disabled={!ids.length} label="Approve" onClick={() => onBulk(ids, 'approve')} variant="primary" />
          <BulkButton disabled={!ids.length} label="Request Changes" onClick={() => onBulk(ids, 'request_changes')} />
          <BulkButton disabled={!ids.length} label="Assign" onClick={() => onBulk(ids, 'assign')} />
        </div>
      </div>

      {!rows ? (
        <div className="h-40 animate-pulse rounded-md bg-slate-100" />
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" aria-label="Select all" onChange={e => toggleAll(e.currentTarget.checked)} className="accent-teal-600" />
                </th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Age</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t text-sm">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!selected[r.id]}
                      onChange={e => setSelected(s => ({ ...s, [r.id]: e.currentTarget.checked }))}
                      className="accent-teal-600"
                      aria-label={`Select ${r.item}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-slate-800">{r.item}</td>
                  <td className="px-3 py-2 text-slate-600">{r.source}</td>
                  <td className="px-3 py-2">
                    <RiskChip risk={r.risk} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusChip status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-slate-500">{r.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function BulkButton({ label, onClick, disabled, variant = 'ghost' }: { label: string; onClick: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' }) {
  const base = 'rounded-lg px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 transition'
  const styles = variant === 'primary' ? 'bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400'
  return (
    <button className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

function RiskChip({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const tone = risk === 'low' ? 'bg-emerald-50 text-emerald-700' : risk === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
  return <span className={`rounded-full px-2 py-0.5 text-xs ${tone}`}>{risk}</span>
}

function StatusChip({ status }: { status: 'needs_human' | 'approved' | 'rejected' | 'pending' }) {
  const map: Record<string, string> = {
    needs_human: 'bg-purple-50 text-purple-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-rose-50 text-rose-700',
    pending: 'bg-slate-100 text-slate-700',
  }
  const label: Record<string, string> = {
    needs_human: 'Needs Human Review',
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs ${map[status]}`}>{label[status]}</span>
}

function Empty() {
  return (
    <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-200">
      <div className="text-sm text-slate-500">No approvals right now — great job staying ahead!</div>
    </div>
  )
}


