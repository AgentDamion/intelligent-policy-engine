import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Shield,
  AlertCircle,
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

interface ComplianceReportResponse {
  success: boolean;
  data?: ComplianceReport;
  error?: string;
}

interface ComplianceReportCardProps {
  projectId: string;
  onRefresh?: () => void;
}

const STATUS_PILL_BASE =
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide';
const STATUS_CLASS_MAP: Record<string, string> = {
  green: `${STATUS_PILL_BASE} bg-green-100 text-green-800 border-green-200`,
  yellow: `${STATUS_PILL_BASE} bg-yellow-100 text-yellow-800 border-yellow-200`,
  red: `${STATUS_PILL_BASE} bg-red-100 text-red-800 border-red-200`,
  default: `${STATUS_PILL_BASE} bg-gray-100 text-gray-800 border-gray-200`,
};

const RISK_PILL_BASE = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';
const RISK_CLASS_MAP: Record<string, string> = {
  low: `${RISK_PILL_BASE} bg-green-100 text-green-800`,
  medium: `${RISK_PILL_BASE} bg-yellow-100 text-yellow-800`,
  high: `${RISK_PILL_BASE} bg-orange-100 text-orange-800`,
  critical: `${RISK_PILL_BASE} bg-red-100 text-red-800`,
  default: `${RISK_PILL_BASE} bg-gray-100 text-gray-800`,
};

const PRIORITY_PILL_BASE =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize';
const PRIORITY_CLASS_MAP: Record<string, string> = {
  high: `${PRIORITY_PILL_BASE} bg-red-100 text-red-800`,
  medium: `${PRIORITY_PILL_BASE} bg-yellow-100 text-yellow-800`,
  low: `${PRIORITY_PILL_BASE} bg-green-100 text-green-800`,
  default: `${PRIORITY_PILL_BASE} bg-gray-100 text-gray-800`,
};

const ComplianceReportCard: React.FC<ComplianceReportCardProps> = ({ projectId, onRefresh }) => {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusClasses = (status: string) => STATUS_CLASS_MAP[status] ?? STATUS_CLASS_MAP.default;
  const getRiskClasses = (risk: string) => RISK_CLASS_MAP[risk] ?? RISK_CLASS_MAP.default;
  const getPriorityClasses = (priority: string) =>
    PRIORITY_CLASS_MAP[priority] ?? PRIORITY_CLASS_MAP.default;

  const fetchComplianceReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<ComplianceReportResponse>(
        'generate_compliance_report',
        {
          body: {
            project_id: projectId,
            include_details: true,
          },
        }
      );

      if (fnError) throw fnError;
      if (!data?.success || !data.data) {
        throw new Error(data?.error || 'Failed to fetch compliance report');
      }

      setReport(data.data);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId, onRefresh]);

  useEffect(() => {
    if (!projectId) {
      setReport(null);
      setError('A project ID is required to load compliance data.');
      return;
    }

    fetchComplianceReport();
  }, [projectId, fetchComplianceReport]);

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

  return (
    <div className="space-y-6">
      <div className="card space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin text-primary-500" />
            ) : (
              getStatusIcon(report?.overall_status ?? 'default')
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900">AI Tool Compliance Report</h3>
              <p className="text-sm text-gray-600">
                {report?.project_name ?? '—'} • Generated{' '}
                {report?.generated_at ? new Date(report.generated_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {report && (
              <span className={getStatusClasses(report.overall_status)}>
                {report.overall_status.toUpperCase()}
              </span>
            )}
            <button
              type="button"
              onClick={fetchComplianceReport}
              className="inline-flex items-center rounded-none border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-none border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!report || loading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-none border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center justify-between">
              <span>Error loading compliance report: {error}</span>
              <button
                type="button"
                onClick={fetchComplianceReport}
                className="inline-flex items-center rounded-none border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-none bg-primary-50 p-4 text-center">
            <div className="text-3xl font-bold text-primary-600">
              {report?.compliance_score ?? '—'}{typeof report?.compliance_score === 'number' ? '%' : ''}
            </div>
            <div className="text-sm text-primary-700">Compliance Score</div>
          </div>
          <div className="rounded-none bg-green-50 p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {report?.tools_summary.approved_tools ?? '—'}
            </div>
            <div className="text-sm text-green-700">Approved Tools</div>
          </div>
          <div className="rounded-none bg-yellow-50 p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {report?.tools_summary.needs_review_tools ?? '—'}
            </div>
            <div className="text-sm text-yellow-700">Need Review</div>
          </div>
          <div className="rounded-none bg-red-50 p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {report?.tools_summary.rejected_tools ?? '—'}
            </div>
            <div className="text-sm text-red-700">Rejected</div>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary-500" />
          <h4 className="text-lg font-semibold text-gray-900">Risk Assessment</h4>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {report?.risk_assessment?.overall_risk ? (
            <span className={getRiskClasses(report.risk_assessment.overall_risk)}>
              {report.risk_assessment.overall_risk.toUpperCase()} RISK
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Risk pending
            </span>
          )}
          <span className="text-sm text-gray-600">
            {report?.tools_summary.total_tools ?? '—'} tools analyzed
          </span>
        </div>

        {report?.risk_assessment?.risk_factors && report.risk_assessment.risk_factors.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900">Risk Factors</h5>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {report?.risk_assessment?.risk_factors?.map((factor, index) => (
                <li key={index}>{factor}</li>
              ))}
            </ul>
          </div>
        )}

        {report?.risk_assessment?.mitigation_strategies && report.risk_assessment.mitigation_strategies.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900">Mitigation Strategies</h5>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {report?.risk_assessment?.mitigation_strategies?.map((strategy, index) => (
                <li key={index}>{strategy}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h4 className="text-lg font-semibold text-gray-900">AI Tools Used</h4>
        <div className="space-y-3">
          {report?.tools?.map((tool, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-none border border-gray-200 p-3 md:flex-row md:items-start md:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="font-medium text-gray-900">{tool.tool_name}</h5>
                  <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {tool.vendor_name}
                  </span>
                  <span className={getRiskClasses(tool.risk_level)}>{tool.risk_level}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Used {tool.usage_count} times • Last used {new Date(tool.last_used).toLocaleDateString()}
                </div>
                {tool.policy_violations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600">Violations</p>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {tool.policy_violations.map((violation, vIndex) => (
                        <li key={vIndex}>{violation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <span className={getStatusClasses(tool.compliance_status)}>
                {tool.compliance_status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {report?.recommendations && report.recommendations.length > 0 && (
        <div className="card space-y-3">
          <h4 className="text-lg font-semibold text-gray-900">Recommendations</h4>
          <div className="space-y-3">
            {report?.recommendations?.map((rec, index) => (
              <div key={index} className="rounded-none border border-gray-200 p-3">
                <div className="flex items-start gap-3">
                  <span className={getPriorityClasses(rec.priority)}>{rec.priority}</span>
                  <div className="space-y-1">
                    <h5 className="font-medium text-gray-900">{rec.description}</h5>
                    <p className="text-sm text-gray-600">
                      <strong>Action Required:</strong> {rec.action_required}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report?.policy_violations && report.policy_violations.length > 0 && (
        <div className="card space-y-3">
          <h4 className="text-lg font-semibold text-red-600">Policy Violations</h4>
          <div className="space-y-3">
            {report?.policy_violations?.map((violation, index) => (
              <div key={index} className="rounded-none border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                  <div className="space-y-1">
                    <h5 className="font-medium text-red-800">{violation.rule_name}</h5>
                    <p className="text-sm text-red-700">{violation.description}</p>
                    <p className="text-sm text-red-600">
                      <strong>Affected Tools:</strong> {violation.affected_tools.join(', ')}
                    </p>
                    <p className="text-sm text-red-600">
                      <strong>Remediation:</strong> {violation.remediation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceReportCard;
