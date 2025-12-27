import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AgentRegistry } from "./agents/cursor-agent-registry.ts";
import { 
  detectPromptInjection, 
  type InjectionDetectionResult 
} from "./guards/prompt-injection-guard.ts";
import {
  createAgentAuthorityValidator,
  type AuthorityContext,
  type AuthorityValidationResult,
} from "./guards/agent-authority-validator.ts";
import {
  createToolMisuseDetector,
  detectToolMisuse,
  type MisuseDetectionResult,
} from "./guards/tool-misuse-detector.ts";

// Global tool misuse detector (singleton for session tracking)
const toolMisuseDetector = createToolMisuseDetector();

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

    // === SECURITY CHECK: Prompt Injection Detection ===
    const inputToCheck = isAgentRequest 
      ? (typeof input === 'string' ? input : JSON.stringify(input))
      : query;
    
    const injectionResult = detectPromptInjection(inputToCheck);
    
    if (injectionResult.detected && injectionResult.riskLevel !== 'low') {
      console.warn('⚠️ Prompt injection detected:', {
        category: injectionResult.category,
        confidence: injectionResult.confidence,
        riskLevel: injectionResult.riskLevel,
        pattern: injectionResult.pattern,
        matchedText: injectionResult.matchedText?.substring(0, 100)
      });

      // Log security event to agent_activities (before we have workspace context)
      // This is a best-effort log - we'll try to get context later
      const securityLogClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!
      );

      await securityLogClient.from('agent_activities').insert({
        agent: 'SecurityGuard',
        action: 'prompt_injection_detected',
        status: injectionResult.riskLevel === 'critical' || injectionResult.riskLevel === 'high' 
          ? 'blocked' 
          : 'flagged',
        severity: injectionResult.riskLevel,
        details: {
          category: injectionResult.category,
          confidence: injectionResult.confidence,
          riskLevel: injectionResult.riskLevel,
          pattern: injectionResult.pattern,
          matchedText: injectionResult.matchedText,
          inputPreview: inputToCheck.substring(0, 200),
          requestType: isAgentRequest ? 'agent' : 'legacy',
          agentName: agentName || 'legacy',
          action: action || 'query',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        }
      }).then(({ error }) => {
        if (error) console.error('Failed to log security event:', error);
      });

      // Block critical and high-risk injections
      if (injectionResult.riskLevel === 'critical' || injectionResult.riskLevel === 'high') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request blocked by security policy',
          code: 'SECURITY_VIOLATION',
          details: {
            reason: 'Potential prompt injection detected',
            category: injectionResult.category,
            riskLevel: injectionResult.riskLevel
          }
        }), { 
          status: 403, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      }
      
      // For medium risk, we continue but log the warning
      console.warn('⚠️ Medium-risk injection detected but allowing request to proceed with monitoring');
    }
    // === END SECURITY CHECK ===

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

    // === SECURITY CHECK: Agent Authority Validation ===
    const authorityValidator = createAgentAuthorityValidator(supabase);
    let authorityContext: AuthorityContext | null = null;

    // Build authority context for the authenticated user
    authorityContext = await authorityValidator.buildAuthorityContext(user.id);
    
    if (!authorityContext) {
      console.warn('⚠️ Failed to build authority context for user:', user.id);
      // Allow request to continue but log the issue - user might be new or have no enterprise
    } else {
      // Extract any tenant IDs from the input for validation
      const extractedIds = authorityValidator.extractTenantIds(input || {});
      
      // Validate enterprise access if enterprise IDs are present in input
      for (const requestedEnterpriseId of extractedIds.enterpriseIds) {
        const enterpriseValidation = authorityValidator.validateEnterpriseAccess(
          authorityContext,
          requestedEnterpriseId
        );
        
        if (!enterpriseValidation.authorized) {
          console.error('🚫 Cross-tenant access attempt blocked:', {
            userId: user.id,
            requestedEnterprise: requestedEnterpriseId,
            authorizedEnterprise: authorityContext.authenticatedEnterpriseId,
            violation: enterpriseValidation.violation
          });

          // Log security violation
          const securityLogClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!
          );

          await securityLogClient.from('agent_activities').insert({
            agent: 'SecurityGuard',
            action: 'cross_tenant_access_blocked',
            status: 'blocked',
            severity: 'critical',
            details: {
              violation_type: enterpriseValidation.violation?.type,
              requested_resource: enterpriseValidation.violation?.requestedResource,
              authorized_scope: enterpriseValidation.violation?.authorizedScope,
              reason: enterpriseValidation.reason,
              userId: user.id,
              userEmail: user.email,
              agentName: agentName || 'legacy',
              action: action || 'query',
              timestamp: new Date().toISOString()
            },
            enterprise_id: authorityContext.authenticatedEnterpriseId
          });

          return new Response(JSON.stringify({
            success: false,
            error: 'Access denied',
            code: 'CROSS_TENANT_VIOLATION',
            details: {
              reason: 'You do not have access to the requested resource',
            }
          }), { 
            status: 403, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          });
        }
      }

      // Validate workspace access if workspace IDs are present in input
      for (const requestedWorkspaceId of extractedIds.workspaceIds) {
        const workspaceValidation = authorityValidator.validateWorkspaceAccess(
          authorityContext,
          requestedWorkspaceId
        );
        
        if (!workspaceValidation.authorized) {
          console.error('🚫 Unauthorized workspace access attempt blocked:', {
            userId: user.id,
            requestedWorkspace: requestedWorkspaceId,
            authorizedWorkspaces: authorityContext.authenticatedWorkspaceIds,
            violation: workspaceValidation.violation
          });

          // Log security violation
          const securityLogClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!
          );

          await securityLogClient.from('agent_activities').insert({
            agent: 'SecurityGuard',
            action: 'unauthorized_workspace_access_blocked',
            status: 'blocked',
            severity: 'critical',
            details: {
              violation_type: workspaceValidation.violation?.type,
              requested_resource: workspaceValidation.violation?.requestedResource,
              authorized_scope: workspaceValidation.violation?.authorizedScope,
              reason: workspaceValidation.reason,
              userId: user.id,
              userEmail: user.email,
              agentName: agentName || 'legacy',
              action: action || 'query',
              timestamp: new Date().toISOString()
            },
            enterprise_id: authorityContext.authenticatedEnterpriseId
          });

          return new Response(JSON.stringify({
            success: false,
            error: 'Access denied',
            code: 'UNAUTHORIZED_WORKSPACE',
            details: {
              reason: 'You do not have access to the requested workspace',
            }
          }), { 
            status: 403, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          });
        }
      }
    }
    // === END AUTHORITY VALIDATION ===

    let result: any;
    let agentResponse: string;
    let processingTimeMs: number;
    let misuseResult: MisuseDetectionResult | null = null;

    if (isAgentRequest) {
      // NEW: Agent-based request (boundary governance)
      console.log(`Processing agent request: ${agentName}.${action}`);
      
      // === TOOL MISUSE DETECTION ===
      const sessionId = `${user.id}:${Date.now().toString(36)}`;
      const toolName = `${agentName}:${action}`;
      
      misuseResult = detectToolMisuse(
        toolMisuseDetector,
        sessionId,
        toolName,
        input as Record<string, unknown> || {},
        enterpriseId || 'unknown',
        workspaceId || undefined,
        true // Assume success initially, will update if fails
      );

      if (misuseResult.detected) {
        console.warn('⚠️ Tool misuse pattern detected:', {
          type: misuseResult.misuseType,
          confidence: misuseResult.confidence,
          severity: misuseResult.severity,
          details: misuseResult.details,
          recommendation: misuseResult.recommendation
        });

        // Log the detection
        const securityLogClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!
        );

        await securityLogClient.from('agent_activities').insert({
          agent: 'SecurityGuard',
          action: 'tool_misuse_detected',
          status: misuseResult.recommendation === 'block' || misuseResult.recommendation === 'terminate' 
            ? 'blocked' 
            : 'flagged',
          severity: misuseResult.severity,
          details: {
            misuse_type: misuseResult.misuseType,
            confidence: misuseResult.confidence,
            severity: misuseResult.severity,
            details: misuseResult.details,
            recommendation: misuseResult.recommendation,
            tool_name: toolName,
            session_stats: toolMisuseDetector.getSessionStats(sessionId),
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString()
          },
          enterprise_id: enterpriseId
        });

        // Block or terminate based on recommendation
        if (misuseResult.recommendation === 'block' || misuseResult.recommendation === 'terminate') {
          // Clear the session if terminating
          if (misuseResult.recommendation === 'terminate') {
            toolMisuseDetector.clearSession(sessionId);
          }

          return new Response(JSON.stringify({
            success: false,
            error: 'Request blocked by security policy',
            code: 'TOOL_MISUSE_DETECTED',
            details: {
              reason: misuseResult.details,
              type: misuseResult.misuseType,
              severity: misuseResult.severity
            }
          }), { 
            status: 403, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          });
        }
        
        // For warn, continue but log
        console.warn('⚠️ Allowing request with misuse warning');
      }
      // === END TOOL MISUSE DETECTION ===

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
    let userActivity: any = null;
    try {
      const { data, error: activityError } = await supabase
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
        .select();

      if (activityError) {
        console.error('Error creating activity:', JSON.stringify(activityError, null, 2));
        console.error('Error details:', {
          message: activityError.message,
          code: activityError.code,
          details: activityError.details,
          hint: activityError.hint
        });
        // Don't throw - continue processing
      } else if (data && data.length > 0) {
        userActivity = data[0];
      } else {
        console.warn('Activity insert succeeded but returned no data');
      }
    } catch (err) {
      console.error('Exception creating activity:', err);
      // Don't throw - continue processing
    }

    // Create agent activity record for agent response
    let agentActivity: any = null;
    try {
      const { data, error: agentResponseError } = await supabase
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
              inResponseTo: userActivity?.id,
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
        .select();

      if (agentResponseError) {
        console.error('Error creating agent response activity:', JSON.stringify(agentResponseError, null, 2));
        console.error('Error details:', {
          message: agentResponseError.message,
          code: agentResponseError.code,
          details: agentResponseError.details,
          hint: agentResponseError.hint
        });
        // Don't throw - logging failure shouldn't break the response
      } else if (data && data.length > 0) {
        agentActivity = data[0];
        console.log('Agent response activity created:', agentActivity.id);
      } else {
        console.warn('Agent response activity insert succeeded but returned no data');
      }
    } catch (err) {
      console.error('Exception creating agent response activity:', err);
      // Don't throw - logging failure shouldn't break the response
    }

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
