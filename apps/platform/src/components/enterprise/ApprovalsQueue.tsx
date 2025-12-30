import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Approval } from '../../pages/enterprise/types'
import { EdgeCard } from '../ui/edge-card'
import { AICOMPLYRButton as Button } from '../ui/aicomplyr-button'
import { WorkflowProgressBar } from './WorkflowProgressBar'
import { enhanceApprovalsWithWorkflow } from '../../services/enterprise/approvalWorkflowService'

export function ApprovalsQueue({
  rows,
  onBulk,
}: {
  rows: Approval[] | null
  onBulk: (ids: string[], action: 'approve' | 'request_changes' | 'assign') => void
}) {
  const navigate = useNavigate()
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [enhancedRows, setEnhancedRows] = React.useState<Approval[] | null>(null)
  const ids = React.useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected])

  // Enhance approvals with workflow context
  React.useEffect(() => {
    if (rows && rows.length > 0) {
      enhanceApprovalsWithWorkflow(rows).then(setEnhancedRows)
    } else {
      setEnhancedRows(rows)
    }
  }, [rows])

  function toggleAll(checked: boolean) {
    if (!rows) return
    const next: Record<string, boolean> = {}
    rows.forEach(r => (next[r.id] = checked))
    setSelected(next)
  }

  return (
    <EdgeCard>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Approvals Queue</h3>

        <div className="flex items-center gap-2">
          <BulkButton disabled={!ids.length} label="Approve" onClick={() => onBulk(ids, 'approve')} variant="primary" />
          <BulkButton disabled={!ids.length} label="Request Changes" onClick={() => onBulk(ids, 'request_changes')} />
          <BulkButton disabled={!ids.length} label="Assign" onClick={() => onBulk(ids, 'assign')} />
        </div>
      </div>

      {!rows ? (
        <div className="h-40 animate-pulse bg-neutral-200 border-l-4 border-l-aicomplyr-black" />
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-neutral-200">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-100">
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" aria-label="Select all" onChange={e => toggleAll(e.currentTarget.checked)} className="accent-aicomplyr-black" />
                </th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Workflow</th>
                <th className="px-3 py-2">Age</th>
              </tr>
            </thead>
            <tbody>
              {(enhancedRows || rows).map(r => (
                <tr key={r.id} className="border-t border-neutral-200 text-sm hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!selected[r.id]}
                      onChange={e => setSelected(s => ({ ...s, [r.id]: e.currentTarget.checked }))}
                      className="accent-aicomplyr-black"
                      aria-label={`Select ${r.item}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-neutral-800 font-semibold">{r.item}</td>
                  <td className="px-3 py-2 text-neutral-600">{r.source}</td>
                  <td className="px-3 py-2">
                    <RiskChip risk={r.risk} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusChip status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    {r.workflowProgress ? (
                      <div className="space-y-1">
                        <WorkflowProgressBar
                          currentStep={r.workflowProgress.currentStep}
                          totalSteps={r.workflowProgress.totalSteps}
                          stepName={r.workflowProgress.stepName}
                          estimatedTimeRemaining={r.workflowProgress.estimatedTimeRemaining}
                        />
                        {r.workflowId && (
                          <button
                            onClick={() => navigate(`/workflows?workflowId=${r.workflowId}`)}
                            className="text-xs text-aicomplyr-black hover:underline font-semibold"
                          >
                            View Workflow →
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">No workflow</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">{r.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </EdgeCard>
  )
}

function BulkButton({ label, onClick, disabled, variant = 'ghost' }: { label: string; onClick: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' }) {
  return (
    <Button
      variant={variant === 'primary' ? 'primary' : 'secondary-light'}
      onClick={onClick}
      disabled={disabled}
      className="text-xs"
    >
      {label}
    </Button>
  )
}

function RiskChip({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const tone = risk === 'low' ? 'bg-status-approved text-white' : risk === 'medium' ? 'bg-status-escalated text-white' : 'bg-status-denied text-white'
  return <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${tone}`}>{risk}</span>
}

function StatusChip({ status }: { status: 'needs_human' | 'approved' | 'rejected' | 'pending' }) {
  const map: Record<string, string> = {
    needs_human: 'bg-status-escalated text-white',
    approved: 'bg-status-approved text-white',
    rejected: 'bg-status-denied text-white',
    pending: 'bg-status-pending text-white',
  }
  const label: Record<string, string> = {
    needs_human: 'Needs Human Review',
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
  }
  return <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${map[status]}`}>{label[status]}</span>
}

function Empty() {
  return (
    <div className="flex h-40 items-center justify-center border border-dashed border-neutral-200 bg-neutral-50">
      <div className="text-sm text-neutral-500">No approvals right now — great job staying ahead!</div>
    </div>
  )
}


