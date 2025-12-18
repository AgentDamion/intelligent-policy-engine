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

interface AgentRequest {
  agentType: 'ClientRiskAssessor' | 'SLAMonitor' | 'PolicyConflictDetector' | 'WorkloadBalancer';
  parameters: any;
  clientId?: string;
  agencyId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentType, parameters, clientId, agencyId }: AgentRequest = await req.json();

    // Fetch relevant data based on agent type
    let contextData: any = {};
    
    switch (agentType) {
      case 'ClientRiskAssessor':
        // Fetch client submission history and risk patterns
        const { data: submissions } = await supabase
          .from('submissions')
          .select(`
            id, status, overall_score, created_at,
            workspace:workspaces(name, enterprise_name)
          `)
          .order('created_at', { ascending: false })
          .limit(50);
        
        contextData = {
          submissions: submissions || [],
          clientId,
          timeframe: parameters.timeframe || '30d'
        };
        break;

      case 'SLAMonitor':
        // Fetch approval workflows and timing data
        const { data: workflows } = await supabase
          .from('approval_workflows')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        contextData = {
          workflows: workflows || [],
          slaThresholds: { standard: 48, urgent: 24, critical: 12 }
        };
        break;

      case 'PolicyConflictDetector':
        // Fetch policies across different clients
        const { data: policies } = await supabase
          .from('policies')
          .select(`
            id, title, category, content,
            enterprise:enterprises(name)
          `)
          .order('updated_at', { ascending: false });
        
        contextData = {
          policies: policies || [],
          crossClientAnalysis: parameters.crossClientAnalysis
        };
        break;

      case 'WorkloadBalancer':
        // Fetch team metrics and current workload
        const { data: teamData } = await supabase
          .from('workspace_members')
          .select(`
            user_id, role,
            profile:profiles(first_name, last_name),
            workspace:workspaces(name)
          `);
        
        contextData = {
          teamMembers: teamData || [],
          currentMetrics: parameters.teamMetrics
        };
        break;
    }

    // Generate AI prompt based on agent type
    const prompt = generateAgentPrompt(agentType, contextData, parameters);

    // Call Lovable AI for analysis
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
            content: `You are an expert pharmaceutical AI compliance assistant specializing in ${agentType} analysis. Provide detailed, actionable insights based on real data patterns.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API call failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const analysis = aiResult.choices[0].message.content;

    // Process AI response into structured results
    const structuredResults = processAIAnalysis(agentType, analysis, contextData);

    // Store the decision in the database
    const { error: insertError } = await supabase
      .from('ai_agent_decisions')
      .insert({
        agent: agentType,
        action: `Performed ${agentType} analysis`,
        outcome: structuredResults.outcome || 'analyzed',
        risk: structuredResults.riskLevel || 'medium',
        details: {
          ...structuredResults,
          clientId,
          agencyId,
          analysis,
          timestamp: new Date().toISOString()
        }
      });

    if (insertError) {
      console.error('Error storing AI decision:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      agentType,
      results: structuredResults,
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Agency AI Orchestrator error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateAgentPrompt(agentType: string, contextData: any, parameters: any): string {
  switch (agentType) {
    case 'ClientRiskAssessor':
      return `Analyze the following client submission data for risk assessment:

Client Submissions: ${JSON.stringify(contextData.submissions, null, 2)}
Timeframe: ${contextData.timeframe}
Client ID: ${contextData.clientId}

Please provide:
1. Overall risk score (0-100)
2. Risk trend (improving/stable/declining)
3. Key risk factors identified
4. Recommended actions
5. Comparison with industry benchmarks

Focus on patterns in submission scores, approval rates, and compliance issues.`;

    case 'SLAMonitor':
      return `Analyze the following workflow data for SLA monitoring:

Approval Workflows: ${JSON.stringify(contextData.workflows, null, 2)}
SLA Thresholds: ${JSON.stringify(contextData.slaThresholds)}

Please identify:
1. Current SLA breach risk level
2. Predicted future breaches in next 7 days
3. Bottlenecks in the approval process
4. Recommended resource allocation
5. Process optimization suggestions

Focus on timing patterns and workflow efficiency.`;

    case 'PolicyConflictDetector':
      return `Analyze the following policies for cross-client conflicts:

Policies: ${JSON.stringify(contextData.policies, null, 2)}
Cross-Client Analysis: ${contextData.crossClientAnalysis}

Please identify:
1. Conflicting requirements between client policies
2. Inconsistencies that could affect compliance
3. Risk level of identified conflicts
4. Recommended resolution strategies
5. Impact on cross-client tool approvals

Focus on regulatory framework differences and compliance gaps.`;

    case 'WorkloadBalancer':
      return `Analyze the following team data for workload optimization:

Team Members: ${JSON.stringify(contextData.teamMembers, null, 2)}
Current Metrics: ${JSON.stringify(contextData.currentMetrics)}

Please provide:
1. Workload distribution analysis
2. Team efficiency improvement opportunities
3. Optimal task assignment recommendations
4. Capacity utilization assessment
5. Performance optimization suggestions

Focus on balancing expertise, availability, and workload.`;

    default:
      return `Perform general analysis on the provided data: ${JSON.stringify(contextData)}`;
  }
}

function processAIAnalysis(agentType: string, analysis: string, contextData: any): any {
  // Extract structured information from AI analysis
  const results: any = {
    rawAnalysis: analysis,
    timestamp: new Date().toISOString(),
    agentType
  };

  switch (agentType) {
    case 'ClientRiskAssessor':
      // Extract risk score and trend from analysis
      const riskScoreMatch = analysis.match(/risk score.*?(\d+)/i);
      const trendMatch = analysis.match(/trend.*?(improving|stable|declining)/i);
      
      results.riskScore = riskScoreMatch ? parseInt(riskScoreMatch[1]) : 50;
      results.trend = trendMatch ? trendMatch[1] : 'stable';
      results.riskLevel = results.riskScore > 75 ? 'high' : results.riskScore > 50 ? 'medium' : 'low';
      results.outcome = results.riskScore > 80 ? 'flagged' : 'analyzed';
      break;

    case 'SLAMonitor':
      // Extract SLA metrics
      const breachCountMatch = analysis.match(/(\d+).*?breach/i);
      const predictedMatch = analysis.match(/(\d+).*?predicted/i);
      
      results.currentBreaches = breachCountMatch ? parseInt(breachCountMatch[1]) : 0;
      results.predictedBreaches = predictedMatch ? parseInt(predictedMatch[1]) : 0;
      results.riskLevel = results.predictedBreaches > 3 ? 'high' : results.predictedBreaches > 1 ? 'medium' : 'low';
      results.outcome = results.predictedBreaches > 0 ? 'escalated' : 'monitored';
      break;

    case 'PolicyConflictDetector':
      // Extract conflict information
      const conflictMatch = analysis.match(/(\d+).*?conflict/i);
      const severityMatch = analysis.match(/severity.*?(low|medium|high|critical)/i);
      
      results.conflictsFound = conflictMatch ? parseInt(conflictMatch[1]) : 0;
      results.severity = severityMatch ? severityMatch[1] : 'low';
      results.riskLevel = results.severity;
      results.outcome = results.conflictsFound > 0 ? 'flagged' : 'clear';
      break;

    case 'WorkloadBalancer':
      // Extract efficiency metrics
      const efficiencyMatch = analysis.match(/(\d+(?:\.\d+)?)%.*?efficiency/i);
      
      results.efficiency = {
        current: 75, // baseline
        improvement: efficiencyMatch ? parseFloat(efficiencyMatch[1]) : 10
      };
      results.riskLevel = 'low';
      results.outcome = 'optimized';
      break;
  }

  return results;
}