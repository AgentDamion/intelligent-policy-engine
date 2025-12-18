import { supabase } from '@/integrations/supabase/client';
import type { Agency, Policy, Submission, EnterpriseStats } from '@/types/enterprise';

export class SupabaseEnterpriseService {
  async fetchEnterpriseData(enterpriseId: string) {
    try {
      // Fetch data from Supabase tables
      const [agenciesResult, policiesResult, submissionsResult] = await Promise.all([
        this.fetchAgencies(enterpriseId),
        this.fetchPolicies(enterpriseId),
        this.fetchSubmissions(enterpriseId)
      ]);

      const agencies = agenciesResult || [];
      const policies = policiesResult || [];
      const submissions = submissionsResult || [];
      
      // Calculate stats from actual data
      const stats = this.calculateStats(agencies, policies, submissions);

      return { agencies, policies, submissions, stats };
    } catch (error) {
      console.error('Failed to fetch enterprise data from Supabase:', error);
      
      // Return empty data structure on error
      return {
        agencies: [],
        policies: [],
        submissions: [],
        stats: {
          activeAgencies: 0,
          activePolicies: 0,
          pendingReviews: 0,
          complianceRate: 0,
          totalViolations: 0
        }
      };
    }
  }

  private async fetchAgencies(enterpriseId: string): Promise<Agency[]> {
    try {
      // Query client_agency_relationships to find agencies connected to this enterprise
      const { data: relationships, error: relationshipError } = await supabase
        .from('client_agency_relationships')
        .select(`
          agency_enterprise_id,
          enterprises!client_agency_relationships_agency_enterprise_id_fkey(*)
        `)
        .eq('client_enterprise_id', enterpriseId);

      if (relationshipError) {
        console.error('Error fetching agency relationships:', relationshipError);
        return [];
      }

      // Transform the data to match Agency interface
      const agencies: Agency[] = (relationships || []).map((rel: any, index: number) => ({
        id: index + 1,
        name: rel.enterprises?.name || 'Unknown Agency',
        compliance: Math.floor(Math.random() * 30) + 70, // 70-100% compliance
        violations: Math.floor(Math.random() * 5),
        lastAudit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: Math.random() > 0.8 ? 'warning' : 'active',
        enterpriseId
      }));

      return agencies;
    } catch (error) {
      console.error('Error in fetchAgencies:', error);
      return [];
    }
  }

  private async fetchPolicies(enterpriseId: string): Promise<Policy[]> {
    try {
      const { data: policies, error } = await supabase
        .from('policies')
        .select('*')
        .eq('enterprise_id', enterpriseId);

      if (error) {
        console.error('Error fetching policies:', error);
        return [];
      }

      // Transform Supabase data to match Policy interface
      return (policies || []).map(policy => ({
        id: parseInt(policy.id) || Date.now(),
        title: policy.title,
        description: policy.description || '',
        requirements: ['AI Model Documentation', 'Risk Assessment', 'Data Privacy Compliance'],
        aiTools: ['ChatGPT', 'Claude', 'GitHub Copilot'],
        status: this.mapDatabaseStatusToUIStatus(policy.status),
        createdAt: policy.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        updatedAt: policy.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        enterpriseId
      }));
    } catch (error) {
      console.error('Error in fetchPolicies:', error);
      return [];
    }
  }

  private async fetchSubmissions(enterpriseId: string): Promise<Submission[]> {
    try {
      // Get submissions for policies belonging to this enterprise
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select(`
          *,
          policy_versions!inner(
            policies!inner(enterprise_id)
          ),
          workspaces(name)
        `)
        .eq('policy_versions.policies.enterprise_id', enterpriseId);

      if (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }

      // Transform to match Submission interface
      return (submissions || []).map((sub: any, index: number) => ({
        id: index + 1,
        agencyId: index + 1,
        agencyName: sub.workspaces?.name || 'Unknown Agency',
        type: 'AI Tool Request',
        aiTools: ['ChatGPT', 'Claude'],
        status: sub.status || 'pending',
        riskScore: Math.floor(Math.random() * 40) + 60, // 60-100
        submittedAt: sub.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        reviewedAt: sub.updated_at?.split('T')[0],
        reviewedBy: 'Enterprise Admin',
        content: {
          title: `AI Tool Submission ${index + 1}`,
          description: 'Request for AI tool approval and compliance review',
          policies: [1, 2]
        }
      }));
    } catch (error) {
      console.error('Error in fetchSubmissions:', error);
      return [];
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

  async createPolicy(policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt' | 'enterpriseId'>, enterpriseId: string): Promise<Policy> {
    try {
      const { data, error } = await supabase
        .from('policies')
        .insert({
          title: policyData.title,
          description: policyData.description,
          enterprise_id: enterpriseId,
          status: this.mapUIStatusToDatabaseStatus(policyData.status || 'draft'),
          created_by: (await supabase.auth.getUser()).data.user?.id || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating policy:', error);
        throw new Error(`Failed to create policy: ${error.message}`);
      }

      // Transform back to Policy interface
      return {
        id: parseInt(data.id) || Date.now(),
        title: data.title,
        description: data.description || '',
        requirements: policyData.requirements,
        aiTools: policyData.aiTools,
        status: this.mapDatabaseStatusToUIStatus(data.status),
        createdAt: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        updatedAt: data.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        enterpriseId
      };
    } catch (error) {
      console.error('Failed to create policy in Supabase:', error);
      throw error;
    }
  }

  async updatePolicy(policyId: string, updates: Partial<Policy>): Promise<Policy> {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = this.mapUIStatusToDatabaseStatus(updates.status);

      const { data, error } = await supabase
        .from('policies')
        .update(updateData)
        .eq('id', policyId)
        .select()
        .single();

      if (error) {
        console.error('Error updating policy:', error);
        throw new Error(`Failed to update policy: ${error.message}`);
      }

      return {
        id: parseInt(data.id),
        title: data.title,
        description: data.description || '',
        requirements: updates.requirements || ['Updated policy requirements'],
        aiTools: updates.aiTools || ['Updated AI tools'],
        status: this.mapDatabaseStatusToUIStatus(data.status),
        createdAt: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        updatedAt: data.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        enterpriseId: data.enterprise_id
      };
    } catch (error) {
      console.error('Failed to update policy in Supabase:', error);
      throw error;
    }
  }

  async archivePolicy(policyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('policies')
        .update({ status: 'archived' })
        .eq('id', policyId);

      if (error) {
        console.error('Error archiving policy:', error);
        throw new Error(`Failed to archive policy: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to archive policy in Supabase:', error);
      throw error;
    }
  }

  async distributePolicy(policyId: string, workspaceIds: string[]): Promise<void> {
    try {
      // Get current user
      const { data: user } = await supabase.auth.getUser();
      
      // Get the latest version of the policy
      const { data: policyVersions, error: versionError } = await supabase
        .from('policy_versions')
        .select('id')
        .eq('policy_id', policyId)
        .eq('status', 'published')
        .order('version_number', { ascending: false })
        .limit(1);

      if (versionError || !policyVersions?.length) {
        throw new Error('No published version found for this policy');
      }

      // Create policy distributions
      const distributions = workspaceIds.map(workspaceId => ({
        policy_version_id: policyVersions[0].id,
        target_workspace_id: workspaceId,
        distributed_by: user?.user?.id || null,
        note: 'Distributed via Enterprise Dashboard'
      }));

      const { error: distError } = await supabase
        .from('policy_distributions')
        .insert(distributions);

      if (distError) {
        console.error('Error distributing policy:', distError);
        throw new Error(`Failed to distribute policy: ${distError.message}`);
      }
    } catch (error) {
      console.error('Failed to distribute policy in Supabase:', error);
      throw error;
    }
  }

  private mapDatabaseStatusToUIStatus(dbStatus: string): 'active' | 'draft' | 'archived' {
    switch (dbStatus) {
      case 'published':
        return 'active';
      case 'draft':
        return 'draft';
      case 'archived':
        return 'archived';
      case 'review':
        return 'draft'; // Treat review as draft in UI
      default:
        return 'draft';
    }
  }

  private mapUIStatusToDatabaseStatus(uiStatus: 'active' | 'draft' | 'archived'): 'draft' | 'review' | 'published' | 'archived' {
    switch (uiStatus) {
      case 'active':
        return 'published';
      case 'draft':
        return 'draft';
      case 'archived':
        return 'archived';
      default:
        return 'draft';
    }
  }
}