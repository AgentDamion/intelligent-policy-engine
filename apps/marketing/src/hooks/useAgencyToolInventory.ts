import { useState, useEffect } from 'react';

export interface AgencyTool {
  id: string;
  name: string;
  category: string;
  agencyStatus: 'approved' | 'in_use' | 'restricted';
  clientStatus: 'approved' | 'pending' | 'not_allowed';
  riskLevel: 'high' | 'medium' | 'low';
  lastUsed: string;
  usageCount: number;
}

export const useAgencyToolInventory = (clientId?: string) => {
  const [tools, setTools] = useState<AgencyTool[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgencyTools = async () => {
    setLoading(true);
    
    // Sample data - in real implementation would fetch from Supabase
    const sampleTools: AgencyTool[] = [
      {
        id: '1',
        name: 'Canva',
        category: 'Visual Design',
        agencyStatus: 'approved',
        clientStatus: 'approved',
        riskLevel: 'low',
        lastUsed: '2024-01-20T10:00:00Z',
        usageCount: 45
      },
      {
        id: '2',
        name: 'Midjourney',
        category: 'Visual Design',
        agencyStatus: 'in_use',
        clientStatus: 'not_allowed',
        riskLevel: 'high',
        lastUsed: '2024-01-19T14:30:00Z',
        usageCount: 12
      },
      {
        id: '3',
        name: 'ChatGPT',
        category: 'Content Creation',
        agencyStatus: 'approved',
        clientStatus: 'approved',
        riskLevel: 'medium',
        lastUsed: '2024-01-20T15:45:00Z',
        usageCount: 78
      },
      {
        id: '4',
        name: 'Jasper AI',
        category: 'Content Creation',
        agencyStatus: 'approved',
        clientStatus: 'pending',
        riskLevel: 'low',
        lastUsed: '2024-01-18T09:20:00Z',
        usageCount: 23
      },
      {
        id: '5',
        name: 'Synthesia',
        category: 'Video Production',
        agencyStatus: 'in_use',
        clientStatus: 'approved',
        riskLevel: 'medium',
        lastUsed: '2024-01-17T11:15:00Z',
        usageCount: 8
      },
      {
        id: '6',
        name: 'ElevenLabs',
        category: 'Audio Production',
        agencyStatus: 'approved',
        clientStatus: 'pending',
        riskLevel: 'medium',
        lastUsed: '2024-01-16T16:30:00Z',
        usageCount: 15
      },
      {
        id: '7',
        name: 'Adobe Firefly',
        category: 'Specialized Creative',
        agencyStatus: 'approved',
        clientStatus: 'approved',
        riskLevel: 'medium',
        lastUsed: '2024-01-20T13:10:00Z',
        usageCount: 31
      },
      {
        id: '8',
        name: 'Runway ML',
        category: 'Video Production',
        agencyStatus: 'restricted',
        clientStatus: 'not_allowed',
        riskLevel: 'high',
        lastUsed: '2024-01-10T08:45:00Z',
        usageCount: 3
      }
    ];

    setTools(sampleTools);
    setLoading(false);
  };

  useEffect(() => {
    if (clientId) {
      fetchAgencyTools();
    }
  }, [clientId]);

  return {
    tools,
    loading,
    refetch: fetchAgencyTools
  };
};