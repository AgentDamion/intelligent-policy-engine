import React from 'react';
import { KnowledgeBaseManager } from '@/components/agency/KnowledgeBaseManager';
import { useAgencyWorkspace } from '@/hooks/useAgencyWorkspace';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const KnowledgeBasePage: React.FC = () => {
  const { workspace, loading, error } = useAgencyWorkspace();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Knowledge Base...</p>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Manage your compliance documents, attestations, and evidence library
        </p>
      </div>

      <KnowledgeBaseManager workspaceId={workspace.id} />
    </div>
  );
};

export default KnowledgeBasePage;
