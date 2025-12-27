// Enhanced Policy Agent with Better Risk Calculation
// Integrated with Risk Profile Taxonomy Framework
// Includes Rationale Generation for Audit Compliance

const RiskProfileTaxonomyAgent = require('./risk-profile-taxonomy-agent');

// Rationale generator will be loaded dynamically (ESM module)
let rationaleGenerator = null;

/**
 * Load the rationale generator module (ESM)
 * @returns {Promise<Object>} Rationale generator module
 */
async function loadRationaleGenerator() {
  if (!rationaleGenerator) {
    try {
      rationaleGenerator = await import('../core/rationale-generator.js');
    } catch (err) {
      console.warn('⚠️ Failed to load rationale generator, using fallback:', err.message);
      // Fallback implementation
      rationaleGenerator = {
        generateRationale: (input) => ({
          human: `${input.decision || 'Processed'} under ${input.policyId || 'policy'}: tool=${input.tool?.name || 'unknown'}`,
          structured: {
            policy_id: input.policyId || 'unknown',
            policy_version: input.policyVersion || 'v1.0',
            rule_matched: input.ruleMatched || 'default',
            inputs: { tool: input.tool?.name || 'unknown', dataset_class: input.dataClass || 'unknown', request_type: 'generation' },
            actor: input.actor || { type: 'automated' },
            timestamp: new Date().toISOString()
          }
        })
      };
    }
  }
  return rationaleGenerator;
}

class PolicyAgent {
    constructor() {
        // Initialize Risk Profile Taxonomy Agent
        this.riskProfileTaxonomy = new RiskProfileTaxonomyAgent();
    }

    async process(data) {
      try {
        // Safe access to urgency level (keeping your existing logic)
        const urgencyLevel = data.contextOutput?.urgency?.level || 
                            data.urgency?.level || 
                            data.context?.urgency?.level || 
                            0.5; // default fallback
        
        // NEW: Assess tool using Risk Profile Taxonomy
        const taxonomyAssessment = await this.riskProfileTaxonomy.assessTool(
          {
            name: data.tool,
            vendor: data.vendor,
            usage: data.usage,
            dataHandling: data.dataHandling,
            modelType: data.modelType || data.type,
            industry: data.industry
          },
          {
            name: data.vendor,
            vendor: data.vendor
          },
          {
            usage: data.usage,
            dataHandling: data.dataHandling,
            audience: data.audience,
            purpose: data.purpose || this.inferPurpose(data.usage),
            industry: data.industry
          }
        );
        
        // Enhanced risk calculation with taxonomy weighting
        const riskScore = this.calculateEnhancedRiskScore({
          tool: data.tool,
          vendor: data.vendor,
          usage: data.usage,
          dataHandling: data.dataHandling,
          urgencyLevel
        }, taxonomyAssessment);
        
        const decision = this.makeEnhancedDecision(riskScore, urgencyLevel);
        const riskLevel = this.getRiskLevel(riskScore);
        const riskFactors = this.getRiskFactors(data);
        const reasoning = this.getDecisionReasoning(riskScore, decision);
        
        // Generate structured rationale for audit compliance
        const generator = await loadRationaleGenerator();
        const decisionNormalized = decision === 'approved' ? 'allow' : 
                                    decision === 'rejected' ? 'deny' : 
                                    decision === 'conditional' ? 'conditional' : 'escalate';
        
        const rationaleResult = generator.generateRationale({
          decision: decisionNormalized,
          policyId: taxonomyAssessment.riskProfile ? 
            `tier-${taxonomyAssessment.riskProfile}` : 'risk-assessment',
          policyVersion: 'v1.0',
          ruleMatched: `risk_score_${riskLevel}`,
          tool: {
            name: data.tool || 'unknown',
            version: data.toolVersion
          },
          dataClass: this.inferDataClass(data.dataHandling),
          actor: data.actor || { type: 'automated' },
          confidenceScore: 1 - riskScore, // Higher risk = lower confidence
          secondaryRules: this.getGuardrails(riskScore, data, taxonomyAssessment)
        });
        
        // Return the complex structure your system expects (enhanced with taxonomy data)
        return {
          request: {
            originalContent: data.contextOutput?.originalContent || "Request processed",
            user: {
              role: "marketing_agency_employee",
              urgency_level: urgencyLevel,
              emotional_state: data.contextOutput?.urgency?.emotionalState || "neutral"
            },
            request: {
              tool: data.tool?.toLowerCase(),
              purpose: this.inferPurpose(data.usage),
              presentation_type: "client_presentation",
              confidence: 0.8,
              deadline: "pending",
              current_time: new Date().toISOString()
            },
            context: {
              time_pressure: data.contextOutput?.urgency?.timePressure || 0.5,
              is_weekend: false,
              is_client_facing: true
            }
          },
          risk: {
            score: riskScore,
            factors: riskFactors,
            level: riskLevel,
            // NEW: Risk Profile Taxonomy Integration
            profile: taxonomyAssessment.riskProfile,
            profileDimensions: taxonomyAssessment.dimensionScores,
            taxonomyScore: taxonomyAssessment.aggregateScore,
            riskMultiplier: taxonomyAssessment.riskMultiplier
          },
          decision: {
            decision: decision,
            type: decision === "approved" ? "auto_approval" : "requires_review",
            reasoning: reasoning,
            requires_escalation: decision === "rejected"
          },
          conditions: {
            guardrails: this.getGuardrails(riskScore, data, taxonomyAssessment),
            recommendedControls: taxonomyAssessment.recommendedControls
          },
          monitoring: {
            requirements: this.getMonitoringRequirements(riskScore),
            escalation: riskScore > 0.7,
            auditRequirements: taxonomyAssessment.auditRequirements
          },
          escalation: riskScore > 0.7,
          next_steps: this.getNextSteps(decision),
          // NEW: Full taxonomy assessment for audit trail
          taxonomyAssessment: {
            riskProfile: taxonomyAssessment.riskProfile,
            rationale: taxonomyAssessment.rationale,
            assessedAt: taxonomyAssessment.assessedAt
          },
          // NEW: Structured rationale fields for database storage (audit compliance)
          rationale_human: rationaleResult.human,
          rationale_structured: rationaleResult.structured
        };
        
      } catch (error) {
        console.error("Enhanced Policy Agent Error:", error);
        return {
          status: "failed",
          error: error.message,
          debug: {
            hasContextOutput: !!data.contextOutput,
            hasUrgency: !!data.urgency,
            hasContext: !!data.context,
            keys: Object.keys(data)
          }
        };
      }
    }
    
    // ENHANCED RISK CALCULATION - Integrated with Risk Profile Taxonomy
    calculateEnhancedRiskScore({ tool, vendor, usage, dataHandling, urgencyLevel }, taxonomyAssessment = null) {
      let score = 0.1; // Lower base score than before
      
      // Apply taxonomy risk multiplier if available
      const riskMultiplier = taxonomyAssessment ? taxonomyAssessment.riskMultiplier : 1.0;
      console.log(`\n  📊 Risk Profile: ${taxonomyAssessment?.riskProfile?.toUpperCase() || 'NONE'} (Multiplier: ${riskMultiplier}x)`);
      console.log(`  📊 Taxonomy Score: ${taxonomyAssessment?.aggregateScore || 'N/A'}/100\n`);
      
      // VENDOR RISK (Major factor)
      const vendorLower = vendor?.toLowerCase() || "";
      let vendorRisk = 0;
      if (vendorLower.includes("unknown") || vendorLower.includes("sketchy")) {
        vendorRisk = 0.5; // High penalty for unknown vendors
        console.log(`    - Vendor Risk: +${vendorRisk} (Unknown/Sketchy vendor)`);
      } else if (vendorLower.includes("openai") || vendorLower.includes("microsoft") || vendorLower.includes("google")) {
        vendorRisk = 0.1; // Low penalty for trusted vendors
        console.log(`    - Vendor Risk: +${vendorRisk} (Trusted vendor)`);
      } else {
        vendorRisk = 0.3; // Medium penalty for other vendors
        console.log(`    - Vendor Risk: +${vendorRisk} (Other vendor)`);
      }
      score += vendorRisk;
      
      // DATA HANDLING RISK (Critical factor)
      const dataLower = dataHandling?.toLowerCase() || "";
      let dataRisk = 0;
      if (dataLower.includes("ssn") || dataLower.includes("medical") || dataLower.includes("phi")) {
        dataRisk = 0.6; // Critical - medical/SSN data
        console.log(`    - Data Risk: +${dataRisk} (Critical data: SSN/Medical)`);
      } else if (dataLower.includes("pii") || dataLower.includes("customer data")) {
        dataRisk = 0.4; // High - PII processing
        console.log(`    - Data Risk: +${dataRisk} (PII/Customer data)`);
      } else if (dataLower.includes("stores") || dataLower.includes("permanently")) {
        dataRisk = 0.3; // Medium - data storage
        console.log(`    - Data Risk: +${dataRisk} (Data storage)`);
      } else if (dataLower.includes("no") && (dataLower.includes("data") || dataLower.includes("customer"))) {
        dataRisk = 0.0; // Safe - no data processing
        console.log(`    - Data Risk: +${dataRisk} (No customer data)`);
      } else {
        dataRisk = 0.2; // Default data handling penalty
        console.log(`    - Data Risk: +${dataRisk} (Default data handling)`);
      }
      score += dataRisk;
      
      // USAGE TYPE RISK
      const usageLower = usage?.toLowerCase() || "";
      let usageRisk = 0;
      if (usageLower.includes("analysis") || usageLower.includes("processing")) {
        usageRisk = 0.2; // Higher risk for data analysis
        console.log(`    - Usage Risk: +${usageRisk} (Data analysis/processing)`);
      } else if (usageLower.includes("generation") || usageLower.includes("content")) {
        usageRisk = 0.1; // Lower risk for content generation
        console.log(`    - Usage Risk: +${usageRisk} (Content generation)`);
      }
      score += usageRisk;
      
      // URGENCY MODIFIER (Pressure can lead to poor decisions)
      let urgencyRisk = 0;
      if (urgencyLevel > 0.7) {
        urgencyRisk = 0.2; // High urgency increases risk
        console.log(`    - Urgency Risk: +${urgencyRisk} (High urgency)`);
      } else if (urgencyLevel > 0.5) {
        urgencyRisk = 0.1; // Medium urgency slight increase
        console.log(`    - Urgency Risk: +${urgencyRisk} (Medium urgency)`);
      }
      score += urgencyRisk;
      
      // TOOL-SPECIFIC RISK
      const toolLower = tool?.toLowerCase() || "";
      let toolRisk = 0;
      if (toolLower.includes("unknown") || toolLower.includes("custom")) {
        toolRisk = 0.3; // Unknown tools are risky
        console.log(`    - Tool Risk: +${toolRisk} (Unknown/Custom tool)`);
      }
      score += toolRisk;
      
      // Apply taxonomy risk multiplier to base score
      const baseScore = score;
      const finalScore = Math.min(baseScore * riskMultiplier, 1.0); // Cap at 1.0
      console.log(`    - BASE RISK SCORE: ${baseScore.toFixed(3)}`);
      console.log(`    - TAXONOMY MULTIPLIER: ${riskMultiplier}x`);
      console.log(`    - FINAL RISK SCORE: ${finalScore.toFixed(3)}`);
      
      return finalScore;
    }
    
    // ENHANCED DECISION MAKING - More strict thresholds
    makeEnhancedDecision(riskScore, urgencyLevel) {
      if (riskScore > 0.7) return "rejected";      // High risk = reject
      if (riskScore > 0.3) return "conditional";   // Medium risk = conditional (lowered threshold)
      return "approved";                           // Low risk = approve
    }
    
    getRiskLevel(score) {
      if (score > 0.7) return "critical";
      if (score > 0.5) return "high";
      if (score > 0.3) return "medium";
      return "low";
    }
    
    getRiskFactors(data) {
      const factors = [];
      
      const vendorLower = data.vendor?.toLowerCase() || "";
      if (vendorLower.includes("unknown") || vendorLower.includes("sketchy")) {
        factors.push("Unknown vendor poses security risk");
      }
      
      const dataLower = data.dataHandling?.toLowerCase() || "";
      if (dataLower.includes("ssn") || dataLower.includes("medical") || dataLower.includes("phi")) {
        factors.push("Critical data types require highest security");
      } else if (dataLower.includes("pii")) {
        factors.push("PII processing requires enhanced controls");
      }
      
      if (data.usage?.toLowerCase().includes("analysis")) {
        factors.push("Data analysis tools need oversight");
      }
      
      if (factors.length === 0) {
        factors.push("Client-facing content requires higher scrutiny", "AI-generated content requires human review");
      }
      
      return factors;
    }
    
    getDecisionReasoning(riskScore, decision) {
      if (decision === "rejected") {
        return "High risk factors exceed acceptable thresholds";
      } else if (decision === "conditional") {
        return "Medium risk requires additional controls and monitoring";
      } else {
        return "Low risk request meets auto-approval criteria";
      }
    }
    
    getGuardrails(riskScore, data, taxonomyAssessment = null) {
      const guardrails = ["content_review"];
      
      if (riskScore > 0.5) {
        guardrails.push("enhanced_monitoring");
      }
      if (data.dataHandling?.toLowerCase().includes("pii")) {
        guardrails.push("data_protection_review");
      }
      
      // Add taxonomy-recommended controls
      if (taxonomyAssessment && taxonomyAssessment.recommendedControls) {
        guardrails.push(...taxonomyAssessment.recommendedControls);
      }
      
      // Remove duplicates
      return [...new Set(guardrails)];
    }
    
    getMonitoringRequirements(riskScore) {
      const requirements = ["usage_tracking"];
      
      if (riskScore > 0.5) {
        requirements.push("enhanced_logging", "periodic_audits");
      }
      
      return requirements;
    }
    
    getNextSteps(decision) {
      switch (decision) {
        case "approved":
          return ["Proceed with request"];
        case "conditional":
          return ["Implement additional controls", "Schedule review"];
        case "rejected":
          return ["Request denied", "Consider alternatives"];
        default:
          return ["Review required"];
      }
    }
    
    inferPurpose(usage) {
      if (usage?.toLowerCase().includes("presentation")) return "presentation_content";
      if (usage?.toLowerCase().includes("analysis")) return "data_analysis";
      if (usage?.toLowerCase().includes("generation")) return "content_generation";
      return "general_purpose";
    }
    
    /**
     * Infer data classification from dataHandling description
     * @param {string} dataHandling - Data handling description
     * @returns {string} Standardized data class
     */
    inferDataClass(dataHandling) {
      const dataLower = dataHandling?.toLowerCase() || "";
      
      if (dataLower.includes("phi") || dataLower.includes("medical") || dataLower.includes("health")) {
        return "phi";
      }
      if (dataLower.includes("ssn") || dataLower.includes("social security")) {
        return "restricted";
      }
      if (dataLower.includes("pii") || dataLower.includes("personal")) {
        return "pii";
      }
      if (dataLower.includes("internal") || dataLower.includes("confidential")) {
        return "internal_restricted";
      }
      if (dataLower.includes("no") && (dataLower.includes("data") || dataLower.includes("pii"))) {
        return "no_pii";
      }
      if (dataLower.includes("public")) {
        return "public";
      }
      
      return "unclassified";
    }

    /**
     * Enhanced policy evaluation with tier-specific thresholds
     * @param {Object} context - Request context
     * @param {Object} complianceResult - Result from ComplianceScoringAgent
     * @returns {Object} Policy decision with tier-specific requirements
     */
    async evaluatePolicy(context, complianceResult) {
      const { riskProfile } = complianceResult;

      // Tier-specific approval thresholds
      const approvalThresholds = {
        minimal: 60,   // Auto-approve at 60+ compliance
        low: 65,
        medium: 70,
        high: 80,
        critical: 90   // Requires 90+ for critical tools
      };

      const threshold = approvalThresholds[riskProfile.tier];
      const complianceScore = complianceResult.overallComplianceScore || complianceResult.complianceScore;

      let decision = 'REJECTED';
      if (complianceScore >= threshold) {
        decision = riskProfile.tier === 'critical' ? 'HUMAN_IN_LOOP' : 'APPROVED';
      } else if (complianceScore >= threshold - 10) {
        decision = 'HUMAN_IN_LOOP';
      }

      // Generate structured rationale for audit compliance
      const generator = await loadRationaleGenerator();
      const decisionNormalized = decision === 'APPROVED' ? 'allow' : 
                                  decision === 'REJECTED' ? 'deny' : 'escalate';
      
      const rationaleResult = generator.generateRationale({
        decision: decisionNormalized,
        policyId: `tier-${riskProfile.tier}`,
        policyVersion: 'v1.0',
        ruleMatched: `compliance_threshold_${threshold}`,
        tool: {
          name: context.tool?.name || context.toolName || 'unknown',
          version: context.tool?.version
        },
        dataClass: context.dataClass || context.dataHandling || 'unclassified',
        actor: context.actor || { type: 'automated' },
        confidenceScore: this.calculateConfidence(complianceResult, riskProfile),
        secondaryRules: this.mapTierToControls(riskProfile.tier)
      });

      return {
        decision,
        confidence: this.calculateConfidence(complianceResult, riskProfile),
        rationale: this.generateRationale(decision, riskProfile, complianceResult),
        // NEW: Structured rationale fields for database storage
        rationale_human: rationaleResult.human,
        rationale_structured: rationaleResult.structured,
        requiredControls: this.mapTierToControls(riskProfile.tier),
        riskProfile: riskProfile,  // Pass through for database storage
        approvalThreshold: threshold,
        complianceScore: complianceScore
      };
    }

    /**
     * Map risk tier to required controls
     * @param {string} tier - Risk tier (minimal/low/medium/high/critical)
     * @returns {Array<string>} Required control measures
     */
    mapTierToControls(tier) {
      const controlMappings = {
        minimal: ['basic_usage_logging'],
        low: ['content_review', 'periodic_audits'],
        medium: ['enhanced_monitoring', 'data_protection', 'human_oversight'],
        high: ['explainability_requirements', 'bias_testing', 'legal_review', 'audit_trails'],
        critical: ['full_model_audit', 'continuous_monitoring', 'regulatory_approval', 'liability_coverage']
      };

      return controlMappings[tier] || [];
    }

    /**
     * Calculate confidence for policy decision
     * @param {Object} complianceResult - Compliance assessment result
     * @param {Object} riskProfile - Risk profile from assessment
     * @returns {number} Confidence score (0-1)
     */
    calculateConfidence(complianceResult, riskProfile) {
      // Base confidence from compliance assessment
      let confidence = complianceResult.confidence || 0.8;
      
      // Adjust based on risk tier
      if (riskProfile.tier === 'critical' || riskProfile.tier === 'high') {
        confidence *= 0.9; // More cautious with high-risk tools
      } else if (riskProfile.tier === 'minimal' || riskProfile.tier === 'low') {
        confidence *= 1.05; // More confident with low-risk tools
      }
      
      return Math.min(Math.max(confidence, 0), 1);
    }

    /**
     * Generate rationale for decision
     * @param {string} decision - Policy decision
     * @param {Object} riskProfile - Risk profile
     * @param {Object} complianceResult - Compliance result
     * @returns {string} Human-readable rationale
     */
    generateRationale(decision, riskProfile, complianceResult) {
      const score = complianceResult.overallComplianceScore || complianceResult.complianceScore;
      
      if (decision === 'APPROVED') {
        return `Tool approved for ${riskProfile.tier} risk tier. Compliance score of ${score} meets threshold. Required controls: ${this.mapTierToControls(riskProfile.tier).join(', ')}.`;
      } else if (decision === 'HUMAN_IN_LOOP') {
        return `${riskProfile.tier} risk tier requires human review. Compliance score: ${score}. Audit checklist: ${riskProfile.auditChecklist.slice(0, 3).join(', ')}...`;
      } else {
        return `Tool rejected for ${riskProfile.tier} risk tier. Compliance score of ${score} below required threshold. Additional controls needed.`;
      }
    }
  }
  
  // Keep your existing Context Agent (no changes needed)
  class ContextAgent {
    async process(data) {
      try {
        // Try multiple ways to extract the user message
        const userMessage = data.userMessage || 
                           data.message || 
                           data.request || 
                           data.content ||
                           "No message provided";
        
        console.log("🔍 Context Agent Debug:");
        console.log("  - userMessage:", userMessage);
        console.log("  - data keys:", Object.keys(data));
        
        // Your existing context analysis logic...
        const urgency = this.analyzeUrgency(userMessage, data.urgency);
        const context = this.analyzeContext(userMessage);
        
        return {
          originalContent: userMessage,
          rawContent: userMessage,
          urgency,
          context,
          timestamp: new Date().toISOString(),
          // ... rest of your context analysis
        };
        
      } catch (error) {
        console.error("Context Agent Error:", error);
        return {
          originalContent: "Error extracting message",
          rawContent: "Error extracting message", 
          urgency: { level: 0.5, emotionalState: "neutral", timePressure: 0.5 },
          error: error.message
        };
      }
    }
  }
  
  // Keep your existing Audit Agent stub
  class AuditAgent {
    async process(data) {
      // Temporary implementation until you build the full audit agent
      return {
        status: "success",
        auditTrail: [],
        complianceScore: 0.8,
        recommendations: ["Implement full audit logging"],
        note: "Audit agent stub - implement full functionality"
      };
    }
  }
  
  module.exports = { PolicyAgent, ContextAgent, AuditAgent };
  
  // Export standalone if needed
  if (typeof module !== 'undefined' && module.exports && !module.parent) {
    module.exports = PolicyAgent;
  }