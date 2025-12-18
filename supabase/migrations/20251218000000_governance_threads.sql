-- ============================================
-- GOVERNANCE THREADS & ACTIONS
-- ============================================
-- PRD-aligned schema for unified governance workflow
-- Supports both Agentic Orchestrator and Prosumer Control Plane modes

-- governance_threads: Links submissions through decision lifecycle
CREATE TABLE IF NOT EXISTS public.governance_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  -- Thread classification
  thread_type TEXT NOT NULL CHECK (thread_type IN ('tool_request', 'policy_change', 'incident', 'audit')),
  subject_id UUID NOT NULL, -- submission_id, policy_id, incident_id, etc.
  subject_type TEXT NOT NULL, -- 'submission', 'policy', 'incident', etc.
  
  -- Workflow state
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending_human', 'resolved', 'cancelled')),
  current_step TEXT, -- Current node in the flow (if using flow engine)
  
  -- Links to related entities
  flow_run_id UUID REFERENCES public.flow_runs(id) ON DELETE SET NULL,
  proof_bundle_id UUID REFERENCES public.proof_bundles(bundle_id) ON DELETE SET NULL,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  
  -- Priority and SLA
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  sla_due_at TIMESTAMPTZ,
  
  -- Metadata
  title TEXT, -- Human-readable title
  description TEXT, -- Brief description
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT valid_subject CHECK (subject_id IS NOT NULL AND subject_type IS NOT NULL)
);

-- Indexes for governance_threads
CREATE INDEX IF NOT EXISTS idx_governance_threads_enterprise_id ON public.governance_threads(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_governance_threads_status ON public.governance_threads(status);
CREATE INDEX IF NOT EXISTS idx_governance_threads_subject ON public.governance_threads(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_governance_threads_created_at ON public.governance_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_governance_threads_priority_status ON public.governance_threads(priority, status) WHERE status IN ('open', 'pending_human');

-- governance_actions: Immutable log of all actions on a thread
CREATE TABLE IF NOT EXISTS public.governance_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.governance_threads(id) ON DELETE CASCADE,
  
  -- Action classification
  action_type TEXT NOT NULL CHECK (action_type IN (
    'submit',           -- Initial submission
    'evaluate',         -- Agent evaluation
    'approve',          -- Human/agent approval
    'reject',           -- Human/agent rejection
    'escalate',         -- Escalation to human review
    'request_info',     -- Request additional information
    'provide_info',     -- Response to info request
    'comment',          -- General comment/note
    'reassign',         -- Reassign to different reviewer
    'cancel',           -- Cancel the thread
    'auto_clear',       -- Auto-cleared by policy
    'draft_decision'    -- Shadow mode draft decision
  )),
  
  -- Actor attribution (PRD requirement: 100% actor attribution)
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- user_id for human actors
  agent_name TEXT, -- e.g. 'ago-orchestrator', 'audit-agent' for agent actions
  
  -- Decision rationale (PRD requirement: human accountability)
  rationale TEXT, -- Required for human decisions, recommended for agents
  
  -- State capture (PRD requirement: before/after state)
  before_state JSONB, -- Thread state snapshot before action
  after_state JSONB,  -- Thread state snapshot after action
  
  -- Additional context
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps (immutable - no updated_at)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for governance_actions
CREATE INDEX IF NOT EXISTS idx_governance_actions_thread_id ON public.governance_actions(thread_id);
CREATE INDEX IF NOT EXISTS idx_governance_actions_action_type ON public.governance_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_governance_actions_actor ON public.governance_actions(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_governance_actions_created_at ON public.governance_actions(created_at DESC);

-- Enhance audit_events with before/after state and thread context
ALTER TABLE public.audit_events 
  ADD COLUMN IF NOT EXISTS before_state JSONB,
  ADD COLUMN IF NOT EXISTS after_state JSONB,
  ADD COLUMN IF NOT EXISTS actor_type TEXT CHECK (actor_type IS NULL OR actor_type IN ('human', 'agent', 'system')),
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.governance_threads(id) ON DELETE SET NULL;

-- Index for audit_events thread lookup
CREATE INDEX IF NOT EXISTS idx_audit_events_thread_id ON public.audit_events(thread_id) WHERE thread_id IS NOT NULL;

-- ============================================
-- TRIGGER: Auto-copy governance_actions to audit_events
-- ============================================
-- Ensures 100% of state-changing actions generate audit records

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
  
  -- Insert into audit_events
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
      'agent_name', NEW.agent_name,
      'rationale', NEW.rationale,
      'metadata', NEW.metadata
    ),
    NEW.before_state,
    NEW.after_state,
    NEW.actor_type,
    NEW.agent_name,
    NEW.thread_id,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trg_governance_action_audit ON public.governance_actions;
CREATE TRIGGER trg_governance_action_audit
  AFTER INSERT ON public.governance_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_governance_action_to_audit();

-- ============================================
-- TRIGGER: Auto-update governance_thread.updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_governance_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_governance_thread_updated ON public.governance_threads;
CREATE TRIGGER trg_governance_thread_updated
  BEFORE UPDATE ON public.governance_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_governance_thread_timestamp();

-- ============================================
-- HELPER FUNCTION: Create thread with initial action
-- ============================================

CREATE OR REPLACE FUNCTION public.create_governance_thread(
  p_enterprise_id UUID,
  p_thread_type TEXT,
  p_subject_id UUID,
  p_subject_type TEXT,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_sla_due_at TIMESTAMPTZ DEFAULT NULL,
  p_submission_id UUID DEFAULT NULL,
  p_actor_type TEXT DEFAULT 'system',
  p_actor_id UUID DEFAULT NULL,
  p_agent_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  -- Create the thread
  INSERT INTO public.governance_threads (
    enterprise_id,
    thread_type,
    subject_id,
    subject_type,
    title,
    description,
    priority,
    sla_due_at,
    submission_id,
    metadata
  ) VALUES (
    p_enterprise_id,
    p_thread_type,
    p_subject_id,
    p_subject_type,
    p_title,
    p_description,
    p_priority,
    p_sla_due_at,
    p_submission_id,
    p_metadata
  )
  RETURNING id INTO v_thread_id;
  
  -- Create initial 'submit' action
  INSERT INTO public.governance_actions (
    thread_id,
    action_type,
    actor_type,
    actor_id,
    agent_name,
    rationale,
    after_state,
    metadata
  ) VALUES (
    v_thread_id,
    'submit',
    p_actor_type,
    p_actor_id,
    p_agent_name,
    'Thread created',
    jsonb_build_object('status', 'open', 'priority', p_priority),
    p_metadata
  );
  
  RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Record action and update thread
-- ============================================

CREATE OR REPLACE FUNCTION public.record_governance_action(
  p_thread_id UUID,
  p_action_type TEXT,
  p_actor_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_agent_name TEXT DEFAULT NULL,
  p_rationale TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
  v_before_state JSONB;
  v_after_state JSONB;
  v_current_status TEXT;
BEGIN
  -- Get current thread state
  SELECT 
    jsonb_build_object(
      'status', status,
      'priority', priority,
      'current_step', current_step,
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
      WHEN 'approve' THEN 'resolved'
      WHEN 'reject' THEN 'resolved'
      WHEN 'cancel' THEN 'cancelled'
      WHEN 'escalate' THEN 'pending_human'
      WHEN 'request_info' THEN 'pending_human'
      ELSE v_current_status
    END;
  END IF;
  
  -- Update thread if status changes
  IF p_new_status != v_current_status THEN
    UPDATE public.governance_threads
    SET 
      status = p_new_status,
      resolved_at = CASE WHEN p_new_status IN ('resolved', 'cancelled') THEN now() ELSE NULL END,
      resolved_by = CASE WHEN p_new_status IN ('resolved', 'cancelled') AND p_actor_type = 'human' THEN p_actor_id ELSE NULL END
    WHERE id = p_thread_id;
  END IF;
  
  -- Build after state
  v_after_state := jsonb_build_object(
    'status', p_new_status,
    'priority', (v_before_state->>'priority'),
    'current_step', (v_before_state->>'current_step'),
    'proof_bundle_id', (v_before_state->>'proof_bundle_id')
  );
  
  -- Create the action record
  INSERT INTO public.governance_actions (
    thread_id,
    action_type,
    actor_type,
    actor_id,
    agent_name,
    rationale,
    before_state,
    after_state,
    metadata
  ) VALUES (
    p_thread_id,
    p_action_type,
    p_actor_type,
    p_actor_id,
    p_agent_name,
    p_rationale,
    v_before_state,
    v_after_state,
    p_metadata
  )
  RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES (Disabled for development)
-- ============================================

-- Note: RLS is disabled for development. Re-enable before production.
ALTER TABLE public.governance_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_actions DISABLE ROW LEVEL SECURITY;

-- Placeholder RLS policies for production:
-- CREATE POLICY "Users can view threads in their enterprise"
--   ON public.governance_threads FOR SELECT
--   USING (enterprise_id IN (
--     SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
--   ));

-- CREATE POLICY "Users can view actions for threads they can access"
--   ON public.governance_actions FOR SELECT
--   USING (thread_id IN (
--     SELECT id FROM public.governance_threads WHERE enterprise_id IN (
--       SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
--     )
--   ));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.governance_threads IS 
  'PRD-aligned governance threads linking submissions to decisions. Supports tool_request, policy_change, incident, and audit thread types.';

COMMENT ON TABLE public.governance_actions IS 
  'Immutable audit log of all actions on governance threads. Captures actor attribution, rationale, and before/after state for every state change.';

COMMENT ON FUNCTION public.create_governance_thread IS 
  'Creates a new governance thread with an initial submit action. Returns the thread ID.';

COMMENT ON FUNCTION public.record_governance_action IS 
  'Records an action on a governance thread, updates thread status, and captures state diff. Returns the action ID.';

