import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-enterprise-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Sandbox Export Edge Function
 * 
 * Exports sandbox run results with AI-generated insights
 * Uses SandboxAgent to create executive summaries and detailed reports
 * 
 * Input:
 * - sandbox_run_id: UUID of the sandbox run
 * - export_type: 'json' | 'pdf' | 'markdown' | 'csv'
 * - enterprise_id: UUID of the enterprise
 * - user_id: UUID of the user requesting export
 * - include_raw_data: boolean (default: false)
 * 
 * Output:
 * - export_data: Formatted export data
 * - ai_summary: AI-generated executive summary
 * - export_metadata: Export details
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      sandbox_run_id, 
      export_type = 'json', 
      enterprise_id, 
      user_id,
      include_raw_data = false,
      include_ai_insights = true
    } = await req.json()

    if (!sandbox_run_id || !enterprise_id || !user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: sandbox_run_id, enterprise_id, user_id'
      }), { status: 400, headers: corsHeaders })
    }

    const validExportTypes = ['json', 'pdf', 'markdown', 'csv']
    if (!validExportTypes.includes(export_type)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid export_type. Must be one of: ${validExportTypes.join(', ')}`
      }), { status: 400, headers: corsHeaders })
    }

    console.log(`📥 Exporting sandbox run: ${sandbox_run_id} as ${export_type}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch sandbox run with all related data
    const { data: sandboxRun, error: fetchError } = await supabase
      .from('sandbox_runs')
      .select(`
        *,
        sandbox_controls(*),
        sandbox_approvals(*)
      `)
      .eq('id', sandbox_run_id)
      .single()

    if (fetchError || !sandboxRun) {
      return new Response(JSON.stringify({
        success: false,
        error: `Sandbox run not found: ${fetchError?.message || 'Unknown error'}`
      }), { status: 404, headers: corsHeaders })
    }

    // Fetch policy details
    const { data: policy } = await supabase
      .from('policies')
      .select('*')
      .eq('id', sandboxRun.policy_id)
      .single()

    console.log(`📋 Sandbox run loaded: ${sandboxRun.scenario_name}`)

    // Generate AI insights if requested
    let aiInsights = null
    if (include_ai_insights) {
      console.log('🤖 Generating AI insights...')
      
      try {
        const insightsResponse = await fetch(`${supabaseUrl}/functions/v1/cursor-agent-adapter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({
            agentName: 'sandbox',
            action: 'generate_report_insights',
            input: {
              action: 'generate_report_insights',
              simulation_data: {
                ...sandboxRun,
                policy,
                controls: sandboxRun.sandbox_controls,
                approvals: sandboxRun.sandbox_approvals
              }
            },
            context: {
              source: 'sandbox-export',
              export_type
            },
            enterprise_id
          })
        })

        if (insightsResponse.ok) {
          const insightsResult = await insightsResponse.json()
          aiInsights = insightsResult.result
          console.log('✅ AI insights generated')
        } else {
          console.warn('⚠️ Failed to generate AI insights, continuing without them')
        }
      } catch (error) {
        console.warn('⚠️ AI insights generation error:', error)
        // Continue without AI insights
      }
    }

    // Format export based on type
    let exportData: any
    let fileName: string

    switch (export_type) {
      case 'json':
        exportData = formatAsJSON(sandboxRun, policy, aiInsights, include_raw_data)
        fileName = `sandbox-run-${sandbox_run_id}-${Date.now()}.json`
        break

      case 'markdown':
        exportData = formatAsMarkdown(sandboxRun, policy, aiInsights)
        fileName = `sandbox-run-${sandbox_run_id}-${Date.now()}.md`
        break

      case 'csv':
        exportData = formatAsCSV(sandboxRun, policy)
        fileName = `sandbox-run-${sandbox_run_id}-${Date.now()}.csv`
        break

      case 'pdf':
        // PDF generation would require additional library
        exportData = {
          format: 'pdf',
          message: 'PDF generation not yet implemented',
          markdown_preview: formatAsMarkdown(sandboxRun, policy, aiInsights)
        }
        fileName = `sandbox-run-${sandbox_run_id}-${Date.now()}.pdf`
        break

      default:
        exportData = formatAsJSON(sandboxRun, policy, aiInsights, include_raw_data)
        fileName = `sandbox-run-${sandbox_run_id}-${Date.now()}.json`
    }

    // Log export to exports_log table
    await supabase.from('exports_log').insert({
      sandbox_run_id,
      export_type,
      file_path: fileName,
      file_size_bytes: JSON.stringify(exportData).length,
      ai_summary: aiInsights?.executive_summary || null,
      ai_insights: aiInsights || {},
      generated_by: user_id
    })

    // Log governance event
    await supabase.from('governance_events').insert({
      enterprise_id,
      event_type: 'sandbox_exported',
      event_source: 'sandbox',
      event_severity: 'info',
      related_id: sandbox_run_id,
      related_type: 'sandbox_run',
      user_id,
      metadata: {
        export_type,
        file_name: fileName,
        include_ai_insights,
        include_raw_data
      }
    })

    console.log(`✅ Export complete: ${fileName}`)

    return new Response(JSON.stringify({
      success: true,
      export_data: exportData,
      file_name: fileName,
      ai_summary: aiInsights?.executive_summary || null,
      export_metadata: {
        sandbox_run_id,
        export_type,
        generated_at: new Date().toISOString(),
        file_size_bytes: JSON.stringify(exportData).length,
        include_ai_insights,
        include_raw_data
      }
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('🚨 Export error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ============================================
// FORMAT FUNCTIONS
// ============================================

function formatAsJSON(sandboxRun: any, policy: any, aiInsights: any, includeRawData: boolean): any {
  const baseExport = {
    export_version: '1.0',
    exported_at: new Date().toISOString(),
    sandbox_run: {
      id: sandboxRun.id,
      scenario_name: sandboxRun.scenario_name,
      status: sandboxRun.status,
      created_at: sandboxRun.created_at,
      completed_at: sandboxRun.completed_at
    },
    policy: {
      id: policy?.id,
      name: policy?.name || policy?.title,
      version: policy?.version
    },
    results: {
      validation_status: sandboxRun.validation_status,
      compliance_score: sandboxRun.compliance_score,
      risk_flags: sandboxRun.risk_flags,
      outputs: sandboxRun.outputs,
      agent_confidence: sandboxRun.agent_confidence
    },
    ai_insights: aiInsights || sandboxRun.ai_insights,
    controls: sandboxRun.sandbox_controls?.map((c: any) => ({
      name: c.control_name,
      type: c.control_type,
      status: c.status,
      severity: c.severity
    })) || []
  }

  if (includeRawData) {
    return {
      ...baseExport,
      raw_data: {
        full_sandbox_run: sandboxRun,
        full_policy: policy
      }
    }
  }

  return baseExport
}

function formatAsMarkdown(sandboxRun: any, policy: any, aiInsights: any): string {
  const compliancePercent = (sandboxRun.compliance_score * 100).toFixed(0)
  const confidencePercent = (sandboxRun.agent_confidence * 100).toFixed(0)

  return `# Sandbox Run Report: ${sandboxRun.scenario_name}

## Executive Summary
${aiInsights?.executive_summary || 'Simulation completed successfully.'}

## Simulation Details
- **Run ID**: ${sandboxRun.id}
- **Policy**: ${policy?.name || policy?.title || 'Unknown'}
- **Status**: ${sandboxRun.status}
- **Created**: ${new Date(sandboxRun.created_at).toLocaleString()}
- **Completed**: ${new Date(sandboxRun.completed_at).toLocaleString()}

## Results
- **Validation Status**: ${sandboxRun.validation_status ? '✅ Passed' : '❌ Failed'}
- **Compliance Score**: ${compliancePercent}%
- **AI Confidence**: ${confidencePercent}%
- **Risk Flags**: ${sandboxRun.risk_flags?.length || 0}

## Key Findings
${aiInsights?.key_findings?.map((f: string) => `- ${f}`).join('\n') || 'No key findings available.'}

## Risk Analysis
${aiInsights?.risk_summary || 'No risk analysis available.'}

## Compliance Assessment
${aiInsights?.compliance_summary || 'No compliance assessment available.'}

## Recommended Actions
${aiInsights?.next_actions?.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n') || 'No recommended actions.'}

## Controls Evaluated
${sandboxRun.sandbox_controls?.map((c: any) => 
  `- **${c.control_name}** (${c.control_type}): ${c.status} ${c.severity ? `[${c.severity}]` : ''}`
).join('\n') || 'No controls evaluated.'}

---
*Report generated on ${new Date().toISOString()}*
*AI Model: ${sandboxRun.agent_metadata?.ai_model || 'Unknown'}*
`
}

function formatAsCSV(sandboxRun: any, policy: any): string {
  const headers = [
    'Run ID',
    'Scenario Name',
    'Policy Name',
    'Status',
    'Validation Status',
    'Compliance Score',
    'AI Confidence',
    'Risk Flags Count',
    'Created At',
    'Completed At'
  ]

  const row = [
    sandboxRun.id,
    sandboxRun.scenario_name,
    policy?.name || policy?.title || 'Unknown',
    sandboxRun.status,
    sandboxRun.validation_status ? 'Passed' : 'Failed',
    sandboxRun.compliance_score,
    sandboxRun.agent_confidence,
    sandboxRun.risk_flags?.length || 0,
    sandboxRun.created_at,
    sandboxRun.completed_at
  ]

  return `${headers.join(',')}\n${row.join(',')}`
}

