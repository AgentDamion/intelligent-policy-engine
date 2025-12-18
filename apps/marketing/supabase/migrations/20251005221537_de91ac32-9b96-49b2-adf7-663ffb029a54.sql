-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'policy-documents',
  'policy-documents',
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

-- Storage policies for policy documents bucket
CREATE POLICY "Authenticated users can upload policy documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'policy-documents'
);

CREATE POLICY "Users can view policy documents in their enterprise"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'policy-documents'
  AND (
    -- Extract enterprise_id from path pattern: enterprise_id/filename
    (storage.foldername(name))[1]::uuid IN (
      SELECT enterprise_id 
      FROM enterprise_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their uploaded documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'policy-documents'
  AND owner = auth.uid()
);

-- Add metadata columns to policies table for document tracking
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS source_document_path text,
ADD COLUMN IF NOT EXISTS document_metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.policies.source_document_path IS 'Storage path to original uploaded document';
COMMENT ON COLUMN public.policies.document_metadata IS 'Original document metadata (filename, size, type, etc.)';

-- Create audit log entry
INSERT INTO public.audit_events (event_type, details)
VALUES (
  'storage_bucket_created',
  jsonb_build_object(
    'bucket_name', 'policy-documents',
    'purpose', 'Policy document uploads and import wizard',
    'file_types', ARRAY['PDF', 'DOCX', 'DOC', 'TXT'],
    'max_size_mb', 20
  )
);