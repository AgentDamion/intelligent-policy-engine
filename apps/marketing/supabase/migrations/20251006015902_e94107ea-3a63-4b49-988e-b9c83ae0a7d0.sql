-- Add 'webhook_received' to platform_integration_logs operation_type constraint
ALTER TABLE public.platform_integration_logs 
DROP CONSTRAINT IF EXISTS platform_integration_logs_operation_type_check;

ALTER TABLE public.platform_integration_logs 
ADD CONSTRAINT platform_integration_logs_operation_type_check 
CHECK (operation_type IN ('sync', 'test', 'upload', 'download', 'delete', 'webhook_received'));