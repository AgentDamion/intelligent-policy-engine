import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SandboxProject, CreateSandboxProjectInput, UpdateSandboxProjectInput } from '@/types/sandboxProject';

export function useSandboxProjects(workspaceId: string) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<SandboxProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('sandbox_projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProjects((data || []) as SandboxProject[]);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        variant: 'destructive',
        title: 'Failed to load sandbox projects',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(
    async (input: CreateSandboxProjectInput) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: createError } = await supabase
          .from('sandbox_projects')
          .insert([input])
          .select()
          .single();

        if (createError) throw createError;

        setProjects((prev) => [data as SandboxProject, ...prev]);

        toast({
          title: 'Project created',
          description: `"${data.project_name}" has been created successfully.`,
        });

        return data;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast({
          variant: 'destructive',
          title: 'Failed to create project',
          description: error.message,
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const updateProject = useCallback(
    async (projectId: string, updates: UpdateSandboxProjectInput) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: updateError } = await supabase
          .from('sandbox_projects')
          .update(updates as any)
          .eq('id', projectId)
          .select()
          .single();

        if (updateError) throw updateError;

        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? (data as SandboxProject) : p))
        );

        toast({
          title: 'Project updated',
          description: 'Changes saved successfully.',
        });

        return data;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast({
          variant: 'destructive',
          title: 'Failed to update project',
          description: error.message,
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error: deleteError } = await supabase
          .from('sandbox_projects')
          .delete()
          .eq('id', projectId);

        if (deleteError) throw deleteError;

        setProjects((prev) => prev.filter((p) => p.id !== projectId));

        toast({
          title: 'Project deleted',
          description: 'Project has been removed.',
        });
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete project',
          description: error.message,
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects: loadProjects,
  };
}
