import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { Building2 } from 'lucide-react';

const Portal: React.FC = () => {
  return (
    <StandardPageLayout
      title="Partner Portal"
      description="Enterprise partner collaboration platform"
    >
      <EmptyState
        title="Partner Portal"
        description="Dedicated workspace for enterprise partners to collaborate on compliance initiatives and share resources."
        icon={<Building2 />}
        actions={[
          {
            label: "Request Portal Access",
            onClick: () => console.log("Request portal access"),
            variant: "default"
          },
          {
            label: "Learn More",
            onClick: () => console.log("Learn more about portal"),
            variant: "outline"
          }
        ]}
      />
    </StandardPageLayout>
  );
};

export default Portal;