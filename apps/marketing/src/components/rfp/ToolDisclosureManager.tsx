import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToolDisclosureForm } from './ToolDisclosureForm';
import { ToolDisclosureList } from './ToolDisclosureList';
import { PolicyResolutionPanel } from './PolicyResolutionPanel';
import { ToolDisclosure, PolicyResolutionResult } from '@/types/rfp';
import { rfpService } from '@/services/rfp/rfpService';

interface ToolDisclosureManagerProps {
  distributionId: string;
  canManage?: boolean;
}

export function ToolDisclosureManager({ 
  distributionId, 
  canManage = true 
}: ToolDisclosureManagerProps) {
  const [disclosures, setDisclosures] = useState<ToolDisclosure[]>([]);
  const [resolution, setResolution] = useState<PolicyResolutionResult>();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDisclosure, setEditingDisclosure] = useState<ToolDisclosure>();
  const { toast } = useToast();

  const loadDisclosures = async () => {
    try {
      setLoading(true);
      const data = await rfpService.getToolDisclosures(distributionId);
      setDisclosures(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading disclosures',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadResolution = async () => {
    try {
      const data = await rfpService.getPolicyResolution(distributionId);
      if (data) {
        setResolution(data);
      }
    } catch (error: any) {
      // Resolution might not exist yet, that's ok
      console.log('No resolution found yet');
    }
  };

  useEffect(() => {
    loadDisclosures();
    loadResolution();
  }, [distributionId]);

  const handleSubmit = async (
    disclosure: Omit<ToolDisclosure, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      await rfpService.saveToolDisclosures(distributionId, [disclosure]);
      toast({
        title: 'Tool disclosure saved',
        description: 'The tool has been successfully disclosed.'
      });
      setShowForm(false);
      setEditingDisclosure(undefined);
      await loadDisclosures();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving disclosure',
        description: error.message
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await rfpService.deleteToolDisclosure(id);
      toast({
        title: 'Tool disclosure deleted',
        description: 'The tool disclosure has been removed.'
      });
      await loadDisclosures();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting disclosure',
        description: error.message
      });
    }
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      const result = await rfpService.validateToolDisclosures(distributionId, disclosures);
      setResolution(result.resolution);
      toast({
        title: 'Validation complete',
        description: `Overall compliance score: ${result.resolution.overall_score}%`
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error validating tools',
        description: error.message
      });
    } finally {
      setValidating(false);
    }
  };

  const handleEdit = (disclosure: ToolDisclosure) => {
    setEditingDisclosure(disclosure);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingDisclosure(undefined);
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <ToolDisclosureForm
          distributionId={distributionId}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          initialData={editingDisclosure}
        />
      ) : (
        <ToolDisclosureList
          disclosures={disclosures}
          loading={loading}
          onAdd={() => setShowForm(true)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onValidate={handleValidate}
          canManage={canManage}
        />
      )}

      {resolution && (
        <PolicyResolutionPanel
          resolution={resolution}
          loading={validating}
          onValidate={handleValidate}
        />
      )}
    </div>
  );
}
