import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface Client {
  id: number;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  policies: number;
  lastUpdate?: string;
  complianceScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface ClientActivityProps {
  clients: Client[];
}

const ClientActivity = ({ clients }: ClientActivityProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Client Activity</CardTitle>
        <CardDescription>Latest updates from your clients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.slice(0, 3).map((client) => (
            <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-gray-400" />
                <div>
                  <h4 className="font-medium">{client.name}</h4>
                  <p className="text-sm text-gray-600">
                    {client.policies} policies • Last updated {client.lastUpdate}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium">{client.complianceScore}%</div>
                  <div className="text-xs text-gray-500">Compliance</div>
                </div>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientActivity;