-- ============================================
-- ACTION CATALOG ALIGNMENT MIGRATION
-- ============================================
-- Extends governance schema to align with the Agentic Action Catalog specification
-- Adds: full state machine, surface guardrails, role validation, action envelope

-- ============================================
-- 1. EXTEND GOVERNANCE THREADS
-- ============================================

-- Add ownership and assignment columns
ALTER TABLE public.governance_threads
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_user_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS severity TEXT;

-- Add severity check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'governance_threads_severity_check'
  ) THEN
    ALTER TABLE public.governance_threads
      ADD CONSTRAINT governance_threads_severity_check 
        CHECK (severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;

-- Update status constraint for full Action Catalog state machine
-- First, drop the existing constraint
ALTER TABLE public.governance_threads 
  DROP CONSTRAINT IF EXISTS governance_threads_status_check;

-- Add the new comprehensive status constraint
ALTER TABLE public.governance_threads 
  ADD CONSTRAINT governance_threads_status_check 
    CHECK (status IN (
      -- Original states (mapped to new)
      'open',                    -- Initial state
      'pending_human',           -- Awaiting human input (legacy)
      'resolved',                -- Successfully closed
      'cancelled',               -- Cancelled/abandoned
      -- New Action Catalog states
      'in_review',               -- Under active review
      'needs_info',              -- Blocked on information request
      'proposed_resolution',     -- Agent proposed, awaiting approval
      'escalated',               -- Escalated to higher authority
      'approved',                -- Approved (may need fulfillment)
      'approved_with_conditions', -- Approved with conditions
      'blocked',                 -- Blocked/rejected
      'archived'                 -- Archived (read-only)
    ));

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_governance_threads_owner ON public.governance_threads(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_governance_threads_severity ON public.governance_threads(severity) WHERE severity IS NOT NULL;

-- ============================================
-- 2. EXTEND GOVERNANCE ACTIONS FOR FULL ENVELOPE
-- ============================================

-- Add action envelope columns
ALTER TABLE public.governance_actions
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS actor_role TEXT,
  ADD COLUMN IF NOT EXISTS surface TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT,
  ADD COLUMN IF NOT EXISTS client TEXT DEFAULT 'web';

-- Add unique constraint on idempotency_key (for deduplication)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'governance_actions_idempotency_key_key'
  ) THEN
    ALTER TABLE public.governance_actions
      ADD CONSTRAINT governance_actions_idempotency_key_key UNIQUE (idempotency_key);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add surface check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'governance_actions_surface_check'
  ) THEN
    ALTER TABLE public.governance_actions
      ADD CONSTRAINT governance_actions_surface_check 
        CHECK (surface IS NULL OR surface IN (
          'Inbox', 'Weave', 'Decisions', 'Configuration', 
          'Workbench', 'Middleware', 'Test'
        ));
  END IF;
END $$;

-- Update action_type constraint for full Action Catalog
ALTER TABLE public.governance_actions 
  DROP CONSTRAINT IF EXISTS governance_actions_action_type_check;

ALTER TABLE public.governance_actions 
  ADD CONSTRAINT governance_actions_action_type_check 
    CHECK (action_type IN (
      -- ===== Thread Intake & Triage =====
      'CreateThread',          -- Create a new governance thread
      'SetSeverity',           -- Set/update thread severity
      'AssignOwner',           -- Assign thread owner
      'AssignReviewers',       -- Assign reviewer(s)
      'UpdateThreadStatus',    -- Generic status update
      'ArchiveThread',         -- Archive a thread
      'ReopenThread',          -- Reopen archived/resolved thread
      
      -- ===== Information Requests (HITL loop) =====
      'RequestMoreInfo',       -- Request additional information
      'ProvideInfo',           -- Provide requested information
      
      -- ===== Human Decision Actions =====
      'HumanApproveDecision',        -- Human approves
      'HumanBlockDecision',          -- Human blocks/rejects
      'HumanApproveWithConditions',  -- Human approves with conditions
      'HumanRequestChanges',         -- Human requests changes
      'HumanEscalate',               -- Human escalates
      
      -- ===== Agent Actions =====
      'AgentEvaluate',         -- Agent evaluates submission
      'AgentRecommend',        -- Agent makes recommendation
      'AgentAutoApprove',      -- Agent auto-approves (policy-based)
      'AgentAutoBlock',        -- Agent auto-blocks (policy-based)
      'AgentCreateProposal',   -- Agent creates resolution proposal
      'AgentRunSimulation',    -- Agent runs simulation
      
      -- ===== Legacy actions (backward compatibility) =====
      'submit',
      'evaluate',
      'approve',
      'reject',
      'escalate',
      'request_info',
      'provide_info',
      'comment',
      'reassign',
      'cancel',
      'auto_clear',
      'draft_decision'
    ));

-- Indexes for envelope fields
CREATE INDEX IF NOT EXISTS idx_governance_actions_idempotency ON public.governance_actions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_governance_actions_surface ON public.governance_actions(surface) WHERE surface IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_governance_actions_actor_role ON public.governance_actions(actor_role) WHERE actor_role IS NOT NULL;

-- ============================================
-- 3. CREATE GOVERNANCE AUDIT EVENTS TABLE
-- ============================================
-- Separate table for full audit event contract per Action Catalog spec

CREATE TABLE IF NOT EXISTS public.governance_audit_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Thread and action references
  thread_id UUID REFERENCES public.governance_threads(id) ON DELETE SET NULL,
  action_id UUID REFERENCES public.governance_actions(id) ON DELETE SET NULL,
  
  -- Action classification
  action_type TEXT NOT NULL,
  
  -- Actor attribution (full envelope)
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
  actor_id UUID,
  actor_role TEXT,
  
  -- Context (surface guardrails)
  surface TEXT CHECK (surface IS NULL OR surface IN (
    'Inbox', 'Weave', 'Decisions', 'Configuration', 
    'Workbench', 'Middleware', 'Test'
  )),
  mode TEXT,
  client TEXT DEFAULT 'web',
  
  -- State capture
  before_state JSONB,
  after_state JSONB,
  
  -- Artifact references (for compliance linking)
  artifact_refs UUID[] DEFAULT '{}',
  rationale_ref UUID,
  
  -- Enterprise context
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  -- Error tracking for denied actions
  denied BOOLEAN DEFAULT false,
  denial_reason TEXT
);

-- Indexes for governance_audit_events
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_thread ON public.governance_audit_events(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_occurred ON public.governance_audit_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_action_type ON public.governance_audit_events(action_type);
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_actor ON public.governance_audit_events(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_surface ON public.governance_audit_events(surface) WHERE surface IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_denied ON public.governance_audit_events(denied) WHERE denied = true;
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_enterprise ON public.governance_audit_events(enterprise_id);

-- ============================================
-- 4. UPDATE SYNC TRIGGER FOR NEW FIELDS
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_governance_action_to_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_enterprise_id UUID;
  v_user_id UUID;
BEGIN
  -- Get enterprise_id from the thread
  SELECT enterprise_id INTO v_enterprise_id
  FROM public.governance_threads
  WHERE id = NEW.thread_id;
  
  -- Use actor_id if human, otherwise null
  v_user_id := CASE WHEN NEW.actor_type = 'human' THEN NEW.actor_id ELSE NULL END;
  
  -- Insert into legacy audit_events (backward compatibility)
  INSERT INTO public.audit_events (
    event_type,
    entity_type,
    entity_id,
    user_id,
    enterprise_id,
    details,
    before_state,
    after_state,
    actor_type,
    agent_name,
    thread_id,
    created_at
  ) VALUES (
    'governance_action.' || NEW.action_type,
    'governance_thread',
    NEW.thread_id,
    v_user_id,
    v_enterprise_id,
    jsonb_build_object(
      'action_id', NEW.id,
      'action_type', NEW.action_type,
      'actor_type', NEW.actor_type,
      'actor_role', NEW.actor_role,
      'agent_name', NEW.agent_name,
      'rationale', NEW.rationale,
      'surface', NEW.surface,
      'mode', NEW.mode,
      'client', NEW.client,
      'metadata', NEW.metadata
    ),
    NEW.before_state,
    NEW.after_state,
    NEW.actor_type,
    NEW.agent_name,
    NEW.thread_id,
    NEW.created_at
  );
  
  -- Insert into new governance_audit_events table
  INSERT INTO public.governance_audit_events (
    occurred_at,
    thread_id,
    action_id,
    action_type,
    actor_type,
    actor_id,
    actor_role,
    surface,
    mode,
    client,
    before_state,
    after_state,
    enterprise_id,
    metadata,
    denied,
    denial_reason
  ) VALUES (
    NEW.created_at,
    NEW.thread_id,
    NEW.id,
    NEW.action_type,
    NEW.actor_type,
    NEW.actor_id,
    NEW.actor_role,
    NEW.surface,
    NEW.mode,
    NEW.client,
    NEW.before_state,
    NEW.after_state,
    v_enterprise_id,
    NEW.metadata,
    false,
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. HELPER FUNCTION: Record Denied Action
-- ============================================
-- For tracking failed actions (surface/role/state violations)

CREATE OR REPLACE FUNCTION public.record_denied_action(
  p_thread_id UUID,
  p_action_type TEXT,
  p_actor_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_surface TEXT DEFAULT NULL,
  p_mode TEXT DEFAULT NULL,
  p_denial_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_enterprise_id UUID;
BEGIN
  -- Get enterprise_id from thread if exists
  IF p_thread_id IS NOT NULL THEN
    SELECT enterprise_id INTO v_enterprise_id
    FROM public.governance_threads
    WHERE id = p_thread_id;
  END IF;
  
  -- Record the denied action in audit events
  INSERT INTO public.governance_audit_events (
    thread_id,
    action_type,
    actor_type,
    actor_id,
    actor_role,
    surface,
    mode,
    enterprise_id,
    metadata,
    denied,
    denial_reason
  ) VALUES (
    p_thread_id,
    p_action_type,
    p_actor_type,
    p_actor_id,
    p_actor_role,
    p_surface,
    p_mode,
    v_enterprise_id,
    p_metadata,
    true,
    p_denial_reason
  )
  RETURNING event_id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ENHANCED RECORD_GOVERNANCE_ACTION
-- ============================================
-- Update to support full action envelope

CREATE OR REPLACE FUNCTION public.record_governance_action(
  p_thread_id UUID,
  p_action_type TEXT,
  p_actor_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_agent_name TEXT DEFAULT NULL,
  p_rationale TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  -- New envelope fields
  p_idempotency_key UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_surface TEXT DEFAULT NULL,
  p_mode TEXT DEFAULT NULL,
  p_client TEXT DEFAULT 'web'
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
  v_before_state JSONB;
  v_after_state JSONB;
  v_current_status TEXT;
  v_existing_action UUID;
BEGIN
  -- Check idempotency (if key provided)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_action
    FROM public.governance_actions
    WHERE idempotency_key = p_idempotency_key;
    
    IF v_existing_action IS NOT NULL THEN
      -- Already processed, return existing action ID
      RETURN v_existing_action;
    END IF;
  END IF;

  -- Get current thread state
  SELECT 
    jsonb_build_object(
      'status', status,
      'priority', priority,
      'severity', severity,
      'current_step', current_step,
      'owner_user_id', owner_user_id,
      'proof_bundle_id', proof_bundle_id
    ),
    status
  INTO v_before_state, v_current_status
  FROM public.governance_threads
  WHERE id = p_thread_id;
  
  IF v_before_state IS NULL THEN
    RAISE EXCEPTION 'Thread not found: %', p_thread_id;
  END IF;
  
  -- Determine new status if not provided
  IF p_new_status IS NULL THEN
    p_new_status := CASE p_action_type
      -- Human decision actions
      WHEN 'HumanApproveDecision' THEN 'approved'
      WHEN 'HumanBlockDecision' THEN 'blocked'
      WHEN 'HumanApproveWithConditions' THEN 'approved_with_conditions'
      WHEN 'HumanRequestChanges' THEN 'needs_info'
      WHEN 'HumanEscalate' THEN 'escalated'
      -- Agent actions
      WHEN 'AgentAutoApprove' THEN 'approved'
      WHEN 'AgentAutoBlock' THEN 'blocked'
      WHEN 'AgentCreateProposal' THEN 'proposed_resolution'
      -- Legacy actions
      WHEN 'approve' THEN 'resolved'
      WHEN 'reject' THEN 'resolved'
      WHEN 'cancel' THEN 'cancelled'
      WHEN 'escalate' THEN 'pending_human'
      WHEN 'request_info' THEN 'needs_info'
      WHEN 'RequestMoreInfo' THEN 'needs_info'
      WHEN 'ArchiveThread' THEN 'archived'
      WHEN 'ReopenThread' THEN 'in_review'
      ELSE v_current_status
    END;
  END IF;
  
  -- Update thread if status changes
  IF p_new_status != v_current_status THEN
    UPDATE public.governance_threads
    SET 
      status = p_new_status,
      resolved_at = CASE WHEN p_new_status IN ('resolved', 'approved', 'blocked', 'cancelled') THEN now() ELSE NULL END,
      resolved_by = CASE WHEN p_new_status IN ('resolved', 'approved', 'blocked', 'cancelled') AND p_actor_type = 'human' THEN p_actor_id ELSE NULL END
    WHERE id = p_thread_id;
  END IF;
  
  -- Build after state
  v_after_state := jsonb_build_object(
    'status', p_new_status,
    'priority', (v_before_state->>'priority'),
    'severity', (v_before_state->>'severity'),
    'current_step', (v_before_state->>'current_step'),
    'owner_user_id', (v_before_state->>'owner_user_id'),
    'proof_bundle_id', (v_before_state->>'proof_bundle_id')
  );
  
  -- Create the action record with full envelope
  INSERT INTO public.governance_actions (
    thread_id,
    action_type,
    actor_type,
    actor_id,
    agent_name,
    rationale,
    before_state,
    after_state,
    metadata,
    idempotency_key,
    actor_role,
    surface,
    mode,
    client
  ) VALUES (
    p_thread_id,
    p_action_type,
    p_actor_type,
    p_actor_id,
    p_agent_name,
    p_rationale,
    v_before_state,
    v_after_state,
    p_metadata,
    p_idempotency_key,
    p_actor_role,
    p_surface,
    p_mode,
    p_client
  )
  RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. RLS POLICIES (Disabled for development)
-- ============================================

ALTER TABLE public.governance_audit_events DISABLE ROW LEVEL SECURITY;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.governance_audit_events IS 
  'Full Action Catalog compliant audit events table. Tracks all governance actions with complete envelope (surface, role, state) and denied action tracking.';

COMMENT ON FUNCTION public.record_denied_action IS 
  'Records a denied action (surface/role/state violation) for security audit trail.';

COMMENT ON COLUMN public.governance_actions.idempotency_key IS
  'UUID for request deduplication. Same key = same request, returns existing action.';

COMMENT ON COLUMN public.governance_actions.surface IS
  'UI surface where action originated: Inbox, Weave, Decisions, Configuration, Workbench, Middleware, Test';

COMMENT ON COLUMN public.governance_actions.actor_role IS
  'Role of the actor: partner, operator, reviewer, admin, agent, system';

