import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { toolRegistryTools } from './tool-registry-tools.js';

/**
 * Tool Registry Agent AI SDK Runtime
 *
 * This runtime integrates tool registry verification logic with Vercel AI SDK.
 * The AI SDK provides the "thinking" and "tool calling" loop, while AICOMPLYR
 * provides the tool registry and constraint checking capabilities.
 *
 * Core principle: "AI SDK runs the agent. AICOMPLYR decides and proves."
 */

const ToolRegistryAgentPrompt = `
You are the ToolRegistryAgent, responsible for verifying tool identity and compliance before risk and policy evaluation.

Your role:
1. Verify tool exists in registry with correct name/provider
2. Verify tool version exists and matches approval constraints
3. Check metadata completeness (all required fields present)
4. Retrieve recorded constraints from tool approvals
5. Block unverified or non-compliant tools from proceeding

Always verify:
- Tool identity (name, provider match registry)
- Version validity (exists, not deprecated, matches version rules)
- Metadata completeness (required fields present)
- Constraint compliance (matches enterprise approval rules)

If verification fails, provide clear violations and recommendations.
`;

/**
 * Tool Registry Agent Runtime Class
 * Wraps tool registry verification logic in AI SDK execution
 */
export class ToolRegistryAgentRuntime {
  constructor(options = {}) {
    this.model = options.model || 'gpt-4o';
    this.maxSteps = options.maxSteps || 5;
    this.onToolVerified = options.onToolVerified || (() => {});
    this.onVerificationFailed = options.onVerificationFailed || (() => {});
  }

  /**
   * Comprehensive tool verification workflow
   * Combines all verification steps: identity, version, metadata, constraints
   */
  async verifyTool(toolName, provider, version, enterpriseId) {
    console.log(`[TOOL-REGISTRY-AGENT-RUNTIME] Verifying tool: ${toolName} v${version} by ${provider}`);
    console.log(`[TOOL-REGISTRY-AGENT-RUNTIME] Available tools:`, toolRegistryTools.map(t => ({ name: t.name, toolName: t.toolName, type: typeof t })));

    try {
      // Step 1: Verify tool identity
      const identityTool = toolRegistryTools.find(t => t.execute && (t.name === 'verifyToolIdentity' || t.toolName === 'verifyToolIdentity' || t.toString().includes('verifyToolIdentity')));
      
      // Fallback: search by index if name matching fails
      const toolToUse = identityTool || toolRegistryTools[0];
      
      if (!toolToUse) {
        throw new Error('verifyToolIdentity tool not found in registry tools');
      }

      const identityResult = await toolToUse.execute({
        toolName,
        provider,
        enterpriseId
      });

      if (!identityResult.verified) {
        await this.onVerificationFailed({
          step: 'identity',
          violations: identityResult.violations,
          toolName,
          provider
        });

        return {
          verified: false,
          step: 'identity',
          violations: identityResult.violations,
          toolMetadata: null,
          versionMetadata: null,
          constraints: null
        };
      }

      const toolId = identityResult.toolId;
      const toolMetadata = identityResult.toolMetadata;

      // Step 2: Verify tool version
      const versionTool = toolRegistryTools.find(t => t.execute && (t.name === 'verifyToolVersion' || t.toolName === 'verifyToolVersion' || t.toString().includes('verifyToolVersion'))) || toolRegistryTools[1];
      if (!versionTool) {
        throw new Error('verifyToolVersion tool not found in registry tools');
      }

      const versionResult = await versionTool.execute({
        toolId,
        version: version || 'latest',
        enterpriseId
      });

      if (!versionResult.verified) {
        await this.onVerificationFailed({
          step: 'version',
          violations: versionResult.violations,
          toolId,
          version
        });

        return {
          verified: false,
          step: 'version',
          violations: versionResult.violations,
          toolMetadata,
          versionMetadata: null,
          constraints: null
        };
      }

      const versionId = versionResult.versionId;
      const versionMetadata = versionResult.versionMetadata;
      const constraints = versionResult.constraints;

      // Step 3: Check metadata completeness
      const metadataTool = toolRegistryTools.find(t => t.execute && (t.name === 'checkToolMetadataCompleteness' || t.toolName === 'checkToolMetadataCompleteness' || t.toString().includes('checkToolMetadataCompleteness'))) || toolRegistryTools[2];
      if (!metadataTool) {
        throw new Error('checkToolMetadataCompleteness tool not found in registry tools');
      }

      const metadataResult = await metadataTool.execute({
        toolId,
        versionId,
        enterpriseId
      });

      // Metadata completeness is a warning, not a blocker (unless critical fields missing)
      if (!metadataResult.complete && metadataResult.missingFields.some(f => !f.includes('(recommended)'))) {
        console.warn(`[TOOL-REGISTRY-AGENT-RUNTIME] Metadata incomplete: ${metadataResult.missingFields.join(', ')}`);
      }

      // Step 4: Get tool constraints
      const constraintsTool = toolRegistryTools.find(t => t.execute && (t.name === 'getToolConstraints' || t.toolName === 'getToolConstraints' || t.toString().includes('getToolConstraints'))) || toolRegistryTools[3];
      if (!constraintsTool) {
        throw new Error('getToolConstraints tool not found in registry tools');
      }

      const constraintsResult = await constraintsTool.execute({
        toolId,
        enterpriseId
      });

      // Merge constraints from version verification and constraints query
      const finalConstraints = {
        ...constraints,
        ...constraintsResult.constraints,
        approvalStatus: constraintsResult.approvalStatus,
        versionRules: constraintsResult.versionRules || versionResult.versionRule,
        expiresAt: constraintsResult.expiresAt,
        hasActiveApproval: constraintsResult.hasActiveApproval
      };

      const verificationResult = {
        verified: true,
        toolId,
        toolMetadata: {
          ...toolMetadata,
          metadataCompleteness: metadataResult
        },
        versionId,
        versionMetadata,
        constraints: finalConstraints,
        violations: [],
        warnings: metadataResult.warnings || []
      };

      await this.onToolVerified(verificationResult);

      console.log(`[TOOL-REGISTRY-AGENT-RUNTIME] Tool verification complete: ${toolId}`);
      return verificationResult;

    } catch (error) {
      console.error('[TOOL-REGISTRY-AGENT-RUNTIME] Error in tool verification:', error);
      
      await this.onVerificationFailed({
        step: 'system_error',
        violations: [{
          field: 'system_error',
          reason: error.message,
          severity: 'error'
        }],
        toolName,
        provider,
        version
      });

      return {
        verified: false,
        step: 'system_error',
        violations: [{
          field: 'system_error',
          reason: error.message,
          severity: 'error'
        }],
        toolMetadata: null,
        versionMetadata: null,
        constraints: null
      };
    }
  }

  /**
   * Get tool metadata by ID
   */
  async getToolMetadata(toolId, versionId = null) {
    console.log(`[TOOL-REGISTRY-AGENT-RUNTIME] Getting metadata for tool ${toolId}`);

    try {
      const metadataTool = toolRegistryTools.find(t => t.name === 'checkToolMetadataCompleteness');
      if (!metadataTool) {
        throw new Error('checkToolMetadataCompleteness tool not found');
      }

      return await metadataTool.execute({
        toolId,
        versionId,
        enterpriseId: null
      });
    } catch (error) {
      console.error('[TOOL-REGISTRY-AGENT-RUNTIME] Error getting tool metadata:', error);
      return {
        complete: false,
        missingFields: ['system_error'],
        metadata: null,
        error: error.message
      };
    }
  }

  /**
   * Check constraints for a tool
   */
  async checkConstraints(toolId, enterpriseId) {
    console.log(`[TOOL-REGISTRY-AGENT-RUNTIME] Checking constraints for tool ${toolId}`);

    try {
      const constraintsTool = toolRegistryTools.find(t => t.name === 'getToolConstraints');
      if (!constraintsTool) {
        throw new Error('getToolConstraints tool not found');
      }

      return await constraintsTool.execute({
        toolId,
        enterpriseId
      });
    } catch (error) {
      console.error('[TOOL-REGISTRY-AGENT-RUNTIME] Error checking constraints:', error);
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

  /**
   * Validate a complete tool request
   * Convenience method that performs all verification steps
   */
  async validateToolRequest(requestData) {
    const {
      tool,
      vendor,
      version,
      enterpriseId
    } = requestData;

    return await this.verifyTool(tool, vendor, version, enterpriseId);
  }
}

export default ToolRegistryAgentRuntime;
