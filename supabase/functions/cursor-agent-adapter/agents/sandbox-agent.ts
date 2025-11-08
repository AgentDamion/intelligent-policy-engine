import { Agent } from '../cursor-agent-registry.ts'
import { aiClient, AIRequest } from '../shared/ai-client.ts'

/**
 * SandboxAgent - AI-powered policy simulation and testing agent
 * 
 * Capabilities:
 * - simulate_policy_execution: Execute policy against test scenarios with AI validation
 * - validate_test_scenario: Analyze test scenarios for completeness and realism
 * - generate_test_scenarios: AI-generated test scenarios based on policy content
 * - analyze_simulation_results: Deep analysis of simulation outputs
 * - suggest_controls: Recommend appropriate sandbox controls based on policy risk
 * - detect_anomalies: Identify unexpected behaviors in simulation results
 * - generate_report_insights: AI-powered insights for export reports
 */
export class SandboxAgent implements Agent {
  async process(input: any, context: any): Promise<any> {
    const action = input.action || 'simulate_policy_execution'
    console.log(`🧪 SandboxAgent processing: ${action}`)

    switch (action) {
      case 'simulate_policy_execution':
        return await this.simulateExecution(input, context)
      case 'validate_test_scenario':
        return await this.validateScenario(input, context)
      case 'generate_test_scenarios':
        return await this.generateScenarios(input, context)
      case 'analyze_simulation_results':
        return await this.analyzeResults(input, context)
      case 'suggest_controls':
        return await this.suggestControls(input, context)
      case 'detect_anomalies':
        return await this.detectAnomalies(input, context)
      case 'generate_report_insights':
        return await this.generateInsights(input, context)
      default:
        throw new Error(`Unknown SandboxAgent action: ${action}`)
    }
  }

  getInfo() {
    return { name: 'SandboxAgent', type: 'PolicySimulation' }
  }

  // ============================================
  // CORE ACTIONS
  // ============================================

  /**
   * Simulate policy execution against a test scenario
   * Uses AI to validate policy logic and predict outcomes
   */
  private async simulateExecution(input: any, context: any): Promise<any> {
    const startTime = Date.now()

    const aiRequest: AIRequest = {
      prompt: this.buildSimulationPrompt(input),
      context: {
        policy: input.policy,
        scenario: input.scenario,
        controls: input.controls,
        enterpriseId: context.enterprise_id
      },
      agentType: 'sandbox',
      enterpriseId: context.enterprise_id,
      temperature: 0.3, // Lower temp for consistent policy evaluation
      maxTokens: 2500
    }

    const aiResponse = await aiClient.processRequest(aiRequest)
    const aiAnalysis = this.parseAIResponse(aiResponse.content)

    // Calculate validation status based on AI analysis
    const validationStatus = this.determineValidationStatus(aiAnalysis, input.policy)
    const complianceScore = this.calculateComplianceScore(aiAnalysis)
    const riskFlags = this.extractRiskFlags(aiAnalysis)

    return {
      simulation_result: {
        validation_status: validationStatus,
        compliance_score: complianceScore,
        risk_flags: riskFlags,
        outputs: {
          policy_outcome: aiAnalysis.policy_outcome || 'approved',
          conditions: aiAnalysis.conditions || [],
          required_actions: aiAnalysis.required_actions || [],
          control_checks: aiAnalysis.control_checks || {},
          data_flows: aiAnalysis.data_flows || [],
          risk_assessment: aiAnalysis.risk_assessment || {}
        },
        ai_confidence: aiAnalysis.confidence || aiResponse.confidence,
        agent_insights: {
          simulation_analysis: aiResponse.reasoning,
          key_findings: aiAnalysis.metadata?.key_findings || aiAnalysis.key_findings || [],
          recommendations: aiAnalysis.recommendations || [],
          edge_cases_identified: aiAnalysis.edge_cases || [],
          compliance_gaps: aiAnalysis.compliance_gaps || []
        }
      },
      metadata: {
        processing_time_ms: Date.now() - startTime,
        ai_provider: aiResponse.metadata.provider,
        ai_model: aiResponse.metadata.model,
        agent_version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Validate test scenario for completeness and realism
   */
  private async validateScenario(input: any, context: any): Promise<any> {
    const aiRequest: AIRequest = {
      prompt: `Validate this test scenario for policy simulation:
      
SCENARIO DETAILS:
${JSON.stringify(input.scenario, null, 2)}

POLICY CONTEXT:
${JSON.stringify(input.policy, null, 2)}

VALIDATION CRITERIA:
1. Realistic test parameters (Do inputs reflect real-world usage?)
2. Edge case coverage (Are boundary conditions tested?)
3. Data quality (Are test inputs complete and valid?)
4. Expected outcome clarity (Is the expected result well-defined?)
5. Missing test conditions (What scenarios are not covered?)

Provide:
- is_valid: boolean
- completeness_score: 0-1
- issues: array of validation issues found
- suggestions: array of improvement suggestions
- edge_cases_missing: scenarios that should be added

Return as structured JSON.`,
      context: input,
      agentType: 'sandbox',
      enterpriseId: context.enterprise_id,
      temperature: 0.2,
      maxTokens: 1500
    }

    const aiResponse = await aiClient.processRequest(aiRequest)
    const aiAnalysis = this.parseAIResponse(aiResponse.content)

    return {
      is_valid: aiAnalysis.is_valid !== false,
      completeness_score: aiAnalysis.completeness_score || 0.8,
      issues: aiAnalysis.issues || [],
      suggestions: aiAnalysis.suggestions || [],
      edge_cases_missing: aiAnalysis.edge_cases_missing || [],
      confidence: aiResponse.confidence,
      reasoning: aiResponse.reasoning
    }
  }

  /**
   * Generate realistic test scenarios based on policy content
   */
  private async generateScenarios(input: any, context: any): Promise<any> {
    const count = input.count || 5

    const aiRequest: AIRequest = {
      prompt: `Generate ${count} realistic test scenarios for this policy:

POLICY DETAILS:
${JSON.stringify(input.policy, null, 2)}

For each scenario, provide:
1. scenario_name: Descriptive name
2. scenario_description: Brief description of what's being tested
3. test_inputs: {
   - tool: AI tool being used
   - data_class: Type of data (PHI, PII, financial, etc.)
   - jurisdiction: Geographic region (US, EU, etc.)
   - usage_context: How the tool will be used
   - user_role: Who is requesting usage
}
4. expected_outcome: "approved" | "rejected" | "needs_review"
5. expected_conditions: Array of conditions that should be applied
6. risk_level: "low" | "medium" | "high"
7. edge_case_type: What edge case this tests (e.g., "boundary_condition", "compliance_edge", "risk_threshold")

Focus on:
- Realistic business scenarios
- Edge cases and boundary conditions
- Common compliance pitfalls
- Risk threshold testing
- Data sensitivity variations

Return as JSON array: { "scenarios": [...] }`,
      context: input,
      agentType: 'sandbox',
      enterpriseId: context.enterprise_id,
      temperature: 0.7, // Higher creativity for scenario generation
      maxTokens: 3000
    }

    const aiResponse = await aiClient.processRequest(aiRequest)
    const result = this.parseAIResponse(aiResponse.content)

    return {
      scenarios: result.scenarios || result || [],
      confidence: aiResponse.confidence,
      generation_metadata: {
        total_generated: (result.scenarios || result || []).length,
        ai_model: aiResponse.metadata.model,
        ai_provider: aiResponse.metadata.provider
      }
    }
  }

  /**
   * Deep analysis of simulation results
   */
  private async analyzeResults(input: any, context: any): Promise<any> {
    const aiRequest: AIRequest = {
      prompt: `Perform deep analysis of these policy simulation results:

SIMULATION RESULTS:
${JSON.stringify(input.results, null, 2)}

ORIGINAL POLICY:
${JSON.stringify(input.policy, null, 2)}

EXPECTED VS ACTUAL:
Expected: ${JSON.stringify(input.expected_outcome, null, 2)}
Actual: ${JSON.stringify(input.results?.outputs, null, 2)}

ANALYSIS REQUIREMENTS:
1. Overall assessment (Did the simulation perform as expected?)
2. Compliance gaps identified (Where does the policy fall short?)
3. Risk patterns detected (What risks emerged during simulation?)
4. Policy effectiveness (How well does the policy achieve its goals?)
5. Improvement recommendations (What should be changed?)
6. Edge cases to address (What scenarios need more coverage?)

Provide structured analysis in JSON format.`,
      context: input,
      agentType: 'sandbox',
      enterpriseId: context.enterprise_id,
      temperature: 0.3,
      maxTokens: 2000
    }

    const aiResponse = await aiClient.processRequest(aiRequest)
    const analysis = this.parseAIResponse(aiResponse.content)

    return {
      overall_assessment: analysis.overall_assessment || analysis.analysis || aiResponse.content,
      compliance_gaps: analysis.compliance_gaps || [],
      risk_patterns: analysis.risk_patterns || [],
      policy_effectiveness_score: analysis.policy_effectiveness_score || 0.8,
      recommendations: analysis.recommendations || [],
      edge_cases_to_address: analysis.edge_cases_to_address || [],
      confidence: aiResponse.confidence,
      detailed_reasoning: aiResponse.reasoning
    }
  }

  /**
   * Suggest appropriate sandbox controls based on policy characteristics
   */
  private async suggestControls(input: any, context: any): Promise<any> {
    const aiRequest: AIRequest = {
      prompt: `Suggest appropriate sandbox controls for this policy simulation:

POLICY CHARACTERISTICS:
- Policy Risk Level: ${input.policy_risk || 'medium'}
- Data Sensitivity: ${input.data_sensitivity || 'medium'}
- Jurisdiction: ${input.jurisdiction || 'US'}
- Industry: ${input.industry || 'general'}
- Regulatory Frameworks: ${JSON.stringify(input.regulatory_frameworks || ['GDPR', 'CCPA'])}

AVAILABLE CONTROL TYPES:
1. Data Classification Controls
2. Vendor Vetting Controls
3. Access Control Requirements
4. Data Retention Policies
5. Encryption Requirements
6. Audit Trail Requirements
7. Human Review Thresholds
8. Risk Mitigation Steps

For each recommended control, provide:
- control_type: Type of control
- control_name: Specific name
- severity: "low" | "medium" | "high" | "critical"
- rationale: Why this control is needed
- configuration: Suggested settings

Categorize as:
- required_controls: Must-have controls
- recommended_controls: Best practice controls
- optional_controls: Nice-to-have controls
- control_settings: { strict: "...", moderate: "...", lenient: "..." }

Return structured JSON.`,
      context: input,
      agentType: 'sandbox',
      enterpriseId: context.enterprise_id,
      temperature: 0.4,
      maxTokens: 1500
    }

    const aiResponse = await aiClient.processRequest(aiRequest)
    const controls = this.parseAIResponse(aiResponse.content)

    return {
      required_controls: controls.required_controls || [],
      recommended_controls: controls.recommended_controls || [],
      optional_controls: controls.optional_controls || [],
      control_settings: controls.control_settings || { strict: true, moderate: false, lenient: false },
      total_controls_suggested: (controls.required_controls || []).length + (controls.recommended_controls || []).length,
      confidence: aiResponse.confidence,
      reasoning: aiResponse.reasoning
    }
  }

  /**
   * Detect anomalies and unexpected behaviors in simulation results
   */
  private async detectAnomalies(input: any, context: any): Promise<any> {
    const aiRequest: AIRequest = {
      prompt: `Detect anomalies and unexpected behaviors in these simulation results:

SIMULATION RESULTS:
${JSON.stringify(input.simulation_results, null, 2)}

EXPECTED BEHAVIOR:
${JSON.stringify(input.expected_behavior, null, 2)}

POLICY BASELINE:
${JSON.stringify(input.policy, null, 2)}

ANOMALY DETECTION FOCUS:
1. Unexpected outcomes (Results that don't match expected behavior)
2. Policy drift indicators (Signs the policy isn't working as designed)
3. Compliance violations (Regulatory requirements not met)
4. Performance anomalies (Unusual processing times or patterns)
5. Data quality issues (Invalid or suspicious data in results)
6. Risk score inconsistencies (Risk scores that don't align with findings)

For each anomaly found:
- anomaly_type: Category of anomaly
- severity: "low" | "medium" | "high" | "critical"
- description: What was detected
- impact: Potential business impact
- recommendation: How to address

Return structured JSON with:
- anomalies: array of detected anomalies
- overall_severity: highest severity found
- requires_attention: boolean (should this be escalated?)
- suggested_actions: immediate next steps`,
      context: input,
      agentType: 'sandbox',
      enterpriseId: context.enterprise_id,
      temperature: 0.2, // Lower temp for consistent detection
      maxTokens: 1500
    }

    const aiResponse = await aiClient.processRequest(aiRequest)
    const anomalies = this.parseAIResponse(aiResponse.content)

    return {
      anomalies_detected: anomalies.anomalies || [],
      overall_severity: anomalies.overall_severity || this.calculateOverallSeverity(anomalies.anomalies || []),
      requires_attention: anomalies.requires_attention || (anomalies.anomalies || []).length > 0,
      suggested_actions: anomalies.suggested_actions || [],
      detection_confidence: aiResponse.confidence,
      detailed_analysis: aiResponse.reasoning
    }
  }

  /**
   * Generate executive-level insights for export reports
   */
  private async generateInsights(input: any, context: any): Promise<any> {
    const aiRequest: AIRequest = {
      prompt: `Generate executive-level insights for this policy sandbox run:

SIMULATION DATA:
${JSON.stringify(input.simulation_data, null, 2)}

REPORT REQUIREMENTS:
Create a professional, business-appropriate report with:

1. EXECUTIVE SUMMARY (2-3 sentences)
   - High-level overview of what was tested
   - Key outcome (passed/failed/needs review)
   - Overall risk assessment

2. KEY FINDINGS (3-5 bullet points)
   - Most important discoveries
   - Critical compliance issues (if any)
   - Notable risks identified

3. RISK SUMMARY (paragraph)
   - Overall risk assessment
   - Risk level with justification
   - Risk mitigation status

4. COMPLIANCE SUMMARY (paragraph)
   - Compliance score interpretation
   - Regulatory requirements met/unmet
   - Compliance recommendations

5. NEXT ACTIONS (3-5 items)
   - Specific, actionable next steps
   - Prioritized recommendations
   - Responsible parties (generic roles)

TONE: Professional, clear, executive-appropriate
FORMAT: Structured JSON with sections above

Return comprehensive insights.`,
      context: input,
      agentType: 'sandbox',
      enterpriseId: context.enterprise_id,
      temperature: 0.5, // Balanced creativity and consistency
      maxTokens: 2000
    }

    const aiResponse = await aiClient.processRequest(aiRequest)
    const insights = this.parseAIResponse(aiResponse.content)

    return {
      executive_summary: insights.executive_summary || this.generateFallbackSummary(input.simulation_data),
      key_findings: insights.key_findings || [],
      risk_summary: insights.risk_summary || '',
      compliance_summary: insights.compliance_summary || '',
      next_actions: insights.next_actions || [],
      report_metadata: {
        generated_at: new Date().toISOString(),
        confidence: aiResponse.confidence,
        ai_model: aiResponse.metadata.model,
        ai_provider: aiResponse.metadata.provider
      }
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private buildSimulationPrompt(input: any): string {
    return `Execute a comprehensive policy simulation with AI-powered validation:

POLICY DETAILS:
${JSON.stringify(input.policy, null, 2)}

TEST SCENARIO:
${JSON.stringify(input.scenario, null, 2)}

SANDBOX CONTROLS:
${JSON.stringify(input.controls || {}, null, 2)}

SIMULATION REQUIREMENTS:
Simulate the policy execution step-by-step and provide:

1. VALIDATION STATUS: Would this policy approve, reject, or flag for review?
2. COMPLIANCE SCORE: 0-1 score (0=non-compliant, 1=fully compliant)
3. RISK FLAGS: Array of specific risks identified (e.g., ["data_privacy_risk", "vendor_risk"])
4. POLICY OUTCOME: "approved" | "rejected" | "needs_review"
5. CONDITIONS: Any conditions that must be met for approval
6. REQUIRED ACTIONS: Actions user must take before/after approval
7. CONTROL CHECKS: Status of each sandbox control (pass/fail)
8. CONFIDENCE: Your confidence in this assessment (0-1)
9. KEY FINDINGS: Important discoveries during simulation
10. RECOMMENDATIONS: Suggestions for policy improvement
11. EDGE CASES: Any edge cases identified

Return comprehensive structured JSON with all analysis details.`
  }

  private parseAIResponse(content: string): any {
    try {
      return JSON.parse(content)
    } catch {
      // Fallback if AI doesn't return valid JSON
      return {
        analysis: content,
        confidence: 0.7,
        reasoning: 'AI response parsed as text (JSON parsing failed)',
        metadata: {
          parse_error: true
        }
      }
    }
  }

  private determineValidationStatus(aiAnalysis: any, policy: any): boolean {
    // Validation passes if:
    // 1. AI analysis indicates approval or conditional approval
    // 2. No critical risks identified
    // 3. Compliance score above threshold
    const outcome = aiAnalysis.policy_outcome || aiAnalysis.outcome || 'approved'
    const complianceScore = aiAnalysis.compliance_score || 0.8
    const criticalRisks = (aiAnalysis.risk_flags || []).filter((r: string) => 
      r.includes('critical') || r.includes('severe')
    )

    return (outcome === 'approved' || outcome === 'needs_review') && 
           complianceScore >= 0.6 && 
           criticalRisks.length === 0
  }

  private calculateComplianceScore(aiAnalysis: any): number {
    // Use AI-provided score if available, otherwise calculate
    if (aiAnalysis.compliance_score !== undefined) {
      return Math.max(0, Math.min(1, aiAnalysis.compliance_score))
    }

    // Fallback calculation based on outcome
    const outcome = aiAnalysis.policy_outcome || aiAnalysis.outcome || 'approved'
    const riskFlags = aiAnalysis.risk_flags || []
    
    let baseScore = 0.8
    if (outcome === 'rejected') baseScore = 0.3
    if (outcome === 'needs_review') baseScore = 0.6
    
    // Deduct for risk flags
    const riskPenalty = Math.min(0.3, riskFlags.length * 0.05)
    
    return Math.max(0, Math.min(1, baseScore - riskPenalty))
  }

  private extractRiskFlags(aiAnalysis: any): any[] {
    const riskFlags = aiAnalysis.risk_flags || aiAnalysis.risks || []
    
    // Ensure each risk flag is structured
    return riskFlags.map((flag: any) => {
      if (typeof flag === 'string') {
        return {
          type: flag,
          severity: 'medium',
          description: flag
        }
      }
      return flag
    })
  }

  private calculateOverallSeverity(anomalies: any[]): string {
    if (anomalies.length === 0) return 'low'
    
    const severities = anomalies.map(a => a.severity || 'low')
    if (severities.includes('critical')) return 'critical'
    if (severities.includes('high')) return 'high'
    if (severities.includes('medium')) return 'medium'
    return 'low'
  }

  private generateFallbackSummary(simulationData: any): string {
    const status = simulationData.status || 'completed'
    const complianceScore = simulationData.compliance_score || 0
    const riskFlags = simulationData.risk_flags || []

    return `Policy sandbox simulation ${status}. Compliance score: ${(complianceScore * 100).toFixed(0)}%. ${riskFlags.length} risk flag(s) identified. ${simulationData.validation_status ? 'Validation passed.' : 'Validation requires review.'}`
  }
}

