-- Create tool_requests table for marketplace tool approval workflow
CREATE TABLE IF NOT EXISTS public.tool_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id BIGINT NOT NULL REFERENCES marketplace_tools(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
    business_justification TEXT NOT NULL,
    expected_usage TEXT NOT NULL,
    compliance_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tool_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for tool_requests
CREATE POLICY "Users can create tool requests for their workspaces" 
ON public.tool_requests 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE user_id = auth.uid() 
        AND workspace_id = tool_requests.workspace_id
    )
);

CREATE POLICY "Users can view tool requests in their context" 
ON public.tool_requests 
FOR SELECT 
USING (
    -- Workspace members can see requests from their workspaces
    workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
    )
    OR
    -- Enterprise members can see requests for their enterprises
    enterprise_id IN (
        SELECT enterprise_id FROM enterprise_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enterprise members can update tool request status" 
ON public.tool_requests 
FOR UPDATE 
USING (
    enterprise_id IN (
        SELECT enterprise_id FROM enterprise_members 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_tool_requests_updated_at
    BEFORE UPDATE ON public.tool_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();