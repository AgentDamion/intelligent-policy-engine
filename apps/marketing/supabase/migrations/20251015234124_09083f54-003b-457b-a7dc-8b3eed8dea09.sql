-- Fix security warnings from risk scoring migration

-- Fix trigger functions to set search_path
CREATE OR REPLACE FUNCTION trg_recalc_on_change()
RETURNS TRIGGER LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalc_risk_score(NEW.workflow_id);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION trg_workflow_create_risk_score()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO risk_scores (workflow_id) VALUES (NEW.id);
  RETURN NEW;
END $$;

-- Enable RLS on risk_weights table
ALTER TABLE risk_weights ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read risk weights (configuration table)
CREATE POLICY risk_weights_read_all ON risk_weights
FOR SELECT USING (true);

-- Only admins can modify weights
CREATE POLICY risk_weights_admin_only ON risk_weights
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);