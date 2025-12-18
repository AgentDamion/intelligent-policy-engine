import { useState, useEffect, useCallback } from 'react';
import { useClientsData } from './useClientsData';
import { useAgentActivities } from './useAgentActivities';
import { useConflictDetection } from './useConflictDetection';

export interface IntegratedDashboardData {
  toolsToGovernanceMapping: {
    toolId: string;
    toolName: string;
    relatedPolicies: string[];
    complianceStatus: 'compliant' | 'non_compliant' | 'pending';
    conflictCount: number;
  }[];
  analyticsToWorkflowMapping: {
    clientId: string;
    clientName: string;
    performanceMetrics: any;
    activeWorkflows: string[];
    recommendedActions: string[];
  }[];
  realTimeEvents: {
    id: string;
    type: 'tool_submission' | 'policy_update' | 'conflict_detected' | 'approval_completed';
    timestamp: Date;
    data: any;
    crossTabImpact: string[];
  }[];
}

export const useCrossTabIntegration = () => {
  const { clients, stats } = useClientsData();
  const { agentActivities } = useAgentActivities();
  const { conflicts, analytics } = useConflictDetection();
  
  const [integratedData, setIntegratedData] = useState<IntegratedDashboardData>({
    toolsToGovernanceMapping: [],
    analyticsToWorkflowMapping: [],
    realTimeEvents: []
  });
  const [loading, setLoading] = useState(false);

  // Cross-tab data integration
  const integrateData = useCallback(() => {
    setLoading(true);

    // Map AI tools to governance policies
    const toolsToGovernanceMapping = [
      {
        toolId: 'tool-1',
        toolName: 'ChatGPT-4o',
        relatedPolicies: ['AI Usage Policy v2.1', 'Data Privacy Policy v1.3'],
        complianceStatus: 'compliant' as const,
        conflictCount: 0
      },
      {
        toolId: 'tool-2',
        toolName: 'Claude 3.5',
        relatedPolicies: ['AI Usage Policy v2.1'],
        complianceStatus: 'pending' as const,
        conflictCount: 1
      },
      {
        toolId: 'tool-3',
        toolName: 'Gemini Pro',
        relatedPolicies: ['AI Usage Policy v2.1', 'Security Policy v1.5'],
        complianceStatus: 'non_compliant' as const,
        conflictCount: 2
      }
    ];

    // Map analytics to workflow recommendations
    const analyticsToWorkflowMapping = clients.map(client => ({
      clientId: client.id.toString(),
      clientName: client.name,
      performanceMetrics: {
        complianceScore: Math.floor(Math.random() * 20) + 80,
        toolUsage: Math.floor(Math.random() * 50) + 20,
        approvalTime: Math.floor(Math.random() * 5) + 1
      },
      activeWorkflows: [
        'Policy Review Workflow',
        'Tool Approval Process'
      ],
      recommendedActions: [
        'Update AI governance policies',
        'Implement automated conflict detection',
        'Enhance approval routing'
      ]
    }));

    // Generate real-time events with cross-tab impact
    const realTimeEvents = [
      {
        id: 'event-1',
        type: 'tool_submission' as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
        data: { toolName: 'Midjourney', client: 'TechCorp', riskLevel: 'medium' },
        crossTabImpact: ['ai_tools_hub', 'governance_hub']
      },
      {
        id: 'event-2',
        type: 'policy_update' as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        data: { policyName: 'AI Usage Policy v2.2', affectedClients: 5 },
        crossTabImpact: ['governance_hub', 'analytics_overview']
      },
      {
        id: 'event-3',
        type: 'conflict_detected' as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
        data: { conflictType: 'policy_version_mismatch', severity: 'high' },
        crossTabImpact: ['governance_hub', 'dashboard_overview']
      }
    ];

    setIntegratedData({
      toolsToGovernanceMapping,
      analyticsToWorkflowMapping,
      realTimeEvents
    });

    setLoading(false);
  }, [clients]);

  // Auto-refresh integrated data
  useEffect(() => {
    integrateData();
    const interval = setInterval(integrateData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [integrateData]);

  const getToolGovernanceStatus = useCallback((toolId: string) => {
    return integratedData.toolsToGovernanceMapping.find(item => item.toolId === toolId);
  }, [integratedData]);

  const getClientWorkflowRecommendations = useCallback((clientId: string) => {
    return integratedData.analyticsToWorkflowMapping.find(item => item.clientId === clientId);
  }, [integratedData]);

  const getRecentCrossTabEvents = useCallback((tabName: string) => {
    return integratedData.realTimeEvents.filter(event => 
      event.crossTabImpact.includes(tabName)
    );
  }, [integratedData]);

  const getIntegratedMetrics = useCallback(() => {
    const totalTools = integratedData.toolsToGovernanceMapping.length;
    const compliantTools = integratedData.toolsToGovernanceMapping.filter(
      tool => tool.complianceStatus === 'compliant'
    ).length;
    const totalConflicts = integratedData.toolsToGovernanceMapping.reduce(
      (sum, tool) => sum + tool.conflictCount, 0
    );
    
    return {
      complianceRate: totalTools > 0 ? Math.round((compliantTools / totalTools) * 100) : 0,
      totalConflicts,
      activeWorkflows: integratedData.analyticsToWorkflowMapping.reduce(
        (sum, client) => sum + client.activeWorkflows.length, 0
      ),
      recentEvents: integratedData.realTimeEvents.length
    };
  }, [integratedData]);

  return {
    integratedData,
    loading,
    // Helper functions
    getToolGovernanceStatus,
    getClientWorkflowRecommendations,
    getRecentCrossTabEvents,
    getIntegratedMetrics,
    // Refresh function
    refresh: integrateData
  };
};