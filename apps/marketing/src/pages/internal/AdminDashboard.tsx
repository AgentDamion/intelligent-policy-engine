import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedAdminMetricCard } from '@/components/admin/EnhancedAdminMetricCard';
import { EnhancedAlertSystem } from '@/components/admin/EnhancedAlertSystem';
import { QuickActionsModal } from '@/components/admin/QuickActionsModal';
import { useAdminRole } from '@/contexts/AdminRoleContext';
import { useAdminKPIs } from '@/hooks/useAdminKPIs';
import {
  TrendingUp,
  Users,
  Building2,
  Wrench,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  UserCheck,
  CreditCard,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Target,
  PieChart
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { role, getRoleConfig } = useAdminRole();
  const config = getRoleConfig();
  const kpis = useAdminKPIs();

  // Calculate Governance Health Index from real data
  const governanceHealth = {
    score: kpis.governanceScore,
    breakdown: {
      compliance: Math.round((kpis.approvedTools / (kpis.approvedTools + kpis.pendingTools + kpis.blockedTools)) * 100) || 0,
      toolApproval: Math.round((kpis.approvedTools / kpis.totalAITools) * 100) || 0,
      auditComplete: 85 // Could be calculated from audit_events
    }
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Format numbers with commas
  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  if (kpis.loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-muted h-32 rounded-lg"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-lg ${config.gradientClass}`}>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {config.title}
        </h1>
        <p className="text-white/90 text-lg">
          {config.description}
        </p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <EnhancedAdminMetricCard
          title="MRR"
          value={formatCurrency(kpis.mrr)}
          change={{ value: 12.3, type: 'increase', period: 'last month' }}
          icon={DollarSign}
          description="Monthly Recurring Revenue"
          drillDownPath="/internal/finance"
          emphasis={config.emphasizedMetrics.includes('mrr')}
        />
        <EnhancedAdminMetricCard
          title="ARR"
          value={formatCurrency(kpis.arr)}
          change={{ value: 18.7, type: 'increase', period: 'last quarter' }}
          icon={TrendingUp}
          description="Annual Recurring Revenue"
          drillDownPath="/internal/finance"
          emphasis={config.emphasizedMetrics.includes('arr')}
        />
        <EnhancedAdminMetricCard
          title="Active Partners"
          value={formatNumber(kpis.activePartners)}
          change={{ value: 8.2, type: 'increase', period: 'last month' }}
          icon={Building2}
          description="Revenue-generating partnerships"
          drillDownPath="/internal/partners"
          emphasis={config.emphasizedMetrics.includes('partners')}
        />
        <EnhancedAdminMetricCard
          title="Active Enterprises"
          value={formatNumber(kpis.activeEnterprises)}
          change={{ value: 15.4, type: 'increase', period: 'last month' }}
          icon={Users}
          description="Paying enterprise customers"
          drillDownPath="/internal/enterprises"
          emphasis={config.emphasizedMetrics.includes('enterprises')}
        />
        <EnhancedAdminMetricCard
          title="Governance Health"
          value={governanceHealth.score}
          change={{ value: 3.2, type: 'increase', period: 'last week' }}
          icon={Shield}
          description="Composite compliance readiness score"
          drillDownPath="/internal/governance"
          emphasis={config.emphasizedMetrics.includes('governance')}
          governanceData={governanceHealth}
        />
      </div>

      {/* Role-specific Business and Operational KPIs */}
      {!config.hiddenSections.includes('business-metrics') && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Business KPIs
              </CardTitle>
              <CardDescription>Revenue, sales, and growth metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sales Pipeline</span>
                  <span className="text-2xl font-bold">$2.8M</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '72%' }}></div>
                </div>
                <span className="text-xs text-muted-foreground">72% of Q4 target ($3.9M)</span>
              </div>
              
              {role === 'marketing' && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Marketing Attribution</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Organic Search</span>
                      <span>42%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Direct/Referral</span>
                      <span>28%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paid Campaigns</span>
                      <span>30%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {(role === 'finance' || role === 'founder') && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2">Finance Snapshot</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Cash Runway</div>
                      <div className="font-semibold">18 months</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Burn Rate</div>
                      <div className="font-semibold">$240K/mo</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Operational KPIs
              </CardTitle>
              <CardDescription>Platform performance and user engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{formatNumber(kpis.activeUsers)}</div>
                  <div className="text-sm text-muted-foreground">Active Users (30d)</div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    +12.3%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{formatNumber(kpis.totalAITools)}</div>
                  <div className="text-sm text-muted-foreground">AI Tools</div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    +23.1%
                  </div>
                </div>
              </div>
              
              {(role === 'ops' || role === 'founder') && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tool Approvals Status</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Approved</span>
                      <span className="text-sm font-medium">
                        {formatNumber(kpis.approvedTools)} ({Math.round((kpis.approvedTools / (kpis.approvedTools + kpis.pendingTools + kpis.blockedTools)) * 100) || 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Review</span>
                      <span className="text-sm font-medium">
                        {formatNumber(kpis.pendingTools)} ({Math.round((kpis.pendingTools / (kpis.approvedTools + kpis.pendingTools + kpis.blockedTools)) * 100) || 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Blocked/Flagged</span>
                      <span className="text-sm font-medium">
                        {formatNumber(kpis.blockedTools)} ({Math.round((kpis.blockedTools / (kpis.approvedTools + kpis.pendingTools + kpis.blockedTools)) * 100) || 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">System Health</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {kpis.systemUptime}% Uptime
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions and Enhanced Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Role-specific administrative actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {config.primaryActions.includes('invite-enterprise') && (
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setActiveModal('invite-enterprise')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Enterprise Customer
                </Button>
              )}
              {config.primaryActions.includes('approve-partner') && (
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setActiveModal('approve-partner')}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Approve Partner Application
                </Button>
              )}
              {config.primaryActions.includes('configure-billing') && (
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setActiveModal('configure-billing')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Configure Billing Settings
                </Button>
              )}
              {config.primaryActions.includes('launch-campaign') && (
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setActiveModal('launch-campaign')}
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  Launch Marketing Campaign
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <EnhancedAlertSystem />
      </div>

    </div>
  );
};

export default AdminDashboard;