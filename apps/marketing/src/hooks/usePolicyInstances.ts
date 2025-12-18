import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PolicyInstanceService } from '@/services/policyInstanceService';
import { ProofBundleService, AuditService } from '@/services/ProofBundleService';
import { RuntimeBindingService } from '@/services/RuntimeBindingService';
import type { 
  PolicyInstance, 
  CreatePolicyInstanceInput, 
  UpdatePolicyInstanceInput,
  PolicyInstanceStatus 
} from '@/types/policyInstance';

interface UsePolicyInstancesOptions {
  enterpriseId?: string;
  workspaceId?: string;
  toolVersionId?: string;
  status?: PolicyInstanceStatus;
  templateId?: string;
  autoLoad?: boolean;
}

export function usePolicyInstances(options: UsePolicyInstancesOptions = {}) {
  const { toast } = useToast();
  const [instances, setInstances] = useState<PolicyInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  

  const loadInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        enterprise_id: options.enterpriseId,
        workspace_id: options.workspaceId,
        tool_version_id: options.toolVersionId,
        status: options.status,
        template_id: options.templateId,
      };

      const data = await PolicyInstanceService.listInstances(filters);
      setInstances(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        variant: 'destructive',
        title: 'Failed to load policy instances',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [
    options.enterpriseId,
    options.workspaceId,
    options.toolVersionId,
    options.status,
    options.templateId,
    toast
  ]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadInstances();
    }
  }, [loadInstances, options.autoLoad]);

  const createInstance = useCallback(
    async (input: CreatePolicyInstanceInput) => {
      try {
        setLoading(true);
        setError(null);

        const newInstance = await PolicyInstanceService.createInstance(input);
        setInstances((prev) => [newInstance, ...prev]);

        toast({
          title: 'Policy instance created',
          description: 'The policy has been adapted for this tool.',
        });

        return newInstance;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast({
          variant: 'destructive',
          title: 'Failed to create instance',
          description: error.message,
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const updateInstance = useCallback(
    async (instanceId: string, updates: UpdatePolicyInstanceInput) => {
      try {
        setLoading(true);
        setError(null);

        const updated = await PolicyInstanceService.updateInstance(instanceId, updates);
        setInstances((prev) =>
          prev.map((inst) => (inst.id === instanceId ? updated : inst))
        );

        toast({
          title: 'Instance updated',
          description: 'Changes saved successfully.',
        });

        return updated;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast({
          variant: 'destructive',
          title: 'Failed to update instance',
          description: error.message,
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const submitForApproval = useCallback(
    async (instanceId: string) => {
      try {
        setLoading(true);
        await PolicyInstanceService.submitForApproval(instanceId);
        
        // Log audit event
        await AuditService.logPolicyEvent(
          'policy_submitted_for_approval',
          instanceId,
          { timestamp: new Date().toISOString() }
        );
        
        await loadInstances();

        toast({
          title: 'Submitted for approval',
          description: 'The policy instance is now under review.',
        });
        
        // Generate proof bundle after approval (simulating approval for demo)
        setTimeout(async () => {
          try {
            await ProofBundleService.generateProof(instanceId);
            await AuditService.logPolicyEvent(
              'proof_generated',
              instanceId,
              { timestamp: new Date().toISOString() }
            );
            toast({
              title: 'Proof generated',
              description: 'Cryptographic proof bundle created successfully.',
            });

            // Create runtime binding to activate policy
            const instance = instances.find(i => i.id === instanceId);
            if (instance && instance.workspace_id && instance.enterprise_id) {
              await RuntimeBindingService.createBinding(
                instanceId,
                instance.workspace_id,
                instance.enterprise_id
              );

              await AuditService.logPolicyEvent(
                'runtime_binding_created',
                instanceId,
                { 
                  status: 'active',
                  bound_at: new Date().toISOString(),
                }
              );

              toast({
                title: 'Policy activated',
                description: 'Runtime binding created - policy is now enforced',
              });
            }
          } catch (error) {
            console.error('Error generating proof:', error);
          }
        }, 2000);
      } catch (err) {
        const error = err as Error;
        toast({
          variant: 'destructive',
          title: 'Failed to submit',
          description: error.message,
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadInstances, toast]
  );

  const deleteInstance = useCallback(
    async (instanceId: string) => {
      try {
        setLoading(true);
        await PolicyInstanceService.deleteInstance(instanceId);
        setInstances((prev) => prev.filter((inst) => inst.id !== instanceId));

        toast({
          title: 'Instance deleted',
          description: 'Policy instance has been removed.',
        });
      } catch (err) {
        const error = err as Error;
        toast({
          variant: 'destructive',
          title: 'Failed to delete',
          description: error.message,
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    instances,
    loading,
    error,
    createInstance,
    updateInstance,
    submitForApproval,
    deleteInstance,
    refreshInstances: loadInstances,
  };
}
