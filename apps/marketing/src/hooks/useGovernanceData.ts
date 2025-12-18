import { useState, useEffect, useMemo } from 'react';
import { 
  GovernanceEntity, 
  GovernanceAlert, 
  calculateGovernanceHealth,
  generateSparklineData 
} from '@/utils/governanceCalculations';
import { GovernanceService } from '@/services/governanceService';
import { insertSampleGovernanceData } from '@/utils/sampleGovernanceData';

export interface GovernanceFilters {
  timeRange: '7d' | '30d' | '90d' | 'custom';
  segment: 'all' | 'client' | 'partner' | 'tool' | 'policy';
  riskTiers: ('high' | 'medium' | 'low')[];
  statuses: ('approved' | 'pending' | 'blocked')[];
  search: string;
  region?: string;
}

export interface GovernanceMetrics {
  governanceHealth: number;
  compliance: number;
  toolApproval: number;
  auditCompleteness: number;
  openRisks: number;
  overdueItems: number;
  sparklineData: number[];
  changeFromPrevious: number;
}

const generateMockEntities = (): GovernanceEntity[] => {
  const clients = [
    'Global Pharma Corp', 'TechStart Industries', 'MedDevice Solutions', 'BioTech Innovations',
    'Finance Corp', 'Marketing Agency Pro', 'Healthcare Solutions', 'AI Research Lab'
  ];
  
  const partners = [
    'Creative Studio', 'Data Analytics Co', 'Content Agency', 'Design Partners',
    'Marketing Hub', 'Tech Solutions', 'Strategy Consultants'
  ];

  const entities: GovernanceEntity[] = [];

  // Generate client entities
  clients.forEach((name, index) => {
    const compliance = 75 + Math.random() * 25;
    const toolApproval = 70 + Math.random() * 30;
    const auditCompleteness = 80 + Math.random() * 20;
    
    entities.push({
      id: `client-${index}`,
      name,
      type: 'client',
      compliance,
      toolApproval,
      auditCompleteness,
      ghi: calculateGovernanceHealth({ compliance, toolApproval, auditCompleteness }),
      openRisks: Math.floor(Math.random() * 8),
      lastUpdate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      owner: ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson'][Math.floor(Math.random() * 4)],
      region: ['US', 'EU', 'APAC', 'Canada'][Math.floor(Math.random() * 4)]
    });
  });

  // Generate partner entities
  partners.forEach((name, index) => {
    const compliance = 70 + Math.random() * 30;
    const toolApproval = 75 + Math.random() * 25;
    const auditCompleteness = 85 + Math.random() * 15;
    
    entities.push({
      id: `partner-${index}`,
      name,
      type: 'partner',
      compliance,
      toolApproval,
      auditCompleteness,
      ghi: calculateGovernanceHealth({ compliance, toolApproval, auditCompleteness }),
      openRisks: Math.floor(Math.random() * 5),
      lastUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      owner: ['Alex Chen', 'Maria Garcia', 'David Kim', 'Emma Brown'][Math.floor(Math.random() * 4)],
      region: ['US', 'EU', 'APAC'][Math.floor(Math.random() * 3)]
    });
  });

  return entities;
};

const generateMockAlerts = (): GovernanceAlert[] => {
  return [
    {
      id: 'alert-1',
      severity: 'critical',
      title: 'MetaLoop Processing Delay',
      description: 'High-volume client experiencing 48hr+ processing delays',
      entity: 'Global Pharma Corp',
      entityType: 'client',
      daysOpen: 3,
      assignee: 'John Smith',
      category: 'Performance'
    },
    {
      id: 'alert-2',
      severity: 'warning',
      title: 'Pending Tool Approvals',
      description: '12 AI tools awaiting approval for Q1 compliance',
      entity: 'Creative Studio',
      entityType: 'partner',
      daysOpen: 5,
      assignee: 'Sarah Johnson',
      category: 'Compliance'
    },
    {
      id: 'alert-3',
      severity: 'critical',
      title: 'Audit Gap Detected',
      description: 'Missing documentation for 25% of AI tool decisions',
      entity: 'TechStart Industries',
      entityType: 'client',
      daysOpen: 1,
      category: 'Audit'
    },
    {
      id: 'alert-4',
      severity: 'info',
      title: 'Policy Distribution Complete',
      description: 'Q1 2025 AI governance policies distributed to all partners',
      entity: 'System',
      entityType: 'policy',
      daysOpen: 0,
      category: 'Policy'
    },
    {
      id: 'alert-5',
      severity: 'warning',
      title: 'Risk Score Threshold',
      description: 'BioTech Innovations approaching yellow band threshold',
      entity: 'BioTech Innovations',
      entityType: 'client',
      daysOpen: 2,
      assignee: 'Mike Davis',
      category: 'Risk'
    }
  ];
};

export const useGovernanceData = (filters: GovernanceFilters) => {
  const [entities, setEntities] = useState<GovernanceEntity[]>([]);
  const [alerts, setAlerts] = useState<GovernanceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [entitiesData, alertsData] = await Promise.all([
          GovernanceService.fetchGovernanceEntities(),
          GovernanceService.fetchGovernanceAlerts()
        ]);
        
        // If no real data exists, create sample data and use mock as fallback
        if (entitiesData.length === 0) {
          await insertSampleGovernanceData();
          // Re-fetch after inserting sample data
          const [newEntitiesData, newAlertsData] = await Promise.all([
            GovernanceService.fetchGovernanceEntities(),
            GovernanceService.fetchGovernanceAlerts()
          ]);
          setEntities(newEntitiesData.length > 0 ? newEntitiesData : generateMockEntities());
          setAlerts(newAlertsData.length > 0 ? newAlertsData : generateMockAlerts());
        } else {
          setEntities(entitiesData);
          setAlerts(alertsData.length > 0 ? alertsData : generateMockAlerts());
        }
      } catch (error) {
        console.error('Error fetching governance data:', error);
        // Use mock data as fallback
        setEntities(generateMockEntities());
        setAlerts(generateMockAlerts());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
      // Apply segment filter
      if (filters.segment !== 'all' && entity.type !== filters.segment) {
        return false;
      }

      // Apply search filter
      if (filters.search && !entity.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Apply region filter
      if (filters.region && entity.region !== filters.region) {
        return false;
      }

      return true;
    });
  }, [entities, filters]);

  const metrics = useMemo((): GovernanceMetrics => {
    if (filteredEntities.length === 0) {
      return {
        governanceHealth: 0,
        compliance: 0,
        toolApproval: 0,
        auditCompleteness: 0,
        openRisks: 0,
        overdueItems: 0,
        sparklineData: [],
        changeFromPrevious: 0
      };
    }

    const totalEntities = filteredEntities.length;
    const avgCompliance = filteredEntities.reduce((sum, e) => sum + e.compliance, 0) / totalEntities;
    const avgToolApproval = filteredEntities.reduce((sum, e) => sum + e.toolApproval, 0) / totalEntities;
    const avgAuditCompleteness = filteredEntities.reduce((sum, e) => sum + e.auditCompleteness, 0) / totalEntities;
    const totalOpenRisks = filteredEntities.reduce((sum, e) => sum + e.openRisks, 0);

    const governanceHealth = calculateGovernanceHealth({
      compliance: avgCompliance,
      toolApproval: avgToolApproval,
      auditCompleteness: avgAuditCompleteness
    });

    return {
      governanceHealth,
      compliance: Math.round(avgCompliance),
      toolApproval: Math.round(avgToolApproval),
      auditCompleteness: Math.round(avgAuditCompleteness),
      openRisks: totalOpenRisks,
      overdueItems: Math.floor(totalOpenRisks * 0.3),
      sparklineData: generateSparklineData(governanceHealth),
      changeFromPrevious: 3.2 // Mock value
    };
  }, [filteredEntities]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filters.search && !alert.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [alerts, filters]);

  return {
    entities: filteredEntities,
    alerts: filteredAlerts,
    metrics,
    loading
  };
};