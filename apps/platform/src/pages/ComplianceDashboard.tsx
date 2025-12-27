import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RefreshCw, Download, AlertTriangle, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { SurfaceLayout } from '@/components/SurfaceLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useEnterprise } from '@/contexts/EnterpriseContext'

interface ComplianceSummary {
  overall_coverage: number
  frameworks_enabled: number
  total_requirements: number
  requirements_met: number
  requirements_partial: number
  requirements_gap: number
}

interface FrameworkCoverage {
  framework: {
    id: string
    name: string
    short_code: string
  }
  coverage_score: number
  status: 'compliant' | 'partial' | 'non_compliant'
  requirements_summary: {
    total: number
    met: number
    partial: number
    gap: number
  }
  critical_gaps: number
  enforcement_date?: string
  days_until_enforcement?: number
}

interface ComplianceData {
  summary: ComplianceSummary
  by_framework: FrameworkCoverage[]
  top_gaps: any[]
}

export default function ComplianceDashboard() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)

  useEffect(() => {
    if (workspaceId) {
      fetchCompliance()
    }
  }, [workspaceId])

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/workspaces/${workspaceId}/compliance`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch compliance data')

      const result = await response.json()
      setComplianceData(result.data)
    } catch (error) {
      console.error('Error fetching compliance:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCompliance()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'non_compliant':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'partial':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'non_compliant':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <SurfaceLayout surface="compliance" title="Compliance Overview">
        <div className="flex items-center justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      </SurfaceLayout>
    )
  }

  if (!complianceData) {
    return (
      <SurfaceLayout surface="compliance" title="Compliance Overview">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">No compliance data available</p>
        </div>
      </SurfaceLayout>
    )
  }

  return (
    <SurfaceLayout
      surface="compliance"
      title="Compliance Overview"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Overall Score</h3>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {complianceData.summary.overall_coverage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-4 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${complianceData.summary.overall_coverage}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Requirements</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {complianceData.summary.requirements_met} / {complianceData.summary.total_requirements}
            </div>
            <div className="text-sm text-slate-600">
              {complianceData.summary.requirements_partial} partial, {complianceData.summary.requirements_gap} gaps
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Critical Gaps</h3>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {complianceData.by_framework.reduce((sum, f) => sum + f.critical_gaps, 0)}
            </div>
            <div className="text-sm text-slate-600">Require immediate action</div>
          </div>
        </div>

        {/* Framework Coverage */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Framework Coverage</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {complianceData.by_framework.map((framework) => (
              <div key={framework.framework.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {framework.framework.name}
                      </h3>
                      {getStatusIcon(framework.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(framework.status)}`}>
                        {framework.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                      <div>
                        {framework.requirements_summary.met}/{framework.requirements_summary.total} requirements met
                      </div>
                      {framework.critical_gaps > 0 && (
                        <div className="text-red-600 font-medium">
                          {framework.critical_gaps} critical gap{framework.critical_gaps !== 1 ? 's' : ''}
                        </div>
                      )}
                      {framework.enforcement_date && (
                        <div>
                          Enforcement: {new Date(framework.enforcement_date).toLocaleDateString()}
                          {framework.days_until_enforcement !== undefined && framework.days_until_enforcement > 0 && (
                            <span className="ml-1">
                              ({framework.days_until_enforcement} days remaining)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          framework.coverage_score >= 95
                            ? 'bg-green-600'
                            : framework.coverage_score >= 70
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${framework.coverage_score}%` }}
                      />
                    </div>
                    <div className="text-sm text-slate-600">
                      Coverage: {framework.coverage_score.toFixed(1)}%
                    </div>
                  </div>
                  <Link
                    to={`/compliance/frameworks/${framework.framework.id}`}
                    className="ml-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Gaps */}
        {complianceData.top_gaps.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Top Gaps</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {complianceData.top_gaps.map((gap, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{gap.requirement_code}</span>
                        <span className="text-sm text-slate-600">{gap.framework}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          gap.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {gap.severity}
                        </span>
                      </div>
                      <h4 className="font-medium text-slate-900 mb-1">{gap.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">{gap.remediation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SurfaceLayout>
  )
}

