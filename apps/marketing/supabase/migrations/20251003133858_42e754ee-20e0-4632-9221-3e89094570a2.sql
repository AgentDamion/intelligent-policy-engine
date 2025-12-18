-- Policy Ingestion & Lane Classification System (fixed)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enterprise members can view their policies" ON policy_master;
DROP POLICY IF EXISTS "Enterprise admins can manage policies" ON policy_master;
DROP POLICY IF EXISTS "Enterprise members can view clauses" ON policy_clauses;
DROP POLICY IF EXISTS "Enterprise admins can manage clauses" ON policy_clauses;
DROP POLICY IF EXISTS "Enterprise members can view overlays" ON policy_client_overlays;
DROP POLICY IF EXISTS "Enterprise admins can manage overlays" ON policy_client_overlays;
DROP POLICY IF EXISTS "Enterprise members can view parse jobs" ON policy_parse_jobs;
DROP POLICY IF EXISTS "Enterprise members can create parse jobs" ON policy_parse_jobs;
DROP POLICY IF EXISTS "Enterprise admins can manage parse jobs" ON policy_parse_jobs;
DROP POLICY IF EXISTS "Enterprise members can view review queue" ON clause_review_queue;
DROP POLICY IF EXISTS "Reviewers can update review queue" ON clause_review_queue;

-- Core policy table with tenant isolation
CREATE TABLE IF NOT EXISTS policy_master (
  id TEXT PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','approved','deprecated')),
  owner TEXT,
  effective_date DATE,
  review_cycle_months INTEGER,
  raw_doc_url TEXT,
  tool_identity JSONB DEFAULT '{}'::jsonb,
  classification JSONB DEFAULT '{}'::jsonb,
  regionality JSONB DEFAULT '{}'::jsonb,
  allowed_use_cases TEXT[],
  prohibited_use_cases TEXT[],
  retention JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enterprise_id, id)
);

-- Policy clauses with lane classification
CREATE TABLE IF NOT EXISTS policy_clauses (
  id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL,
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  clause_ref TEXT,
  clause_title TEXT,
  clause_text TEXT NOT NULL,
  lane TEXT CHECK (lane IN ('governance_compliance','security_access','integration_scalability','business_ops')),
  lane_confidence NUMERIC CHECK (lane_confidence >= 0 AND lane_confidence <= 1),
  controls TEXT[],
  evidence TEXT[],
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (enterprise_id, policy_id) REFERENCES policy_master(enterprise_id, id) ON DELETE CASCADE
);

-- Client overlays for policy customization
CREATE TABLE IF NOT EXISTS policy_client_overlays (
  id BIGSERIAL PRIMARY KEY,
  policy_id TEXT NOT NULL,
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (enterprise_id, policy_id) REFERENCES policy_master(enterprise_id, id) ON DELETE CASCADE
);

-- Ingestion job tracking
CREATE TABLE IF NOT EXISTS policy_parse_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  policy_id TEXT,
  source_filename TEXT NOT NULL,
  source_mime TEXT,
  status TEXT CHECK (status IN ('uploaded','parsed','normalized','classified','needs_review','committed','failed')) DEFAULT 'uploaded',
  errors JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- HITL review queue for low-confidence clauses
CREATE TABLE IF NOT EXISTS clause_review_queue (
  id BIGSERIAL PRIMARY KEY,
  policy_id TEXT NOT NULL,
  clause_id TEXT NOT NULL,
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  lane_suggested TEXT CHECK (lane_suggested IN ('governance_compliance','security_access','integration_scalability','business_ops')),
  lane_confidence NUMERIC,
  reason TEXT,
  reviewer_id UUID REFERENCES profiles(id),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_lane TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_master_enterprise ON policy_master(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_policy_clauses_policy ON policy_clauses(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_clauses_lane ON policy_clauses(lane);
CREATE INDEX IF NOT EXISTS idx_policy_parse_jobs_enterprise ON policy_parse_jobs(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_clause_review_queue_resolved ON clause_review_queue(resolved, enterprise_id);

-- View for lane statistics rollup
CREATE OR REPLACE VIEW v_policy_lane_counts AS
SELECT
  p.id AS policy_id,
  p.enterprise_id,
  p.title,
  p.version,
  p.status,
  jsonb_build_object(
    'governance_compliance', COALESCE(SUM((c.lane='governance_compliance')::int),0),
    'security_access', COALESCE(SUM((c.lane='security_access')::int),0),
    'integration_scalability', COALESCE(SUM((c.lane='integration_scalability')::int),0),
    'business_ops', COALESCE(SUM((c.lane='business_ops')::int),0),
    'total', COUNT(c.id),
    'avg_confidence', ROUND(AVG(c.lane_confidence)::numeric, 2)
  ) AS lane_statistics
FROM policy_master p
LEFT JOIN policy_clauses c ON c.policy_id = p.id AND c.enterprise_id = p.enterprise_id
GROUP BY p.id, p.enterprise_id, p.title, p.version, p.status;

-- RLS policies for multi-tenant isolation
ALTER TABLE policy_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_client_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_parse_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clause_review_queue ENABLE ROW LEVEL SECURITY;

-- Policy master RLS
CREATE POLICY "Enterprise members can view their policies"
  ON policy_master FOR SELECT
  USING (enterprise_id IN (SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()));

CREATE POLICY "Enterprise admins can manage policies"
  ON policy_master FOR ALL
  USING (
    enterprise_id IN (
      SELECT em.enterprise_id 
      FROM enterprise_members em 
      WHERE em.user_id = auth.uid() AND em.role IN ('admin', 'owner')
    )
  );

-- Policy clauses RLS
CREATE POLICY "Enterprise members can view clauses"
  ON policy_clauses FOR SELECT
  USING (enterprise_id IN (SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()));

CREATE POLICY "Enterprise admins can manage clauses"
  ON policy_clauses FOR ALL
  USING (
    enterprise_id IN (
      SELECT em.enterprise_id 
      FROM enterprise_members em 
      WHERE em.user_id = auth.uid() AND em.role IN ('admin', 'owner')
    )
  );

-- Client overlays RLS
CREATE POLICY "Enterprise members can view overlays"
  ON policy_client_overlays FOR SELECT
  USING (enterprise_id IN (SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()));

CREATE POLICY "Enterprise admins can manage overlays"
  ON policy_client_overlays FOR ALL
  USING (
    enterprise_id IN (
      SELECT em.enterprise_id 
      FROM enterprise_members em 
      WHERE em.user_id = auth.uid() AND em.role IN ('admin', 'owner')
    )
  );

-- Parse jobs RLS
CREATE POLICY "Enterprise members can view parse jobs"
  ON policy_parse_jobs FOR SELECT
  USING (enterprise_id IN (SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()));

CREATE POLICY "Enterprise members can create parse jobs"
  ON policy_parse_jobs FOR INSERT
  WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()));

CREATE POLICY "Enterprise admins can manage parse jobs"
  ON policy_parse_jobs FOR ALL
  USING (
    enterprise_id IN (
      SELECT em.enterprise_id 
      FROM enterprise_members em 
      WHERE em.user_id = auth.uid() AND em.role IN ('admin', 'owner')
    )
  );

-- Review queue RLS
CREATE POLICY "Enterprise members can view review queue"
  ON clause_review_queue FOR SELECT
  USING (enterprise_id IN (SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()));

CREATE POLICY "Reviewers can update review queue"
  ON clause_review_queue FOR UPDATE
  USING (
    enterprise_id IN (SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_policy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS policy_master_updated_at ON policy_master;
CREATE TRIGGER policy_master_updated_at
  BEFORE UPDATE ON policy_master
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_updated_at();