import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { Settings } from 'lucide-react';

const AgencySettings: React.FC = () => {
  return (
    <StandardPageLayout
      title="Agency Settings"
      description="Configure your agency profile and capabilities"
    >
      <EmptyState
        title="Agency Configuration"
        description="Manage your agency profile, service capabilities, compliance certifications, and operational settings."
        icon={<Settings />}
        actions={[
          {
            label: "Edit Profile",
            onClick: () => console.log("Edit agency profile"),
            variant: "default"
          },
          {
            label: "Capabilities",
            onClick: () => console.log("Manage capabilities"),
            variant: "outline"
          }
        ]}
      />
    </StandardPageLayout>
  );
};

export default AgencySettings;