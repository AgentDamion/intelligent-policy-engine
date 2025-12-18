import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { FolderOpen } from 'lucide-react';

const AgencyProjectOversight: React.FC = () => {
  return (
    <StandardPageLayout
      title="Project Oversight"
      description="Multi-client project management and oversight"
    >
      <EmptyState
        title="Multi-Client Project Oversight"
        description="Comprehensive view of all client projects, compliance status, deadlines, and resource allocation across your agency portfolio."
        icon={<FolderOpen />}
        actions={[
          {
            label: "View All Projects",
            onClick: () => console.log("View all projects"),
            variant: "default"
          },
          {
            label: "Project Reports",
            onClick: () => console.log("Generate reports"),
            variant: "outline"
          }
        ]}
      />
    </StandardPageLayout>
  );
};

export default AgencyProjectOversight;