-- Create assessments table for storing completed assessment results
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_type TEXT,
  organization_size TEXT,
  organization_name TEXT,
  composite_score INTEGER NOT NULL,
  band TEXT NOT NULL CHECK (band IN ('blocked', 'cautious', 'enabled', 'native')),
  confidence REAL NOT NULL,
  projected_tta INTEGER,
  domain_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  must_pass_gates JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment_progress table for save/resume functionality
CREATE TABLE public.assessment_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  organization_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessments
CREATE POLICY "Users can view their own assessments" 
  ON public.assessments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments" 
  ON public.assessments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments" 
  ON public.assessments FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for assessment_progress
CREATE POLICY "Anyone can create assessment progress" 
  ON public.assessment_progress FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Token holders can view progress" 
  ON public.assessment_progress FOR SELECT 
  USING (true);

CREATE POLICY "Token holders can update progress" 
  ON public.assessment_progress FOR UPDATE 
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX idx_assessments_created_at ON public.assessments(created_at);
CREATE INDEX idx_assessment_progress_token ON public.assessment_progress(token);
CREATE INDEX idx_assessment_progress_email ON public.assessment_progress(email);
CREATE INDEX idx_assessment_progress_expires_at ON public.assessment_progress(expires_at);

-- Create function to generate secure tokens
CREATE OR REPLACE FUNCTION public.generate_assessment_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired progress
CREATE OR REPLACE FUNCTION public.cleanup_expired_assessment_progress()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.assessment_progress 
  WHERE expires_at < now() 
    AND completed_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for updating timestamps
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_progress_updated_at
  BEFORE UPDATE ON public.assessment_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();