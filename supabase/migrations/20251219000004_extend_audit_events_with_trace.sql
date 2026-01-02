-- =============================================================================
-- MIGRATION: 004_extend_audit_events_with_trace
-- PURPOSE: Capture policy digest and trace context in all audit events
-- =============================================================================

-- Extend governance_audit_events with policy digest and trace context
ALTER TABLE public.governance_audit_events
  ADD COLUMN IF NOT EXISTS policy_digest TEXT,
  ADD COLUMN IF NOT EXISTS trace_id TEXT,
  ADD COLUMN IF NOT EXISTS span_id TEXT,
  ADD COLUMN IF NOT EXISTS trace_context JSONB DEFAULT '{}';

-- Composite index for trace correlation
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_trace_id 
  ON public.governance_audit_events(trace_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_gov_audit_events_policy_digest 
  ON public.governance_audit_events(policy_digest, occurred_at);

-- Index for span lookups
CREATE INDEX IF NOT EXISTS idx_gov_audit_events_span_id 
  ON public.governance_audit_events(span_id) WHERE span_id IS NOT NULL;

COMMENT ON COLUMN public.governance_audit_events.policy_digest IS 'Policy digest active at time of event - enables "which policy governed this action?"';
COMMENT ON COLUMN public.governance_audit_events.trace_id IS 'W3C trace ID for distributed tracing correlation';
COMMENT ON COLUMN public.governance_audit_events.span_id IS 'W3C span ID for specific operation tracking';
COMMENT ON COLUMN public.governance_audit_events.trace_context IS 'Full trace context including tracestate vendor entries';

-- =============================================================================
-- Also extend vera.events table if it exists (event sourcing table)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'vera' AND table_name = 'events'
  ) THEN
    ALTER TABLE vera.events
      ADD COLUMN IF NOT EXISTS policy_digest TEXT,
      ADD COLUMN IF NOT EXISTS trace_id TEXT,
      ADD COLUMN IF NOT EXISTS span_id TEXT;
    
    CREATE INDEX IF NOT EXISTS idx_vera_events_policy_digest 
      ON vera.events(policy_digest) WHERE policy_digest IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_vera_events_trace_id 
      ON vera.events(trace_id) WHERE trace_id IS NOT NULL;
  END IF;
END $$;














