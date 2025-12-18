-- Create function to automatically assign new users to sample data
CREATE OR REPLACE FUNCTION assign_user_to_sample_enterprise_and_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_enterprise_id uuid;
    target_workspace_id uuid;
    target_role enterprise_role_enum;
BEGIN
    -- Determine target enterprise and role based on account type
    IF NEW.account_type = 'enterprise' THEN
        target_enterprise_id := '550e8400-e29b-41d4-a716-446655440001'; -- Acme Pharmaceuticals
        target_workspace_id := '660e8400-e29b-41d4-a716-446655440001';  -- Acme Main Workspace
        target_role := 'admin';
    ELSIF NEW.account_type = 'partner' THEN
        target_enterprise_id := '550e8400-e29b-41d4-a716-446655440002'; -- Digital Health Agency
        target_workspace_id := '660e8400-e29b-41d4-a716-446655440002';  -- Digital Health Main
        target_role := 'member';
    ELSE
        RETURN NEW; -- No assignment if no account type selected
    END IF;

    -- Add user to enterprise
    INSERT INTO enterprise_members (user_id, enterprise_id, role)
    VALUES (NEW.id, target_enterprise_id, 'member'::app_role)
    ON CONFLICT (user_id, enterprise_id) DO NOTHING;

    -- Add user to workspace
    INSERT INTO workspace_members (user_id, workspace_id, role)
    VALUES (NEW.id, target_workspace_id, target_role)
    ON CONFLICT (user_id, workspace_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Create trigger to automatically assign users when account_type is updated
DROP TRIGGER IF EXISTS trigger_assign_user_to_sample_data ON profiles;
CREATE TRIGGER trigger_assign_user_to_sample_data
    AFTER UPDATE OF account_type ON profiles
    FOR EACH ROW
    WHEN (OLD.account_type IS DISTINCT FROM NEW.account_type AND NEW.account_type IS NOT NULL)
    EXECUTE FUNCTION assign_user_to_sample_enterprise_and_workspace();