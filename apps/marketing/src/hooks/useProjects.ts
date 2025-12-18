import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  client_name: string;
  brand: string;
  project_name: string;
  project_description?: string;
  expected_delivery_date?: string;
  workspace_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = (workspaceId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [workspaceId]);

  return { projects, loading, createProject, refetch: fetchProjects };
};