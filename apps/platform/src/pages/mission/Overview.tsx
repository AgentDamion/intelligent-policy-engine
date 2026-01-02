import { AlertTriangle, CheckCircle2, Clock, Download, RefreshCw, TrendingUp } from 'lucide-react'
import { useEnterprise } from '../../contexts/EnterpriseContext'
import { useVERADashboard } from '../../hooks/useVERADashboard'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { MissionMetricCard } from '../../components/mission/MissionMetricCard'
import { MetaLoopSignal } from '../../components/mission/MetaLoopSignal'
import { AgentActivityStream } from '../../components/mission/AgentActivityStream'

export default function MissionControl() {
  const { currentEnterprise } = useEnterprise()
  const { refresh, isLoading } = useVERADashboard(currentEnterprise?.id)

  return (
    <div className="w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Sub-header row: Page Title + Guardrails + Actions */}
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-aicomplyr-black">Mission Control</h1>
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-widest border-neutral-300 text-neutral-700"
              >
                GUARDRAILS: VIEW ONLY
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">Real-time governance intelligence and operational metrics</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>Last updated:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary-light"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="h-9 px-3"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button 
              variant="secondary-light" 
              size="sm" 
              className="h-9 px-3"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Dashboard
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* Row 1: KPI Cards (4 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MissionMetricCard title="Active Threads" value={12} subtitle="+3 from yesterday" icon={TrendingUp} iconColor="text-emerald-600" />
            <MissionMetricCard title="Pending Decisions" value={5} subtitle="2 require signature" icon={Clock} iconColor="text-amber-500" />
            <MissionMetricCard title="Policies Active" value={47} subtitle="Last update 2h ago" icon={CheckCircle2} iconColor="text-emerald-600" />
            <MissionMetricCard title="SLA Breaches" value={1} subtitle="Thread T-2934" icon={AlertTriangle} iconColor="text-rose-500" />
          </div>

          {/* Row 2: Analytics & Signals (2:1 ratio) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border border-gray-100 shadow-none bg-white lg:col-span-2">
              <CardHeader className="px-6 pt-6 pb-0 border-b-0">
                <CardTitle className="text-sm font-semibold text-slate-900">Risk Trends</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pt-4 pb-6">
                <div className="min-h-[320px] rounded-none border border-dashed border-slate-200 bg-white flex items-center justify-center text-sm text-slate-400">
                  [Chart: Risk distribution over time]
                </div>
              </CardContent>
            </Card>

            <MetaLoopSignal />
          </div>

          {/* Row 3: Data Table (Full width) */}
          <AgentActivityStream />
        </div>
      </div>
    </div>
  )
}
