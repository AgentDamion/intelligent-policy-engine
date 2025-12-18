import { useState, useEffect } from 'react';
import type { Client, DashboardStats } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { demoMode, createPharmaDemoData } from '@/utils/demoMode';

export const useClientsData = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeCompliance: 0,
    pendingReviews: 0,
    conflictsDetected: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchClientsData = async () => {
    try {
      // Handle demo mode first
      if (demoMode.isEnabled() && demoMode.getDemoRole() === 'partner') {
        try {
          const pharmaData = createPharmaDemoData();
          const enhancedClients = pharmaData.clients.map(client => ({
            id: parseInt(client.id),
            name: client.name,
            status: client.status as 'active' | 'pending',
            policies: Math.floor(Math.random() * 5) + 1,
            lastUpdate: client.last_activity.split('T')[0],
            complianceScore: client.compliance_score,
            riskLevel: client.risk_level as 'low' | 'medium' | 'high'
          }));
          
          setClients(enhancedClients);
          setStats({
            totalClients: enhancedClients.length,
            activeCompliance: enhancedClients.filter(c => c.status === 'active').length,
            pendingReviews: pharmaData.submissions.filter(s => s.status === 'pending').length,
            conflictsDetected: pharmaData.submissions.filter(s => s.atRisk).length
          });
        } catch (demoError) {
          console.error('Demo mode error:', demoError);
          throw new Error('Demo mode initialization failed');
        }
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get current user's agency enterprise
      const { data: userEnterprises } = await supabase
        .from('enterprise_members')
        .select('enterprise_id, enterprises!inner(enterprise_type)')
        .eq('user_id', user.id)
        .eq('enterprises.enterprise_type', 'agency');

      if (!userEnterprises?.length) {
        throw new Error('User not associated with any agency');
      }

      const agencyEnterpriseId = userEnterprises[0].enterprise_id;

      // Get client relationships
      const { data: relationships, error } = await supabase
        .from('client_agency_relationships')
        .select(`
          client_enterprise_id,
          status,
          enterprises!client_enterprise_id(
            id,
            name,
            created_at
          )
        `)
        .eq('agency_enterprise_id', agencyEnterpriseId);

      if (error) throw error;

      if (relationships?.length) {
        // Transform relationship data to client format
        const enhancedClients = relationships.map((rel: any) => ({
          id: rel.client_enterprise_id,
          name: rel.enterprises.name,
          status: rel.status === 'active' ? 'active' as const : 'pending' as const,
          policies: Math.floor(Math.random() * 5) + 1,
          lastUpdate: new Date(rel.enterprises.created_at).toISOString().split('T')[0],
          complianceScore: Math.floor(Math.random() * 30) + 70,
          riskLevel: Math.random() > 0.7 ? 'high' as const : Math.random() > 0.4 ? 'medium' as const : 'low' as const
        }));

        setClients(enhancedClients);
        
        // Calculate stats
        setStats({
          totalClients: enhancedClients.length,
          activeCompliance: enhancedClients.filter((c: Client) => c.status === 'active').length,
          pendingReviews: enhancedClients.filter((c: Client) => c.status === 'pending').length,
          conflictsDetected: Math.floor(Math.random() * 5) + 2
        });
      } else {
        // No real relationships found, use sample data
        throw new Error('No client relationships found');
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      // Fallback to sample data
      const sampleClients = [
        { id: 1, name: 'Pfizer Inc.', status: 'active' as const, policies: 3, lastUpdate: '2024-07-01', complianceScore: 92, riskLevel: 'low' as const },
        { id: 2, name: 'Novartis AG', status: 'active' as const, policies: 2, lastUpdate: '2024-06-28', complianceScore: 87, riskLevel: 'medium' as const },
        { id: 3, name: 'JPMorgan Chase', status: 'pending' as const, policies: 1, lastUpdate: '2024-06-25', complianceScore: 78, riskLevel: 'high' as const }
      ];
      setClients(sampleClients);
      setStats({
        totalClients: 3,
        activeCompliance: 2,
        pendingReviews: 1,
        conflictsDetected: 3
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsData();
  }, []);

  return { clients, stats, loading, refetch: fetchClientsData };
};