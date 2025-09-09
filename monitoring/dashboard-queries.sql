-- AICOMPLYR Platform Adapter Monitoring Dashboard Queries

-- 1. Platform Integration Success Rate (Last 24 Hours)
CREATE OR REPLACE VIEW platform_integration_success_rate AS
SELECT 
  pc.platform_type,
  pc.platform_name,
  COUNT(CASE WHEN pil.status = 'success' THEN 1 END)::float / 
    NULLIF(COUNT(*), 0) * 100 as success_rate,
  COUNT(*) as total_integrations,
  COUNT(CASE WHEN pil.status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN pil.status = 'error' THEN 1 END) as failed
FROM platform_integration_logs pil
JOIN platform_configurations pc ON pil.platform_config_id = pc.id
WHERE pil.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY pc.platform_type, pc.platform_name;

-- 2. Average Response Time by Platform
CREATE OR REPLACE VIEW platform_response_times AS
SELECT 
  pc.platform_type,
  pc.platform_name,
  AVG(pil.duration_ms) as avg_response_time_ms,
  MIN(pil.duration_ms) as min_response_time_ms,
  MAX(pil.duration_ms) as max_response_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pil.duration_ms) as median_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pil.duration_ms) as p95_response_time_ms
FROM platform_integration_logs pil
JOIN platform_configurations pc ON pil.platform_config_id = pc.id
WHERE pil.created_at >= NOW() - INTERVAL '24 hours'
  AND pil.duration_ms IS NOT NULL
GROUP BY pc.platform_type, pc.platform_name;

-- 3. Error Rate by Platform and Error Code
CREATE OR REPLACE VIEW platform_error_analysis AS
SELECT 
  pc.platform_type,
  pc.platform_name,
  pil.error_code,
  COUNT(*) as error_count,
  COUNT(*)::float / SUM(COUNT(*)) OVER (PARTITION BY pc.platform_type) * 100 as error_percentage,
  MAX(pil.created_at) as last_occurrence
FROM platform_integration_logs pil
JOIN platform_configurations pc ON pil.platform_config_id = pc.id
WHERE pil.status = 'error'
  AND pil.created_at >= NOW() - INTERVAL '7 days'
GROUP BY pc.platform_type, pc.platform_name, pil.error_code
ORDER BY error_count DESC;

-- 4. Platform Configuration Health Status
CREATE OR REPLACE VIEW platform_config_health AS
SELECT 
  pc.id,
  pc.organization_id,
  pc.platform_type,
  pc.platform_name,
  pc.status,
  pc.connection_status,
  pc.last_connection_test,
  CASE 
    WHEN pc.connection_status = 'connected' THEN 'healthy'
    WHEN pc.connection_status = 'error' THEN 'unhealthy'
    WHEN pc.last_connection_test < NOW() - INTERVAL '1 day' THEN 'stale'
    ELSE 'unknown'
  END as health_status,
  EXTRACT(EPOCH FROM (NOW() - pc.last_connection_test)) / 3600 as hours_since_last_test
FROM platform_configurations pc
WHERE pc.status = 'active';

-- 5. Integration Volume by Hour
CREATE OR REPLACE VIEW platform_integration_volume_hourly AS
SELECT 
  DATE_TRUNC('hour', pil.created_at) as hour,
  pc.platform_type,
  COUNT(*) as integration_count,
  COUNT(CASE WHEN pil.status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN pil.status = 'error' THEN 1 END) as error_count
FROM platform_integration_logs pil
JOIN platform_configurations pc ON pil.platform_config_id = pc.id
WHERE pil.created_at >= NOW() - INTERVAL '48 hours'
GROUP BY DATE_TRUNC('hour', pil.created_at), pc.platform_type
ORDER BY hour DESC;

-- 6. Compliance Integration Pipeline Performance
CREATE OR REPLACE VIEW compliance_to_platform_pipeline AS
SELECT 
  aa.id as activity_id,
  aa.agent,
  aa.action,
  aa.created_at as activity_created,
  aa.platform_integration_status,
  aa.platform_integration_timestamp,
  EXTRACT(EPOCH FROM (aa.platform_integration_timestamp - aa.created_at)) as time_to_integration_seconds,
  cc.score as compliance_score,
  cc.status as compliance_status
FROM agent_activities aa
LEFT JOIN compliance_checks cc ON cc.entity_id = aa.id AND cc.entity_type = 'agent_activity'
WHERE aa.created_at >= NOW() - INTERVAL '24 hours'
  AND aa.platform_integration_status IS NOT NULL;

-- 7. Platform Metrics Aggregation
CREATE OR REPLACE VIEW platform_metrics_summary AS
SELECT 
  pm.platform_config_id,
  pc.platform_type,
  pc.platform_name,
  pm.metric_type,
  SUM(pm.metric_value) as total_value,
  AVG(pm.metric_value) as avg_value,
  COUNT(*) as data_points,
  MAX(pm.recorded_at) as last_recorded
FROM platform_metrics pm
JOIN platform_configurations pc ON pm.platform_config_id = pc.id
WHERE pm.recorded_at >= NOW() - INTERVAL '24 hours'
GROUP BY pm.platform_config_id, pc.platform_type, pc.platform_name, pm.metric_type;

-- 8. Active Alerts Summary
CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT 
  severity,
  COUNT(*) as alert_count,
  MIN(created_at) as oldest_alert,
  MAX(created_at) as newest_alert,
  ARRAY_AGG(DISTINCT title ORDER BY title) as alert_titles
FROM monitoring_alerts
WHERE status = 'active'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY severity
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END;

-- 9. Job Processing Queue Status
CREATE OR REPLACE VIEW platform_job_queue_status AS
SELECT 
  job_type,
  status,
  priority,
  COUNT(*) as job_count,
  MIN(created_at) as oldest_job,
  MAX(created_at) as newest_job,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) / 60 as avg_age_minutes
FROM platform_integration_jobs
WHERE status IN ('pending', 'processing')
GROUP BY job_type, status, priority
ORDER BY priority, status;

-- 10. Organization Platform Usage
CREATE OR REPLACE VIEW organization_platform_usage AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  COUNT(DISTINCT pc.id) as active_platforms,
  COUNT(DISTINCT pil.id) as total_integrations_24h,
  COUNT(DISTINCT CASE WHEN pil.status = 'success' THEN pil.id END) as successful_integrations_24h,
  COUNT(DISTINCT CASE WHEN pil.status = 'error' THEN pil.id END) as failed_integrations_24h,
  ARRAY_AGG(DISTINCT pc.platform_type) as platform_types
FROM organizations o
LEFT JOIN platform_configurations pc ON o.id = pc.organization_id AND pc.status = 'active'
LEFT JOIN platform_integration_logs pil ON pc.id = pil.platform_config_id 
  AND pil.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY o.id, o.name
HAVING COUNT(DISTINCT pc.id) > 0;

-- Function to calculate platform SLA compliance
CREATE OR REPLACE FUNCTION calculate_platform_sla(
  p_platform_type TEXT,
  p_time_window INTERVAL DEFAULT INTERVAL '24 hours'
) RETURNS TABLE (
  platform_type TEXT,
  uptime_percentage NUMERIC,
  avg_response_time_ms NUMERIC,
  error_rate_percentage NUMERIC,
  sla_met BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH platform_stats AS (
    SELECT 
      pc.platform_type,
      COUNT(*) as total_requests,
      COUNT(CASE WHEN pil.status = 'success' THEN 1 END) as successful_requests,
      COUNT(CASE WHEN pil.status = 'error' THEN 1 END) as failed_requests,
      AVG(pil.duration_ms) as avg_duration
    FROM platform_integration_logs pil
    JOIN platform_configurations pc ON pil.platform_config_id = pc.id
    WHERE pc.platform_type = p_platform_type
      AND pil.created_at >= NOW() - p_time_window
    GROUP BY pc.platform_type
  )
  SELECT 
    ps.platform_type,
    ROUND((ps.successful_requests::NUMERIC / NULLIF(ps.total_requests, 0)) * 100, 2) as uptime_percentage,
    ROUND(ps.avg_duration::NUMERIC, 2) as avg_response_time_ms,
    ROUND((ps.failed_requests::NUMERIC / NULLIF(ps.total_requests, 0)) * 100, 2) as error_rate_percentage,
    CASE 
      WHEN (ps.successful_requests::NUMERIC / NULLIF(ps.total_requests, 0)) >= 0.99
        AND ps.avg_duration <= 2000
        AND (ps.failed_requests::NUMERIC / NULLIF(ps.total_requests, 0)) <= 0.01
      THEN true
      ELSE false
    END as sla_met
  FROM platform_stats ps;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS platform_dashboard_summary AS
SELECT 
  NOW() as last_refresh,
  (SELECT COUNT(*) FROM platform_configurations WHERE status = 'active') as active_platforms,
  (SELECT COUNT(*) FROM platform_integration_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as integrations_24h,
  (SELECT AVG(duration_ms) FROM platform_integration_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as avg_response_time_24h,
  (SELECT COUNT(*) FROM platform_integration_logs WHERE status = 'error' AND created_at >= NOW() - INTERVAL '24 hours') as errors_24h,
  (SELECT COUNT(*) FROM monitoring_alerts WHERE status = 'active' AND severity IN ('error', 'critical')) as active_critical_alerts;

-- Refresh materialized view every 5 minutes
CREATE OR REPLACE FUNCTION refresh_platform_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY platform_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (would be done via cron job or pg_cron)
-- SELECT cron.schedule('refresh-platform-dashboard', '*/5 * * * *', 'SELECT refresh_platform_dashboard();');