import { supabase } from '@/integrations/supabase/client';
import type {
  SandboxRunInput,
  SandboxRun,
  ApprovalInput,
  SandboxApproval,
  ExportInput,
  ExportResult,
  GovernanceEvent,
} from '@/types/sandbox';

/**
 * Execute a policy sandbox simulation
 */
export async function executeSandboxRun(input: SandboxRunInput) {
  const { data, error } = await supabase.functions.invoke('sandbox-run', {
    body: input,
  });

  if (error) {
    console.error('Sandbox run error:', error);
    throw new Error(error.message || 'Failed to execute sandbox run');
  }

  return data as {
    success: boolean;
    run_id: string;
    outputs: any;
    proof_hash: string;
    duration_ms: number;
  };
}

/**
 * Fetch sandbox runs for a workspace
 */
export async function fetchSandboxRuns(workspaceId: string) {
  const { data, error } = await supabase
    .from('sandbox_runs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch sandbox runs error:', error);
    throw error;
  }

  return data as unknown as SandboxRun[];
}

/**
 * Fetch a single sandbox run by ID
 */
export async function fetchSandboxRun(runId: string) {
  const { data, error } = await supabase
    .from('sandbox_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (error) {
    console.error('Fetch sandbox run error:', error);
    throw error;
  }

  return data as unknown as SandboxRun;
}

/**
 * Submit an approval for a sandbox run
 */
export async function submitApproval(input: ApprovalInput) {
  const { data, error } = await supabase.functions.invoke('sandbox-approve', {
    body: input,
  });

  if (error) {
    console.error('Approval error:', error);
    throw new Error(error.message || 'Failed to submit approval');
  }

  return data as {
    success: boolean;
    approval_id: string;
    new_status: string;
    duration_ms: number;
  };
}

/**
 * Fetch approvals for a sandbox run
 */
export async function fetchApprovals(runId: string) {
  const { data, error } = await supabase
    .from('sandbox_approvals')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch approvals error:', error);
    throw error;
  }

  return data as unknown as SandboxApproval[];
}

/**
 * Generate an export for a sandbox run
 */
export async function generateExport(input: ExportInput) {
  const { data, error } = await supabase.functions.invoke('sandbox-export', {
    body: input,
  });

  if (error) {
    console.error('Export error:', error);
    throw new Error(error.message || 'Failed to generate export');
  }

  return data as unknown as ExportResult;
}

/**
 * Fetch governance events for a run
 */
export async function fetchGovernanceEvents(
  entityId?: string,
  limit = 50
): Promise<GovernanceEvent[]> {
  try {
    console.log('fetchGovernanceEvents called with:', { entityId, limit });
    
    let query = supabase
      .from('governance_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Filter by run_id (entity_id) if provided
    if (entityId) {
      query = query.eq('run_id', entityId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error querying governance_events:', error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} governance events`);
    
    // Map database schema to GovernanceEvent type
    const mappedEvents: GovernanceEvent[] = (data || []).map((event: any) => ({
      id: event.id,
      event_type: event.event_type,
      entity_type: 'sandbox_run',
      entity_id: event.run_id,
      action: event.grade || 'unknown',
      metadata: {
        role_view: event.role_view,
        grade: event.grade,
        coverage: event.coverage,
        details: event.details
      },
      workspace_id: event.workspace_id,
      enterprise_id: undefined,
      actor_id: event.user_id,
      created_at: event.created_at
    }));
    
    return mappedEvents;
  } catch (error) {
    console.error('Error fetching governance events:', error);
    return [];
  }
}

/**
 * Subscribe to real-time sandbox run updates
 */
export function subscribeSandboxRuns(
  workspaceId: string,
  callback: (run: SandboxRun) => void
) {
  const channel = supabase
    .channel('sandbox-runs-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sandbox_runs',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as SandboxRun);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to real-time governance events
 */
export function subscribeGovernanceEvents(callback: (event: GovernanceEvent) => void) {
  const channel = supabase
    .channel('governance-events-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'governance_events',
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as GovernanceEvent);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Wait for a simulation to complete
 * Polls the sandbox_runs table until the run reaches 'completed' status or times out
 */
export async function waitForSimulationCompletion(
  runId: string,
  timeoutMs: number = 30000
): Promise<SandboxRun> {
  const startTime = Date.now();
  const pollInterval = 2000; // Poll every 2 seconds

  while (Date.now() - startTime < timeoutMs) {
    const run = await fetchSandboxRun(runId);
    
    if (run.status === 'completed' || run.status === 'failed') {
      return run;
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Simulation completion timeout');
}

/**
 * Save a simulation as draft without executing
 */
export async function saveDraftSimulation(input: Omit<SandboxRunInput, 'workspace_id' | 'enterprise_id'> & {
  workspace_id: string;
  enterprise_id: string;
  name?: string;
}): Promise<{ success: boolean; draft_id: string }> {
  // For now, we'll use the same structure but mark it as draft in metadata
  // In a real implementation, this would save to a drafts table
  const draftData = {
    ...input,
    test_scenario: {
      ...input.test_scenario,
      draft: true,
      saved_at: new Date().toISOString(),
    },
  };

  // Store in localStorage for now (in production, would use database)
  const draftId = crypto.randomUUID();
  const drafts = JSON.parse(localStorage.getItem('simulation_drafts') || '[]');
  drafts.push({ id: draftId, ...draftData });
  localStorage.setItem('simulation_drafts', JSON.stringify(drafts));

  return { success: true, draft_id: draftId };
}
