import { useState, useEffect } from 'react';
import type { Policy } from '@/types/enterprise';
import { supabase } from '@/integrations/supabase/client';

export interface PolicyNotification {
  id: string;
  policy: Policy;
  status: 'new' | 'acknowledged' | 'implemented';
  receivedAt: string;
  acknowledgedAt?: string;
  implementedAt?: string;
}

export const usePolicyInbox = () => {
  const [policyNotifications, setPolicyNotifications] = useState<PolicyNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicyInbox = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's workspace IDs
      const { data: workspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);

      if (!workspaces?.length) {
        throw new Error('User not associated with any workspace');
      }

      const workspaceIds = workspaces.map(w => w.workspace_id);

      // Get policy distributions for user's workspaces
      const { data: distributions, error } = await supabase
        .from('policy_distributions')
        .select(`
          id,
          created_at,
          note,
          policy_versions!inner(
            id,
            title,
            description,
            rules,
            policies!inner(
              id,
              title,
              description,
              status,
              enterprise_id
            )
          )
        `)
        .in('target_workspace_id', workspaceIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (distributions?.length) {
        // Transform distributions to policy notifications
        const notifications: PolicyNotification[] = distributions.map((dist: any) => {
          const policy = dist.policy_versions.policies;
          const rules = dist.policy_versions.rules || {};
          
          return {
            id: dist.id,
            policy: {
              id: policy.id,
              title: dist.policy_versions.title,
              description: dist.policy_versions.description,
              requirements: rules.requirements || ['Review all AI-generated content', 'Maintain audit trails'],
              aiTools: rules.aiTools || ['ChatGPT', 'Claude'],
              status: policy.status,
              createdAt: dist.created_at,
              updatedAt: dist.created_at,
              enterpriseId: policy.enterprise_id
            },
            status: 'new' as const,
            receivedAt: dist.created_at
          };
        });

        setPolicyNotifications(notifications);
      } else {
        // Fallback to sample notifications for demo
        const sampleNotifications: PolicyNotification[] = [
          {
            id: 'notif-1',
            policy: {
              id: 1,
              title: 'AI Content Generation Guidelines',
              description: 'Updated guidelines for using AI tools in content creation',
              requirements: ['Human oversight required', 'Client disclosure mandatory', 'Content review process'],
              aiTools: ['ChatGPT', 'Claude', 'Midjourney'],
              status: 'active',
              createdAt: '2024-06-15',
              updatedAt: '2024-07-01',
              enterpriseId: 'enterprise123'
            },
            status: 'new',
            receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'notif-2',
            policy: {
              id: 3,
              title: 'Healthcare Marketing Compliance',
              description: 'HIPAA-compliant AI usage in healthcare marketing',
              requirements: ['Medical review required', 'No patient data in AI prompts', 'FDA compliance check'],
              aiTools: ['ChatGPT', 'Claude'],
              status: 'active',
              createdAt: '2024-06-10',
              updatedAt: '2024-06-15',
              enterpriseId: 'enterprise123'
            },
            status: 'acknowledged',
            receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            acknowledgedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
          }
        ];
        setPolicyNotifications(sampleNotifications);
      }
    } catch (error) {
      console.error('Failed to fetch policy inbox:', error);
      setPolicyNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgePolicy = async (notificationId: string) => {
    try {
      setPolicyNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { 
                ...notif, 
                status: 'acknowledged',
                acknowledgedAt: new Date().toISOString()
              }
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to acknowledge policy:', error);
    }
  };

  const markAsImplemented = async (notificationId: string) => {
    try {
      setPolicyNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { 
                ...notif, 
                status: 'implemented',
                implementedAt: new Date().toISOString()
              }
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark policy as implemented:', error);
    }
  };

  useEffect(() => {
    fetchPolicyInbox();
    
    // Poll for new policies every 30 seconds
    const interval = setInterval(fetchPolicyInbox, 30000);
    return () => clearInterval(interval);
  }, []);

  const newPoliciesCount = policyNotifications.filter(p => p.status === 'new').length;
  const acknowledgedPoliciesCount = policyNotifications.filter(p => p.status === 'acknowledged').length;

  return { 
    policyNotifications, 
    loading, 
    refetch: fetchPolicyInbox,
    acknowledgePolicy,
    markAsImplemented,
    newPoliciesCount,
    acknowledgedPoliciesCount
  };
};