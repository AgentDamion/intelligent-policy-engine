import React from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { FileCheck } from 'lucide-react';

const EnterpriseComplianceSettings: React.FC = () => {
  return (
    <StandardPageLayout
      title="Compliance Settings"
      description="Configure compliance frameworks and requirements"
    >
      <EmptyState
        title="Compliance Configuration"
        description="Configure compliance frameworks, audit settings, and regulatory requirements for your organization."
        icon={<FileCheck />}
        actions={[
          {
            label: "Framework Setup",
            onClick: () => console.log("Setup frameworks"),
            variant: "default"
          },
          {
            label: "Audit Settings",
            onClick: () => console.log("Configure audits"),
            variant: "outline"
          }
        ]}
      />
    </StandardPageLayout>
  );
};

export default EnterpriseComplianceSettings;