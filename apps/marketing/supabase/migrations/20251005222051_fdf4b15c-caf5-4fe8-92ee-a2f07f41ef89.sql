-- Create policy-requests storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'policy-requests',
  'policy-requests',
  false,
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing restrictive policies on policy-requests bucket
DROP POLICY IF EXISTS "Users can upload to policy-requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can view policy-requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete policy-requests" ON storage.objects;

-- Create permissive policies for development (no RLS restrictions)
CREATE POLICY "Allow all authenticated uploads to policy-requests"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'policy-requests');

CREATE POLICY "Allow all authenticated reads from policy-requests"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'policy-requests');

CREATE POLICY "Allow all authenticated deletes from policy-requests"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'policy-requests');

CREATE POLICY "Allow all authenticated updates to policy-requests"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'policy-requests');

-- Log the change
INSERT INTO public.audit_events (event_type, details)
VALUES (
  'storage_policies_updated',
  jsonb_build_object(
    'bucket_name', 'policy-requests',
    'action', 'Made bucket accessible for development',
    'note', 'RLS policies made permissive for authenticated users during development'
  )
);