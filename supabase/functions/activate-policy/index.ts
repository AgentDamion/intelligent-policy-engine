/**
 * Activate Policy Edge Function
 * 
 * Activates a policy artifact for an enterprise or workspace scope.
 * Handles deactivation of previous policy and maintains activation history.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  extractTraceContext,
  generateSpanId
} from '../_shared/policy-digest.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, traceparent, tracestate',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

type ActivationReason = 
  | 'initial_deployment' 
  | 'policy_update' 
  | 'rollback' 
  | 'compliance_remediation'
  | 'emergency_change'
  | 'scheduled_update'

interface ActivationRequest {
  policyArtifactId: string
  enterpriseId: string
  workspaceId?: string // Optional: if not provided, activates enterprise-wide
  activationReason: ActivationReason
  activationNotes?: string
}

interface ActivationResponse {
  success: boolean
  activation: {
    id: string
    digest: string
    fullReference: string
    activatedAt: string
    scope: string
  }
  previousActivation?: {
    id: string
    digest: string
    deactivatedAt: string
  }
  verificationCommand: string
}

// Roles allowed to activate policies
const AUTHORIZED_ROLES = ['admin', 'compliance_officer', 'founder', 'owner']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract trace context
    const traceContext = extractTraceContext(req.headers)
    const currentSpanId = generateSpanId()

    // Get authenticated user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    // Parse request body
    const body: ActivationRequest = await req.json()
    const { 
      policyArtifactId, 
      enterpriseId, 
      workspaceId, 
      activationReason, 
      activationNotes 
    } = body

    if (!policyArtifactId || !enterpriseId || !activationReason) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: policyArtifactId, enterpriseId, activationReason' 
      }), {
        status: 400,
        headers: corsHeaders
      })
    }

    console.log(`🔐 Policy activation request by ${user.id} for enterprise ${enterpriseId}`)

    // 1. Verify the user has permission to activate policies for this enterprise
    const { data: membership, error: memberError } = await supabase
      .from('enterprise_members')
      .select('role, business_role')
      .eq('user_id', user.id)
      .eq('enterprise_id', enterpriseId)
      .single()

    if (memberError || !membership) {
      return new Response(JSON.stringify({ 
        error: 'Not authorized for this enterprise' 
      }), {
        status: 403,
        headers: corsHeaders
      })
    }

    // Check if user has an authorized role
    const userRoles = [membership.role, membership.business_role].filter(Boolean)
    const hasPermission = userRoles.some(role => 
      AUTHORIZED_ROLES.includes(role?.toLowerCase() || '')
    )

    if (!hasPermission) {
      console.warn(`User ${user.id} lacks permission. Roles: ${userRoles.join(', ')}`)
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions to activate policies',
        requiredRoles: AUTHORIZED_ROLES
      }), {
        status: 403,
        headers: corsHeaders
      })
    }

    // 2. Get the policy artifact
    const { data: artifact, error: artifactError } = await supabase
      .from('policy_artifacts')
      .select('id, policy_id, oci_digest, oci_registry, oci_repository, oci_tag, version_number')
      .eq('id', policyArtifactId)
      .single()

    if (artifactError || !artifact) {
      return new Response(JSON.stringify({ 
        error: 'Policy artifact not found' 
      }), {
        status: 404,
        headers: corsHeaders
      })
    }

    // 3. Verify the policy belongs to this enterprise
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('id, enterprise_id, name')
      .eq('id', artifact.policy_id)
      .single()

    if (policyError || !policy || policy.enterprise_id !== enterpriseId) {
      return new Response(JSON.stringify({ 
        error: 'Policy does not belong to this enterprise' 
      }), {
        status: 403,
        headers: corsHeaders
      })
    }

    // 4. Find and deactivate any current active policy for this scope
    const { data: currentActivation, error: currentError } = await supabase
      .from('policy_activations')
      .select('id, active_digest')
      .eq('enterprise_id', enterpriseId)
      .eq('workspace_id', workspaceId || null)
      .is('deactivated_at', null)
      .order('activated_at', { ascending: false })
      .limit(1)
      .single()

    let previousActivationInfo = null
    
    if (currentActivation && !currentError) {
      // Deactivate the current policy
      const deactivatedAt = new Date().toISOString()
      await supabase
        .from('policy_activations')
        .update({
          deactivated_at: deactivatedAt,
          deactivated_by: user.id
        })
        .eq('id', currentActivation.id)

      previousActivationInfo = {
        id: currentActivation.id,
        digest: currentActivation.active_digest,
        deactivatedAt
      }

      console.log(`📤 Deactivated previous policy: ${currentActivation.active_digest.slice(0, 20)}...`)
    }

    // 5. Create new activation record
    const { data: newActivation, error: activationError } = await supabase
      .from('policy_activations')
      .insert({
        policy_artifact_id: policyArtifactId,
        enterprise_id: enterpriseId,
        workspace_id: workspaceId || null,
        active_digest: artifact.oci_digest,
        activated_by: user.id,
        activation_reason: activationReason,
        activation_notes: activationNotes || null
      })
      .select('id, active_digest, activated_at')
      .single()

    if (activationError || !newActivation) {
      console.error('Activation insert error:', activationError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create activation record',
        details: activationError?.message
      }), {
        status: 500,
        headers: corsHeaders
      })
    }

    // 6. Link the deactivated record to the new one (if applicable)
    if (previousActivationInfo) {
      await supabase
        .from('policy_activations')
        .update({ superseded_by: newActivation.id })
        .eq('id', previousActivationInfo.id)
    }

    // 7. Log the activation event to audit trail
    try {
      await supabase
        .from('governance_audit_events')
        .insert({
          enterprise_id: enterpriseId,
          actor_type: 'human',
          actor_id: user.id,
          action_type: 'policy_activated',
          policy_digest: artifact.oci_digest,
          trace_id: traceContext.traceId,
          span_id: currentSpanId,
          before_state: previousActivationInfo ? {
            activationId: previousActivationInfo.id,
            digest: previousActivationInfo.digest
          } : null,
          after_state: {
            activationId: newActivation.id,
            digest: newActivation.active_digest
          },
          metadata: {
            artifactId: policyArtifactId,
            policyId: policy.id,
            policyName: policy.name,
            versionNumber: artifact.version_number,
            fullReference: `${artifact.oci_registry}/${artifact.oci_repository}@${artifact.oci_digest}`,
            workspaceId: workspaceId || null,
            reason: activationReason,
            notes: activationNotes
          }
        })
    } catch (auditError) {
      console.warn('Audit log insert failed:', auditError)
    }

    // 8. Build full OCI reference
    const fullReference = `${artifact.oci_registry}/${artifact.oci_repository}@${artifact.oci_digest}`
    const scope = workspaceId ? `workspace:${workspaceId}` : `enterprise:${enterpriseId}`

    console.log(`✅ Policy activated: ${artifact.oci_digest.slice(0, 20)}... for ${scope}`)

    // 9. Return success response
    const response: ActivationResponse = {
      success: true,
      activation: {
        id: newActivation.id,
        digest: newActivation.active_digest,
        fullReference,
        activatedAt: newActivation.activated_at,
        scope
      },
      previousActivation: previousActivationInfo || undefined,
      verificationCommand: `docker pull ${fullReference}`
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'x-policy-digest': artifact.oci_digest,
        'x-trace-id': traceContext.traceId
      }
    })

  } catch (error) {
    console.error('Policy activation error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
})

