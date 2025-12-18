import React, { useState } from 'react';
import { PolicyRequestsInbox } from '@/components/agency/PolicyRequestsInbox';
import { PolicyRequestImportWizard } from '@/components/agency/PolicyRequestImportWizard';
import { useAgencyWorkspace } from '@/hooks/useAgencyWorkspace';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Upload } from 'lucide-react';

const PolicyRequestsInboxPage: React.FC = () => {
  const { workspace, loading, error } = useAgencyWorkspace();
  const [uploadWizardOpen, setUploadWizardOpen] = useState(false);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Policy Requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Access Required</h3>
            <p className="text-muted-foreground">{error || 'Workspace not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Requests Inbox</h1>
          <p className="text-muted-foreground">
            View and respond to policy compliance requests from clients
          </p>
        </div>
        <Button 
          onClick={() => setUploadWizardOpen(true)}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Import External Policy Request
        </Button>
      </div>

      <PolicyRequestsInbox workspaceId={workspace.id} />
      
      <PolicyRequestImportWizard
        open={uploadWizardOpen}
        onClose={() => setUploadWizardOpen(false)}
        workspaceId={workspace.id}
      />
    </div>
  );
};

export default PolicyRequestsInboxPage;
