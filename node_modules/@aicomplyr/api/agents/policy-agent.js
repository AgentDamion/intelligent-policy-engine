// Enhanced Policy Agent with Better Risk Calculation
// Replace your entire Policy Agent file with this version

class PolicyAgent {
    async process(data) {
      try {
        // Safe access to urgency level (keeping your existing logic)
        const urgencyLevel = data.contextOutput?.urgency?.level || 
                            data.urgency?.level || 
                            data.context?.urgency?.level || 
                            0.5; // default fallback
        

        
        // Enhanced risk calculation
        const riskScore = this.calculateEnhancedRiskScore({
          tool: data.tool,
          vendor: data.vendor,
          usage: data.usage,
          dataHandling: data.dataHandling,
          urgencyLevel
        });
        
        const decision = this.makeEnhancedDecision(riskScore, urgencyLevel);
        const riskLevel = this.getRiskLevel(riskScore);
        const riskFactors = this.getRiskFactors(data);
        const reasoning = this.getDecisionReasoning(riskScore, decision);
        
        // Return the complex structure your system expects
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
            level: riskLevel
          },
          decision: {
            decision: decision,
            type: decision === "approved" ? "auto_approval" : "requires_review",
            reasoning: reasoning,
            requires_escalation: decision === "rejected"
          },
          conditions: {
            guardrails: this.getGuardrails(riskScore, data)
          },
          monitoring: {
            requirements: this.getMonitoringRequirements(riskScore),
            escalation: riskScore > 0.7
          },
          escalation: riskScore > 0.7,
          next_steps: this.getNextSteps(decision)
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
    
    // ENHANCED RISK CALCULATION - This is the key improvement
    calculateEnhancedRiskScore({ tool, vendor, usage, dataHandling, urgencyLevel }) {
      let score = 0.1; // Lower base score than before
      

      
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
      
      const finalScore = Math.min(score, 1.0); // Cap at 1.0
      console.log(`    - TOTAL RISK SCORE: ${finalScore.toFixed(3)}`);
      
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
    
    getGuardrails(riskScore, data) {
      const guardrails = ["content_review"];
      
      if (riskScore > 0.5) {
        guardrails.push("enhanced_monitoring");
      }
      if (data.dataHandling?.toLowerCase().includes("pii")) {
        guardrails.push("data_protection_review");
      }
      
      return guardrails;
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