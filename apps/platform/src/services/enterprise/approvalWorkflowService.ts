import { supabase } from '@/lib/supabase'
import { workflowService } from '../workflow/workflowService'
import { getRoleArchetype, DEFAULT_ROLE_ARCHETYPES } from '../workflow/roleArchetypeService'
import type { Approval } from '../../pages/enterprise/types'

/**
 * Get workflow context for an approval
 */
export async function getApprovalWorkflowContext(
  approval: Approval
): Promise<{
  workflowId?: string
  workflowStep?: string
  workflowProgress?: {
    currentStep: number
    totalSteps: number
    stepName: string
    estimatedTimeRemaining?: number
  }
}> {
  // If approval already has workflow info, return it
  if (approval.workflowProgress) {
    return {
      workflowId: approval.workflowId,
      workflowStep: approval.workflowStep,
      workflowProgress: approval.workflowProgress,
    }
  }

  // Try to get workflow info from governance thread
  if (approval.governanceThreadId) {
    try {
      const { data: thread, error } = await supabase
        .from('governance_threads')
        .select('id, current_step, metadata, enterprise_id')
        .eq('id', approval.governanceThreadId)
        .single()

      if (error || !thread) {
        return {}
      }

      // Extract agency and client IDs from metadata or thread context
      const metadata = (thread.metadata as Record<string, unknown>) || {}
      const agencyId = metadata.agency_enterprise_id as string | undefined
      const clientId = metadata.client_enterprise_id as string | undefined
      const brandId = metadata.brand_id as string | undefined

      if (!agencyId || !clientId) {
        return {}
      }

      // Get effective workflow config
      const { data: workflowConfig } = await workflowService.getEffectiveWorkflowConfig(
        agencyId,
        clientId,
        brandId
      )

      if (!workflowConfig) {
        return {}
      }

      const approvalChain = workflowConfig.config?.approval_chain || []
      const currentStepName = thread.current_step || approvalChain[0] || 'unknown'

      // Find current step index
      const currentStepIndex = approvalChain.findIndex((step: string) => step === currentStepName)
      const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1
      const totalSteps = approvalChain.length

      // Get step name from role archetype
      const { data: roleArchetype } = await getRoleArchetype(currentStepName)
      const stepName = roleArchetype?.name || DEFAULT_ROLE_ARCHETYPES[currentStepName]?.name || currentStepName

      // Calculate estimated time remaining
      const escalationTimeoutHours = workflowConfig.config?.escalation_timeout_hours || 24
      const remainingSteps = totalSteps - currentStep + 1
      const estimatedTimeRemaining = remainingSteps * escalationTimeoutHours

      return {
        workflowId: workflowConfig.id,
        workflowStep: currentStepName,
        workflowProgress: {
          currentStep,
          totalSteps,
          stepName,
          estimatedTimeRemaining,
        },
      }
    } catch (error) {
      console.error('Error fetching workflow context:', error)
      return {}
    }
  }

  return {}
}

/**
 * Enhance approvals with workflow context
 */
export async function enhanceApprovalsWithWorkflow(
  approvals: Approval[]
): Promise<Approval[]> {
  const enhanced = await Promise.all(
    approvals.map(async (approval) => {
      const workflowContext = await getApprovalWorkflowContext(approval)
      return {
        ...approval,
        ...workflowContext,
      }
    })
  )
  return enhanced
}

