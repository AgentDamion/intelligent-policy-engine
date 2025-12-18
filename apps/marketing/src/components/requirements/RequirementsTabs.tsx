import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PoliciesRequirementsTab } from './PoliciesRequirementsTab';
import { ToolCategoriesTab } from './ToolCategoriesTab';
import { AgencyToolsTab } from './AgencyToolsTab';
import { ClientContext } from '@/hooks/useClientContext';

interface RequirementsTabsProps {
  context: ClientContext | null;
}

export const RequirementsTabs = ({ context }: RequirementsTabsProps) => {
  return (
    <Tabs defaultValue="policies" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="policies">Policies & Requirements</TabsTrigger>
        <TabsTrigger value="categories">Tool Categories</TabsTrigger>
        <TabsTrigger value="agency-tools">My Agency Tools</TabsTrigger>
      </TabsList>
      
      <TabsContent value="policies" className="space-y-4">
        <PoliciesRequirementsTab clientId={context?.clientId} />
      </TabsContent>
      
      <TabsContent value="categories" className="space-y-4">
        <ToolCategoriesTab clientId={context?.clientId} />
      </TabsContent>
      
      <TabsContent value="agency-tools" className="space-y-4">
        <AgencyToolsTab clientId={context?.clientId} />
      </TabsContent>
    </Tabs>
  );
};