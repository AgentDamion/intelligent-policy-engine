import { useState, useEffect } from 'react';
import { useClientsData } from '@/hooks/useClientsData';

export interface ClientContext {
  clientId: string;
  clientName: string;
  workspaceName: string;
  enterpriseId: string;
  workspaceId: string;
  policiesCount: number;
  toolsCount: number;
  complianceReadiness: number;
}

export const useClientContext = () => {
  const [selectedContext, setSelectedContext] = useState<ClientContext | null>(null);
  const { clients } = useClientsData();

  const selectClient = (clientId: string) => {
    const client = clients.find(c => c.id.toString() === clientId);
    if (client) {
      setSelectedContext({
        clientId: clientId,
        clientName: client.name,
        workspaceName: 'Main Workspace', // Default workspace name
        enterpriseId: client.id.toString(),
        workspaceId: `ws-${client.id}`,
        policiesCount: Math.floor(Math.random() * 8) + 3, // Sample data
        toolsCount: Math.floor(Math.random() * 25) + 15, // Sample data
        complianceReadiness: client.complianceScore
      });
    }
  };

  // Auto-select first client if none selected
  useEffect(() => {
    if (!selectedContext && clients.length > 0) {
      selectClient(clients[0].id.toString());
    }
  }, [clients, selectedContext]);

  return {
    selectedContext,
    selectClient,
    availableClients: clients
  };
};