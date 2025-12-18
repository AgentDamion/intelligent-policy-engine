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

interface DecisionRequest {
  submissionId?: string;
  clientId?: string;
  agencyId?: string;
  documentType: 'submission' | 'policy' | 'tool_request';
  analysisType: 'approval' | 'risk_assessment' | 'cross_client_check';
  context?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, clientId, agencyId, documentType, analysisType, context }: DecisionRequest = await req.json();

    // Fetch relevant context data
    let submissionData: any = {};
    let relatedData: any = {};

    if (submissionId && documentType === 'submission') {
      const { data: submission } = await supabase
        .from('submissions')
        .select(`
          *,
          submission_items(*),
          workspace:workspaces(name, enterprise_name),
          scores(*)
        `)
        .eq('id', submissionId)
        .single();

      submissionData = submission;

      // Fetch related submissions from same client for pattern analysis
      const { data: relatedSubmissions } = await supabase
        .from('submissions')
        .select('id, overall_score, status, created_at')
        .eq('workspace_id', submission?.workspace_id)
        .neq('id', submissionId)
        .order('created_at', { ascending: false })
        .limit(10);

      relatedData.clientHistory = relatedSubmissions || [];
    }

    // Fetch cross-client data for pattern detection
    if (analysisType === 'cross_client_check') {
      const { data: crossClientData } = await supabase
        .from('submissions')
        .select(`
          id, overall_score, status, created_at,
          workspace:workspaces(name, enterprise_name),
          submission_items(ai_tool_name, vendor, description)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      relatedData.crossClientSubmissions = crossClientData || [];
    }

    // Generate AI prompt for decision analysis
    const prompt = generateDecisionPrompt(documentType, analysisType, {
      submission: submissionData,
      related: relatedData,
      context
    });

    // Call Lovable AI for intelligent decision making
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
            content: 'You are an expert pharmaceutical compliance AI agent. Make intelligent approval/rejection decisions based on regulatory requirements, risk assessment, and cross-client patterns. Always provide detailed reasoning for your decisions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 800,
        temperature: 0.2
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API call failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiAnalysis = aiResult.choices[0].message.content;

    // Process AI decision into structured format
    const decision = processAIDecision(aiAnalysis, {
      submissionId,
      clientId,
      agencyId,
      documentType,
      analysisType,
      submissionData,
      relatedData
    });

    // Store the decision in the database
    const { data: insertedDecision, error: insertError } = await supabase
      .from('ai_agent_decisions')
      .insert({
        agent: 'Agency Decision AI',
        action: `${analysisType} for ${documentType}`,
        outcome: decision.outcome,
        risk: decision.riskLevel,
        details: {
          ...decision,
          submissionId,
          clientId,
          agencyId,
          aiAnalysis,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing AI decision:', insertError);
    }

    // If this is a cross-client pattern, check for similar issues
    if (decision.crossClientPattern) {
      await checkCrossClientPatterns(decision, submissionData, relatedData);
    }

    return new Response(JSON.stringify({
      success: true,
      decision,
      aiAnalysis,
      decisionId: insertedDecision?.id,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Agency AI Decisions error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateDecisionPrompt(documentType: string, analysisType: string, data: any): string {
  const { submission, related, context } = data;

  let basePrompt = `Analyze the following pharmaceutical AI tool submission for compliance decision-making:

Document Type: ${documentType}
Analysis Type: ${analysisType}

`;

  if (submission) {
    basePrompt += `SUBMISSION DATA:
Title: ${submission.title || 'N/A'}
Overall Score: ${submission.overall_score || 'N/A'}
Status: ${submission.status || 'N/A'}
Client: ${submission.workspace?.enterprise_name || 'N/A'}
Submission Items: ${JSON.stringify(submission.submission_items || [], null, 2)}

`;
  }

  if (related.clientHistory?.length > 0) {
    basePrompt += `CLIENT HISTORY:
${JSON.stringify(related.clientHistory, null, 2)}

`;
  }

  if (related.crossClientSubmissions?.length > 0 && analysisType === 'cross_client_check') {
    basePrompt += `CROSS-CLIENT DATA (for pattern detection):
${JSON.stringify(related.crossClientSubmissions.slice(0, 10), null, 2)}

`;
  }

  basePrompt += `Please provide:
1. DECISION: (approved/rejected/flagged/escalated)
2. RISK LEVEL: (low/medium/high/critical)
3. REASONING: Detailed explanation for the decision
4. CONFIDENCE: Your confidence level (0.0-1.0)
5. SLA IMPACT: (none/minor/major/critical) - assess if this will affect review timelines
6. CROSS-CLIENT PATTERN: (true/false) - does this relate to patterns seen in other clients?
7. RECOMMENDED ACTION: What should the agency do next?
8. COMPLIANCE CONCERNS: Any specific regulatory framework issues

Focus on:
- FDA, EMA, or other relevant regulatory requirements
- Data privacy and security considerations (GDPR, HIPAA)
- Risk to patient safety or data integrity
- Consistency with previously approved similar tools
- Cross-client policy conflicts or opportunities for standardization

Be thorough but practical in your analysis.`;

  return basePrompt;
}

function processAIDecision(aiAnalysis: string, context: any): any {
  // Extract structured decision from AI analysis
  const decision: any = {
    rawAnalysis: aiAnalysis,
    timestamp: new Date().toISOString(),
    clientId: context.clientId,
    agencyId: context.agencyId,
    submissionId: context.submissionId
  };

  // Extract decision outcome
  const decisionMatch = aiAnalysis.match(/DECISION:\s*(approved|rejected|flagged|escalated)/i);
  decision.outcome = decisionMatch ? decisionMatch[1].toLowerCase() : 'flagged';

  // Extract risk level
  const riskMatch = aiAnalysis.match(/RISK LEVEL:\s*(low|medium|high|critical)/i);
  decision.riskLevel = riskMatch ? riskMatch[1].toLowerCase() : 'medium';

  // Extract reasoning
  const reasoningMatch = aiAnalysis.match(/REASONING:\s*([^]*?)(?=\d+\.|$)/i);
  decision.reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Analysis completed';

  // Extract confidence
  const confidenceMatch = aiAnalysis.match(/CONFIDENCE:\s*(0?\.\d+|1\.0?)/i);
  decision.confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75;

  // Extract SLA impact
  const slaMatch = aiAnalysis.match(/SLA IMPACT:\s*(none|minor|major|critical)/i);
  decision.slaImpact = slaMatch ? slaMatch[1].toLowerCase() : 'none';

  // Extract cross-client pattern
  const crossClientMatch = aiAnalysis.match(/CROSS-CLIENT PATTERN:\s*(true|false)/i);
  decision.crossClientPattern = crossClientMatch ? crossClientMatch[1].toLowerCase() === 'true' : false;

  // Extract recommended action
  const actionMatch = aiAnalysis.match(/RECOMMENDED ACTION:\s*([^]*?)(?=\d+\.|$)/i);
  decision.recommendedAction = actionMatch ? actionMatch[1].trim() : 'Continue monitoring';

  // Extract compliance concerns
  const complianceMatch = aiAnalysis.match(/COMPLIANCE CONCERNS:\s*([^]*?)(?=\d+\.|$)/i);
  decision.complianceConcerns = complianceMatch ? complianceMatch[1].trim() : 'No major concerns identified';

  // Determine agency action based on decision
  if (decision.outcome === 'escalated' || decision.riskLevel === 'critical') {
    decision.agencyAction = 'escalate';
  } else if (decision.crossClientPattern) {
    decision.agencyAction = 'generate_report';
  } else if (decision.slaImpact === 'major' || decision.slaImpact === 'critical') {
    decision.agencyAction = 'notify_client';
  } else {
    decision.agencyAction = 'none';
  }

  return decision;
}

async function checkCrossClientPatterns(decision: any, submissionData: any, relatedData: any) {
  // Look for similar patterns across clients and flag for agency attention
  if (decision.crossClientPattern && relatedData.crossClientSubmissions) {
    const similarToolSubmissions = relatedData.crossClientSubmissions.filter((sub: any) => 
      sub.submission_items?.some((item: any) => 
        submissionData.submission_items?.some((currentItem: any) => 
          item.tool_name?.toLowerCase().includes(currentItem.tool_name?.toLowerCase().slice(0, 5)) ||
          item.vendor?.toLowerCase() === currentItem.vendor?.toLowerCase()
        )
      )
    );

    if (similarToolSubmissions.length > 1) {
      // Create a cross-client alert
      await supabase
        .from('ai_agent_decisions')
        .insert({
          agent: 'Cross-Client Pattern Detector',
          action: `Pattern detected across ${similarToolSubmissions.length + 1} clients`,
          outcome: 'flagged',
          risk: 'medium',
          details: {
            pattern: 'similar_tool_usage',
            affectedClients: similarToolSubmissions.map((s: any) => s.workspace?.enterprise_name).filter(Boolean),
            originalSubmission: submissionData.id,
            crossClientPattern: true,
            agencyAction: 'generate_report',
            reasoning: `Similar tool patterns detected across multiple pharmaceutical clients. Consider standardizing approval criteria.`
          }
        });
    }
  }
}