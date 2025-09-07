import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Download,
  TrendingUp,
  Shield,
  AlertCircle
} from 'lucide-react';

interface ComplianceReport {
  project_id: string;
  project_name: string;
  overall_status: 'green' | 'yellow' | 'red';
  compliance_score: number;
  tools_summary: {
    total_tools: number;
    approved_tools: number;
    needs_review_tools: number;
    rejected_tools: number;
    unknown_tools: number;
  };
  tools: Array<{
    tool_name: string;
    vendor_name: string;
    usage_count: number;
    compliance_status: 'approved' | 'needs_review' | 'rejected' | 'unknown';
    risk_level: string;
    policy_violations: string[];
    recommendations: string[];
    last_used: string;
  }>;
  policy_violations: Array<{
    rule_name: string;
    violation_type: string;
    severity: string;
    affected_tools: string[];
    description: string;
    remediation: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    action_required: string;
  }>;
  risk_assessment: {
    overall_risk: 'low' | 'medium' | 'high' | 'critical';
    risk_factors: string[];
    mitigation_strategies: string[];
  };
  generated_at: string;
}

interface ComplianceReportCardProps {
  projectId: string;
  onRefresh?: () => void;
}

const ComplianceReportCard: React.FC<ComplianceReportCardProps> = ({ 
  projectId, 
  onRefresh 
}) => {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComplianceReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/compliance/report?project_id=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch compliance report');
      }
      
      const data = await response.json();
      setReport(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceReport();
  }, [projectId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'yellow':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'red':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Generating compliance report...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading compliance report: {error}</p>
            <Button onClick={fetchComplianceReport} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Shield className="h-8 w-8 mx-auto mb-2" />
            <p>No compliance report available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(report.overall_status)}
              <div>
                <CardTitle className="text-xl">
                  AI Tool Compliance Report
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {report.project_name} • Generated {new Date(report.generated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(report.overall_status)}>
                {report.overall_status.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchComplianceReport}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {report.compliance_score}%
              </div>
              <div className="text-sm text-gray-600">Compliance Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {report.tools_summary.approved_tools}
              </div>
              <div className="text-sm text-gray-600">Approved Tools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {report.tools_summary.needs_review_tools}
              </div>
              <div className="text-sm text-gray-600">Need Review</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {report.tools_summary.rejected_tools}
              </div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Badge className={getRiskColor(report.risk_assessment.overall_risk)}>
              {report.risk_assessment.overall_risk.toUpperCase()} RISK
            </Badge>
            <span className="text-sm text-gray-600">
              {report.tools_summary.total_tools} tools analyzed
            </span>
          </div>
          
          {report.risk_assessment.risk_factors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Risk Factors:</h4>
              <ul className="list-disc list-inside space-y-1">
                {report.risk_assessment.risk_factors.map((factor, index) => (
                  <li key={index} className="text-sm text-gray-600">{factor}</li>
                ))}
              </ul>
            </div>
          )}
          
          {report.risk_assessment.mitigation_strategies.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Mitigation Strategies:</h4>
              <ul className="list-disc list-inside space-y-1">
                {report.risk_assessment.mitigation_strategies.map((strategy, index) => (
                  <li key={index} className="text-sm text-gray-600">{strategy}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tools Summary */}
      <Card>
        <CardHeader>
          <CardTitle>AI Tools Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.tools.map((tool, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{tool.tool_name}</h4>
                    <Badge variant="outline">{tool.vendor_name}</Badge>
                    <Badge className={getRiskColor(tool.risk_level)}>
                      {tool.risk_level}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Used {tool.usage_count} times • Last used {new Date(tool.last_used).toLocaleDateString()}
                  </div>
                  {tool.policy_violations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-red-600 font-medium">Violations:</div>
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {tool.policy_violations.map((violation, vIndex) => (
                          <li key={vIndex}>{violation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(tool.compliance_status)}>
                    {tool.compliance_status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-medium">{rec.description}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Action Required:</strong> {rec.action_required}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Violations */}
      {report.policy_violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Policy Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.policy_violations.map((violation, index) => (
                <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800">{violation.rule_name}</h4>
                      <p className="text-sm text-red-700 mt-1">{violation.description}</p>
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Affected Tools:</strong> {violation.affected_tools.join(', ')}
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        <strong>Remediation:</strong> {violation.remediation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComplianceReportCard;
