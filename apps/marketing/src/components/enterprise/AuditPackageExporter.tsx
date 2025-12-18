import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { AuditExportService, AuditExportOptions } from '@/services/auditExportService';

interface AuditPackageExporterProps {
  enterpriseId?: string;
  workspaceId?: string;
}

export const AuditPackageExporter: React.FC<AuditPackageExporterProps> = ({
  enterpriseId,
  workspaceId
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<Partial<AuditExportOptions>>({
    format: 'pdf',
    includeDecisions: true,
    includeActivities: true,
    includeToolUsage: true,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });

  const handleExport = async () => {
    if (!options.startDate || !options.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    setIsExporting(true);
    try {
      const exportOptions: AuditExportOptions = {
        startDate: options.startDate,
        endDate: options.endDate,
        enterpriseId,
        workspaceId,
        format: options.format as 'pdf' | 'excel' | 'json',
        includeDecisions: options.includeDecisions,
        includeActivities: options.includeActivities,
        includeToolUsage: options.includeToolUsage
      };

      const auditPackage = await AuditExportService.generateAuditPackage(exportOptions);
      
      toast.success('Audit package generated successfully!');
      
      // Auto-download
      await AuditExportService.downloadExport(auditPackage.id);
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to generate audit package');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Package Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={options.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setOptions(prev => ({ 
                ...prev, 
                startDate: new Date(e.target.value) 
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={options.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setOptions(prev => ({ 
                ...prev, 
                endDate: new Date(e.target.value) 
              }))}
            />
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select 
            value={options.format} 
            onValueChange={(value) => setOptions(prev => ({ ...prev, format: value as any }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF (Recommended for compliance)</SelectItem>
              <SelectItem value="excel">Excel (Analysis-friendly)</SelectItem>
              <SelectItem value="json">JSON (API integration)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Inclusion Options */}
        <div className="space-y-3">
          <Label>Include in Export</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="decisions"
                checked={options.includeDecisions}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeDecisions: !!checked }))
                }
              />
              <label htmlFor="decisions" className="text-sm">
                AI Decision Records
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="activities"
                checked={options.includeActivities}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeActivities: !!checked }))
                }
              />
              <label htmlFor="activities" className="text-sm">
                Agent Activities
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tool-usage"
                checked={options.includeToolUsage}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeToolUsage: !!checked }))
                }
              />
              <label htmlFor="tool-usage" className="text-sm">
                Tool Usage Logs
              </label>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Generating Package...' : 'Generate Audit Package'}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <p className="font-medium mb-1">FDA Compliance Note:</p>
          <p>
            Exported packages include cryptographic signatures and immutable timestamps 
            for regulatory compliance. Files are generated in FDA 21 CFR Part 11 format.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};