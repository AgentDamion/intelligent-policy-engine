import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Client {
  id: string;
  name: string;
  type: string;
  status: string;
  lastActivity: string;
}

interface ClientsListProps {
  clients: Client[];
  loading: boolean;
  agencyId: string;
}

const ClientsList = ({ clients, loading, agencyId }: ClientsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Clients</CardTitle>
        <CardDescription>Welcome new organizations and track all partners your agency supports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.length > 0 ? (
            clients.map((client, index) => (
              <div key={client.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{client.name?.charAt(0) || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{client.name || `Client ${index + 1}`}</p>
                    <p className="text-sm text-gray-600">{client.type || 'Organization'}</p>
                  </div>
                </div>
                <Badge variant={client.status === 'active' ? 'default' : 'outline'}>
                  {client.status || 'Active'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 relative">
              {/* Hummingbird watermark for empty state */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 opacity-10">
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M2 12 L14 10 L24 4" stroke="hsl(var(--teal))" strokeWidth="2" fill="none"/>
                  <ellipse cx="16" cy="12" rx="7" ry="6" stroke="hsl(var(--teal))" strokeWidth="2" fill="none"/>
                  <circle cx="19" cy="12" r="1.2" fill="hsl(var(--teal))"/>
                  <path d="M14 10 Q10 6 7 16 Q14 14 14 10" stroke="hsl(var(--orange))" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-700">
                  {loading ? 'Checking your network...' : 'No client organizations yet. Invite your first to see agentic compliance in action!'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {!loading && 'Your hummingbird copilot is ready to welcome new partners into your trusted network.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientsList;