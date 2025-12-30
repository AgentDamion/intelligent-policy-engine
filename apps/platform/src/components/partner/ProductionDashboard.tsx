import React from 'react'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { StatusBadge } from '../ui/status-badge'
import { GitBranch, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface ProductionDashboardProps {
  clients: Array<{
    clientId: string
    clientName: string
    brands: Array<{ id: string; name: string }>
    complianceScore: number
    activeRequests: number
  }>
  onRequestClick: (requestId: string) => void
}

export function ProductionDashboard({ clients, onRequestClick }: ProductionDashboardProps) {
  // Mock pipeline stages - in production, fetch from governance_threads
  const pipelineStages = [
    { id: 'submitted', name: 'Submitted', color: 'neutral' },
    { id: 'in_review', name: 'In Review', color: 'yellow' },
    { id: 'pending_approval', name: 'Pending Approval', color: 'amber' },
    { id: 'approved', name: 'Approved', color: 'green' },
  ]

  // Mock requests by stage - in production, fetch from governance_threads grouped by status
  const requestsByStage = {
    submitted: 5,
    in_review: 3,
    pending_approval: 2,
    approved: 12,
  }

  const getStageColor = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'border-l-aicomplyr-yellow'
      case 'amber':
        return 'border-l-status-escalated'
      case 'green':
        return 'border-l-status-approved'
      default:
        return 'border-l-neutral-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <EdgeCard>
        <EdgeCardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-neutral-400" />
            <h2 className="text-xl font-black text-aicomplyr-black">Production Pipeline</h2>
          </div>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {pipelineStages.map((stage) => {
              const count = requestsByStage[stage.id as keyof typeof requestsByStage] || 0
              return (
                <div
                  key={stage.id}
                  className={`border-l-4 ${getStageColor(stage.color)} p-4 bg-white`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    {stage.name}
                  </div>
                  <div className="text-3xl font-black text-aicomplyr-black">{count}</div>
                </div>
              )
            })}
          </div>
        </EdgeCardBody>
      </EdgeCard>

      {/* Bottleneck Identification */}
      <EdgeCard variant="attention">
        <EdgeCardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-status-escalated" />
            <h3 className="text-lg font-semibold text-aicomplyr-black">Bottlenecks</h3>
          </div>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Requests pending approval for &gt;24h</span>
              <StatusBadge variant="escalated">2 requests</StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Awaiting client response</span>
              <StatusBadge variant="pending">1 request</StatusBadge>
            </div>
          </div>
        </EdgeCardBody>
      </EdgeCard>

      {/* Client Summary */}
      <EdgeCard>
        <EdgeCardHeader>
          <h3 className="text-lg font-semibold text-aicomplyr-black">Client Summary</h3>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client.clientId}
                className="border-l-4 border-l-aicomplyr-black p-4 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-aicomplyr-black">{client.clientName}</h4>
                    <div className="text-xs text-neutral-500 mt-1">
                      {client.activeRequests} active request{client.activeRequests !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <StatusBadge variant={client.complianceScore >= 90 ? 'approved' : 'conditional'}>
                    {client.complianceScore}%
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </EdgeCardBody>
      </EdgeCard>
    </div>
  )
}

