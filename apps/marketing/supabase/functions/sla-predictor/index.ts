import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface SLAPredictionRequest {
  workspaceId?: string;
  enterpriseId?: string;
  predictionDays?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workspaceId, enterpriseId, predictionDays = 7 }: SLAPredictionRequest = await req.json();

    // Fetch approval workflow data for analysis
    let query = supabase
      .from('approval_workflows')
      .select(`
        id, workflow_name, current_stage, due_date, created_at, started_at,
        sla_hours, progress_percentage, bottleneck_detected, escalation_triggered,
        stages, estimated_completion
      `)
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else if (enterpriseId) {
      query = query.eq('enterprise_id', enterpriseId);
    }

    const { data: workflows, error } = await query.limit(100);

    if (error) {
      throw new Error(`Failed to fetch workflow data: ${error.message}`);
    }

    // Fetch submission data for workload analysis
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, status, created_at, overall_score')
      .order('created_at', { ascending: false })
      .limit(200);

    // Prepare data for AI analysis
    const analysisData = {
      workflows: workflows || [],
      submissions: submissions || [],
      currentDate: new Date().toISOString(),
      predictionPeriod: predictionDays
    };

    // Generate AI prompt for SLA prediction
    const prompt = generateSLAPredictionPrompt(analysisData);

    // Call Lovable AI for predictive analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in pharmaceutical compliance workflow analysis and SLA prediction. Analyze approval workflow patterns to predict SLA breaches and recommend optimization strategies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API call failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiAnalysis = aiResult.choices[0].message.content;

    // Process AI analysis into structured predictions
    const predictions = processSLAPredictions(aiAnalysis, analysisData);

    // Store critical SLA alerts as AI decisions
    if (predictions.criticalBreaches > 0) {
      await supabase
        .from('ai_agent_decisions')
        .insert({
          agent: 'SLA Prediction AI',
          action: `Predicted ${predictions.criticalBreaches} critical SLA breaches in next ${predictionDays} days`,
          outcome: 'escalated',
          risk: 'high',
          details: {
            ...predictions,
            workspaceId,
            enterpriseId,
            predictionPeriod: predictionDays,
            aiAnalysis,
            crossClientPattern: false,
            slaImpact: 'critical',
            agencyAction: 'escalate'
          }
        });
    }

    return new Response(JSON.stringify({
      success: true,
      predictions,
      aiAnalysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SLA Predictor error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSLAPredictionPrompt(data: any): string {
  return `Analyze the following pharmaceutical compliance workflow data to predict SLA breaches:

CURRENT WORKFLOWS:
${JSON.stringify(data.workflows.slice(0, 20), null, 2)}

RECENT SUBMISSIONS:
${JSON.stringify(data.submissions.slice(0, 30), null, 2)}

ANALYSIS PARAMETERS:
- Current Date: ${data.currentDate}
- Prediction Period: ${data.predictionPeriod} days
- Total Active Workflows: ${data.workflows.length}
- Recent Submissions: ${data.submissions.length}

Please analyze and provide:

1. CRITICAL BREACHES: Number of workflows likely to breach SLA critically (within 24-48 hours)
2. MAJOR BREACHES: Number of workflows likely to breach SLA within the prediction period
3. RISK WORKFLOWS: List specific workflow IDs at highest risk
4. BOTTLENECK STAGES: Which approval stages are causing the most delays
5. RESOURCE RECOMMENDATIONS: How to reallocate reviewers to prevent breaches
6. WORKLOAD PROJECTION: Expected new submissions vs. team capacity
7. OPTIMIZATION OPPORTUNITIES: Process improvements to reduce future SLA risks

Focus on:
- Pattern recognition in approval times vs. SLA targets
- Reviewer workload distribution and capacity
- Document complexity vs. processing time correlations
- Seasonal/cyclical patterns in submission volumes
- Impact of escalations and bottlenecks on downstream workflows

Provide specific, actionable recommendations for preventing SLA breaches.`;
}

function processSLAPredictions(aiAnalysis: string, data: any): any {
  const predictions: any = {
    analysisTimestamp: new Date().toISOString(),
    predictionPeriod: data.predictionPeriod,
    totalWorkflows: data.workflows.length
  };

  // Extract critical breach count
  const criticalMatch = aiAnalysis.match(/CRITICAL BREACHES:\s*(\d+)/i);
  predictions.criticalBreaches = criticalMatch ? parseInt(criticalMatch[1]) : 0;

  // Extract major breach count
  const majorMatch = aiAnalysis.match(/MAJOR BREACHES:\s*(\d+)/i);
  predictions.majorBreaches = majorMatch ? parseInt(majorMatch[1]) : 0;

  // Extract risk workflows
  const riskWorkflowsMatch = aiAnalysis.match(/RISK WORKFLOWS:\s*([^]*?)(?=\d+\.|$)/i);
  predictions.riskWorkflows = riskWorkflowsMatch ? 
    riskWorkflowsMatch[1].trim().split(',').map(id => id.trim()) : [];

  // Extract bottleneck stages
  const bottleneckMatch = aiAnalysis.match(/BOTTLENECK STAGES:\s*([^]*?)(?=\d+\.|$)/i);
  predictions.bottleneckStages = bottleneckMatch ? bottleneckMatch[1].trim() : 'Initial Review';

  // Extract resource recommendations
  const resourceMatch = aiAnalysis.match(/RESOURCE RECOMMENDATIONS:\s*([^]*?)(?=\d+\.|$)/i);
  predictions.resourceRecommendations = resourceMatch ? resourceMatch[1].trim() : 'Monitor current workload';

  // Extract workload projection
  const workloadMatch = aiAnalysis.match(/WORKLOAD PROJECTION:\s*([^]*?)(?=\d+\.|$)/i);
  predictions.workloadProjection = workloadMatch ? workloadMatch[1].trim() : 'Stable workload expected';

  // Extract optimization opportunities
  const optimizationMatch = aiAnalysis.match(/OPTIMIZATION OPPORTUNITIES:\s*([^]*?)(?=\d+\.|$)/i);
  predictions.optimizationOpportunities = optimizationMatch ? 
    optimizationMatch[1].trim() : 'Continue current processes';

  // Calculate overall risk level
  if (predictions.criticalBreaches > 3) {
    predictions.overallRiskLevel = 'critical';
  } else if (predictions.criticalBreaches > 0 || predictions.majorBreaches > 5) {
    predictions.overallRiskLevel = 'high';
  } else if (predictions.majorBreaches > 2) {
    predictions.overallRiskLevel = 'medium';
  } else {
    predictions.overallRiskLevel = 'low';
  }

  // Add recommended actions based on risk level
  if (predictions.overallRiskLevel === 'critical') {
    predictions.recommendedActions = [
      'Immediately escalate critical workflows',
      'Reallocate senior reviewers to high-risk items',
      'Implement emergency approval protocols',
      'Notify clients of potential delays'
    ];
  } else if (predictions.overallRiskLevel === 'high') {
    predictions.recommendedActions = [
      'Monitor critical workflows closely',
      'Preemptively reallocate reviewer capacity',
      'Expedite bottleneck stages'
    ];
  } else {
    predictions.recommendedActions = [
      'Continue standard monitoring',
      'Optimize workflow efficiency'
    ];
  }

  return predictions;
}