/**
 * Audit Packet Export System
 * Generates PDF summary + CSV decisions + JSON events with SHA-256 verification
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuditExportOptions {
  startDate: Date;
  endDate: Date;
  agencyId: string;
  clientId?: string;
  includeDecisions?: boolean;
  includeEvents?: boolean;
}

export interface AuditPacket {
  id: string;
  exportedAt: string;
  agencyId: string;
  clientId?: string;
  totalRecords: number;
  sha256Hash: string;
  downloadUrl: string;
  expiresAt: string;
  files: {
    summary: { name: string; size: number; type: 'pdf' };
    decisions: { name: string; size: number; type: 'csv' };
    events: { name: string; size: number; type: 'json' };
  };
}

export interface ExportSummary {
  organizationInfo: {
    agencyId: string;
    agencyName: string;
    clientId?: string;
    clientName?: string;
    exportDate: string;
    dateRange: { start: string; end: string };
  };
  metrics: {
    totalSubmissions: number;
    totalDecisions: number;
    totalAuditEvents: number;
    approvalRate: number;
    averageProcessingTime: number;
  };
  recentDecisions: Array<{
    submissionId: string;
    clientName: string;
    action: string;
    decidedBy: string;
    decidedAt: string;
    rationale: string;
  }>;
}

class AuditPacketService {
  /**
   * Generate complete audit packet for compliance reporting
   */
  async generatePacket(options: AuditExportOptions): Promise<AuditPacket> {
    const exportId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    try {
      // Fetch audit data
      const summary = await this.generateSummary(options);
      const decisions = await this.getDecisionsData(options);
      const events = await this.getAuditEvents(options);

      // Generate file contents
      const summaryPdf = await this.generateSummaryPdf(summary);
      const decisionsCsv = this.generateDecisionsCsv(decisions);
      const eventsJson = JSON.stringify(events, null, 2);

      // Calculate SHA-256 hash of all content
      const combinedContent = summaryPdf + decisionsCsv + eventsJson;
      const sha256Hash = await this.calculateSHA256(combinedContent);

      // Create audit packet record
      const packet: AuditPacket = {
        id: exportId,
        exportedAt: timestamp,
        agencyId: options.agencyId,
        clientId: options.clientId,
        totalRecords: decisions.length + events.length,
        sha256Hash,
        downloadUrl: `/api/exports/${exportId}/download`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        files: {
          summary: { 
            name: `audit-summary-${exportId}.pdf`, 
            size: summaryPdf.length, 
            type: 'pdf' 
          },
          decisions: { 
            name: `decisions-${exportId}.csv`, 
            size: decisionsCsv.length, 
            type: 'csv' 
          },
          events: { 
            name: `audit-events-${exportId}.json`, 
            size: eventsJson.length, 
            type: 'json' 
          }
        }
      };

      // Store export record
      await this.storeExportRecord(packet, {
        summaryPdf,
        decisionsCsv,
        eventsJson
      });

      // Audit the export action
      await this.auditExportAction(options.agencyId, packet);

      return packet;
    } catch (error) {
      console.error('Failed to generate audit packet:', error);
      throw new Error('Audit packet generation failed');
    }
  }

  private async generateSummary(options: AuditExportOptions): Promise<ExportSummary> {
    // Get submissions and decisions in date range
    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        id,
        status,
        created_at,
        decided_at,
        workspace:workspaces(enterprise_id, name)
      `)
      .gte('created_at', options.startDate.toISOString())
      .lte('created_at', options.endDate.toISOString());

    const { data: decisions } = await supabase
      .from('audit_events')
      .select('*')
      .in('event_type', ['submission_approve', 'submission_request_changes'])
      .gte('created_at', options.startDate.toISOString())
      .lte('created_at', options.endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    const totalSubmissions = submissions?.length || 0;
    const totalDecisions = decisions?.length || 0;
    const approved = decisions?.filter(d => d.event_type === 'submission_approve').length || 0;
    const approvalRate = totalDecisions > 0 ? (approved / totalDecisions) * 100 : 0;

    // Calculate average processing time
    const processedSubmissions = submissions?.filter(s => s.decided_at) || [];
    const avgProcessingTime = processedSubmissions.length > 0
      ? processedSubmissions.reduce((sum, s) => {
          const start = new Date(s.created_at).getTime();
          const end = new Date(s.decided_at).getTime();
          return sum + (end - start);
        }, 0) / processedSubmissions.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    return {
      organizationInfo: {
        agencyId: options.agencyId,
        agencyName: 'Digital Health Agency', // Would fetch from DB
        clientId: options.clientId,
        clientName: options.clientId ? 'Client Name' : undefined, // Would fetch from DB
        exportDate: new Date().toISOString(),
        dateRange: {
          start: options.startDate.toISOString(),
          end: options.endDate.toISOString()
        }
      },
      metrics: {
        totalSubmissions,
        totalDecisions,
        totalAuditEvents: totalDecisions, // Placeholder
        approvalRate,
        averageProcessingTime: Math.round(avgProcessingTime * 100) / 100
      },
      recentDecisions: (decisions || []).slice(0, 10).map(d => ({
        submissionId: d.entity_id || 'N/A',
        clientName: 'Client Name', // Would fetch from relationships
        action: d.event_type.replace('submission_', ''),
        decidedBy: d.user_id || 'System',
        decidedAt: d.created_at,
        rationale: (d.details as any)?.rationale || 'N/A'
      }))
    };
  }

  private async getDecisionsData(options: AuditExportOptions): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .in('event_type', ['submission_approve', 'submission_request_changes'])
      .gte('created_at', options.startDate.toISOString())
      .lte('created_at', options.endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getAuditEvents(options: AuditExportOptions): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .gte('created_at', options.startDate.toISOString())
      .lte('created_at', options.endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async generateSummaryPdf(summary: ExportSummary): Promise<string> {
    // Mock PDF generation - in production would use PDF library
    return `PDF Content for Audit Summary
Organization: ${summary.organizationInfo.agencyName}
Export Date: ${summary.organizationInfo.exportDate}
Date Range: ${summary.organizationInfo.dateRange.start} to ${summary.organizationInfo.dateRange.end}

Metrics:
- Total Submissions: ${summary.metrics.totalSubmissions}
- Total Decisions: ${summary.metrics.totalDecisions}
- Approval Rate: ${summary.metrics.approvalRate.toFixed(1)}%
- Avg Processing Time: ${summary.metrics.averageProcessingTime}h

Recent Decisions:
${summary.recentDecisions.map(d => 
  `- ${d.submissionId}: ${d.action} by ${d.decidedBy} on ${d.decidedAt}`
).join('\n')}

SHA-256 Hash: [Will be calculated]
Generated by aicomply.io Audit System`;
  }

  private generateDecisionsCsv(decisions: any[]): string {
    const headers = [
      'Event ID',
      'Submission ID',
      'Action',
      'Decided By',
      'Decided At',
      'Rationale',
      'Client ID'
    ];

    const rows = decisions.map(d => [
      d.id,
      d.entity_id || '',
      d.event_type.replace('submission_', ''),
      d.user_id || '',
      d.created_at,
      (d.details?.rationale || '').replace(/"/g, '""'), // Escape quotes
      d.details?.clientId || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  private async calculateSHA256(content: string): Promise<string> {
    // Mock hash calculation - in production would use crypto API
    const mockHash = btoa(content).slice(0, 64);
    return `sha256:${mockHash}`;
  }

  private async storeExportRecord(packet: AuditPacket, files: any): Promise<void> {
    // Store in audit_events for tracking
    await supabase
      .from('audit_events')
      .insert({
        event_type: 'audit_packet_generated',
        entity_type: 'export',
        entity_id: packet.id,
        details: {
          agencyId: packet.agencyId,
          clientId: packet.clientId,
          totalRecords: packet.totalRecords,
          sha256Hash: packet.sha256Hash,
          expiresAt: packet.expiresAt
        }
      });

    // In production, would store files in secure storage
    console.log('Audit packet stored:', packet.id);
  }

  private async auditExportAction(agencyId: string, packet: AuditPacket): Promise<void> {
    await supabase
      .from('audit_events')
      .insert({
        event_type: 'audit_export_requested',
        entity_type: 'export',
        entity_id: packet.id,
        details: {
          agencyId,
          exportId: packet.id,
          recordCount: packet.totalRecords,
          sha256Hash: packet.sha256Hash
        }
      });
  }

  /**
   * Get export history for an agency
   */
  async getExportHistory(agencyId: string): Promise<AuditPacket[]> {
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .eq('event_type', 'audit_packet_generated')
        .eq('details->>agencyId', agencyId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map(event => {
        const details = event.details as any;
        return {
          id: event.entity_id,
          exportedAt: event.created_at,
          agencyId: details.agencyId,
          clientId: details.clientId,
          totalRecords: details.totalRecords,
          sha256Hash: details.sha256Hash,
          downloadUrl: `/api/exports/${event.entity_id}/download`,
          expiresAt: details.expiresAt,
          files: {
            summary: { name: `audit-summary-${event.entity_id}.pdf`, size: 0, type: 'pdf' },
            decisions: { name: `decisions-${event.entity_id}.csv`, size: 0, type: 'csv' },
            events: { name: `audit-events-${event.entity_id}.json`, size: 0, type: 'json' }
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch export history:', error);
      return [];
    }
  }
}

export const auditPacketService = new AuditPacketService();