import React from 'react'
import { useNavigate } from 'react-router-dom'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { AICOMPLYRButton } from '../ui/aicomplyr-button'
import { StatusBadge } from '../ui/status-badge'
import { Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

interface MyWorkspaceProps {
  personalRequests: Array<{
    id: string
    tool: string
    status: string
    submittedAt: string
  }>
  onNewRequest: () => void
}

export function MyWorkspace({ personalRequests, onNewRequest }: MyWorkspaceProps) {
  const navigate = useNavigate()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'approved_with_conditions':
        return <StatusBadge variant="approved">Approved</StatusBadge>
      case 'blocked':
      case 'rejected':
        return <StatusBadge variant="denied">Rejected</StatusBadge>
      case 'pending_human':
      case 'in_review':
        return <StatusBadge variant="pending">In Review</StatusBadge>
      case 'needs_info':
        return <StatusBadge variant="escalated">Needs Info</StatusBadge>
      default:
        return <StatusBadge variant="pending">{status}</StatusBadge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'approved_with_conditions':
        return <CheckCircle className="w-5 h-5 text-status-approved" />
      case 'blocked':
      case 'rejected':
        return <XCircle className="w-5 h-5 text-status-denied" />
      default:
        return <Clock className="w-5 h-5 text-status-pending" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header with New Request Button */}
      <EdgeCard>
        <EdgeCardBody>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-aicomplyr-black">My Requests</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Track your tool request submissions and approvals
              </p>
            </div>
            <AICOMPLYRButton variant="primary" onClick={onNewRequest} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Request
            </AICOMPLYRButton>
          </div>
        </EdgeCardBody>
      </EdgeCard>

      {/* Personal Requests List */}
      <EdgeCard>
        <EdgeCardHeader>
          <h3 className="text-lg font-semibold text-aicomplyr-black">Recent Requests</h3>
        </EdgeCardHeader>
        <EdgeCardBody>
          {personalRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">No requests yet</p>
              <AICOMPLYRButton variant="secondary-light" onClick={onNewRequest}>
                Submit Your First Request
              </AICOMPLYRButton>
            </div>
          ) : (
            <div className="space-y-3">
              {personalRequests.map((request) => (
                <div
                  key={request.id}
                  className="border-l-4 border-l-aicomplyr-black p-4 bg-white hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/decisions/${request.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(request.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-base font-semibold text-aicomplyr-black">{request.tool}</h4>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-xs text-neutral-500">{formatDate(request.submittedAt)}</div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-neutral-400">View →</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EdgeCardBody>
      </EdgeCard>
    </div>
  )
}

