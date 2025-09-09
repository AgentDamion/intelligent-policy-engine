-- Universal Platform Adapter Monitoring and Alerting Setup
-- This script sets up comprehensive monitoring for the platform adapter system

-- Create monitoring views for platform integration metrics
CREATE OR REPLACE VIEW platform_integration_metrics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    platform_config_id,
    operation,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY platform_config_id ORDER BY created_at)))) as avg_interval_seconds
FROM platform_integration_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), platform_config_id, operation, status;

-- Create view for platform health status
CREATE OR REPLACE VIEW platform_health_status AS
SELECT 
    pc.platform_type,
    pc.platform_name,
    pc.organization_id,
    pc.connection_status,
    pc.last_connection_test,
    pc.error_message,
    COUNT(pil.id) as total_operations,
    COUNT(pil.id) FILTER (WHERE pil.status = 'success') as successful_operations,
    COUNT(pil.id) FILTER (WHERE pil.status = 'error') as failed_operations,
    CASE 
        WHEN COUNT(pil.id) = 0 THEN 'no_activity'
        WHEN COUNT(pil.id) FILTER (WHERE pil.status = 'error') * 100.0 / COUNT(pil.id) > 20 THEN 'unhealthy'
        WHEN COUNT(pil.id) FILTER (WHERE pil.status = 'error') * 100.0 / COUNT(pil.id) > 10 THEN 'degraded'
        ELSE 'healthy'
    END as health_status
FROM platform_configurations pc
LEFT JOIN platform_integration_logs pil ON pc.id = pil.platform_config_id 
    AND pil.created_at > NOW() - INTERVAL '1 hour'
GROUP BY pc.id, pc.platform_type, pc.platform_name, pc.organization_id, 
         pc.connection_status, pc.last_connection_test, pc.error_message;

-- Create view for job processing metrics
CREATE OR REPLACE VIEW job_processing_metrics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    status,
    priority,
    COUNT(*) as job_count,
    AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, failed_at, NOW()) - created_at))) as avg_processing_time_seconds,
    AVG(retry_count) as avg_retry_count
FROM platform_integration_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), status, priority;

-- Create function to record platform metrics
CREATE OR REPLACE FUNCTION record_platform_metric(
    p_organization_id UUID,
    p_platform_type TEXT,
    p_metric_name TEXT,
    p_metric_value NUMERIC,
    p_metric_unit TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO platform_metrics (
        organization_id,
        platform_type,
        metric_name,
        metric_value,
        metric_unit,
        metadata
    ) VALUES (
        p_organization_id,
        p_platform_type,
        p_metric_name,
        p_metric_value,
        p_metric_unit,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get platform integration summary
CREATE OR REPLACE FUNCTION get_platform_integration_summary(
    p_organization_id UUID DEFAULT NULL,
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    platform_type TEXT,
    total_operations BIGINT,
    successful_operations BIGINT,
    failed_operations BIGINT,
    success_rate NUMERIC,
    avg_processing_time_seconds NUMERIC,
    health_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.platform_type,
        COUNT(pil.id) as total_operations,
        COUNT(pil.id) FILTER (WHERE pil.status = 'success') as successful_operations,
        COUNT(pil.id) FILTER (WHERE pil.status = 'error') as failed_operations,
        CASE 
            WHEN COUNT(pil.id) = 0 THEN 0
            ELSE ROUND(COUNT(pil.id) FILTER (WHERE pil.status = 'success') * 100.0 / COUNT(pil.id), 2)
        END as success_rate,
        AVG(EXTRACT(EPOCH FROM (pil.created_at - LAG(pil.created_at) OVER (PARTITION BY pil.platform_config_id ORDER BY pil.created_at)))) as avg_processing_time_seconds,
        CASE 
            WHEN COUNT(pil.id) = 0 THEN 'no_activity'
            WHEN COUNT(pil.id) FILTER (WHERE pil.status = 'error') * 100.0 / COUNT(pil.id) > 20 THEN 'unhealthy'
            WHEN COUNT(pil.id) FILTER (WHERE pil.status = 'error') * 100.0 / COUNT(pil.id) > 10 THEN 'degraded'
            ELSE 'healthy'
        END as health_status
    FROM platform_configurations pc
    LEFT JOIN platform_integration_logs pil ON pc.id = pil.platform_config_id 
        AND pil.created_at > NOW() - INTERVAL (p_hours_back || ' hours')
    WHERE (p_organization_id IS NULL OR pc.organization_id = p_organization_id)
    GROUP BY pc.platform_type
    ORDER BY total_operations DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to detect and alert on issues
CREATE OR REPLACE FUNCTION check_platform_alerts()
RETURNS TABLE (
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    platform_type TEXT,
    organization_id UUID,
    details JSONB
) AS $$
BEGIN
    -- Check for high error rates
    RETURN QUERY
    SELECT 
        'high_error_rate'::TEXT as alert_type,
        'warning'::TEXT as severity,
        'High error rate detected for ' || pc.platform_type as message,
        pc.platform_type,
        pc.organization_id,
        jsonb_build_object(
            'error_rate', ROUND(COUNT(pil.id) FILTER (WHERE pil.status = 'error') * 100.0 / COUNT(pil.id), 2),
            'total_operations', COUNT(pil.id),
            'failed_operations', COUNT(pil.id) FILTER (WHERE pil.status = 'error')
        ) as details
    FROM platform_configurations pc
    JOIN platform_integration_logs pil ON pc.id = pil.platform_config_id
    WHERE pil.created_at > NOW() - INTERVAL '1 hour'
    GROUP BY pc.id, pc.platform_type, pc.organization_id
    HAVING COUNT(pil.id) FILTER (WHERE pil.status = 'error') * 100.0 / COUNT(pil.id) > 10;

    -- Check for stuck jobs
    RETURN QUERY
    SELECT 
        'stuck_jobs'::TEXT as alert_type,
        'critical'::TEXT as severity,
        'Jobs stuck in processing state for ' || platform_type as message,
        platform_type,
        organization_id,
        jsonb_build_object(
            'stuck_jobs_count', COUNT(*),
            'oldest_job_age_minutes', EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 60
        ) as details
    FROM platform_integration_jobs
    WHERE status = 'processing' 
        AND created_at < NOW() - INTERVAL '30 minutes'
    GROUP BY platform_type, organization_id
    HAVING COUNT(*) > 5;

    -- Check for connection failures
    RETURN QUERY
    SELECT 
        'connection_failure'::TEXT as alert_type,
        'critical'::TEXT as severity,
        'Platform connection failed for ' || platform_type as message,
        platform_type,
        organization_id,
        jsonb_build_object(
            'connection_status', connection_status,
            'error_message', error_message,
            'last_test', last_connection_test
        ) as details
    FROM platform_configurations
    WHERE connection_status = 'error'
        AND last_connection_test > NOW() - INTERVAL '1 hour';

    -- Check for no activity
    RETURN QUERY
    SELECT 
        'no_activity'::TEXT as alert_type,
        'info'::TEXT as severity,
        'No integration activity for ' || pc.platform_type as message,
        pc.platform_type,
        pc.organization_id,
        jsonb_build_object(
            'last_activity', MAX(pil.created_at),
            'hours_since_activity', EXTRACT(EPOCH FROM (NOW() - MAX(pil.created_at))) / 3600
        ) as details
    FROM platform_configurations pc
    LEFT JOIN platform_integration_logs pil ON pc.id = pil.platform_config_id
    WHERE pc.status = 'active'
    GROUP BY pc.id, pc.platform_type, pc.organization_id
    HAVING MAX(pil.created_at) < NOW() - INTERVAL '24 hours' OR MAX(pil.created_at) IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_platform_data()
RETURNS TABLE (
    table_name TEXT,
    deleted_count INTEGER
) AS $$
DECLARE
    logs_count INTEGER;
    metrics_count INTEGER;
    jobs_count INTEGER;
BEGIN
    -- Clean up old integration logs (older than 90 days)
    DELETE FROM platform_integration_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS logs_count = ROW_COUNT;
    
    -- Clean up old metrics (older than 1 year)
    DELETE FROM platform_metrics 
    WHERE recorded_at < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS metrics_count = ROW_COUNT;
    
    -- Clean up completed jobs older than 30 days
    DELETE FROM platform_integration_jobs 
    WHERE status IN ('completed', 'failed') 
        AND created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS jobs_count = ROW_COUNT;
    
    RETURN QUERY
    SELECT 'platform_integration_logs'::TEXT, logs_count
    UNION ALL
    SELECT 'platform_metrics'::TEXT, metrics_count
    UNION ALL
    SELECT 'platform_integration_jobs'::TEXT, jobs_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for monitoring queries
CREATE INDEX IF NOT EXISTS idx_platform_integration_logs_created_at_status 
    ON platform_integration_logs(created_at, status);

CREATE INDEX IF NOT EXISTS idx_platform_integration_jobs_status_created_at 
    ON platform_integration_jobs(status, created_at);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_recorded_at_metric_name 
    ON platform_metrics(recorded_at, metric_name);

-- Create materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS platform_dashboard_metrics AS
SELECT 
    DATE_TRUNC('hour', pil.created_at) as hour,
    pc.platform_type,
    pc.organization_id,
    pil.operation,
    pil.status,
    COUNT(*) as operation_count,
    AVG(EXTRACT(EPOCH FROM (pil.created_at - LAG(pil.created_at) OVER (PARTITION BY pil.platform_config_id ORDER BY pil.created_at)))) as avg_interval_seconds
FROM platform_integration_logs pil
JOIN platform_configurations pc ON pil.platform_config_id = pc.id
WHERE pil.created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', pil.created_at), pc.platform_type, pc.organization_id, pil.operation, pil.status;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_platform_dashboard_metrics_hour_platform 
    ON platform_dashboard_metrics(hour, platform_type);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_platform_dashboard_metrics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW platform_dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to refresh materialized view (runs every hour)
-- Note: This would typically be set up as a cron job or using pg_cron extension
-- For now, we'll create a function that can be called manually

-- Grant necessary permissions
GRANT SELECT ON platform_integration_metrics TO authenticated;
GRANT SELECT ON platform_health_status TO authenticated;
GRANT SELECT ON job_processing_metrics TO authenticated;
GRANT SELECT ON platform_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_integration_summary TO authenticated;
GRANT EXECUTE ON FUNCTION check_platform_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION record_platform_metric TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_platform_data TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_platform_dashboard_metrics TO authenticated;

-- Create RLS policies for monitoring views
ALTER VIEW platform_integration_metrics ENABLE ROW LEVEL SECURITY;
ALTER VIEW platform_health_status ENABLE ROW LEVEL SECURITY;
ALTER VIEW job_processing_metrics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW platform_dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Platform integration metrics RLS
CREATE POLICY "Users can view their organization's platform integration metrics" 
    ON platform_integration_metrics FOR SELECT 
    USING (platform_config_id IN (
        SELECT id FROM platform_configurations 
        WHERE organization_id = auth.jwt() ->> 'organization_id'
    ));

-- Platform health status RLS
CREATE POLICY "Users can view their organization's platform health status" 
    ON platform_health_status FOR SELECT 
    USING (organization_id = auth.jwt() ->> 'organization_id');

-- Job processing metrics RLS
CREATE POLICY "Users can view their organization's job processing metrics" 
    ON job_processing_metrics FOR SELECT 
    USING (true); -- This view aggregates data, so we allow all authenticated users

-- Platform dashboard metrics RLS
CREATE POLICY "Users can view their organization's dashboard metrics" 
    ON platform_dashboard_metrics FOR SELECT 
    USING (organization_id = auth.jwt() ->> 'organization_id');

-- Service role can access everything
CREATE POLICY "Service role can access all monitoring data" 
    ON platform_integration_metrics FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all health status data" 
    ON platform_health_status FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all job metrics data" 
    ON job_processing_metrics FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all dashboard metrics data" 
    ON platform_dashboard_metrics FOR ALL 
    USING (auth.role() = 'service_role');