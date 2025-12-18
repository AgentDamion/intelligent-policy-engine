import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenarioCanvas } from '../ScenarioCanvas';
import { DeclarationsPanel } from '@/components/agentic/configuration/DeclarationsPanel';
import { Card } from '@/components/ui/card';

interface ConfigurationTabProps {
  workspaceId: string;
  enterpriseId: string;
}

export function ConfigurationTab({ workspaceId, enterpriseId }: ConfigurationTabProps) {
  const [activeView, setActiveView] = useState('registry');

  return (
    <div className="h-full p-6">
      <Tabs value={activeView} onValueChange={setActiveView} className="h-full flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="registry">Asset Registry</TabsTrigger>
          <TabsTrigger value="declarations">Declarations</TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="flex-1">
          <Card className="p-6 h-full">
            <ScenarioCanvas
              workspaceId={workspaceId}
              enterpriseId={enterpriseId}
              onRunSimulation={(scenario) => console.log('Run simulation:', scenario)}
            />
          </Card>
        </TabsContent>

        <TabsContent value="declarations" className="flex-1">
          <DeclarationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
