-- Migration: add_rationale_fields_to_decisions
-- Adds human-readable and structured rationale fields for AI governance decisions
-- This enables auditors to see "what happened" and "why" in one place

-- ============================================
-- 1. ADD RATIONALE FIELDS TO ai_agent_decisions
-- ============================================

ALTER TABLE ai_agent_decisions 
  ADD COLUMN IF NOT EXISTS rationale_human TEXT,
  ADD COLUMN IF NOT EXISTS rationale_structured JSONB DEFAULT '{}';

-- Constraint for 140-character limit on human-readable rationale
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rationale_human_length'
  ) THEN
    ALTER TABLE ai_agent_decisions 
      ADD CONSTRAINT rationale_human_length CHECK (char_length(rationale_human) <= 140);
  END IF;
END $$;

-- GIN index for searching structured rationales
CREATE INDEX IF NOT EXISTS idx_decisions_rationale_gin 
  ON ai_agent_decisions USING gin(rationale_structured);

-- Documentation comments
COMMENT ON COLUMN ai_agent_decisions.rationale_human IS 
  'Human-readable justification ≤140 chars. Required for allow/deny/escalate decisions.';

COMMENT ON COLUMN ai_agent_decisions.rationale_structured IS 
  'Machine-parseable rationale with policy_id, rule, inputs, and actor fields.';

-- ============================================
-- 2. ADD RATIONALE FIELDS TO audit_events
-- ============================================

ALTER TABLE audit_events 
  ADD COLUMN IF NOT EXISTS rationale_human TEXT,
  ADD COLUMN IF NOT EXISTS rationale_structured JSONB DEFAULT '{}';

-- Constraint for 140-character limit on human-readable rationale
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'audit_rationale_human_length'
  ) THEN
    ALTER TABLE audit_events 
      ADD CONSTRAINT audit_rationale_human_length CHECK (char_length(rationale_human) <= 140);
  END IF;
END $$;

-- GIN index for searching structured rationales
CREATE INDEX IF NOT EXISTS idx_audit_rationale_gin 
  ON audit_events USING gin(rationale_structured);

-- Documentation comments
COMMENT ON COLUMN audit_events.rationale_human IS 
  'Human-readable justification ≤140 chars for audit trail clarity.';

COMMENT ON COLUMN audit_events.rationale_structured IS 
  'Machine-parseable rationale for compliance queries and exports.';











