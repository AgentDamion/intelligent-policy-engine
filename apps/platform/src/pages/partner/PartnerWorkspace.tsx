import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useEnterprise } from '../../contexts/EnterpriseContext'
import { useBoundaryContext } from '../../hooks/useBoundaryContext'
import BoundaryContextIndicator from '../../components/boundary/BoundaryContextIndicator'
import { ContextSwitcher } from '../../components/vera/ContextSwitcher'
import { getPartnerWorkspace, type PartnerWorkspace } from '../../services/partner/workspaceService'
import { AgencyDashboard } from '../../components/partner/AgencyDashboard'
import { ClientWorkspace } from '../../components/partner/ClientWorkspace'
import { MyWorkspace } from '../../components/partner/MyWorkspace'
import { ProductionDashboard } from '../../components/partner/ProductionDashboard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { EdgeCard } from '../../components/ui/edge-card'
import { AICOMPLYRButton } from '../../components/ui/aicomplyr-button'

export default function PartnerWorkspacePage() {
  const { user } = useAuth()
  const { currentEnterprise } = useEnterprise()
  const boundaryContext = useBoundaryContext()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState<PartnerWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id && currentEnterprise?.id) {
      loadWorkspace()
    }
  }, [user?.id, currentEnterprise?.id])

  const loadWorkspace = async () => {
    if (!user?.id || !currentEnterprise?.id) return

    setLoading(true)
    try {
      const data = await getPartnerWorkspace(user.id, currentEnterprise.id)
      setWorkspace(data)
      // Auto-select first client if available
      if (data?.availableClients && data.availableClients.length > 0) {
        setSelectedClientId(data.availableClients[0].clientId)
      }
    } catch (error) {
      console.error('Error loading workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <BoundaryContextIndicator />
        <div className="container mx-auto px-6 py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <BoundaryContextIndicator />
        <div className="container mx-auto px-6 py-8">
          <EdgeCard variant="attention">
            <div className="p-4">
              <div className="font-semibold text-status-denied mb-1">Error</div>
              <div className="text-sm text-status-denied mb-2">Failed to load workspace data</div>
              <button onClick={loadWorkspace} className="text-sm text-aicomplyr-black hover:underline font-semibold">
                Try again
              </button>
            </div>
          </EdgeCard>
        </div>
      </div>
    )
  }

  // Determine which view to show based on role
  const renderRoleView = () => {
    const role = workspace.userRole

    // Leadership roles: client_owner, governance_admin
    if (role === 'client_owner' || role === 'governance_admin') {
      return (
        <AgencyDashboard
          clients={workspace.availableClients}
          teamMetrics={workspace.teamMetrics}
          onClientSelect={setSelectedClientId}
        />
      )
    }

    // Account tier: team_lead
    if (role === 'team_lead') {
      const selectedClient = workspace.availableClients.find((c) => c.clientId === selectedClientId)
      return (
        <ClientWorkspace
          client={selectedClient || workspace.availableClients[0]}
          onClientChange={setSelectedClientId}
          availableClients={workspace.availableClients}
        />
      )
    }

    // Producer: workflow_coordinator
    if (role === 'workflow_coordinator') {
      return (
        <ProductionDashboard
          clients={workspace.availableClients}
          onRequestClick={(requestId) => navigate(`/decisions/${requestId}`)}
        />
      )
    }

    // Default: Contributor view
    return (
      <MyWorkspace
        personalRequests={workspace.personalRequests}
        onNewRequest={() => navigate('/partner/requests/new')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <BoundaryContextIndicator />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-aicomplyr-black tracking-tight">Partner Workspace</h1>
            <p className="text-lg text-neutral-600 mt-1">
              {workspace.userRole === 'client_owner' || workspace.userRole === 'governance_admin'
                ? 'Portfolio overview across all clients'
                : workspace.userRole === 'team_lead'
                ? 'Client-specific workspace'
                : workspace.userRole === 'workflow_coordinator'
                ? 'Pipeline tracking and workflow management'
                : 'Your personal workspace'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AICOMPLYRButton
              variant="secondary-light"
              onClick={() => navigate('/tool-lookup-demo')}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Check Tool Eligibility
            </AICOMPLYRButton>
            <ContextSwitcher />
          </div>
        </div>

        {renderRoleView()}
      </div>
    </div>
  )
}

