import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { tool } from 'ai';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * AICOMPLYR Risk Tools for AI SDK
 *
 * Provides AI SDK tool wrappers for risk assessment operations:
 * 1. assessRiskProfile - Assess tool across 6 dimensions
 * 2. calculateRiskScore - Calculate numeric risk score from telemetry
 * 3. getRiskFactors - Retrieve historical risk factors
 */

// Lazy initialization of Supabase client
let supabaseClient = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key must be configured');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// Load RiskProfileTaxonomyAgent
const RiskProfileTaxonomyAgent = require('../../agents/risk-profile-taxonomy-agent.js');

/**
 * Tool 1: assessRiskProfile
 * Assesses a tool across 6 risk dimensions (NIST AI RMF-inspired)
 */
export const assessRiskProfile = tool({
  name: 'assessRiskProfile',
  description: 'Assesses an AI tool across 6 risk dimensions.',
  parameters: z.object({
    toolName: z.string().describe('Tool name'),
    toolVendor: z.string().optional().describe('Vendor name'),
    toolDataHandling: z.string().optional().describe('How the tool handles data'),
    usage: z.string().optional().describe('How the tool will be used'),
    industry: z.string().optional().describe('Industry context'),
    enterpriseId: z.string().optional().describe('Enterprise ID')
  }),
  execute: async ({ toolName, toolVendor, toolDataHandling, usage, industry, enterpriseId }) => {
    try {
      const toolMetadata = { name: toolName, vendor: toolVendor, dataHandling: toolDataHandling };
      const vendorData = { name: toolVendor, vendor: toolVendor };
      const usageContext = { usage, dataHandling: toolDataHandling, industry };
      
      console.log(`[RISK-TOOLS] Assessing risk profile for tool: ${toolName}`);

      // Instantiate RiskProfileTaxonomyAgent
      const riskAgent = new RiskProfileTaxonomyAgent();

      // Call assessTool method
      const assessment = await riskAgent.assessTool(toolMetadata, vendorData, usageContext);

      console.log(`[RISK-TOOLS] Risk assessment complete: ${assessment.riskProfile.toUpperCase()} (score: ${assessment.aggregateScore})`);
      
      return {
        success: true,
        assessment: {
          toolName: assessment.toolName,
          vendorName: assessment.vendorName,
          riskProfile: assessment.riskProfile,
          aggregateScore: assessment.aggregateScore,
          riskMultiplier: assessment.riskMultiplier,
          dimensionScores: assessment.dimensionScores,
          recommendedControls: assessment.recommendedControls,
          auditRequirements: assessment.auditRequirements,
          rationale: assessment.rationale,
          assessedAt: assessment.assessedAt
        },
        assessedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[RISK-TOOLS] Error assessing risk profile:', error);
      return {
        success: false,
        error: error.message,
        toolMetadata,
        assessedAt: new Date().toISOString()
      };
    }
  }
});

/**
 * Tool 2: calculateRiskScore
 * Calculates numeric risk score from telemetry atoms
 */
export const calculateRiskScore = tool({
  name: 'calculateRiskScore',
  description: 'Calculates a numeric risk score (0-100) from telemetry atoms.',
  parameters: z.object({
    atoms: z.array(z.object({
      timestamp: z.string().describe('Event timestamp'),
      event_type: z.string().describe('Type of event'),
      severity: z.string().optional().describe('Event severity'),
      tool_id: z.string().optional().describe('Tool ID'),
      metadata: z.record(z.any()).optional().describe('Additional metadata')
    })).describe('Array of telemetry atoms'),
    timeWindow: z.string().optional().describe('Time window for analysis'),
    region: z.string().optional().describe('Region for regional weighting'),
    toolId: z.string().optional().describe('Tool ID to filter by')
  }),
  execute: async ({ atoms, timeWindow = '24h', region = 'US', toolId }) => {
    try {
      console.log(`[RISK-TOOLS] Calculating risk score for ${atoms.length} telemetry atoms`);

      // Call orchestrator-score-risk Supabase function
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('orchestrator-score-risk', {
        body: {
          atoms,
          options: {
            timeWindow,
            region,
            toolId
          }
        }
      });

      if (error) {
        throw new Error(`Failed to calculate risk score: ${error.message}`);
      }

      console.log(`[RISK-TOOLS] Risk score calculated: ${data.total} (${data.riskLevel})`);
      
      return {
        success: true,
        riskScore: {
          total: data.total,
          breakdown: data.breakdown,
          riskLevel: data.riskLevel,
          factors: data.factors,
          recommendations: data.recommendations,
          metadata: data.metadata
        },
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[RISK-TOOLS] Error calculating risk score:', error);
      return {
        success: false,
        error: error.message,
        atomsCount: atoms.length,
        calculatedAt: new Date().toISOString()
      };
    }
  }
});

/**
 * Tool 3: getRiskFactors
 * Retrieves historical risk factors for a tool/vendor
 */
export const getRiskFactors = tool({
  name: 'getRiskFactors',
  description: 'Retrieves historical risk factors for a tool or vendor.',
  parameters: z.object({
    toolId: z.string().optional().describe('Tool ID'),
    vendorId: z.string().optional().describe('Vendor ID'),
    enterpriseId: z.string().optional().describe('Enterprise ID'),
    limit: z.number().optional().default(50).describe('Limit')
  }),
  execute: async ({ toolId, vendorId, enterpriseId, limit = 50 }) => {
    try {
      console.log(`[RISK-TOOLS] Retrieving risk factors for tool: ${toolId || 'N/A'}, vendor: ${vendorId || 'N/A'}`);

      // Try to call get-risk-factors Supabase function if available
      const supabase = getSupabaseClient();
      try {
        const { data, error } = await supabase.functions.invoke('get-risk-factors', {
          body: {
            toolId,
            vendorId,
            enterpriseId,
            timeRange,
            limit
          }
        });

        if (!error && data) {
          return {
            success: true,
            riskFactors: data,
            retrievedAt: new Date().toISOString()
          };
        }
      } catch (funcError) {
        console.warn('[RISK-TOOLS] get-risk-factors function not available, querying database directly');
      }

      // Fallback: Query risk_scores table directly
      let query = supabase
        .from('risk_scores')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false });

      if (toolId) {
        query = query.eq('tool_id', toolId);
      }

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      if (enterpriseId) {
        query = query.eq('enterprise_id', enterpriseId);
      }

      if (timeRange) {
        query = query.gte('created_at', timeRange.start).lte('created_at', timeRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to retrieve risk factors: ${error.message}`);
      }

      // Also query agent_activities for risk-related events
      let activityQuery = supabase
        .from('agent_activities')
        .select('*')
        .eq('agent', 'orchestrator')
        .eq('action', 'score-risk')
        .limit(limit)
        .order('created_at', { ascending: false });

      if (toolId) {
        activityQuery = activityQuery.contains('details', { toolId });
      }

      const { data: activities } = await activityQuery;

      console.log(`[RISK-TOOLS] Retrieved ${data.length} risk scores and ${activities?.length || 0} risk activities`);
      
      return {
        success: true,
        riskFactors: {
          riskScores: data || [],
          riskActivities: activities || [],
          toolId,
          vendorId,
          enterpriseId,
          timeRange
        },
        retrievedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[RISK-TOOLS] Error retrieving risk factors:', error);
      return {
        success: false,
        error: error.message,
        toolId,
        vendorId,
        retrievedAt: new Date().toISOString()
      };
    }
  }
});

// Add names to tools for internal identification
assessRiskProfile.name = 'assessRiskProfile';
calculateRiskScore.name = 'calculateRiskScore';
getRiskFactors.name = 'getRiskFactors';

/**
 * Export all risk tools as an array for easy integration
 */
export const riskTools = [
  assessRiskProfile,
  calculateRiskScore,
  getRiskFactors
];
