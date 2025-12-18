-- Fix critical RLS security issues (corrected for actual table structure)

-- Enable RLS on workspace_users table if it exists and is a table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspace_users' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view workspaces they belong to" 
    ON public.workspace_users 
    FOR SELECT 
    USING (user_id = auth.uid());

    CREATE POLICY "Workspace admins can manage workspace users" 
    ON public.workspace_users 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.workspace_users wu 
        WHERE wu.workspace_id = workspace_users.workspace_id 
        AND wu.user_id = auth.uid() 
        AND wu.role = 'admin'
      )
    );
  END IF;
END $$;

-- Secure marketplace_tools table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_tools' AND table_type = 'BASE TABLE') THEN
    -- Drop existing policy if exists
    DROP POLICY IF EXISTS "Marketplace tools are publicly viewable" ON public.marketplace_tools;
    
    -- Create restricted policy
    CREATE POLICY "Marketplace tools public view (limited data)" 
    ON public.marketplace_tools 
    FOR SELECT 
    USING (status = 'verified');
  END IF;
END $$;