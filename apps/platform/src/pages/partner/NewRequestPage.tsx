import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useEnterprise } from '../../contexts/EnterpriseContext'
import { useBoundaryContext } from '../../hooks/useBoundaryContext'
import BoundaryContextIndicator from '../../components/boundary/BoundaryContextIndicator'
import { NewRequestForm } from '../../components/partner/NewRequestForm'
import { PolicyGuidancePanel } from '../../components/partner/PolicyGuidancePanel'
import { RiskAssessmentPreview } from '../../components/partner/RiskAssessmentPreview'
import {
  submitToolRequest,
  getPolicyGuidance,
  calculateRiskScore,
  getPrecedents,
  type ToolRequest,
  type PolicyGuidance,
  type RiskAssessment,
  type Precedent,
} from '../../services/partner/requestSubmissionService'
import { EdgeCard } from '../../components/ui/edge-card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { ArrowLeft } from 'lucide-react'
import { AICOMPLYRButton } from '../../components/ui/aicomplyr-button'

export default function NewRequestPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { currentEnterprise } = useEnterprise()
  const boundaryContext = useBoundaryContext()

  const [formData, setFormData] = useState<Partial<ToolRequest>>({})
  const [policyGuidance, setPolicyGuidance] = useState<PolicyGuidance[]>([])
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null)
  const [precedents, setPrecedents] = useState<Precedent[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get brand from URL params
  const brandId = searchParams.get('brand') || undefined

  // Load policy guidance and risk assessment when form data changes
  useEffect(() => {
    const loadGuidance = async () => {
      if (!formData.tool_name || !formData.use_case || !currentEnterprise?.id) return

      setLoading(true)
      try {
        const [guidance, assessment, precedentData] = await Promise.all([
          getPolicyGuidance(formData.tool_name, formData.use_case, formData.brand_id || brandId, currentEnterprise.id),
          calculateRiskScore(formData),
          getPrecedents(formData),
        ])

        setPolicyGuidance(guidance)
        setRiskAssessment(assessment)
        setPrecedents(precedentData)

        // Update form data with risk score
        setFormData((prev) => ({ ...prev, risk_score: assessment.risk_score }))
      } catch (err) {
        console.error('Error loading guidance:', err)
      } finally {
        setLoading(false)
      }
    }

    // Debounce guidance loading
    const timeoutId = setTimeout(loadGuidance, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.tool_name, formData.use_case, formData.brand_id, brandId, currentEnterprise?.id])

  const handleSubmit = async (request: ToolRequest) => {
    if (!currentEnterprise?.id || !user?.id) {
      setError('Missing enterprise or user context')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Get agency ID from boundary context if available
      const agencyId = boundaryContext ? undefined : undefined // In production, extract from boundary context

      const result = await submitToolRequest(request, currentEnterprise.id, agencyId, user.id)

      if (result.success && result.threadId) {
        navigate(`/decisions/${result.threadId}`)
      } else {
        setError(result.error || 'Failed to submit request')
      }
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <BoundaryContextIndicator />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <AICOMPLYRButton
            variant="tertiary"
            onClick={() => navigate('/partner')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </AICOMPLYRButton>
          <h1 className="text-3xl font-black text-aicomplyr-black tracking-tight">New Tool Request</h1>
          <p className="text-lg text-neutral-600 mt-1">
            Submit a request to use an AI tool with live policy guidance
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <EdgeCard variant="attention" className="mb-6">
            <div className="p-4">
              <div className="font-semibold text-status-denied mb-1">Error</div>
              <div className="text-sm text-status-denied">{error}</div>
            </div>
          </EdgeCard>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <NewRequestForm
              initialData={{ brand_id: brandId }}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/partner')}
              loading={submitting}
              onChange={setFormData}
            />
          </div>

          {/* Guidance Column */}
          <div className="space-y-6">
            <PolicyGuidancePanel guidance={policyGuidance} loading={loading} />
            <RiskAssessmentPreview assessment={riskAssessment} precedents={precedents} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}

