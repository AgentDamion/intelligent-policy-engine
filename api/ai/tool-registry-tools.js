import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { tool } from 'ai';

/**
 * AICOMPLYR Tool Registry Tools for AI SDK
 *
 * Provides AI SDK tool wrappers for tool registry operations:
 * 1. verifyToolIdentity - Verify tool exists in registry
 * 2. verifyToolVersion - Verify version exists and matches constraints
 * 3. checkToolMetadataCompleteness - Validate metadata completeness
 * 4. getToolConstraints - Retrieve recorded constraints from approvals
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

/**
 * Tool 1: verifyToolIdentity
 * Verifies that a tool exists in the registry and matches the provided name/provider
 */
export const verifyToolIdentity = tool({
  name: 'verifyToolIdentity',
  description: 'Verifies that a tool exists in the registry.',
  parameters: z.object({
    toolName: z.string().describe('The name of the tool'),
    provider: z.string().describe('The provider name'),
    enterpriseId: z.string().optional().describe('Enterprise ID')
  }),
  execute: async ({ toolName, provider, enterpriseId }) => {
    try {
      console.log(`[TOOL-REGISTRY-TOOLS] Verifying tool identity: ${toolName} by ${provider}`);

      // Strip common provider prefixes if tool name starts with provider
      let cleanToolName = toolName;
      if (toolName.toLowerCase().startsWith(provider.toLowerCase() + '-')) {
        cleanToolName = toolName.substring(provider.length + 1);
        console.log(`[TOOL-REGISTRY-TOOLS] Stripped prefix: ${toolName} -> ${cleanToolName}`);
      }

      const supabase = getSupabaseClient();
      
      // Query ai_tool_registry for match
      const { data: tools, error } = await supabase
        .from('ai_tool_registry')
        .select('*')
        .or(`name.ilike.${toolName},name.ilike.${cleanToolName}`)
        .ilike('provider', provider)
        .limit(1);

      if (error) {
        throw new Error(`Failed to query tool registry: ${error.message}`);
      }

      if (!tools || tools.length === 0) {
        // Try fuzzy search as fallback
        const { data: fuzzyResults } = await supabase
          .rpc('fuzzy_tool_search', {
            search_term: toolName,
            enterprise_id: enterpriseId || null
          });

        const violations = [{
          field: 'tool_identity',
          reason: `Tool "${toolName}" by provider "${provider}" not found in registry`,
          severity: 'error'
        }];

        if (fuzzyResults && fuzzyResults.length > 0) {
          violations.push({
            field: 'suggestions',
            reason: 'Similar tools found',
            suggestions: fuzzyResults.slice(0, 3).map(r => ({
              name: r.tool_name,
              provider: r.category,
              similarity: r.similarity_score
            }))
          });
        }

        return {
          verified: false,
          toolId: null,
          toolMetadata: null,
          violations
        };
      }

      const tool = tools[0];

      // Verify match (allowing for stripped names)
      const nameMatch = tool.name.toLowerCase() === toolName.toLowerCase() || 
                        (typeof cleanToolName !== 'undefined' && tool.name.toLowerCase() === cleanToolName.toLowerCase());
      const providerMatch = tool.provider.toLowerCase() === provider.toLowerCase();

      if (!nameMatch || !providerMatch) {
        return {
          verified: false,
          toolId: tool.id,
          toolMetadata: tool,
          violations: [
            {
              field: nameMatch ? 'provider' : 'name',
              reason: nameMatch 
                ? `Provider mismatch: expected "${provider}", found "${tool.provider}"`
                : `Name mismatch: expected "${toolName}", found "${tool.name}"`,
              severity: 'error'
            }
          ]
        };
      }

      console.log(`[TOOL-REGISTRY-TOOLS] Tool identity verified: ${tool.id}`);
      
      return {
        verified: true,
        toolId: tool.id,
        toolMetadata: {
          id: tool.id,
          name: tool.name,
          provider: tool.provider,
          category: tool.category,
          risk_tier: tool.risk_tier || 'MEDIUM',
          deployment_status: tool.deployment_status || 'draft',
          created_at: tool.created_at
        },
        violations: []
      };
    } catch (error) {
      console.error('[TOOL-REGISTRY-TOOLS] Error verifying tool identity:', error);
      return {
        verified: false,
        toolId: null,
        toolMetadata: null,
        violations: [{
          field: 'system_error',
          reason: error.message,
          severity: 'error'
        }]
      };
    }
  }
});

/**
 * Tool 2: verifyToolVersion
 * Verifies tool version exists, is not deprecated, and matches version constraints
 */
export const verifyToolVersion = tool({
  name: 'verifyToolVersion',
  description: 'Verifies that a tool version exists and matches constraints.',
  parameters: z.object({
    toolId: z.string().describe('The tool ID'),
    version: z.string().describe('The version string'),
    enterpriseId: z.string().describe('Enterprise ID')
  }),
  execute: async ({ toolId, version, enterpriseId }) => {
    try {
      console.log(`[TOOL-REGISTRY-TOOLS] Verifying tool version: ${version} for tool ${toolId}`);

      const supabase = getSupabaseClient();

      // Get all versions for this tool
      const { data: versions, error: versionsError } = await supabase
        .from('ai_tool_versions')
        .select('*')
        .eq('tool_id', toolId)
        .order('release_date', { ascending: false });

      if (versionsError) {
        throw new Error(`Failed to query tool versions: ${versionsError.message}`);
      }

      if (!versions || versions.length === 0) {
        return {
          verified: false,
          versionId: null,
          versionMetadata: null,
          constraints: null,
          violations: [{
            field: 'version',
            reason: `No versions found for tool ${toolId}`,
            severity: 'error'
          }]
        };
      }

      // Handle "latest" version
      let targetVersion = version;
      if (version === 'latest' || version === '') {
        targetVersion = versions[0].version;
      }

      // Find exact version match
      let matchedVersion = versions.find(v => v.version === targetVersion);

      // If no exact match, check if version matches a semver range
      if (!matchedVersion && (version.includes('>=') || version.includes('<') || version.includes('^') || version.includes('~'))) {
        // Simple semver matching - find latest version that matches
        // For production, use a proper semver library
        const versionPattern = version.replace(/[>=<^~]/g, '').trim();
        matchedVersion = versions.find(v => {
          const vParts = v.version.split('.');
          const patternParts = versionPattern.split('.');
          return vParts[0] === patternParts[0] && vParts[1] === patternParts[1];
        }) || versions[0]; // Fallback to latest
      }

      if (!matchedVersion) {
        return {
          verified: false,
          versionId: null,
          versionMetadata: null,
          constraints: null,
          violations: [{
            field: 'version',
            reason: `Version "${version}" not found. Available versions: ${versions.map(v => v.version).join(', ')}`,
            severity: 'error',
            availableVersions: versions.map(v => v.version)
          }]
        };
      }

      // Check if version is deprecated
      if (matchedVersion.deprecates_version_id) {
        return {
          verified: false,
          versionId: matchedVersion.id,
          versionMetadata: matchedVersion,
          constraints: null,
          violations: [{
            field: 'version',
            reason: `Version "${matchedVersion.version}" is deprecated`,
            severity: 'error',
            deprecated: true
          }]
        };
      }

      // Get approval constraints for this tool and enterprise
      const { data: approvals, error: approvalsError } = await supabase
        .from('tool_approvals')
        .select('*')
        .eq('tool_id', toolId)
        .eq('enterprise_id', enterpriseId)
        .eq('status', 'approved')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1);

      let constraints = null;
      let versionRule = null;

      if (approvals && approvals.length > 0 && !approvalsError) {
        const approval = approvals[0];
        constraints = approval.constraints;
        versionRule = approval.version_rule;

        // Check if version matches the version rule
        if (versionRule && versionRule !== '*') {
          // Simple version rule matching (for production, use proper semver library)
          const ruleMatch = versionRule.includes('>=') || versionRule.includes('<') || versionRule.includes('^') || versionRule.includes('~');
          if (!ruleMatch && matchedVersion.version !== versionRule) {
            return {
              verified: false,
              versionId: matchedVersion.id,
              versionMetadata: matchedVersion,
              constraints: constraints,
              violations: [{
                field: 'version_rule',
                reason: `Version "${matchedVersion.version}" does not match approval rule "${versionRule}"`,
                severity: 'error',
                requiredRule: versionRule
              }]
            };
          }
        }
      }

      console.log(`[TOOL-REGISTRY-TOOLS] Tool version verified: ${matchedVersion.version}`);
      
      return {
        verified: true,
        versionId: matchedVersion.id,
        versionMetadata: {
          id: matchedVersion.id,
          version: matchedVersion.version,
          release_date: matchedVersion.release_date,
          capabilities: matchedVersion.capabilities || {},
          known_limitations: matchedVersion.known_limitations || [],
          notes: matchedVersion.notes,
          deprecated: !!matchedVersion.deprecates_version_id
        },
        constraints: constraints || {},
        versionRule: versionRule,
        violations: []
      };
    } catch (error) {
      console.error('[TOOL-REGISTRY-TOOLS] Error verifying tool version:', error);
      return {
        verified: false,
        versionId: null,
        versionMetadata: null,
        constraints: null,
        violations: [{
          field: 'system_error',
          reason: error.message,
          severity: 'error'
        }]
      };
    }
  }
});

/**
 * Tool 3: checkToolMetadataCompleteness
 * Verifies all required metadata fields are present and complete
 */
export const checkToolMetadataCompleteness = tool({
  name: 'checkToolMetadataCompleteness',
  description: 'Verifies metadata completeness for a tool.',
  parameters: z.object({
    toolId: z.string().describe('The tool ID'),
    versionId: z.string().optional().describe('The version ID'),
    enterpriseId: z.string().optional().describe('Enterprise ID')
  }),
  execute: async ({ toolId, versionId, enterpriseId }) => {
    try {
      console.log(`[TOOL-REGISTRY-TOOLS] Checking metadata completeness for tool ${toolId}`);

      const supabase = getSupabaseClient();
      const missingFields = [];
      const metadata = {};

      // Check tool registry metadata
      const { data: tool, error: toolError } = await supabase
        .from('ai_tool_registry')
        .select('*')
        .eq('id', toolId)
        .single();

      if (toolError || !tool) {
        return {
          complete: false,
          missingFields: ['tool_not_found'],
          metadata: null
        };
      }

      // Required tool fields
      const requiredToolFields = ['name', 'provider', 'category'];
      for (const field of requiredToolFields) {
        if (!tool[field] || tool[field] === '') {
          missingFields.push(`tool.${field}`);
        }
      }

      // Recommended tool fields
      if (!tool.risk_tier) {
        missingFields.push('tool.risk_tier (recommended)');
      }
      if (!tool.deployment_status) {
        missingFields.push('tool.deployment_status (recommended)');
      }

      metadata.tool = {
        id: tool.id,
        name: tool.name,
        provider: tool.provider,
        category: tool.category,
        risk_tier: tool.risk_tier,
        deployment_status: tool.deployment_status
      };

      // Check version metadata if versionId provided
      if (versionId) {
        const { data: version, error: versionError } = await supabase
          .from('ai_tool_versions')
          .select('*')
          .eq('id', versionId)
          .single();

        if (!versionError && version) {
          // Version metadata is mostly optional, but check for completeness
          if (!version.capabilities || Object.keys(version.capabilities).length === 0) {
            missingFields.push('version.capabilities (recommended)');
          }

          metadata.version = {
            id: version.id,
            version: version.version,
            release_date: version.release_date,
            capabilities: version.capabilities || {},
            known_limitations: version.known_limitations || [],
            notes: version.notes
          };
        }
      }

      const isComplete = missingFields.filter(f => !f.includes('(recommended)')).length === 0;

      console.log(`[TOOL-REGISTRY-TOOLS] Metadata completeness check: ${isComplete ? 'complete' : 'incomplete'}`);
      
      return {
        complete: isComplete,
        missingFields,
        metadata,
        warnings: missingFields.filter(f => f.includes('(recommended)'))
      };
    } catch (error) {
      console.error('[TOOL-REGISTRY-TOOLS] Error checking metadata completeness:', error);
      return {
        complete: false,
        missingFields: ['system_error'],
        metadata: null,
        error: error.message
      };
    }
  }
});

/**
 * Tool 4: getToolConstraints
 * Retrieves recorded constraints for a tool from tool_approvals table
 */
export const getToolConstraints = tool({
  name: 'getToolConstraints',
  description: 'Retrieves recorded constraints for a tool.',
  parameters: z.object({
    toolId: z.string().describe('The tool ID'),
    enterpriseId: z.string().describe('Enterprise ID')
  }),
  execute: async ({ toolId, enterpriseId }) => {
    try {
      console.log(`[TOOL-REGISTRY-TOOLS] Getting tool constraints for tool ${toolId}`);

      const supabase = getSupabaseClient();

      // Query tool_approvals for active approvals
      const { data: approvals, error } = await supabase
        .from('tool_approvals')
        .select('*')
        .eq('tool_id', toolId)
        .eq('enterprise_id', enterpriseId)
        .in('status', ['approved', 'in_review'])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to query tool approvals: ${error.message}`);
      }

      if (!approvals || approvals.length === 0) {
        return {
          constraints: {},
          approvalStatus: 'none',
          expiresAt: null,
          versionRules: null,
          hasActiveApproval: false
        };
      }

      // Get the most recent active approval
      const activeApproval = approvals.find(a => a.status === 'approved') || approvals[0];

      console.log(`[TOOL-REGISTRY-TOOLS] Found ${approvals.length} approval(s), using most recent`);
      
      return {
        constraints: activeApproval.constraints || {},
        approvalStatus: activeApproval.status,
        expiresAt: activeApproval.expires_at,
        versionRules: activeApproval.version_rule,
        hasActiveApproval: activeApproval.status === 'approved',
        approvalId: activeApproval.id,
        createdAt: activeApproval.created_at,
        updatedAt: activeApproval.updated_at,
        allApprovals: approvals.map(a => ({
          id: a.id,
          status: a.status,
          versionRule: a.version_rule,
          expiresAt: a.expires_at,
          constraints: a.constraints
        }))
      };
    } catch (error) {
      console.error('[TOOL-REGISTRY-TOOLS] Error getting tool constraints:', error);
      return {
        constraints: {},
        approvalStatus: 'error',
        expiresAt: null,
        versionRules: null,
        hasActiveApproval: false,
        error: error.message
      };
    }
  }
});

// Add names to tools for internal identification
verifyToolIdentity.name = 'verifyToolIdentity';
verifyToolVersion.name = 'verifyToolVersion';
checkToolMetadataCompleteness.name = 'checkToolMetadataCompleteness';
getToolConstraints.name = 'getToolConstraints';

/**
 * Export all tool registry tools as an array for easy integration
 */
export const toolRegistryTools = [
  verifyToolIdentity,
  verifyToolVersion,
  checkToolMetadataCompleteness,
  getToolConstraints
];
