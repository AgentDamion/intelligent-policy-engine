import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle, Plus, Search } from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import { Button } from '../ui/button'
import { supabase } from '@/lib/supabase'

interface PolicyComplianceData {
  policy: {
    id: string
    name: string
  }
  framework_coverage: FrameworkCoverage[]
}

interface FrameworkCoverage {
  framework: {
    id: string
    name: string
    short_code: string
  }
  overall_coverage: number
  requirements_addressed: RequirementMapping[]
  requirements_not_addressed: RequirementMapping[]
}

interface RequirementMapping {
  requirement_id?: string
  requirement_code: string
  title: string
  coverage_type?: string
  coverage_percentage?: number
  coverage_notes?: string
  auto_detected?: boolean
  verified?: boolean
  gap_reason?: string
}

interface RegulatoryCoverageTabProps {
  policyId: string
}

export default function RegulatoryCoverageTab({ policyId }: RegulatoryCoverageTabProps) {
  const [loading, setLoading] = useState(true)
  const [complianceData, setComplianceData] = useState<PolicyComplianceData | null>(null)

  useEffect(() => {
    fetchCompliance()
  }, [policyId])

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/policies/${policyId}/compliance`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch policy compliance')

      const result = await response.json()
      setComplianceData(result.data)
    } catch (error) {
      console.error('Error fetching policy compliance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCoverageIcon = (coverageType?: string) => {
    switch (coverageType) {
      case 'full':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'none':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!complianceData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No compliance data available for this policy</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600 mb-4">
          This policy addresses requirements from {complianceData.framework_coverage.length} regulatory framework{complianceData.framework_coverage.length !== 1 ? 's' : ''}:
        </p>
      </div>

      {complianceData.framework_coverage.map((framework) => (
        <div key={framework.framework.id} className="border border-slate-200 rounded-lg">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{framework.framework.name}</h3>
                <p className="text-sm text-slate-600">Coverage: {framework.overall_coverage.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Requirements Addressed */}
            {framework.requirements_addressed.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-slate-900 mb-3">Requirements Addressed</h4>
                <div className="space-y-3">
                  {framework.requirements_addressed.map((req, index) => (
                    <div
                      key={req.requirement_id || index}
                      className="border border-slate-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getCoverageIcon(req.coverage_type)}
                            <span className="font-medium text-slate-900">{req.requirement_code} - {req.title}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              req.coverage_type === 'full'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {req.coverage_type === 'full' ? 'Full Coverage' : 'Partial Coverage'} {req.coverage_percentage?.toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            {req.coverage_notes && <p>{req.coverage_notes}</p>}
                            <div className="flex items-center gap-2">
                              {req.auto_detected && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  Auto-detected
                                </span>
                              )}
                              {req.verified && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements NOT Addressed */}
            {framework.requirements_not_addressed.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Requirements NOT Addressed</h4>
                <div className="space-y-3">
                  {framework.requirements_not_addressed.map((req, index) => (
                    <div
                      key={req.requirement_id || index}
                      className="border border-red-200 rounded-lg p-4 bg-red-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-slate-900">{req.requirement_code} - {req.title}</span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800">
                              Gap
                            </span>
                          </div>
                          <div className="text-sm text-slate-600">
                            {req.gap_reason && <p className="mb-2">{req.gap_reason}</p>}
                            <p className="text-red-700 font-medium">
                              Recommendation: Add rule to policy to address this requirement
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Rule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Map Additional Framework
        </Button>
      </div>
    </div>
  )
}

