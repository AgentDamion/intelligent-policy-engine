-- Create MCP audit table for tracking all database access
CREATE TABLE IF NOT EXISTS public.mcp_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,
    rows_returned INTEGER DEFAULT 0,
    ip TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mcp_audit_user_id ON public.mcp_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_created_at ON public.mcp_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_success ON public.mcp_audit(success);

-- Enable RLS
ALTER TABLE public.mcp_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage audit logs" ON public.mcp_audit
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users to read their own logs
CREATE POLICY "Users can read their own audit logs" ON public.mcp_audit
    FOR SELECT USING (auth.uid()::text = user_id);

-- Create function to clean up old audit logs (90 days retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.mcp_audit 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Log cleanup activity
    INSERT INTO public.mcp_audit (user_id, query, success, ip)
    VALUES ('system', 'AUDIT_CLEANUP: Deleted old audit logs', true, 'system');
END;
$$ LANGUAGE plpgsql;

-- Create a comment explaining the table
COMMENT ON TABLE public.mcp_audit IS 'Audit log for all MCP database access. Retains data for 90 days.';
COMMENT ON COLUMN public.mcp_audit.user_id IS 'User identifier making the request';
COMMENT ON COLUMN public.mcp_audit.query IS 'SQL query executed (truncated to 1000 chars)';
COMMENT ON COLUMN public.mcp_audit.rows_returned IS 'Number of rows returned by the query';
COMMENT ON COLUMN public.mcp_audit.ip IS 'IP address of the request (if available)';
COMMENT ON COLUMN public.mcp_audit.success IS 'Whether the query executed successfully';
COMMENT ON COLUMN public.mcp_audit.created_at IS 'Timestamp when the query was executed';