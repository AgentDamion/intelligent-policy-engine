import React from 'react'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { StatusBadge } from '../ui/status-badge'
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import type { RiskAssessment, Precedent } from '../../services/partner/requestSubmissionService'

interface RiskAssessmentPreviewProps {
  assessment: RiskAssessment | null
  precedents: Precedent[]
  loading?: boolean
}

export function RiskAssessmentPreview({ assessment, precedents, loading }: RiskAssessmentPreviewProps) {
  if (loading) {
    return (
      <EdgeCard>
        <EdgeCardBody>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-neutral-200 w-3/4"></div>
            <div className="h-4 bg-neutral-200 w-1/2"></div>
          </div>
        </EdgeCardBody>
      </EdgeCard>
    )
  }

  if (!assessment) {
    return (
      <EdgeCard>
        <EdgeCardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-neutral-400" />
            <h3 className="text-lg font-semibold text-aicomplyr-black">Risk Assessment</h3>
          </div>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="text-sm text-neutral-500">Complete the form to see risk assessment</div>
        </EdgeCardBody>
      </EdgeCard>
    )
  }

  const getRiskBadge = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return <StatusBadge variant="approved">Low Risk</StatusBadge>
      case 'medium':
        return <StatusBadge variant="conditional">Medium Risk</StatusBadge>
      case 'high':
        return <StatusBadge variant="denied">High Risk</StatusBadge>
    }
  }

  const formatTime = (hours: number) => {
    if (hours < 1) return '< 1 hour'
    if (hours < 24) return `${Math.round(hours)} hours`
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    if (days === 0) return `${remainingHours} hours`
    if (remainingHours === 0) return `${days} day${days > 1 ? 's' : ''}`
    return `${days}d ${remainingHours}h`
  }

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-neutral-400" />
          <h3 className="text-lg font-semibold text-aicomplyr-black">Risk Assessment</h3>
        </div>
      </EdgeCardHeader>
      <EdgeCardBody>
        <div className="space-y-4">
          {/* Risk Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-neutral-700">Risk Score</span>
              {getRiskBadge(assessment.risk_level)}
            </div>
            <div className="w-full bg-neutral-200 h-3 border border-neutral-300">
              <div
                className={`h-full transition-all ${
                  assessment.risk_level === 'low'
                    ? 'bg-status-approved'
                    : assessment.risk_level === 'medium'
                    ? 'bg-aicomplyr-yellow'
                    : 'bg-status-denied'
                }`}
                style={{ width: `${assessment.risk_score * 100}%` }}
              />
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {(assessment.risk_score * 100).toFixed(0)}% risk
            </div>
          </div>

          {/* Risk Factors */}
          {assessment.risk_factors.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Risk Factors
              </div>
              <div className="space-y-2">
                {assessment.risk_factors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        factor.impact === 'high'
                          ? 'bg-status-denied'
                          : factor.impact === 'medium'
                          ? 'bg-status-escalated'
                          : 'bg-status-approved'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-700">{factor.factor}</div>
                      <div className="text-xs text-neutral-500">{factor.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Approval Time */}
          <div className="flex items-center gap-2 pt-3 border-t border-neutral-200">
            <Clock className="w-4 h-4 text-neutral-400" />
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Estimated Approval Time
              </div>
              <div className="text-base font-semibold text-aicomplyr-black">
                {formatTime(assessment.estimated_approval_time)}
              </div>
            </div>
          </div>

          {/* Precedents */}
          {precedents.length > 0 && (
            <div className="pt-3 border-t border-neutral-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-neutral-400" />
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Similar Requests
                </div>
              </div>
              <div className="space-y-2">
                {precedents.slice(0, 3).map((precedent) => (
                  <div key={precedent.id} className="text-xs text-neutral-600">
                    <span className="font-semibold">{precedent.tool}</span> -{' '}
                    {precedent.outcome === 'approved' ? (
                      <span className="text-status-approved">Approved</span>
                    ) : precedent.outcome === 'rejected' ? (
                      <span className="text-status-denied">Rejected</span>
                    ) : (
                      <span className="text-aicomplyr-yellow">Conditional</span>
                    )}{' '}
                    in {formatTime(precedent.approval_time)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </EdgeCardBody>
    </EdgeCard>
  )
}

