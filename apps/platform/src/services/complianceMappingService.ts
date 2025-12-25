/**
 * Compliance Mapping Service
 * 
 * Calculates policy-to-regulatory framework coverage and identifies compliance gaps
 */

export interface FrameworkRequirement {
  id: string
  requirement_type: string
  requirement_code?: string
  description: string
  priority: string
  compliance_evidence?: any
}

export interface FrameworkMapping {
  framework_id: string
  framework_name: string
  coverage_percentage: number
  requirements_met: string[]
  requirements_partial: string[]
  requirements_missing: string[]
  total_requirements: number
}

export interface PolicyFrameworkMapping {
  policy_id: string
  policy_name: string
  frameworks: FrameworkMapping[]
}

export interface ComplianceGap {
  framework_id: string
  framework_name: string
  requirement_id: string
  requirement_code?: string
  requirement_type: string
  description: string
  priority: string
  gap_reason: string
}

export interface OrganizationComplianceStatus {
  organization_id: string
  selected_frameworks: Array<{
    framework_id: string
    framework_name: string
    status: string
  }>
  overall_coverage: number
  policy_mappings: PolicyFrameworkMapping[]
  gaps: ComplianceGap[]
}

const API_BASE = '/api'

/**
 * Get compliance mapping for a specific policy
 */
export async function getPolicyFrameworkMapping(
  policyId: string,
  frameworkId?: string
): Promise<FrameworkMapping[]> {
  try {
    const token = localStorage.getItem('token') || ''
    const url = frameworkId
      ? `${API_BASE}/policies/${policyId}/framework-mapping?framework_id=${frameworkId}`
      : `${API_BASE}/policies/${policyId}/framework-mapping`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch policy framework mapping')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('[ComplianceMappingService] Error fetching policy mapping:', error)
    return []
  }
}

/**
 * Get overall compliance status for an organization
 */
export async function getOrganizationComplianceStatus(
  organizationId: string
): Promise<OrganizationComplianceStatus | null> {
  try {
    const token = localStorage.getItem('token') || ''
    const response = await fetch(`${API_BASE}/organizations/${organizationId}/compliance-mapping`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch compliance status')
    }

    const data = await response.json()
    return data.data || null
  } catch (error) {
    console.error('[ComplianceMappingService] Error fetching compliance status:', error)
    return null
  }
}

/**
 * Identify compliance gaps for a policy against a framework
 */
export async function identifyComplianceGaps(
  policyId: string,
  frameworkId: string
): Promise<ComplianceGap[]> {
  try {
    // Get framework requirements
    const token = localStorage.getItem('token') || ''
    const frameworkResponse = await fetch(`${API_BASE}/regulatory-frameworks/${frameworkId}/requirements`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!frameworkResponse.ok) {
      throw new Error('Failed to fetch framework requirements')
    }

    const frameworkData = await frameworkResponse.json()
    const requirements: FrameworkRequirement[] = frameworkData.data || []

    // Get policy details
    const policyResponse = await fetch(`${API_BASE}/policies/${policyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!policyResponse.ok) {
      throw new Error('Failed to fetch policy')
    }

    const policyData = await policyResponse.json()
    const policy = policyData.data

    // Get framework details
    const frameworkDetailsResponse = await fetch(`${API_BASE}/regulatory-frameworks/${frameworkId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!frameworkDetailsResponse.ok) {
      throw new Error('Failed to fetch framework details')
    }

    const frameworkDetails = await frameworkDetailsResponse.json()
    const framework = frameworkDetails.data

    // Analyze gaps
    const gaps: ComplianceGap[] = []

    for (const requirement of requirements) {
      const evidence = requirement.compliance_evidence || {}
      const policyRules = policy.policy_rules || {}
      
      // Check if requirement is addressed by policy
      let isAddressed = false
      let gapReason = ''

      if (requirement.requirement_type === 'audit_trail') {
        // Check for audit trail requirements
        isAddressed = evidence.immutable_logs === true && 
          (policyRules.audit_logging !== undefined || policyRules.data_retention !== undefined)
        if (!isAddressed) {
          gapReason = 'Policy does not specify immutable audit logging requirements'
        }
      } else if (requirement.requirement_type === 'disclosure') {
        // Check for disclosure requirements
        isAddressed = evidence.disclosure_attestation === true &&
          (policyRules.disclosure !== undefined || policyRules.transparency !== undefined)
        if (!isAddressed) {
          gapReason = 'Policy does not include disclosure requirements'
        }
      } else if (requirement.requirement_type === 'transparency') {
        // Check for transparency requirements
        isAddressed = evidence.ad_repository === true || evidence.audit_trail === true
        if (!isAddressed) {
          gapReason = 'Policy does not specify transparency or repository requirements'
        }
      } else if (requirement.requirement_type === 'documentation') {
        // Check for documentation requirements
        isAddressed = evidence.documentation === true && policyRules.documentation !== undefined
        if (!isAddressed) {
          gapReason = 'Policy does not include required documentation standards'
        }
      } else if (requirement.requirement_type === 'classification') {
        // Check for classification requirements
        isAddressed = evidence.risk_classification === true && policyRules.risk_assessment !== undefined
        if (!isAddressed) {
          gapReason = 'Policy does not include risk classification requirements'
        }
      }

      if (!isAddressed) {
        gaps.push({
          framework_id: frameworkId,
          framework_name: framework.name,
          requirement_id: requirement.id,
          requirement_code: requirement.requirement_code,
          requirement_type: requirement.requirement_type,
          description: requirement.description,
          priority: requirement.priority,
          gap_reason: gapReason || 'Requirement not addressed by policy'
        })
      }
    }

    return gaps
  } catch (error) {
    console.error('[ComplianceMappingService] Error identifying gaps:', error)
    return []
  }
}

/**
 * Calculate coverage percentage for a policy against a framework
 */
export function calculateCoveragePercentage(
  totalRequirements: number,
  metRequirements: number,
  partialRequirements: number
): number {
  if (totalRequirements === 0) return 100
  
  // Partial requirements count as 50% coverage
  const effectiveMet = metRequirements + (partialRequirements * 0.5)
  return Math.round((effectiveMet / totalRequirements) * 100)
}

/**
 * Get recommended policy templates for a framework
 */
export async function getRecommendedTemplatesForFramework(
  frameworkId: string
): Promise<any[]> {
  try {
    const token = localStorage.getItem('token') || ''
    const response = await fetch(`${API_BASE}/policy-templates?framework_id=${frameworkId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch recommended templates')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('[ComplianceMappingService] Error fetching recommended templates:', error)
    return []
  }
}

export default {
  getPolicyFrameworkMapping,
  getOrganizationComplianceStatus,
  identifyComplianceGaps,
  calculateCoveragePercentage,
  getRecommendedTemplatesForFramework
}

