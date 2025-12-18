import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

export interface RFPNotificationCounts {
  newCount: number;
  dueSoonCount: number;
  overdueCount: number;
  total: number;
}

export const useRFPNotifications = (workspaceId?: string) => {
  const [counts, setCounts] = useState<RFPNotificationCounts>({
    newCount: 0,
    dueSoonCount: 0,
    overdueCount: 0,
    total: 0,
  });

  useEffect(() => {
    if (!workspaceId) return;

    const fetchCounts = async () => {
      try {
        // Use edge function to get distributions with proper schema
        const { data, error } = await supabase.functions.invoke('get-rfp-distributions', {
          body: { workspace_id: workspaceId }
        });

        if (error) throw error;

        const distributions = data?.distributions || [];
        const now = new Date();
        const dueSoonThreshold = addDays(now, 3); // 72 hours

        let newC = 0, dueSoonC = 0, overdueC = 0;

        distributions.forEach((dist: any) => {
          // Skip if already submitted
          if (dist.submission_status === 'submitted' || dist.submission_status === 'approved') {
            return;
          }

          if (!dist.response_deadline) return;
          const deadline = new Date(dist.response_deadline);
          
          if (deadline < now) {
            overdueC++;
          } else if (deadline <= dueSoonThreshold) {
            dueSoonC++;
          } else {
            newC++;
          }
        });

        setCounts({
          newCount: newC,
          dueSoonCount: dueSoonC,
          overdueCount: overdueC,
          total: newC + dueSoonC + overdueC,
        });
      } catch (error) {
        console.error('Error fetching RFP notifications:', error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [workspaceId]);

  return counts;
};
