/**
 * Proof Bundle Batch Service
 * 
 * Manages batch proof bundles - collections of multiple decisions bundled together
 * for regulatory export and audit purposes.
 */

import { supabase } from '@/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface BatchProofBundle {
  id: string
  bundleNumber: string
  enterpriseId: string
  enterpriseName: string
  status: 'draft' | 'finalized' | 'exported'
  generatedAt: string
  generatedBy: {
    id: string
    name: string
    role: string
  }
  scope: {
    brands: string[]
    dateRange: {
      start: string
      end: string
    }
    decisionCount: number
  }
  verification: {
    bundleHash: string
    signatureAlgorithm: 'RSA' | 'ECDSA' | 'EdDSA' | null
    signatureKeyId: string | null
    signatureValid: boolean | null
    ledgerEntryHash: string
    previousEntryHash: string | null
    finalizedAt: string | null
    finalizedBy: string | null
  }
  regulatoryFramework: string
  decisions: BatchDecision[]
  policySnapshot: {
    version: string
    effectiveDate: string
    policyDigest: string
    ruleCount: number
  }
  metadata: {
    exportCount: number
    lastExportedAt: string | null
    verificationUrl: string
  }
}

export interface BatchDecision {
  id: string
  decisionNumber: string
  timestamp: string
  toolName: string
  toolVersion: string
  brandName: string
  outcome: 'approved' | 'approved_with_conditions' | 'denied' | 'escalated'
  confidenceScore: number
  rationale: string
  conditions: string[]
  approvalChain: ApprovalStep[]
  triggeredRules: TriggeredRule[]
  precedentIds: string[]
  contextSnapshot: ContextSnapshot
}

export interface ApprovalStep {
  stepNumber: number
  role: string
  actorName: string
  action: 'approved' | 'denied' | 'escalated' | 'pending'
  timestamp: string
  notes: string | null
}

export interface TriggeredRule {
  id: string
  name: string
  type: 'require' | 'prohibit' | 'condition'
  outcome: 'pass' | 'fail' | 'warning'
  details: string
}

export interface ContextSnapshot {
  policyVersion: string
  partnerName: string
  partnerComplianceScore: number
  toolRiskTier: 'low' | 'medium' | 'high'
  regulatoryEnvironment: string
}

export interface BatchProofBundleListItem {
  id: string
  bundleNumber: string
  enterpriseName: string
  brands: string[]
  status: 'draft' | 'finalized' | 'exported'
  decisionCount: number
  generatedAt: string
  verified: boolean | null
}

export interface VerificationResult {
  hashValid: boolean
  signatureValid: boolean
  chainValid: boolean
  timestamp: string
  details: {
    recalculatedHash: string
    storedHash: string
    signatureKeyId: string | null
    previousEntryHash: string | null
  }
}

export interface GenerateBatchBundleOptions {
  enterpriseId: string
  brands: string[]
  dateRange: {
    start: string
    end: string
  }
  regulatoryFramework?: string
}

export interface ListBatchBundlesOptions {
  enterpriseId?: string
  status?: 'draft' | 'finalized' | 'exported'
  limit?: number
  offset?: number
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get a single batch proof bundle by ID with all related data
 */
export async function getBatchBundle(bundleId: string): Promise<BatchProofBundle | null> {
  try {
    // Fetch the main bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('proof_bundles')
      .select(`
        *,
        enterprises!inner (
          id,
          name
        ),
        profiles:generated_by (
          id,
          full_name
        )
      `)
      .eq('id', bundleId)
      .eq('bundle_type', 'batch')
      .single()

    if (bundleError) {
      if (bundleError.code === 'PGRST116') return null // Not found
      throw bundleError
    }

    if (!bundle) return null

    // Fetch the artifact (cryptographic data)
    const { data: artifact, error: artifactError } = await supabase
      .from('proof_bundle_artifacts')
      .select('*')
      .eq('proof_bundle_id', bundleId)
      .single()

    if (artifactError && artifactError.code !== 'PGRST116') {
      console.warn('Error fetching artifact:', artifactError)
    }

    // Fetch ledger entry
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('vera.proof_bundle_ledger')
      .select('*')
      .eq('proof_bundle_id', bundleId)
      .single()

    if (ledgerError && ledgerError.code !== 'PGRST116') {
      console.warn('Error fetching ledger entry:', ledgerError)
    }

    // Fetch linked decisions via junction table
    const { data: bundleDecisions, error: decisionsError } = await supabase
      .from('proof_bundle_decisions')
      .select(`
        governance_thread_id,
        governance_threads (
          *,
          governance_actions (
            *
          )
        )
      `)
      .eq('proof_bundle_id', bundleId)

    if (decisionsError) {
      console.error('Error fetching bundle decisions:', decisionsError)
    }

    // Transform to BatchProofBundle type
    return transformToBatchProofBundle(
      bundle,
      artifact,
      ledgerEntry,
      bundleDecisions || []
    )
  } catch (error) {
    console.error('Error fetching batch bundle:', error)
    throw error
  }
}

/**
 * List batch proof bundles with filtering and pagination
 */
export async function listBatchBundles(
  options: ListBatchBundlesOptions = {}
): Promise<{ bundles: BatchProofBundleListItem[]; total: number }> {
  const { enterpriseId, status, limit = 20, offset = 0 } = options

  try {
    let query = supabase
      .from('proof_bundles')
      .select(`
        id,
        bundle_number,
        status,
        decision_count,
        brands,
        created_at,
        enterprises!inner (name),
        proof_bundle_artifacts (signature)
      `, { count: 'exact' })
      .eq('bundle_type', 'batch')

    if (enterpriseId) {
      query = query.eq('enterprise_id', enterpriseId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const bundles: BatchProofBundleListItem[] = (data || []).map((b: any) => ({
      id: b.id,
      bundleNumber: b.bundle_number || '',
      enterpriseName: b.enterprises?.name || 'Unknown',
      brands: b.brands || [],
      status: b.status || 'draft',
      decisionCount: b.decision_count || 0,
      generatedAt: b.created_at,
      verified: b.proof_bundle_artifacts?.[0]?.signature ? true : null,
    }))

    return { bundles, total: count || 0 }
  } catch (error) {
    console.error('Error listing batch bundles:', error)
    throw error
  }
}

/**
 * Generate a new batch proof bundle
 */
export async function generateBatchBundle(
  options: GenerateBatchBundleOptions
): Promise<{ bundleId: string; bundleNumber: string }> {
  const { enterpriseId, brands, dateRange, regulatoryFramework = 'FDA 21 CFR Part 11' } = options

  try {
    const { data, error } = await supabase.rpc('generate_batch_bundle', {
      p_enterprise_id: enterpriseId,
      p_brands: brands,
      p_start_date: dateRange.start,
      p_end_date: dateRange.end,
      p_regulatory_framework: regulatoryFramework,
    })

    if (error) throw error

    return {
      bundleId: data.bundle_id,
      bundleNumber: data.bundle_number,
    }
  } catch (error) {
    console.error('Error generating batch bundle:', error)
    throw error
  }
}

/**
 * Finalize a batch proof bundle (signs and locks it)
 */
export async function finalizeBatchBundle(bundleId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('finalize_batch_bundle', {
      p_bundle_id: bundleId,
    })

    if (error) throw error
  } catch (error) {
    console.error('Error finalizing batch bundle:', error)
    throw error
  }
}

/**
 * Verify a batch proof bundle's cryptographic integrity
 */
export async function verifyBatchBundle(bundleId: string): Promise<VerificationResult> {
  try {
    const { data, error } = await supabase.rpc('verify_batch_bundle_integrity', {
      p_bundle_id: bundleId,
    })

    if (error) throw error

    return {
      hashValid: data.hash_valid,
      signatureValid: data.signature_valid,
      chainValid: data.chain_valid,
      timestamp: new Date().toISOString(),
      details: {
        recalculatedHash: data.recalculated_hash,
        storedHash: data.stored_hash,
        signatureKeyId: data.signature_key_id,
        previousEntryHash: data.previous_entry_hash,
      },
    }
  } catch (error) {
    console.error('Error verifying batch bundle:', error)
    
    // Return a failed verification result
    return {
      hashValid: false,
      signatureValid: false,
      chainValid: false,
      timestamp: new Date().toISOString(),
      details: {
        recalculatedHash: '',
        storedHash: '',
        signatureKeyId: null,
        previousEntryHash: null,
      },
    }
  }
}

/**
 * Export batch bundle as PDF
 */
export async function exportBatchBundlePDF(bundleId: string): Promise<Blob> {
  try {
    // TODO: Call edge function for PDF generation
    // For now, return empty blob as placeholder
    // const { data, error } = await supabase.functions.invoke('generate-batch-bundle-pdf', {
    //   body: { bundleId },
    // })
    
    // if (error) throw error
    
    // Record export
    await recordExport(bundleId, 'pdf')
    
    // Placeholder: return empty blob
    return new Blob([], { type: 'application/pdf' })
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw error
  }
}

/**
 * Export batch bundle as ZIP with all evidence
 */
export async function exportBatchBundleZIP(bundleId: string): Promise<Blob> {
  try {
    // TODO: Call edge function for ZIP generation
    // For now, return empty blob as placeholder
    // const { data, error } = await supabase.functions.invoke('generate-batch-bundle-zip', {
    //   body: { bundleId },
    // })
    
    // if (error) throw error
    
    // Record export
    await recordExport(bundleId, 'zip')
    
    // Placeholder: return empty blob
    return new Blob([], { type: 'application/zip' })
  } catch (error) {
    console.error('Error exporting ZIP:', error)
    throw error
  }
}

/**
 * Record an export event
 */
async function recordExport(bundleId: string, format: 'pdf' | 'zip'): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('proof_bundle_exports')
      .insert({
        proof_bundle_id: bundleId,
        format,
        exported_at: new Date().toISOString(),
        exported_by: user?.id,
      })

    if (error) throw error

    // Update export count on bundle
    await supabase.rpc('increment_export_count', { p_bundle_id: bundleId })
  } catch (error) {
    console.error('Error recording export:', error)
    // Non-critical, don't throw
  }
}

// =============================================================================
// Transform Functions
// =============================================================================

function transformToBatchProofBundle(
  bundle: any,
  artifact: any,
  ledgerEntry: any,
  bundleDecisions: any[]
): BatchProofBundle {
  const enterpriseName = bundle.enterprises?.name || 'Unknown'
  const generatedBy = bundle.profiles || {}
  
  // Transform decisions
  const decisions: BatchDecision[] = bundleDecisions
    .map((bd: any) => {
      const thread = bd.governance_threads
      if (!thread) return null
      return transformDecision(thread, thread.governance_actions || [])
    })
    .filter((d: BatchDecision | null): d is BatchDecision => d !== null)

  // Get policy snapshot data
  const policyVersion = bundle.policy_version || ''
  const policyDigest = bundle.policy_digest || ''
  const policyEffectiveDate = bundle.policy_effective_date || bundle.created_at

  // Build verification object
  const verification = {
    bundleHash: artifact?.bundle_hash || '',
    signatureAlgorithm: (artifact?.signature_algorithm as 'RSA' | 'ECDSA' | 'EdDSA') || null,
    signatureKeyId: artifact?.signature_key_id || null,
    signatureValid: artifact?.signature ? true : null,
    ledgerEntryHash: ledgerEntry?.ledger_entry_hash || '',
    previousEntryHash: ledgerEntry?.previous_entry_hash || null,
    finalizedAt: ledgerEntry?.finalized_at || bundle.finalized_at || null,
    finalizedBy: ledgerEntry?.finalized_by_name || null,
  }

  // Get export metadata
  const exportCount = bundle.export_count || 0
  const lastExportedAt = bundle.last_exported_at || null
  const bundleNumber = bundle.bundle_number || `PB-${bundle.id.slice(0, 8).toUpperCase()}`

  return {
    id: bundle.id,
    bundleNumber,
    enterpriseId: bundle.enterprise_id,
    enterpriseName,
    status: bundle.status || 'draft',
    generatedAt: bundle.created_at,
    generatedBy: {
      id: bundle.generated_by || '',
      name: generatedBy.full_name || 'System',
      role: bundle.generated_by_role || 'Compliance Officer',
    },
    scope: {
      brands: bundle.brands || [],
      dateRange: {
        start: bundle.scope_start_date || '',
        end: bundle.scope_end_date || '',
      },
      decisionCount: bundle.decision_count || decisions.length,
    },
    verification,
    regulatoryFramework: bundle.regulatory_framework || 'FDA 21 CFR Part 11',
    decisions,
    policySnapshot: {
      version: policyVersion,
      effectiveDate: policyEffectiveDate,
      policyDigest,
      ruleCount: 0, // TODO: Get actual rule count from policy
    },
    metadata: {
      exportCount,
      lastExportedAt,
      verificationUrl: `https://verify.aicomplyr.com/${bundleNumber}`,
    },
  }
}

function transformDecision(thread: any, actions: any[]): BatchDecision {
  // Extract metadata
  const metadata = (thread.metadata as Record<string, any>) || {}
  
  // Map thread status to decision outcome
  const outcome = mapStatusToOutcome(thread.status, actions)
  
  // Get tool info from metadata
  const toolName = metadata.tool_name || metadata.tool || 'Unknown Tool'
  const toolVersion = metadata.tool_version || ''
  const brandName = metadata.brand_name || metadata.brand_id || 'Unknown Brand'
  
  // Generate decision number
  const decisionNumber = thread.thread_number || `DEC-${thread.id.slice(0, 8).toUpperCase()}`
  
  // Extract rationale from actions or thread
  const rationale = extractRationale(actions, metadata)
  
  // Extract conditions from metadata or actions
  const conditions = extractConditions(metadata, actions)
  
  // Build approval chain from actions
  const approvalChain = buildApprovalChain(actions)
  
  // Extract triggered rules
  const triggeredRules = extractTriggeredRules(metadata)
  
  // Get precedent IDs
  const precedentIds = metadata.precedent_ids || []
  
  // Build context snapshot
  const contextSnapshot = buildContextSnapshot(thread, metadata)
  
  // Get confidence score
  const confidenceScore = metadata.confidence_score || 
    (outcome === 'approved' ? 95 : outcome === 'denied' ? 98 : 75)

  return {
    id: thread.id,
    decisionNumber,
    timestamp: thread.created_at,
    toolName,
    toolVersion,
    brandName,
    outcome,
    confidenceScore,
    rationale,
    conditions,
    approvalChain,
    triggeredRules,
    precedentIds,
    contextSnapshot,
  }
}

function mapStatusToOutcome(status: string, actions: any[]): 'approved' | 'approved_with_conditions' | 'denied' | 'escalated' {
  // Check actions for the final decision
  const approveAction = actions.find((a: any) => a.action_type === 'approve')
  const rejectAction = actions.find((a: any) => a.action_type === 'reject')
  const escalateAction = actions.find((a: any) => a.action_type === 'escalate')
  
  if (rejectAction) return 'denied'
  if (escalateAction) return 'escalated'
  if (approveAction) {
    // Check if there are conditions
    const hasConditions = approveAction.metadata?.conditions || approveAction.rationale?.includes('condition')
    return hasConditions ? 'approved_with_conditions' : 'approved'
  }
  
  // Fallback to status mapping
  switch (status?.toLowerCase()) {
    case 'resolved':
      return 'approved'
    case 'cancelled':
      return 'denied'
    default:
      return 'escalated'
  }
}

function extractRationale(actions: any[], metadata: Record<string, any>): string {
  // Try to get rationale from the most recent approve/reject action
  const decisionAction = actions
    .filter((a: any) => ['approve', 'reject'].includes(a.action_type))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  
  if (decisionAction?.rationale) {
    return decisionAction.rationale
  }
  
  // Fallback to metadata
  if (metadata.rationale) {
    return metadata.rationale
  }
  
  return 'Decision made based on policy evaluation.'
}

function extractConditions(metadata: Record<string, any>, actions: any[]): string[] {
  // Check metadata first
  if (metadata.conditions && Array.isArray(metadata.conditions)) {
    return metadata.conditions
  }
  
  // Check actions for conditions
  const approveAction = actions.find((a: any) => a.action_type === 'approve')
  if (approveAction?.metadata?.conditions && Array.isArray(approveAction.metadata.conditions)) {
    return approveAction.metadata.conditions
  }
  
  return []
}

function buildApprovalChain(actions: any[]): ApprovalStep[] {
  // Filter for decision actions and sort by timestamp
  const decisionActions = actions
    .filter((a: any) => ['approve', 'reject', 'escalate', 'submit'].includes(a.action_type))
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  
  return decisionActions.map((action: any, index: number) => {
    const actorName = getActorName(action)
    const role = getActorRole(action)
    
    return {
      stepNumber: index + 1,
      role,
      actorName,
      action: mapActionType(action.action_type),
      timestamp: action.created_at,
      notes: action.rationale || null,
    }
  })
}

function getActorName(action: any): string {
  if (action.actor_type === 'human' && action.actor_id) {
    // TODO: Lookup user name from profiles
    return 'User'
  }
  if (action.actor_type === 'agent' && action.agent_name) {
    return action.agent_name
  }
  return 'System'
}

function getActorRole(action: any): string {
  if (action.metadata?.role) {
    return action.metadata.role
  }
  if (action.agent_name) {
    return action.agent_name.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }
  return action.actor_type === 'human' ? 'Reviewer' : 'System'
}

function mapActionType(actionType: string): 'approved' | 'denied' | 'escalated' | 'pending' {
  switch (actionType) {
    case 'approve':
      return 'approved'
    case 'reject':
      return 'denied'
    case 'escalate':
      return 'escalated'
    default:
      return 'pending'
  }
}

function extractTriggeredRules(metadata: Record<string, any>): TriggeredRule[] {
  if (!metadata.triggered_rules || !Array.isArray(metadata.triggered_rules)) {
    return []
  }
  
  return metadata.triggered_rules.map((rule: any, index: number) => ({
    id: rule.id || rule.rule_id || `rule-${index}`,
    name: rule.name || rule.rule_name || 'Policy Rule',
    type: rule.type || rule.rule_type || 'require',
    outcome: rule.outcome || 'pass',
    details: rule.details || rule.description || '',
  }))
}

function buildContextSnapshot(thread: any, metadata: Record<string, any>): ContextSnapshot {
  return {
    policyVersion: metadata.policy_version || thread.policy_version || 'unknown',
    partnerName: metadata.partner_name || 'Unknown Partner',
    partnerComplianceScore: metadata.partner_compliance_score || 85,
    toolRiskTier: mapRiskTier(metadata.risk_score || metadata.risk_tier),
    regulatoryEnvironment: metadata.regulatory_environment || 'FDA Regulated',
  }
}

function mapRiskTier(riskScore: number | string | undefined): 'low' | 'medium' | 'high' {
  if (typeof riskScore === 'string') {
    const lower = riskScore.toLowerCase()
    if (lower.includes('high')) return 'high'
    if (lower.includes('low')) return 'low'
    return 'medium'
  }
  
  if (typeof riskScore === 'number') {
    if (riskScore >= 0.7) return 'high'
    if (riskScore >= 0.4) return 'medium'
    return 'low'
  }
  
  return 'medium'
}

// =============================================================================
// Export Service Object
// =============================================================================

export const proofBundleBatchService = {
  getBatchBundle,
  listBatchBundles,
  generateBatchBundle,
  finalizeBatchBundle,
  verifyBatchBundle,
  exportBatchBundlePDF,
  exportBatchBundleZIP,
}

export default proofBundleBatchService

