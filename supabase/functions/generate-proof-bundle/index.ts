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

interface ProofBundleRequest {
  enterpriseId: string
  workspaceId?: string
  submissionId?: string
  agentActivityIds?: string[]
  traceIds?: string[]
  requestedBy: string
  bundleType?: 'submission' | 'trace' | 'time_range'
  timeRange?: {
    start: string
    end: string
  }
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
      timeRange
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

    // 7. Generate bundle content
    const bundleContent = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: requestedBy,
        enterpriseId,
        enterpriseName: enterprise.name,
        workspaceId: workspaceId || null,
        submissionId: submissionId || null,
        bundleType
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
      integrityChecks: {
        activityCount: activities?.length || 0,
        decisionCount: decisions.length,
        auditEventCount: auditEvents.length,
        uniquePolicyDigests: uniqueDigests.length,
        policyDigestsConsistent: uniqueDigests.length <= 1,
        allDigests: uniqueDigests
      }
    }

    // 8. Generate content hash
    const encoder = new TextEncoder()
    const bundleBytes = encoder.encode(JSON.stringify(bundleContent))
    const hashBuffer = await crypto.subtle.digest('SHA-256', bundleBytes)
    const bundleHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // 9. Store the proof bundle
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

