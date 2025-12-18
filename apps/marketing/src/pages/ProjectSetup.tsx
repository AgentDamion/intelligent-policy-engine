import React from 'react';
import { ProjectSetupForm } from '@/components/projects/ProjectSetupForm';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';

const ProjectSetup = () => {
  // For now, using a hardcoded workspace ID - in a real app this would come from context/auth
  const workspaceId = "550e8400-e29b-41d4-a716-446655440000";

  return (
    <StandardPageLayout title="Project Setup">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Project Setup</h1>
          <p className="text-muted-foreground">
            Create a new project to start tracking AI tool usage and deliverables.
          </p>
        </div>
        
        <ProjectSetupForm 
          workspaceId={workspaceId}
          onSuccess={() => {
            // Could navigate to projects list or show success message
            console.log('Project created successfully');
          }}
        />
      </div>
    </StandardPageLayout>
  );
};

export default ProjectSetup;