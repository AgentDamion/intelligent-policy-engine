/**
 * Generate Proof Bundle Edge Function
 * 
 * Creates cryptographically verifiable proof bundles pinned to policy digests.
 * Gathers all related audit events and agent decisions by trace ID correlation.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  extractTraceContext,
  getPolicyArtifactByDigest,
  generateSpanId,
  type PolicyDigestContext
} from '../_shared/policy-digest.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, traceparent, tracestate',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

/**
 * Generate regulatory compliance metadata for a proof bundle
 * Maps the proof bundle content to organization's selected regulatory frameworks
 */
async function generateRegulatoryCompliance(
  supabase: any,
  organizationId: string,
  bundleContent: any
): Promise<any> {
  try {
    // Get organization's selected frameworks
    const { data: orgFrameworks, error: frameworksError } = await supabase
      .from('organization_frameworks')
      .select(`
        framework_id,
        regulatory_frameworks (
          id,
          name,
          short_name,
          framework_type
        )
      `)
      .eq('organization_id', organizationId)

    if (frameworksError || !orgFrameworks || orgFrameworks.length === 0) {
      // No frameworks selected, return empty compliance
      return {
        frameworks_addressed: [],
        export_formats_available: ['pdf', 'json']
      }
    }

    const frameworksAddressed = []

    // For each selected framework, analyze compliance
    for (const orgFramework of orgFrameworks) {
      const framework = orgFramework.regulatory_frameworks
      if (!framework) continue

      // Get framework requirements
      const { data: requirements, error: reqError } = await supabase
        .from('framework_requirements')
        .select('*')
        .eq('framework_id', framework.id)

      if (reqError || !requirements || requirements.length === 0) {
        continue
      }

      // Analyze which requirements are met by the proof bundle
      const requirementsMet: string[] = []
      const requirementsPartial: string[] = []
      const requirementsMissing: string[] = []

      for (const requirement of requirements) {
        const evidence = requirement.compliance_evidence || {}
        const hasAuditTrail = bundleContent.auditTrail && bundleContent.auditTrail.length > 0
        const hasDecisions = bundleContent.decisions && bundleContent.decisions.length > 0
        const hasPolicySnapshot = bundleContent.policySnapshot !== undefined

        // Check if requirement is met based on evidence criteria
        let isMet = false
        let isPartial = false

        if (requirement.requirement_type === 'audit_trail') {
          isMet = hasAuditTrail && evidence.immutable_logs === true
          isPartial = hasAuditTrail && !evidence.immutable_logs
        } else if (requirement.requirement_type === 'disclosure') {
          isMet = evidence.disclosure_attestation === true && hasPolicySnapshot
          isPartial = hasPolicySnapshot && !evidence.disclosure_attestation
        } else if (requirement.requirement_type === 'transparency') {
          isMet = hasAuditTrail && hasDecisions && evidence.ad_repository === true
          isPartial = (hasAuditTrail || hasDecisions) && !evidence.ad_repository
        } else if (requirement.requirement_type === 'documentation') {
          isMet = hasPolicySnapshot && evidence.documentation === true
          isPartial = hasPolicySnapshot && !evidence.documentation
        }

        if (isMet) {
          requirementsMet.push(requirement.id)
        } else if (isPartial) {
          requirementsPartial.push(requirement.id)
        } else {
          requirementsMissing.push(requirement.id)
        }
      }

      // Calculate coverage percentage
      const totalRequirements = requirements.length
      const metCount = requirementsMet.length
      const partialCount = requirementsPartial.length
      const coveragePercentage = totalRequirements > 0
        ? Math.round(((metCount + partialCount * 0.5) / totalRequirements) * 100)
        : 0

      frameworksAddressed.push({
        framework_id: framework.id,
        framework_name: framework.name,
        requirements_met: requirementsMet,
        requirements_partial: requirementsPartial,
        requirements_missing: requirementsMissing,
        coverage_percentage: coveragePercentage
      })
    }

    return {
      frameworks_addressed: frameworksAddressed,
      export_formats_available: ['pdf', 'json', 'fda_ectd']
    }
  } catch (error) {
    console.error('Error generating regulatory compliance:', error)
    // Return empty compliance on error
    return {
      frameworks_addressed: [],
      export_formats_available: ['pdf', 'json']
    }
  }
}

interface ProofBundleRequest {
  enterpriseId: string
  workspaceId?: string
  submissionId?: string
  agentActivityIds?: string[]
  traceIds?: string[]
  requestedBy: string
  bundleType?: 'submission' | 'trace' | 'time_range' | 'boundary'
  timeRange?: {
    start: string
    end: string
  }
  // Boundary Governance artifacts (optional)
  dt_id?: string  // Decision Token ID
  pc_id?: string  // Partner Confirmation ID
  er_id?: string  // Execution Receipt ID
}

interface ProofBundleOutput {
  id: string
  bundleHash: string
  policyReference: {
    digest: string
    fullOciReference: string
    activatedAt: string
  } | null
  traceCorrelation: {
    traceId: string
    relatedTraceIds: string[]
  }
  contents: {
    agentActivityCount: number
    decisionsIncluded: number
    auditEventsIncluded: number
  }
  // Boundary Governance proof (optional)
  boundaryProof?: {
    decisionToken: {
      dt_id: string
      enterprise_id: string
      partner_id: string | null
      tool_name: string
      tool_version: string
      vendor_name: string
      eps_id: string
      eps_digest: string
      signature: string
      issued_at: string
      expires_at: string
    } | null
    partnerConfirmation: {
      pc_id: string
      partner_id: string
      confirmer_user_id: string
      confirmed_at: string
      signature: string
    } | null
    executionReceipt: {
      er_id: string
      executor_type: string
      executor_id: string
      execution_started_at: string
      execution_completed_at: string
      outcome: any
      attestation: string
    } | null
    chainStatus: 'complete' | 'awaiting_execution' | 'awaiting_confirmation' | 'enterprise_run' | 'no_boundary'
    chainValid: boolean
  }
  generatedAt: string
  downloadUrl?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract trace context from request
    const traceContext = extractTraceContext(req.headers)
    const currentSpanId = generateSpanId()
    
    // Parse request
    const body: ProofBundleRequest = await req.json()
    const { 
      enterpriseId, 
      workspaceId, 
      submissionId, 
      agentActivityIds,
      traceIds,
      requestedBy,
      bundleType = 'trace',
      timeRange,
      // Boundary Governance artifacts
      dt_id,
      pc_id,
      er_id
    } = body

    if (!enterpriseId || !requestedBy) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: enterpriseId, requestedBy' 
      }), {
        status: 400,
        headers: corsHeaders
      })
    }

    console.log(`📦 Generating proof bundle for enterprise ${enterpriseId}`)

    // 1. Get enterprise context
    const { data: enterprise, error: entError } = await supabase
      .from('enterprises')
      .select('id, name')
      .eq('id', enterpriseId)
      .single()

    if (entError || !enterprise) {
      return new Response(JSON.stringify({ 
        error: `Enterprise not found: ${enterpriseId}` 
      }), {
        status: 404,
        headers: corsHeaders
      })
    }

    // 2. Gather agent activities based on bundle type
    let activityQuery = supabase
      .from('agent_activities')
      .select('id, agent, action, status, policy_digest, trace_id, span_id, enterprise_id, details, created_at')
      .eq('enterprise_id', enterpriseId)

    if (agentActivityIds && agentActivityIds.length > 0) {
      activityQuery = activityQuery.in('id', agentActivityIds)
    } else if (traceIds && traceIds.length > 0) {
      activityQuery = activityQuery.in('trace_id', traceIds)
    } else if (timeRange) {
      activityQuery = activityQuery
        .gte('created_at', timeRange.start)
        .lte('created_at', timeRange.end)
    } else {
      // Default: last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      activityQuery = activityQuery.gte('created_at', yesterday)
    }

    activityQuery = activityQuery.order('created_at', { ascending: true })

    const { data: activities, error: actError } = await activityQuery

    if (actError) {
      console.error('Error fetching activities:', actError)
      return new Response(JSON.stringify({ error: 'Failed to fetch activities' }), {
        status: 500,
        headers: corsHeaders
      })
    }

    // 3. Extract unique policy digests and trace IDs from activities
    const uniqueDigests = [...new Set(
      (activities || [])
        .map(a => a.policy_digest)
        .filter((d): d is string => d !== null)
    )]

    const allTraceIds = [...new Set(
      (activities || [])
        .map(a => a.trace_id)
        .filter((t): t is string => t !== null)
    )]

    console.log(`Found ${activities?.length || 0} activities, ${uniqueDigests.length} unique digests`)

    // 4. Determine primary policy digest (use earliest/most common)
    let primaryDigest: string | null = null
    let policyContext: PolicyDigestContext | null = null

    if (uniqueDigests.length > 0) {
      // Use the most frequently occurring digest
      const digestCounts = uniqueDigests.reduce((acc, d) => {
        acc[d] = (activities || []).filter(a => a.policy_digest === d).length
        return acc
      }, {} as Record<string, number>)
      
      primaryDigest = Object.entries(digestCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null

      if (primaryDigest) {
        const artifact = await getPolicyArtifactByDigest(supabase, primaryDigest)
        if (artifact) {
          // Get activation time
          const { data: activation } = await supabase
            .from('policy_activations')
            .select('activated_at')
            .eq('active_digest', primaryDigest)
            .eq('enterprise_id', enterpriseId)
            .order('activated_at', { ascending: false })
            .limit(1)
            .single()

          policyContext = {
            digest: artifact.oci_digest,
            fullReference: `${artifact.oci_registry}/${artifact.oci_repository}@${artifact.oci_digest}`,
            artifactId: artifact.id,
            policyId: artifact.policy_id,
            versionNumber: artifact.version_number,
            activatedAt: activation?.activated_at || artifact.created_at
          }
        }
      }
    }

    // 5. Fetch related audit events
    let auditEvents: any[] = []
    if (allTraceIds.length > 0) {
      const { data: events } = await supabase
        .from('governance_audit_events')
        .select('*')
        .in('trace_id', allTraceIds)
        .order('occurred_at', { ascending: true })

      auditEvents = events || []
    }

    // 6. Fetch related decisions
    let decisions: any[] = []
    if (primaryDigest) {
      const { data: decs } = await supabase
        .from('ai_agent_decisions')
        .select('*')
        .eq('policy_digest', primaryDigest)
        .eq('enterprise_id', enterpriseId)
        .order('created_at', { ascending: true })

      decisions = decs || []
    }

    // 6.5. Fetch Boundary Governance artifacts if provided
    let boundaryProof: any = null
    if (dt_id || pc_id || er_id || bundleType === 'boundary') {
      console.log(`🔐 Fetching boundary governance artifacts...`)
      
      let decisionToken = null
      let partnerConfirmation = null
      let executionReceipt = null
      let chainStatus: string = 'no_boundary'
      
      // Fetch Decision Token
      const dtIdToFetch = dt_id || (er_id ? null : null) // Will get from ER if needed
      if (dtIdToFetch) {
        const { data: dt } = await supabase
          .from('boundary_decision_tokens')
          .select('*')
          .eq('dt_id', dtIdToFetch)
          .single()
        
        if (dt) {
          decisionToken = {
            dt_id: dt.dt_id,
            enterprise_id: dt.enterprise_id,
            partner_id: dt.partner_id,
            tool_name: dt.tool_name,
            tool_version: dt.tool_version,
            vendor_name: dt.vendor_name,
            eps_id: dt.eps_id,
            eps_digest: dt.eps_digest,
            usage_grant: dt.usage_grant,
            decision: dt.decision,
            signature: dt.signature,
            signing_method: dt.signing_method,
            status: dt.status,
            issued_at: dt.issued_at,
            expires_at: dt.expires_at
          }
        }
      }
      
      // Fetch Partner Confirmation
      const pcIdToFetch = pc_id || (dt_id ? null : null)
      if (pcIdToFetch) {
        const { data: pc } = await supabase
          .from('boundary_partner_confirmations')
          .select('*')
          .eq('pc_id', pcIdToFetch)
          .single()
        
        if (pc) {
          partnerConfirmation = {
            pc_id: pc.pc_id,
            dt_id: pc.dt_id,
            partner_id: pc.partner_id,
            confirmer_user_id: pc.confirmer_user_id,
            confirmer_role: pc.confirmer_role,
            confirmation_statement: pc.confirmation_statement,
            accepted_controls: pc.accepted_controls,
            confirmed_at: pc.confirmed_at,
            signature: pc.signature,
            signing_method: pc.signing_method
          }
          
          // If we didn't have DT, fetch it via PC
          if (!decisionToken && pc.dt_id) {
            const { data: dt } = await supabase
              .from('boundary_decision_tokens')
              .select('*')
              .eq('dt_id', pc.dt_id)
              .single()
            
            if (dt) {
              decisionToken = {
                dt_id: dt.dt_id,
                enterprise_id: dt.enterprise_id,
                partner_id: dt.partner_id,
                tool_name: dt.tool_name,
                tool_version: dt.tool_version,
                vendor_name: dt.vendor_name,
                eps_id: dt.eps_id,
                eps_digest: dt.eps_digest,
                usage_grant: dt.usage_grant,
                decision: dt.decision,
                signature: dt.signature,
                signing_method: dt.signing_method,
                status: dt.status,
                issued_at: dt.issued_at,
                expires_at: dt.expires_at
              }
            }
          }
        }
      } else if (dt_id) {
        // Look for PC by DT ID
        const { data: pc } = await supabase
          .from('boundary_partner_confirmations')
          .select('*')
          .eq('dt_id', dt_id)
          .single()
        
        if (pc) {
          partnerConfirmation = {
            pc_id: pc.pc_id,
            dt_id: pc.dt_id,
            partner_id: pc.partner_id,
            confirmer_user_id: pc.confirmer_user_id,
            confirmer_role: pc.confirmer_role,
            confirmation_statement: pc.confirmation_statement,
            accepted_controls: pc.accepted_controls,
            confirmed_at: pc.confirmed_at,
            signature: pc.signature,
            signing_method: pc.signing_method
          }
        }
      }
      
      // Fetch Execution Receipt
      if (er_id) {
        const { data: er } = await supabase
          .from('boundary_execution_receipts')
          .select('*')
          .eq('er_id', er_id)
          .single()
        
        if (er) {
          executionReceipt = {
            er_id: er.er_id,
            dt_id: er.dt_id,
            pc_id: er.pc_id,
            executor_type: er.executor_type,
            executor_id: er.executor_id,
            executor_user_id: er.executor_user_id,
            execution_started_at: er.execution_started_at,
            execution_completed_at: er.execution_completed_at,
            execution_duration_ms: er.execution_duration_ms,
            outcome: er.outcome,
            attestation: er.attestation,
            signing_method: er.signing_method
          }
          
          // Fetch related DT/PC if not already fetched
          if (!decisionToken && er.dt_id) {
            const { data: dt } = await supabase
              .from('boundary_decision_tokens')
              .select('*')
              .eq('dt_id', er.dt_id)
              .single()
            
            if (dt) {
              decisionToken = {
                dt_id: dt.dt_id,
                enterprise_id: dt.enterprise_id,
                partner_id: dt.partner_id,
                tool_name: dt.tool_name,
                tool_version: dt.tool_version,
                vendor_name: dt.vendor_name,
                eps_id: dt.eps_id,
                eps_digest: dt.eps_digest,
                usage_grant: dt.usage_grant,
                decision: dt.decision,
                signature: dt.signature,
                signing_method: dt.signing_method,
                status: dt.status,
                issued_at: dt.issued_at,
                expires_at: dt.expires_at
              }
            }
          }
          
          if (!partnerConfirmation && er.pc_id) {
            const { data: pc } = await supabase
              .from('boundary_partner_confirmations')
              .select('*')
              .eq('pc_id', er.pc_id)
              .single()
            
            if (pc) {
              partnerConfirmation = {
                pc_id: pc.pc_id,
                dt_id: pc.dt_id,
                partner_id: pc.partner_id,
                confirmer_user_id: pc.confirmer_user_id,
                confirmer_role: pc.confirmer_role,
                confirmation_statement: pc.confirmation_statement,
                accepted_controls: pc.accepted_controls,
                confirmed_at: pc.confirmed_at,
                signature: pc.signature,
                signing_method: pc.signing_method
              }
            }
          }
        }
      } else if (dt_id) {
        // Look for ER by DT ID
        const { data: er } = await supabase
          .from('boundary_execution_receipts')
          .select('*')
          .eq('dt_id', dt_id)
          .single()
        
        if (er) {
          executionReceipt = {
            er_id: er.er_id,
            dt_id: er.dt_id,
            pc_id: er.pc_id,
            executor_type: er.executor_type,
            executor_id: er.executor_id,
            executor_user_id: er.executor_user_id,
            execution_started_at: er.execution_started_at,
            execution_completed_at: er.execution_completed_at,
            execution_duration_ms: er.execution_duration_ms,
            outcome: er.outcome,
            attestation: er.attestation,
            signing_method: er.signing_method
          }
        }
      }
      
      // Determine chain status
      if (executionReceipt) {
        chainStatus = 'complete'
      } else if (partnerConfirmation) {
        chainStatus = 'awaiting_execution'
      } else if (decisionToken && decisionToken.partner_id) {
        chainStatus = 'awaiting_confirmation'
      } else if (decisionToken) {
        chainStatus = 'enterprise_run'
      }
      
      // Build boundary proof object
      if (decisionToken || partnerConfirmation || executionReceipt) {
        boundaryProof = {
          decisionToken,
          partnerConfirmation,
          executionReceipt,
          chainStatus,
          chainValid: chainStatus === 'complete' || chainStatus === 'enterprise_run'
        }
        console.log(`✅ Boundary proof assembled: ${chainStatus}`)
      }
    }

    // 7. Generate bundle content
    const bundleContent = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: requestedBy,
        enterpriseId,
        enterpriseName: enterprise.name,
        workspaceId: workspaceId || null,
        submissionId: submissionId || null,
        bundleType,
        hasBoundaryProof: boundaryProof !== null
      },
      policyReference: policyContext ? {
        digest: policyContext.digest,
        fullOciReference: policyContext.fullReference,
        artifactId: policyContext.artifactId,
        policyId: policyContext.policyId,
        versionNumber: policyContext.versionNumber,
        activatedAt: policyContext.activatedAt,
        verificationCommand: `docker pull ${policyContext.fullReference}`
      } : null,
      traceCorrelation: {
        primaryTraceId: traceContext.traceId,
        generationSpanId: currentSpanId,
        relatedTraceIds: allTraceIds
      },
      agentActivities: activities || [],
      decisions: decisions,
      auditTrail: auditEvents,
      // Boundary Governance proof chain
      boundaryProof: boundaryProof,
      integrityChecks: {
        activityCount: activities?.length || 0,
        decisionCount: decisions.length,
        auditEventCount: auditEvents.length,
        uniquePolicyDigests: uniqueDigests.length,
        policyDigestsConsistent: uniqueDigests.length <= 1,
        allDigests: uniqueDigests,
        boundaryChainStatus: boundaryProof?.chainStatus || 'no_boundary',
        boundaryChainValid: boundaryProof?.chainValid || false
      }
    }

    // 8. Generate regulatory compliance metadata
    const regulatoryCompliance = await generateRegulatoryCompliance(
      supabase,
      enterpriseId,
      bundleContent
    )

    // 9. Generate canonical JSON and content hash for artifacts
    const canonicalJson = JSON.stringify(bundleContent, Object.keys(bundleContent).sort())
    const encoder = new TextEncoder()
    const bundleBytes = encoder.encode(canonicalJson)
    const hashBuffer = await crypto.subtle.digest('SHA-256', bundleBytes)
    const bundleHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // 10. Store the proof bundle
    const { data: proofBundle, error: bundleError } = await supabase
      .from('proof_bundles')
      .insert({
        enterprise_id: enterpriseId,
        organization_id: enterpriseId, // For backward compatibility
        submission_id: submissionId || null,
        policy_digest: policyContext?.digest || null,
        policy_artifact_id: policyContext?.artifactId || null,
        trace_id: traceContext.traceId,
        trace_context: {
          traceIds: allTraceIds,
          generationSpanId: currentSpanId,
          bundleType
        },
        atom_states_snapshot: bundleContent,
        decision: null, // Set based on content analysis if needed
        regulatory_compliance: regulatoryCompliance,
        bundle_hash: bundleHash, // Store hash in bundle
        created_by: requestedBy,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (bundleError) {
      console.error('Error storing proof bundle:', bundleError)
      return new Response(JSON.stringify({ 
        error: 'Failed to store proof bundle',
        details: bundleError.message 
      }), {
        status: 500,
        headers: corsHeaders
      })
    }

    // 10.5. Store proof bundle artifacts (cryptographic fields)
    await supabase
      .from('proof_bundle_artifacts')
      .insert({
        proof_bundle_id: proofBundle.id,
        bundle_hash: bundleHash,
        canonical_json: bundleContent,
        signature: null, // Would be generated with signing key
        signature_algorithm: null
      })
      .catch(err => console.error('Error storing proof bundle artifacts:', err))

    // 10.6. Generate disclosures
    try {
      await supabase.functions.invoke('generate-disclosure', {
        body: {
          proof_bundle_id: proofBundle.id,
          disclosure_formats: ['ai_origin_label', 'c2pa_manifest', 'attestation']
        }
      })
    } catch (err) {
      console.error('Error generating disclosures:', err)
      // Don't fail bundle generation if disclosure generation fails
    }

    // 10.7. Trigger compliance assessment
    try {
      await supabase.functions.invoke('assess-compliance', {
        body: {
          target_type: 'proof_bundle',
          target_id: proofBundle.id,
          options: {
            include_evidence_details: true,
            calculate_gaps: true
          }
        }
      })
    } catch (err) {
      console.error('Error assessing compliance:', err)
      // Don't fail bundle generation if compliance assessment fails
    }

    // 10. Try to store bundle file in storage (optional)
    let downloadUrl: string | undefined
    try {
      const { error: uploadError } = await supabase.storage
        .from('proof-bundles')
        .upload(
          `${proofBundle.id}/bundle.json`,
          JSON.stringify(bundleContent, null, 2),
          { contentType: 'application/json', upsert: true }
        )

      if (!uploadError) {
        const { data: signedUrl } = await supabase.storage
          .from('proof-bundles')
          .createSignedUrl(`${proofBundle.id}/bundle.json`, 3600)
        
        downloadUrl = signedUrl?.signedUrl
      }
    } catch (storageError) {
      console.warn('Storage upload skipped:', storageError)
    }

    // 11. Log the bundle generation event
    try {
      await supabase
        .from('governance_audit_events')
        .insert({
          enterprise_id: enterpriseId,
          actor_type: 'system',
          actor_id: null,
          action_type: 'proof_bundle_generated',
          policy_digest: policyContext?.digest || null,
          trace_id: traceContext.traceId,
          span_id: currentSpanId,
          trace_context: { bundleId: proofBundle.id, bundleHash },
          metadata: {
            bundleHash: `sha256:${bundleHash}`,
            activityCount: activities?.length || 0,
            policyDigest: policyContext?.digest,
            policyReference: policyContext?.fullReference
          }
        })
    } catch (auditError) {
      console.warn('Audit log skipped:', auditError)
    }

    // 12. Return response
    const output: ProofBundleOutput = {
      id: proofBundle.id,
      bundleHash: `sha256:${bundleHash}`,
      policyReference: policyContext ? {
        digest: policyContext.digest,
        fullOciReference: policyContext.fullReference,
        activatedAt: policyContext.activatedAt
      } : null,
      traceCorrelation: {
        traceId: traceContext.traceId,
        relatedTraceIds: allTraceIds
      },
      contents: {
        agentActivityCount: activities?.length || 0,
        decisionsIncluded: decisions.length,
        auditEventsIncluded: auditEvents.length
      },
      // Boundary Governance proof (if available)
      boundaryProof: boundaryProof || undefined,
      generatedAt: new Date().toISOString(),
      downloadUrl
    }

    console.log(`✅ Proof bundle generated: ${proofBundle.id} (${Date.now() - startTime}ms)`)

    return new Response(JSON.stringify(output), {
      headers: {
        ...corsHeaders,
        'x-bundle-hash': output.bundleHash,
        'x-policy-digest': policyContext?.digest || '',
        'x-trace-id': traceContext.traceId
      }
    })

  } catch (error) {
    console.error('Proof bundle generation error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
})








