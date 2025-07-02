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

class PolicyAgent {
    constructor() {
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

    /**
     * Main entry point - evaluates Context Agent output and makes compliance decision
     */
    evaluateRequest(contextAgentOutput) {
        console.log('🔒 Policy Agent Evaluating Request...\n');
        
        // 1. Extract key information from Context Agent output
        const requestContext = this.extractRequestContext(contextAgentOutput);
        
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
                decision: 'approved',
                type: 'conditional_approval',
                reasoning: 'Medium risk request approved with conditions',
                requires_escalation: false
            };
        } else if (score <= this.policies.chatgpt_usage.approval_thresholds.require_escalation) {
            return {
                decision: 'approved',
                type: 'escalated_approval',
                reasoning: 'High risk request requires manager approval',
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
        const guardrails = {
            content_review: {
                required: true,
                type: 'peer_review',
                timeframe: 'before_presentation',
                reviewer: 'senior_marketing_team_member'
            },
            time_limits: {
                max_usage_time: 4, // hours
                deadline: 'sunday_6pm',
                reminder_intervals: [2, 1, 0.5] // hours before deadline
            },
            quality_checks: {
                required: true,
                checks: ['grammar', 'brand_compliance', 'fact_accuracy'],
                automated_tools: ['grammarly', 'brand_checker']
            }
        };

        // Add escalation requirements for high-risk requests
        if (approvalDecision.requires_escalation) {
            guardrails.escalation = {
                required: true,
                approver: 'marketing_director',
                timeframe: 'within_2_hours',
                documentation: 'risk_assessment_report'
            };
        }

        // Add client-specific guardrails for client presentations
        if (requestContext.request.presentation_type === 'client_presentation') {
            guardrails.client_approval = {
                required: true,
                type: 'content_preview',
                timeframe: 'before_presentation',
                contact: 'client_project_manager'
            };
        }

        // Add weekend-specific guardrails
        if (requestContext.context.is_weekend) {
            guardrails.weekend_monitoring = {
                required: true,
                type: 'periodic_check_ins',
                frequency: 'every_2_hours',
                contact: 'on_call_manager'
            };
        }

        return guardrails;
    }

    /**
     * Defines monitoring requirements based on risk level
     */
    defineMonitoringRequirements(approvalDecision, requestContext) {
        const monitoring = {
            usage_tracking: {
                enabled: true,
                metrics: ['time_spent', 'content_generated', 'revisions_made'],
                alerts: ['time_limit_approaching', 'unusual_activity']
            },
            quality_monitoring: {
                enabled: true,
                checks: ['content_quality', 'brand_compliance', 'accuracy'],
                frequency: 'real_time'
            }
        };

        // Enhanced monitoring for high-risk requests
        if (approvalDecision.type === 'escalated_approval') {
            monitoring.enhanced_tracking = {
                enabled: true,
                features: ['screen_recording', 'keystroke_logging', 'real_time_review'],
                duration: 'until_presentation_complete'
            };
        }

        // Client presentation monitoring
        if (requestContext.request.presentation_type === 'client_presentation') {
            monitoring.client_feedback = {
                enabled: true,
                collection: 'post_presentation',
                metrics: ['client_satisfaction', 'presentation_effectiveness']
            };
        }

        return monitoring;
    }

    /**
     * Builds the final comprehensive policy decision
     */
    buildPolicyDecision(requestContext, riskAssessment, approvalDecision, guardrails, monitoring) {
        const decision = {
            timestamp: new Date().toISOString(),
            request_id: this.generateRequestId(),
            
            // Decision summary
            decision: {
                status: approvalDecision.decision,
                type: approvalDecision.type,
                reasoning: approvalDecision.reasoning,
                effective_immediately: approvalDecision.decision === 'approved'
            },

            // Risk assessment
            risk: {
                score: riskAssessment.score,
                level: riskAssessment.level,
                factors: riskAssessment.factors,
                mitigation_strategies: this.generateMitigationStrategies(riskAssessment)
            },

            // Conditions and guardrails
            conditions: {
                guardrails: guardrails,
                compliance_requirements: this.getComplianceRequirements(requestContext),
                quality_standards: this.getQualityStandards(requestContext)
            },

            // Monitoring and oversight
            monitoring: {
                requirements: monitoring,
                audit_trail: true,
                reporting_frequency: this.getReportingFrequency(riskAssessment.level)
            },

            // Next steps
            next_steps: this.generateNextSteps(approvalDecision, requestContext),
            
            // Escalation info
            escalation: approvalDecision.requires_escalation ? {
                required: true,
                approver: 'marketing_director',
                contact_info: 'director@agency.com',
                timeframe: 'within_2_hours'
            } : null
        };

        return decision;
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
        const steps = [];

        if (approvalDecision.decision === 'approved') {
            steps.push('Proceed with ChatGPT usage according to specified guardrails');
            steps.push('Set up monitoring and tracking systems');
            steps.push('Schedule content review sessions');
        }

        if (approvalDecision.requires_escalation) {
            steps.push('Contact marketing director for approval');
            steps.push('Prepare risk assessment documentation');
            steps.push('Await escalation decision before proceeding');
        }

        if (requestContext.request.presentation_type === 'client_presentation') {
            steps.push('Coordinate with client for content preview');
            steps.push('Schedule legal review if required');
        }

        return steps;
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
        return timePressure > 0.5; // Simplified logic for weekend detection
    }
}

// Test the Policy Agent with Context Agent output
function testPolicyAgent() {
    const policyAgent = new PolicyAgent();
    
    // Mock Context Agent output (from previous test)
    const mockContextOutput = {
        timestamp: "2025-06-28T23:25:39.648Z",
        urgency: {
            level: 1.0,
            emotionalState: "panicked",
            timePressure: 0.6
        },
        context: {
            inferredType: "client_presentation",
            confidence: 0.7,
            reasoning: [
                "Inferred client presentation based on marketing agency role",
                "Weekend before Monday presentation increases confidence"
            ]
        },
        clarification: {
            question: "Is this for the Johnson & Co. quarterly review we've been prepping?",
            purpose: "refine_context_and_urgency"
        },
        recommendations: [
            {
                priority: "high",
                action: "Start with ChatGPT immediately for content generation",
                reasoning: "High urgency detected - immediate action needed"
            },
            {
                priority: "medium",
                action: "Focus on professional tone and client-specific insights",
                reasoning: "Client presentation requires polished, professional content"
            }
        ],
        nextSteps: [
            "Immediately open ChatGPT",
            "Start with presentation outline",
            "Set aside 2-3 hours for focused work"
        ]
    };

    console.log('🔒 Testing Policy Agent...\n');
    
    const policyDecision = policyAgent.evaluateRequest(mockContextOutput);
    
    console.log('📋 POLICY DECISION:');
    console.log(JSON.stringify(policyDecision, null, 2));
    
    console.log('\n🎯 KEY DECISION POINTS:');
    console.log(`Status: ${policyDecision.decision.status.toUpperCase()}`);
    console.log(`Type: ${policyDecision.decision.type}`);
    console.log(`Risk Level: ${policyDecision.risk.level.toUpperCase()} (${(policyDecision.risk.score * 100).toFixed(0)}%)`);
    console.log(`Escalation Required: ${policyDecision.escalation ? 'YES' : 'NO'}`);
    
    console.log('\n🛡️ GUARDRAILS:');
    Object.keys(policyDecision.conditions.guardrails).forEach(guardrail => {
        console.log(`- ${guardrail}: ${policyDecision.conditions.guardrails[guardrail].required ? 'REQUIRED' : 'OPTIONAL'}`);
    });
    
    console.log('\n📊 MONITORING:');
    Object.keys(policyDecision.monitoring.requirements).forEach(monitor => {
        console.log(`- ${monitor}: ${policyDecision.monitoring.requirements[monitor].enabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
    console.log('\n📋 NEXT STEPS:');
    policyDecision.next_steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
    });
}

// Wrapper function for backend API
function processPolicy(contextOutput) {
    const agent = new PolicyAgent();
    return agent.evaluateRequest(contextOutput);  // Replace 'evaluateRequest' with the actual method name
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PolicyAgent, testPolicyAgent, processPolicy };
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
// testPolicyAgent();
}
