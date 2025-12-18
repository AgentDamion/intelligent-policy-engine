import React, { useState } from 'react';
import { Plus, RefreshCw, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientContext } from '@/hooks/useClientContext';
import { ClientContextBar } from '@/components/requirements/ClientContextBar';
import { RequirementsTabs } from '@/components/requirements/RequirementsTabs';
import { ClientSpecificSidebar } from '@/components/requirements/ClientSpecificSidebar';
import SpecBadge from '@/components/ui/SpecBadge';

const Requirements = () => {
  const navigate = useNavigate();
  const { selectedContext, selectClient, availableClients } = useClientContext();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold">Requirements</h1>
              <SpecBadge id="C3" />
            </div>
            <p className="text-muted-foreground">Client-specific policies, tools, and compliance management</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => navigate(routes.submissionWizard)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start Submission
            </Button>
          </div>
        </div>
      </div>

      {/* Client Selection */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <Select 
              value={selectedContext?.clientId} 
              onValueChange={selectClient}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <SelectValue placeholder="Select a client" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableClients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Client Context Bar */}
      <ClientContextBar context={selectedContext} />

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <RequirementsTabs context={selectedContext} />
        </div>
        <div className="lg:col-span-1">
          <ClientSpecificSidebar context={selectedContext} />
        </div>
      </div>
    </div>
  );
};

export default Requirements;