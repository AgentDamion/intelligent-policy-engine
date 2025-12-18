-- Add demo user to PartnerAgency Alpha workspace for policy request inbox access
-- This allows the demo user (enterprise.test@aicomply.io) to see policy distributions
-- targeted at the PartnerAgency Alpha workspace

INSERT INTO public.workspace_members (user_id, workspace_id, role)
VALUES (
  '07006852-9243-40e8-b81c-6195e1fc5691', -- Demo user enterprise.test@aicomply.io
  '550e8400-e29b-41d4-a716-446655440002', -- PartnerAgency Alpha workspace
  'admin'::enterprise_role_enum
)
ON CONFLICT (user_id, workspace_id) 
DO UPDATE SET role = 'admin'::enterprise_role_enum;