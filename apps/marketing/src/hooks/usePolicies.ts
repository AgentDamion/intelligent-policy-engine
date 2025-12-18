import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Policy {
  id: string;
  title: string;
  description?: string;
  enterprise_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

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

export const usePolicies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPolicies(data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch policies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: Omit<Policy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .insert([policyData])
        .select()
        .single();

      if (error) throw error;

      setPolicies(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Policy created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating policy:', error);
      toast({
        title: "Error",
        description: "Failed to create policy",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePolicy = async (id: string, updates: Partial<Policy>) => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPolicies(prev => prev.map(p => p.id === id ? data : p));
      
      toast({
        title: "Success",
        description: "Policy updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating policy:', error);
      toast({
        title: "Error",
        description: "Failed to update policy",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return {
    policies,
    loading,
    fetchPolicies,
    createPolicy,
    updatePolicy,
  };
};