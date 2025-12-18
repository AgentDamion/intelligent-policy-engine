import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, Wrench, Shield, Activity } from 'lucide-react';
import { useAgencyToolInventory } from '@/hooks/useAgencyToolInventory';

interface AgencyToolsTabProps {
  clientId?: string;
}

export const AgencyToolsTab = ({ clientId }: AgencyToolsTabProps) => {
  const { tools, loading } = useAgencyToolInventory(clientId);

  const getAgencyStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_use': return <Activity className="h-4 w-4 text-primary" />;
      case 'restricted': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getClientStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'not_allowed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getAgencyStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'in_use': return 'bg-primary/10 text-primary border-primary/20';
      case 'restricted': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getClientStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'not_allowed': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Agency Tool Inventory
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare agency-wide tool approvals with client-specific permissions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Tool Name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Agency Status</div>
              <div className="col-span-3">Client Status</div>
              <div className="col-span-1">Risk</div>
              <div className="col-span-1">Usage</div>
            </div>

            {tools.map((tool) => (
              <div key={tool.id} className="grid grid-cols-12 gap-4 p-3 hover:bg-muted/30 rounded-lg transition-colors">
                <div className="col-span-3 font-medium">{tool.name}</div>
                <div className="col-span-2 text-sm text-muted-foreground">{tool.category}</div>
                
                <div className="col-span-2">
                  <Badge className={getAgencyStatusColor(tool.agencyStatus)} variant="outline">
                    {getAgencyStatusIcon(tool.agencyStatus)}
                    <span className="ml-1 capitalize">{tool.agencyStatus.replace('_', ' ')}</span>
                  </Badge>
                </div>
                
                <div className="col-span-3 flex items-center gap-2">
                  <Badge className={getClientStatusColor(tool.clientStatus)} variant="outline">
                    {getClientStatusIcon(tool.clientStatus)}
                    <span className="ml-1 capitalize">{tool.clientStatus.replace('_', ' ')}</span>
                  </Badge>
                  {tool.clientStatus === 'not_allowed' && tool.agencyStatus === 'approved' && (
                    <span className="text-xs text-muted-foreground">
                      (Conflict)
                    </span>
                  )}
                </div>
                
                <div className="col-span-1">
                  <Badge variant="outline" className={`border-0 ${getRiskColor(tool.riskLevel)}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {tool.riskLevel}
                  </Badge>
                </div>
                
                <div className="col-span-1 text-sm text-muted-foreground">
                  {tool.usageCount}x
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {tools.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tools Found</h3>
            <p className="text-muted-foreground">
              Agency tools will appear here once your inventory is configured.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};