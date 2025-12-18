-- Ensure schema privileges for public
DO $$ BEGIN
  -- Grant USAGE on schema public to common roles (idempotent)
  EXECUTE 'GRANT USAGE ON SCHEMA public TO anon';
  EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
  EXECUTE 'GRANT USAGE ON SCHEMA public TO service_role';
EXCEPTION WHEN others THEN
  -- ignore if already granted
  NULL;
END $$;

-- Ensure service_role can manage specific tables used by edge functions
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'structured_policy_data'
  ) THEN
    EXECUTE 'GRANT INSERT, UPDATE, SELECT, DELETE ON public.structured_policy_data TO service_role';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.structured_policy_data_id_seq TO service_role';
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ai_agent_decisions'
  ) THEN
    EXECUTE 'GRANT INSERT, UPDATE, SELECT ON public.ai_agent_decisions TO authenticated';
    EXECUTE 'GRANT INSERT, UPDATE, SELECT, DELETE ON public.ai_agent_decisions TO service_role';
    -- sequences (if any bigint identity, skip gracefully)
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;

-- Optional: explicitly allow service_role to bypass RLS (it already does), but keep for clarity
ALTER TABLE IF EXISTS public.structured_policy_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_agent_decisions ENABLE ROW LEVEL SECURITY; 
