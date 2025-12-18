-- RLS policies for policy-requests storage bucket
-- Allow workspace members to upload policy request documents

-- Allow workspace members to insert files into their workspace folder
CREATE POLICY "Workspace members can upload policy request files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'policy-requests' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow workspace members to view their workspace's policy request files
CREATE POLICY "Workspace members can view policy request files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'policy-requests' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow workspace members to update their workspace's policy request files
CREATE POLICY "Workspace members can update policy request files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'policy-requests' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow workspace members to delete their workspace's policy request files
CREATE POLICY "Workspace members can delete policy request files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'policy-requests' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);