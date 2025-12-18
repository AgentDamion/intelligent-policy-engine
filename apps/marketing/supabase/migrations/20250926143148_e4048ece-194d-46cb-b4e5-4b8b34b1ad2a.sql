-- Create structured policy data table for AI extraction results
CREATE TABLE public.structured_policy_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID REFERENCES public.enterprises(id),
  workspace_id UUID,
  document_checksum TEXT NOT NULL,
  
  -- Extracted structured fields
  tool_name TEXT,
  tool_name_confidence REAL DEFAULT 0,
  vendor_name TEXT,
  vendor_name_confidence REAL DEFAULT 0,
  approval_status TEXT,
  approval_status_confidence REAL DEFAULT 0,
  use_cases TEXT[] DEFAULT '{}',
  use_cases_confidence REAL DEFAULT 0,
  restrictions TEXT[] DEFAULT '{}',
  restrictions_confidence REAL DEFAULT 0,
  
  -- Additional extracted metadata
  policy_type TEXT,
  document_format TEXT,
  extraction_method TEXT DEFAULT 'ai_agent',
  overall_confidence REAL DEFAULT 0,
  
  -- Extraction audit trail
  raw_extraction_data JSONB DEFAULT '{}',
  human_validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.structured_policy_data ENABLE ROW LEVEL SECURITY;

-- Create policies for structured policy data access
CREATE POLICY "Enterprise members can view structured policy data" 
ON public.structured_policy_data 
FOR SELECT 
USING (enterprise_id = ANY (get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can create structured policy data" 
ON public.structured_policy_data 
FOR INSERT 
WITH CHECK (enterprise_id = ANY (get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can update structured policy data" 
ON public.structured_policy_data 
FOR UPDATE 
USING (enterprise_id = ANY (get_user_enterprises(auth.uid())));

-- Create indexes for performance
CREATE INDEX idx_structured_policy_data_enterprise ON public.structured_policy_data(enterprise_id);
CREATE INDEX idx_structured_policy_data_checksum ON public.structured_policy_data(document_checksum);
CREATE INDEX idx_structured_policy_data_confidence ON public.structured_policy_data(overall_confidence);

-- Create trigger for updated_at
CREATE TRIGGER update_structured_policy_data_updated_at
BEFORE UPDATE ON public.structured_policy_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();