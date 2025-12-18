import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIToolUsage {
  id: string;
  project_id: string;
  tool_name: string;
  how_it_was_used: string;
  files_created: string[];
  date_used: string;
  workspace_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useAIToolUsage = (projectId?: string) => {
  const [toolUsage, setToolUsage] = useState<AIToolUsage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchToolUsage = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ai_tool_usage')
        .select('*')
        .order('date_used', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching AI tool usage:', error);
        throw error;
      }

      setToolUsage(data || []);
    } catch (error) {
      console.error('Failed to fetch AI tool usage:', error);
      setToolUsage([]);
    } finally {
      setLoading(false);
    }
  };

  const createToolUsage = async (usageData: Omit<AIToolUsage, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('ai_tool_usage')
        .insert([usageData])
        .select()
        .single();

      if (error) throw error;

      setToolUsage(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Failed to create tool usage record:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchToolUsage();
  }, [projectId]);

  return { toolUsage, loading, createToolUsage, refetch: fetchToolUsage };
};