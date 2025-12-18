import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'compliance' | 'performance' | 'audit' | 'executive';
  frequency: 'on-demand' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'csv';
}

interface EssentialReportingProps {
  selectedClientId?: string;
}

export const EssentialReporting: React.FC<EssentialReportingProps> = ({
  selectedClientId
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('last_30_days');
  const [generating, setGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'client_compliance',
      name: 'Client Compliance Summary',
      description: 'Comprehensive compliance status across all frameworks',
      type: 'compliance',
      frequency: 'monthly',
      format: 'pdf'
    },
    {
      id: 'agency_performance',
      name: 'Agency Performance Report',
      description: 'SLA performance, response times, and efficiency metrics',
      type: 'performance',
      frequency: 'weekly',
      format: 'pdf'
    },
    {
      id: 'audit_trail',
      name: 'Audit Trail Export',
      description: 'Complete audit trail for regulatory submissions',
      type: 'audit',
      frequency: 'on-demand',
      format: 'excel'
    },
    {
      id: 'executive_dashboard',
      name: 'Executive Summary',
      description: 'High-level overview for stakeholders and executives',
      type: 'executive',
      frequency: 'monthly',
      format: 'pdf'
    },
    {
      id: 'risk_assessment',
      name: 'Risk Assessment Report',
      description: 'Identified risks, mitigation strategies, and trends',
      type: 'compliance',
      frequency: 'quarterly',
      format: 'pdf'
    },
    {
      id: 'submission_analytics',
      name: 'Submission Analytics',
      description: 'Detailed analysis of submission patterns and outcomes',
      type: 'performance',
      frequency: 'monthly',
      format: 'excel'
    }
  ];

  const handleGenerateReport = async (templateId: string) => {
    setGenerating(templateId);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const template = reportTemplates.find(t => t.id === templateId);
      
      toast({
        title: 'Report Generated',
        description: `${template?.name} has been generated successfully`,
      });
      
      // In production, this would trigger actual file download
      console.log(`Generating report: ${templateId} for client: ${selectedClientId || 'all'} for period: ${dateRange}`);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setGenerating(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'performance': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'audit': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'executive': return <Users className="h-4 w-4 text-orange-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'compliance': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-blue-100 text-blue-800';
      case 'audit': return 'bg-purple-100 text-purple-800';
      case 'executive': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Essential Reporting & Export</h3>
          <p className="text-sm text-muted-foreground">
            Professional reports and automated export capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs text-muted-foreground">Reports Generated</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">156</div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">2.5m</div>
                <div className="text-xs text-muted-foreground">Avg Generation Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">98%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <div className="grid gap-4">
        <h4 className="font-medium">Available Reports</h4>
        {reportTemplates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  {getTypeIcon(template.type)}
                  <div className="flex-1">
                    <h5 className="font-medium">{template.name}</h5>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getTypeColor(template.type)}>
                        {template.type}
                      </Badge>
                      <Badge variant="outline">
                        {template.frequency}
                      </Badge>
                      <Badge variant="outline">
                        {template.format.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => handleGenerateReport(template.id)}
                  disabled={generating === template.id}
                  size="sm"
                >
                  {generating === template.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            Automated report generation and delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h6 className="font-medium">Weekly Performance Summary</h6>
                <p className="text-sm text-muted-foreground">Every Monday at 9:00 AM</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">Active</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h6 className="font-medium">Monthly Compliance Report</h6>
                <p className="text-sm text-muted-foreground">First day of each month</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">Active</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h6 className="font-medium">Quarterly Executive Summary</h6>
                <p className="text-sm text-muted-foreground">End of each quarter</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Pending Setup</Badge>
                <Button variant="outline" size="sm">Setup</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};