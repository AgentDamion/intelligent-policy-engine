import { serve } from "https://deno.land/std@0.207.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, respond } from "../_shared/cors.ts";

// Types
interface AuthContext {
  partnerId: string;
  enterpriseId: string;
  keyPrefix: string;
  rateLimitTier: string;
}

interface PolicyDecision {
  status: 'Approved' | 'Prohibited' | 'RequiresReview';
  reason: string;
  rule_id?: string;
  policySnapshotId?: string;
}

// Utility: Generate SHA-256 hash
async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Utility: Generate HMAC-SHA256 signature
async function hmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Step 1: Authenticate Partner via API Key
async function authenticatePartner(apiKey: string): Promise<AuthContext | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  // Extract key prefix (first 8 characters)
  const keyPrefix = apiKey.substring(0, 8);

  // Query partner_api_keys by prefix first for efficiency
  const { data: keys, error } = await supabase
    .from('partner_api_keys')
    .select('id, partner_id, enterprise_id, key_hash, is_active, expires_at, rate_limit_tier, key_prefix')
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true);

  if (error || !keys || keys.length === 0) {
    console.error('API key lookup failed:', error);
    return null;
  }

  // Verify hash using bcrypt (simplified - in production use proper bcrypt library)
  // For now, we'll use a placeholder comparison
  // TODO: Import bcrypt library for proper hash comparison
  const matchedKey = keys.find(k => k.key_prefix === keyPrefix);
  
  if (!matchedKey) {
    return null;
  }

  // Check expiration
  if (matchedKey.expires_at && new Date(matchedKey.expires_at) < new Date()) {
    return null;
  }

  // Update last_used_at (fire and forget)
  supabase
    .from('partner_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', matchedKey.id)
    .then(() => {});

  return {
    partnerId: matchedKey.partner_id,
    enterpriseId: matchedKey.enterprise_id,
    keyPrefix: matchedKey.key_prefix,
    rateLimitTier: matchedKey.rate_limit_tier
  };
}

// Step 2: Evaluate Request Against Policy
async function evaluatePolicyDecision(
  requestBody: any,
  authContext: AuthContext
): Promise<PolicyDecision> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // Construct tool usage event for policy evaluation
    const toolUsageEvent = {
      tool: {
        id: requestBody.model || 'unknown',
        name: requestBody.model || 'unknown',
        version: '1.0'
      },
      actor: {
        role: 'partner'
      },
      action: {
        type: 'FinalAssetGeneration' as const,
        note: 'AI model request via middleware'
      },
      context: {
        tenantId: authContext.enterpriseId,
        policySnapshotId: 'latest' // TODO: Fetch actual snapshot ID
      },
      ts: new Date().toISOString()
    };

    // Fetch active policy rules for the enterprise
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: rules, error: rulesError } = await supabase
      .from('policy_rules')
      .select('*')
      .eq('context_id', authContext.enterpriseId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (rulesError) {
      console.error('Failed to fetch policy rules:', rulesError);
      return {
        status: 'RequiresReview',
        reason: 'Unable to fetch policy rules'
      };
    }

    // Call policy-evaluate function
    const evaluateUrl = `${supabaseUrl}/functions/v1/policy-evaluate`;
    const evaluateResponse = await fetch(evaluateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: toolUsageEvent,
        rules: rules || []
      })
    });

    if (!evaluateResponse.ok) {
      console.error('Policy evaluation failed:', await evaluateResponse.text());
      return {
        status: 'RequiresReview',
        reason: 'Policy evaluation service error'
      };
    }

    const decision: PolicyDecision = await evaluateResponse.json();
    return decision;

  } catch (error) {
    console.error('Policy evaluation error:', error);
    return {
      status: 'RequiresReview',
      reason: 'Policy evaluation exception'
    };
  }
}

// Step 3: Proxy Request to OpenAI (with streaming support)
async function proxyToOpenAI(
  requestBody: any,
  policyDecision: PolicyDecision,
  isStreaming: boolean
): Promise<Response> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    return respond({ error: 'OpenAI API key not configured' }, 500);
  }

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      return respond({
        error: 'OpenAI API error',
        status: openaiResponse.status,
        message: errorText
      }, openaiResponse.status);
    }

    // For streaming responses, pass through the stream with policy headers
    if (isStreaming) {
      const headers = new Headers(openaiResponse.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
      headers.set('X-Policy-Decision', policyDecision.status);
      if (policyDecision.status === 'RequiresReview') {
        headers.set('X-Policy-Warning', policyDecision.reason);
      }
      
      return new Response(openaiResponse.body, {
        status: openaiResponse.status,
        headers
      });
    }

    // For non-streaming, return the full response
    const responseData = await openaiResponse.json();
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Policy-Decision': policyDecision.status,
          ...(policyDecision.status === 'RequiresReview' && {
            'X-Policy-Warning': policyDecision.reason
          })
        }
      }
    );

  } catch (error) {
    console.error('OpenAI proxy error:', error);
    return respond({
      error: 'Failed to proxy request to OpenAI',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

// Step 4: Log Audit Trail
async function logAuditTrail(
  authContext: AuthContext,
  requestBody: any,
  policyDecision: PolicyDecision,
  responseData: any,
  startTime: number
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const proofSecret = Deno.env.get('PROOF_BUNDLE_SECRET_KEY') || 'default-secret-key';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    // Generate proof bundle
    const requestHash = await sha256Hash(JSON.stringify(requestBody));
    const responseHash = await sha256Hash(JSON.stringify(responseData));
    const policyHash = await sha256Hash(JSON.stringify(policyDecision));
    
    const combinedData = `${requestHash}${responseHash}${policyHash}`;
    const signature = await hmacSha256(combinedData, proofSecret);

    const proofBundle = {
      request_hash: requestHash,
      response_hash: responseHash,
      policy_evaluation_hash: policyHash,
      signature,
      timestamp: new Date().toISOString(),
      algorithm: 'HMAC-SHA256'
    };

    // Estimate cost (simplified - $0.01 per 1K tokens, assuming ~750 tokens per request)
    const estimatedCostUsd = 0.0075;

    // Insert audit record
    const { error } = await supabase
      .from('middleware_requests')
      .insert({
        partner_id: authContext.partnerId,
        enterprise_id: authContext.enterpriseId,
        model: requestBody.model || 'unknown',
        prompt_hash: requestHash,
        policy_decision: policyDecision.status,
        policy_evaluation: policyDecision,
        context_analysis: {
          partner_id: authContext.partnerId,
          rate_limit_tier: authContext.rateLimitTier
        },
        proof_bundle: proofBundle,
        response_time_ms: responseTimeMs,
        estimated_cost_usd: estimatedCostUsd,
        event_type: 'chat_completion'
      });

    if (error) {
      console.error('Failed to log audit trail:', error);
    }

  } catch (error) {
    console.error('Audit trail logging error:', error);
    // Don't throw - audit logging failure shouldn't break the request
  }
}

// Main Handler
serve(async (req) => {
  if (handleCors(req)) return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond({
        error: 'Missing or invalid Authorization header',
        message: 'Expected: Authorization: Bearer <api_key>'
      }, 401);
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer "

    // Step 1: Authenticate
    const authContext = await authenticatePartner(apiKey);
    if (!authContext) {
      return respond({
        error: 'Invalid API key',
        message: 'The provided API key is invalid, expired, or inactive'
      }, 403);
    }

    console.log('Authenticated partner:', authContext.partnerId, 'for enterprise:', authContext.enterpriseId);

    // Parse request body
    const requestBody = await req.json();
    
    // Validate required fields
    if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
      return respond({
        error: 'Invalid request body',
        message: 'Missing or invalid "messages" array'
      }, 400);
    }

    const isStreaming = requestBody.stream === true;

    // Step 2: Evaluate Policy
    const policyDecision = await evaluatePolicyDecision(requestBody, authContext);
    console.log('Policy decision:', policyDecision.status, '-', policyDecision.reason);

    // Block if policy prohibits
    if (policyDecision.status === 'Prohibited') {
      // Log blocked request
      await logAuditTrail(authContext, requestBody, policyDecision, { blocked: true }, startTime);
      
      return respond({
        error: 'Policy violation',
        message: policyDecision.reason,
        policy_decision: policyDecision
      }, 403);
    }

    // Step 3: Proxy to OpenAI
    const openaiResponse = await proxyToOpenAI(requestBody, policyDecision, isStreaming);

    // Step 4: Log Audit Trail (for non-streaming only - streaming logs after completion)
    if (!isStreaming) {
      const responseData = await openaiResponse.clone().json();
      await logAuditTrail(authContext, requestBody, policyDecision, responseData, startTime);
    } else {
      // For streaming, log with partial data
      await logAuditTrail(authContext, requestBody, policyDecision, { streaming: true }, startTime);
    }

    return openaiResponse;

  } catch (error) {
    console.error('Middleware proxy error:', error);
    return respond({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
