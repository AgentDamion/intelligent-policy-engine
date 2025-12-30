-- Migration: 20251229000005_add_content_hash_to_governance_actions.sql
-- Purpose: Add content_hash column and immutable trigger to governance_actions
-- Context Graph Phase 2: Context Capture Enhancement
--
-- This creates cryptographic verification for governance actions:
-- - SHA-256 hash of canonical JSON representation
-- - Computed BEFORE INSERT (immutable trigger)
-- - Enables tamper detection and audit integrity
-- - Required for FDA 21 CFR Part 11 compliance

BEGIN;

-- ============================================================
-- PART 1: Enable pgcrypto extension for SHA-256
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- PART 2: Add content_hash column to governance_actions
-- ============================================================

ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Index for hash lookups (for verification)
CREATE INDEX IF NOT EXISTS idx_governance_actions_content_hash
ON public.governance_actions(content_hash)
WHERE content_hash IS NOT NULL;

-- ============================================================
-- PART 3: Create immutable hash computation trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_governance_action_hash()
RETURNS TRIGGER AS $$
DECLARE
  canonical_content JSONB;
BEGIN
  -- Build deterministic JSON (sorted keys via jsonb_build_object)
  -- This ensures the same data always produces the same hash
  canonical_content := jsonb_build_object(
    'action_type', NEW.action_type,
    'actor_id', NEW.actor_id,
    'actor_role', NEW.actor_role,
    'actor_type', NEW.actor_type,
    'after_state', NEW.after_state,
    'agent_name', NEW.agent_name,
    'before_state', NEW.before_state,
    'context_snapshot', NEW.context_snapshot,
    'created_at', NEW.created_at,
    'metadata', NEW.metadata,
    'rationale', NEW.rationale,
    'thread_id', NEW.thread_id
  );
  
  -- Compute SHA-256 hash of the canonical JSON
  -- Use extensions schema for pgcrypto functions in Supabase
  NEW.content_hash := encode(
    extensions.digest(canonical_content::text, 'sha256'), 
    'hex'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.compute_governance_action_hash IS 
'Computes SHA-256 hash of governance action for immutability verification.
Triggered BEFORE INSERT to ensure every action has a cryptographic hash.
This supports FDA 21 CFR Part 11 audit trail integrity requirements.';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_governance_action_hash ON public.governance_actions;

-- Create the BEFORE INSERT trigger
CREATE TRIGGER trg_governance_action_hash
  BEFORE INSERT ON public.governance_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_governance_action_hash();

-- ============================================================
-- PART 4: Prevent updates to hashed content (immutability)
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_governance_action_mutation()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent any updates to immutable fields
  IF OLD.content_hash IS NOT NULL THEN
    -- Only allow updates to non-hashed metadata fields
    IF OLD.action_type IS DISTINCT FROM NEW.action_type OR
       OLD.actor_id IS DISTINCT FROM NEW.actor_id OR
       OLD.actor_type IS DISTINCT FROM NEW.actor_type OR
       OLD.before_state IS DISTINCT FROM NEW.before_state OR
       OLD.after_state IS DISTINCT FROM NEW.after_state OR
       OLD.rationale IS DISTINCT FROM NEW.rationale OR
       OLD.context_snapshot IS DISTINCT FROM NEW.context_snapshot THEN
      RAISE EXCEPTION 'Cannot modify immutable governance action fields. Action ID: %', OLD.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.prevent_governance_action_mutation IS 
'Prevents modification of immutable governance action fields after hashing.
This ensures the content_hash remains valid for audit verification.';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_governance_action_immutable ON public.governance_actions;

-- Create the BEFORE UPDATE trigger
CREATE TRIGGER trg_governance_action_immutable
  BEFORE UPDATE ON public.governance_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_governance_action_mutation();

-- ============================================================
-- PART 5: Verification function
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_governance_action_integrity(p_action_id UUID)
RETURNS TABLE (
  action_id UUID,
  is_valid BOOLEAN,
  stored_hash TEXT,
  computed_hash TEXT,
  verification_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_action RECORD;
  v_canonical_content JSONB;
  v_computed_hash TEXT;
BEGIN
  -- Get the action
  SELECT * INTO v_action
  FROM public.governance_actions ga
  WHERE ga.id = p_action_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      p_action_id,
      false,
      NULL::TEXT,
      NULL::TEXT,
      NOW();
    RETURN;
  END IF;
  
  -- Rebuild canonical content
  v_canonical_content := jsonb_build_object(
    'action_type', v_action.action_type,
    'actor_id', v_action.actor_id,
    'actor_role', v_action.actor_role,
    'actor_type', v_action.actor_type,
    'after_state', v_action.after_state,
    'agent_name', v_action.agent_name,
    'before_state', v_action.before_state,
    'context_snapshot', v_action.context_snapshot,
    'created_at', v_action.created_at,
    'metadata', v_action.metadata,
    'rationale', v_action.rationale,
    'thread_id', v_action.thread_id
  );
  
  -- Compute hash (use extensions schema for pgcrypto)
  v_computed_hash := encode(extensions.digest(v_canonical_content::text, 'sha256'), 'hex');
  
  -- Return verification result
  RETURN QUERY SELECT 
    v_action.id,
    v_action.content_hash = v_computed_hash,
    v_action.content_hash,
    v_computed_hash,
    NOW();
END;
$$;

COMMENT ON FUNCTION public.verify_governance_action_integrity IS 
'Verifies the cryptographic integrity of a governance action by recomputing the hash.
Returns whether the stored hash matches the computed hash from current data.';

-- ============================================================
-- PART 6: Batch verification function
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_governance_actions_batch(
  p_thread_id UUID DEFAULT NULL,
  p_enterprise_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
  total_verified INTEGER,
  valid_count INTEGER,
  invalid_count INTEGER,
  invalid_action_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_total INTEGER := 0;
  v_valid INTEGER := 0;
  v_invalid INTEGER := 0;
  v_invalid_ids UUID[] := ARRAY[]::UUID[];
  v_action RECORD;
  v_is_valid BOOLEAN;
BEGIN
  FOR v_action IN 
    SELECT ga.id
    FROM public.governance_actions ga
    LEFT JOIN public.governance_threads gt ON ga.thread_id = gt.id
    WHERE (p_thread_id IS NULL OR ga.thread_id = p_thread_id)
      AND (p_enterprise_id IS NULL OR gt.enterprise_id = p_enterprise_id)
      AND ga.content_hash IS NOT NULL
    LIMIT p_limit
  LOOP
    v_total := v_total + 1;
    
    SELECT vga.is_valid INTO v_is_valid
    FROM public.verify_governance_action_integrity(v_action.id) vga;
    
    IF v_is_valid THEN
      v_valid := v_valid + 1;
    ELSE
      v_invalid := v_invalid + 1;
      v_invalid_ids := array_append(v_invalid_ids, v_action.id);
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_total, v_valid, v_invalid, v_invalid_ids;
END;
$$;

COMMENT ON FUNCTION public.verify_governance_actions_batch IS 
'Batch verifies governance action integrity for a thread, enterprise, or all actions.
Returns counts of valid/invalid actions and IDs of any invalid actions.';

-- ============================================================
-- PART 7: Backfill existing actions with hashes
-- ============================================================

-- Compute hashes for any existing actions that don't have them
-- Use extensions schema for pgcrypto functions
UPDATE public.governance_actions
SET content_hash = encode(
  extensions.digest(
    jsonb_build_object(
      'action_type', action_type,
      'actor_id', actor_id,
      'actor_role', actor_role,
      'actor_type', actor_type,
      'after_state', after_state,
      'agent_name', agent_name,
      'before_state', before_state,
      'context_snapshot', context_snapshot,
      'created_at', created_at,
      'metadata', metadata,
      'rationale', rationale,
      'thread_id', thread_id
    )::text, 
    'sha256'
  ), 
  'hex'
)
WHERE content_hash IS NULL;

-- ============================================================
-- PART 8: Comments for documentation
-- ============================================================

COMMENT ON COLUMN public.governance_actions.content_hash IS 
'SHA-256 hash of canonical action content for tamper detection.
Computed automatically on INSERT. Immutable after creation.
Format: 64-character hex string (e.g., "a3f2...")';

COMMIT;

