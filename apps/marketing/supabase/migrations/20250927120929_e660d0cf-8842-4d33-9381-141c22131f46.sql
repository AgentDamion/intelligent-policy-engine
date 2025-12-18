-- Fix security warnings by setting search_path for functions

-- Fix assign_reviewers_by_expertise function
CREATE OR REPLACE FUNCTION assign_reviewers_by_expertise(
  policy_content text,
  enterprise_id_param uuid,
  workflow_type text DEFAULT 'standard'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignments jsonb;
  technical_reviewers text[];
  compliance_reviewers text[];
  final_approvers text[];
BEGIN
  -- Initialize assignments object
  assignments := '{"stages": []}';
  
  -- Get technical reviewers (users with technical background)
  SELECT ARRAY_AGG(DISTINCT p.id::text)
  INTO technical_reviewers
  FROM profiles p
  JOIN enterprise_members em ON em.user_id = p.id
  WHERE em.enterprise_id = enterprise_id_param
    AND em.role IN ('admin', 'member')
    AND p.account_type = 'enterprise'
  LIMIT 2;
  
  -- Get compliance reviewers 
  SELECT ARRAY_AGG(DISTINCT p.id::text)
  INTO compliance_reviewers
  FROM profiles p
  JOIN enterprise_members em ON em.user_id = p.id
  WHERE em.enterprise_id = enterprise_id_param
    AND em.role IN ('admin', 'owner')
    AND p.account_type = 'enterprise'
  LIMIT 1;
  
  -- Get final approvers (enterprise owners/admins)
  SELECT ARRAY_AGG(DISTINCT p.id::text)
  INTO final_approvers
  FROM profiles p
  JOIN enterprise_members em ON em.user_id = p.id
  WHERE em.enterprise_id = enterprise_id_param
    AND em.role = 'owner'
  LIMIT 1;
  
  -- Build the assignment structure
  assignments := jsonb_build_object(
    'stages', jsonb_build_array(
      jsonb_build_object(
        'name', 'Initial Review',
        'assignees', COALESCE(technical_reviewers, ARRAY['system']::text[]),
        'estimatedDuration', 24,
        'required_approvals', 1
      ),
      jsonb_build_object(
        'name', 'Technical Validation', 
        'assignees', COALESCE(technical_reviewers, ARRAY['system']::text[]),
        'estimatedDuration', 48,
        'required_approvals', 1
      ),
      jsonb_build_object(
        'name', 'Compliance Check',
        'assignees', COALESCE(compliance_reviewers, ARRAY['system']::text[]),
        'estimatedDuration', 72,
        'required_approvals', 1
      ),
      jsonb_build_object(
        'name', 'Final Approval',
        'assignees', COALESCE(final_approvers, ARRAY['system']::text[]),
        'estimatedDuration', 24,
        'required_approvals', 1
      )
    )
  );
  
  RETURN assignments;
END;
$$;

-- Fix check_workflow_bottlenecks function
CREATE OR REPLACE FUNCTION check_workflow_bottlenecks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workflow_record record;
  current_stage_duration interval;
  escalation_threshold interval;
BEGIN
  -- Check all active workflows
  FOR workflow_record IN 
    SELECT * FROM approval_workflows 
    WHERE current_stage != 'Final Approval'
      AND bottleneck_detected = false
      AND updated_at < NOW() - interval '24 hours'
  LOOP
    -- Calculate how long current stage has been active
    current_stage_duration := NOW() - workflow_record.updated_at;
    
    -- Set escalation threshold based on estimated duration 
    escalation_threshold := (
      SELECT ((stages->jsonb_array_length(stages)-1)->>'estimatedDuration')::integer * interval '1 hour' * 1.5
      FROM approval_workflows 
      WHERE id = workflow_record.id
    );
    
    -- If current stage is taking longer than 1.5x estimated time, mark as bottleneck
    IF current_stage_duration > escalation_threshold THEN
      UPDATE approval_workflows 
      SET 
        bottleneck_detected = true,
        escalation_triggered = true,
        updated_at = NOW()
      WHERE id = workflow_record.id;
      
      -- Log the bottleneck detection
      INSERT INTO audit_events (
        event_type,
        entity_type,
        entity_id,
        workspace_id,
        enterprise_id,
        details
      ) VALUES (
        'workflow_bottleneck_detected',
        'approval_workflow',
        workflow_record.id,
        workflow_record.workspace_id,
        workflow_record.enterprise_id,
        jsonb_build_object(
          'workflow_name', workflow_record.workflow_name,
          'current_stage', workflow_record.current_stage,
          'duration_hours', EXTRACT(EPOCH FROM current_stage_duration) / 3600,
          'threshold_hours', EXTRACT(EPOCH FROM escalation_threshold) / 3600
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- Fix update_workflow_due_date function
CREATE OR REPLACE FUNCTION update_workflow_due_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Set started_at if not already set and workflow is starting
  IF NEW.started_at IS NULL AND NEW.current_stage IS NOT NULL THEN
    NEW.started_at := NOW();
  END IF;
  
  -- Calculate due date based on SLA
  IF NEW.due_date IS NULL OR OLD.sla_hours != NEW.sla_hours THEN
    NEW.due_date := COALESCE(NEW.started_at, NEW.created_at) + (NEW.sla_hours || ' hours')::interval;
  END IF;
  
  -- Update estimated completion
  NEW.estimated_completion := NEW.due_date;
  
  RETURN NEW;
END;
$$;