import { supabase } from '@/integrations/supabase/client';

export interface AuditExportOptions {
  startDate: Date;
  endDate: Date;
  enterpriseId?: string;
  workspaceId?: string;
  format: 'pdf' | 'excel' | 'json';
  includeDecisions?: boolean;
  includeActivities?: boolean;
  includeToolUsage?: boolean;
}

export interface AuditPackage {
  id: string;
  exportedAt: string;
  totalRecords: number;
  size: string;
  downloadUrl: string;
  expiresAt: string;
}

export class AuditExportService {
  static async generateAuditPackage(options: AuditExportOptions): Promise<AuditPackage> {
    console.log('Generating audit package with options:', options);

    try {
      // Call the audit export edge function
      const { data, error } = await supabase.functions.invoke('export_audit_package', {
        body: {
          startDate: options.startDate.toISOString(),
          endDate: options.endDate.toISOString(),
          enterpriseId: options.enterpriseId,
          workspaceId: options.workspaceId,
          format: options.format,
          includeDecisions: options.includeDecisions ?? true,
          includeActivities: options.includeActivities ?? true,
          includeToolUsage: options.includeToolUsage ?? true
        }
      });

      if (error) throw error;

      return {
        id: data.exportId,
        exportedAt: new Date().toISOString(),
        totalRecords: data.totalRecords,
        size: data.size,
        downloadUrl: data.downloadUrl,
        expiresAt: data.expiresAt
      };
    } catch (error) {
      console.error('Error generating audit package:', error);
      throw new Error('Failed to generate audit package. Please try again.');
    }
  }

  static async getExportHistory(enterpriseId?: string): Promise<AuditPackage[]> {
    // In a real implementation, this would fetch from a database
    // For now, return mock data
    return [
      {
        id: 'export-001',
        exportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        totalRecords: 1247,
        size: '2.4 MB',
        downloadUrl: '/api/exports/export-001.pdf',
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  static async downloadExport(exportId: string): Promise<void> {
    try {
      const response = await fetch(`/api/exports/${exportId}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-package-${exportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download audit package');
    }
  }
}