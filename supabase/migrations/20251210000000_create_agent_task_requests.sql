-- ================================
-- AGENT TASK REQUESTS TABLE
-- ================================
-- Migration: 20251210000000
-- Description: Create table for agent task requests that the worker.py processes
-- This table allows users to submit tasks that are processed by background workers

CREATE TABLE IF NOT EXISTS public.agent_task_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_payload JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_task_requests_status ON public.agent_task_requests(status);
CREATE INDEX IF NOT EXISTS idx_agent_task_requests_created_at ON public.agent_task_requests(created_at DESC);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_task_requests_updated_at
    BEFORE UPDATE ON public.agent_task_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.agent_task_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for the worker)
CREATE POLICY "Service role full access"
    ON public.agent_task_requests
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Authenticated users can insert and read their own tasks
CREATE POLICY "Users can insert tasks"
    ON public.agent_task_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can read their own tasks"
    ON public.agent_task_requests
    FOR SELECT
    TO authenticated
    USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.agent_task_requests IS 'Stores agent task requests that are processed by background workers';
COMMENT ON COLUMN public.agent_task_requests.status IS 'Task status: pending, processing, completed, or failed';
COMMENT ON COLUMN public.agent_task_requests.request_payload IS 'JSON payload containing the task request (e.g., prompt, parameters)';
COMMENT ON COLUMN public.agent_task_requests.response_payload IS 'JSON payload containing the task response/result';

