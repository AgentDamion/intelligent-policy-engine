import React from 'react';
import { FeatureGate } from '@/components/FeatureGate';
import { AuditPackageExporter } from '@/components/enterprise/AuditPackageExporter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SpecBadge from '@/components/ui/SpecBadge';
import { FileCheck, Shield, Download } from 'lucide-react';

const AuditTrail = () => {
  // Mock audit log data
  const recentAudits = [
    {
      id: 'audit-001',
      timestamp: '2025-01-15T10:30:00Z',
      event: 'Policy Decision',
      actor: 'AI Agent: Compliance Reviewer',
      details: 'Approved policy submission for ChatGPT usage',
      riskLevel: 'low'
    },
    {
      id: 'audit-002', 
      timestamp: '2025-01-15T09:15:00Z',
      event: 'Tool Registration',
      actor: 'john.doe@company.com',
      details: 'Registered new AI tool: Claude-3.5-Sonnet',
      riskLevel: 'medium'
    },
    {
      id: 'audit-003',
      timestamp: '2025-01-15T08:45:00Z',
      event: 'Compliance Check',
      actor: 'AI Agent: Risk Scanner',
      details: 'Automated compliance scan completed - 98% compliant',
      riskLevel: 'low'
    }
  ];

  const getRiskBadge = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      high: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground">
            Immutable compliance log with FDA-ready export packages
          </p>
        </div>
        <SpecBadge id="E3" />
      </div>

      <Tabs defaultValue="live-feed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="live-feed">Live Audit Feed</TabsTrigger>
          <TabsTrigger value="export">Export Packages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="live-feed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Recent Audit Events
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAudits.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{audit.event}</h4>
                        <Badge className={getRiskBadge(audit.riskLevel)}>
                          {audit.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{audit.details}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Actor: {audit.actor}</span>
                        <span>Time: {new Date(audit.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <FeatureGate feature="audit_export">
            <AuditPackageExporter />
          </FeatureGate>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98.3%</div>
                <p className="text-xs text-muted-foreground">Above target</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Risk Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">23</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditTrail;