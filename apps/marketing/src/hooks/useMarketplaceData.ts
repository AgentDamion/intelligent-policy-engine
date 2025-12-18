import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarketplaceTool {
  id: number;
  name: string;
  description?: string;
  category: string;
  vendor_enterprise_id: string;
  vendor_name?: string;
  vendor_logo?: string;
  website?: string;
  pricing_tier: string;
  status: string;
  compliance_certifications: string[];
  average_rating: number;
  review_count: number;
  monthly_active_users: number;
  setup_complexity: string;
  integration_options: string[];
  created_at: string;
  updated_at: string;
}

export interface ToolRequest {
  id: string;
  tool_id: number;
  workspace_id: string;
  enterprise_id: string;
  requested_by: string;
  status: string;
  business_justification?: string;
  expected_usage?: string;
  compliance_requirements?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceFilters {
  searchTerm: string;
  industries: string[];
  compliance: string[];
  dataTypes: string[];
  agenticVerified: boolean;
}

export const useMarketplaceData = () => {
  const [tools, setTools] = useState<MarketplaceTool[]>([]);
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTools = async (filters?: Partial<MarketplaceFilters>) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('marketplace_tools')
        .select(`
          *,
          enterprises!vendor_enterprise_id(name, domain)
        `)
        .eq('status', 'verified');

      if (filters?.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters?.industries && filters.industries.length > 0) {
        query = query.in('category', filters.industries);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedTools: MarketplaceTool[] = (data || []).map(tool => ({
        ...tool,
        vendor_name: tool.enterprises?.name || 'Unknown Vendor',
        vendor_logo: `/api/placeholder/40/40`,
        compliance_certifications: Array.isArray(tool.compliance_certifications) 
          ? tool.compliance_certifications.map(cert => String(cert))
          : [],
        integration_options: Array.isArray(tool.integration_options) 
          ? tool.integration_options.map(option => String(option))
          : [],
        average_rating: tool.average_rating || 0,
        review_count: tool.review_count || 0,
        monthly_active_users: tool.monthly_active_users || 0,
        setup_complexity: tool.setup_complexity || 'medium'
      }));

      setTools(formattedTools);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch tools';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (enterpriseId?: string) => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('tool_requests')
        .select(`
          *,
          marketplace_tools(name, category),
          enterprises(name)
        `);

      if (enterpriseId) {
        query = query.eq('enterprise_id', enterpriseId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch requests';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createToolRequest = async (toolId: number, requestData: {
    enterpriseId: string;
    workspaceId: string;
    businessJustification?: string;
    expectedUsage?: string;
    complianceRequirements?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tool_requests')
        .insert({
          tool_id: toolId,
          workspace_id: requestData.workspaceId,
          enterprise_id: requestData.enterpriseId,
          requested_by: user.id,
          business_justification: requestData.businessJustification,
          expected_usage: requestData.expectedUsage,
          compliance_requirements: requestData.complianceRequirements
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tool request submitted successfully",
      });

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create tool request';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      return false;
    }
  };

  const reviewToolRequest = async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tool_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: action === 'reject' ? reason : null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tool request ${action}d successfully`,
      });

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${action} tool request`;
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  return {
    tools,
    requests,
    loading,
    error,
    fetchTools,
    fetchRequests,
    createToolRequest,
    reviewToolRequest,
    refetch: () => fetchTools()
  };
};