import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  executeSandboxRun,
  fetchSandboxRuns,
  fetchSandboxRun,
  submitApproval,
  fetchApprovals,
  generateExport,
  fetchGovernanceEvents,
  subscribeSandboxRuns,
  subscribeGovernanceEvents,
} from '@/services/sandboxService';
import type {
  SandboxRunInput,
  SandboxRun,
  ApprovalInput,
  SandboxApproval,
  ExportInput,
  GovernanceEvent,
} from '@/types/sandbox';

export function useSandbox(workspaceId: string) {
  const { toast } = useToast();
  const [runs, setRuns] = useState<SandboxRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch runs on mount
  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSandboxRuns(workspaceId);
      setRuns(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        variant: 'destructive',
        title: 'Failed to load sandbox runs',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeSandboxRuns(workspaceId, (updatedRun) => {
      setRuns((prev) => {
        const index = prev.findIndex((r) => r.id === updatedRun.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = updatedRun;
          return updated;
        }
        return [updatedRun, ...prev];
      });

      toast({
        title: 'Sandbox run updated',
        description: `Run ${updatedRun.id.slice(0, 8)} status: ${updatedRun.status}`,
      });
    });

    return unsubscribe;
  }, [workspaceId, toast]);

  // Execute new run
  const runSimulation = useCallback(
    async (input: SandboxRunInput) => {
      try {
        setLoading(true);
        setError(null);
        const result = await executeSandboxRun(input);

        toast({
          title: 'Simulation executed',
          description: `Run ID: ${result.run_id.slice(0, 8)} completed in ${result.duration_ms}ms`,
        });

        await loadRuns();
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast({
          variant: 'destructive',
          title: 'Simulation failed',
          description: error.message,
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast, loadRuns]
  );

  return {
    runs,
    loading,
    error,
    runSimulation,
    refreshRuns: loadRuns,
  };
}

export function useSandboxRun(runId: string | null) {
  const { toast } = useToast();
  const [run, setRun] = useState<SandboxRun | null>(null);
  const [approvals, setApprovals] = useState<SandboxApproval[]>([]);
  const [events, setEvents] = useState<GovernanceEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Load run details
  const loadRun = useCallback(async () => {
    if (!runId) {
      setRun(null);
      setApprovals([]);
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      const [runData, approvalsData, eventsData] = await Promise.all([
        fetchSandboxRun(runId),
        fetchApprovals(runId),
        fetchGovernanceEvents(runId, 20),
      ]);

      setRun(runData);
      setApprovals(approvalsData);
      setEvents(eventsData);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to load run details',
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }, [runId, toast]);

  useEffect(() => {
    loadRun();
  }, [loadRun]);

  // Subscribe to governance events
  useEffect(() => {
    const unsubscribe = subscribeGovernanceEvents((event) => {
      if (event.entity_id === runId) {
        setEvents((prev) => [event, ...prev]);
      }
    });

    return unsubscribe;
  }, [runId]);

  // Submit approval
  const approve = useCallback(
    async (input: ApprovalInput) => {
      try {
        setLoading(true);
        const result = await submitApproval(input);

        toast({
          title: 'Approval submitted',
          description: `New status: ${result.new_status}`,
        });

        await loadRun();
        return result;
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Approval failed',
          description: (err as Error).message,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast, loadRun]
  );

  // Generate export
  const exportRun = useCallback(
    async (input: ExportInput) => {
      try {
        setLoading(true);
        const result = await generateExport(input);

        toast({
          title: 'Export generated',
          description: `File: ${result.file_name}`,
        });

        // Open download URL
        window.open(result.download_url, '_blank');

        return result;
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Export failed',
          description: (err as Error).message,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    run,
    approvals,
    events,
    loading,
    approve,
    exportRun,
    refreshRun: loadRun,
  };
}
