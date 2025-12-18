import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModelRegistryPanel } from './ModelRegistryPanel';
import { DataSourcePanel } from './DataSourcePanel';
import { PartnerCredentialsPanel } from './PartnerCredentialsPanel';

/**
 * ConfigurationView - Asset Registry Management
 * 
 * Three-panel layout following established pattern:
 * - Left: Asset type tabs (Models, Data Sources, Partner Credentials)
 * - Center: Asset list and detail forms
 * - Right: Insights, dependencies, validation results
 */
export function ConfigurationView() {
  const [activeAssetType, setActiveAssetType] = useState<'models' | 'data-sources' | 'credentials'>('models');

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold text-foreground">Configuration & Asset Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage AI models, data sources, and partner credentials with compliance validation
        </p>
      </div>

      {/* Three-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeAssetType} onValueChange={(v) => setActiveAssetType(v as typeof activeAssetType)} className="h-full">
          {/* Left Panel: Asset Type Selector */}
          <div className="h-full flex">
            <div className="w-64 border-r border-border bg-muted/30 p-4">
              <TabsList className="flex flex-col w-full h-auto space-y-2 bg-transparent">
                <TabsTrigger 
                  value="models" 
                  className="w-full justify-start data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <span className="mr-2">🤖</span>
                  AI Models
                </TabsTrigger>
                <TabsTrigger 
                  value="data-sources" 
                  className="w-full justify-start data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <span className="mr-2">🗄️</span>
                  Data Sources
                </TabsTrigger>
                <TabsTrigger 
                  value="credentials" 
                  className="w-full justify-start data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <span className="mr-2">🔑</span>
                  Partner Credentials
                </TabsTrigger>
              </TabsList>

              {/* Quick Stats */}
              <Card className="mt-6 p-4 bg-background/50">
                <h3 className="text-xs font-semibold text-muted-foreground mb-3">Registry Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Models</span>
                    <span className="font-semibold text-foreground">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Sources</span>
                    <span className="font-semibold text-foreground">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Keys</span>
                    <span className="font-semibold text-foreground">5</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-destructive">Validation Errors</span>
                    <span className="font-semibold text-destructive">2</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Center & Right Panels: Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="models" className="h-full m-0">
                <ModelRegistryPanel />
              </TabsContent>
              
              <TabsContent value="data-sources" className="h-full m-0">
                <DataSourcePanel />
              </TabsContent>
              
              <TabsContent value="credentials" className="h-full m-0">
                <PartnerCredentialsPanel />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
