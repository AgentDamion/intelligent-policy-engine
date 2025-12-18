import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Shield, 
  CheckCircle2,
  AlertCircle,
  Globe,
  Database
} from 'lucide-react';
import { ToolDisclosure } from '@/types/rfp';

interface ToolDisclosureListProps {
  disclosures: ToolDisclosure[];
  loading?: boolean;
  onAdd: () => void;
  onEdit: (disclosure: ToolDisclosure) => void;
  onDelete: (id: string) => void;
  onValidate?: () => void;
  canManage?: boolean;
}

export function ToolDisclosureList({
  disclosures,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onValidate,
  canManage = true
}: ToolDisclosureListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading tool disclosures...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Tool Disclosures</CardTitle>
              <CardDescription>
                Tools disclosed for policy compliance review
              </CardDescription>
            </div>
            {canManage && (
              <div className="flex gap-2">
                {onValidate && disclosures.length > 0 && (
                  <Button onClick={onValidate} variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Validate Tools
                  </Button>
                )}
                <Button onClick={onAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {disclosures.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No AI tools have been disclosed yet. 
                {canManage && ' Click "Add Tool" to begin disclosure.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {disclosures.map(disclosure => (
                <div
                  key={disclosure.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{disclosure.tool_name}</h3>
                        {disclosure.version && (
                          <Badge variant="outline">v{disclosure.version}</Badge>
                        )}
                      </div>

                      {/* Provider */}
                      {disclosure.provider && (
                        <p className="text-sm text-muted-foreground">
                          Provider: {disclosure.provider}
                        </p>
                      )}

                      {/* Intended Use */}
                      {disclosure.intended_use && (
                        <p className="text-sm">{disclosure.intended_use}</p>
                      )}

                      {/* Data Scope Indicators */}
                      <div className="flex flex-wrap gap-2">
                        {disclosure.data_scope?.pii && (
                          <Badge variant="secondary">
                            <Database className="h-3 w-3 mr-1" />
                            PII Processing
                          </Badge>
                        )}
                        {disclosure.data_scope?.hipaa && (
                          <Badge variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            HIPAA Data
                          </Badge>
                        )}
                        {disclosure.data_scope?.regions && disclosure.data_scope.regions.length > 0 && (
                          <Badge variant="secondary">
                            <Globe className="h-3 w-3 mr-1" />
                            {disclosure.data_scope.regions.length} Region{disclosure.data_scope.regions.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Regions */}
                      {disclosure.data_scope?.regions && disclosure.data_scope.regions.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Regions: </span>
                          {disclosure.data_scope.regions.join(', ')}
                        </div>
                      )}

                      {/* Data Types */}
                      {disclosure.data_scope?.data_types && disclosure.data_scope.data_types.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Data Types: </span>
                          {disclosure.data_scope.data_types.join(', ')}
                        </div>
                      )}

                      {/* Connectors */}
                      {disclosure.connectors && disclosure.connectors.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Integrations: </span>
                          {disclosure.connectors.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(disclosure)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(disclosure.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool Disclosure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tool disclosure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
