import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  policies: number;
  lastUpdate?: string;
  complianceScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface AgencyClientsListProps {
  clients: Client[];
}

const AgencyClientsList = ({ clients }: AgencyClientsListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Management</CardTitle>
        <CardDescription>Manage all your client relationships and compliance status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <Building2 className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="font-medium text-lg">{client.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{client.policies} policies</span>
                    <span>Updated {client.lastUpdate}</span>
                    <span>Compliance: {client.complianceScore}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={getRiskColor(client.riskLevel || 'low')}>
                  {client.riskLevel} risk
                </Badge>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm">
                    Manage Policies
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgencyClientsList;