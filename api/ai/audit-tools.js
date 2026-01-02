import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { tool } from 'ai';

/**
 * AICOMPLYR Audit Tools for AI SDK
 *
 * Provides AI SDK tool wrappers for audit operations:
 * 1. logAuditEvent - Log agent decisions and actions
 * 2. queryAuditTrail - Query audit events for compliance reporting
 * 3. exportAuditLog - Export audit logs in regulatory formats
 */

// Lazy initialization of Supabase client
let supabaseClient = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key must be configured');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

/**
 * Tool 1: logAuditEvent
 * Logs agent decisions and actions to governance_audit_events table
 */
export const logAuditEvent = tool({
  name: 'logAuditEvent',
  description: 'Logs an audit event for agent decisions and actions.',
  parameters: z.object({
    eventType: z.string().describe('Type of event'),
    agentType: z.string().describe('Type of agent'),
    decisionStatus: z.string().describe('The decision status'),
    decisionReason: z.string().describe('The decision reason'),
    reasoning: z.string().describe('Explanation of the decision'),
    policyReferences: z.array(z.string()).optional().describe('Policy IDs or references'),
    enterpriseId: z.string().describe('Enterprise ID'),
    traceContext: z.string().optional().describe('Trace context'),
    spanId: z.string().optional().describe('Span ID')
  }),
  execute: async ({ 
    eventType, 
    agentType, 
    decisionStatus,
    decisionReason,
    reasoning, 
    policyReferences = [], 
    enterpriseId,
    traceContext,
    spanId
  }) => {
    try {
      const decision = { status: decisionStatus, reason: decisionReason };
      console.log(`[AUDIT-TOOLS] Logging audit event: ${eventType} by ${agentType}`);

      // Extract trace ID from trace context if provided
      let traceId = null;
      if (traceContext && typeof traceContext === 'string') {
        const parts = traceContext.split('-');
        if (parts.length >= 2) {
          traceId = parts[1];
        }
      }

      // Build the event data payload for the JSONB column
      const eventData = {
        agentType,
        decision,
        reasoning,
        policyReferences,
        beforeState,
        afterState,
        traceContext,
        spanId,
        metadata,
        logged_at: new Date().toISOString()
      };

      // Map severity based on event type or decision
      let severity = 'medium';
      if (eventType.includes('violation') || decision?.status === 'Prohibited') {
        severity = 'high';
      } else if (eventType.includes('error')) {
        severity = 'critical';
      }

      // Map properties to actual schema columns
      const auditRecord = {
        enterprise_id: enterpriseId,
        action_type: eventType,
        actor_type: 'agent',
        metadata: eventData,
        occurred_at: new Date().toISOString()
      };

      // Add denial info if applicable
      if (decision?.status === 'Prohibited' || decision?.status === 'denied') {
        auditRecord.denied = true;
        auditRecord.denial_reason = reasoning || decision.reason;
      }

      // Insert into governance_audit_events table
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('governance_audit_events')
        .insert(auditRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log audit event: ${error.message}`);
      }

      console.log(`[AUDIT-TOOLS] Audit event logged successfully: ${data.id}`);
      return {
        success: true,
        auditEventId: data.id,
        eventType,
        agentType,
        loggedAt: new Date().toISOString(),
        traceId
      };
    } catch (error) {
      console.error('[AUDIT-TOOLS] Error logging audit event:', error);
      return {
        success: false,
        error: error.message,
        eventType,
        agentType,
        loggedAt: new Date().toISOString()
      };
    }
  }
});

/**
 * Tool 2: queryAuditTrail
 * Queries audit events for compliance reporting and investigation
 */
export const queryAuditTrail = tool({
  name: 'queryAuditTrail',
  description: 'Queries audit events from the governance_audit_events table.',
  parameters: z.object({
    enterpriseId: z.string().describe('Enterprise ID'),
    agentType: z.string().optional().describe('Agent type'),
    eventType: z.string().optional().describe('Event type'),
    dateRange: z.object({
      start: z.string().optional().describe('Start date'),
      end: z.string().optional().describe('End date')
    }).optional().describe('Date range filter'),
    traceId: z.string().optional().describe('Trace ID'),
    limit: z.number().optional().default(100).describe('Limit'),
    offset: z.number().optional().default(0).describe('Offset')
  }),
  execute: async ({ 
    enterpriseId, 
    agentType, 
    eventType, 
    dateRange, 
    traceId, 
    limit = 100,
    offset = 0
  }) => {
    try {
      console.log(`[AUDIT-TOOLS] Querying audit trail for enterprise ${enterpriseId}`);

      // Build query matching actual schema
      const supabase = getSupabaseClient();
      let query = supabase
        .from('governance_audit_events')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .order('occurred_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      if (traceId) {
        query = query.filter('event_data->>traceContext', 'ilike', `%${traceId}%`);
      }

      if (dateRange?.start) {
        query = query.gte('occurred_at', dateRange.start);
      }

      if (dateRange?.end) {
        query = query.lte('occurred_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to query audit trail: ${error.message}`);
      }

      console.log(`[AUDIT-TOOLS] Found ${data.length} audit events`);
      return {
        success: true,
        events: data,
        count: data.length,
        enterpriseId,
        filters: {
          agentType,
          eventType,
          dateRange,
          traceId
        },
        queriedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[AUDIT-TOOLS] Error querying audit trail:', error);
      return {
        success: false,
        error: error.message,
        enterpriseId,
        queriedAt: new Date().toISOString()
      };
    }
  }
});

/**
 * Tool 3: exportAuditLog
 * Exports audit logs in regulatory formats (JSON, CSV, PDF)
 */
export const exportAuditLog = tool({
  name: 'exportAuditLog',
  description: 'Exports audit logs in regulatory-compliant formats.',
  parameters: z.object({
    enterpriseId: z.string().describe('Enterprise ID'),
    format: z.string().describe('Export format'),
    dateRange: z.object({
      start: z.string().describe('Start date'),
      end: z.string().describe('End date')
    }).describe('Date range'),
    filters: z.record(z.any()).optional().describe('Additional filters'),
    includeMetadata: z.boolean().optional().default(true).describe('Include metadata')
  }),
  execute: async ({ 
    enterpriseId, 
    format, 
    dateRange, 
    filters = {}, 
    includeMetadata = true 
  }) => {
    try {
      console.log(`[AUDIT-TOOLS] Exporting audit log for enterprise ${enterpriseId} in ${format} format`);

      // Query audit events with filters matching actual schema
      const supabase = getSupabaseClient();
      let query = supabase
        .from('governance_audit_events')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .gte('occurred_at', dateRange.start)
        .lte('occurred_at', dateRange.end)
        .order('occurred_at', { ascending: false });

      // Apply additional filters
      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.traceId) {
        query = query.filter('event_data->>traceContext', 'ilike', `%${filters.traceId}%`);
      }

      const { data: events, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch audit events for export: ${error.message}`);
      }

      // Format export based on format type
      let exportData;
      let mimeType;

      switch (format) {
        case 'json':
          exportData = JSON.stringify({
            enterprise_id: enterpriseId,
            export_date: new Date().toISOString(),
            date_range: dateRange,
            filters: filters,
            event_count: events.length,
            events: includeMetadata ? events : events.map(e => ({
              id: e.id,
              event_type: e.event_type,
              agent_type: e.agent_type,
              created_at: e.created_at,
              event_payload: e.event_payload
            }))
          }, null, 2);
          mimeType = 'application/json';
          break;

        case 'csv':
          // Convert to CSV format
          const headers = ['id', 'event_type', 'agent_type', 'created_at', 'trace_id', 'reasoning'];
          const csvRows = [
            headers.join(','),
            ...events.map(e => [
              e.id,
              e.event_type || '',
              e.agent_type || '',
              e.created_at || '',
              e.trace_id || '',
              e.event_payload?.reasoning || ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
          ];
          exportData = csvRows.join('\n');
          mimeType = 'text/csv';
          break;

        case 'pdf':
          // For PDF, we'd typically call a PDF generation service
          // For now, return structured data that can be converted to PDF
          exportData = JSON.stringify({
            format: 'pdf',
            enterprise_id: enterpriseId,
            export_date: new Date().toISOString(),
            date_range: dateRange,
            event_count: events.length,
            events: events.map(e => ({
              id: e.id,
              event_type: e.event_type,
              agent_type: e.agent_type,
              created_at: e.created_at,
              reasoning: e.event_payload?.reasoning || ''
            }))
          }, null, 2);
          mimeType = 'application/pdf';
          // Note: Actual PDF generation would require a PDF library or service
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      console.log(`[AUDIT-TOOLS] Export completed: ${events.length} events in ${format} format`);
      return {
        success: true,
        format,
        mimeType,
        eventCount: events.length,
        exportData: format === 'json' ? JSON.parse(exportData) : exportData,
        dateRange,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[AUDIT-TOOLS] Error exporting audit log:', error);
      return {
        success: false,
        error: error.message,
        format,
        enterpriseId,
        exportedAt: new Date().toISOString()
      };
    }
  }
});

// Add names to tools for internal identification
logAuditEvent.name = 'logAuditEvent';
queryAuditTrail.name = 'queryAuditTrail';
exportAuditLog.name = 'exportAuditLog';

/**
 * Export all audit tools as an array for easy integration
 */
export const auditTools = [
  logAuditEvent,
  queryAuditTrail,
  exportAuditLog
];
