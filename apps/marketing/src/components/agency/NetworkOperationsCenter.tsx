import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Crown, Network } from 'lucide-react';
import { BrandWorkspaceManager } from './BrandWorkspaceManager';
import { AgencyUpgradePath } from './AgencyUpgradePath';
import { ClientContextSwitcher } from './ClientContextSwitcher';

interface NetworkOperationsCenterProps {
  agencyWorkspaceId: string;
  agencyEnterpriseId: string;
}

export const NetworkOperationsCenter: React.FC<NetworkOperationsCenterProps> = ({
  agencyWorkspaceId,
  agencyEnterpriseId
}) => {
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Network Operations Center</h2>
          <p className="text-muted-foreground">
            Manage your enterprise network, brand workspaces, and team access
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Client Network
          </TabsTrigger>
          <TabsTrigger value="brands" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Brand Workspaces
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Access
          </TabsTrigger>
          <TabsTrigger value="enterprise" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Enterprise Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Network Management</CardTitle>
              <CardDescription>
                View and manage your enterprise client relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientContextSwitcher
                selectedClient=""
                onClientChange={() => {}}
                onAddClient={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="mt-6">
          <BrandWorkspaceManager agencyWorkspaceId={agencyWorkspaceId} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Access Management</CardTitle>
              <CardDescription>
                Manage team member access to brand workspaces and client data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Team access management interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enterprise" className="mt-6">
          <AgencyUpgradePath agencyEnterpriseId={agencyEnterpriseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};