const { AgentBase } = require('./agent-base');
const { analyzeWithAI } = require('./ai-service');

class ComplianceScoringAgent extends AgentBase {
  constructor() {
    super('ComplianceScoringAgent', 'Assesses risk and compliance scores for AI tools and vendors');
    this.complianceRules = new Map();
    this.riskFactors = new Map();
    this.scoringHistory = new Map();
    
    // Risk tier thresholds for LLM-based assessment
    this.riskTierThresholds = {
      minimal: { min: 0, max: 20 },
      low: { min: 21, max: 40 },
      medium: { min: 41, max: 60 },
      high: { min: 61, max: 80 },
      critical: { min: 81, max: 100 }
    };
    
    // Dimension weights (total = 100)
    this.dimensionWeights = {
      dataSensitivity: 25,
      externalExposure: 20,
      modelTransparency: 15,
      misuseVectors: 15,
      legalIPRisk: 15,
      operationalCriticality: 10
    };
    
    this.initializeComplianceRules();
    this.initializeRiskFactors();
  }

  initializeComplianceRules() {
    // GDPR Compliance Rules
    this.complianceRules.set('gdpr', {
      name: 'General Data Protection Regulation (GDPR)',
      weight: 25,
      rules: [
        {
          id: 'gdpr-001',
          name: 'Lawful Basis for Processing',
          description: 'Clear legal basis for data processing',
          maxScore: 20,
          check: (data) => this.checkLawfulBasis(data)
        },
        {
          id: 'gdpr-002',
          name: 'Data Subject Rights',
          description: 'Support for data subject rights (access, rectification, deletion)',
          maxScore: 20,
          check: (data) => this.checkDataSubjectRights(data)
        },
        {
          id: 'gdpr-003',
          name: 'Data Minimization',
          description: 'Only necessary data is collected and processed',
          maxScore: 15,
          check: (data) => this.checkDataMinimization(data)
        },
        {
          id: 'gdpr-004',
          name: 'Consent Management',
          description: 'Proper consent collection and management',
          maxScore: 15,
          check: (data) => this.checkConsentManagement(data)
        },
        {
          id: 'gdpr-005',
          name: 'Data Breach Notification',
          description: 'Timely notification of data breaches',
          maxScore: 15,
          check: (data) => this.checkDataBreachNotification(data)
        },
        {
          id: 'gdpr-006',
          name: 'Data Transfer Safeguards',
          description: 'Adequate safeguards for international data transfers',
          maxScore: 15,
          check: (data) => this.checkDataTransferSafeguards(data)
        }
      ]
    });

    // HIPAA Compliance Rules
    this.complianceRules.set('hipaa', {
      name: 'Health Insurance Portability and Accountability Act (HIPAA)',
      weight: 20,
      rules: [
        {
          id: 'hipaa-001',
          name: 'Privacy Rule Compliance',
          description: 'Compliance with HIPAA Privacy Rule',
          maxScore: 25,
          check: (data) => this.checkHIPAAPrivacyRule(data)
        },
        {
          id: 'hipaa-002',
          name: 'Security Rule Compliance',
          description: 'Compliance with HIPAA Security Rule',
          maxScore: 25,
          check: (data) => this.checkHIPAASecurityRule(data)
        },
        {
          id: 'hipaa-003',
          name: 'Breach Notification',
          description: 'Proper breach notification procedures',
          maxScore: 20,
          check: (data) => this.checkHIPAABreachNotification(data)
        },
        {
          id: 'hipaa-004',
          name: 'Business Associate Agreements',
          description: 'Proper BAA management',
          maxScore: 15,
          check: (data) => this.checkBusinessAssociateAgreements(data)
        },
        {
          id: 'hipaa-005',
          name: 'Training and Awareness',
          description: 'Staff training on HIPAA requirements',
          maxScore: 15,
          check: (data) => this.checkTrainingAndAwareness(data)
        }
      ]
    });

    // AI-Specific Compliance Rules
    this.complianceRules.set('ai-specific', {
      name: 'AI-Specific Compliance Requirements',
      weight: 30,
      rules: [
        {
          id: 'ai-001',
          name: 'Model Transparency',
          description: 'Explainability and interpretability of AI decisions',
          maxScore: 20,
          check: (data) => this.checkModelTransparency(data)
        },
        {
          id: 'ai-002',
          name: 'Training Data Quality',
          description: 'Quality and bias assessment of training data',
          maxScore: 20,
          check: (data) => this.checkTrainingDataQuality(data)
        },
        {
          id: 'ai-003',
          name: 'Human Oversight',
          description: 'Human oversight and intervention capabilities',
          maxScore: 15,
          check: (data) => this.checkHumanOversight(data)
        },
        {
          id: 'ai-004',
          name: 'Bias Detection',
          description: 'Bias detection and mitigation measures',
          maxScore: 15,
          check: (data) => this.checkBiasDetection(data)
        },
        {
          id: 'ai-005',
          name: 'Performance Monitoring',
          description: 'Continuous performance monitoring and validation',
          maxScore: 15,
          check: (data) => this.checkPerformanceMonitoring(data)
        },
        {
          id: 'ai-006',
          name: 'Audit Trail',
          description: 'Comprehensive audit trail for AI decisions',
          maxScore: 15,
          check: (data) => this.checkAuditTrail(data)
        }
      ]
    });

    // Industry-Specific Rules
    this.complianceRules.set('industry', {
      name: 'Industry-Specific Requirements',
      weight: 25,
      rules: [
        {
          id: 'industry-001',
          name: 'Financial Services',
          description: 'Compliance with financial regulations (SOX, GLBA)',
          maxScore: 25,
          check: (data) => this.checkFinancialCompliance(data)
        },
        {
          id: 'industry-002',
          name: 'Healthcare',
          description: 'Healthcare-specific compliance requirements',
          maxScore: 25,
          check: (data) => this.checkHealthcareCompliance(data)
        },
        {
          id: 'industry-003',
          name: 'Education',
          description: 'FERPA and educational privacy compliance',
          maxScore: 25,
          check: (data) => this.checkEducationCompliance(data)
        },
        {
          id: 'industry-004',
          name: 'Government',
          description: 'Government security and compliance requirements',
          maxScore: 25,
          check: (data) => this.checkGovernmentCompliance(data)
        }
      ]
    });
  }

  initializeRiskFactors() {
    // Data Risk Factors
    this.riskFactors.set('data', {
      name: 'Data Risk Assessment',
      weight: 30,
      factors: [
        {
          id: 'data-001',
          name: 'Sensitive Data Handling',
          riskLevel: 'high',
          score: 25,
          description: 'Handling of PII, PHI, or other sensitive data'
        },
        {
          id: 'data-002',
          name: 'Data Volume',
          riskLevel: 'medium',
          score: 15,
          description: 'Volume of data processed'
        },
        {
          id: 'data-003',
          name: 'Data Retention',
          riskLevel: 'medium',
          score: 15,
          description: 'Data retention policies and practices'
        },
        {
          id: 'data-004',
          name: 'Third-Party Sharing',
          riskLevel: 'high',
          score: 20,
          description: 'Sharing data with third parties'
        },
        {
          id: 'data-005',
          name: 'International Transfers',
          riskLevel: 'high',
          score: 25,
          description: 'International data transfers'
        }
      ]
    });

    // AI Model Risk Factors
    this.riskFactors.set('ai-model', {
      name: 'AI Model Risk Assessment',
      weight: 35,
      factors: [
        {
          id: 'ai-model-001',
          name: 'Model Complexity',
          riskLevel: 'medium',
          score: 15,
          description: 'Complexity of AI models'
        },
        {
          id: 'ai-model-002',
          name: 'Training Data Sources',
          riskLevel: 'high',
          score: 25,
          description: 'Sources and quality of training data'
        },
        {
          id: 'ai-model-003',
          name: 'Bias and Fairness',
          riskLevel: 'high',
          score: 25,
          description: 'Potential for bias and unfair outcomes'
        },
        {
          id: 'ai-model-004',
          name: 'Explainability',
          riskLevel: 'medium',
          score: 20,
          description: 'Ability to explain AI decisions'
        },
        {
          id: 'ai-model-005',
          name: 'Performance Reliability',
          riskLevel: 'medium',
          score: 15,
          description: 'Reliability of AI performance'
        }
      ]
    });

    // Operational Risk Factors
    this.riskFactors.set('operational', {
      name: 'Operational Risk Assessment',
      weight: 20,
      factors: [
        {
          id: 'operational-001',
          name: 'Security Controls',
          riskLevel: 'high',
          score: 30,
          description: 'Security controls and measures'
        },
        {
          id: 'operational-002',
          name: 'Incident Response',
          riskLevel: 'medium',
          score: 20,
          description: 'Incident response capabilities'
        },
        {
          id: 'operational-003',
          name: 'Business Continuity',
          riskLevel: 'medium',
          score: 20,
          description: 'Business continuity planning'
        },
        {
          id: 'operational-004',
          name: 'Vendor Management',
          riskLevel: 'medium',
          score: 15,
          description: 'Vendor management practices'
        },
        {
          id: 'operational-005',
          name: 'Compliance Monitoring',
          riskLevel: 'medium',
          score: 15,
          description: 'Ongoing compliance monitoring'
        }
      ]
    });

    // Regulatory Risk Factors
    this.riskFactors.set('regulatory', {
      name: 'Regulatory Risk Assessment',
      weight: 15,
      factors: [
        {
          id: 'regulatory-001',
          name: 'Regulatory Changes',
          riskLevel: 'high',
          score: 30,
          description: 'Exposure to regulatory changes'
        },
        {
          id: 'regulatory-002',
          name: 'Enforcement Actions',
          riskLevel: 'high',
          score: 25,
          description: 'History of enforcement actions'
        },
        {
          id: 'regulatory-003',
          name: 'Industry Standards',
          riskLevel: 'medium',
          score: 20,
          description: 'Compliance with industry standards'
        },
        {
          id: 'regulatory-004',
          name: 'Geographic Coverage',
          riskLevel: 'medium',
          score: 15,
          description: 'Geographic regulatory coverage'
        },
        {
          id: 'regulatory-005',
          name: 'Legal Precedents',
          riskLevel: 'medium',
          score: 10,
          description: 'Legal precedents and case law'
        }
      ]
    });
  }

  /**
   * Call LLM for analysis - wrapper around ai-service
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Object} options - LLM options (temperature, maxTokens)
   * @returns {Promise<string>} LLM response
   */
  async callLLM(prompt, options = {}) {
    try {
      const result = await analyzeWithAI(prompt, {
        temperature: options.temperature || 0.3,
        maxTokens: options.maxTokens || 1500
      });
      return result.response;
    } catch (error) {
      this.log(`LLM call failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Calculate 6-dimensional risk scores using LLM
   * @param {Object} context - Tool metadata and usage context
   * @returns {Promise<Object>} Dimension scores (0-100 scale)
   */
  async calculateDimensionScores(context) {
    const prompt = `Analyze this AI tool across 6 risk dimensions (score 0-100 for each):

**Tool Information:**
- Name: ${context.toolName || context.name || 'Unknown'}
- Vendor: ${context.vendorName || context.vendor || 'Unknown'}
- Use Case: ${context.useCase || context.usage || 'Not specified'}
- Data Types: ${context.dataTypes?.join(', ') || context.dataHandling || 'Not specified'}
- User Role: ${context.userRole || 'General user'}
- Deployment: ${context.deployment || 'Cloud-based'}

**Score each dimension (0=no risk, 100=critical risk):**

1. **Data Sensitivity & Privacy** (0-100)
   - Does it process PII, PHI, or regulated data?
   - What encryption/anonymization exists?
   - Risk of data leakage to unauthorized parties?

2. **External Exposure & Decision Impact** (0-100)
   - Is output customer-facing or public?
   - Does it drive high-stakes decisions (medical, legal, financial)?
   - Are human review mechanisms in place?

3. **Model Transparency** (0-100)
   - Black box vs. interpretable model?
   - Can decisions be explained to regulators?
   - Ability to audit model behavior?

4. **Misuse / Adversarial Vectors** (0-100)
   - Vulnerability to prompt injection attacks?
   - Risk of hallucinations or false outputs?
   - Input/output filtering strength?

5. **Legal / IP Risk** (0-100)
   - Potential copyright/trademark violations?
   - Risk of defamation or misinformation?
   - Regulatory compliance gaps?

6. **Operational Criticality** (0-100)
   - Business impact if tool fails or is unavailable?
   - Error tolerance (can mistakes be tolerated)?
   - Backup systems in place?

**Output format (JSON):**
{
  "dataSensitivity": <score>,
  "externalExposure": <score>,
  "modelTransparency": <score>,
  "misuseVectors": <score>,
  "legalIPRisk": <score>,
  "operationalCriticality": <score>,
  "rationale": {
    "dataSensitivity": "<brief explanation>",
    "externalExposure": "<brief explanation>",
    "modelTransparency": "<brief explanation>",
    "misuseVectors": "<brief explanation>",
    "legalIPRisk": "<brief explanation>",
    "operationalCriticality": "<brief explanation>"
  }
}`;

    try {
      const aiResponse = await this.callLLM(prompt, { 
        temperature: 0.3,
        maxTokens: 1500 
      });

      return this.parseDimensionScores(aiResponse);
    } catch (error) {
      this.log(`Dimension scoring failed, using fallback: ${error.message}`, 'error');
      // Fallback to default medium-risk scores
      return {
        dataSensitivity: 50,
        externalExposure: 50,
        modelTransparency: 50,
        misuseVectors: 50,
        legalIPRisk: 50,
        operationalCriticality: 50,
        rationale: {
          dataSensitivity: 'Default score (LLM unavailable)',
          externalExposure: 'Default score (LLM unavailable)',
          modelTransparency: 'Default score (LLM unavailable)',
          misuseVectors: 'Default score (LLM unavailable)',
          legalIPRisk: 'Default score (LLM unavailable)',
          operationalCriticality: 'Default score (LLM unavailable)'
        }
      };
    }
  }

  /**
   * Parse dimension scores from AI response
   * @param {string} aiResponse - Raw LLM response
   * @returns {Object} Parsed dimension scores
   */
  parseDimensionScores(aiResponse) {
    try {
      // Try to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          dataSensitivity: this.clampScore(parsed.dataSensitivity),
          externalExposure: this.clampScore(parsed.externalExposure),
          modelTransparency: this.clampScore(parsed.modelTransparency),
          misuseVectors: this.clampScore(parsed.misuseVectors),
          legalIPRisk: this.clampScore(parsed.legalIPRisk),
          operationalCriticality: this.clampScore(parsed.operationalCriticality),
          rationale: parsed.rationale || {}
        };
      }
    } catch (e) {
      this.log(`Failed to parse JSON dimension scores: ${e.message}`, 'error');
    }

    // Fallback: extract numbers from text
    return {
      dataSensitivity: this.extractScore(aiResponse, 'data sensitivity'),
      externalExposure: this.extractScore(aiResponse, 'external exposure'),
      modelTransparency: this.extractScore(aiResponse, 'transparency'),
      misuseVectors: this.extractScore(aiResponse, 'misuse'),
      legalIPRisk: this.extractScore(aiResponse, 'legal'),
      operationalCriticality: this.extractScore(aiResponse, 'operational'),
      rationale: {}
    };
  }

  /**
   * Calculate risk tier from dimension scores
   * Uses weighted algorithm aligned with NIST AI RMF
   * @param {Object} dimensionScores - The 6 dimension scores
   * @returns {string} Risk tier (minimal/low/medium/high/critical)
   */
  calculateRiskTier(dimensionScores) {
    const weights = {
      dataSensitivity: 0.25,        // Highest weight - data protection critical
      externalExposure: 0.20,       // Customer-facing = higher risk
      modelTransparency: 0.15,      // Explainability for regulatory compliance
      misuseVectors: 0.15,          // Security concerns
      legalIPRisk: 0.15,            // Regulatory violations
      operationalCriticality: 0.10  // Business continuity
    };

    const weightedScore = 
      dimensionScores.dataSensitivity * weights.dataSensitivity +
      dimensionScores.externalExposure * weights.externalExposure +
      dimensionScores.modelTransparency * weights.modelTransparency +
      dimensionScores.misuseVectors * weights.misuseVectors +
      dimensionScores.legalIPRisk * weights.legalIPRisk +
      dimensionScores.operationalCriticality * weights.operationalCriticality;

    // Tier thresholds based on industry standards
    if (weightedScore < 20) return 'minimal';   // Internal productivity tools
    if (weightedScore < 40) return 'low';       // Low-stakes content generation
    if (weightedScore < 60) return 'medium';    // Customer-facing, moderate risk
    if (weightedScore < 80) return 'high';      // Regulated data, high stakes
    return 'critical';                          // Medical/legal decisions, PII
  }

  /**
   * Generate tier-specific audit checklist
   * @param {string} tier - Risk tier
   * @param {Object} dimensionScores - Dimension scores for additional requirements
   * @returns {Array<string>} Audit checklist items
   */
  generateAuditChecklist(tier, dimensionScores) {
    // Base requirements for all tiers
    const baseChecklist = [
      'usage_tracking',
      'basic_logging',
      'access_controls',
      'data_retention_policy'
    ];

    // Tier-specific requirements
    const tierChecklists = {
      minimal: [
        'annual_review'
      ],
      low: [
        'quarterly_review',
        'content_spot_checks',
        'user_feedback_monitoring'
      ],
      medium: [
        'monthly_review',
        'enhanced_monitoring',
        'human_review_workflow',
        'data_protection_audit',
        'incident_response_plan'
      ],
      high: [
        'bi_weekly_review',
        'explainability_documentation',
        'bias_testing',
        'legal_compliance_sign_off',
        'third_party_audit',
        'regulatory_filing',
        'risk_assessment_update'
      ],
      critical: [
        'continuous_monitoring',
        'real_time_oversight',
        'full_model_audit',
        'adversarial_testing',
        'liability_insurance_verification',
        'regulatory_pre_approval',
        'weekly_compliance_check',
        'emergency_shutdown_plan'
      ]
    };

    // Dimension-specific additions (add if score > 70)
    const dimensionSpecific = [];
    if (dimensionScores.dataSensitivity > 70) {
      dimensionSpecific.push('data_privacy_impact_assessment', 'encryption_audit');
    }
    if (dimensionScores.externalExposure > 70) {
      dimensionSpecific.push('public_content_review', 'brand_safety_check');
    }
    if (dimensionScores.modelTransparency > 70) {
      dimensionSpecific.push('black_box_validation', 'interpretability_study');
    }
    if (dimensionScores.misuseVectors > 70) {
      dimensionSpecific.push('security_penetration_test', 'prompt_injection_defense');
    }
    if (dimensionScores.legalIPRisk > 70) {
      dimensionSpecific.push('ip_clearance', 'legal_risk_review');
    }
    if (dimensionScores.operationalCriticality > 70) {
      dimensionSpecific.push('business_continuity_plan', 'failover_testing');
    }

    return [
      ...baseChecklist,
      ...tierChecklists[tier],
      ...dimensionSpecific
    ];
  }

  /**
   * Helper: Clamp score to 0-100
   * @param {number|string} score - Score to clamp
   * @returns {number} Clamped score
   */
  clampScore(score) {
    const num = typeof score === 'number' ? score : parseInt(score) || 50;
    return Math.max(0, Math.min(100, num));
  }

  /**
   * Helper: Extract score from text
   * @param {string} text - Text to search
   * @param {string} keyword - Keyword to find score for
   * @returns {number} Extracted score or default 50
   */
  extractScore(text, keyword) {
    const regex = new RegExp(`${keyword}[:\\s-]*([0-9]{1,3})`, 'i');
    const match = text.match(regex);
    return match ? this.clampScore(parseInt(match[1])) : 50;
  }

  async assessCompliance(toolData, vendorData, extractionData) {
    try {
      this.log(`Starting compliance assessment for tool: ${toolData.name}`);
      
      const startTime = Date.now();
      
      // Step 1: Calculate LLM-based dimension scores
      const context = {
        toolName: toolData.name,
        vendorName: vendorData?.name,
        useCase: toolData.useCase || extractionData?.usage,
        dataTypes: toolData.dataTypes || extractionData?.dataTypes,
        dataHandling: toolData.dataHandling || extractionData?.dataHandling,
        userRole: toolData.userRole,
        deployment: toolData.deployment
      };
      
      const dimensionScores = await this.calculateDimensionScores(context);
      
      // Step 2: Determine risk tier from dimension scores
      const riskTier = this.calculateRiskTier(dimensionScores);
      
      // Step 3: Generate audit checklist based on tier and dimensions
      const auditChecklist = this.generateAuditChecklist(riskTier, dimensionScores);
      
      // Step 4: Perform traditional compliance scoring
      const complianceScores = await this.calculateComplianceScores(toolData, vendorData, extractionData);
      
      // Step 5: Perform traditional risk assessment
      const riskAssessment = await this.performRiskAssessment(toolData, vendorData, extractionData);
      
      // Step 6: Calculate overall compliance score
      const baseComplianceScore = this.calculateOverallComplianceScore(complianceScores);
      
      // Step 7: Apply tier multipliers to adjust compliance score
      const tierMultipliers = {
        minimal: 0.5,   // More lenient scoring
        low: 0.75,
        medium: 1.0,    // Standard scoring
        high: 1.5,      // Stricter requirements
        critical: 2.0   // Most stringent
      };
      
      const tierMultiplier = tierMultipliers[riskTier];
      const adjustedComplianceScore = Math.max(0, 
        baseComplianceScore - (100 - baseComplianceScore) * (tierMultiplier - 1)
      );
      
      // Step 8: Determine risk level (use traditional method)
      const riskLevel = this.determineRiskLevel(riskAssessment);
      
      // Step 9: Generate recommendations (include dimension-based recommendations)
      const recommendations = this.generateRecommendations(complianceScores, riskAssessment);
      
      const processingTime = Date.now() - startTime;
      
      const result = {
        toolId: toolData.id,
        toolName: toolData.name,
        vendorId: vendorData?.id,
        vendorName: vendorData?.name,
        assessmentDate: new Date().toISOString(),
        processingTime,
        // Traditional compliance results
        complianceScores,
        baseComplianceScore: Math.round(baseComplianceScore),
        overallComplianceScore: Math.round(adjustedComplianceScore),
        riskAssessment,
        riskLevel,
        recommendations,
        // NEW: LLM-based risk profile
        riskProfile: {
          tier: riskTier,
          dimensionScores: dimensionScores,
          auditChecklist: auditChecklist,
          tierMultiplier: tierMultiplier
        },
        metadata: {
          assessmentVersion: '2.0',
          llmEnabled: true,
          rulesApplied: Array.from(this.complianceRules.keys()),
          riskFactorsApplied: Array.from(this.riskFactors.keys())
        }
      };
      
      // Store assessment result
      this.scoringHistory.set(result.toolId, result);
      
      this.log(`Compliance assessment completed for ${toolData.name} in ${processingTime}ms`);
      this.log(`Risk Tier: ${riskTier.toUpperCase()}, Adjusted Score: ${result.overallComplianceScore}`);
      
      return result;
      
    } catch (error) {
      this.log(`Error during compliance assessment: ${error.message}`, 'error');
      throw error;
    }
  }

  async calculateComplianceScores(toolData, vendorData, extractionData) {
    const scores = {};
    
    for (const [framework, frameworkRules] of this.complianceRules) {
      scores[framework] = {
        name: frameworkRules.name,
        weight: frameworkRules.weight,
        rules: [],
        totalScore: 0,
        maxPossibleScore: 0,
        percentage: 0
      };
      
      for (const rule of frameworkRules.rules) {
        const ruleScore = await rule.check({
          tool: toolData,
          vendor: vendorData,
          extraction: extractionData
        });
        
        const ruleResult = {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          score: ruleScore,
          maxScore: rule.maxScore,
          percentage: (ruleScore / rule.maxScore) * 100,
          status: ruleScore >= rule.maxScore * 0.8 ? 'compliant' : 
                  ruleScore >= rule.maxScore * 0.6 ? 'partially_compliant' : 'non_compliant'
        };
        
        scores[framework].rules.push(ruleResult);
        scores[framework].totalScore += ruleScore;
        scores[framework].maxPossibleScore += rule.maxScore;
      }
      
      scores[framework].percentage = (scores[framework].totalScore / scores[framework].maxPossibleScore) * 100;
    }
    
    return scores;
  }

  async performRiskAssessment(toolData, vendorData, extractionData) {
    const assessment = {};
    
    for (const [category, categoryFactors] of this.riskFactors) {
      assessment[category] = {
        name: categoryFactors.name,
        weight: categoryFactors.weight,
        factors: [],
        totalRiskScore: 0,
        maxRiskScore: 0,
        riskLevel: 'low'
      };
      
      for (const factor of categoryFactors.factors) {
        const factorRiskScore = this.calculateFactorRiskScore(factor, {
          tool: toolData,
          vendor: vendorData,
          extraction: extractionData
        });
        
        const factorResult = {
          id: factor.id,
          name: factor.name,
          description: factor.description,
          riskLevel: factor.riskLevel,
          maxScore: factor.score,
          actualScore: factorRiskScore,
          percentage: (factorRiskScore / factor.score) * 100
        };
        
        assessment[category].factors.push(factorResult);
        assessment[category].totalRiskScore += factorRiskScore;
        assessment[category].maxRiskScore += factor.score;
      }
      
      assessment[category].riskLevel = this.determineCategoryRiskLevel(
        assessment[category].totalRiskScore,
        assessment[category].maxRiskScore
      );
    }
    
    return assessment;
  }

  calculateOverallComplianceScore(complianceScores) {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const [framework, score] of Object.entries(complianceScores)) {
      totalWeightedScore += score.percentage * score.weight;
      totalWeight += score.weight;
    }
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  determineRiskLevel(riskAssessment) {
    let totalRiskScore = 0;
    let totalMaxRisk = 0;
    
    for (const [category, assessment] of Object.entries(riskAssessment)) {
      totalRiskScore += assessment.totalRiskScore;
      totalMaxRisk += assessment.maxRiskScore;
    }
    
    const riskPercentage = totalMaxRisk > 0 ? (totalRiskScore / totalMaxRisk) * 100 : 0;
    
    if (riskPercentage >= 70) return 'critical';
    if (riskPercentage >= 50) return 'high';
    if (riskPercentage >= 30) return 'medium';
    return 'low';
  }

  determineCategoryRiskLevel(totalScore, maxScore) {
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    if (percentage >= 70) return 'critical';
    if (percentage >= 50) return 'high';
    if (percentage >= 30) return 'medium';
    return 'low';
  }

  generateRecommendations(complianceScores, riskAssessment) {
    const recommendations = [];
    
    // Compliance recommendations
    for (const [framework, score] of Object.entries(complianceScores)) {
      if (score.percentage < 80) {
        const nonCompliantRules = score.rules.filter(rule => rule.status !== 'compliant');
        if (nonCompliantRules.length > 0) {
          recommendations.push({
            type: 'compliance',
            framework,
            priority: score.percentage < 60 ? 'high' : 'medium',
            message: `Improve ${framework} compliance by addressing ${nonCompliantRules.length} non-compliant areas`,
            details: nonCompliantRules.map(rule => rule.name)
          });
        }
      }
    }
    
    // Risk mitigation recommendations
    for (const [category, assessment] of Object.entries(riskAssessment)) {
      if (assessment.riskLevel === 'high' || assessment.riskLevel === 'critical') {
        const highRiskFactors = assessment.factors.filter(factor => 
          factor.riskLevel === 'high' || factor.percentage > 70
        );
        
        if (highRiskFactors.length > 0) {
          recommendations.push({
            type: 'risk_mitigation',
            category,
            priority: assessment.riskLevel === 'critical' ? 'critical' : 'high',
            message: `Mitigate ${category} risks by addressing ${highRiskFactors.length} high-risk factors`,
            details: highRiskFactors.map(factor => factor.name)
          });
        }
      }
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Compliance check methods (simplified implementations)
  async checkLawfulBasis(data) {
    // Implementation would check for clear legal basis
    return Math.floor(Math.random() * 20) + 10; // Mock score
  }

  async checkDataSubjectRights(data) {
    // Implementation would check for data subject rights support
    return Math.floor(Math.random() * 20) + 10; // Mock score
  }

  async checkDataMinimization(data) {
    // Implementation would check for data minimization practices
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  async checkConsentManagement(data) {
    // Implementation would check for consent management
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  async checkDataBreachNotification(data) {
    // Implementation would check for breach notification procedures
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  async checkDataTransferSafeguards(data) {
    // Implementation would check for data transfer safeguards
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  // HIPAA check methods
  async checkHIPAAPrivacyRule(data) {
    return Math.floor(Math.random() * 25) + 15; // Mock score
  }

  async checkHIPAASecurityRule(data) {
    return Math.floor(Math.random() * 25) + 15; // Mock score
  }

  async checkHIPAABreachNotification(data) {
    return Math.floor(Math.random() * 20) + 12; // Mock score
  }

  async checkBusinessAssociateAgreements(data) {
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  async checkTrainingAndAwareness(data) {
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  // AI-specific check methods
  async checkModelTransparency(data) {
    return Math.floor(Math.random() * 20) + 12; // Mock score
  }

  async checkTrainingDataQuality(data) {
    return Math.floor(Math.random() * 20) + 12; // Mock score
  }

  async checkHumanOversight(data) {
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  async checkBiasDetection(data) {
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  async checkPerformanceMonitoring(data) {
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  async checkAuditTrail(data) {
    return Math.floor(Math.random() * 15) + 8; // Mock score
  }

  // Industry-specific check methods
  async checkFinancialCompliance(data) {
    return Math.floor(Math.random() * 25) + 15; // Mock score
  }

  async checkHealthcareCompliance(data) {
    return Math.floor(Math.random() * 25) + 15; // Mock score
  }

  async checkEducationCompliance(data) {
    return Math.floor(Math.random() * 25) + 15; // Mock score
  }

  async checkGovernmentCompliance(data) {
    return Math.floor(Math.random() * 25) + 15; // Mock score
  }

  calculateFactorRiskScore(factor, data) {
    // Implementation would calculate actual risk scores based on data
    // For now, return a mock score
    return Math.floor(Math.random() * factor.score) + 1;
  }

  async getAssessmentHistory(limit = 50) {
    const history = Array.from(this.scoringHistory.values());
    return history
      .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate))
      .slice(0, limit);
  }

  async getAssessmentById(toolId) {
    return this.scoringHistory.get(toolId) || null;
  }

  getComplianceRules() {
    return Array.from(this.complianceRules.values()).map(rule => ({
      id: rule.name,
      name: rule.name,
      weight: rule.weight,
      ruleCount: rule.rules.length
    }));
  }

  getRiskFactors() {
    return Array.from(this.riskFactors.values()).map(factor => ({
      id: factor.name,
      name: factor.name,
      weight: factor.weight,
      factorCount: factor.factors.length
    }));
  }

  getStatus() {
    return {
      totalAssessments: this.scoringHistory.size,
      complianceFrameworks: this.complianceRules.size,
      riskCategories: this.riskFactors.size,
      lastAssessment: this.scoringHistory.size > 0 ? 
        Array.from(this.scoringHistory.values())
          .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate))[0].assessmentDate : null
    };
  }
}

module.exports = ComplianceScoringAgent;
