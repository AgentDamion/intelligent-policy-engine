import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { riskTools } from './risk-tools.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * Risk Agent AI SDK Runtime
 *
 * This runtime integrates the existing RiskProfileTaxonomyAgent logic with Vercel AI SDK.
 * The AI SDK provides the "thinking" and "tool calling" loop, while AICOMPLYR
 * provides the risk assessment and scoring capabilities.
 *
 * Core principle: "AI SDK runs the agent. AICOMPLYR decides and proves."
 */

const RiskAgentPrompt = `
You are the RiskAgent, responsible for assessing risk before policy decisions are made.

Your role:
1. Assess tools across 6 risk dimensions
2. Calculate risk scores from usage patterns
3. Flag high-risk scenarios for escalation
4. Provide risk context to PolicyAgent

Risk Dimensions (Weighted):
1. Data Sensitivity & Privacy (25% weight) - PII, PHI, regulated data
2. External Exposure & Decision Impact (20% weight) - Customer-facing, high-stakes decisions
3. Model Transparency (15% weight) - Black box vs. interpretable
4. Misuse / Adversarial Vectors (15% weight) - Prompt injection, hallucinations
5. Legal / IP Risk (15% weight) - Copyright, regulatory compliance
6. Operational Criticality (10% weight) - Business continuity

Risk Tiers:
- Minimal (0-20): Internal productivity tools
- Low (21-40): Low-stakes content generation
- Medium (41-60): Customer-facing, moderate risk
- High (61-80): Regulated data, high stakes
- Critical (81-100): Medical/legal decisions, PII

You have access to three risk assessment tools:
- assessRiskProfile: Assess tool across 6 dimensions
- calculateRiskScore: Calculate numeric risk score from telemetry
- getRiskFactors: Retrieve historical risk factors

Always provide clear risk assessments and recommend escalation when risk tier is "critical" or score > 80.
`;

/**
 * Risk Agent Runtime Class
 * Wraps the existing RiskProfileTaxonomyAgent logic in AI SDK execution
 */
export class RiskAgentRuntime {
  constructor(options = {}) {
    this.model = options.model || 'gpt-4o';
    this.maxSteps = options.maxSteps || 5;
    this.onRiskAssessed = options.onRiskAssessed || (() => {});
    this.escalationThreshold = options.escalationThreshold || 80;
  }

  /**
   * Assess tool risk using 6-dimensional risk profile
   */
  async assessToolRisk(toolMetadata, vendorData = {}, usageContext = {}) {
    console.log(`[RISK-AGENT-RUNTIME] Assessing risk for tool: ${toolMetadata.name || toolMetadata.tool}`);

    try {
      // Use the assessRiskProfile tool directly
      const assessTool = riskTools.find(t => t.name === 'assessRiskProfile');
      if (!assessTool) {
        throw new Error('assessRiskProfile tool not found');
      }

      const result = await assessTool.execute({
        toolMetadata,
        vendorData,
        usageContext
      });

      if (result.success) {
        await this.onRiskAssessed(result.assessment);
      }

      return result;
    } catch (error) {
      console.error('[RISK-AGENT-RUNTIME] Error assessing tool risk:', error);
      return {
        success: false,
        error: error.message,
        toolMetadata
      };
    }
  }

  /**
   * Calculate risk score from telemetry atoms
   */
  async calculateRiskScore(telemetryAtoms, options = {}) {
    const {
      timeWindow = '24h',
      region = 'US',
      toolId
    } = options;

    console.log(`[RISK-AGENT-RUNTIME] Calculating risk score from ${telemetryAtoms.length} telemetry atoms`);

    try {
      const scoreTool = riskTools.find(t => t.name === 'calculateRiskScore');
      if (!scoreTool) {
        throw new Error('calculateRiskScore tool not found');
      }

      const result = await scoreTool.execute({
        atoms: telemetryAtoms,
        timeWindow,
        region,
        toolId
      });

      return result;
    } catch (error) {
      console.error('[RISK-AGENT-RUNTIME] Error calculating risk score:', error);
      return {
        success: false,
        error: error.message,
        atomsCount: telemetryAtoms.length
      };
    }
  }

  /**
   * Get risk history for a tool/vendor
   */
  async getRiskHistory(toolId, vendorId, timeRange = null, enterpriseId = null) {
    console.log(`[RISK-AGENT-RUNTIME] Retrieving risk history for tool: ${toolId}, vendor: ${vendorId}`);

    try {
      const historyTool = riskTools.find(t => t.name === 'getRiskFactors');
      if (!historyTool) {
        throw new Error('getRiskFactors tool not found');
      }

      // Default time range: last 30 days
      const defaultTimeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      const result = await historyTool.execute({
        toolId,
        vendorId,
        enterpriseId,
        timeRange: timeRange || defaultTimeRange
      });

      return result;
    } catch (error) {
      console.error('[RISK-AGENT-RUNTIME] Error retrieving risk history:', error);
      return {
        success: false,
        error: error.message,
        toolId,
        vendorId
      };
    }
  }

  /**
   * Determine if escalation is needed based on risk profile and score
   */
  async shouldEscalate(riskProfile, riskScore = null) {
    // Escalate if risk tier is critical
    if (riskProfile === 'critical') {
      return {
        shouldEscalate: true,
        reason: 'Risk tier is CRITICAL - requires immediate human review',
        priority: 'critical'
      };
    }

    // Escalate if risk tier is high and score exceeds threshold
    if (riskProfile === 'high' && riskScore && riskScore > this.escalationThreshold) {
      return {
        shouldEscalate: true,
        reason: `Risk score ${riskScore} exceeds escalation threshold ${this.escalationThreshold}`,
        priority: 'high'
      };
    }

    // Escalate if numeric score exceeds threshold
    if (riskScore && riskScore > this.escalationThreshold) {
      return {
        shouldEscalate: true,
        reason: `Risk score ${riskScore} exceeds escalation threshold ${this.escalationThreshold}`,
        priority: 'high'
      };
    }

    return {
      shouldEscalate: false,
      reason: 'Risk level is within acceptable thresholds',
      priority: riskProfile || 'medium'
    };
  }

  /**
   * Comprehensive risk assessment workflow
   * Combines risk profile assessment with telemetry-based scoring
   */
  async assessRiskComprehensive(toolMetadata, vendorData, usageContext, telemetryAtoms = [], options = {}) {
    console.log(`[RISK-AGENT-RUNTIME] Comprehensive risk assessment for: ${toolMetadata.name || toolMetadata.tool}`);

    try {
      // Step 1: Assess risk profile (6-dimensional)
      const profileResult = await this.assessToolRisk(toolMetadata, vendorData, usageContext);
      
      if (!profileResult.success) {
        return profileResult;
      }

      const riskProfile = profileResult.assessment;

      // Step 2: Calculate risk score from telemetry (if available)
      let riskScoreResult = null;
      if (telemetryAtoms.length > 0) {
        riskScoreResult = await this.calculateRiskScore(telemetryAtoms, options);
      }

      // Step 3: Get historical risk factors
      const historyResult = await this.getRiskHistory(
        toolMetadata.name || toolMetadata.tool,
        vendorData.name || vendorData.vendor,
        options.timeRange,
        options.enterpriseId
      );

      // Step 4: Determine escalation need
      const escalationCheck = await this.shouldEscalate(
        riskProfile.riskProfile,
        riskScoreResult?.riskScore?.total
      );

      return {
        success: true,
        riskProfile: riskProfile.assessment,
        riskScore: riskScoreResult?.riskScore || null,
        riskHistory: historyResult?.riskFactors || null,
        escalation: escalationCheck,
        assessedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[RISK-AGENT-RUNTIME] Error in comprehensive risk assessment:', error);
      return {
        success: false,
        error: error.message,
        toolMetadata
      };
    }
  }
}

export default RiskAgentRuntime;
