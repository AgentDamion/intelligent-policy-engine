import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { context, options } = await req.json();

    // ContextAgent - Real-time Intelligence & Emotion Detection
    console.log('ContextAgent analyzing context for:', context?.clientName || 'Unknown');

    // Import Cursor ContextAgent's emotion detection
    const emotionAnalysis = await analyzeEmotionAndUrgency(context);
    
    // Import conversation flow algorithms  
    const conversationFlow = await analyzeConversationFlow(context, supabaseClient);
    
    // Enhance with Lovable AI for advanced reasoning
    const enhancedContext = await enhanceContextAnalysis(emotionAnalysis, conversationFlow, context);
    
    // Connect to customer support workflows
    const supportRecommendations = await generateSupportRecommendations(enhancedContext, context);
    
    // Implement automatic escalation triggers
    const escalationAnalysis = await analyzeEscalationNeed(enhancedContext, context, supabaseClient);

    // Generate final context intelligence
    const contextIntelligence = {
      decision: escalationAnalysis.needsEscalation ? 'ESCALATE' : 'PROCEED',
      confidence: enhancedContext.confidence,
      rationale: enhancedContext.reasoning,
      riskLevel: determineContextRisk(emotionAnalysis, escalationAnalysis),
      contextIntelligence: {
        emotionDetection: emotionAnalysis,
        conversationFlow: conversationFlow,
        urgencyLevel: enhancedContext.urgencyLevel,
        supportRecommendations: supportRecommendations,
        escalationTriggers: escalationAnalysis.triggers,
        proactiveActions: generateProactiveActions(enhancedContext, escalationAnalysis)
      }
    };

    // Connect to customer support and escalation workflows
    if (escalationAnalysis.needsEscalation) {
      await triggerEscalationWorkflow(supabaseClient, context, contextIntelligence);
    }

    // Store context analysis for learning
    await storeContextAnalysis(supabaseClient, context, contextIntelligence);

    return new Response(JSON.stringify(contextIntelligence), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ContextAgent error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      decision: 'MANUAL_REVIEW',
      confidence: 0.1,
      rationale: 'Context analysis failed, manual review required'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Import Cursor ContextAgent's emotion detection algorithms
async function analyzeEmotionAndUrgency(context: any) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  const emotionPrompt = `Analyze emotion and urgency in this pharmaceutical compliance context:
  
  Context: ${JSON.stringify(context)}
  Client Communication: ${context.message || context.description || 'No message provided'}
  
  Detect and analyze:
  1. Emotional state (frustrated, concerned, satisfied, urgent, calm)
  2. Urgency level (critical, high, medium, low)
  3. Stress indicators in communication
  4. Business impact sentiment
  5. Escalation risk factors
  
  Return structured analysis with emotions, urgencyScore (0-100), and riskIndicators.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: emotionPrompt }],
      }),
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    return {
      primaryEmotion: extractPrimaryEmotion(analysis),
      urgencyScore: extractUrgencyScore(analysis),
      emotionalState: extractEmotionalState(analysis),
      stressIndicators: extractStressIndicators(analysis),
      businessImpact: extractBusinessImpact(analysis),
      rawAnalysis: analysis
    };
  } catch (error) {
    console.error('Emotion analysis failed:', error);
    return {
      primaryEmotion: 'neutral',
      urgencyScore: 50,
      emotionalState: 'calm',
      stressIndicators: [],
      businessImpact: 'medium',
      rawAnalysis: 'Error in analysis'
    };
  }
}

// Import conversation flow algorithms from Cursor
async function analyzeConversationFlow(context: any, supabaseClient: any) {
  try {
    // Get conversation history for this client/context
    const { data: messages } = await supabaseClient
      .from('collaboration_messages')
      .select('*')
      .eq('document_id', context.documentId || '')
      .order('created_at', { ascending: true })
      .limit(20);

    const conversationHistory = messages || [];
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const flowPrompt = `Analyze conversation flow patterns:
    
    Current Context: ${JSON.stringify(context)}
    Conversation History: ${JSON.stringify(conversationHistory.map((m: any) => ({
      content: m.content,
      timestamp: m.created_at,
      type: m.message_type
    })))}
    
    Analyze conversation flow for:
    1. Communication patterns and frequency
    2. Response times and engagement
    3. Issue escalation patterns
    4. Resolution effectiveness
    5. Client satisfaction trajectory`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: flowPrompt }],
      }),
    });

    const data = await response.json();
    const flowAnalysis = data.choices[0].message.content;

    return {
      communicationPattern: extractCommunicationPattern(flowAnalysis),
      responseTime: extractResponseTime(flowAnalysis),
      escalationPattern: extractEscalationPattern(flowAnalysis),
      satisfactionTrend: extractSatisfactionTrend(flowAnalysis),
      analysis: flowAnalysis
    };
  } catch (error) {
    console.error('Conversation flow analysis failed:', error);
    return {
      communicationPattern: 'normal',
      responseTime: 'average',
      escalationPattern: 'none',
      satisfactionTrend: 'stable',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Enhanced context analysis with advanced reasoning
async function enhanceContextAnalysis(emotionAnalysis: any, conversationFlow: any, context: any) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  const enhancementPrompt = `Enhanced context intelligence analysis:
  
  Emotion Analysis: ${JSON.stringify(emotionAnalysis)}
  Conversation Flow: ${JSON.stringify(conversationFlow)}
  Context: ${JSON.stringify(context)}
  
  Provide advanced reasoning including:
  1. Overall urgency level assessment
  2. Confidence in analysis (0.0-1.0)
  3. Detailed reasoning for recommendations
  4. Proactive intervention opportunities
  5. Risk mitigation strategies
  6. Customer success optimization`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: enhancementPrompt }],
      }),
    });

    const data = await response.json();
    const enhancement = data.choices[0].message.content;
    
    return {
      urgencyLevel: extractUrgencyLevel(enhancement),
      confidence: extractConfidence(enhancement),
      reasoning: enhancement,
      interventionOpportunities: extractInterventionOpportunities(enhancement),
      riskMitigation: extractRiskMitigation(enhancement)
    };
  } catch (error) {
    console.error('Context enhancement failed:', error);
    return {
      urgencyLevel: 'medium',
      confidence: 0.6,
      reasoning: 'Basic context assessment',
      interventionOpportunities: [],
      riskMitigation: []
    };
  }
}

// Generate support recommendations based on context
async function generateSupportRecommendations(enhancedContext: any, context: any) {
  const recommendations = [];
  
  if (enhancedContext.urgencyLevel === 'high' || enhancedContext.urgencyLevel === 'critical') {
    recommendations.push('Immediate response required within 1 hour');
    recommendations.push('Assign senior support specialist');
  }
  
  if (enhancedContext.confidence < 0.7) {
    recommendations.push('Escalate to technical expert for clarification');
  }
  
  recommendations.push(...(enhancedContext.interventionOpportunities || []));
  recommendations.push(...(enhancedContext.riskMitigation || []));
  
  return recommendations;
}

// Analyze escalation needs with automatic triggers
async function analyzeEscalationNeed(enhancedContext: any, context: any, supabaseClient: any) {
  try {
    // Check escalation history
    const { data: escalations } = await supabaseClient
      .from('ai_agent_decisions')
      .select('*')
      .eq('agent', 'ContextAgent')
      .eq('outcome', 'escalated')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    const recentEscalations = escalations?.length || 0;
    
    // Determine escalation triggers
    const triggers = [];
    let needsEscalation = false;
    
    if (enhancedContext.urgencyLevel === 'critical') {
      triggers.push('Critical urgency detected');
      needsEscalation = true;
    }
    
    if (enhancedContext.confidence < 0.5) {
      triggers.push('Low confidence in automated resolution');
      needsEscalation = true;
    }
    
    if (recentEscalations > 3) {
      triggers.push('High escalation frequency detected');
    }
    
    if (context.clientTier === 'enterprise' && enhancedContext.urgencyLevel === 'high') {
      triggers.push('Enterprise client high priority');
      needsEscalation = true;
    }

    return {
      needsEscalation,
      triggers,
      escalationScore: calculateEscalationScore(enhancedContext, recentEscalations),
      recommendedLevel: determineEscalationLevel(enhancedContext, triggers)
    };
  } catch (error) {
    console.error('Escalation analysis failed:', error);
    return {
      needsEscalation: false,
      triggers: [],
      escalationScore: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Trigger escalation workflow automatically
async function triggerEscalationWorkflow(supabaseClient: any, context: any, intelligence: any) {
  try {
    // Create collaboration message for escalation
    const { error: messageError } = await supabaseClient
      .from('collaboration_messages')
      .insert({
        content: `AUTOMATIC ESCALATION: ${intelligence.rationale}`,
        message_type: 'escalation',
        document_id: context.documentId,
        document_type: context.documentType || 'support',
        sender_id: null, // System message
        metadata: {
          contextIntelligence: intelligence.contextIntelligence,
          autoEscalation: true,
          urgencyLevel: intelligence.contextIntelligence.urgencyLevel
        }
      });

    if (messageError) throw messageError;

    // Update approval workflow if applicable
    if (context.workflowId) {
      const { error: workflowError } = await supabaseClient
        .from('approval_workflows')
        .update({
          escalation_triggered: true,
          metadata: {
            contextEscalation: intelligence,
            lastUpdated: new Date().toISOString()
          }
        })
        .eq('id', context.workflowId);

      if (workflowError) throw workflowError;
    }
  } catch (error) {
    console.error('Failed to trigger escalation workflow:', error);
  }
}

// Store context analysis for learning
async function storeContextAnalysis(supabaseClient: any, context: any, intelligence: any) {
  try {
    const { error } = await supabaseClient
      .from('ai_agent_decisions')
      .insert({
        agent: 'ContextAgent',
        action: `Context analysis: ${context.clientName || 'Unknown client'}`,
        outcome: intelligence.decision.toLowerCase(),
        risk: intelligence.riskLevel.toLowerCase(),
        details: {
          reasoning: intelligence.rationale,
          confidence: intelligence.confidence,
          contextIntelligence: intelligence.contextIntelligence,
          context
        },
        enterprise_id: context.enterpriseId
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to store context analysis:', error);
  }
}

// Helper functions for parsing AI responses
function extractPrimaryEmotion(analysis: string): string {
  const emotions = ['frustrated', 'concerned', 'satisfied', 'urgent', 'calm', 'angry', 'pleased'];
  for (const emotion of emotions) {
    if (analysis.toLowerCase().includes(emotion)) return emotion;
  }
  return 'neutral';
}

function extractUrgencyScore(analysis: string): number {
  const scoreMatch = analysis.match(/urgency[:\s]*(\d+)/i);
  return scoreMatch ? parseInt(scoreMatch[1]) : 50;
}

function extractEmotionalState(analysis: string): string {
  const states = ['calm', 'stressed', 'frustrated', 'satisfied', 'concerned'];
  for (const state of states) {
    if (analysis.toLowerCase().includes(state)) return state;
  }
  return 'neutral';
}

function extractStressIndicators(analysis: string): string[] {
  const indicatorSection = analysis.match(/stress[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);
  return indicatorSection ? indicatorSection[1].split('\n').filter(i => i.trim()) : [];
}

function extractBusinessImpact(analysis: string): string {
  if (analysis.toLowerCase().includes('critical')) return 'critical';
  if (analysis.toLowerCase().includes('high')) return 'high';
  if (analysis.toLowerCase().includes('low')) return 'low';
  return 'medium';
}

function extractCommunicationPattern(analysis: string): string {
  if (analysis.toLowerCase().includes('frequent')) return 'frequent';
  if (analysis.toLowerCase().includes('sparse')) return 'sparse';
  return 'normal';
}

function extractResponseTime(analysis: string): string {
  if (analysis.toLowerCase().includes('slow')) return 'slow';
  if (analysis.toLowerCase().includes('fast')) return 'fast';
  return 'average';
}

function extractEscalationPattern(analysis: string): string {
  if (analysis.toLowerCase().includes('escalating')) return 'escalating';
  if (analysis.toLowerCase().includes('de-escalating')) return 'de-escalating';
  return 'stable';
}

function extractSatisfactionTrend(analysis: string): string {
  if (analysis.toLowerCase().includes('improving')) return 'improving';
  if (analysis.toLowerCase().includes('declining')) return 'declining';
  return 'stable';
}

function extractUrgencyLevel(analysis: string): string {
  if (analysis.toLowerCase().includes('critical')) return 'critical';
  if (analysis.toLowerCase().includes('high')) return 'high';
  if (analysis.toLowerCase().includes('low')) return 'low';
  return 'medium';
}

function extractConfidence(analysis: string): number {
  const confMatch = analysis.match(/confidence[:\s]*([0-9.]+)/i);
  return confMatch ? parseFloat(confMatch[1]) : 0.7;
}

function extractInterventionOpportunities(analysis: string): string[] {
  const interventionSection = analysis.match(/intervention[s]?[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);
  return interventionSection ? interventionSection[1].split('\n').filter(i => i.trim()) : [];
}

function extractRiskMitigation(analysis: string): string[] {
  const mitigationSection = analysis.match(/mitigation[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);
  return mitigationSection ? mitigationSection[1].split('\n').filter(m => m.trim()) : [];
}

function determineContextRisk(emotionAnalysis: any, escalationAnalysis: any): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (escalationAnalysis.needsEscalation || emotionAnalysis.urgencyScore > 80) return 'HIGH';
  if (emotionAnalysis.urgencyScore > 60 || escalationAnalysis.escalationScore > 60) return 'MEDIUM';
  return 'LOW';
}

function calculateEscalationScore(context: any, recentEscalations: number): number {
  let score = 0;
  
  if (context.urgencyLevel === 'critical') score += 40;
  else if (context.urgencyLevel === 'high') score += 25;
  else if (context.urgencyLevel === 'medium') score += 10;
  
  if (context.confidence < 0.5) score += 30;
  else if (context.confidence < 0.7) score += 15;
  
  score += Math.min(recentEscalations * 5, 20);
  
  return Math.min(score, 100);
}

function determineEscalationLevel(context: any, triggers: string[]): string {
  if (triggers.includes('Critical urgency detected')) return 'immediate';
  if (triggers.length > 2) return 'priority';
  if (context.urgencyLevel === 'high') return 'standard';
  return 'normal';
}

function generateProactiveActions(context: any, escalation: any): string[] {
  const actions = [];
  
  if (context.urgencyLevel === 'high' || context.urgencyLevel === 'critical') {
    actions.push('Schedule proactive check-in call');
    actions.push('Prepare detailed status update');
  }
  
  if (escalation.escalationScore > 50) {
    actions.push('Assign dedicated account manager');
  }
  
  if (context.confidence < 0.7) {
    actions.push('Gather additional context before responding');
  }
  
  return actions;
}