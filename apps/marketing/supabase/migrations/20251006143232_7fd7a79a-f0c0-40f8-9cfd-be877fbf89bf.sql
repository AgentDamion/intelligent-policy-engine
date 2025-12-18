-- Drop foreign key constraint on profiles to allow demo users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop foreign key constraint on user_roles to allow demo users
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Insert demo user profiles directly
INSERT INTO public.profiles (id, first_name, last_name, account_type)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Demo', 'Enterprise', 'enterprise'),
  ('22222222-2222-2222-2222-222222222222', 'Demo', 'Partner', 'partner'),
  ('33333333-3333-3333-3333-333333333333', 'Demo', 'Vendor', 'vendor')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  account_type = EXCLUDED.account_type;

-- Create helper function to check if user is demo user
CREATE OR REPLACE FUNCTION public.is_demo_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT check_user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
$$;

-- Create helper function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  ) OR public.is_demo_user(_user_id);
$$;

-- Create helper function to check role in context
CREATE OR REPLACE FUNCTION public.has_role_in_context(
  _user_id uuid,
  _role app_role,
  _enterprise_id uuid DEFAULT NULL,
  _workspace_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
    AND (enterprise_id = _enterprise_id OR _enterprise_id IS NULL)
    AND (workspace_id = _workspace_id OR _workspace_id IS NULL)
  ) OR public.is_demo_user(_user_id);
$$;

-- Grant demo users owner role access to sample enterprises (only using existing enterprises)
INSERT INTO public.user_roles (user_id, enterprise_id, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', 'owner'),
  ('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440002', 'owner')
ON CONFLICT (user_id, enterprise_id) 
DO UPDATE SET role = EXCLUDED.role;

-- Create validation_errors table
CREATE TABLE IF NOT EXISTS public.validation_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  operation text NOT NULL,
  error_type text NOT NULL,
  error_message text NOT NULL,
  validation_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on validation_errors
ALTER TABLE public.validation_errors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert validation errors" ON public.validation_errors;
DROP POLICY IF EXISTS "Users can view their own validation errors" ON public.validation_errors;

-- Service role can insert validation errors
CREATE POLICY "Service role can insert validation errors"
  ON public.validation_errors FOR INSERT
  WITH CHECK (true);

-- Users can view their own validation errors
CREATE POLICY "Users can view their own validation errors"
  ON public.validation_errors FOR SELECT
  USING (user_id = auth.uid() OR public.is_demo_user(user_id));

-- Create operation_logs table
CREATE TABLE IF NOT EXISTS public.operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  operation text NOT NULL,
  status text NOT NULL,
  duration_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on operation_logs
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert operation logs" ON public.operation_logs;
DROP POLICY IF EXISTS "Users can view their own operation logs" ON public.operation_logs;

-- Service role can insert operation logs
CREATE POLICY "Service role can insert operation logs"
  ON public.operation_logs FOR INSERT
  WITH CHECK (true);

-- Users can view their own operation logs
CREATE POLICY "Users can view their own operation logs"
  ON public.operation_logs FOR SELECT
  USING (user_id = auth.uid() OR public.is_demo_user(user_id));

-- Create function to log validation errors
CREATE OR REPLACE FUNCTION public.log_validation_error(
  p_user_id uuid,
  p_operation text,
  p_error_type text,
  p_error_message text,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.validation_errors (user_id, operation, error_type, error_message, validation_context)
  VALUES (p_user_id, p_operation, p_error_type, p_error_message, p_context);
END;
$$;

-- Create function to log operations
CREATE OR REPLACE FUNCTION public.log_operation(
  p_user_id uuid,
  p_operation text,
  p_status text,
  p_duration_ms integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.operation_logs (user_id, operation, status, duration_ms, metadata)
  VALUES (p_user_id, p_operation, p_status, p_duration_ms, p_metadata);
END;
$$;