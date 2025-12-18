import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AgentRegistry } from "./agents/cursor-agent-registry.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's auth
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        persistSession: false,
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body - support both legacy (query) and new (agentName/action) formats
    const body = await req.json();
    const { query, agentName, action, input, context } = body;
    
    // Determine if this is legacy query-based or new agent-based request
    const isAgentRequest = agentName && action;
    
    if (!isAgentRequest && (!query || typeof query !== 'string')) {
      throw new Error('Either query (legacy) or agentName+action (new) is required');
    }

    console.log('Request received:', { 
      userId: user.id,
      mode: isAgentRequest ? 'agent-based' : 'legacy-query',
      agentName: agentName || 'legacy',
      action: action || 'query',
      inputSize: input ? JSON.stringify(input).length : query?.length || 0
    });

    // Get user's workspace context
    const { data: workspaceMembers } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const workspaceId = workspaceMembers?.workspace_id;

    // Get workspace's enterprise
    let enterpriseId = null;
    if (workspaceId) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('enterprise_id')
        .eq('id', workspaceId)
        .single();
      enterpriseId = workspace?.enterprise_id;
    }

    // Initialize agent registry
    const agentRegistry = new AgentRegistry(supabase);

    let result: any;
    let agentResponse: string;
    let processingTimeMs: number;

    if (isAgentRequest) {
      // NEW: Agent-based request (boundary governance)
      console.log(`Processing agent request: ${agentName}.${action}`);
      
      const startTime = Date.now();
      
      // Get agent from registry
      const agent = agentRegistry.getAgent(agentName);
      
      // Enhance context with workspace/enterprise info
      const enhancedContext = {
        ...context,
        workspaceId,
        enterpriseId,
        userId: user.id,
        userEmail: user.email
      };
      
      // Process request through agent
      result = await agent.process(input, enhancedContext);
      processingTimeMs = Date.now() - startTime;
      
      // Format response based on agent type
      if (agentName === 'policy') {
        agentResponse = `Policy evaluation complete: ${result.decision.toUpperCase()}. ${result.reasons.join('. ')}`;
      } else if (agentName === 'context') {
        agentResponse = `Context analysis complete: Risk score ${result.risk_score}/100, Complexity: ${result.complexity_level}, Sensitivity: ${result.data_sensitivity}`;
      } else if (agentName === 'audit') {
        agentResponse = `Proof bundle generated: ${result.proof_bundle.bundle_id}. Cryptographic signature: ${result.proof_bundle.hmac_signature.substring(0, 16)}...`;
      } else {
        agentResponse = JSON.stringify(result);
      }
      
      console.log(`Agent ${agentName} processed in ${processingTimeMs}ms`);
      
    } else {
      // LEGACY: Query-based request (chat interface)
      console.log('Processing legacy query request');
      
      const startTime = Date.now();
      agentResponse = generateAgentResponse(query, context);
      processingTimeMs = Date.now() - startTime;
      result = { response: agentResponse };
    }

    // Log user activity
    const { data: userActivity, error: activityError } = await supabase
      .from('agent_activities')
      .insert({
        agent: isAgentRequest ? agentName : 'user',
        action: isAgentRequest ? action : 'question_asked',
        status: 'complete',
        details: {
          reasoning: isAgentRequest ? undefined : query,
          input: isAgentRequest ? input : undefined,
          result: isAgentRequest ? result : undefined,
          context: {
            threadId: context?.threadId,
            policySnapshotId: context?.policySnapshotId,
            policy_snapshot_id: context?.policySnapshotId,
            userId: user.id,
            userEmail: user.email,
            mode: isAgentRequest ? 'agent-based' : 'legacy-query'
          },
          metadata: {
            processing_time_ms: processingTimeMs,
            timestamp: new Date().toISOString(),
          }
        },
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
      })
      .select()
      .single();

    if (activityError) {
      console.error('Error creating activity:', activityError);
      // Don't throw - continue processing
    }

    // Create agent activity record for agent response
    const { data: agentActivity, error: agentResponseError } = await supabase
      .from('agent_activities')
      .insert({
        agent: 'cursor_ai',
        action: 'question_answered',
        status: 'complete',
        details: {
          reasoning: agentResponse,
          context: {
            threadId: context?.threadId,
            policySnapshotId: context?.policySnapshotId,
            policy_snapshot_id: context?.policySnapshotId,
            inResponseTo: userActivity.id,
          },
          metadata: {
            response_length: agentResponse.length,
            processing_time_ms: 100,
            timestamp: new Date().toISOString(),
          }
        },
        workspace_id: workspaceId,
        enterprise_id: enterpriseId,
      })
      .select()
      .single();

    if (agentResponseError) {
      console.error('Error creating agent response activity:', agentResponseError);
      throw agentResponseError;
    }

    console.log('Agent response activity created:', agentActivity.id);

    if (!isAgentRequest && context?.threadId) {
      // Legacy: Write to chat_messages for ACChatWidget
      const suggestedActions = extractSuggestedActions(agentResponse, context);

      const { data: chatMessage, error: chatError } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: context?.threadId,
          role: 'assistant',
          content: agentResponse,
          actions: suggestedActions,
          metadata: {
            agent_activity_id: userActivity?.id,
            agent: 'cursor_ai',
            action: 'question_answered',
            status: 'complete',
            processing_time_ms: processingTimeMs,
            synced_at: new Date().toISOString()
          },
          workspace_id: workspaceId,
          enterprise_id: enterpriseId
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error writing to chat_messages:', chatError);
      } else {
        chatMessageId = chatMessage.id;
        console.log('Chat message created:', chatMessage.id);
      }
    }

    // Return response
    if (isAgentRequest) {
      // New format: Return structured result
      return new Response(
        JSON.stringify({ 
          success: true,
          result: result,
          confidence: result.confidence || 1.0,
          metadata: {
            agent: agentName,
            action: action,
            processing_time_ms: processingTimeMs,
            activity_id: userActivity?.id
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      // Legacy format: Return chat-style response
      return new Response(
        JSON.stringify({ 
          success: true,
          userActivityId: userActivity?.id,
          chatMessageId: chatMessageId,
          response: agentResponse,
          message: 'Query processed successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error('Error in cursor-agent-adapter:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});

/**
 * Extract suggested actions from agent response
 * TODO: Enhance to parse structured actions from AI response
 */
function extractSuggestedActions(response: string, context: any): any[] {
  const actions: any[] = [];
  
  // Extract actions based on response content
  if (response.toLowerCase().includes('view details') || response.toLowerCase().includes('view') && response.toLowerCase().includes('policy')) {
    actions.push({
      id: `action-${Date.now()}-1`,
      label: 'View Details',
      action_type: 'navigate',
      target: `/spine/${context?.policySnapshotId || context?.threadId}`,
      priority: 'medium',
      context: { source: 'agent_suggestion' }
    });
  }
  
  if (response.toLowerCase().includes('evidence') || response.toLowerCase().includes('proof')) {
    actions.push({
      id: `action-${Date.now()}-2`,
      label: 'View Evidence Bundle',
      action_type: 'modal',
      target: 'evidence-modal',
      priority: 'high',
      context: { 
        threadId: context?.threadId,
        type: 'evidence_bundle'
      }
    });
  }
  
  if (response.toLowerCase().includes('export') || response.toLowerCase().includes('download')) {
    actions.push({
      id: `action-${Date.now()}-3`,
      label: 'Export Report',
      action_type: 'download',
      target: `/api/export/${context?.threadId}`,
      priority: 'low',
      context: { format: 'pdf' }
    });
  }
  
  return actions;
}

/**
 * Generate agent response based on query and context
 * TODO: Replace with actual AI agent coordination
 */
function generateAgentResponse(query: string, context: any): string {
  const lowerQuery = query.toLowerCase();
  
  // Pattern matching for common questions
  if (lowerQuery.includes('policy') || lowerQuery.includes('compliance')) {
    return `Analyzing policy compliance context for thread ${context?.threadId || 'unknown'}. Based on the current policy framework, I've identified relevant controls and requirements. Let me break down the compliance considerations...`;
  }
  
  if (lowerQuery.includes('risk') || lowerQuery.includes('security')) {
    return `Evaluating risk profile and security implications. Cross-referencing with existing risk assessments and control frameworks. The current risk band appears to be within acceptable parameters, but I recommend reviewing the following controls...`;
  }
  
  if (lowerQuery.includes('evidence') || lowerQuery.includes('proof')) {
    return `Gathering evidence and proof artifacts related to your inquiry. I've identified ${Math.floor(Math.random() * 20) + 5} relevant evidence items in the system. These include audit logs, policy snapshots, and compliance records that support the decision trail...`;
  }
  
  if (lowerQuery.includes('workflow') || lowerQuery.includes('approval')) {
    return `Reviewing workflow status and approval chains. The current stage requires validation from compliance and technical reviewers. Based on historical patterns, estimated completion time is 24-48 hours...`;
  }
  
  // Default response
  return `Thank you for your question. I'm processing your inquiry about "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}". Based on the available context and policy framework, I can help you understand the governance implications and provide relevant guidance. Would you like me to dive deeper into any specific aspect?`;
}
