import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version_number: number;
  title: string;
  description?: string;
  rules: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  distributed_at?: string;
  created_by?: string;
  created_at: string;
}

export const usePolicyVersions = (policyId?: string) => {
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVersions = async () => {
    if (!policyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('policy_versions')
        .select('*')
        .eq('policy_id', policyId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      setVersions((data || []) as PolicyVersion[]);
    } catch (error) {
      console.error('Error fetching policy versions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch policy versions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createVersion = async (versionData: Omit<PolicyVersion, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('policy_versions')
        .insert([versionData])
        .select()
        .single();

      if (error) throw error;

      setVersions(prev => [data as PolicyVersion, ...prev]);
      
      toast({
        title: "Success",
        description: "Policy version created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating policy version:', error);
      toast({
        title: "Error",
        description: "Failed to create policy version",
        variant: "destructive",
      });
      throw error;
    }
  };

  const publishVersion = async (versionId: string) => {
    try {
      const { data, error } = await supabase
        .from('policy_versions')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', versionId)
        .select()
        .single();

      if (error) throw error;

      setVersions(prev => prev.map(v => v.id === versionId ? data as PolicyVersion : v));
      
      toast({
        title: "Success",
        description: "Policy version published successfully",
      });

      return data;
    } catch (error) {
      console.error('Error publishing policy version:', error);
      toast({
        title: "Error",
        description: "Failed to publish policy version",
        variant: "destructive",
      });
      throw error;
    }
  };

  const distributeVersion = async (versionId: string, workspaceIds: string[], note?: string) => {
    try {
      const { error } = await supabase.functions.invoke('distribute_policy', {
        body: {
          policy_version_id: versionId,
          workspace_ids: workspaceIds,
          note
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Policy distributed to ${workspaceIds.length} workspace(s)`,
      });

      // Update distributed_at timestamp
      await supabase
        .from('policy_versions')
        .update({ distributed_at: new Date().toISOString() })
        .eq('id', versionId);

      fetchVersions(); // Refresh data
    } catch (error) {
      console.error('Error distributing policy:', error);
      toast({
        title: "Error",
        description: "Failed to distribute policy",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [policyId]);

  return {
    versions,
    loading,
    fetchVersions,
    createVersion,
    publishVersion,
    distributeVersion,
  };
};