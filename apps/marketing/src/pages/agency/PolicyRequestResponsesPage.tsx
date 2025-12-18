import React, { useState } from 'react';
import { useAgencyWorkspace } from '@/hooks/useAgencyWorkspace';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { PolicyRequestImportWizard } from '@/components/agency/PolicyRequestImportWizard';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const PolicyRequestResponsesPage: React.FC = () => {
  const { workspace, loading, error } = useAgencyWorkspace();
  const [showUploadWizard, setShowUploadWizard] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg text-muted-foreground">
          {error || 'Unable to load workspace'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Request Responses</h1>
          <p className="text-muted-foreground mt-2">
            Manage your policy request responses and track completion status
          </p>
        </div>
        <Button onClick={() => setShowUploadWizard(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import Policy Request
        </Button>
      </div>

      {/* Policy Request Responses list would go here */}
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Policy request responses will appear here
        </p>
      </div>

      <PolicyRequestImportWizard
        open={showUploadWizard}
        onClose={() => setShowUploadWizard(false)}
        workspaceId={workspace.id}
      />
    </div>
  );
};

export default PolicyRequestResponsesPage;