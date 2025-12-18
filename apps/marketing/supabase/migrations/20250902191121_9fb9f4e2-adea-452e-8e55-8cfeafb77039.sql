-- Fix function search_path security issues
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.create_workspace_invitation(text, uuid, enterprise_role_enum, integer) SET search_path = public;
ALTER FUNCTION public.accept_workspace_invitation(text) SET search_path = public;