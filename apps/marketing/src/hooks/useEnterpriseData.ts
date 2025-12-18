import { useState, useEffect } from 'react';
import type { Agency, Policy, Submission, EnterpriseStats } from '@/types/enterprise';
import { SupabaseEnterpriseService } from '@/services/supabaseEnterpriseService';

export const useEnterpriseData = (enterpriseId: string = 'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6') => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<EnterpriseStats>({
    activeAgencies: 0,
    activePolicies: 0,
    pendingReviews: 0,
    complianceRate: 0,
    totalViolations: 0
  });
  const [loading, setLoading] = useState(true);
  const enterpriseService = new SupabaseEnterpriseService();

  const fetchEnterpriseData = async () => {
    try {
      const data = await enterpriseService.fetchEnterpriseData(enterpriseId);
      setAgencies(data.agencies);
      setPolicies(data.policies);
      setSubmissions(data.submissions);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch enterprise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt' | 'enterpriseId'>) => {
    try {
      const newPolicy = await enterpriseService.createPolicy(policyData, enterpriseId);
      setPolicies(prev => [...prev, newPolicy]);
      setStats(prev => ({
        ...prev,
        activePolicies: prev.activePolicies + (newPolicy.status === 'active' ? 1 : 0)
      }));
      return newPolicy;
    } catch (error) {
      console.error('Failed to create policy:', error);
      throw error;
    }
  };

  const updatePolicy = async (policyId: number, updates: Partial<Policy>) => {
    try {
      const updatedPolicy = await enterpriseService.updatePolicy(policyId.toString(), updates);
      setPolicies(prev => prev.map(p => p.id === policyId ? updatedPolicy : p));
      
      // Update stats if status changed
      setStats(prev => {
        const oldPolicy = policies.find(p => p.id === policyId);
        let activeDiff = 0;
        
        if (oldPolicy?.status !== updatedPolicy.status) {
          if (oldPolicy?.status === 'active') activeDiff -= 1;
          if (updatedPolicy.status === 'active') activeDiff += 1;
        }
        
        return {
          ...prev,
          activePolicies: prev.activePolicies + activeDiff
        };
      });
    } catch (error) {
      console.error('Failed to update policy:', error);
      throw error;
    }
  };

  const archivePolicy = async (policyId: number) => {
    try {
      await enterpriseService.archivePolicy(policyId.toString());
      setPolicies(prev => prev.map(p => 
        p.id === policyId ? { ...p, status: 'archived' as const } : p
      ));
      
      // Update stats
      setStats(prev => {
        const policy = policies.find(p => p.id === policyId);
        return {
          ...prev,
          activePolicies: policy?.status === 'active' ? prev.activePolicies - 1 : prev.activePolicies
        };
      });
    } catch (error) {
      console.error('Failed to archive policy:', error);
      throw error;
    }
  };

  const distributePolicy = async (policyId: number) => {
    try {
      // Get connected agency workspaces
      const connectedWorkspaces = agencies.map(agency => `workspace-${agency.id}`);
      await enterpriseService.distributePolicy(policyId.toString(), connectedWorkspaces);
    } catch (error) {
      console.error('Failed to distribute policy:', error);
      throw error;
    }
  };

  const reviewSubmission = async (submissionId: number, action: 'approve' | 'reject', feedback?: string) => {
    try {
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { 
                ...sub, 
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'Enterprise Admin',
                feedback 
              }
            : sub
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingReviews: prev.pendingReviews - 1
      }));

    } catch (error) {
      console.error('Failed to review submission:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEnterpriseData();
  }, [enterpriseId]);

  return { 
    agencies, 
    policies, 
    submissions, 
    stats, 
    loading,
    enterpriseId,
    refetch: fetchEnterpriseData,
    createPolicy,
    updatePolicy,
    archivePolicy,
    distributePolicy,
    reviewSubmission
  };
};