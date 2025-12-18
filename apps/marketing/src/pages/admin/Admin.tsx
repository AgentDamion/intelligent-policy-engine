import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { Shield } from 'lucide-react';

const Admin: React.FC = () => {
  return (
    <StandardPageLayout
      title="Admin Dashboard"
      description="Business analytics and system administration"
    >
      <EmptyState
        title="Admin Dashboard"
        description="Comprehensive business analytics, user management, and system configuration for administrators."
        icon={<Shield />}
        actions={[
          {
            label: "View Analytics",
            onClick: () => console.log("View analytics"),
            variant: "default"
          },
          {
            label: "Manage Users",
            onClick: () => console.log("Manage users"),
            variant: "outline"
          }
        ]}
      />
    </StandardPageLayout>
  );
};

export default Admin;