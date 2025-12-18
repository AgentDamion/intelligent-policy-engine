import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { demoMode, createPharmaDemoData } from '@/utils/demoMode';

export interface AgencyWorkspace {
  id: string;
  name: string;
  enterprise_id: string;
  enterprise_name: string;
  role: string;
}

export const useAgencyWorkspace = () => {
  const [workspace, setWorkspace] = useState<AgencyWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgencyWorkspace = async () => {
      try {
        // Handle demo mode
        if (demoMode.isEnabled()) {
          const role = demoMode.getDemoRole();
          if (role === 'partner') {
            try {
              // Return pharmaceutical demo agency workspace data
              const pharmaData = createPharmaDemoData();
              setWorkspace(pharmaData.agencyWorkspace);
            } catch (demoError) {
              console.error('Demo mode error:', demoError);
              setError('Demo mode initialization failed');
            }
            setLoading(false);
            return;
          } else {
            // Enterprise users shouldn't see agency workspace
            setError('User not associated with any agency workspace');
            setLoading(false);
            return;
          }
        }

        // Real Supabase calls for non-demo mode
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get user's workspace memberships
        const { data: workspaceMemberships, error: wsError } = await supabase
          .from('workspace_members')
          .select(`
            role,
            workspaces!inner(
              id,
              name,
              enterprise_id,
              enterprises!inner(
                name,
                enterprise_type
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('workspaces.enterprises.enterprise_type', 'agency')
          .limit(1);

        if (wsError) throw wsError;

        if (workspaceMemberships?.length) {
          const membership = workspaceMemberships[0];
          setWorkspace({
            id: membership.workspaces.id,
            name: membership.workspaces.name,
            enterprise_id: membership.workspaces.enterprise_id,
            enterprise_name: membership.workspaces.enterprises.name,
            role: membership.role
          });
        } else {
          setError('User not associated with any agency workspace');
        }
      } catch (err) {
        console.error('Failed to fetch agency workspace:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch workspace');
      } finally {
        setLoading(false);
      }
    };

    fetchAgencyWorkspace();
  }, []);

  return { workspace, loading, error };
};