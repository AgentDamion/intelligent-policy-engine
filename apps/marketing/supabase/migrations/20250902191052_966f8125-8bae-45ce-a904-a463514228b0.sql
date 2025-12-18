-- Create storage buckets for file management
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('evidence', 'evidence', false),
  ('exports', 'exports', false),
  ('quarantine', 'quarantine', false);

-- RLS policies for evidence bucket
CREATE POLICY "Users can upload their own evidence files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own evidence files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own evidence files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own evidence files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for exports bucket (user can read their own exports, edge functions can write with service role)
CREATE POLICY "Users can view their own export files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for quarantine bucket (edge functions only via service role)
CREATE POLICY "Service role can manage quarantine files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'quarantine');