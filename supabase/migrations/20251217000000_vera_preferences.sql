-- VERA Preferences Migration
-- Creates the vera_preferences table for storing enterprise-level VERA configuration

-- Create VERA mode enum type
DO $$ BEGIN
    CREATE TYPE vera_mode AS ENUM ('shadow', 'enforcement', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create vera_preferences table
CREATE TABLE IF NOT EXISTS public.vera_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
    
    -- Operating mode (shadow = observe-only, enforcement = active blocking)
    vera_mode vera_mode NOT NULL DEFAULT 'shadow',
    
    -- Velocity metrics coefficients for ROI calculations
    avg_campaign_value_usd NUMERIC(12, 2) DEFAULT 150000.00,
    avg_manual_review_days NUMERIC(5, 2) DEFAULT 14.00,
    avg_tool_procurement_days NUMERIC(5, 2) DEFAULT 30.00,
    
    -- Notification preferences (JSONB for flexibility)
    notification_preferences JSONB DEFAULT '{
        "email_on_decision": true,
        "email_on_alert": true,
        "email_on_proof_bundle": false,
        "slack_webhook_url": null,
        "slack_channel": null,
        "realtime_enabled": true
    }'::jsonb,
    
    -- Feature flags
    auto_clear_enabled BOOLEAN DEFAULT true,
    auto_clear_threshold NUMERIC(3, 2) DEFAULT 0.95,  -- 95% confidence threshold
    dlp_enabled BOOLEAN DEFAULT true,
    meta_loop_enabled BOOLEAN DEFAULT false,  -- AI-powered policy refinement
    
    -- Audit settings
    proof_bundle_retention_days INTEGER DEFAULT 365,
    audit_log_retention_days INTEGER DEFAULT 730,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one preference record per enterprise
    CONSTRAINT vera_preferences_enterprise_unique UNIQUE (enterprise_id)
);

-- Create index for enterprise lookups
CREATE INDEX IF NOT EXISTS idx_vera_preferences_enterprise 
    ON public.vera_preferences(enterprise_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vera_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vera_preferences_updated_at ON public.vera_preferences;
CREATE TRIGGER vera_preferences_updated_at
    BEFORE UPDATE ON public.vera_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_vera_preferences_updated_at();

-- Enable RLS
ALTER TABLE public.vera_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view preferences for enterprises they belong to
CREATE POLICY vera_preferences_select ON public.vera_preferences
    FOR SELECT
    USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

-- Only admins and owners can update preferences
CREATE POLICY vera_preferences_update ON public.vera_preferences
    FOR UPDATE
    USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- Only admins and owners can insert preferences
CREATE POLICY vera_preferences_insert ON public.vera_preferences
    FOR INSERT
    WITH CHECK (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- Only owners can delete preferences
CREATE POLICY vera_preferences_delete ON public.vera_preferences
    FOR DELETE
    USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vera_preferences TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.vera_preferences IS 'VERA (Velocity Engine for Risk & Assurance) enterprise-level preferences and configuration';
COMMENT ON COLUMN public.vera_preferences.vera_mode IS 'Operating mode: shadow (observe-only), enforcement (active blocking), disabled';
COMMENT ON COLUMN public.vera_preferences.avg_campaign_value_usd IS 'Average campaign value in USD for velocity ROI calculations';
COMMENT ON COLUMN public.vera_preferences.auto_clear_threshold IS 'Confidence threshold (0-1) for automatic approval in shadow mode';

