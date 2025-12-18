-- Expand Role System for Partner Roles
-- File: database/migrations/011_expand_role_system.sql
-- This migration expands the role system to support Partner roles and creates role hierarchy

-- ===== ROLE SYSTEM EXPANSION =====

-- Drop existing constraint to allow new roles
ALTER TABLE user_contexts DROP CONSTRAINT IF EXISTS user_contexts_role_check;

-- Add new CHECK constraint with expanded roles
ALTER TABLE user_contexts ADD CONSTRAINT user_contexts_role_check 
    CHECK (role IN (
        'platform_super_admin',
        'enterprise_owner',
        'enterprise_admin',
        'seat_admin',
        'seat_user',
        'partner_admin',
        'partner_user',
        'account_manager',
        'creative_director',
        'project_manager',
        'compliance_manager',
        'legal_counsel',
        'marketing_manager'
    ));

-- Update context hierarchy constraint to allow partner roles
ALTER TABLE user_contexts DROP CONSTRAINT IF EXISTS check_context_hierarchy;

ALTER TABLE user_contexts ADD CONSTRAINT check_context_hierarchy 
    CHECK (
        (agency_seat_id IS NULL AND role IN (
            'platform_super_admin',
            'enterprise_owner', 
            'enterprise_admin',
            'partner_admin',
            'partner_user',
            'account_manager',
            'creative_director',
            'project_manager',
            'compliance_manager',
            'legal_counsel',
            'marketing_manager'
        )) OR
        (agency_seat_id IS NOT NULL AND role IN ('seat_admin', 'seat_user'))
    );

-- ===== ROLE HIERARCHY MAPPING =====

-- Role hierarchy table for permission inheritance
CREATE TABLE IF NOT EXISTS role_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_role VARCHAR(50) NOT NULL,
    child_role VARCHAR(50) NOT NULL,
    inheritance_level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_role, child_role)
);

-- Indexes for role hierarchy
CREATE INDEX idx_role_hierarchy_parent ON role_hierarchy(parent_role);
CREATE INDEX idx_role_hierarchy_child ON role_hierarchy(child_role);

-- Insert role hierarchy relationships
INSERT INTO role_hierarchy (parent_role, child_role, inheritance_level) VALUES
    ('platform_super_admin', 'enterprise_owner', 1),
    ('platform_super_admin', 'enterprise_admin', 1),
    ('platform_super_admin', 'partner_admin', 1),
    ('enterprise_owner', 'enterprise_admin', 1),
    ('enterprise_owner', 'seat_admin', 2),
    ('enterprise_owner', 'seat_user', 2),
    ('enterprise_admin', 'seat_admin', 1),
    ('enterprise_admin', 'seat_user', 1),
    ('partner_admin', 'partner_user', 1),
    ('partner_admin', 'account_manager', 1),
    ('partner_admin', 'project_manager', 1),
    ('partner_admin', 'creative_director', 1),
    ('partner_admin', 'compliance_manager', 1),
    ('seat_admin', 'seat_user', 1)
ON CONFLICT (parent_role, child_role) DO NOTHING;

-- ===== DEFAULT PERMISSIONS FOR NEW ROLES =====

-- Function to seed default permissions for new roles
CREATE OR REPLACE FUNCTION seed_partner_role_permissions()
RETURNS void AS $$
DECLARE
    perm_id UUID;
BEGIN
    -- Partner Admin permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'partner:manage') THEN
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ('partner:manage', 'Manage partner relationships and settings', 'partner', 'partner', 'manage')
        RETURNING id INTO perm_id;
        
        INSERT INTO role_permissions (role, permission_id, is_granted)
        VALUES ('partner_admin', perm_id, true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Partner User permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'partner:submit') THEN
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ('partner:submit', 'Submit tools and content for approval', 'partner', 'submission', 'create')
        RETURNING id INTO perm_id;
        
        INSERT INTO role_permissions (role, permission_id, is_granted)
        VALUES ('partner_user', perm_id, true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Account Manager permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'client:manage') THEN
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ('client:manage', 'Manage client relationships and communications', 'partner', 'client', 'manage')
        RETURNING id INTO perm_id;
        
        INSERT INTO role_permissions (role, permission_id, is_granted)
        VALUES ('account_manager', perm_id, true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Creative Director permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'creative:approve') THEN
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ('creative:approve', 'Approve creative content submissions', 'partner', 'creative', 'approve')
        RETURNING id INTO perm_id;
        
        INSERT INTO role_permissions (role, permission_id, is_granted)
        VALUES ('creative_director', perm_id, true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Project Manager permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'project:manage') THEN
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ('project:manage', 'Manage projects and workflows', 'partner', 'project', 'manage')
        RETURNING id INTO perm_id;
        
        INSERT INTO role_permissions (role, permission_id, is_granted)
        VALUES ('project_manager', perm_id, true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Compliance Manager permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'compliance:review') THEN
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ('compliance:review', 'Review compliance status and violations', 'compliance', 'compliance', 'review')
        RETURNING id INTO perm_id;
        
        INSERT INTO role_permissions (role, permission_id, is_granted)
        VALUES ('compliance_manager', perm_id, true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Legal Counsel permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'legal:review') THEN
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ('legal:review', 'Review legal compliance and contracts', 'legal', 'legal', 'review')
        RETURNING id INTO perm_id;
        
        INSERT INTO role_permissions (role, permission_id, is_granted)
        VALUES ('legal_counsel', perm_id, true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Marketing Manager permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'marketing:manage') THEN
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ('marketing:manage', 'Manage marketing campaigns and approvals', 'marketing', 'campaign', 'manage')
        RETURNING id INTO perm_id;
        
        INSERT INTO role_permissions (role, permission_id, is_granted)
        VALUES ('marketing_manager', perm_id, true)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to seed permissions
SELECT seed_partner_role_permissions();

-- ===== COMMENTS =====

COMMENT ON TABLE role_hierarchy IS 'Defines permission inheritance relationships between roles';
COMMENT ON COLUMN role_hierarchy.inheritance_level IS 'Number of levels deep in the hierarchy (1 = direct child)';

