// Monitoring and alerting utilities for platform adapters

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Metric types
export type MetricType = 
  | 'integration_success'
  | 'integration_failure'
  | 'api_response_time'
  | 'api_error_rate'
  | 'platform_connection_status'
  | 'credential_expiration'
  | 'rate_limit_exceeded'
  | 'file_processing_time'
  | 'metadata_attachment_rate'

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

// Monitoring configuration
const METRICS_BATCH_SIZE = 10
const METRICS_FLUSH_INTERVAL = 30000 // 30 seconds
const ALERT_COOLDOWN_MS = 300000 // 5 minutes

// In-memory metrics buffer
const metricsBuffer: any[] = []
const alertCooldowns = new Map<string, number>()

// Record a metric
export async function recordMetric(
  type: MetricType,
  value: number,
  unit: string = 'count',
  metadata?: Record<string, any>
): Promise<void> {
  const metric = {
    type,
    value,
    unit,
    metadata,
    timestamp: new Date().toISOString()
  }
  
  metricsBuffer.push(metric)
  
  // Flush if buffer is full
  if (metricsBuffer.length >= METRICS_BATCH_SIZE) {
    await flushMetrics()
  }
}

// Record platform integration metric
export async function recordIntegrationMetric(
  platformType: string,
  success: boolean,
  duration: number,
  metadata?: Record<string, any>
): Promise<void> {
  await recordMetric(
    success ? 'integration_success' : 'integration_failure',
    1,
    'count',
    {
      platform_type: platformType,
      duration_ms: duration,
      ...metadata
    }
  )
  
  // Also record response time
  await recordMetric(
    'api_response_time',
    duration,
    'milliseconds',
    {
      platform_type: platformType,
      operation: 'integration'
    }
  )
}

// Send alert
export async function sendAlert(
  title: string,
  message: string,
  severity: AlertSeverity,
  metadata?: Record<string, any>
): Promise<void> {
  // Check cooldown
  const alertKey = `${title}:${severity}`
  const lastAlert = alertCooldowns.get(alertKey)
  const now = Date.now()
  
  if (lastAlert && now - lastAlert < ALERT_COOLDOWN_MS) {
    // Skip alert due to cooldown
    return
  }
  
  alertCooldowns.set(alertKey, now)
  
  try {
    // Send to multiple channels based on severity
    const promises: Promise<void>[] = []
    
    // Always log to database
    promises.push(logAlert(title, message, severity, metadata))
    
    // Send to external services based on severity
    if (severity === 'critical') {
      promises.push(sendPagerDutyAlert(title, message, metadata))
      promises.push(sendSlackAlert(title, message, severity, metadata))
    } else if (severity === 'error') {
      promises.push(sendSlackAlert(title, message, severity, metadata))
    }
    
    // Webhook notification for all alerts
    if (Deno.env.get('MONITORING_WEBHOOK_URL')) {
      promises.push(sendWebhookAlert(title, message, severity, metadata))
    }
    
    await Promise.allSettled(promises)
  } catch (error) {
    console.error('Failed to send alert:', error)
  }
}

// Log alert to database
async function logAlert(
  title: string,
  message: string,
  severity: AlertSeverity,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    await supabase.from('monitoring_alerts').insert({
      title,
      message,
      severity,
      metadata,
      status: 'active',
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log alert:', error)
  }
}

// Send Slack alert
async function sendSlackAlert(
  title: string,
  message: string,
  severity: AlertSeverity,
  metadata?: Record<string, any>
): Promise<void> {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
  if (!webhookUrl) return
  
  const color = {
    info: '#36a64f',
    warning: '#ff9800',
    error: '#f44336',
    critical: '#d32f2f'
  }[severity]
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `${getEmojiForSeverity(severity)} ${title}`,
          text: message,
          fields: metadata ? Object.entries(metadata).map(([k, v]) => ({
            title: k,
            value: String(v),
            short: true
          })) : [],
          footer: 'AICOMPLYR Platform Monitoring',
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    })
  } catch (error) {
    console.error('Failed to send Slack alert:', error)
  }
}

// Send PagerDuty alert
async function sendPagerDutyAlert(
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  const integrationKey = Deno.env.get('PAGERDUTY_INTEGRATION_KEY')
  if (!integrationKey) return
  
  try {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: integrationKey,
        event_action: 'trigger',
        payload: {
          summary: title,
          source: 'aicomplyr-platform',
          severity: 'error',
          custom_details: {
            message,
            ...metadata
          }
        }
      })
    })
  } catch (error) {
    console.error('Failed to send PagerDuty alert:', error)
  }
}

// Send webhook alert
async function sendWebhookAlert(
  title: string,
  message: string,
  severity: AlertSeverity,
  metadata?: Record<string, any>
): Promise<void> {
  const webhookUrl = Deno.env.get('MONITORING_WEBHOOK_URL')
  if (!webhookUrl) return
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'platform_alert',
        severity,
        title,
        message,
        metadata,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('Failed to send webhook alert:', error)
  }
}

// Flush metrics to database
async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Copy and clear buffer
    const metrics = [...metricsBuffer]
    metricsBuffer.length = 0
    
    // Group by organization and platform
    const grouped = new Map<string, any[]>()
    
    for (const metric of metrics) {
      const key = `${metric.metadata?.organization_id || 'global'}:${metric.metadata?.platform_type || 'all'}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(metric)
    }
    
    // Insert aggregated metrics
    const inserts = []
    for (const [key, groupMetrics] of grouped) {
      const [orgId, platformType] = key.split(':')
      
      // Aggregate by metric type
      const aggregated = new Map<string, { value: number; count: number }>()
      
      for (const m of groupMetrics) {
        const metricKey = `${m.type}:${m.unit}`
        if (!aggregated.has(metricKey)) {
          aggregated.set(metricKey, { value: 0, count: 0 })
        }
        const agg = aggregated.get(metricKey)!
        agg.value += m.value
        agg.count += 1
      }
      
      // Create insert records
      for (const [metricKey, agg] of aggregated) {
        const [metricType, unit] = metricKey.split(':')
        
        inserts.push({
          organization_id: orgId === 'global' ? null : orgId,
          platform_config_id: null, // Would need to look up
          metric_type: metricType,
          metric_value: agg.value,
          metric_unit: unit,
          time_period: 'minute',
          recorded_at: new Date().toISOString()
        })
      }
    }
    
    if (inserts.length > 0) {
      await supabase.from('platform_metrics').insert(inserts)
    }
  } catch (error) {
    console.error('Failed to flush metrics:', error)
  }
}

// Set up periodic metrics flushing
setInterval(() => {
  flushMetrics().catch(console.error)
}, METRICS_FLUSH_INTERVAL)

// Monitor platform health
export async function monitorPlatformHealth(
  platformConfigId: string,
  healthCheck: () => Promise<{ healthy: boolean; details?: any }>
): Promise<void> {
  try {
    const result = await healthCheck()
    
    await recordMetric(
      'platform_connection_status',
      result.healthy ? 1 : 0,
      'boolean',
      {
        platform_config_id: platformConfigId,
        details: result.details
      }
    )
    
    if (!result.healthy) {
      await sendAlert(
        'Platform Connection Failed',
        `Platform configuration ${platformConfigId} is unhealthy`,
        'error',
        result.details
      )
    }
  } catch (error) {
    await sendAlert(
      'Platform Health Check Failed',
      `Failed to check health for platform ${platformConfigId}`,
      'error',
      { error: error instanceof Error ? error.message : String(error) }
    )
  }
}

// Monitor credential expiration
export async function monitorCredentialExpiration(): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Check for expiring credentials
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const { data: expiringConfigs } = await supabase
      .from('platform_configurations')
      .select('id, organization_id, platform_type, platform_name, credentials_expires_at')
      .eq('status', 'active')
      .lt('credentials_expires_at', thirtyDaysFromNow.toISOString())
    
    for (const config of expiringConfigs || []) {
      const daysUntilExpiry = Math.ceil(
        (new Date(config.credentials_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      
      const severity: AlertSeverity = 
        daysUntilExpiry <= 7 ? 'critical' :
        daysUntilExpiry <= 14 ? 'error' : 'warning'
      
      await sendAlert(
        'Platform Credentials Expiring',
        `Credentials for ${config.platform_name} will expire in ${daysUntilExpiry} days`,
        severity,
        {
          platform_config_id: config.id,
          organization_id: config.organization_id,
          platform_type: config.platform_type,
          days_until_expiry: daysUntilExpiry
        }
      )
    }
  } catch (error) {
    console.error('Failed to monitor credential expiration:', error)
  }
}

// Helper to get emoji for severity
function getEmojiForSeverity(severity: AlertSeverity): string {
  return {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨'
  }[severity]
}

// Export metrics on shutdown
globalThis.addEventListener('unload', () => {
  flushMetrics().catch(console.error)
})