import React from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { Play } from 'lucide-react';

const WorkflowRuns = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Workflow Runs</h1>
        <p className="text-muted-foreground">In-flight workflow progress and management</p>
      </div>
      
      <EmptyState
        title="Active Workflow Runs"
        description="Monitor in-flight workflows, track progress through steps, and manage task assignments and escalations."
        icon={<Play />}
        actions={[
          {
            label: "Refresh Status",
            onClick: () => console.log("Refresh"),
            variant: "outline"
          }
        ]}
      />
    </div>
  );
};

export default WorkflowRuns;