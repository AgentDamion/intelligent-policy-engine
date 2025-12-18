import { useState, useEffect } from 'react';
import type { AgentActivityType } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export const useAgentActivities = () => {
  const [agentActivities, setAgentActivities] = useState<AgentActivityType[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const fetchAgentActivities = async () => {
    setActivitiesLoading(true);
    try {
      // Try to fetch from Supabase agent_activities table - table may not exist in types yet
      const { data: activities, error } = await supabase
        .from('agent_activities' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching agent activities (expected if table not in types):', error);
        throw error;
      }

      // Transform Supabase data to match AgentActivityType
      const transformedActivities: AgentActivityType[] = (activities || []).map((activity: any) => ({
        id: activity.id.toString(),
        agent: activity.agent,
        action: activity.action,
        timestamp: activity.created_at,
        status: activity.status || 'success',
        details: activity.details || {}
      }));

      setAgentActivities(transformedActivities);
    } catch (error) {
      console.error('Using sample data - agent_activities table not ready:', error);
      // Fallback to sample data on error (expected until table is in types)
      const sampleActivities: AgentActivityType[] = [
        {
          id: '1',
          agent: 'Compliance Monitor',
          action: 'Scanned Pfizer policies for AI compliance violations',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          status: 'success',
          details: { status: 'Completed', description: 'No violations found' }
        },
        {
          id: '2',
          agent: 'Conflict Detector',
          action: 'Detected timeline conflict between Novartis and internal policies',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          status: 'warning',
          details: { status: 'Requires Review', description: 'Medium priority conflict' }
        }
      ];
      setAgentActivities(sampleActivities);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentActivities();
    
    // Auto-refresh agent activities every 30 seconds
    const interval = setInterval(fetchAgentActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return { agentActivities, activitiesLoading, refetch: fetchAgentActivities };
};