import React from 'react'
import { useNavigate } from 'react-router-dom'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { AICOMPLYRButton } from '../ui/aicomplyr-button'
import { StatusBadge } from '../ui/status-badge'
import { TrendingUp, Users, FileCheck, Clock } from 'lucide-react'

interface AgencyDashboardProps {
  clients: Array<{
    clientId: string
    clientName: string
    brands: Array<{ id: string; name: string }>
    complianceScore: number
    activeRequests: number
  }>
  teamMetrics?: {
    totalRequests: number
    approvalRate: number
    avgTimeToApproval: number
  }
  onClientSelect: (clientId: string) => void
}

export function AgencyDashboard({ clients, teamMetrics, onClientSelect }: AgencyDashboardProps) {
  const navigate = useNavigate()

  const getComplianceBadgeVariant = (score: number): 'approved' | 'conditional' | 'denied' => {
    if (score >= 90) return 'approved'
    if (score >= 70) return 'conditional'
    return 'denied'
  }

  return (
    <div className="space-y-6">
      {/* Team Metrics Overview */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EdgeCard>
            <EdgeCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Total Requests
                  </div>
                  <div className="text-2xl font-black text-aicomplyr-black">{teamMetrics.totalRequests}</div>
                </div>
                <FileCheck className="w-8 h-8 text-neutral-400" />
              </div>
            </EdgeCardBody>
          </EdgeCard>

          <EdgeCard>
            <EdgeCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Approval Rate
                  </div>
                  <div className="text-2xl font-black text-aicomplyr-black">{teamMetrics.approvalRate}%</div>
                </div>
                <TrendingUp className="w-8 h-8 text-neutral-400" />
              </div>
            </EdgeCardBody>
          </EdgeCard>

          <EdgeCard>
            <EdgeCardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Avg Time to Approval
                  </div>
                  <div className="text-2xl font-black text-aicomplyr-black">{teamMetrics.avgTimeToApproval}h</div>
                </div>
                <Clock className="w-8 h-8 text-neutral-400" />
              </div>
            </EdgeCardBody>
          </EdgeCard>
        </div>
      )}

      {/* Client Portfolio */}
      <EdgeCard>
        <EdgeCardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-aicomplyr-black">Client Portfolio</h2>
            <AICOMPLYRButton variant="secondary-light" onClick={() => navigate('/partner/requests/new')}>
              New Request
            </AICOMPLYRButton>
          </div>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">No clients available</div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.clientId}
                  className="border-l-4 border-l-aicomplyr-black p-4 bg-white hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => onClientSelect(client.clientId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-aicomplyr-black">{client.clientName}</h3>
                        <StatusBadge variant={getComplianceBadgeVariant(client.complianceScore)}>
                          {client.complianceScore}% Compliance
                        </StatusBadge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span>{client.brands.length} brand{client.brands.length !== 1 ? 's' : ''}</span>
                        <span>{client.activeRequests} active request{client.activeRequests !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                        Active Requests
                      </div>
                      <div className="text-2xl font-black text-aicomplyr-black">{client.activeRequests}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </EdgeCardBody>
      </EdgeCard>
    </div>
  )
}

