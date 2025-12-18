import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Building, CheckCircle, AlertTriangle } from 'lucide-react';

const PartnersPage: React.FC = () => {
  const partners = [
    { id: 1, name: 'Digital Marketing Pro', compliance: 95, status: 'active', tools: 12 },
    { id: 2, name: 'Creative Agency Inc', compliance: 78, status: 'review', tools: 8 },
    { id: 3, name: 'Tech Solutions Ltd', compliance: 100, status: 'active', tools: 15 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'review':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Partner Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your partner relationships and compliance
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Invite Partner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Partners
            </CardTitle>
            <CardDescription>Currently managed partners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.filter(p => p.status === 'active').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Compliant Partners
            </CardTitle>
            <CardDescription>Partners meeting all requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.filter(p => p.compliance >= 90).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Needs Review
            </CardTitle>
            <CardDescription>Partners requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.filter(p => p.status === 'review').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Directory</CardTitle>
          <CardDescription>Overview of all your managed partners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {partners.map((partner) => (
              <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(partner.status)}`} />
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{partner.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {partner.tools} tools managed
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{partner.compliance}%</div>
                    <div className="text-sm text-muted-foreground">compliance</div>
                  </div>
                  <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                    {partner.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnersPage;