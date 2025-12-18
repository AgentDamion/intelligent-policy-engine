-- Create policy_templates table
CREATE TABLE public.policy_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  industry TEXT NOT NULL,
  compliance_frameworks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  base_pom JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.policy_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view policy templates
CREATE POLICY "Anyone can view policy templates"
ON public.policy_templates
FOR SELECT
USING (true);

-- Only admins can manage policy templates
CREATE POLICY "Admins can manage policy templates"
ON public.policy_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_policy_templates_updated_at
BEFORE UPDATE ON public.policy_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();