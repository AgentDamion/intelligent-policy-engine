/**
 * Governance Thread Service
 * 
 * Frontend service for interacting with governance threads and actions.
 * Implements the Action Catalog specification with full envelope support.
 */

import { supabase } from '@/lib/supabase'

// ============================================
// Types - Action Catalog Aligned
// ============================================

export type ThreadType = 'tool_request' | 'policy_change' | 'incident' | 'audit'

// Full Action Catalog thread statuses
export type ThreadStatus = 
  | 'open'
  | 'pending_human'
  | 'resolved'
  | 'cancelled'
  | 'in_review'
  | 'needs_info'
  | 'proposed_resolution'
  | 'escalated'
  | 'approved'
  | 'approved_with_conditions'
  | 'blocked'
  | 'archived'

export type ThreadPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ThreadSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ActorType = 'human' | 'agent' | 'system'

// Action Catalog surfaces
export type Surface = 
  | 'Inbox'
  | 'Weave'
  | 'Decisions'
  | 'Configuration'
  | 'Workbench'
  | 'Middleware'
  | 'Test'

// Action Catalog roles
export type Role = 
  | 'partner'
  | 'operator'
  | 'reviewer'
  | 'admin'
  | 'agent'
  | 'system'

// Full Action Catalog action types
export type ActionType = 
  // Thread Intake & Triage
  | 'CreateThread'
  | 'SetSeverity'
  | 'AssignOwner'
  | 'AssignReviewers'
  | 'UpdateThreadStatus'
  | 'ArchiveThread'
  | 'ReopenThread'
  // Information Requests
  | 'RequestMoreInfo'
  | 'ProvideInfo'
  // Human Decision Actions
  | 'HumanApproveDecision'
  | 'HumanBlockDecision'
  | 'HumanApproveWithConditions'
  | 'HumanRequestChanges'
  | 'HumanEscalate'
  // Agent Actions
  | 'AgentEvaluate'
  | 'AgentRecommend'
  | 'AgentAutoApprove'
  | 'AgentAutoBlock'
  | 'AgentCreateProposal'
  | 'AgentRunSimulation'
  // Legacy actions (backward compat)
  | 'submit'
  | 'evaluate'
  | 'approve'
  | 'reject'
  | 'escalate'
  | 'request_info'
  | 'provide_info'
  | 'comment'
  | 'reassign'
  | 'cancel'
  | 'auto_clear'
  | 'draft_decision'

export interface GovernanceThread {
  id: string
  enterpriseId: string
  threadType: ThreadType
  subjectId: string
  subjectType: string
  status: ThreadStatus
  currentStep: string | null
  flowRunId: string | null
  proofBundleId: string | null
  submissionId: string | null
  priority: ThreadPriority
  severity: ThreadSeverity | null
  slaDueAt: Date | null
  title: string | null
  description: string | null
  metadata: Record<string, unknown>
  ownerUserId: string | null
  reviewerUserIds: string[]
  createdAt: Date
  updatedAt: Date
  resolvedAt: Date | null
  resolvedBy: string | null
}

// Context snapshot for FDA 21 CFR Part 11 compliance
export interface ContextSnapshot {
  policy_state: {
    eps_id: string
    version: string
    sha256_hash: string
    policy_json: Record<string, unknown> | null
  }
  partner_state: {
    partner_id: string | null
    compliance_score: number
    active_attestations: number
    risk_level: 'low' | 'medium' | 'high'
  }
  tool_state: {
    tools_evaluated: Array<{
      tool_id: string
      vendor: string
      risk_profile: string
    }>
    last_audit_date: string | null
  }
  enterprise_state: {
    enterprise_id: string
    vera_mode: 'disabled' | 'shadow' | 'enforcement'
    regulatory_environment: string[]
    compliance_posture: 'standard' | 'high_rigor' | 'maximum'
  }
  submission_details: Record<string, unknown> | null
  external_context: {
    regulatory_guidance_version: string
    decision_timestamp: string
    agent_version: string
  }
}

export interface GovernanceAction {
  id: string
  threadId: string
  actionType: ActionType
  actorType: ActorType
  actorId: string | null
  actorRole: Role | null
  agentName: string | null
  rationale: string | null
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  contextSnapshot: ContextSnapshot | null  // FDA compliance: full decision context
  metadata: Record<string, unknown>
  surface: Surface | null
  mode: string | null
  client: string | null
  idempotencyKey: string | null
  createdAt: Date
}

export interface ThreadFilters {
  status?: ThreadStatus | ThreadStatus[]
  threadType?: ThreadType | ThreadType[]
  priority?: ThreadPriority | ThreadPriority[]
  severity?: ThreadSeverity | ThreadSeverity[]
  search?: string
  limit?: number
  offset?: number
}

export interface ThreadWithActions extends GovernanceThread {
  actions: GovernanceAction[]
}

// Action Catalog envelope for submitting actions
export interface ActionEnvelope {
  idempotency_key: string
  action_type: ActionType
  thread_id: string
  actor: {
    type: ActorType
    user_id?: string
    role: Role
  }
  context: {
    surface: Surface
    mode?: string
    client: string
  }
  payload?: Record<string, unknown>
  rationale?: string
}

// Legacy input format (still supported)
export interface ActionInput {
  action: ActionType
  rationale: string
  metadata?: Record<string, unknown>
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a UUID for idempotency
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

/**
 * Get the current user's role (simplified - in production, fetch from user context)
 */
export function getUserRole(): Role {
  // TODO: Fetch actual role from user profile/enterprise membership
  return 'reviewer'
}

// ============================================
// Helper Functions
// ============================================

function mapThread(data: Record<string, unknown>): GovernanceThread {
  return {
    id: data.id as string,
    enterpriseId: data.enterprise_id as string,
    threadType: data.thread_type as ThreadType,
    subjectId: data.subject_id as string,
    subjectType: data.subject_type as string,
    status: data.status as ThreadStatus,
    currentStep: data.current_step as string | null,
    flowRunId: data.flow_run_id as string | null,
    proofBundleId: data.proof_bundle_id as string | null,
    submissionId: data.submission_id as string | null,
    priority: data.priority as ThreadPriority,
    severity: data.severity as ThreadSeverity | null,
    slaDueAt: data.sla_due_at ? new Date(data.sla_due_at as string) : null,
    title: data.title as string | null,
    description: data.description as string | null,
    metadata: (data.metadata as Record<string, unknown>) || {},
    ownerUserId: data.owner_user_id as string | null,
    reviewerUserIds: (data.reviewer_user_ids as string[]) || [],
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
    resolvedAt: data.resolved_at ? new Date(data.resolved_at as string) : null,
    resolvedBy: data.resolved_by as string | null,
  }
}

function mapAction(data: Record<string, unknown>): GovernanceAction {
  return {
    id: data.id as string,
    threadId: data.thread_id as string,
    actionType: data.action_type as ActionType,
    actorType: data.actor_type as ActorType,
    actorId: data.actor_id as string | null,
    actorRole: data.actor_role as Role | null,
    agentName: data.agent_name as string | null,
    rationale: data.rationale as string | null,
    beforeState: data.before_state as Record<string, unknown> | null,
    afterState: data.after_state as Record<string, unknown> | null,
    contextSnapshot: data.context_snapshot as ContextSnapshot | null,  // FDA compliance
    metadata: (data.metadata as Record<string, unknown>) || {},
    surface: data.surface as Surface | null,
    mode: data.mode as string | null,
    client: data.client as string | null,
    idempotencyKey: data.idempotency_key as string | null,
    createdAt: new Date(data.created_at as string),
  }
}

// ============================================
// Thread Operations
// ============================================

/**
 * Get threads for an enterprise with optional filters
 */
export async function getThreads(
  enterpriseId: string,
  filters: ThreadFilters = {}
): Promise<{ data: GovernanceThread[]; total: number }> {
  // Guard against missing or "undefined" enterpriseId
  if (!enterpriseId || enterpriseId === 'undefined') {
    console.warn('[governanceThreadService] getThreads called without valid enterpriseId');
    return { data: [], total: 0 };
  }

  const { status, threadType, priority, severity, search, limit = 50, offset = 0 } = filters

  let query = supabase
    .from('governance_threads')
    .select('*', { count: 'exact' })
    .eq('enterprise_id', enterpriseId)
    .order('created_at', { ascending: false })

  // Apply filters
  if (status) {
    const statusArray = Array.isArray(status) ? status : [status]
    query = query.in('status', statusArray)
  }

  if (threadType) {
    const typeArray = Array.isArray(threadType) ? threadType : [threadType]
    query = query.in('thread_type', typeArray)
  }

  if (priority) {
    const priorityArray = Array.isArray(priority) ? priority : [priority]
    query = query.in('priority', priorityArray)
  }

  if (severity) {
    const severityArray = Array.isArray(severity) ? severity : [severity]
    query = query.in('severity', severityArray)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[governanceThreadService] Error fetching threads:', error)
    throw new Error(`Failed to fetch threads: ${error.message}`)
  }

  return {
    data: (data || []).map(mapThread),
    total: count || 0,
  }
}

/**
 * Get a single thread by ID
 */
export async function getThread(threadId: string): Promise<GovernanceThread | null> {
  const { data, error } = await supabase
    .from('governance_threads')
    .select('*')
    .eq('id', threadId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('[governanceThreadService] Error fetching thread:', error)
    throw new Error(`Failed to fetch thread: ${error.message}`)
  }

  return data ? mapThread(data) : null
}

/**
 * Get a thread with its full action history
 */
export async function getThreadWithActions(threadId: string): Promise<ThreadWithActions | null> {
  // Fetch thread
  const thread = await getThread(threadId)
  if (!thread) return null

  // Fetch actions
  const actions = await getActionHistory(threadId)

  return {
    ...thread,
    actions,
  }
}

/**
 * Get pending threads (Inbox view)
 * Returns threads that require triage: open, in_review, needs_info, proposed_resolution
 */
export async function getInboxThreads(
  enterpriseId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ data: GovernanceThread[]; total: number }> {
  return getThreads(enterpriseId, {
    status: ['open', 'pending_human', 'in_review', 'needs_info'],
    limit: options.limit,
    offset: options.offset,
  })
}

/**
 * Get threads requiring decisions (Decisions view)
 * Returns threads in states that allow final decisions
 */
export async function getDecisionThreads(
  enterpriseId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ data: GovernanceThread[]; total: number }> {
  return getThreads(enterpriseId, {
    status: ['in_review', 'pending_human', 'proposed_resolution', 'escalated'],
    limit: options.limit,
    offset: options.offset,
  })
}

/**
 * Get resolved threads (Decisions/Spine view)
 * Returns threads that have been resolved or cancelled
 */
export async function getResolvedThreads(
  enterpriseId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ data: GovernanceThread[]; total: number }> {
  return getThreads(enterpriseId, {
    status: ['resolved', 'cancelled', 'approved', 'blocked', 'approved_with_conditions', 'archived'],
    limit: options.limit,
    offset: options.offset,
  })
}

// ============================================
// Action Operations - Action Catalog Envelope
// ============================================

/**
 * Get action history for a thread
 */
export async function getActionHistory(threadId: string): Promise<GovernanceAction[]> {
  const { data, error } = await supabase
    .from('governance_actions')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[governanceThreadService] Error fetching actions:', error)
    throw new Error(`Failed to fetch action history: ${error.message}`)
  }

  return (data || []).map(mapAction)
}

/**
 * Submit an action using the full Action Catalog envelope
 * This is the primary method for all governance actions
 */
export async function submitActionEnvelope(
  envelope: ActionEnvelope
): Promise<{ success: boolean; actionId?: string; newStatus?: string; error?: string; code?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('governance-action', {
      body: envelope,
    })

    if (error) {
      console.error('[governanceThreadService] Error submitting action:', error)
      return { success: false, error: error.message }
    }

    // Handle string response (Edge Function returns JSON string)
    const result = typeof data === 'string' ? JSON.parse(data) : data

    if (!result.success) {
      return { 
        success: false, 
        error: result.error || 'Action failed',
        code: result.code 
      }
    }

    return {
      success: true,
      actionId: result.actionId,
      newStatus: result.newStatus,
    }
  } catch (err) {
    console.error('[governanceThreadService] Exception submitting action:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Submit an action with surface context (simplified wrapper)
 */
export async function submitAction(
  threadId: string,
  actionType: ActionType,
  surface: Surface,
  rationale: string,
  options: {
    role?: Role
    payload?: Record<string, unknown>
    mode?: string
  } = {}
): Promise<{ success: boolean; actionId?: string; newStatus?: string; error?: string; code?: string }> {
  const envelope: ActionEnvelope = {
    idempotency_key: generateIdempotencyKey(),
    action_type: actionType,
    thread_id: threadId,
    actor: {
      type: 'human',
      role: options.role || getUserRole(),
    },
    context: {
      surface,
      mode: options.mode,
      client: 'web',
    },
    payload: options.payload || {},
    rationale,
  }

  return submitActionEnvelope(envelope)
}

/**
 * Submit a legacy-format action (backward compatible)
 */
export async function submitLegacyAction(
  threadId: string,
  input: ActionInput
): Promise<{ success: boolean; actionId?: string; newStatus?: string; error?: string }> {
  const { action, rationale, metadata = {} } = input

  try {
    const { data, error } = await supabase.functions.invoke('governance-action', {
      body: {
        action,
        threadId,
        rationale,
        actorType: 'human',
        metadata,
      },
    })

    if (error) {
      console.error('[governanceThreadService] Error submitting action:', error)
      return { success: false, error: error.message }
    }

    // Handle string response (Edge Function returns JSON string)
    const result = typeof data === 'string' ? JSON.parse(data) : data

    if (!result.success) {
      return { success: false, error: result.error || 'Action failed' }
    }

    return {
      success: true,
      actionId: result.actionId,
      newStatus: result.newStatus,
    }
  } catch (err) {
    console.error('[governanceThreadService] Exception submitting action:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============================================
// Convenience Methods - Human Decision Actions
// ============================================

/**
 * Approve a thread (from Decisions surface)
 */
export async function approveThread(
  threadId: string,
  rationale: string,
  payload?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'HumanApproveDecision', 'Decisions', rationale, { payload })
}

/**
 * Block/reject a thread (from Decisions surface)
 */
export async function blockThread(
  threadId: string,
  rationale: string,
  payload?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'HumanBlockDecision', 'Decisions', rationale, { payload })
}

/**
 * Approve with conditions (from Decisions surface)
 */
export async function approveWithConditions(
  threadId: string,
  rationale: string,
  conditions: string[],
  payload?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'HumanApproveWithConditions', 'Decisions', rationale, { 
    payload: { ...payload, conditions } 
  })
}

/**
 * Request changes (from Decisions surface)
 */
export async function requestChanges(
  threadId: string,
  rationale: string,
  payload?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'HumanRequestChanges', 'Decisions', rationale, { payload })
}

/**
 * Escalate a thread
 */
export async function escalateThread(
  threadId: string,
  rationale: string,
  surface: Surface = 'Inbox',
  payload?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'HumanEscalate', surface, rationale, { payload })
}

// ============================================
// Convenience Methods - Triage Actions (Inbox)
// ============================================

/**
 * Set thread severity (from Inbox)
 */
export async function setSeverity(
  threadId: string,
  severity: ThreadSeverity,
  rationale?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'SetSeverity', 'Inbox', rationale || `Set severity to ${severity}`, { 
    payload: { severity } 
  })
}

/**
 * Assign thread owner (from Inbox)
 */
export async function assignOwner(
  threadId: string,
  ownerUserId: string,
  rationale?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'AssignOwner', 'Inbox', rationale || 'Assigned owner', { 
    payload: { owner_user_id: ownerUserId } 
  })
}

/**
 * Assign reviewers (from Inbox)
 */
export async function assignReviewers(
  threadId: string,
  reviewerUserIds: string[],
  rationale?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'AssignReviewers', 'Inbox', rationale || 'Assigned reviewers', { 
    payload: { reviewer_user_ids: reviewerUserIds } 
  })
}

/**
 * Request more information (from Inbox or Decisions)
 */
export async function requestInfo(
  threadId: string,
  questions: string[],
  surface: Surface = 'Inbox',
  payload?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'RequestMoreInfo', surface, `Requesting info: ${questions.join(', ')}`, { 
    payload: { ...payload, questions } 
  })
}

/**
 * Capture a regulatory-compliant signature (intent to sign).
 * Required for GxP/21 CFR Part 11.
 * MUST originate from the 'Decisions' surface context.
 */
export async function signDecision(input: {
  threadId: string;
  decision: string;
  rationale: string;
  signatureToken: string;
  actor: { user_id: string; role: Role };
  surfaceContext: Surface;
}): Promise<{ success: boolean; signatureId?: string; timestamp?: string; error?: string; code?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('governance-action', {
      body: {
        action: 'sign_signature', // Map to internal action type
        ...input
      }
    });

    if (error) {
      console.error('[governanceThreadService] Error signing decision:', error);
      return { success: false, error: error.message };
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data;
    return result;
  } catch (err) {
    console.error('[governanceThreadService] Exception signing decision:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Provide requested information
 */
export async function provideInfo(
  threadId: string,
  response: string,
  payload?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'ProvideInfo', 'Inbox', response, { payload })
}

/**
 * Add a comment to a thread (allowed from multiple surfaces)
 */
export async function addComment(
  threadId: string,
  comment: string,
  surface: Surface = 'Inbox'
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'comment', surface, comment)
}

/**
 * Archive a thread
 */
export async function archiveThread(
  threadId: string,
  rationale?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'ArchiveThread', 'Inbox', rationale || 'Archived')
}

/**
 * Reopen a thread
 */
export async function reopenThread(
  threadId: string,
  rationale: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'ReopenThread', 'Inbox', rationale)
}

/**
 * Cancel a thread
 */
export async function cancelThread(
  threadId: string,
  rationale: string,
  payload?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; code?: string }> {
  return submitAction(threadId, 'cancel', 'Inbox', rationale, { payload })
}

// Legacy aliases for backward compatibility
export const rejectThread = blockThread

// ============================================
// Thread Creation (typically called by agents/system)
// ============================================

/**
 * Create a new governance thread
 * Usually called from backend/agents, but available for admin use
 */
export async function createThread(input: {
  enterpriseId: string
  threadType: ThreadType
  subjectId: string
  subjectType: string
  title?: string
  description?: string
  priority?: ThreadPriority
  severity?: ThreadSeverity
  slaDueAt?: Date
  submissionId?: string
  metadata?: Record<string, unknown>
}): Promise<{ success: boolean; threadId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('create_governance_thread', {
      p_enterprise_id: input.enterpriseId,
      p_thread_type: input.threadType,
      p_subject_id: input.subjectId,
      p_subject_type: input.subjectType,
      p_title: input.title || null,
      p_description: input.description || null,
      p_priority: input.priority || 'normal',
      p_sla_due_at: input.slaDueAt?.toISOString() || null,
      p_submission_id: input.submissionId || null,
      p_actor_type: 'system',
      p_metadata: input.metadata || {},
    })

    if (error) {
      console.error('[governanceThreadService] Error creating thread:', error)
      return { success: false, error: error.message }
    }

    return { success: true, threadId: data }
  } catch (err) {
    console.error('[governanceThreadService] Exception creating thread:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============================================
// Statistics
// ============================================

/**
 * Get thread statistics for dashboard
 */
export async function getThreadStats(enterpriseId: string): Promise<{
  total: number
  open: number
  inReview: number
  pendingHuman: number
  needsInfo: number
  proposedResolution: number
  escalated: number
  approved: number
  blocked: number
  resolved: number
  cancelled: number
  archived: number
  byType: Record<ThreadType, number>
  byPriority: Record<ThreadPriority, number>
  bySeverity: Record<ThreadSeverity | 'unset', number>
}> {
  // Guard against missing or "undefined" enterpriseId
  if (!enterpriseId || enterpriseId === 'undefined') {
    return {
      total: 0,
      open: 0,
      inReview: 0,
      pendingHuman: 0,
      needsInfo: 0,
      proposedResolution: 0,
      escalated: 0,
      approved: 0,
      blocked: 0,
      resolved: 0,
      cancelled: 0,
      archived: 0,
      byType: { tool_request: 0, policy_change: 0, incident: 0, audit: 0 },
      byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0, unset: 0 }
    };
  }

  // Get all threads for aggregation
  const { data: threads, error: threadsError } = await supabase
    .from('governance_threads')
    .select('status, thread_type, priority, severity')
    .eq('enterprise_id', enterpriseId)

  if (threadsError) {
    throw new Error(`Failed to fetch threads for stats: ${threadsError.message}`)
  }

  const statusCounts: Record<string, number> = {
    open: 0,
    in_review: 0,
    pending_human: 0,
    needs_info: 0,
    proposed_resolution: 0,
    escalated: 0,
    approved: 0,
    approved_with_conditions: 0,
    blocked: 0,
    resolved: 0,
    cancelled: 0,
    archived: 0,
  }

  const typeCounts: Record<ThreadType, number> = {
    tool_request: 0,
    policy_change: 0,
    incident: 0,
    audit: 0,
  }

  const priorityCounts: Record<ThreadPriority, number> = {
    low: 0,
    normal: 0,
    high: 0,
    urgent: 0,
  }

  const severityCounts: Record<ThreadSeverity | 'unset', number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    unset: 0,
  }

  for (const thread of threads || []) {
    if (thread.status in statusCounts) {
      statusCounts[thread.status]++
    }
    if (thread.thread_type in typeCounts) {
      typeCounts[thread.thread_type as ThreadType]++
    }
    if (thread.priority in priorityCounts) {
      priorityCounts[thread.priority as ThreadPriority]++
    }
    if (thread.severity && thread.severity in severityCounts) {
      severityCounts[thread.severity as ThreadSeverity]++
    } else {
      severityCounts.unset++
    }
  }

  return {
    total: threads?.length || 0,
    open: statusCounts.open,
    inReview: statusCounts.in_review,
    pendingHuman: statusCounts.pending_human,
    needsInfo: statusCounts.needs_info,
    proposedResolution: statusCounts.proposed_resolution,
    escalated: statusCounts.escalated,
    approved: statusCounts.approved + statusCounts.approved_with_conditions,
    blocked: statusCounts.blocked,
    resolved: statusCounts.resolved,
    cancelled: statusCounts.cancelled,
    archived: statusCounts.archived,
    byType: typeCounts,
    byPriority: priorityCounts,
    bySeverity: severityCounts,
  }
}

// ============================================
// Audit Events
// ============================================

/**
 * Get audit events for a thread
 */
export async function getThreadAuditEvents(threadId: string): Promise<{
  id: string
  occurredAt: Date
  actionType: string
  actorType: ActorType
  actorId: string | null
  actorRole: Role | null
  surface: Surface | null
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  denied: boolean
  denialReason: string | null
}[]> {
  const { data, error } = await supabase
    .from('governance_audit_events')
    .select('*')
    .eq('thread_id', threadId)
    .order('occurred_at', { ascending: true })

  if (error) {
    console.error('[governanceThreadService] Error fetching audit events:', error)
    throw new Error(`Failed to fetch audit events: ${error.message}`)
  }

  return (data || []).map((event: Record<string, unknown>) => ({
    id: event.event_id as string,
    occurredAt: new Date(event.occurred_at as string),
    actionType: event.action_type as string,
    actorType: event.actor_type as ActorType,
    actorId: event.actor_id as string | null,
    actorRole: event.actor_role as Role | null,
    surface: event.surface as Surface | null,
    beforeState: event.before_state as Record<string, unknown> | null,
    afterState: event.after_state as Record<string, unknown> | null,
    denied: event.denied as boolean,
    denialReason: event.denial_reason as string | null,
  }))
}

/**
 * Get denied actions count (security audit)
 */
export async function getDeniedActionsCount(
  enterpriseId: string,
  options: { since?: Date } = {}
): Promise<number> {
  let query = supabase
    .from('governance_audit_events')
    .select('*', { count: 'exact', head: true })
    .eq('enterprise_id', enterpriseId)
    .eq('denied', true)

  if (options.since) {
    query = query.gte('occurred_at', options.since.toISOString())
  }

  const { count, error } = await query

  if (error) {
    console.error('[governanceThreadService] Error fetching denied actions count:', error)
    return 0
  }

  return count || 0
}
