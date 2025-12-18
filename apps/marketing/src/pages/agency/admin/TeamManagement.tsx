import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { Users } from 'lucide-react';

const AgencyTeamManagement: React.FC = () => {
  return (
    <StandardPageLayout
      title="Team Management"
      description="Manage your agency team members and roles"
    >
      <EmptyState
        title="Agency Team Management"
        description="Manage team members, assign roles, and control access permissions within your agency organization."
        icon={<Users />}
        actions={[
          {
            label: "Add Team Member",
            onClick: () => console.log("Add team member"),
            variant: "default"
          },
          {
            label: "Manage Roles",
            onClick: () => console.log("Manage roles"),
            variant: "outline"
          }
        ]}
      />
    </StandardPageLayout>
  );
};

export default AgencyTeamManagement;