import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { monitoring } from '@/utils/monitoring';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar,
  Info,
  Activity,
  Building2,
  Users,
  Wrench,
  FileCheck,
  Globe
} from 'lucide-react';
import { GovernanceFilters } from '@/components/governance/GovernanceFilters';
import { GovernanceKPICards } from '@/components/governance/GovernanceKPICards';
import { OverviewTab } from '@/components/governance/OverviewTab';
import { EntityTabs } from '@/components/governance/EntityTabs';
import { RemediationDrawer } from '@/components/governance/RemediationDrawer';
import { useGovernanceData, GovernanceFilters as FilterType } from '@/hooks/useGovernanceData';
import { GovernanceEntity, GovernanceAlert } from '@/utils/governanceCalculations';

export default function GovernanceHealth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<FilterType>({
    timeRange: '30d',
    segment: 'all',
    riskTiers: [],
    statuses: [],
    search: '',
    region: undefined
  });
  
  const [remediationDrawer, setRemediationDrawer] = useState<{
    isOpen: boolean;
    entity?: GovernanceEntity;
    alert?: GovernanceAlert;
  }>({ isOpen: false });

  const { entities, alerts, metrics, loading } = useGovernanceData(filters);

  const handleKPIClick = (metric: string) => {
    monitoring.trackUserAction('KPI clicked', { metric, source: 'governance-health' });
    // Filter data based on clicked metric
    switch (metric) {
      case 'governance-health':
        // Filter to show entities with lowest GHI
        break;
      case 'open-risks':
        // Filter to show entities with open risks
        break;
      default:
        break;
    }
  };

  const handleEntityClick = (entity: GovernanceEntity) => {
    setRemediationDrawer({ isOpen: true, entity });
  };

  const handleAlertAction = (alertId: string, action: 'view' | 'assign' | 'snooze') => {
    const alert = alerts.find(a => a.id === alertId);
    if (action === 'assign' && alert) {
      setRemediationDrawer({ isOpen: true, alert });
    } else {
      console.log('Alert action:', action, alertId);
    }
  };

  const handleQuickAction = (entityId: string, action: string) => {
    console.log('Quick action:', action, entityId);
  };

  const handleRemediationSubmit = (data: any) => {
    console.log('Remediation submitted:', data);
    // Handle remediation submission
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading governance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/internal/dashboard')}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Admin Dashboard
            </Button>
            <span>/</span>
            <span>Governance Health</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Governance Health</h1>
            <p className="text-muted-foreground">
              Composite compliance readiness across clients, partners, and tools
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report ▾
          </Button>
        </div>
      </div>

      {/* Filters */}
      <GovernanceFilters filters={filters} onFiltersChange={setFilters} />

      {/* KPI Cards */}
      <GovernanceKPICards metrics={metrics} onCardClick={handleKPIClick} />

      {/* Formula Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Governance Health Index Formula</h4>
              <p className="text-sm text-muted-foreground">
                GHI = (Compliance × 0.4) + (Tool Approval × 0.3) + (Audit Complete × 0.3)
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>🟢 Green: 85-100%</span>
                <span>🟡 Yellow: 70-84%</span>
                <span>🔴 Red: &lt;70%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Tools & Categories
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="regions" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Regions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab
            entities={entities}
            alerts={alerts}
            onEntityClick={handleEntityClick}
            onAlertAction={handleAlertAction}
          />
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <EntityTabs
            entities={entities}
            activeTab="clients"
            onEntityClick={handleEntityClick}
            onQuickAction={handleQuickAction}
          />
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <EntityTabs
            entities={entities}
            activeTab="partners"
            onEntityClick={handleEntityClick}
            onQuickAction={handleQuickAction}
          />
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <EntityTabs
            entities={entities}
            activeTab="tools"
            onEntityClick={handleEntityClick}
            onQuickAction={handleQuickAction}
          />
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <EntityTabs
            entities={entities}
            activeTab="policies"
            onEntityClick={handleEntityClick}
            onQuickAction={handleQuickAction}
          />
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <EntityTabs
            entities={entities}
            activeTab="regions"
            onEntityClick={handleEntityClick}
            onQuickAction={handleQuickAction}
          />
        </TabsContent>
      </Tabs>

      {/* Remediation Drawer */}
      <RemediationDrawer
        isOpen={remediationDrawer.isOpen}
        onClose={() => setRemediationDrawer({ isOpen: false })}
        entity={remediationDrawer.entity}
        alert={remediationDrawer.alert}
        onSubmit={handleRemediationSubmit}
      />
    </div>
  );
}