import { useState, useEffect } from 'react'
import {
  type OrganizationComplianceStatus,
  type PolicyFrameworkMapping,
  type ComplianceGap
} from '../../services/complianceMappingService'
import { AlertCircle, CheckCircle, XCircle, TrendingUp, Shield, FileText } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ComplianceMappingPage() {
  const [loading, setLoading] = useState(true)
  const [complianceStatus, setComplianceStatus] = useState<OrganizationComplianceStatus | null>(null)

  useEffect(() => {
    setLoading(false) // Stub for now
  }, [])


  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-700 bg-red-100'
      case 'high':
        return 'text-orange-700 bg-orange-100'
      case 'medium':
        return 'text-yellow-700 bg-yellow-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!complianceStatus) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              No regulatory frameworks selected. Please select frameworks in settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Compliance Mapping</h1>
        <p className="mt-2 text-sm text-slate-600">
          View how your policies map to regulatory frameworks and identify compliance gaps
        </p>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Overall Compliance</h2>
          <div className={`px-4 py-2 rounded-lg border font-semibold ${getCoverageColor(complianceStatus.overall_coverage)}`}>
            {complianceStatus.overall_coverage}% Coverage
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600">Selected Frameworks</p>
              <p className="text-lg font-semibold text-slate-900">
                {complianceStatus.selected_frameworks.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600">Active Policies</p>
              <p className="text-lg font-semibold text-slate-900">
                {complianceStatus.policy_mappings.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600">Overall Coverage</p>
              <p className="text-lg font-semibold text-slate-900">
                {complianceStatus.overall_coverage}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Policy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {complianceStatus.policy_mappings.map((policy) => (
            <button
              key={policy.policy_id}
              onClick={() => setSelectedPolicy(policy.policy_id)}
              className={`
                text-left p-4 rounded-lg border transition-all
                ${selectedPolicy === policy.policy_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <h3 className="font-medium text-slate-900">{policy.policy_name}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {policy.frameworks.length} framework{policy.frameworks.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Policy Framework Mapping */}
      {selectedPolicy && policyMapping && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Framework Coverage: {policyMapping.policy_name}
          </h2>
          
          <div className="space-y-4">
            {policyMapping.frameworks.map((framework) => (
              <div key={framework.framework_id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-slate-900">{framework.framework_name}</h3>
                  <div className={`px-3 py-1 rounded border text-sm font-medium ${getCoverageColor(framework.coverage_percentage)}`}>
                    {framework.coverage_percentage}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-slate-600">
                      {framework.requirements_met.length} met
                    </span>
                  </div>
                  {framework.requirements_partial.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-slate-600">
                        {framework.requirements_partial.length} partial
                      </span>
                    </div>
                  )}
                  {framework.requirements_missing.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-slate-600">
                        {framework.requirements_missing.length} missing
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Gaps */}
      {selectedPolicy && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Compliance Gaps</h2>
          
          {loadingGaps ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : gaps.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No compliance gaps identified for this policy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gaps.map((gap, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-slate-900">{gap.framework_name}</h3>
                      {gap.requirement_code && (
                        <p className="text-sm text-slate-600">{gap.requirement_code}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(gap.priority)}`}>
                      {gap.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{gap.description}</p>
                  <p className="text-xs text-red-700 font-medium">{gap.gap_reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

