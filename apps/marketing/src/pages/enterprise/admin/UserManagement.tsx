import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCog } from 'lucide-react';

const EnterpriseUserManagement: React.FC = () => {
  return (
    <StandardPageLayout
      title="User Management"
      description="Manage internal team members and access"
    >
      <EmptyState
        title="Internal Team Management"
        description="Manage your organization's internal team members, access controls, and user permissions."
        icon={<UserCog />}
        actions={[
          {
            label: "Invite User",
            onClick: () => console.log("Invite user"),
            variant: "default"
          },
          {
            label: "Access Controls",
            onClick: () => console.log("Manage access"),
            variant: "outline"
          }
        ]}
      />
    </StandardPageLayout>
  );
};

export default EnterpriseUserManagement;