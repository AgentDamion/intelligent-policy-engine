import { useState, useEffect, useMemo } from 'react';
import { useSupabaseSubmissions, SubmissionData } from './useSupabaseSubmissions';
import { useClientsData } from './useClientsData';

export interface ClientPerformanceData {
  id: number;
  name: string;
  onTimeRate: number;
  approvalRate: number;
  avgCycleTime: number;
  totalSubmissions: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TrendData {
  period: string;
  onTimeRate: number;
  approvalRate: number;
  avgCycleTime: number;
}

export interface PerformanceMetrics {
  onTimeRate: number;
  approvalRate: number;
  avgCycleTime: number;
  totalSubmissions: number;
  clientPerformance: ClientPerformanceData[];
  historicalTrends: TrendData[];
}

export const useAgencyPerformance = (workspaceId?: string) => {
  const { submissions, loading: submissionsLoading } = useSupabaseSubmissions(workspaceId);
  const { clients, loading: clientsLoading } = useClientsData();
  const [loading, setLoading] = useState(true);

  const calculateCycleTime = (submission: SubmissionData): number => {
    if (!submission.created_at || !submission.decided_at) return 0;
    
    const created = new Date(submission.created_at);
    const decided = new Date(submission.decided_at);
    return Math.ceil((decided.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // Days
  };

  const isOnTime = (submission: SubmissionData): boolean => {
    // Mock logic - in real implementation, compare with expected delivery dates
    if (!submission.submitted_at) return false;
    
    const submitted = new Date(submission.submitted_at);
    const created = new Date(submission.created_at);
    const daysDiff = (submitted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    
    // Assume 7 days is the standard deadline
    return daysDiff <= 7;
  };

  const metrics: PerformanceMetrics = useMemo(() => {
    if (!submissions.length) {
      return {
        onTimeRate: 0,
        approvalRate: 0,
        avgCycleTime: 0,
        totalSubmissions: 0,
        clientPerformance: [],
        historicalTrends: []
      };
    }

    // Filter submissions with relevant data
    const completedSubmissions = submissions.filter(s => 
      s.status === 'approved' || s.status === 'rejected' || s.status === 'changes_requested'
    );

    const submittedSubmissions = submissions.filter(s => s.submitted_at);

    // Calculate overall metrics
    const onTimeSubmissions = submittedSubmissions.filter(isOnTime).length;
    const onTimeRate = submittedSubmissions.length > 0 
      ? Math.round((onTimeSubmissions / submittedSubmissions.length) * 100)
      : 0;

    const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
    const approvalRate = completedSubmissions.length > 0
      ? Math.round((approvedSubmissions / completedSubmissions.length) * 100)
      : 0;

    const cycleTimes = completedSubmissions
      .map(calculateCycleTime)
      .filter(time => time > 0);
    
    const avgCycleTime = cycleTimes.length > 0
      ? Math.round(cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length)
      : 0;

    // Calculate client performance
    const clientPerformance: ClientPerformanceData[] = clients.map(client => {
      // Mock client-specific submissions (in real implementation, filter by client_id)
      const clientSubmissions = submissions.slice(0, Math.floor(submissions.length / clients.length));
      const clientCompleted = clientSubmissions.filter(s => 
        s.status === 'approved' || s.status === 'rejected' || s.status === 'changes_requested'
      );
      const clientSubmitted = clientSubmissions.filter(s => s.submitted_at);

      const clientOnTime = clientSubmitted.filter(isOnTime).length;
      const clientApproved = clientSubmissions.filter(s => s.status === 'approved').length;
      
      const clientCycleTimes = clientCompleted
        .map(calculateCycleTime)
        .filter(time => time > 0);

      return {
        id: client.id,
        name: client.name,
        onTimeRate: clientSubmitted.length > 0 
          ? Math.round((clientOnTime / clientSubmitted.length) * 100)
          : 0,
        approvalRate: clientCompleted.length > 0
          ? Math.round((clientApproved / clientCompleted.length) * 100)
          : 0,
        avgCycleTime: clientCycleTimes.length > 0
          ? Math.round(clientCycleTimes.reduce((sum, time) => sum + time, 0) / clientCycleTimes.length)
          : 0,
        totalSubmissions: clientSubmissions.length,
        riskLevel: client.riskLevel || 'medium'
      };
    });

    // Generate historical trends (mock data for demo)
    const historicalTrends: TrendData[] = [
      { period: 'Last 7 days', onTimeRate: onTimeRate + 5, approvalRate: approvalRate - 3, avgCycleTime: avgCycleTime + 1 },
      { period: 'Last 30 days', onTimeRate: onTimeRate, approvalRate: approvalRate, avgCycleTime: avgCycleTime },
      { period: 'Last 90 days', onTimeRate: onTimeRate - 8, approvalRate: approvalRate + 2, avgCycleTime: avgCycleTime + 2 },
    ];

    return {
      onTimeRate,
      approvalRate,
      avgCycleTime,
      totalSubmissions: submissions.length,
      clientPerformance,
      historicalTrends
    };
  }, [submissions, clients]);

  useEffect(() => {
    setLoading(submissionsLoading || clientsLoading);
  }, [submissionsLoading, clientsLoading]);

  return {
    metrics,
    loading,
    refreshData: () => {
      // Trigger refresh of underlying data
      window.location.reload();
    }
  };
};