-- VERA State Migration
-- Creates the vera_state table for tracking VERA orchestrator runtime state

-- Create vera_state table
CREATE TABLE IF NOT EXISTS public.vera_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
    
    -- Current EPS (Effective Policy Snapshot) reference
    current_eps_id UUID,  -- FK to effective_policy_snapshots if that table exists
    current_eps_version TEXT,
    current_eps_hash TEXT,  -- SHA-256 hash of the EPS for verification
    
    -- Last decision tracking
    last_decision_id UUID,
    last_decision_at TIMESTAMPTZ,
    last_decision_type TEXT,  -- 'approved', 'rejected', 'escalated', 'needs_review'
    
    -- Session state (for maintaining context across interactions)
    session_context JSONB DEFAULT '{}'::jsonb,
    
    -- Mode configuration (runtime overrides)
    mode_config JSONB DEFAULT '{
        "override_mode": null,
        "override_expires_at": null,
        "bypass_dlp": false,
        "bypass_auto_clear": false
    }'::jsonb,
    
    -- Statistics and counters (reset daily/weekly)
    stats_period_start TIMESTAMPTZ DEFAULT now(),
    decisions_count INTEGER DEFAULT 0,
    auto_cleared_count INTEGER DEFAULT 0,
    escalated_count INTEGER DEFAULT 0,
    blocked_count INTEGER DEFAULT 0,
    
    -- Health metrics
    last_health_check TIMESTAMPTZ DEFAULT now(),
    health_status TEXT DEFAULT 'healthy',  -- 'healthy', 'degraded', 'error'
    health_details JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one state record per enterprise
    CONSTRAINT vera_state_enterprise_unique UNIQUE (enterprise_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_vera_state_enterprise 
    ON public.vera_state(enterprise_id);

CREATE INDEX IF NOT EXISTS idx_vera_state_last_decision 
    ON public.vera_state(last_decision_at DESC);

CREATE INDEX IF NOT EXISTS idx_vera_state_health 
    ON public.vera_state(health_status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vera_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vera_state_updated_at ON public.vera_state;
CREATE TRIGGER vera_state_updated_at
    BEFORE UPDATE ON public.vera_state
    FOR EACH ROW
    EXECUTE FUNCTION update_vera_state_updated_at();

-- Enable RLS
ALTER TABLE public.vera_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view state for enterprises they belong to
CREATE POLICY vera_state_select ON public.vera_state
    FOR SELECT
    USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

-- Only the system (service role) or admins can update state
-- In practice, this is primarily updated by Edge Functions
CREATE POLICY vera_state_update ON public.vera_state
    FOR UPDATE
    USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- Only admins can insert state records
CREATE POLICY vera_state_insert ON public.vera_state
    FOR INSERT
    WITH CHECK (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.vera_state TO authenticated;

-- Helper function to get or create VERA state for an enterprise
CREATE OR REPLACE FUNCTION get_or_create_vera_state(p_enterprise_id UUID)
RETURNS UUID AS $$
DECLARE
    v_state_id UUID;
BEGIN
    -- Try to get existing state
    SELECT id INTO v_state_id 
    FROM public.vera_state 
    WHERE enterprise_id = p_enterprise_id;
    
    -- If not found, create a new one
    IF v_state_id IS NULL THEN
        INSERT INTO public.vera_state (enterprise_id)
        VALUES (p_enterprise_id)
        RETURNING id INTO v_state_id;
    END IF;
    
    RETURN v_state_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment decision counters
CREATE OR REPLACE FUNCTION increment_vera_decision_counter(
    p_enterprise_id UUID,
    p_decision_type TEXT,
    p_decision_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE public.vera_state
    SET 
        decisions_count = decisions_count + 1,
        auto_cleared_count = CASE WHEN p_decision_type = 'auto_cleared' THEN auto_cleared_count + 1 ELSE auto_cleared_count END,
        escalated_count = CASE WHEN p_decision_type = 'escalated' THEN escalated_count + 1 ELSE escalated_count END,
        blocked_count = CASE WHEN p_decision_type = 'blocked' THEN blocked_count + 1 ELSE blocked_count END,
        last_decision_id = COALESCE(p_decision_id, last_decision_id),
        last_decision_at = now(),
        last_decision_type = p_decision_type
    WHERE enterprise_id = p_enterprise_id;
    
    -- Create state if it doesn't exist
    IF NOT FOUND THEN
        INSERT INTO public.vera_state (enterprise_id, decisions_count, last_decision_type, last_decision_at, last_decision_id)
        VALUES (p_enterprise_id, 1, p_decision_type, now(), p_decision_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_or_create_vera_state(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_vera_decision_counter(UUID, TEXT, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.vera_state IS 'VERA orchestrator runtime state tracking per enterprise';
COMMENT ON COLUMN public.vera_state.current_eps_id IS 'Reference to the currently active Effective Policy Snapshot';
COMMENT ON COLUMN public.vera_state.mode_config IS 'Runtime mode configuration overrides (temporary bypasses, etc.)';
COMMENT ON COLUMN public.vera_state.health_status IS 'Current health status: healthy, degraded, or error';
COMMENT ON FUNCTION get_or_create_vera_state(UUID) IS 'Gets existing VERA state or creates a new one for the enterprise';
COMMENT ON FUNCTION increment_vera_decision_counter(UUID, TEXT, UUID) IS 'Increments decision counters and updates last decision info';

