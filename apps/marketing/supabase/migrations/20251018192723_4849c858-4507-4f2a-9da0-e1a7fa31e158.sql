-- =====================================================
-- CONTROL TOWER DATABASE SCHEMA
-- Creates 5 new tables for Super Admin Control Tower
-- =====================================================

-- 1. RISK_SNAPSHOT: Org/Brand/Tenant aggregated risk scores
CREATE TABLE IF NOT EXISTS public.risk_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_id UUID, -- nullable for org-level rollups
  
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  pre NUMERIC NOT NULL CHECK (pre >= 0 AND pre <= 100),
  in_run NUMERIC NOT NULL CHECK (in_run >= 0 AND in_run <= 100),
  post NUMERIC NOT NULL CHECK (post >= 0 AND post <= 100),
  
  sev1_cnt INTEGER DEFAULT 0 CHECK (sev1_cnt >= 0),
  sev2_cnt INTEGER DEFAULT 0 CHECK (sev2_cnt >= 0),
  sev3_cnt INTEGER DEFAULT 0 CHECK (sev3_cnt >= 0),
  
  trend_7d NUMERIC, -- Δ score from 7 days ago
  trend_30d NUMERIC,
  
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_snapshot_enterprise ON public.risk_snapshot(enterprise_id, ts DESC);
CREATE INDEX idx_risk_snapshot_workspace ON public.risk_snapshot(workspace_id, ts DESC);
CREATE INDEX idx_risk_snapshot_ts ON public.risk_snapshot(ts DESC);

-- Enable RLS
ALTER TABLE public.risk_snapshot ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins see all; workspace members see filtered
CREATE POLICY "admin_full_risk_snapshot" ON public.risk_snapshot
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "workspace_filtered_risk_snapshot" ON public.risk_snapshot
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Realtime
ALTER TABLE public.risk_snapshot REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_snapshot;

-- 2. INCIDENT: Violations, blocked runs, proof bundles
CREATE TABLE IF NOT EXISTS public.incident (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  policy_id UUID, -- nullable if not policy-related
  
  severity TEXT NOT NULL CHECK (severity IN ('sev1', 'sev2', 'sev3')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'muted')),
  
  tool_id UUID, -- reference to marketplace_tools or project_ai_tool_usage
  tool_class TEXT CHECK (tool_class IN ('homegrown', 'third_party', 'genai_creative', 'assistive_productivity', 'data_transform')),
  
  title TEXT NOT NULL,
  description TEXT,
  evidence_url TEXT, -- Link to proof bundle PDF
  pii_data BOOLEAN DEFAULT FALSE,
  phi_data BOOLEAN DEFAULT FALSE,
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  mute_reason TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incident_workspace ON public.incident(workspace_id, status, severity);
CREATE INDEX idx_incident_enterprise ON public.incident(enterprise_id, status);
CREATE INDEX idx_incident_status ON public.incident(status, severity);
CREATE INDEX idx_incident_started_at ON public.incident(started_at DESC);

-- Enable RLS
ALTER TABLE public.incident ENABLE ROW LEVEL SECURITY;

-- RLS: Admins see all, workspace members see their incidents
CREATE POLICY "admin_full_incidents" ON public.incident
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "workspace_incidents" ON public.incident
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_insert_incidents" ON public.incident
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_update_incidents" ON public.incident
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Realtime
ALTER TABLE public.incident REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident;

-- Trigger: Update updated_at
CREATE TRIGGER update_incident_updated_at
  BEFORE UPDATE ON public.incident
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. TENANT_HEALTH: RLS checks, MFA, connectors
CREATE TABLE IF NOT EXISTS public.tenant_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  rls_ok BOOLEAN DEFAULT TRUE,
  rls_last_check TIMESTAMPTZ,
  rls_failures JSONB DEFAULT '[]', -- Array of failed RLS checks
  
  mfa_rate NUMERIC DEFAULT 0 CHECK (mfa_rate >= 0 AND mfa_rate <= 100),
  mfa_enabled_users INTEGER DEFAULT 0,
  mfa_total_users INTEGER DEFAULT 0,
  
  connector_uptime NUMERIC DEFAULT 100 CHECK (connector_uptime >= 0 AND connector_uptime <= 100),
  connector_status JSONB DEFAULT '{}', -- {stripe: 'ok', slack: 'down'}
  
  job_latency_ms INTEGER DEFAULT 0 CHECK (job_latency_ms >= 0),
  error_rate NUMERIC DEFAULT 0 CHECK (error_rate >= 0 AND error_rate <= 100),
  error_count_24h INTEGER DEFAULT 0,
  
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tenant_health_workspace ON public.tenant_health(workspace_id);
CREATE INDEX idx_tenant_health_heartbeat ON public.tenant_health(last_heartbeat DESC);

-- Enable RLS
ALTER TABLE public.tenant_health ENABLE ROW LEVEL SECURITY;

-- RLS: Admins see all, workspace members see their health
CREATE POLICY "admin_full_health" ON public.tenant_health
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "workspace_health" ON public.tenant_health
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Realtime
ALTER TABLE public.tenant_health REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_health;

-- Trigger: Update updated_at
CREATE TRIGGER update_tenant_health_updated_at
  BEFORE UPDATE ON public.tenant_health
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. AGENCY_TASK: Missing disclosures, attestations
CREATE TABLE IF NOT EXISTS public.agency_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('missing_disclosure', 'attestation_due', 'policy_update', 'compliance_check')),
  title TEXT NOT NULL,
  description TEXT,
  
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'overdue')),
  
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agency_task_workspace ON public.agency_task(workspace_id, status);
CREATE INDEX idx_agency_task_assigned ON public.agency_task(assigned_to, status);
CREATE INDEX idx_agency_task_due ON public.agency_task(due_at);

-- Enable RLS
ALTER TABLE public.agency_task ENABLE ROW LEVEL SECURITY;

-- RLS: Workspace members can manage their tasks
CREATE POLICY "workspace_agency_tasks" ON public.agency_task
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Trigger: Update updated_at
CREATE TRIGGER update_agency_task_updated_at
  BEFORE UPDATE ON public.agency_task
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. POLICY_PROPAGATION_STATUS: Enhanced tracking
CREATE TABLE IF NOT EXISTS public.policy_propagation_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL,
  version TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'approved', 'propagated', 'enforced', 'proven')),
  
  draft_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  propagated_at TIMESTAMPTZ,
  enforced_at TIMESTAMPTZ,
  proven_at TIMESTAMPTZ, -- First proof bundle generated
  
  conflicts_detected INTEGER DEFAULT 0,
  sandbox_delta BOOLEAN DEFAULT FALSE, -- True if sandbox differs from enforced
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(policy_id, version, workspace_id)
);

CREATE INDEX idx_policy_prop_workspace ON public.policy_propagation_status(workspace_id, state);
CREATE INDEX idx_policy_prop_state ON public.policy_propagation_status(state);
CREATE INDEX idx_policy_prop_policy ON public.policy_propagation_status(policy_id, version);

-- Enable RLS
ALTER TABLE public.policy_propagation_status ENABLE ROW LEVEL SECURITY;

-- RLS: Admins see all, workspace members see theirs
CREATE POLICY "admin_policy_prop" ON public.policy_propagation_status
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "workspace_policy_prop" ON public.policy_propagation_status
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Realtime
ALTER TABLE public.policy_propagation_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.policy_propagation_status;

-- Trigger: Update updated_at
CREATE TRIGGER update_policy_prop_updated_at
  BEFORE UPDATE ON public.policy_propagation_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUDIT LOGGING FOR CONTROL TOWER TABLES
-- =====================================================

-- Log incident changes
CREATE OR REPLACE FUNCTION public.log_incident_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_events (
    event_type,
    entity_type,
    entity_id,
    user_id,
    workspace_id,
    enterprise_id,
    details
  ) VALUES (
    TG_OP || '_INCIDENT',
    'incident',
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    COALESCE(NEW.workspace_id, OLD.workspace_id),
    COALESCE(NEW.enterprise_id, OLD.enterprise_id),
    jsonb_build_object(
      'operation', TG_OP,
      'severity', COALESCE(NEW.severity, OLD.severity),
      'status', COALESCE(NEW.status, OLD.status),
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_incident_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.incident
  FOR EACH ROW
  EXECUTE FUNCTION public.log_incident_changes();

-- Log health changes
CREATE OR REPLACE FUNCTION public.log_health_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log significant changes (rls_ok flip, uptime drop)
  IF (TG_OP = 'UPDATE' AND (
    (OLD.rls_ok IS DISTINCT FROM NEW.rls_ok) OR
    (ABS(OLD.connector_uptime - NEW.connector_uptime) > 5)
  )) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_events (
      event_type,
      entity_type,
      entity_id,
      workspace_id,
      enterprise_id,
      details
    ) VALUES (
      TG_OP || '_TENANT_HEALTH',
      'tenant_health',
      NEW.id,
      NEW.workspace_id,
      NEW.enterprise_id,
      jsonb_build_object(
        'rls_ok', NEW.rls_ok,
        'mfa_rate', NEW.mfa_rate,
        'connector_uptime', NEW.connector_uptime,
        'old_rls_ok', OLD.rls_ok,
        'old_uptime', OLD.connector_uptime
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_health_changes
  AFTER INSERT OR UPDATE ON public.tenant_health
  FOR EACH ROW
  EXECUTE FUNCTION public.log_health_changes();

-- Log task changes
CREATE OR REPLACE FUNCTION public.log_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_events (
    event_type,
    entity_type,
    entity_id,
    user_id,
    workspace_id,
    enterprise_id,
    details
  ) VALUES (
    TG_OP || '_AGENCY_TASK',
    'agency_task',
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    COALESCE(NEW.workspace_id, OLD.workspace_id),
    COALESCE(NEW.enterprise_id, OLD.enterprise_id),
    jsonb_build_object(
      'operation', TG_OP,
      'type', COALESCE(NEW.type, OLD.type),
      'status', COALESCE(NEW.status, OLD.status),
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_task_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_task
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_changes();