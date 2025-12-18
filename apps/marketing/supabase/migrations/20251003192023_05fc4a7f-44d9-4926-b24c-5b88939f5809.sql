-- Add test user to PartnerAgency Alpha workspace for testing
INSERT INTO public.workspace_members (user_id, workspace_id, role)
VALUES ('07006852-9243-40e8-b81c-6195e1fc5691'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'admin'::enterprise_role_enum)
ON CONFLICT (user_id, workspace_id) DO NOTHING;