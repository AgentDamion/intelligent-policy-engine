import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { useAgencyToolInventory } from '@/hooks/useAgencyToolInventory';
import SpecBadge from '@/components/ui/SpecBadge';
import AIToolTracking from './AIToolTracking';
import { 
  Wrench, 
  Activity, 
  Settings, 
  Plus,
  Package
} from 'lucide-react';

const MyTools = () => {
  const [activeTab, setActiveTab] = useState('registry');
  const { tools, loading } = useAgencyToolInventory();

  const renderRegistry = () => {
    if (loading) {
      return <div className="text-center py-8">Loading tools...</div>;
    }

    if (tools.length === 0) {
      return (
        <EmptyState
          title="Tool Registry"
          description="Manage your AI tool registry organized by client workspace. Track tool status, versions, and compliance requirements."
          icon={<Wrench />}
          actions={[
            {
              label: "Add New Tool",
              onClick: () => console.log("Add tool"),
              variant: "default"
            },
            {
              label: "Import from Marketplace",
              onClick: () => console.log("Import from marketplace"),
              variant: "outline"
            }
          ]}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <Badge 
                    variant={tool.clientStatus === 'approved' ? 'default' : 
                           tool.clientStatus === 'pending' ? 'secondary' : 'destructive'}
                  >
                    {tool.clientStatus.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{tool.category}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Agency Status:</span>
                    <Badge variant="outline" className="text-xs">
                      {tool.agencyStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Risk Level:</span>
                    <Badge 
                      variant={tool.riskLevel === 'low' ? 'default' : 
                              tool.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {tool.riskLevel}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usage Count:</span>
                    <span className="font-medium">{tool.usageCount}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last used: {new Date(tool.lastUsed).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Tool
          </Button>
          <Button variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            Import from Marketplace
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Tools</h1>
          <p className="text-muted-foreground">Agency's tool registry and project tracking</p>
        </div>
        <SpecBadge id="L4" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registry" className="gap-2">
            <Wrench className="h-4 w-4" />
            Tool Registry
          </TabsTrigger>
          <TabsTrigger value="tracking" className="gap-2">
            <Activity className="h-4 w-4" />
            Project Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registry">
          {renderRegistry()}
        </TabsContent>

        <TabsContent value="tracking">
          <AIToolTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTools;