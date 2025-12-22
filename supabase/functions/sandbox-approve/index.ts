import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const approvalSchema = z.object({
  run_id: z.string().uuid(),
  approval_action: z.enum(['approve', 'reject', 'request_changes']),
  approver_role: z.enum(['admin', 'reviewer', 'compliance_officer']),
  comments: z.string().optional(),
  conditions: z.string().optional(),
  workspace_id: z.string().uuid(),
});

type ApprovalInput = z.infer<typeof approvalSchema>;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validationResult = approvalSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid input',
          details: validationResult.error.issues,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const input: ApprovalInput = validationResult.data;

    // Fetch sandbox run
    const { data: sandboxRun, error: runError } = await supabase
      .from('sandbox_runs')
      .select('*')
      .eq('id', input.run_id)
      .single();

    if (runError || !sandboxRun) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sandbox run not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if run is in correct status
    if (sandboxRun.status !== 'completed' && sandboxRun.status !== 'pending_approval') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Cannot approve run with status: ${sandboxRun.status}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check approval authority (verify user role)
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', input.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!member || !['admin', 'owner'].includes(member.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient approval authority' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-approval
    if (sandboxRun.run_by === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot approve your own sandbox run' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create approval record
    const { data: approval, error: approvalError } = await supabase
      .from('sandbox_approvals')
      .insert({
        run_id: input.run_id,
        approver_id: user.id,
        approver_role: input.approver_role,
        approval_action: input.approval_action,
        comments: input.comments,
        conditions: input.conditions,
      })
      .select()
      .single();

    if (approvalError) {
      console.error('Approval insert error:', approvalError);
      throw approvalError;
    }

    // Update sandbox run status
    const newStatus = input.approval_action === 'approve' 
      ? 'approved' 
      : input.approval_action === 'reject'
      ? 'rejected'
      : 'changes_requested';

    const { error: updateError } = await supabase
      .from('sandbox_runs')
      .update({ status: newStatus })
      .eq('id', input.run_id);

    if (updateError) {
      console.error('Status update error:', updateError);
      throw updateError;
    }

    // Log governance event
    await supabase.functions.invoke('governance-ingest', {
      body: {
        event_type: 'sandbox_approval',
        entity_type: 'sandbox_approval',
        entity_id: approval.id,
        action: input.approval_action,
        metadata: {
          run_id: input.run_id,
          approver_role: input.approver_role,
          previous_status: sandboxRun.status,
          new_status: newStatus,
        },
        workspace_id: input.workspace_id,
        enterprise_id: sandboxRun.enterprise_id,
      },
    });

    const duration = Date.now() - startTime;

    console.log(`Sandbox approval recorded: ${approval.id} (${duration}ms)`, {
      action: input.approval_action,
      run_id: input.run_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        approval_id: approval.id,
        new_status: newStatus,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sandbox approval error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Approval process failed',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
