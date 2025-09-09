// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-key',
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

interface ActivityData {
  agent: string;
  action: string;
  status: 'success' | 'warning' | 'error' | 'running';
  project_id?: string | null;
  workspace_id?: string | null;
  enterprise_id?: string | null;
  details?: Record<string, unknown>;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple X-Agent-Key verification for backward compatibility
    const agentKey = req.headers.get('X-Agent-Key');
    const expectedKey = Deno.env.get('AGENT_INGEST_KEY');
    
    if (!agentKey || agentKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid agent key' }),
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

    // Parse request body
    const activity: ActivityData = await req.json();

    // Validate project if project_id is provided
    let validatedProject: Project | null = null;
    if (activity.project_id) {
      const projectValidation = await validateProject(supabase, activity.project_id);
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

    // Prepare activity data with project context
    const activityData: ActivityData = {
      agent: activity.agent || 'Unknown Agent',
      action: activity.action || 'Unknown Action',
      status: activity.status || 'success',
      project_id: activity.project_id || null,
      workspace_id: activity.workspace_id || null,
      enterprise_id: activity.enterprise_id || validatedProject?.organization_id || null,
      details: activity.details || {}
    };

    // Insert activity
    const { data, error } = await supabase
      .from('agent_activities')
      .insert([activityData])
      .select()
      .single();

    if (error) {
      console.error('Error inserting activity:', error);
      throw new Error(`Failed to insert activity: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: data,
      project_context: validatedProject ? {
        project_id: validatedProject.id,
        project_name: validatedProject.name,
        organization_id: validatedProject.organization_id
      } : null,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    // Note: For immediate integration, caller should use compliance_check_agent_activity

  } catch (error) {
    console.error('Error in ingest_agent_activity function:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
