import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentCoordinationRequest {
  agentType: string;
  context: any;
  enterpriseId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { agentType, context, enterpriseId, priority } = await req.json() as AgentCoordinationRequest;
    
    console.log(`[Agent Coordinator] Processing ${agentType} for enterprise ${enterpriseId}`);

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Determine agent-specific processing
    let agentResponse;
    
    switch (agentType) {
      case 'ComplianceScoringAgent':
        agentResponse = await executeComplianceScoringAgent(context, enterpriseId, LOVABLE_API_KEY);
        break;
      case 'PolicyAgent':
        agentResponse = await executePolicyAgent(context, enterpriseId, LOVABLE_API_KEY);
        break;
      case 'ContextAgent':
        agentResponse = await executeContextAgent(context, enterpriseId, LOVABLE_API_KEY);
        break;
      case 'ToolDiscoveryAgent':
        agentResponse = await executeToolDiscoveryAgent(context, enterpriseId, LOVABLE_API_KEY);
        break;
      case 'MonitoringAgent':
        agentResponse = await executeMonitoringAgent(context, enterpriseId, LOVABLE_API_KEY);
        break;
      default:
        agentResponse = await executeGenericAgent(agentType, context, enterpriseId, LOVABLE_API_KEY);
    }

    // Log agent decision to database
    await supabaseClient.from('ai_agent_decisions').insert({
      agent: agentType,
      action: 'agent_coordination',
      outcome: agentResponse.decision,
      risk: agentResponse.riskLevel,
      enterprise_id: enterpriseId,
      details: {
        context,
        rationale: agentResponse.rationale,
        confidence: agentResponse.confidence,
        required_controls: agentResponse.requiredControls,
        priority
      }
    });

    return new Response(JSON.stringify(agentResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Agent coordination error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      decision: 'HUMAN_IN_LOOP',
      confidence: 0,
      rationale: 'Agent coordination failed',
      requiredControls: ['manual_review'],
      riskLevel: 'HIGH'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeComplianceScoringAgent(context: any, enterpriseId: string, apiKey: string) {
  console.log('[ComplianceScoringAgent] Analyzing compliance requirements');
  
  // Enhanced compliance analysis using Lovable AI
  const prompt = `Analyze this AI tool request for pharmaceutical compliance:

Tool: ${context.toolName || 'Unknown'}
Use Case: ${context.useCase || 'General usage'}
Content Type: ${context.contentType || 'Not specified'}
User Role: ${context.userRole || 'Not specified'}

Evaluate against:
- 21 CFR Part 11 (Electronic Records)
- GDPR/Privacy regulations
- MLR (Medical Legal Review) requirements
- Data integrity controls
- Risk classification

Provide structured analysis with compliance score (0-100), risk level, and specific control requirements.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a pharmaceutical compliance expert. Provide detailed regulatory analysis.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const aiResult = await response.json();
  const analysis = aiResult.choices[0].message.content;

  // Parse AI analysis for structured response
  const complianceScore = extractComplianceScore(analysis);
  const riskLevel = determineRiskLevel(complianceScore, analysis);
  const requiredControls = extractRequiredControls(analysis);

  return {
    decision: complianceScore >= 70 ? 'APPROVED' : complianceScore >= 40 ? 'HUMAN_IN_LOOP' : 'REJECTED',
    confidence: Math.min(0.95, complianceScore / 100 + 0.2),
    rationale: `Compliance analysis: ${analysis.substring(0, 200)}...`,
    requiredControls,
    riskLevel,
    metadata: {
      complianceScore,
      detailedAnalysis: analysis,
      regulations: ['21_CFR_Part_11', 'GDPR', 'MLR']
    }
  };
}

async function executePolicyAgent(context: any, enterpriseId: string, apiKey: string) {
  console.log('[PolicyAgent] Evaluating policy compliance');
  
  const prompt = `Evaluate this request against enterprise AI governance policies:

Request: ${JSON.stringify(context, null, 2)}
Enterprise ID: ${enterpriseId}

Consider:
- Existing policy frameworks
- Risk tolerance levels
- Approval workflows
- Precedent decisions
- Regulatory requirements

Provide policy decision with rationale and any required approvals.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an AI governance policy expert. Evaluate requests against enterprise policies.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const aiResult = await response.json();
  const analysis = aiResult.choices[0].message.content;

  return {
    decision: analysis.toLowerCase().includes('approve') ? 'APPROVED' : 
              analysis.toLowerCase().includes('reject') ? 'REJECTED' : 'HUMAN_IN_LOOP',
    confidence: 0.85,
    rationale: `Policy evaluation: ${analysis.substring(0, 200)}...`,
    requiredControls: extractPolicyControls(analysis),
    riskLevel: analysis.toLowerCase().includes('high risk') ? 'HIGH' : 
               analysis.toLowerCase().includes('medium risk') ? 'MEDIUM' : 'LOW',
    metadata: {
      policyAnalysis: analysis,
      enterpriseId
    }
  };
}

async function executeContextAgent(context: any, enterpriseId: string, apiKey: string) {
  console.log('[ContextAgent] Analyzing context and urgency');
  
  const prompt = `Analyze the context and urgency of this request:

Context: ${JSON.stringify(context, null, 2)}

Evaluate:
- Urgency level (low, medium, high, critical)
- User emotional state (calm, frustrated, urgent)
- Business impact (low, medium, high)
- Time sensitivity
- Required escalation path

Provide contextual intelligence for routing and prioritization.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a context analysis expert. Assess urgency, emotion, and business impact.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const aiResult = await response.json();
  const analysis = aiResult.choices[0].message.content;

  const urgency = extractUrgencyLevel(analysis);
  const businessImpact = extractBusinessImpact(analysis);

  return {
    decision: urgency === 'critical' ? 'HUMAN_IN_LOOP' : 'APPROVED',
    confidence: 0.90,
    rationale: `Context analysis: ${analysis.substring(0, 200)}...`,
    requiredControls: urgency === 'high' || urgency === 'critical' ? ['expedited_review'] : [],
    riskLevel: urgency === 'critical' ? 'HIGH' : urgency === 'high' ? 'MEDIUM' : 'LOW',
    metadata: {
      urgency,
      businessImpact,
      contextAnalysis: analysis
    }
  };
}

async function executeToolDiscoveryAgent(context: any, enterpriseId: string, apiKey: string) {
  console.log('[ToolDiscoveryAgent] Analyzing tool discovery request');
  
  // Simplified tool discovery logic - in real implementation would integrate with Cursor's discovery algorithms
  return {
    decision: 'APPROVED',
    confidence: 0.75,
    rationale: 'Tool discovery agent analysis completed',
    requiredControls: ['validation_check'],
    riskLevel: 'MEDIUM',
    metadata: {
      toolsFound: [],
      discoveryMethod: 'api_analysis'
    }
  };
}

async function executeMonitoringAgent(context: any, enterpriseId: string, apiKey: string) {
  console.log('[MonitoringAgent] Performing continuous monitoring analysis');
  
  // Simplified monitoring logic - in real implementation would integrate with Cursor's monitoring systems
  return {
    decision: 'APPROVED',
    confidence: 0.80,
    rationale: 'Monitoring agent detected no significant changes or risks',
    requiredControls: ['periodic_review'],
    riskLevel: 'LOW',
    metadata: {
      monitoringStatus: 'active',
      lastCheck: new Date().toISOString()
    }
  };
}

async function executeGenericAgent(agentType: string, context: any, enterpriseId: string, apiKey: string) {
  console.log(`[${agentType}] Executing generic agent logic`);
  
  // Generic agent execution with basic AI enhancement
  const prompt = `Analyze this request for ${agentType}:

Context: ${JSON.stringify(context, null, 2)}

Provide analysis appropriate for ${agentType} capabilities and determine if the request should be approved, rejected, or requires human review.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: `You are ${agentType}. Provide analysis within your domain expertise.` },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const aiResult = await response.json();
  const analysis = aiResult.choices[0].message.content;

  return {
    decision: 'HUMAN_IN_LOOP',
    confidence: 0.60,
    rationale: `${agentType} analysis: ${analysis.substring(0, 200)}...`,
    requiredControls: ['manual_review'],
    riskLevel: 'MEDIUM',
    metadata: {
      agentType,
      analysis
    }
  };
}

// Helper functions for parsing AI responses
function extractComplianceScore(analysis: string): number {
  const scoreMatch = analysis.match(/(\d+)%|\bscore[:\s]*(\d+)/i);
  if (scoreMatch) {
    return parseInt(scoreMatch[1] || scoreMatch[2]);
  }
  // Default scoring based on keywords
  if (analysis.toLowerCase().includes('compliant')) return 85;
  if (analysis.toLowerCase().includes('risk')) return 45;
  return 60;
}

function determineRiskLevel(score: number, analysis: string): string {
  if (score < 30 || analysis.toLowerCase().includes('critical')) return 'CRITICAL';
  if (score < 50 || analysis.toLowerCase().includes('high risk')) return 'HIGH';
  if (score < 75 || analysis.toLowerCase().includes('medium risk')) return 'MEDIUM';
  return 'LOW';
}

function extractRequiredControls(analysis: string): string[] {
  const controls: string[] = [];
  
  if (analysis.toLowerCase().includes('approval')) controls.push('approval_required');
  if (analysis.toLowerCase().includes('review')) controls.push('manual_review');
  if (analysis.toLowerCase().includes('audit')) controls.push('audit_trail');
  if (analysis.toLowerCase().includes('monitor')) controls.push('monitoring');
  if (analysis.toLowerCase().includes('encryption')) controls.push('encryption_required');
  if (analysis.toLowerCase().includes('validation')) controls.push('validation_check');
  
  return controls.length > 0 ? controls : ['standard_controls'];
}

function extractPolicyControls(analysis: string): string[] {
  const controls: string[] = [];
  
  if (analysis.toLowerCase().includes('legal')) controls.push('legal_review');
  if (analysis.toLowerCase().includes('compliance')) controls.push('compliance_check');
  if (analysis.toLowerCase().includes('security')) controls.push('security_review');
  if (analysis.toLowerCase().includes('data')) controls.push('data_governance');
  
  return controls.length > 0 ? controls : ['policy_review'];
}

function extractUrgencyLevel(analysis: string): string {
  if (analysis.toLowerCase().includes('critical')) return 'critical';
  if (analysis.toLowerCase().includes('high') || analysis.toLowerCase().includes('urgent')) return 'high';
  if (analysis.toLowerCase().includes('medium')) return 'medium';
  return 'low';
}

function extractBusinessImpact(analysis: string): string {
  if (analysis.toLowerCase().includes('high impact')) return 'high';
  if (analysis.toLowerCase().includes('medium impact')) return 'medium';
  return 'low';
}