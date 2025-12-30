import { supabase } from '@/lib/supabase'
import { workflowService } from '../workflow/workflowService'
import { createThread } from '../vera/governanceThreadService'

export interface ToolRequest {
  tool_name: string
  tool_version: string
  use_case: string
  brand_id?: string
  description: string
  attachments?: Array<{
    filename: string
    url: string
  }>
  urgency?: 'low' | 'normal' | 'high'
  // Generated fields
  risk_score?: number
  policy_guidance?: Array<{
    policy_id: string
    policy_name: string
    applicable_rules: Array<{
      rule_id: string
      rule_description: string
      compliance_status: 'compliant' | 'conditional' | 'violation'
    }>
  }>
}

export interface PolicyGuidance {
  policy_id: string
  policy_name: string
  policy_version: string
  effective_date: string
  applicable_rules: Array<{
    rule_id: string
    rule_description: string
    compliance_status: 'compliant' | 'conditional' | 'violation'
    requirement?: string
  }>
}

export interface RiskAssessment {
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  risk_factors: Array<{
    factor: string
    impact: 'low' | 'medium' | 'high'
    description: string
  }>
  estimated_approval_time: number // hours
}

export interface Precedent {
  id: string
  tool: string
  use_case: string
  outcome: 'approved' | 'rejected' | 'conditional'
  risk_score: number
  approval_time: number // hours
}

/**
 * Validate request data before submission
 */
export async function validateRequest(request: Partial<ToolRequest>): Promise<{
  valid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  if (!request.tool_name || request.tool_name.trim().length === 0) {
    errors.push('Tool name is required')
  }

  if (!request.tool_version || request.tool_version.trim().length === 0) {
    errors.push('Tool version is required')
  }

  if (!request.use_case || request.use_case.trim().length === 0) {
    errors.push('Use case is required')
  }

  if (!request.description || request.description.trim().length === 0) {
    errors.push('Description is required')
  }

  if (request.description && request.description.length < 10) {
    errors.push('Description must be at least 10 characters')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get policy guidance for a request
 */
export async function getPolicyGuidance(
  tool: string,
  useCase: string,
  brandId?: string,
  enterpriseId?: string
): Promise<PolicyGuidance[]> {
  try {
    // In production, fetch from policies table based on brand/client context
    // For now, return mock data
    const mockGuidance: PolicyGuidance[] = [
      {
        policy_id: 'policy-001',
        policy_name: 'AI Tool Usage Policy',
        policy_version: 'v2.1',
        effective_date: '2024-01-01',
        applicable_rules: [
          {
            rule_id: 'rule-001',
            rule_description: 'All AI-generated content must be reviewed by human',
            compliance_status: 'compliant',
            requirement: 'Human review required',
          },
          {
            rule_id: 'rule-002',
            rule_description: 'Patient-facing materials require compliance review',
            compliance_status: useCase.includes('Patient') ? 'conditional' : 'compliant',
            requirement: useCase.includes('Patient') ? 'Compliance review required' : undefined,
          },
        ],
      },
    ]

    return mockGuidance
  } catch (error) {
    console.error('Error fetching policy guidance:', error)
    return []
  }
}

/**
 * Calculate risk score for a request
 */
export async function calculateRiskScore(request: Partial<ToolRequest>): Promise<RiskAssessment> {
  let riskScore = 0.5 // Base risk
  const riskFactors: Array<{ factor: string; impact: 'low' | 'medium' | 'high'; description: string }> = []

  // Tool-based risk
  if (request.tool_name?.toLowerCase().includes('midjourney') || request.tool_name?.toLowerCase().includes('dalle')) {
    riskScore += 0.2
    riskFactors.push({
      factor: 'Image Generation Tool',
      impact: 'medium',
      description: 'Image generation tools require additional review',
    })
  }

  // Use case risk
  if (request.use_case?.includes('Patient') || request.use_case?.includes('HCP')) {
    riskScore += 0.3
    riskFactors.push({
      factor: 'Patient/HCP Content',
      impact: 'high',
      description: 'Patient-facing content requires compliance review',
    })
  }

  // Urgency risk
  if (request.urgency === 'high') {
    riskScore += 0.1
    riskFactors.push({
      factor: 'High Urgency',
      impact: 'low',
      description: 'High urgency requests may require expedited review',
    })
  }

  // Clamp risk score between 0 and 1
  riskScore = Math.min(1, Math.max(0, riskScore))

  const riskLevel: 'low' | 'medium' | 'high' = riskScore < 0.4 ? 'low' : riskScore < 0.7 ? 'medium' : 'high'

  // Estimate approval time based on risk (mock calculation)
  const estimatedApprovalTime = riskLevel === 'low' ? 4 : riskLevel === 'medium' ? 12 : 24

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_factors: riskFactors,
    estimated_approval_time: estimatedApprovalTime,
  }
}

/**
 * Get similar past requests (precedents)
 */
export async function getPrecedents(request: Partial<ToolRequest>): Promise<Precedent[]> {
  try {
    // In production, query governance_threads for similar requests
    // For now, return mock data
    const mockPrecedents: Precedent[] = [
      {
        id: 'precedent-001',
        tool: request.tool_name || 'Similar Tool',
        use_case: request.use_case || 'Similar Use Case',
        outcome: 'approved',
        risk_score: 0.6,
        approval_time: 8,
      },
    ]

    return mockPrecedents
  } catch (error) {
    console.error('Error fetching precedents:', error)
    return []
  }
}

/**
 * Submit a tool request
 */
export async function submitToolRequest(
  request: ToolRequest,
  enterpriseId: string,
  agencyId?: string,
  userId?: string
): Promise<{ success: boolean; threadId?: string; error?: string }> {
  try {
    // Validate request
    const validation = await validateRequest(request)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      }
    }

    // Create governance thread
    const { success, threadId, error } = await createThread({
      enterpriseId: agencyId || enterpriseId,
      threadType: 'tool_request',
      subjectId: crypto.randomUUID(), // In production, create submission record first
      subjectType: 'submission',
      title: `${request.tool_name} v${request.tool_version} - ${request.use_case}`,
      description: request.description,
      priority: request.urgency === 'high' ? 'high' : request.urgency === 'low' ? 'low' : 'normal',
      metadata: {
        tool_name: request.tool_name,
        tool_version: request.tool_version,
        use_case: request.use_case,
        brand_id: request.brand_id,
        urgency: request.urgency,
        risk_score: request.risk_score,
        attachments: request.attachments,
        agency_enterprise_id: agencyId,
        client_enterprise_id: enterpriseId,
      },
    })

    if (!success || !threadId) {
      return {
        success: false,
        error: error || 'Failed to create governance thread',
      }
    }

    // Trigger workflow (in production, this would be done by the backend)
    if (agencyId && request.brand_id) {
      await workflowService.getRequiredApprovers(agencyId, enterpriseId, request.brand_id, request.risk_score || 0.5)
    }

    return {
      success: true,
      threadId,
    }
  } catch (error) {
    console.error('Error submitting tool request:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

