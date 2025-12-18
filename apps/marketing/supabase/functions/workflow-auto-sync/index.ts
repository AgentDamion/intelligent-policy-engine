import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Workflow Auto-Sync Edge Function
 * Automatically triggers platform syncs when approval workflows complete
 * Called by workflow completion hooks or scheduled jobs
 */

interface WorkflowCompletedEvent {
  workflow_id: string;
  document_id: string;
  document_type: 'policy' | 'submission';
  status: 'approved' | 'rejected';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const event: WorkflowCompletedEvent = await req.json();
    
    console.log('Workflow completed event:', event);

    if (event.status !== 'approved') {
      return new Response(
        JSON.stringify({ 
          message: 'Workflow not approved, skipping sync',
          workflow_id: event.workflow_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get workflow auto-sync configuration
    const { data: workflow, error: workflowError } = await supabase
      .from('approval_workflows')
      .select('auto_sync_platforms, enterprise_id, workspace_id')
      .eq('id', event.workflow_id)
      .single();

    if (workflowError || !workflow) {
      throw new Error(`Workflow not found: ${workflowError?.message}`);
    }

    const platformConfigIds = workflow.auto_sync_platforms || [];
    
    if (platformConfigIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No auto-sync platforms configured',
          workflow_id: event.workflow_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Triggering sync for ${platformConfigIds.length} platforms`);

    // Trigger sync for each configured platform
    const syncResults = await Promise.all(
      platformConfigIds.map(async (configId: string) => {
        try {
          // Call platform-universal function to perform sync
          const syncPayload = event.document_type === 'submission' 
            ? { 
                config_id: configId,
                submission_ids: [event.document_id],
                sync_type: 'incremental'
              }
            : {
                config_id: configId,
                policy_ids: [event.document_id],
                sync_type: 'incremental'
              };

          const { data: syncData, error: syncError } = await supabase.functions.invoke(
            'platform-universal',
            { body: syncPayload }
          );

          if (syncError) {
            console.error(`Sync failed for config ${configId}:`, syncError);
            return { config_id: configId, success: false, error: syncError.message };
          }

          console.log(`Sync successful for config ${configId}:`, syncData);
          return { config_id: configId, success: true, data: syncData };

        } catch (error: any) {
          console.error(`Sync exception for config ${configId}:`, error);
          return { config_id: configId, success: false, error: error.message };
        }
      })
    );

    // Log the auto-sync trigger event
    await supabase.from('agent_activities').insert({
      agent: 'workflow-automation',
      action: 'auto_sync_triggered',
      workspace_id: workflow.workspace_id,
      enterprise_id: workflow.enterprise_id,
      status: 'completed',
      details: {
        workflow_id: event.workflow_id,
        document_id: event.document_id,
        document_type: event.document_type,
        platforms: syncResults
      }
    });

    const successCount = syncResults.filter(r => r.success).length;
    const failureCount = syncResults.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-sync completed: ${successCount} succeeded, ${failureCount} failed`,
        workflow_id: event.workflow_id,
        results: syncResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Auto-sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
