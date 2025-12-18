import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { Building } from 'lucide-react';

const AgencyClientManagement: React.FC = () => {
  return (
    <StandardPageLayout
      title="Client Management"
      description="Manage client relationships and projects"
    >
      <EmptyState
        title="Client Relationship Management"
        description="Oversee client relationships, project assignments, and compliance requirements across all your agency clients."
        icon={<Building />}
        actions={[
          {
            label: "Add New Client",
            onClick: () => console.log("Add new client"),
            variant: "default"
          },
          {
            label: "Client Projects",
            onClick: () => console.log("View client projects"),
            variant: "outline"
          }
        ]}
      />
    </StandardPageLayout>
  );
};

export default AgencyClientManagement;