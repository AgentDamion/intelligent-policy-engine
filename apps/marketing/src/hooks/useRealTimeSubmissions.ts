import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSubmissions, SubmissionData } from './useSupabaseSubmissions';

export const useRealTimeSubmissions = (workspaceId?: string) => {
  const { submissions, loading, stats, refetch } = useSupabaseSubmissions(workspaceId);

  useEffect(() => {
    // Set up real-time subscription for submissions
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined
        },
        (payload) => {
          console.log('Submission updated:', payload);
          // Refetch data when changes occur
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, refetch]);

  return {
    submissions,
    loading,
    stats,
    refetch
  };
};