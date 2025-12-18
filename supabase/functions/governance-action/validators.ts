/**
 * Action Catalog Validators
 * 
 * Implements the validation matrix for the Agentic Action Catalog:
 * - Surface guardrails (which surfaces can invoke which actions)
 * - Role guards (which roles can perform which actions)
 * - State guards (which thread states allow which actions)
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Surface = 
  | 'Inbox' 
  | 'Weave' 
  | 'Decisions' 
  | 'Configuration' 
  | 'Workbench' 
  | 'Middleware' 
  | 'Test'

export type Role = 
  | 'partner' 
  | 'operator' 
  | 'reviewer' 
  | 'admin' 
  | 'agent' 
  | 'system'

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
  // Legacy actions
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

export interface ActionEnvelope {
  idempotency_key: string
  action_type: ActionType
  thread_id: string
  actor: {
    type: 'human' | 'agent' | 'system'
    user_id?: string
    role: Role
  }
  context: {
    surface: Surface
    mode?: string
    client: string
  }
  payload: Record<string, unknown>
  rationale?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
  code?: 'SURFACE_VIOLATION' | 'ROLE_VIOLATION' | 'STATE_VIOLATION' | 'MISSING_RATIONALE' | 'INVALID_PAYLOAD'
}

// ============================================
// VALIDATION MATRICES
// ============================================

/**
 * Surface Guards: Which surfaces can invoke which actions
 * Key = ActionType, Value = Array of allowed surfaces
 * CRITICAL: Final decision actions ONLY allowed from 'Decisions' surface
 */
export const SURFACE_GUARDS: Partial<Record<ActionType, Surface[]>> = {
  // Thread Intake & Triage - mostly Inbox
  'CreateThread': ['Inbox', 'Middleware', 'Test'],
  'SetSeverity': ['Inbox', 'Decisions'],
  'AssignOwner': ['Inbox', 'Decisions'],
  'AssignReviewers': ['Inbox', 'Decisions'],
  'UpdateThreadStatus': ['Inbox', 'Decisions', 'Workbench'],
  'ArchiveThread': ['Inbox', 'Decisions'],
  'ReopenThread': ['Inbox', 'Decisions'],
  
  // Information Requests - can come from multiple surfaces
  'RequestMoreInfo': ['Inbox', 'Decisions', 'Weave'],
  'ProvideInfo': ['Inbox', 'Weave', 'Workbench'],
  
  // Human Decision Actions - ONLY from Decisions surface (critical guardrail)
  'HumanApproveDecision': ['Decisions'],
  'HumanBlockDecision': ['Decisions'],
  'HumanApproveWithConditions': ['Decisions'],
  'HumanRequestChanges': ['Decisions'],
  'HumanEscalate': ['Decisions', 'Inbox'],
  
  // Agent Actions - typically from Middleware or Workbench
  'AgentEvaluate': ['Middleware', 'Workbench', 'Test'],
  'AgentRecommend': ['Middleware', 'Workbench'],
  'AgentAutoApprove': ['Middleware'],
  'AgentAutoBlock': ['Middleware'],
  'AgentCreateProposal': ['Middleware', 'Workbench'],
  'AgentRunSimulation': ['Workbench', 'Test'],
  
  // Legacy actions - allow from multiple surfaces for backward compatibility
  'submit': ['Inbox', 'Middleware', 'Test'],
  'evaluate': ['Middleware', 'Workbench'],
  'approve': ['Decisions', 'Inbox'], // Allow Inbox for backward compat, but recommend Decisions
  'reject': ['Decisions', 'Inbox'],
  'escalate': ['Inbox', 'Decisions', 'Middleware'],
  'request_info': ['Inbox', 'Decisions', 'Weave'],
  'provide_info': ['Inbox', 'Weave'],
  'comment': ['Inbox', 'Decisions', 'Weave', 'Workbench'],
  'reassign': ['Inbox', 'Decisions'],
  'cancel': ['Inbox', 'Decisions'],
  'auto_clear': ['Middleware'],
  'draft_decision': ['Middleware', 'Workbench'],
}

/**
 * Role Guards: Which roles can perform which actions
 */
export const ROLE_GUARDS: Partial<Record<ActionType, Role[]>> = {
  // Thread Intake & Triage
  'CreateThread': ['partner', 'operator', 'admin', 'agent', 'system'],
  'SetSeverity': ['reviewer', 'admin', 'agent', 'system'],
  'AssignOwner': ['reviewer', 'admin'],
  'AssignReviewers': ['reviewer', 'admin'],
  'UpdateThreadStatus': ['reviewer', 'admin', 'agent', 'system'],
  'ArchiveThread': ['reviewer', 'admin'],
  'ReopenThread': ['reviewer', 'admin'],
  
  // Information Requests
  'RequestMoreInfo': ['reviewer', 'operator', 'admin', 'agent', 'system'],
  'ProvideInfo': ['partner', 'operator', 'reviewer', 'admin'],
  
  // Human Decision Actions - humans only
  'HumanApproveDecision': ['reviewer', 'admin'],
  'HumanBlockDecision': ['reviewer', 'admin'],
  'HumanApproveWithConditions': ['reviewer', 'admin'],
  'HumanRequestChanges': ['reviewer', 'admin'],
  'HumanEscalate': ['reviewer', 'operator', 'admin'],
  
  // Agent Actions - agents and system only
  'AgentEvaluate': ['agent', 'system'],
  'AgentRecommend': ['agent', 'system'],
  'AgentAutoApprove': ['agent', 'system'],
  'AgentAutoBlock': ['agent', 'system'],
  'AgentCreateProposal': ['agent', 'system'],
  'AgentRunSimulation': ['agent', 'system', 'admin'],
  
  // Legacy actions - permissive for backward compat
  'submit': ['partner', 'operator', 'admin', 'agent', 'system'],
  'evaluate': ['agent', 'system', 'reviewer', 'admin'],
  'approve': ['reviewer', 'admin', 'agent', 'system'],
  'reject': ['reviewer', 'admin', 'agent', 'system'],
  'escalate': ['operator', 'reviewer', 'admin', 'agent', 'system'],
  'request_info': ['reviewer', 'operator', 'admin', 'agent', 'system'],
  'provide_info': ['partner', 'operator', 'reviewer', 'admin'],
  'comment': ['partner', 'operator', 'reviewer', 'admin', 'agent', 'system'],
  'reassign': ['reviewer', 'admin'],
  'cancel': ['operator', 'reviewer', 'admin'],
  'auto_clear': ['agent', 'system'],
  'draft_decision': ['agent', 'system'],
}

/**
 * State Guards: Which thread states allow which actions
 * Key = ActionType, Value = Array of allowed thread states
 */
export const STATE_GUARDS: Partial<Record<ActionType, ThreadStatus[]>> = {
  // Thread Intake & Triage
  'CreateThread': [], // No thread exists yet
  'SetSeverity': ['open', 'in_review', 'pending_human', 'needs_info', 'proposed_resolution', 'escalated'],
  'AssignOwner': ['open', 'in_review', 'pending_human', 'needs_info', 'proposed_resolution', 'escalated'],
  'AssignReviewers': ['open', 'in_review', 'pending_human', 'needs_info', 'proposed_resolution', 'escalated'],
  'UpdateThreadStatus': ['open', 'in_review', 'pending_human', 'needs_info', 'proposed_resolution', 'escalated'],
  'ArchiveThread': ['resolved', 'cancelled', 'approved', 'blocked'],
  'ReopenThread': ['resolved', 'archived', 'cancelled', 'approved', 'blocked'],
  
  // Information Requests
  'RequestMoreInfo': ['open', 'in_review', 'pending_human', 'proposed_resolution'],
  'ProvideInfo': ['needs_info', 'pending_human'],
  
  // Human Decision Actions - only on pending/proposed states
  'HumanApproveDecision': ['in_review', 'pending_human', 'proposed_resolution', 'escalated'],
  'HumanBlockDecision': ['in_review', 'pending_human', 'proposed_resolution', 'escalated'],
  'HumanApproveWithConditions': ['in_review', 'pending_human', 'proposed_resolution', 'escalated'],
  'HumanRequestChanges': ['in_review', 'pending_human', 'proposed_resolution'],
  'HumanEscalate': ['open', 'in_review', 'pending_human', 'proposed_resolution'],
  
  // Agent Actions
  'AgentEvaluate': ['open', 'in_review', 'pending_human'],
  'AgentRecommend': ['open', 'in_review'],
  'AgentAutoApprove': ['open', 'in_review'],
  'AgentAutoBlock': ['open', 'in_review'],
  'AgentCreateProposal': ['open', 'in_review', 'pending_human'],
  'AgentRunSimulation': ['open', 'in_review', 'pending_human', 'proposed_resolution'],
  
  // Legacy actions - permissive for backward compat
  'submit': [], // Creates thread
  'evaluate': ['open', 'in_review', 'pending_human'],
  'approve': ['open', 'in_review', 'pending_human', 'proposed_resolution', 'escalated'],
  'reject': ['open', 'in_review', 'pending_human', 'proposed_resolution', 'escalated'],
  'escalate': ['open', 'in_review', 'pending_human'],
  'request_info': ['open', 'in_review', 'pending_human', 'proposed_resolution'],
  'provide_info': ['needs_info', 'pending_human'],
  'comment': ['open', 'in_review', 'pending_human', 'needs_info', 'proposed_resolution', 'escalated', 'resolved', 'approved', 'blocked'],
  'reassign': ['open', 'in_review', 'pending_human', 'needs_info', 'proposed_resolution', 'escalated'],
  'cancel': ['open', 'in_review', 'pending_human', 'needs_info', 'proposed_resolution', 'escalated'],
  'auto_clear': ['open', 'in_review'],
  'draft_decision': ['open', 'in_review', 'pending_human'],
}

/**
 * Actions that require rationale (human accountability)
 */
export const RATIONALE_REQUIRED: ActionType[] = [
  'HumanApproveDecision',
  'HumanBlockDecision',
  'HumanApproveWithConditions',
  'HumanRequestChanges',
  'HumanEscalate',
  'approve',
  'reject',
  'escalate',
  'cancel',
]

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate surface guardrail
 */
export function validateSurface(actionType: ActionType, surface: Surface): ValidationResult {
  const allowedSurfaces = SURFACE_GUARDS[actionType]
  
  // If no guard defined, allow all surfaces (backward compat)
  if (!allowedSurfaces) {
    return { valid: true }
  }
  
  if (!allowedSurfaces.includes(surface)) {
    return {
      valid: false,
      code: 'SURFACE_VIOLATION',
      error: `Action '${actionType}' is not allowed from surface '${surface}'. Allowed surfaces: ${allowedSurfaces.join(', ')}`
    }
  }
  
  return { valid: true }
}

/**
 * Validate role permission
 */
export function validateRole(actionType: ActionType, role: Role): ValidationResult {
  const allowedRoles = ROLE_GUARDS[actionType]
  
  // If no guard defined, allow all roles (backward compat)
  if (!allowedRoles) {
    return { valid: true }
  }
  
  if (!allowedRoles.includes(role)) {
    return {
      valid: false,
      code: 'ROLE_VIOLATION',
      error: `Role '${role}' is not allowed to perform action '${actionType}'. Allowed roles: ${allowedRoles.join(', ')}`
    }
  }
  
  return { valid: true }
}

/**
 * Validate thread state
 */
export function validateState(actionType: ActionType, currentStatus: ThreadStatus | null): ValidationResult {
  const allowedStates = STATE_GUARDS[actionType]
  
  // If no guard defined, allow all states (backward compat)
  if (!allowedStates) {
    return { valid: true }
  }
  
  // Empty array means action doesn't require existing thread (e.g., CreateThread)
  if (allowedStates.length === 0) {
    return { valid: true }
  }
  
  // Thread must exist for actions with state guards
  if (!currentStatus) {
    return {
      valid: false,
      code: 'STATE_VIOLATION',
      error: `Action '${actionType}' requires an existing thread`
    }
  }
  
  if (!allowedStates.includes(currentStatus)) {
    return {
      valid: false,
      code: 'STATE_VIOLATION',
      error: `Action '${actionType}' is not allowed when thread status is '${currentStatus}'. Allowed states: ${allowedStates.join(', ')}`
    }
  }
  
  return { valid: true }
}

/**
 * Validate rationale requirement
 */
export function validateRationale(actionType: ActionType, rationale: string | undefined): ValidationResult {
  if (RATIONALE_REQUIRED.includes(actionType) && (!rationale || rationale.trim() === '')) {
    return {
      valid: false,
      code: 'MISSING_RATIONALE',
      error: `Action '${actionType}' requires a rationale`
    }
  }
  
  return { valid: true }
}

/**
 * Validate full action envelope
 */
export function validateActionEnvelope(
  envelope: ActionEnvelope,
  currentStatus: ThreadStatus | null
): ValidationResult {
  // 1. Validate surface guardrail
  const surfaceResult = validateSurface(envelope.action_type, envelope.context.surface)
  if (!surfaceResult.valid) return surfaceResult
  
  // 2. Validate role permission
  const roleResult = validateRole(envelope.action_type, envelope.actor.role)
  if (!roleResult.valid) return roleResult
  
  // 3. Validate thread state
  const stateResult = validateState(envelope.action_type, currentStatus)
  if (!stateResult.valid) return stateResult
  
  // 4. Validate rationale requirement
  const rationaleResult = validateRationale(envelope.action_type, envelope.rationale)
  if (!rationaleResult.valid) return rationaleResult
  
  return { valid: true }
}

/**
 * Check if action is a final decision (surface guardrail critical path)
 */
export function isFinalDecisionAction(actionType: ActionType): boolean {
  const finalDecisionActions: ActionType[] = [
    'HumanApproveDecision',
    'HumanBlockDecision',
    'HumanApproveWithConditions',
    'approve',
    'reject',
  ]
  return finalDecisionActions.includes(actionType)
}

/**
 * Get the new status that an action would result in
 */
export function getResultingStatus(actionType: ActionType): ThreadStatus | null {
  const statusMap: Partial<Record<ActionType, ThreadStatus>> = {
    'HumanApproveDecision': 'approved',
    'HumanBlockDecision': 'blocked',
    'HumanApproveWithConditions': 'approved_with_conditions',
    'HumanRequestChanges': 'needs_info',
    'HumanEscalate': 'escalated',
    'AgentAutoApprove': 'approved',
    'AgentAutoBlock': 'blocked',
    'AgentCreateProposal': 'proposed_resolution',
    'RequestMoreInfo': 'needs_info',
    'ArchiveThread': 'archived',
    'ReopenThread': 'in_review',
    'approve': 'resolved',
    'reject': 'resolved',
    'cancel': 'cancelled',
    'escalate': 'escalated',
    'request_info': 'needs_info',
  }
  
  return statusMap[actionType] || null
}

