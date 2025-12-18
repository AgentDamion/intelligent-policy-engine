-- Enhanced Agency Dashboard Network Operations: Magic Link Enterprise-to-Agency Onboarding

-- Add enterprise_type to enterprises table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='enterprises' AND column_name='enterprise_type') THEN
        ALTER TABLE enterprises ADD COLUMN enterprise_type text DEFAULT 'client' CHECK (enterprise_type IN ('client', 'agency'));
    END IF;
END $$;

-- Enhance customer_onboarding table for enterprise-to-agency invitations
ALTER TABLE customer_onboarding 
ADD COLUMN IF NOT EXISTS invitation_type text DEFAULT 'customer_signup' CHECK (invitation_type IN ('customer_signup', 'enterprise_to_agency', 'agency_to_team'));

ALTER TABLE customer_onboarding 
ADD COLUMN IF NOT EXISTS inviting_enterprise_id uuid REFERENCES enterprises(id);

ALTER TABLE customer_onboarding 
ADD COLUMN IF NOT EXISTS target_role text DEFAULT 'admin';

-- Create brand workspaces table for sub-tenancy
CREATE TABLE IF NOT EXISTS brand_workspaces (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    agency_workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    client_enterprise_id uuid NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    brand_metadata jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(agency_workspace_id, client_enterprise_id, name)
);

-- Enable RLS on brand_workspaces
ALTER TABLE brand_workspaces ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_workspaces
CREATE POLICY "Agency workspace members can manage brand workspaces"
ON brand_workspaces
FOR ALL
USING (
    agency_workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
    )
);

-- Create brand workspace members table for granular access control
CREATE TABLE IF NOT EXISTS brand_workspace_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_workspace_id uuid NOT NULL REFERENCES brand_workspaces(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role enterprise_role_enum NOT NULL DEFAULT 'viewer',
    permissions jsonb DEFAULT '{}',
    invited_by uuid REFERENCES auth.users(id),
    joined_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(brand_workspace_id, user_id)
);

-- Enable RLS on brand_workspace_members
ALTER TABLE brand_workspace_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_workspace_members
CREATE POLICY "Brand workspace members can view their memberships"
ON brand_workspace_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Agency admins can manage brand workspace members"
ON brand_workspace_members
FOR ALL
USING (
    brand_workspace_id IN (
        SELECT bw.id 
        FROM brand_workspaces bw
        JOIN workspace_members wm ON wm.workspace_id = bw.agency_workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('admin', 'owner')
    )
);

-- Create agency subscription table for agency-as-enterprise upgrades
CREATE TABLE IF NOT EXISTS agency_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_enterprise_id uuid NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    subscription_tier text NOT NULL DEFAULT 'starter',
    is_enterprise_mode boolean DEFAULT false,
    enterprise_features_enabled jsonb DEFAULT '{}',
    billing_contact_id uuid REFERENCES auth.users(id),
    subscription_metadata jsonb DEFAULT '{}',
    activated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(agency_enterprise_id)
);

-- Enable RLS on agency_subscriptions
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for agency_subscriptions
CREATE POLICY "Agency owners can manage their subscriptions"
ON agency_subscriptions
FOR ALL
USING (
    agency_enterprise_id IN (
        SELECT em.enterprise_id 
        FROM enterprise_members em
        WHERE em.user_id = auth.uid() AND em.role = 'owner'
    )
);

-- Create function to handle enterprise-to-agency invitation acceptance
CREATE OR REPLACE FUNCTION accept_enterprise_to_agency_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
    v_agency_workspace_id UUID;
    v_result jsonb;
BEGIN
    -- Get the current user's id
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Find the invitation
    SELECT * INTO v_invitation 
    FROM customer_onboarding 
    WHERE magic_token = p_token 
    AND invitation_type = 'enterprise_to_agency'
    AND expires_at > NOW()
    AND used_at IS NULL;
    
    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Create agency workspace within inviting enterprise context
    INSERT INTO workspaces (name, enterprise_id, workspace_type)
    VALUES (
        v_invitation.workspace_name || ' Agency Workspace',
        v_invitation.inviting_enterprise_id,
        'agency_client'
    )
    RETURNING id INTO v_agency_workspace_id;
    
    -- Add user to the agency workspace
    INSERT INTO workspace_members (user_id, workspace_id, role)
    VALUES (v_user_id, v_agency_workspace_id, v_invitation.target_role);
    
    -- Create client-agency relationship
    INSERT INTO client_agency_relationships (
        client_enterprise_id, 
        agency_enterprise_id,
        status,
        permissions
    )
    VALUES (
        v_invitation.inviting_enterprise_id,
        v_invitation.enterprise_id, -- Agency's enterprise ID
        'active',
        jsonb_build_object(
            'can_view_policies', true,
            'can_submit_reviews', true,
            'can_manage_brands', true
        )
    );
    
    -- Mark invitation as used
    UPDATE customer_onboarding 
    SET used_at = NOW(), user_id = v_user_id
    WHERE id = v_invitation.id;
    
    -- Return success with workspace details
    RETURN jsonb_build_object(
        'success', true,
        'workspace_id', v_agency_workspace_id,
        'enterprise_id', v_invitation.inviting_enterprise_id,
        'role', v_invitation.target_role
    );
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create trigger for updated_at on brand_workspaces
CREATE OR REPLACE TRIGGER update_brand_workspaces_updated_at
    BEFORE UPDATE ON brand_workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on agency_subscriptions  
CREATE OR REPLACE TRIGGER update_agency_subscriptions_updated_at
    BEFORE UPDATE ON agency_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();