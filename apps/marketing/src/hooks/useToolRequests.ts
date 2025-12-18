import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMode } from '@/contexts/ModeContext';

export interface ToolRequest {
  id: string;
  tool_id: number;
  workspace_id: string;
  enterprise_id: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  business_justification: string;
  expected_usage: string;
  compliance_requirements: string; // Changed to string since DB stores as text
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  tool_name?: string;
  vendor_name?: string;
  requester_name?: string;
}

export const useToolRequests = () => {
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useMode();

  const createToolRequest = async (toolRequest: {
    tool_id: number;
    workspace_id: string;
    business_justification: string;
    expected_usage: string;
    compliance_requirements: string[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get enterprise_id from workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('enterprise_id')
        .eq('id', toolRequest.workspace_id)
        .single();

      if (!workspace) throw new Error('Workspace not found');

      const { data, error } = await supabase
        .from('tool_requests')
        .insert({
          tool_id: toolRequest.tool_id,
          workspace_id: toolRequest.workspace_id,
          enterprise_id: workspace.enterprise_id,
          requested_by: user.id,
          business_justification: toolRequest.business_justification,
          expected_usage: toolRequest.expected_usage,
          compliance_requirements: Array.isArray(toolRequest.compliance_requirements) 
            ? toolRequest.compliance_requirements.join(', ') 
            : toolRequest.compliance_requirements || '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh requests list
      await fetchRequests();
      
      return data;
    } catch (err) {
      console.error('Error creating tool request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string, 
    status: 'approved' | 'rejected' | 'in_review',
    rejectionReason?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: any = {
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      };

      if (rejectionReason) {
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('tool_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // Refresh requests list
      await fetchRequests();
    } catch (err) {
      console.error('Error updating request status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRequests([]);
        return;
      }

      // Simplified query to avoid relation issues
      let query = supabase
        .from('tool_requests')
        .select('*');

      // For now, simplify the mode check by always checking workspaces
      const { data: workspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);
      
      if (workspaces && workspaces.length > 0) {
        const workspaceIds = workspaces.map(w => w.workspace_id);
        query = query.in('workspace_id', workspaceIds);
      } else {
        // No workspaces, return empty
        setRequests([]);
        return;
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data with proper typing
      const transformedRequests: ToolRequest[] = data?.map(request => {
        return {
          ...request,
          status: request.status as 'pending' | 'approved' | 'rejected' | 'in_review',
          compliance_requirements: request.compliance_requirements || '',
          business_justification: request.business_justification || '',
          expected_usage: request.expected_usage || '',
          tool_name: 'Tool #' + request.tool_id, // Simplified until we fix relations
          vendor_name: 'Vendor', // Simplified until we fix relations
          requester_name: 'User' // Simplified until we fix relations
        };
      }) || [];

      setRequests(transformedRequests);
    } catch (err) {
      console.error('Error fetching tool requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    error,
    createToolRequest,
    updateRequestStatus,
    refetch: fetchRequests
  };
};