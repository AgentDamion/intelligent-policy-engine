-- Dashboard Materialized Views for Performance
-- File: database/migrations/013_create_dashboard_materialized_views.sql

-- ===== ENTERPRISE DASHBOARD CACHE =====

CREATE MATERIALIZED VIEW IF NOT EXISTS enterprise_dashboard_cache AS
SELECT 
    e.id as enterprise_id,
    e.name as enterprise_name,
    e.type as enterprise_type,
    e.subscription_tier,
    e.subscription_status,
    
    -- User counts
    COUNT(DISTINCT uc.user_id) as total_users,
    COUNT(DISTINCT CASE WHEN uc.is_active = true THEN uc.user_id END) as active_users,
    
    -- Seat counts
    COUNT(DISTINCT as.id) as total_seats,
    COUNT(DISTINCT CASE WHEN as.is_active = true THEN as.id END) as active_seats,
    
    -- Policy counts
    COUNT(DISTINCT p.id) as total_policies,
    COUNT(DISTINCT CASE WHEN p.is_active = true THEN p.id END) as active_policies,
    
    -- Compliance metrics
    COALESCE(AVG(per.compliance_score), 0) as avg_partner_compliance_score,
    COUNT(DISTINCT CASE WHEN per.relationship_status = 'active' THEN per.id END) as active_partner_relationships,
    
    -- Recent activity
    COUNT(DISTINCT CASE WHEN cal.created_at > NOW() - INTERVAL '7 days' THEN cal.id END) as recent_actions,
    MAX(cal.created_at) as last_activity
    
FROM enterprises e
LEFT JOIN user_contexts uc ON e.id = uc.enterprise_id
LEFT JOIN agency_seats as ON e.id = as.enterprise_id
LEFT JOIN policies p ON e.id = p.enterprise_id
LEFT JOIN partner_enterprise_relationships per ON e.id = per.client_enterprise_id
LEFT JOIN context_audit_log cal ON e.id = cal.context_id::uuid -- Simplified, may need adjustment
GROUP BY e.id, e.name, e.type, e.subscription_tier, e.subscription_status;

-- Index for enterprise dashboard cache
CREATE UNIQUE INDEX IF NOT EXISTS idx_enterprise_dashboard_cache_enterprise_id 
    ON enterprise_dashboard_cache(enterprise_id);

-- ===== PARTNER DASHBOARD CACHE =====

CREATE MATERIALIZED VIEW IF NOT EXISTS partner_dashboard_cache AS
SELECT 
    pe.id as partner_enterprise_id,
    pe.name as partner_enterprise_name,
    
    -- Client counts
    COUNT(DISTINCT per.client_enterprise_id) as total_clients,
    COUNT(DISTINCT CASE WHEN per.relationship_status = 'active' THEN per.client_enterprise_id END) as active_clients,
    
    -- Relationship metrics
    AVG(per.compliance_score) as avg_compliance_score,
    COUNT(DISTINCT CASE WHEN per.risk_level = 'high' OR per.risk_level = 'critical' THEN per.id END) as high_risk_relationships,
    
    -- User counts
    COUNT(DISTINCT pcc.user_id) as total_partner_users,
    COUNT(DISTINCT CASE WHEN pcc.is_active = true THEN pcc.user_id END) as active_partner_users,
    
    -- Submission metrics (if tool_submissions table exists)
    COUNT(DISTINCT CASE WHEN ts.created_at > NOW() - INTERVAL '30 days' THEN ts.id END) as recent_submissions,
    COUNT(DISTINCT CASE WHEN ts.status = 'pending' THEN ts.id END) as pending_submissions,
    COUNT(DISTINCT CASE WHEN ts.status = 'approved' THEN ts.id END) as approved_submissions,
    
    -- Last activity
    MAX(GREATEST(
        COALESCE(per.updated_at, '1970-01-01'::timestamp),
        COALESCE(pcc.last_accessed, '1970-01-01'::timestamp),
        COALESCE(ts.created_at, '1970-01-01'::timestamp)
    )) as last_activity
    
FROM enterprises pe
LEFT JOIN partner_enterprise_relationships per ON pe.id = per.partner_enterprise_id
LEFT JOIN partner_client_contexts pcc ON pe.id = pcc.partner_enterprise_id
LEFT JOIN tool_submissions ts ON pe.id = ts.partner_enterprise_id
WHERE pe.type = 'partner' OR pe.type = 'agency'
GROUP BY pe.id, pe.name;

-- Index for partner dashboard cache
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_dashboard_cache_partner_id 
    ON partner_dashboard_cache(partner_enterprise_id);

-- ===== COMPLIANCE METRICS CACHE =====

CREATE MATERIALIZED VIEW IF NOT EXISTS compliance_metrics_cache AS
SELECT 
    e.id as enterprise_id,
    e.name as enterprise_name,
    
    -- Policy compliance
    COUNT(DISTINCT p.id) as total_policies,
    COUNT(DISTINCT CASE WHEN p.is_active = true THEN p.id END) as active_policies,
    
    -- Partner compliance
    AVG(per.compliance_score) as avg_partner_compliance,
    COUNT(DISTINCT CASE WHEN per.compliance_score < 70 THEN per.id END) as low_compliance_partners,
    
    -- Risk assessment
    COUNT(DISTINCT CASE WHEN per.risk_level = 'critical' THEN per.id END) as critical_risk_relationships,
    COUNT(DISTINCT CASE WHEN per.risk_level = 'high' THEN per.id END) as high_risk_relationships,
    
    -- Audit activity
    COUNT(DISTINCT CASE WHEN cal.action LIKE '%violation%' THEN cal.id END) as total_violations,
    COUNT(DISTINCT CASE WHEN cal.action LIKE '%violation%' AND cal.created_at > NOW() - INTERVAL '30 days' THEN cal.id END) as recent_violations,
    
    -- Last audit
    MAX(cal.created_at) as last_audit_date
    
FROM enterprises e
LEFT JOIN policies p ON e.id = p.enterprise_id
LEFT JOIN partner_enterprise_relationships per ON e.id = per.client_enterprise_id
LEFT JOIN context_audit_log cal ON e.id = cal.context_id::uuid -- Simplified
GROUP BY e.id, e.name;

-- Index for compliance metrics cache
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_metrics_cache_enterprise_id 
    ON compliance_metrics_cache(enterprise_id);

-- ===== REFRESH FUNCTIONS =====

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_dashboard_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY enterprise_dashboard_cache;
    REFRESH MATERIALIZED VIEW CONCURRENTLY partner_dashboard_cache;
    REFRESH MATERIALIZED VIEW CONCURRENTLY compliance_metrics_cache;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh enterprise dashboard for specific enterprise
CREATE OR REPLACE FUNCTION refresh_enterprise_dashboard(p_enterprise_id UUID)
RETURNS void AS $$
BEGIN
    -- For now, refresh all (could be optimized to refresh specific enterprise)
    REFRESH MATERIALIZED VIEW CONCURRENTLY enterprise_dashboard_cache;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh partner dashboard for specific partner
CREATE OR REPLACE FUNCTION refresh_partner_dashboard(p_partner_id UUID)
RETURNS void AS $$
BEGIN
    -- For now, refresh all (could be optimized to refresh specific partner)
    REFRESH MATERIALIZED VIEW CONCURRENTLY partner_dashboard_cache;
END;
$$ LANGUAGE plpgsql;

-- ===== COMMENTS =====

COMMENT ON MATERIALIZED VIEW enterprise_dashboard_cache IS 'Cached aggregated metrics for enterprise dashboards';
COMMENT ON MATERIALIZED VIEW partner_dashboard_cache IS 'Cached aggregated metrics for partner dashboards';
COMMENT ON MATERIALIZED VIEW compliance_metrics_cache IS 'Cached compliance metrics for enterprises';
COMMENT ON FUNCTION refresh_all_dashboard_views() IS 'Refreshes all dashboard materialized views concurrently';

