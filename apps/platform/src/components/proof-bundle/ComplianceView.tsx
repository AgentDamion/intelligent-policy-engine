import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Download, ShieldCheck, ShieldX } from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import { Button } from '../ui/button'
import { supabase } from '@/lib/supabase'

interface ComplianceAssessment {
  proof_bundle_id: string
  assessed_at: string
  assessments: FrameworkAssessment[]
}

interface FrameworkAssessment {
  framework: {
    id: string
    name: string
    short_code: string
  }
  compliance_status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable'
  overall_coverage: number
  requirement_results: {
    total: number
    compliant: number
    partial: number
    non_compliant: number
  }
  gaps: Gap[]
  evidence_summary?: {
    audit_trail_events?: number
    governance_actions?: number
    attestations?: number
    documents?: number
  }
}

interface Gap {
  requirement_code: string
  title: string
  gap_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  remediation?: string
}

interface VerificationResult {
  verified: boolean
  status: 'verified' | 'tampered' | 'invalid' | 'missing_artifacts'
  bundle_hash_match: boolean
  signature_valid?: boolean
  details: {
    trace_id_present: boolean
    policy_digest_present: boolean
  }
}

interface ComplianceViewProps {
  bundleId: string
}

export default function ComplianceView({ bundleId }: ComplianceViewProps) {
  const [loading, setLoading] = useState(true)
  const [assessing, setAssessing] = useState(false)
  const [assessment, setAssessment] = useState<ComplianceAssessment | null>(null)
  const [verification, setVerification] = useState<VerificationResult | null>(null)

  useEffect(() => {
    fetchCompliance()
    verifyBundle()
  }, [bundleId])

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Get compliance data from proof_bundle_compliance table
      const { data, error } = await supabase
        .from('proof_bundle_compliance')
        .select(`
          *,
          regulatory_frameworks (
            id,
            name,
            short_name
          )
        `)
        .eq('proof_bundle_id', bundleId)

      if (error) throw error

      if (data && data.length > 0) {
        const assessments = data.map(row => ({
          framework: row.regulatory_frameworks,
          compliance_status: row.compliance_status,
          overall_coverage: row.overall_coverage_percentage,
          requirement_results: row.requirement_results?.summary || {
            total: 0,
            compliant: 0,
            partial: 0,
            non_compliant: 0
          },
          gaps: row.gaps || [],
          evidence_summary: row.evidence_collected
        }))

        setAssessment({
          proof_bundle_id: bundleId,
          assessed_at: data[0].assessed_at,
          assessments
        })
      }
    } catch (error) {
      console.error('Error fetching compliance:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyBundle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await supabase.functions.invoke('verify-proof-bundle', {
        body: {
          proof_bundle_id: bundleId,
          verify_signature: false
        }
      })

      if (response.data) {
        setVerification(response.data)
      }
    } catch (error) {
      console.error('Error verifying bundle:', error)
    }
  }

  const handleAssess = async () => {
    try {
      setAssessing(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/proof-bundles/${bundleId}/assess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ force_reassess: true })
      })

      if (!response.ok) throw new Error('Assessment failed')

      // Wait a moment then refresh
      setTimeout(() => {
        fetchCompliance()
      }, 2000)
    } catch (error) {
      console.error('Error assessing compliance:', error)
    } finally {
      setAssessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'non_compliant':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'non_compliant':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      {verification && (
        <div className={`border rounded-none p-4 ${
          verification.verified
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {verification.verified ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldX className="h-5 w-5 text-red-600" />
            )}
            <div className="flex-1">
              <div className="font-medium text-slate-900">
                Bundle Verification: {verification.verified ? 'Verified ✅' : 'Tampered ❌'}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {verification.bundle_hash_match ? 'Hash match: ✓' : 'Hash mismatch: ✗'}
                {verification.details.trace_id_present ? ' | Trace ID: ✓' : ' | Trace ID: ✗'}
                {verification.details.policy_digest_present ? ' | Policy Digest: ✓' : ' | Policy Digest: ✗'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Regulatory Compliance Assessment</h2>
          {assessment && (
            <p className="text-sm text-slate-600 mt-1">
              Assessed: {new Date(assessment.assessed_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAssess}
            disabled={assessing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${assessing ? 'animate-spin' : ''}`} />
            Re-assess Compliance
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Report (PDF)
          </Button>
        </div>
      </div>

      {!assessment || assessment.assessments.length === 0 ? (
        <div className="text-center py-12 border border-slate-200 rounded-none bg-slate-50">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 mb-4">No compliance assessment available</p>
          <Button onClick={handleAssess} disabled={assessing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${assessing ? 'animate-spin' : ''}`} />
            Assess Compliance
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {assessment.assessments.map((fwAssessment) => (
            <div key={fwAssessment.framework.id} className="border border-slate-200 rounded-none">
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{fwAssessment.framework.name}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      {getStatusIcon(fwAssessment.compliance_status)}
                      <span className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(fwAssessment.compliance_status)}`}>
                        {fwAssessment.compliance_status.toUpperCase().replace('_', ' ')}
                      </span>
                      <span className="text-sm text-slate-600">
                        Coverage: {fwAssessment.overall_coverage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Requirement Results Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {fwAssessment.requirement_results.compliant}
                    </div>
                    <div className="text-sm text-slate-600">Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {fwAssessment.requirement_results.partial}
                    </div>
                    <div className="text-sm text-slate-600">Partial</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {fwAssessment.requirement_results.non_compliant}
                    </div>
                    <div className="text-sm text-slate-600">Non-Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {fwAssessment.requirement_results.total}
                    </div>
                    <div className="text-sm text-slate-600">Total</div>
                  </div>
                </div>

                {/* Evidence Summary */}
                {fwAssessment.evidence_summary && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-none">
                    <h4 className="font-medium text-slate-900 mb-3">Evidence Collected</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {fwAssessment.evidence_summary.audit_trail_events !== undefined && (
                        <div>
                          <div className="font-medium text-slate-900">
                            {fwAssessment.evidence_summary.audit_trail_events}
                          </div>
                          <div className="text-slate-600">Audit Trail Events</div>
                        </div>
                      )}
                      {fwAssessment.evidence_summary.governance_actions !== undefined && (
                        <div>
                          <div className="font-medium text-slate-900">
                            {fwAssessment.evidence_summary.governance_actions}
                          </div>
                          <div className="text-slate-600">Governance Actions</div>
                        </div>
                      )}
                      {fwAssessment.evidence_summary.attestations !== undefined && (
                        <div>
                          <div className="font-medium text-slate-900">
                            {fwAssessment.evidence_summary.attestations}
                          </div>
                          <div className="text-slate-600">Attestations</div>
                        </div>
                      )}
                      {fwAssessment.evidence_summary.documents !== undefined && (
                        <div>
                          <div className="font-medium text-slate-900">
                            {fwAssessment.evidence_summary.documents}
                          </div>
                          <div className="text-slate-600">Documents</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Gaps */}
                {fwAssessment.gaps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Gaps Identified</h4>
                    <div className="space-y-3">
                      {fwAssessment.gaps.map((gap, index) => (
                        <div
                          key={index}
                          className="border border-red-200 rounded-none p-4 bg-red-50"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-slate-900">{gap.requirement_code}</span>
                                <span className="font-medium text-slate-900">{gap.title}</span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityColor(gap.severity)}`}>
                                  {gap.severity}
                                </span>
                              </div>
                              {gap.description && (
                                <p className="text-sm text-slate-600 mb-2">{gap.description}</p>
                              )}
                              {gap.remediation && (
                                <p className="text-sm text-red-700 font-medium">
                                  Remediation: {gap.remediation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fwAssessment.gaps.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>No gaps identified for this framework</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

