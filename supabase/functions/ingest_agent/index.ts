// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Define proper types
interface Project {
  id: string;
  name: string;
  organization_id: string;
  status: string;
}

interface ProjectValidationResult {
  valid: boolean;
  project?: Project;
  error?: string;
}

interface AgentActivity {
  agent: string;
  action: string;
  status: 'success' | 'warning' | 'error' | 'running';
  project_id?: string;
  workspace_id?: string;
  enterprise_id?: string;
  details?: Record<string, unknown>;
}

interface AgentDecision {
  agent: string;
  action: string;
  agency?: string;
  outcome: 'approved' | 'rejected' | 'flagged';
  risk?: 'low' | 'medium' | 'high';
  project_id?: string;
  enterprise_id?: string;
  details?: Record<string, unknown>;
}

interface BatchIngestRequest {
  project_id?: string;
  activities?: AgentActivity[];
  decisions?: AgentDecision[];
}

// HMAC signature verification
async function verifySignature(body: string, signature: string): Promise<boolean> {
  const key = Deno.env.get('AGENT_INGEST_KEY');
  if (!key || !signature) return false;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const bodyData = encoder.encode(body);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === `sha256=${expectedHex}`;
}

// Function to validate project exists
async function validateProject(supabase: SupabaseClient, projectId: string): Promise<ProjectValidationResult> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name, organization_id, status')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error validating project:', error);
      return { valid: false, error: `Project validation failed: ${error.message}` };
    }

    if (!project) {
      return { valid: false, error: `Project with ID ${projectId} not found` };
    }

    if (project.status !== 'active') {
      return { valid: false, error: `Project ${project.name} is not active (status: ${project.status})` };
    }

    return { valid: true, project };
  } catch (error) {
    console.error('Error validating project:', error);
    return { valid: false, error: `Project validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Input validation schemas
const AgentActivitySchema = z.object({
  agent: z.string().min(1).max(100),
  action: z.string().min(1).max(500),
  status: z.enum(['success', 'warning', 'error', 'running']),
  project_id: z.string().uuid().optional(),
  workspace_id: z.string().uuid().optional(),
  enterprise_id: z.string().uuid().optional(),
  details: z.record(z.unknown()).optional()
});

const AgentDecisionSchema = z.object({
  agent: z.string().min(1).max(100),
  action: z.string().min(1).max(500),
  agency: z.string().min(1).max(100).optional(),
  outcome: z.enum(['approved', 'rejected', 'flagged']),
  risk: z.enum(['low', 'medium', 'high']).optional(),
  project_id: z.string().uuid().optional(),
  enterprise_id: z.string().uuid().optional(),
  details: z.record(z.unknown()).optional()
});

const BatchIngestSchema = z.object({
  project_id: z.string().uuid().optional(),
  activities: z.array(AgentActivitySchema).optional(),
  decisions: z.array(AgentDecisionSchema).optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify HMAC signature for security
    const signature = req.headers.get('X-Agent-Signature');
    const bodyText = await req.text();
    
    if (!await verifySignature(bodyText, signature || '')) {
      console.error('Invalid or missing signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const body: BatchIngestRequest = JSON.parse(bodyText);
    const { project_id: globalProjectId, activities = [], decisions = [] } = BatchIngestSchema.parse(body);

    console.log(`Ingesting ${activities.length} activities and ${decisions.length} decisions`);

    // Validate project if project_id is provided
    let validatedProject: Project | null = null;
    if (globalProjectId) {
      const projectValidation = await validateProject(supabase, globalProjectId);
      if (!projectValidation.valid) {
        return new Response(
          JSON.stringify({ 
            error: 'Project validation failed', 
            details: projectValidation.error 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      validatedProject = projectValidation.project || null;
      console.log(`Validated project: ${validatedProject?.name} (${validatedProject?.id})`);
    }

    // Check if any individual activities or decisions have project_id
    const hasIndividualProjectIds = activities.some(a => a.project_id) || decisions.some(d => d.project_id);
    
    if (hasIndividualProjectIds) {
      // Validate all individual project_ids
      const allProjectIds = [
        ...new Set([
          ...activities.map(a => a.project_id).filter(Boolean),
          ...decisions.map(d => d.project_id).filter(Boolean)
        ])
      ];

      for (const projectId of allProjectIds) {
        if (projectId) {
          const projectValidation = await validateProject(supabase, projectId);
          if (!projectValidation.valid) {
            return new Response(
              JSON.stringify({ 
                error: 'Project validation failed', 
                details: `Activity/Decision project validation failed: ${projectValidation.error}` 
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // Enrich activities and decisions with project context
    const enrichedActivities: AgentActivity[] = activities.map(activity => {
      const projectId = activity.project_id || globalProjectId;
      return {
        ...activity,
        project_id: projectId,
        enterprise_id: activity.enterprise_id || validatedProject?.organization_id
      };
    });

    const enrichedDecisions: AgentDecision[] = decisions.map(decision => {
      const projectId = decision.project_id || globalProjectId;
      return {
        ...decision,
        project_id: projectId,
        enterprise_id: decision.enterprise_id || validatedProject?.organization_id
      };
    });

    let activitiesInserted = 0;
    let decisionsInserted = 0;

    // Insert agent activities
    if (enrichedActivities.length > 0) {
      const { error: activitiesError, count } = await supabase
        .from('agent_activities')
        .insert(enrichedActivities)
        .select('*', { count: 'exact' });

      if (activitiesError) {
        console.error('Error inserting activities:', activitiesError);
        throw new Error(`Failed to insert activities: ${activitiesError.message}`);
      }

      activitiesInserted = count || 0;
    }

    // Insert AI agent decisions
    if (enrichedDecisions.length > 0) {
      const { error: decisionsError, count } = await supabase
        .from('ai_agent_decisions')
        .insert(enrichedDecisions)
        .select('*', { count: 'exact' });

      if (decisionsError) {
        console.error('Error inserting decisions:', decisionsError);
        throw new Error(`Failed to insert decisions: ${decisionsError.message}`);
      }

      decisionsInserted = count || 0;
    }

    const response = {
      success: true,
      ingested: {
        activities: activitiesInserted,
        decisions: decisionsInserted
      },
      project_context: validatedProject ? {
        project_id: validatedProject.id,
        project_name: validatedProject.name,
        organization_id: validatedProject.organization_id
      } : null,
      timestamp: new Date().toISOString()
    };

    // Optional immediate platform integration trigger
    const trigger = req.headers.get('x-trigger-integration') === 'true'
    if (trigger && activitiesInserted > 0) {
      try {
        const orgId = validatedProject?.organization_id
        if (orgId) {
          await fetch(`${supabaseUrl!.replace(/\/$/, '')}/functions/v1/platform-universal/integrate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-org-id': orgId },
            body: JSON.stringify({ async: true, priority: 5 })
          })
        }
      } catch {}
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ingest_agent function:', error);
    
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof z.ZodError ? error.errors : undefined
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
