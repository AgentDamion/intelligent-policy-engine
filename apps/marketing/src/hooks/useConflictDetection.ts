import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientsData } from './useClientsData';

export interface PolicyConflict {
  id: string;
  client_id?: string;
  agency_id?: string;
  conflict_type: string;
  agency_name?: string;
  client_name?: string;
  target_workspace_id?: string;
  distribution_id?: string;
  version_number?: number;
  policy_id?: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  resolution_status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
}

export interface ConflictSummary {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  dismissed: number;
  by_severity: {
    low: number;
    medium: number;
    high: number;
  };
  by_type: Record<string, number>;
}

export interface ConflictAnalytics {
  conflicts: PolicyConflict[];
  summary: ConflictSummary;
  trending: {
    new_this_week: number;
    resolved_this_week: number;
    avg_resolution_time: number;
  };
}

export const useConflictDetection = (workspaceId?: string) => {
  const [conflicts, setConflicts] = useState<PolicyConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ConflictAnalytics | null>(null);
  const { clients } = useClientsData();

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would query the agency_policy_conflicts table
      // For now, we'll generate realistic sample data based on clients
      const sampleConflicts: PolicyConflict[] = [
        {
          id: '1',
          client_id: '1',
          agency_id: 'agency123',
          conflict_type: 'policy_overlap',
          agency_name: 'Digital Health Agency',
          client_name: 'Pfizer Inc.',
          severity: 'high',
          description: 'AI tool usage policy conflicts with data privacy requirements for clinical trials',
          resolution_status: 'open',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          client_id: '2',
          agency_id: 'agency123',
          conflict_type: 'timeline_conflict',
          agency_name: 'Digital Health Agency',
          client_name: 'Novartis AG',
          severity: 'medium',
          description: 'Competing submission deadlines for Q1 compliance review',
          resolution_status: 'in_progress',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          client_id: '3',
          agency_id: 'agency123',
          conflict_type: 'resource_allocation',
          agency_name: 'Digital Health Agency',
          client_name: 'JPMorgan Chase',
          severity: 'low',
          description: 'AI model validation requirements exceed allocated testing capacity',
          resolution_status: 'resolved',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          client_id: '1',
          agency_id: 'agency123',
          conflict_type: 'compliance_gap',
          agency_name: 'Digital Health Agency',
          client_name: 'Pfizer Inc.',
          severity: 'high',
          description: 'FDA guidance update conflicts with existing AI governance framework',
          resolution_status: 'open',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          client_id: '2',
          agency_id: 'agency123',
          conflict_type: 'ai_tool_conflict',
          agency_name: 'Digital Health Agency',
          client_name: 'Novartis AG',
          severity: 'medium',
          description: 'Proposed ChatGPT usage conflicts with data confidentiality requirements',
          resolution_status: 'in_progress',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setConflicts(sampleConflicts);

      // Calculate analytics
      const summary: ConflictSummary = {
        total: sampleConflicts.length,
        open: sampleConflicts.filter(c => c.resolution_status === 'open').length,
        in_progress: sampleConflicts.filter(c => c.resolution_status === 'in_progress').length,
        resolved: sampleConflicts.filter(c => c.resolution_status === 'resolved').length,
        dismissed: sampleConflicts.filter(c => c.resolution_status === 'dismissed').length,
        by_severity: {
          low: sampleConflicts.filter(c => c.severity === 'low').length,
          medium: sampleConflicts.filter(c => c.severity === 'medium').length,
          high: sampleConflicts.filter(c => c.severity === 'high').length,
        },
        by_type: sampleConflicts.reduce((acc, conflict) => {
          acc[conflict.conflict_type] = (acc[conflict.conflict_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newThisWeek = sampleConflicts.filter(c => new Date(c.created_at) > weekAgo).length;
      const resolvedThisWeek = sampleConflicts.filter(c => 
        c.resolved_at && new Date(c.resolved_at) > weekAgo
      ).length;

      setAnalytics({
        conflicts: sampleConflicts,
        summary,
        trending: {
          new_this_week: newThisWeek,
          resolved_this_week: resolvedThisWeek,
          avg_resolution_time: 4.2 // days
        }
      });

    } catch (error) {
      console.error('Failed to fetch conflicts:', error);
      setConflicts([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const updateConflictStatus = async (conflictId: string, status: PolicyConflict['resolution_status']) => {
    // In real implementation, this would update the database
    setConflicts(prev => prev.map(conflict => 
      conflict.id === conflictId 
        ? { 
            ...conflict, 
            resolution_status: status,
            resolved_at: status === 'resolved' ? new Date().toISOString() : undefined
          }
        : conflict
    ));
  };

  const runConflictScan = async () => {
    setLoading(true);
    // Simulate conflict detection scan
    await new Promise(resolve => setTimeout(resolve, 2000));
    await fetchConflicts();
  };

  useEffect(() => {
    fetchConflicts();
  }, [workspaceId]);

  return {
    conflicts,
    analytics,
    loading,
    updateConflictStatus,
    runConflictScan,
    refreshData: fetchConflicts
  };
};