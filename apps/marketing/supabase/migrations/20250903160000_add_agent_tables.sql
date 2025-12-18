-- ================================
-- AGENT INGESTION TABLES
-- ================================
-- This migration adds tables for agent activities and AI decisions

-- Agent Activities Table
CREATE TABLE IF NOT EXISTS public.agent_activities (
    id BIGSERIAL PRIMARY KEY,
    agent VARCHAR(100) NOT NULL,
    action VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'warning', 'error', 'running')),
    workspace_id UUID,
    enterprise_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agent Decisions Table  
CREATE TABLE IF NOT EXISTS public.ai_agent_decisions (
    id BIGSERIAL PRIMARY KEY,
    agent VARCHAR(100) NOT NULL,
    action VARCHAR(500) NOT NULL,
    agency VARCHAR(100),
    outcome VARCHAR(50) CHECK (outcome IN ('approved', 'rejected', 'flagged')),
    risk VARCHAR(20) CHECK (risk IN ('low', 'medium', 'high')),
    enterprise_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_activities_created_at ON public.agent_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_enterprise ON public.agent_activities(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_workspace ON public.agent_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_status ON public.agent_activities(status);

CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_created_at ON public.ai_agent_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_enterprise ON public.ai_agent_decisions(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_outcome ON public.ai_agent_decisions(outcome);
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_risk ON public.ai_agent_decisions(risk);

-- Enable RLS
ALTER TABLE public.agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow service role to insert, authenticated users to view own data)
CREATE POLICY "Service role can insert agent activities" ON public.agent_activities
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Users can view activities in their context" ON public.agent_activities
    FOR SELECT TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        ) OR
        workspace_id IN (
            SELECT id FROM public.workspaces w
            JOIN public.enterprise_members em ON w.enterprise_id = em.enterprise_id
            WHERE em.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert ai decisions" ON public.ai_agent_decisions
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Users can view decisions in their context" ON public.ai_agent_decisions
    FOR SELECT TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );
