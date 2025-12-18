import { getApiUrl } from '@/config/api';

export const useApi = () => {
  const getPolicies = async () => {
    try {
      const response = await fetch(getApiUrl('/api/policies'));
      const data = await response.json();
      return data.policies || [];
    } catch (error) {
      console.error('Failed to get policies:', error);
      return [];
    }
  };

  const createPolicy = async (title: string, description: string) => {
    try {
      const response = await fetch(getApiUrl('/api/policies'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to create policy:', error);
      return { success: false };
    }
  };

  const getAgencies = async () => {
    try {
      const response = await fetch(getApiUrl('/api/agencies'));
      const data = await response.json();
      return data.agencies || [];
    } catch (error) {
      console.error('Failed to get agencies:', error);
      return [];
    }
  };

  const getSubmissions = async () => {
    try {
      const response = await fetch(getApiUrl('/api/submissions'));
      const data = await response.json();
      return data.submissions || [];
    } catch (error) {
      console.error('Failed to get submissions:', error);
      return [];
    }
  };

  const getPolicyInbox = async (agencyId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/agency/${agencyId}/policies/inbox`));
      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Failed to get policy inbox:', error);
      return [];
    }
  };

  const getEnterpriseStats = async (enterpriseId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/dashboard/enterprise/${enterpriseId}`));
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get enterprise stats:', error);
      return {};
    }
  };

  const getAuditFeed = async () => {
    try {
      const response = await fetch(getApiUrl('/api/audit-feed'));
      const data = await response.json();
      return data.success ? data.feed : [];
    } catch (error) {
      console.error('Failed to get audit feed:', error);
      return [];
    }
  };

  const getMetrics = async () => {
    try {
      const response = await fetch(getApiUrl('/api/metrics'));
      const data = await response.json();
      if (data.success) {
        return [
          { label: "Avg Approval Time", value: data.metrics.avgApprovalTime },
          { label: "Human-in-the-Loop Rate", value: data.metrics.humanInLoopRate },
          { label: "Regulatory Coverage", value: data.metrics.regulatoryCoverage },
          { label: "Audit Completeness", value: data.metrics.auditCompleteness }
        ];
      }
      return [];
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return [];
    }
  };

  const getCaseStudies = async () => {
    try {
      const response = await fetch(getApiUrl('/api/case-studies'));
      const data = await response.json();
      return data.success ? data.studies : [];
    } catch (error) {
      console.error('Failed to get case studies:', error);
      return [];
    }
  };

  const getRegulatoryMapping = async () => {
    try {
      const response = await fetch(getApiUrl('/api/regulatory-mapping'));
      const data = await response.json();
      if (data.success) {
        return data.frameworks.map((f: any) => ({
          name: f.name,
          decisions: f.decisions,
          conflicts: f.conflicts,
          complete: `${f.completion}%`,
          documentation: `https://www.ecfr.gov/current/title-21/chapter-I/part-${f.name.includes('820') ? '820' : '11'}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get regulatory mapping:', error);
      return [];
    }
  };

  const getTrends = async () => {
    try {
      const response = await fetch(getApiUrl('/api/trends'));
      const data = await response.json();
      if (data.success) {
        return data.scores.map((s: any) => ({
          date: s.date,
          complianceScore: Math.round(s.score * 100)
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get trends:', error);
      return [];
    }
  };

  const getLiveMetrics = async () => {
    try {
      const response = await fetch(getApiUrl('/api/dashboard/live-metrics'));
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get live metrics:', error);
      return {};
    }
  };

  const getRecentDecisions = async (limit: number = 5) => {
    try {
      const response = await fetch(getApiUrl(`/api/recent-decisions?limit=${limit}`));
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get recent decisions:', error);
      return [];
    }
  };

  return {
    getPolicies,
    createPolicy,
    getAgencies,
    getSubmissions,
    getPolicyInbox,
    getEnterpriseStats,
    getAuditFeed,
    getMetrics,
    getCaseStudies,
    getRegulatoryMapping,
    getTrends,
    getLiveMetrics,
    getRecentDecisions
  };
};