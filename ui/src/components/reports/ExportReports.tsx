import React, { useState } from 'react';
import { Card, Button, Select, Progress, Badge, Alert } from '@/components/ui';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar, 
  Filter,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Activity,
  Zap
} from 'lucide-react';

interface ReportConfig {
  type: 'compliance' | 'approval' | 'processing' | 'audit' | 'summary';
  format: 'csv' | 'pdf' | 'excel' | 'json';
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  filters: {
    status?: string[];
    department?: string[];
    riskLevel?: string[];
    actor?: string[];
  };
  includeCharts: boolean;
  includeDetails: boolean;
}

interface ExportReportsProps {
  onExportStart?: (config: ReportConfig) => void;
  onExportComplete?: (config: ReportConfig, downloadUrl: string) => void;
  className?: string;
}

export function ExportReports({ 
  onExportStart,
  onExportComplete,
  className = '' 
}: ExportReportsProps) {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'summary',
    format: 'pdf',
    dateRange: 'month',
    filters: {},
    includeCharts: true,
    includeDetails: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [recentExports, setRecentExports] = useState<Array<{
    id: string;
    name: string;
    type: string;
    format: string;
    createdAt: Date;
    status: 'completed' | 'processing' | 'failed';
    downloadUrl?: string;
  }>>([]);

  const reportTypes = [
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance scores and violations',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'approval',
      name: 'Approval Report',
      description: 'Approval workflow metrics and acceleration data',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'processing',
      name: 'Processing Report',
      description: 'Document processing performance and success rates',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'audit',
      name: 'Audit Trail Report',
      description: 'Complete audit trail and event history',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'summary',
      name: 'Executive Summary',
      description: 'High-level metrics and business impact',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', icon: FileText },
    { value: 'excel', label: 'Excel Spreadsheet', icon: BarChart3 },
    { value: 'csv', label: 'CSV Data', icon: FileText },
    { value: 'json', label: 'JSON Data', icon: FileText }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
    { value: 'year', label: 'Last 365 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    onExportStart?.(config);

    // Simulate export process
    const exportId = `export-${Date.now()}`;
    const exportName = `${reportTypes.find(r => r.id === config.type)?.name} - ${new Date().toLocaleDateString()}`;
    
    // Add to recent exports
    setRecentExports(prev => [{
      id: exportId,
      name: exportName,
      type: config.type,
      format: config.format,
      createdAt: new Date(),
      status: 'processing'
    }, ...prev.slice(0, 9)]);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsExporting(false);
          
          // Update export status
          setRecentExports(prev => prev.map(exp => 
            exp.id === exportId 
              ? { ...exp, status: 'completed', downloadUrl: `#download-${exportId}` }
              : exp
          ));

          // Simulate download URL
          const downloadUrl = `#download-${exportId}`;
          onExportComplete?.(config, downloadUrl);
          
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    // Simulate export completion
    setTimeout(() => {
      clearInterval(progressInterval);
      setIsExporting(false);
      setExportProgress(100);
    }, 3000);
  };

  const getReportIcon = (type: string) => {
    const reportType = reportTypes.find(r => r.id === type);
    return reportType ? reportType.icon : FileText;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
          <p className="text-sm text-gray-600">
            Generate and download compliance and approval reports
          </p>
        </div>
        <Badge className="text-green-600 bg-green-50 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Export Ready
        </Badge>
      </div>

      {/* Report Type Selection */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Select Report Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((reportType) => {
            const Icon = reportType.icon;
            const isSelected = config.type === reportType.id;
            
            return (
              <button
                key={reportType.id}
                onClick={() => setConfig(prev => ({ ...prev, type: reportType.id as any }))}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? `${reportType.borderColor} ${reportType.bgColor}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`h-6 w-6 mt-1 ${reportType.color}`} />
                  <div className="flex-1">
                    <h5 className={`font-medium ${
                      isSelected ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                      {reportType.name}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {reportType.description}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Export Configuration */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Export Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <Select
              value={config.format}
              onChange={(value) => setConfig(prev => ({ ...prev, format: value as any }))}
              options={formatOptions.map(opt => ({
                value: opt.value,
                label: opt.label
              }))}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <Select
              value={config.dateRange}
              onChange={(value) => setConfig(prev => ({ ...prev, dateRange: value as any }))}
              options={dateRangeOptions}
            />
          </div>

          {/* Custom Date Range */}
          {config.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={config.customStartDate || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={config.customEndDate || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Additional Options */}
        <div className="mt-6 space-y-4">
          <h5 className="text-sm font-medium text-gray-700">Additional Options</h5>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeCharts}
                onChange={(e) => setConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include charts and visualizations</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeDetails}
                onChange={(e) => setConfig(prev => ({ ...prev, includeDetails: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include detailed data and metadata</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Export Progress */}
      {isExporting && (
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="h-5 w-5 text-blue-600 animate-spin" />
            <h4 className="text-lg font-medium text-gray-900">Exporting Report</h4>
          </div>
          <div className="space-y-4">
            <Progress value={exportProgress} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Generating {reportTypes.find(r => r.id === config.type)?.name}</span>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <div className="text-xs text-gray-500">
              This may take a few minutes depending on the data size and report complexity.
            </div>
          </div>
        </Card>
      )}

      {/* Export Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Ready to Export</h4>
            <p className="text-sm text-gray-600">
              {reportTypes.find(r => r.id === config.type)?.name} in {config.format.toUpperCase()} format
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
          </Button>
        </div>
      </Card>

      {/* Recent Exports */}
      {recentExports.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Exports</h4>
          <div className="space-y-3">
            {recentExports.map((exportItem) => {
              const Icon = getReportIcon(exportItem.type);
              return (
                <div key={exportItem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">
                        {exportItem.name}
                      </h5>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{exportItem.format.toUpperCase()}</span>
                        <span>•</span>
                        <span>{exportItem.createdAt.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(exportItem.status)}>
                      {exportItem.status}
                    </Badge>
                    {exportItem.status === 'completed' && exportItem.downloadUrl && (
                      <Button
                        onClick={() => window.open(exportItem.downloadUrl, '_blank')}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Export Statistics */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Export Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {recentExports.length}
            </div>
            <div className="text-sm text-gray-600">Total Exports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {recentExports.filter(e => e.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {formatFileSize(recentExports.length * 1024 * 1024)}
            </div>
            <div className="text-sm text-gray-600">Data Exported</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {Math.round(recentExports.reduce((acc, e) => acc + (e.status === 'completed' ? 1 : 0), 0) / Math.max(recentExports.length, 1) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </Card>
    </div>
  );
}