import React from 'react'
import { useNavigate } from 'react-router-dom'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { AICOMPLYRButton } from '../ui/aicomplyr-button'
import { StatusBadge } from '../ui/status-badge'
import { Building2, Package, FileText } from 'lucide-react'

interface ClientWorkspaceProps {
  client: {
    clientId: string
    clientName: string
    brands: Array<{ id: string; name: string }>
    complianceScore: number
    activeRequests: number
  }
  availableClients: Array<{
    clientId: string
    clientName: string
  }>
  onClientChange: (clientId: string) => void
}

export function ClientWorkspace({ client, availableClients, onClientChange }: ClientWorkspaceProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <EdgeCard>
        <EdgeCardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-neutral-400" />
              <div>
                <h2 className="text-2xl font-black text-aicomplyr-black">{client.clientName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge variant={client.complianceScore >= 90 ? 'approved' : 'conditional'}>
                    {client.complianceScore}% Compliance
                  </StatusBadge>
                  <span className="text-sm text-neutral-500">{client.activeRequests} active requests</span>
                </div>
              </div>
            </div>
            {availableClients.length > 1 && (
              <select
                value={client.clientId}
                onChange={(e) => onClientChange(e.target.value)}
                className="px-4 py-2 border border-neutral-300 bg-white text-sm font-semibold"
              >
                {availableClients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.clientName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </EdgeCardBody>
      </EdgeCard>

      {/* Brand Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {client.brands.map((brand) => (
          <EdgeCard key={brand.id} variant="default">
            <EdgeCardHeader>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-neutral-400" />
                <h3 className="text-lg font-semibold text-aicomplyr-black">{brand.name}</h3>
              </div>
            </EdgeCardHeader>
            <EdgeCardBody>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Active Requests
                  </div>
                  <div className="text-2xl font-black text-aicomplyr-black">
                    {Math.floor(client.activeRequests / client.brands.length) || 0}
                  </div>
                </div>
                <AICOMPLYRButton
                  variant="secondary-light"
                  onClick={() => navigate(`/partner/requests/new?brand=${brand.id}`)}
                  className="w-full"
                >
                  New Request for {brand.name}
                </AICOMPLYRButton>
              </div>
            </EdgeCardBody>
          </EdgeCard>
        ))}
      </div>

      {/* Quick Actions */}
      <EdgeCard>
        <EdgeCardHeader>
          <h3 className="text-lg font-semibold text-aicomplyr-black">Quick Actions</h3>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AICOMPLYRButton
              variant="primary"
              onClick={() => navigate('/partner/requests/new')}
              className="flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Submit New Request
            </AICOMPLYRButton>
            <AICOMPLYRButton
              variant="secondary-light"
              onClick={() => navigate(`/decisions?client=${client.clientId}`)}
              className="flex items-center justify-center gap-2"
            >
              View All Decisions
            </AICOMPLYRButton>
            <AICOMPLYRButton
              variant="secondary-light"
              onClick={() => navigate(`/workflows?clientId=${client.clientId}`)}
              className="flex items-center justify-center gap-2"
            >
              Configure Workflows
            </AICOMPLYRButton>
          </div>
        </EdgeCardBody>
      </EdgeCard>
    </div>
  )
}

