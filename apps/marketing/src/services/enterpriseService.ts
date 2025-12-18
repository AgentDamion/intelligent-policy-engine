import type { Agency, Policy, Submission, EnterpriseStats } from '@/types/enterprise';
import { useApi } from '@/hooks/useApi';
import { getSampleAgencies, getSamplePolicies, getSampleSubmissions } from './enterpriseSampleData';

export class EnterpriseService {
  private api = useApi();

  async fetchEnterpriseData(enterpriseId: string) {
    try {
      // Try to fetch real data from Railway backend
      const [agenciesData, policiesData, submissionsData, statsData] = await Promise.all([
        this.api.getAgencies(),
        this.api.getPolicies(),
        this.api.getSubmissions(),
        this.api.getEnterpriseStats(enterpriseId)
      ]);

      // Debug what we're getting from the API
      console.log('API Response - Agencies:', agenciesData);
      console.log('API Response - Policies:', policiesData);
      console.log('API Response - Submissions:', submissionsData);
      console.log('API Response - Stats:', statsData);

      // Check if we have meaningful data from the API (not just empty arrays)
      const hasRealApiData = (
        (Array.isArray(agenciesData) && agenciesData.length > 0) ||
        (Array.isArray(policiesData) && policiesData.length > 0) ||
        (Array.isArray(submissionsData) && submissionsData.length > 0) ||
        (statsData && typeof statsData === 'object' && Object.keys(statsData).length > 0 && Object.values(statsData).some(val => typeof val === 'number' && val > 0))
      );

      if (hasRealApiData) {
        console.log('Using API data');
        const agencies = agenciesData || [];
        const policies = policiesData || [];
        const submissions = submissionsData || [];
        
        // Calculate stats from actual data if API stats are not available
        const calculatedStats = this.calculateStats(agencies, policies, submissions);

        const stats = {
          activeAgencies: statsData?.activeAgencies ?? calculatedStats.activeAgencies,
          activePolicies: statsData?.activePolicies ?? calculatedStats.activePolicies,
          pendingReviews: statsData?.pendingReviews ?? calculatedStats.pendingReviews,
          complianceRate: statsData?.complianceRate ?? calculatedStats.complianceRate,
          totalViolations: statsData?.totalViolations ?? calculatedStats.totalViolations
        };

        return { agencies, policies, submissions, stats };
      }

      console.log('No meaningful API data, using sample data');

      // Use sample data for now (replace when backend is ready)
      const agencies = getSampleAgencies(enterpriseId);
      const policies = getSamplePolicies(enterpriseId);
      const submissions = getSampleSubmissions();
      const stats = this.calculateStats(agencies, policies, submissions);

      return { agencies, policies, submissions, stats };

    } catch (error) {
      console.error('Failed to fetch enterprise data:', error);
      throw error;
    }
  }

  private calculateStats(agencies: Agency[], policies: Policy[], submissions: Submission[]): EnterpriseStats {
    return {
      activeAgencies: agencies.filter(a => a.status === 'active').length,
      activePolicies: policies.filter(p => p.status === 'active').length,
      pendingReviews: submissions.filter(s => s.status === 'pending').length,
      complianceRate: agencies.length > 0 
        ? Math.round(agencies.reduce((acc, a) => acc + a.compliance, 0) / agencies.length)
        : 0,
      totalViolations: agencies.reduce((acc, a) => acc + a.violations, 0)
    };
  }

  async createPolicy(policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt' | 'enterpriseId'>, enterpriseId: string) {
    try {
      const result = await this.api.createPolicy(policyData.title, policyData.description);
      
      if (result.success && result.policy) {
        return result.policy;
      } else {
        // Fallback to local creation
        const newPolicy: Policy = {
          ...policyData,
          id: Date.now(),
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          enterpriseId
        };
        return newPolicy;
      }
    } catch (error) {
      console.error('Failed to create policy:', error);
      throw error;
    }
  }
}