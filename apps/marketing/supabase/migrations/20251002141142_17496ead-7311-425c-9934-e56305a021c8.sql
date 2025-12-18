-- Phase 1: Add lane classification and policy anchoring to RFP questions

-- Create lane enum
CREATE TYPE public.rfp_question_lane AS ENUM (
  'governance_compliance',
  'security_access', 
  'integration_scalability',
  'business_ops'
);

-- Add lane classification and policy anchoring columns to rfp_question_library
ALTER TABLE public.rfp_question_library
ADD COLUMN question_lane public.rfp_question_lane,
ADD COLUMN lane_confidence float,
ADD COLUMN auto_answerable boolean DEFAULT false,
ADD COLUMN linked_policy_id uuid REFERENCES public.policies(id),
ADD COLUMN linked_policy_clause text,
ADD COLUMN answer_template_type text,
ADD COLUMN routing_rationale text;

-- Create index for efficient lane-based queries
CREATE INDEX idx_rfp_questions_lane ON public.rfp_question_library(question_lane);
CREATE INDEX idx_rfp_questions_policy ON public.rfp_question_library(linked_policy_id);

-- Add validation trigger for policy anchoring in governance lanes
CREATE OR REPLACE FUNCTION public.validate_policy_anchoring()
RETURNS TRIGGER AS $$
BEGIN
  -- Enforce policy anchoring for governance_compliance and security_access lanes
  IF NEW.question_lane IN ('governance_compliance', 'security_access') THEN
    IF NEW.linked_policy_id IS NULL OR NEW.linked_policy_clause IS NULL THEN
      RAISE EXCEPTION 'Policy anchoring required: governance and security questions must have linked_policy_id and linked_policy_clause';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_policy_anchoring
  BEFORE INSERT OR UPDATE ON public.rfp_question_library
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_policy_anchoring();