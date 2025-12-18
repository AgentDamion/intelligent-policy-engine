import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const exportSchema = z.object({
  run_id: z.string().uuid(),
  format: z.enum(['pdf', 'excel', 'json']).default('pdf'),
  include_sections: z.array(z.string()).optional(),
  recipient_role: z.enum(['internal', 'external']).default('internal'),
  workspace_id: z.string().uuid(),
});

type ExportInput = z.infer<typeof exportSchema>;

function maskSensitiveData(data: any, recipientRole: string): any {
  if (recipientRole === 'internal') {
    return data;
  }

  // For external recipients, use masked view data
  return {
    ...data,
    inputs_json: '[REDACTED]',
    outputs_json: data.outputs_json ? {
      compliance_score: data.outputs_json.compliance_score,
      validation_result: data.outputs_json.validation_result,
      // Redact detailed risk flags and metadata
    } : '[REDACTED]',
    error_message: data.error_message ? '[REDACTED]' : null,
  };
}

async function generateExportFile(
  runData: any,
  approvals: any[],
  events: any[],
  format: string
): Promise<Uint8Array> {
  const outputs = runData.outputs_json || {};
  const agentMeta = runData.agent_metadata || {};
  
  const exportData = {
    metadata: {
      exported_at: new Date().toISOString(),
      format: format,
      generator: 'aicomply.io Sandbox Export v1.0',
      run_id: runData.id,
      policy_id: runData.policy_id,
      status: runData.status,
      recipient_role: 'internal'
    },
    run_data: runData,
    approvals: approvals,
    governance_events: events,
    summary: {
      total_runs: 1,
      completed_runs: runData.status === 'completed' ? 1 : 0,
      average_compliance_score: outputs.compliance_score || 0
    }
  };

  if (format === 'json') {
    return new TextEncoder().encode(JSON.stringify(exportData, null, 2));
  } 
  
  if (format === 'excel') {
    // Comprehensive CSV format for Excel with AI insights
    const csvRows = [
      // Header
      ['Field', 'Value', 'AI Insight', 'Confidence'],
      
      // Metadata Section
      ['=== METADATA ===', '', '', ''],
      ['Run ID', exportData.metadata.run_id, '', ''],
      ['Policy ID', exportData.metadata.policy_id, '', ''],
      ['Status', exportData.metadata.status, '', ''],
      ['Created At', runData.created_at || 'N/A', '', ''],
      ['Proof Hash', runData.proof_hash || 'N/A', 'SHA-256 cryptographic integrity', ''],
      
      // Results Section
      ['=== RESULTS ===', '', '', ''],
      ['Compliance Score', outputs.compliance_score || 'N/A', agentMeta.compliance_agent?.reasoning || '', agentMeta.compliance_agent?.confidence || ''],
      ['Validation Result', outputs.validation_result || 'N/A', agentMeta.policy_validation?.reasoning || '', agentMeta.policy_validation?.confidence || ''],
      ['Risk Flags', outputs.risk_flags?.join('; ') || 'None', agentMeta.simulation_details?.risk_assessment || '', ''],
      ['Policy Matched', outputs.policy_matched ? 'Yes' : 'No', '', ''],
      ['Processing Time (ms)', outputs.processing_time_ms || 'N/A', '', ''],
      
      // AI Agent Analysis
      ['=== AI AGENT ANALYSIS ===', '', '', ''],
      ['Agents Used', agentMeta.agents_used?.join(', ') || 'N/A', '', ''],
      ['Overall Confidence', runData.agent_confidence || 'N/A', '', ''],
      ['Agent Reasoning', runData.agent_reasoning || 'N/A', '', ''],
      
      // Approvals Section
      ['=== APPROVALS ===', '', '', ''],
      ['Total Approvals', approvals.length.toString(), '', ''],
    ];
    
    // Add individual approvals
    approvals.forEach((approval: any, idx: number) => {
      csvRows.push([
        `Approval ${idx + 1}`,
        approval.approval_action,
        approval.comments || 'No comments',
        `by ${approval.approver_id}`
      ]);
    });
    
    // Governance Events Section
    csvRows.push(['=== GOVERNANCE EVENTS ===', '', '', '']);
    csvRows.push(['Total Events', events.length.toString(), '', '']);
    
    events.forEach((event: any, idx: number) => {
      csvRows.push([
        `Event ${idx + 1}`,
        event.event_type,
        event.action || '',
        event.created_at
      ]);
    });
    
    // Summary Section
    csvRows.push(['=== EXECUTIVE SUMMARY ===', '', '', '']);
    csvRows.push(['Total Runs', exportData.summary.total_runs?.toString() || '0', '', '']);
    csvRows.push(['Completed Runs', exportData.summary.completed_runs?.toString() || '0', '', '']);
    csvRows.push(['Avg Compliance', exportData.summary.average_compliance_score?.toString() || 'N/A', '', '']);
    
    // Convert to CSV string
    const csv = csvRows.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    return new TextEncoder().encode(csv);
  }
  
  // Enhanced Markdown format for PDF with AI insights
  const markdown = `
# Sandbox Run Export Report

## 📋 Executive Summary

**Status**: ${exportData.metadata.status.toUpperCase()}  
**Compliance Score**: ${outputs.compliance_score || 'N/A'}/100  
**Validation**: ${outputs.validation_result === 'pass' ? '✅ PASS' : '❌ FAIL'}  
**AI Confidence**: ${((runData.agent_confidence || 0) * 100).toFixed(0)}%

---

## 🔍 Metadata

| Field | Value |
|-------|-------|
| Run ID | \`${exportData.metadata.run_id}\` |
| Policy ID | \`${exportData.metadata.policy_id}\` |
| Status | ${exportData.metadata.status} |
| Created At | ${runData.created_at || 'N/A'} |
| Proof Hash | \`${runData.proof_hash || 'N/A'}\` |
| Control Level | ${runData.control_level || 'standard'} |

---

## 📊 Simulation Results

### Compliance Analysis
- **Score**: ${outputs.compliance_score || 'N/A'}/100
- **Validation**: ${outputs.validation_result || 'N/A'}
- **Policy Matched**: ${outputs.policy_matched ? 'Yes' : 'No'}
- **Processing Time**: ${outputs.processing_time_ms || 'N/A'}ms

### Risk Assessment
${outputs.risk_flags && outputs.risk_flags.length > 0 
  ? outputs.risk_flags.map((flag: string) => `- ⚠️ ${flag}`).join('\n')
  : '- ✅ No risk flags identified'}

---

## 🤖 AI Agent Analysis

### Agents Deployed
${agentMeta.agents_used ? agentMeta.agents_used.map((agent: string) => `- ${agent}`).join('\n') : '- No agent data available'}

### Agent Insights

${agentMeta.policy_validation ? `
**Policy Validation**
- Confidence: ${((agentMeta.policy_validation.confidence || 0) * 100).toFixed(0)}%
- Reasoning: ${agentMeta.policy_validation.reasoning || 'N/A'}
` : ''}

${agentMeta.compliance_agent ? `
**Compliance Agent**
- Confidence: ${((agentMeta.compliance_agent.confidence || 0) * 100).toFixed(0)}%
- Reasoning: ${agentMeta.compliance_agent.reasoning || 'N/A'}
` : ''}

${agentMeta.simulation_details ? `
**Simulation Details**
- Risk Assessment: ${agentMeta.simulation_details.risk_assessment || 'N/A'}
- Anomalies Detected: ${agentMeta.simulation_details.anomalies?.length || 0}
` : ''}

### Overall Agent Reasoning
${runData.agent_reasoning || 'No detailed reasoning available'}

---

## ✅ Approvals (${approvals.length})

${approvals.length > 0 
  ? approvals.map((approval: any, idx: number) => `
### Approval ${idx + 1}
- **Action**: ${approval.approval_action}
- **Approver**: ${approval.approver_id}
- **Role**: ${approval.approver_role || 'N/A'}
- **Comments**: ${approval.comments || 'No comments provided'}
- **Date**: ${approval.approved_at}
`).join('\n')
  : 'No approvals recorded'}

---

## 📜 Governance Events (${events.length})

${events.length > 0
  ? events.slice(0, 10).map((event: any, idx: number) => `
${idx + 1}. **${event.event_type}** - ${event.action || 'N/A'} (${event.created_at})
`).join('\n')
  : 'No governance events recorded'}

---

## 📈 Summary Statistics

| Metric | Value |
|--------|-------|
| Total Runs | ${exportData.summary.total_runs || 0} |
| Completed Runs | ${exportData.summary.completed_runs || 0} |
| Average Compliance | ${exportData.summary.average_compliance_score || 'N/A'} |

---

**Report Generated**: ${new Date().toISOString()}  
**Format**: ${exportData.metadata.format}  
**Recipient Role**: ${exportData.metadata.recipient_role}

---

*This report was generated by aicomply.io AI Governance Platform*
  `.trim();
  
  return new TextEncoder().encode(markdown);
}

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
    const validationResult = exportSchema.safeParse(body);

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

    const input: ExportInput = validationResult.data;

    // Check permissions
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', input.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch sandbox run (use masked view for external)
    const viewName = input.recipient_role === 'external' 
      ? 'sandbox_runs_masked' 
      : 'sandbox_runs';

    const { data: runData, error: runError } = await supabase
      .from(viewName)
      .select('*')
      .eq('id', input.run_id)
      .single();

    if (runError || !runData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sandbox run not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch approvals
    const { data: approvals } = await supabase
      .from('sandbox_approvals')
      .select('*')
      .eq('run_id', input.run_id);

    // Fetch governance events
    const { data: events } = await supabase
      .from('governance_events')
      .select('*')
      .eq('entity_id', input.run_id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Generate export file
    const fileContent = await generateExportFile(
      runData,
      approvals || [],
      events || [],
      input.format
    );

    const fileName = `sandbox-run-${input.run_id}-${Date.now()}.${input.format}`;
    const filePath = `exports/${input.workspace_id}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, fileContent, {
        contentType: input.format === 'json' ? 'application/json' : 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrl } = await supabase.storage
      .from('exports')
      .createSignedUrl(filePath, 3600);

    // Log export in database
    const { data: exportLog, error: logError } = await supabase
      .from('exports_log')
      .insert({
        run_id: input.run_id,
        exported_by: user.id,
        export_format: input.format,
        recipient_role: input.recipient_role,
        file_path: filePath,
        file_size_bytes: fileContent.length,
      })
      .select()
      .single();

    if (logError) {
      console.error('Export log error:', logError);
    }

    // Log governance event
    await supabase.functions.invoke('governance-ingest', {
      body: {
        event_type: 'sandbox_export',
        entity_type: 'export',
        entity_id: exportLog?.id,
        action: 'generate',
        metadata: {
          run_id: input.run_id,
          format: input.format,
          recipient_role: input.recipient_role,
          file_size: fileContent.length,
        },
        workspace_id: input.workspace_id,
        enterprise_id: runData.enterprise_id,
      },
    });

    const duration = Date.now() - startTime;

    console.log(`Export generated: ${fileName} (${duration}ms)`, {
      format: input.format,
      size: fileContent.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        export_id: exportLog?.id,
        download_url: signedUrl?.signedUrl,
        file_name: fileName,
        file_size: fileContent.length,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Export generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Export generation failed',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
