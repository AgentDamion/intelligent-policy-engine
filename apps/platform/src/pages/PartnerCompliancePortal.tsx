import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { SurfaceLayout } from '@/components/SurfaceLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

interface PartnerFramework {
  id: string
  name: string
  short_code: string
  jurisdiction: string
  enforcement_date?: string
  status: string
}

interface ComplianceStatus {
  proof_bundle_id: string
  framework: {
    id: string
    name: string
    short_code: string
  }
  compliance_status: string
  overall_coverage: number
  assessed_at: string
}

export default function PartnerCompliancePortal() {
  const [loading, setLoading] = useState(true)
  const [frameworks, setFrameworks] = useState<PartnerFramework[]>([])
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [attestationForm, setAttestationForm] = useState({
    requirement_id: '',
    attestation_type: 'tool_usage',
    attestation_data: {}
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch frameworks
      const frameworksResponse = await fetch('/api/partner/frameworks', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (frameworksResponse.ok) {
        const frameworksResult = await frameworksResponse.json()
        setFrameworks(frameworksResult.data?.frameworks || [])
      }

      // Fetch compliance status
      const complianceResponse = await fetch('/api/partner/compliance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (complianceResponse.ok) {
        const complianceResult = await complianceResponse.json()
        setComplianceStatus(complianceResult.data?.compliance_status || [])
      }
    } catch (error) {
      console.error('Error fetching partner data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAttestation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/partner/attestations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attestationForm)
      })

      if (!response.ok) throw new Error('Failed to submit attestation')

      // Reset form and refresh
      setAttestationForm({
        requirement_id: '',
        attestation_type: 'tool_usage',
        attestation_data: {}
      })
      await fetchData()
    } catch (error) {
      console.error('Error submitting attestation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SurfaceLayout surface="compliance" title="Partner Compliance Portal">
        <div className="flex items-center justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      </SurfaceLayout>
    )
  }

  return (
    <SurfaceLayout surface="compliance" title="Partner Compliance Portal">
      <div className="space-y-6">
        {/* Applicable Frameworks */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Applicable Frameworks</h2>
            <p className="text-sm text-slate-600 mt-1">
              Regulatory frameworks that apply to your workspace
            </p>
          </div>
          <div className="divide-y divide-slate-200">
            {frameworks.map((framework) => (
              <div key={framework.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{framework.name}</h3>
                    <div className="text-sm text-slate-600 mt-1">
                      {framework.jurisdiction}
                      {framework.enforcement_date && (
                        <span className="ml-2">
                          • Enforcement: {new Date(framework.enforcement_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded border ${
                    framework.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {framework.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Status */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Compliance Status</h2>
            <p className="text-sm text-slate-600 mt-1">
              Your recent compliance assessments
            </p>
          </div>
          <div className="divide-y divide-slate-200">
            {complianceStatus.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No compliance assessments available
              </div>
            ) : (
              complianceStatus.map((status, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{status.framework.name}</h3>
                      <div className="text-sm text-slate-600 mt-1">
                        Assessed: {new Date(status.assessed_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 text-sm font-medium rounded border ${
                        status.compliance_status === 'compliant'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : status.compliance_status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {status.compliance_status}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {status.overall_coverage.toFixed(1)}% coverage
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit Attestation */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Submit Attestation</h2>
            <p className="text-sm text-slate-600 mt-1">
              Submit compliance attestations for regulatory requirements
            </p>
          </div>
          <form onSubmit={handleSubmitAttestation} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Attestation Type
              </label>
              <select
                value={attestationForm.attestation_type}
                onChange={(e) => setAttestationForm({ ...attestationForm, attestation_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="tool_usage">Tool Usage</option>
                <option value="compliance">Compliance</option>
                <option value="disclosure">Disclosure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Requirement ID
              </label>
              <Input
                value={attestationForm.requirement_id}
                onChange={(e) => setAttestationForm({ ...attestationForm, requirement_id: e.target.value })}
                placeholder="Enter requirement ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Attestation Data (JSON)
              </label>
              <textarea
                value={JSON.stringify(attestationForm.attestation_data, null, 2)}
                onChange={(e) => {
                  try {
                    setAttestationForm({
                      ...attestationForm,
                      attestation_data: JSON.parse(e.target.value)
                    })
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={6}
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              <Upload className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Attestation'}
            </Button>
          </form>
        </div>
      </div>
    </SurfaceLayout>
  )
}

