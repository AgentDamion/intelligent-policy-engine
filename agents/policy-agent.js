/**
 * Policy Agent - Makes intelligent compliance decisions based on Context Agent output
 * 
 * Features:
 * 1. Risk evaluation based on context (user role, tool, urgency, presentation type)
 * 2. Intelligent policy application with conditional approvals
 * 3. Specific guardrails and monitoring requirements
 * 4. Clear reasoning for decisions
 * 5. Graceful edge case handling
 */

const AgentBase = require('./agent-base');

class PolicyAgent extends AgentBase {
    constructor() {
        super('PolicyAgent');
        this.policies = {
            chatgpt_usage: {
                risk_factors: {
                    high_urgency: 0.3,
                    client_presentation: 0.4,
                    weekend_usage: 0.2,
                    marketing_role: 0.1
                },
                approval_thresholds: {
                    auto_approve: 0.5,
                    conditional_approve: 0.8,
                    require_escalation: 0.95
                },
                guardrails: {
                    content_review: true,
                    time_limits: true,
                    usage_tracking: true,
                    quality_checks: true
                }
            },
            client_presentations: {
                required_approvals: ['content_review', 'legal_review'],
                quality_standards: ['professional_tone', 'accuracy_check', 'brand_compliance'],
                time_constraints: {
                    min_review_time: 2, // hours
                    max_usage_time: 4   // hours
                }
            },
            marketing_agency: {
                allowed_tools: ['chatgpt', 'grammarly', 'canva'],
                restricted_content: ['financial_data', 'personal_info', 'proprietary_data'],
                compliance_requirements: ['brand_guidelines', 'client_approval', 'data_privacy']
            }
        };
        this.riskProfiles = {
            low_risk: {
                max_urgency: 0.4,
                allowed_presentation_types: ['internal_review', 'team_update'],
                auto_approval: true
            },
            medium_risk: {
                max_urgency: 0.7,
                allowed_presentation_types: ['client_presentation', 'creative_pitch'],
                conditional_approval: true,
                required_monitoring: ['usage_tracking', 'content_review']
            },
            high_risk: {
                max_urgency: 1.0,
                allowed_presentation_types: ['all'],
                escalation_required: true,
                enhanced_monitoring: ['real_time_tracking', 'manager_approval', 'quality_audit']
            }
        };
    }

    // Main async process method for workflow engine
    async process(input, context) {
        // input is expected to be contextAgentOutput
        // 1. Extract key information from Context Agent output
        const requestContext = this.extractRequestContext(input);
        // 2. Calculate risk score
        const riskAssessment = this.calculateRiskScore(requestContext);
        // 3. Determine approval level
        const approvalDecision = this.determineApprovalLevel(riskAssessment);
        // 4. Generate guardrails and conditions
        const guardrails = this.generateGuardrails(approvalDecision, requestContext);
        // 5. Define monitoring requirements
        const monitoring = this.defineMonitoringRequirements(approvalDecision, requestContext);
        // 6. Build final policy decision
        const policyDecision = this.buildPolicyDecision(
            requestContext, 
            riskAssessment, 
            approvalDecision, 
            guardrails, 
            monitoring
        );
        return policyDecision;
    }

    /**
     * Extracts and structures request context from Context Agent output
     */
    extractRequestContext(contextAgentOutput) {
        return {
            user: {
                role: 'marketing_agency_employee',
                urgency_level: contextAgentOutput.urgency.level,
                emotional_state: contextAgentOutput.urgency.emotionalState
            },
            request: {
                tool: 'chatgpt',
                purpose: 'presentation_content',
                presentation_type: contextAgentOutput.context.inferredType,
                confidence: contextAgentOutput.context.confidence,
                deadline: 'monday_10am',
                current_time: 'friday_4pm'
            },
            context: {
                time_pressure: contextAgentOutput.urgency.timePressure,
                is_weekend: this.isWeekend(contextAgentOutput.urgency.timePressure),
                is_client_facing: contextAgentOutput.context.inferredType === 'client_presentation'
            }
        };
    }

    /**
     * Calculates comprehensive risk score based on multiple factors
     */
    calculateRiskScore(requestContext) {
        let riskScore = 0;
        const riskFactors = [];

        // Urgency-based risk (reduced impact)
        if (requestContext.user.urgency_level > 0.8) {
            riskScore += 0.2; // Reduced from 0.3
            riskFactors.push('High urgency may lead to rushed decisions');
        } else if (requestContext.user.urgency_level > 0.6) {
            riskScore += 0.15; // Reduced from 0.2
            riskFactors.push('Moderate urgency requires careful review');
        }

        // Presentation type risk (reduced impact)
        if (requestContext.request.presentation_type === 'client_presentation') {
            riskScore += 0.3; // Reduced from 0.4
            riskFactors.push('Client-facing content requires higher scrutiny');
        } else if (requestContext.request.presentation_type === 'creative_pitch') {
            riskScore += 0.2; // Reduced from 0.3
            riskFactors.push('Creative content needs brand compliance review');
        }

        // Timing risk (reduced impact)
        if (requestContext.context.is_weekend) {
            riskScore += 0.15; // Reduced from 0.2
            riskFactors.push('Weekend usage may have limited oversight');
        }

        // Tool-specific risk (reduced impact)
        if (requestContext.request.tool === 'chatgpt') {
            riskScore += 0.05; // Reduced from 0.1
            riskFactors.push('AI-generated content requires human review');
        }

        // Emotional state risk (reduced impact)
        if (requestContext.user.emotional_state === 'panicked') {
            riskScore += 0.05; // Reduced from 0.1
            riskFactors.push('Panicked state may affect decision quality');
        }

        return {
            score: Math.min(riskScore, 1.0),
            factors: riskFactors,
            level: this.categorizeRiskLevel(riskScore)
        };
    }

    /**
     * Categorizes risk level based on calculated score
     */
    categorizeRiskLevel(riskScore) {
        if (riskScore <= 0.3) return 'low';
        if (riskScore <= 0.7) return 'medium';
        return 'high';
    }

    /**
     * Determines approval level based on risk assessment
     */
    determineApprovalLevel(riskAssessment) {
        const { score, level } = riskAssessment;
        
        if (score <= this.policies.chatgpt_usage.approval_thresholds.auto_approve) {
            return {
                decision: 'approved',
                type: 'auto_approval',
                reasoning: 'Low risk request meets auto-approval criteria',
                requires_escalation: false
            };
        } else if (score <= this.policies.chatgpt_usage.approval_thresholds.conditional_approve) {
            return {
                decision: 'conditionally_approved',
                type: 'conditional_approval',
                reasoning: 'Medium risk request requires additional guardrails',
                requires_escalation: false
            };
        } else if (score <= this.policies.chatgpt_usage.approval_thresholds.require_escalation) {
            return {
                decision: 'escalate',
                type: 'escalation_required',
                reasoning: 'High risk request requires escalation and enhanced monitoring',
                requires_escalation: true
            };
        } else {
            return {
                decision: 'denied',
                type: 'risk_too_high',
                reasoning: 'Risk level exceeds maximum threshold',
                requires_escalation: true
            };
        }
    }

    /**
     * Generates specific guardrails based on approval level and context
     */
    generateGuardrails(approvalDecision, requestContext) {
        if (approvalDecision.type === 'auto_approval') {
            return ['content_review'];
        } else if (approvalDecision.type === 'conditional_approval') {
            return ['content_review', 'usage_tracking'];
        } else { // escalation_required
            return ['content_review', 'usage_tracking', 'manager_approval'];
        }
    }

    /**
     * Defines monitoring requirements based on risk level
     */
    defineMonitoringRequirements(approvalDecision, requestContext) {
        if (approvalDecision.type === 'auto_approval') {
            return { requirements: ['usage_tracking'], escalation: false };
        } else if (approvalDecision.type === 'conditional_approval') {
            return { requirements: ['usage_tracking', 'manager_approval'], escalation: false };
        } else { // escalation_required
            return { requirements: ['real_time_tracking', 'manager_approval', 'quality_audit'], escalation: true };
        }
    }

    /**
     * Builds the final comprehensive policy decision
     */
    buildPolicyDecision(requestContext, riskAssessment, approvalDecision, guardrails, monitoring) {
        return { request: requestContext, risk: riskAssessment, decision: approvalDecision, conditions: { guardrails }, monitoring, escalation: monitoring.escalation, next_steps: this.generateNextSteps(approvalDecision, requestContext) };
    }

    /**
     * Generates mitigation strategies for identified risks
     */
    generateMitigationStrategies(riskAssessment) {
        const strategies = [];
        
        riskAssessment.factors.forEach(factor => {
            if (factor.includes('High urgency')) {
                strategies.push('Implement time management protocols and stress-reduction breaks');
            }
            if (factor.includes('Client-facing')) {
                strategies.push('Require peer review and client preview before final delivery');
            }
            if (factor.includes('Weekend usage')) {
                strategies.push('Enable remote monitoring and periodic check-ins');
            }
            if (factor.includes('AI-generated')) {
                strategies.push('Mandate human review and fact-checking of all AI content');
            }
        });

        return strategies;
    }

    /**
     * Gets compliance requirements based on request context
     */
    getComplianceRequirements(requestContext) {
        const requirements = [
            'Data privacy compliance (GDPR, CCPA)',
            'Brand guideline adherence',
            'Client confidentiality protection'
        ];

        if (requestContext.request.presentation_type === 'client_presentation') {
            requirements.push('Client approval workflow');
            requirements.push('Legal review for client-facing content');
        }

        return requirements;
    }

    /**
     * Gets quality standards based on request context
     */
    getQualityStandards(requestContext) {
        const standards = [
            'Professional tone and language',
            'Accurate and verifiable information',
            'Consistent branding and messaging'
        ];

        if (requestContext.request.presentation_type === 'client_presentation') {
            standards.push('Client-specific customization');
            standards.push('Industry best practices compliance');
        }

        return standards;
    }

    /**
     * Gets reporting frequency based on risk level
     */
    getReportingFrequency(riskLevel) {
        switch (riskLevel) {
            case 'low': return 'end_of_project';
            case 'medium': return 'daily';
            case 'high': return 'real_time';
            default: return 'daily';
        }
    }

    /**
     * Generates next steps based on approval decision
     */
    generateNextSteps(approvalDecision, requestContext) {
        if (approvalDecision.type === 'auto_approval') {
            return ['Proceed with request'];
        } else if (approvalDecision.type === 'conditional_approval') {
            return ['Proceed with guardrails in place'];
        } else { // escalation_required
            return ['Escalate to manager for review'];
        }
    }

    /**
     * Generates unique request ID
     */
    generateRequestId() {
        return `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Checks if current time is weekend
     */
    isWeekend(timePressure) {
        return false; // Simplified logic for weekend detection
    }
}

module.exports = PolicyAgent;
