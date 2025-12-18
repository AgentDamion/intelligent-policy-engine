import React, { useState, useEffect } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { ClientLinkTable } from '@/components/admin/ClientLinkTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { clientLinksApi } from '@/lib/admin/clientLinks';

export interface ClientLink {
  id: string;
  agencyId: string;
  agencyName: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'suspended';
  submissionCount: number;
  createdAt: string;
  lastActivity?: string;
}

const ClientLinking: React.FC = () => {
  const [links, setLinks] = useState<ClientLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientLinks();
  }, []);

  const loadClientLinks = async () => {
    try {
      const data = await clientLinksApi.list();
      setLinks(data);
    } catch (error) {
      console.error('Failed to load client links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = () => {
    // This would open a modal to create a new client link
    console.log('Create new client link');
  };

  const handleStatusChange = async (linkId: string, status: 'active' | 'suspended') => {
    try {
      await clientLinksApi.update(linkId, { status });
      await loadClientLinks(); // Reload data
    } catch (error) {
      console.error('Failed to update link status:', error);
    }
  };

  return (
    <StandardPageLayout
      title="Client Linking"
      description="Manage agency-client relationships and data access boundaries"
      actions={[
        {
          label: "Link New Client",
          onClick: handleCreateLink,
          variant: "default" as const,
          icon: <Plus className="h-4 w-4" />
        }
      ]}
    >
      <ClientLinkTable
        links={links}
        loading={loading}
        onStatusChange={handleStatusChange}
        onRefresh={loadClientLinks}
      />
    </StandardPageLayout>
  );
};

export default ClientLinking;