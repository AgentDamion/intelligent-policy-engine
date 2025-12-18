import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PolicyRequirement {
  id: string;
  policyId: string;
  title: string;
  description: string;
  version: number;
  status: 'active' | 'draft' | 'archived';
  distributedAt: string;
  updatedAt: string;
  clientName: string;
  workspaceName: string;
  enterpriseId: string;
  workspaceId: string;
  isNewUpdate: boolean;
  rules: Record<string, any>;
  distributedBy: string;
}

export interface PolicyChange {
  id: string;
  policyId: string;
  type: 'distributed' | 'updated' | 'version_created';
  timestamp: string;
  description: string;
  version: number;
  clientName: string;
}

export const useRequirementsData = () => {
  const [requirements, setRequirements] = useState<PolicyRequirement[]>([]);
  const [recentChanges, setRecentChanges] = useState<PolicyChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      
      // Get user's workspaces first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: userWorkspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);

      if (!userWorkspaces?.length) {
        // Return sample data if no workspaces
        setRequirements(getSampleRequirements());
        setRecentChanges(getSampleChanges());
        setLoading(false);
        return;
      }

      const workspaceIds = userWorkspaces.map(w => w.workspace_id);

      // Fetch policy distributions for user's workspaces
      const { data: distributions, error: distError } = await supabase
        .from('policy_distributions')
        .select(`
          *,
          policy_versions!inner(
            *,
            policies!inner(
              *,
              enterprises(name)
            )
          ),
          workspaces!target_workspace_id(name)
        `)
        .in('target_workspace_id', workspaceIds)
        .order('created_at', { ascending: false });

      if (distError) throw distError;

      // Transform to PolicyRequirement format
      const transformedRequirements: PolicyRequirement[] = (distributions || []).map(dist => ({
        id: dist.id,
        policyId: dist.policy_versions.policy_id,
        title: dist.policy_versions.title,
        description: dist.policy_versions.description || '',
        version: dist.policy_versions.version_number,
        status: dist.policy_versions.status as 'active' | 'draft' | 'archived',
        distributedAt: dist.created_at,
        updatedAt: dist.policy_versions.created_at,
        clientName: dist.policy_versions.policies.enterprises?.name || 'Unknown Client',
        workspaceName: dist.workspaces?.name || 'Unknown Workspace',
        enterpriseId: dist.policy_versions.policies.enterprise_id,
        workspaceId: dist.target_workspace_id,
        isNewUpdate: isRecentUpdate(dist.created_at),
        rules: (dist.policy_versions.rules as Record<string, any>) || {},
        distributedBy: dist.distributed_by || ''
      }));

      // Generate recent changes
      const changes: PolicyChange[] = transformedRequirements
        .filter(req => isRecentUpdate(req.distributedAt))
        .map(req => ({
          id: `${req.id}-distributed`,
          policyId: req.policyId,
          type: 'distributed' as const,
          timestamp: req.distributedAt,
          description: `Policy "${req.title}" distributed to ${req.workspaceName}`,
          version: req.version,
          clientName: req.clientName
        }));

      setRequirements(transformedRequirements);
      setRecentChanges(changes);
      
    } catch (err) {
      console.error('Error fetching requirements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requirements');
      // Fallback to sample data
      setRequirements(getSampleRequirements());
      setRecentChanges(getSampleChanges());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const isRecentUpdate = (dateString: string) => {
    const date = new Date(dateString);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date > sevenDaysAgo;
  };

  return {
    requirements,
    recentChanges,
    loading,
    error,
    refetch: fetchRequirements
  };
};

// Sample data for demo purposes
const getSampleRequirements = (): PolicyRequirement[] => [
  {
    id: '1',
    policyId: 'policy-1',
    title: 'AI Tool Approval Process',
    description: 'Mandatory approval process for all AI tools used in pharmaceutical development projects',
    version: 3,
    status: 'active',
    distributedAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-19T15:30:00Z',
    clientName: 'Acme Pharmaceuticals',
    workspaceName: 'Clinical Trials',
    enterpriseId: 'ent-1',
    workspaceId: 'ws-1',
    isNewUpdate: true,
    rules: {
      requiresApproval: true,
      maxRiskLevel: 'medium',
      complianceFrameworks: ['FDA 21 CFR Part 11', 'ICH GCP']
    },
    distributedBy: 'admin@acmepharma.com'
  },
  {
    id: '2',
    policyId: 'policy-2',
    title: 'Data Privacy & Protection',
    description: 'Requirements for handling patient data and sensitive information in AI workflows',
    version: 2,
    status: 'active',
    distributedAt: '2024-01-18T14:20:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    clientName: 'Acme Pharmaceuticals',
    workspaceName: 'Clinical Trials',
    enterpriseId: 'ent-1',
    workspaceId: 'ws-1',
    isNewUpdate: false,
    rules: {
      encryptionRequired: true,
      retentionPeriod: '7 years',
      accessControls: 'role-based'
    },
    distributedBy: 'compliance@acmepharma.com'
  },
  {
    id: '3',
    policyId: 'policy-3',
    title: 'Model Validation Requirements',
    description: 'Standards for AI model validation and testing before deployment',
    version: 1,
    status: 'active',
    distributedAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    clientName: 'BioTech Solutions',
    workspaceName: 'Drug Discovery',
    enterpriseId: 'ent-2',
    workspaceId: 'ws-2',
    isNewUpdate: false,
    rules: {
      validationRequired: true,
      testingPhases: ['development', 'staging', 'production'],
      documentationLevel: 'comprehensive'
    },
    distributedBy: 'research@biotech.com'
  }
];

const getSampleChanges = (): PolicyChange[] => [
  {
    id: 'change-1',
    policyId: 'policy-1',
    type: 'updated',
    timestamp: '2024-01-20T10:00:00Z',
    description: 'AI Tool Approval Process updated to version 3 - Added new compliance frameworks',
    version: 3,
    clientName: 'Acme Pharmaceuticals'
  },
  {
    id: 'change-2',
    policyId: 'policy-1',
    type: 'distributed',
    timestamp: '2024-01-20T10:05:00Z',
    description: 'AI Tool Approval Process distributed to Clinical Trials workspace',
    version: 3,
    clientName: 'Acme Pharmaceuticals'
  }
];