import React, { useState } from 'react'
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card'
import { StatusBadge } from '../ui/status-badge'
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react'
import type { PolicyGuidance } from '../../services/partner/requestSubmissionService'

interface PolicyGuidancePanelProps {
  guidance: PolicyGuidance[]
  loading?: boolean
}

export function PolicyGuidancePanel({ guidance, loading }: PolicyGuidancePanelProps) {
  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(new Set())

  const togglePolicy = (policyId: string) => {
    const newExpanded = new Set(expandedPolicies)
    if (newExpanded.has(policyId)) {
      newExpanded.delete(policyId)
    } else {
      newExpanded.add(policyId)
    }
    setExpandedPolicies(newExpanded)
  }

  const getComplianceBadge = (status: 'compliant' | 'conditional' | 'violation') => {
    switch (status) {
      case 'compliant':
        return <StatusBadge variant="approved">Compliant</StatusBadge>
      case 'conditional':
        return <StatusBadge variant="conditional">Conditional</StatusBadge>
      case 'violation':
        return <StatusBadge variant="denied">Violation</StatusBadge>
    }
  }

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

  if (guidance.length === 0) {
    return (
      <EdgeCard>
        <EdgeCardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-neutral-400" />
            <h3 className="text-lg font-semibold text-aicomplyr-black">Policy Guidance</h3>
          </div>
        </EdgeCardHeader>
        <EdgeCardBody>
          <div className="text-sm text-neutral-500">No active policies found</div>
        </EdgeCardBody>
      </EdgeCard>
    )
  }

  return (
    <EdgeCard>
      <EdgeCardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-neutral-400" />
          <h3 className="text-lg font-semibold text-aicomplyr-black">Policy Guidance</h3>
        </div>
      </EdgeCardHeader>
      <EdgeCardBody>
        <div className="space-y-4">
          {guidance.map((policy) => {
            const isExpanded = expandedPolicies.has(policy.policy_id)
            const hasViolations = policy.applicable_rules.some((r) => r.compliance_status === 'violation')
            const hasConditionals = policy.applicable_rules.some((r) => r.compliance_status === 'conditional')

            return (
              <div
                key={policy.policy_id}
                className={`border-l-4 ${
                  hasViolations
                    ? 'border-l-status-denied'
                    : hasConditionals
                    ? 'border-l-aicomplyr-yellow'
                    : 'border-l-status-approved'
                } p-4 bg-white`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => togglePolicy(policy.policy_id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-semibold text-aicomplyr-black">{policy.policy_name}</h4>
                      <span className="text-xs text-neutral-500">v{policy.policy_version}</span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Effective: {new Date(policy.effective_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-neutral-200">
                    {policy.applicable_rules.map((rule) => (
                      <div key={rule.rule_id} className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm text-neutral-700">{rule.rule_description}</div>
                            {rule.requirement && (
                              <div className="text-xs text-neutral-500 mt-1">{rule.requirement}</div>
                            )}
                          </div>
                          {getComplianceBadge(rule.compliance_status)}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <button className="text-xs text-aicomplyr-black hover:underline font-semibold flex items-center gap-1">
                        View Full Policy <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </EdgeCardBody>
    </EdgeCard>
  )
}

