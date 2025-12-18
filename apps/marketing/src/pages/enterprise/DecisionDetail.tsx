import React from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { FileText } from 'lucide-react';

const DecisionDetail = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Decision Detail</h1>
        <p className="text-muted-foreground">Decision ID: {id}</p>
      </div>
      
      <EmptyState
        title="Decision Details"
        description="View decision outcome, conditions, expiry date, and export decision letter. Track revalidation schedules and compliance status."
        icon={<FileText />}
        actions={[
          {
            label: "Export Decision Letter",
            onClick: () => console.log("Export decision letter"),
            variant: "default"
          },
          {
            label: "Schedule Revalidation",
            onClick: () => console.log("Schedule revalidation"),
            variant: "outline"
          }
        ]}
      />
    </div>
  );
};

export default DecisionDetail;