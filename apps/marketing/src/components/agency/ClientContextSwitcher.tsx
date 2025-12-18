import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';
import { useClientsData } from '@/hooks/useClientsData';

interface Client {
  id: string;
  name: string;
  enterprise_id: string;
  status: 'active' | 'warning' | 'inactive';
  pending_submissions: number;
  compliance_score: number;
  last_activity: string;
  tools_count: number;
}

interface ClientContextSwitcherProps {
  selectedClient?: string;
  onClientChange: (clientId: string) => void;
  onAddClient: () => void;
}

export const ClientContextSwitcher = ({ 
  selectedClient, 
  onClientChange, 
  onAddClient 
}: ClientContextSwitcherProps) => {
  const { clients: clientsData } = useClientsData();
  
  // Transform clients data to match expected format
  const clients: Client[] = clientsData.map(client => ({
    id: client.id.toString(),
    name: client.name,
    enterprise_id: client.id.toString(),
    status: client.status === 'active' ? 'active' : 'warning',
    pending_submissions: Math.floor(Math.random() * 10) + 1,
    compliance_score: client.complianceScore,
    last_activity: client.lastUpdate,
    tools_count: Math.floor(Math.random() * 20) + 5
  }));

  const selectedClientData = clients.find(c => c.id === selectedClient);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'inactive': return <Clock className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'inactive': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      {/* Client Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedClient} onValueChange={onClientChange}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <SelectValue placeholder="Select a client to manage" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(client.status)}
                      <span className="font-medium">{client.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{client.pending_submissions} pending</span>
                      <span>•</span>
                      <span className={getComplianceColor(client.compliance_score)}>
                        {client.compliance_score}% compliant
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={onAddClient}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Selected Client Overview */}
      {selectedClientData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-teal/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-brand-teal" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedClientData.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Last activity: {new Date(selectedClientData.last_activity).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(selectedClientData.status)}>
                {getStatusIcon(selectedClientData.status)}
                <span className="ml-1 capitalize">{selectedClientData.status}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {selectedClientData.pending_submissions}
                </div>
                <div className="text-xs text-muted-foreground">Pending Reviews</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getComplianceColor(selectedClientData.compliance_score)}`}>
                  {selectedClientData.compliance_score}%
                </div>
                <div className="text-xs text-muted-foreground">Compliance Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedClientData.tools_count}
                </div>
                <div className="text-xs text-muted-foreground">AI Tools</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {clients.length}
                </div>
                <div className="text-xs text-muted-foreground">Total Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions for Selected Client */}
      {selectedClientData && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
          <Button size="sm" variant="outline">
            <AlertTriangle className="h-4 w-4 mr-2" />
            View Conflicts
          </Button>
          <Button size="sm">
            Review Submissions
          </Button>
        </div>
      )}
    </div>
  );
};