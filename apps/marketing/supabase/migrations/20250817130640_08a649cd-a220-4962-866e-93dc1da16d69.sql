-- Fix remaining function search_path security issue
-- Update log_audit_entry function to set explicit search_path

CREATE OR REPLACE FUNCTION public.log_audit_entry(p_action_type character varying, p_resource_type character varying, p_resource_id uuid, p_details jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_audit_id UUID;
    v_user_id UUID;
    v_organization_id UUID;
BEGIN
    -- Get current user context (from JWT or session)
    v_user_id := auth.uid();
    
    -- Get organization from user
    SELECT organization_id INTO v_organization_id 
    FROM users_enhanced 
    WHERE id = v_user_id;
    
    -- Insert audit entry
    INSERT INTO audit_entries (
        organization_id,
        user_id,
        action_type,
        resource_type,
        resource_id,
        details,
        ip_address
    ) VALUES (
        v_organization_id,
        v_user_id,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_details,
        inet_client_addr()
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$function$;