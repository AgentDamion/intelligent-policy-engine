/**
 * Conflict Detection Agent - Analyzes multiple policies for conflicts
 * Borrows structure from PolicyAgent but adapted for conflict detection
 * 
 * Features:
 * 1. Multi-policy comparison and analysis
 * 2. Conflict severity scoring (borrowed from risk assessment)
 * 3. Resolution strategy recommendations (borrowed from approval decisions)
 * 4. Visual conflict mapping and recommendations
 */

const { analyzeWithAI } = require('./ai-service');

class ConflictDetectionAgent {
    constructor() {
        this.conflictTypes = {
            direct_contradiction: {
                severity_weight: 0.9,
                examples: ['Policy A requires X, Policy B forbids X'],
                resolution_difficulty: 'high'
            },
            requirement_overlap: {
                severity_weight: 0.6,
                examples: ['Both policies require same approval but different process'],
                resolution_difficulty: 'medium'
            },
            scope_ambiguity: {
                severity_weight: 0.4,
                examples: ['Unclear which policy applies in specific situation'],
                resolution_difficulty: 'low'
            },
            timeline_conflict: {
                severity_weight: 0.7,
                examples: ['Policy A: 2 day approval, Policy B: 5 day approval'],
                resolution_difficulty: 'medium'
            }
        };

        this.severityThresholds = {
            auto_resolve: 0.3,      // Low severity - suggest automatic fixes
            manual_review: 0.7,     // Medium severity - require human review
            escalation_required: 0.9 // High severity - need management decision
        };

        this.resolutionStrategies = {
            policy_merge: 'Combine policies into single comprehensive document',
            priority_hierarchy: 'Establish which policy takes precedence',
            conditional_application: 'Define when each policy applies',
            requirement_standardization: 'Align conflicting requirements'
        };
    }

    /**
     * Main entry point - analyzes multiple policies for conflicts
     * Borrows structure from PolicyAgent.evaluateRequest()
     */
    async analyzeConflicts(policiesData) {
        console.log('⚡ Conflict Detection Agent Analyzing Policies...\n');

        // 1. Parse and structure policy data (similar to extractRequestContext)
        const structuredPolicies = this.parsePolicyDocuments(policiesData);
        
        // 2. Identify conflicts (similar to calculateRiskScore)
        const conflictAssessment = await this.identifyConflicts(structuredPolicies);        

        // 3. Determine resolution strategy (similar to determineApprovalLevel)
        const resolutionStrategy = this.determineResolutionStrategy(conflictAssessment);
        
        // 4. Generate recommendations (similar to generateGuardrails)
        const recommendations = this.generateRecommendations(resolutionStrategy, structuredPolicies);
        
        // 5. Create monitoring plan (similar to defineMonitoringRequirements)
        const implementationPlan = this.createImplementationPlan(resolutionStrategy, conflictAssessment);
        
        // 6. Build final conflict report (similar to buildPolicyDecision)
        const conflictReport = this.buildConflictReport(
            structuredPolicies,
            conflictAssessment,
            resolutionStrategy,
            recommendations,
            implementationPlan
        );
        
        return conflictReport;
    }

    /**
     * Parse policy documents into structured format
     * Similar to PolicyAgent.extractRequestContext()
     */
    parsePolicyDocuments(policiesData) {
        return policiesData.map((policy, index) => ({
            id: `policy_${index + 1}`,
            name: policy.name || `Policy ${index + 1}`,
            content: policy.content || policy.text,
            sections: this.extractPolicySections(policy.content),
            metadata: {
                length: policy.content?.length || 0,
                complexity: this.assessComplexity(policy.content),
                domain: this.identifyDomain(policy.content)
            }
        }));
    }

    /**
     * Identify conflicts between policies
     * Borrows logic from PolicyAgent.calculateRiskScore()
     */
    async identifyConflicts(structuredPolicies) {  // Add async
        const conflicts = [];
        let totalSeverity = 0;
    
        // Compare each policy pair
        for (let i = 0; i < structuredPolicies.length; i++) {
            for (let j = i + 1; j < structuredPolicies.length; j++) {
                const policyA = structuredPolicies[i];
                const policyB = structuredPolicies[j];
                
                const pairConflicts = await this.comparePolicyPair(policyA, policyB);  // Add await
                conflicts.push(...pairConflicts);
                
                totalSeverity += pairConflicts.reduce((sum, conflict) => sum + conflict.severity, 0);
            }
        }

        return {
            conflicts: conflicts,
            totalSeverity: totalSeverity,
            averageSeverity: conflicts.length > 0 ? totalSeverity / conflicts.length : 0,
            conflictCount: conflicts.length,
            severityLevel: this.categorizeSeverityLevel(totalSeverity / conflicts.length || 0)
        };
    }

    /**
     * Compare two policies and find conflicts
     * New method specific to conflict detection
     */
    async comparePolicyPair(policyA, policyB) {
        const conflicts = [];
    
        // First, use AI to analyze the policies
        const aiPrompt = `Analyze these two policies for conflicts:
        
        Policy A (${policyA.name}): ${policyA.content}
        
        Policy B (${policyB.name}): ${policyB.content}
        
        Identify:
        1. Direct contradictions
        2. Overlapping requirements with different processes
        3. Timeline conflicts
        4. Scope ambiguities
        
        For each conflict found, rate severity as low, medium, or high.`;
    
        try {
            const aiAnalysis = await analyzeWithAI(aiPrompt);
            console.log('AI Analysis:', aiAnalysis);
            
            // Use AI insights to enhance conflict detection
            // The AI response will help identify conflicts we might miss with pattern matching
        } catch (error) {
            console.error('AI analysis failed, falling back to pattern matching:', error);
        }
    
        // Keep your existing pattern-based detection as fallback
        const contradictions = await this.findContradictions(policyA, policyB);  // ADD await
        conflicts.push(...contradictions);
    
        const overlaps = this.findRequirementOverlaps(policyA, policyB);
        conflicts.push(...overlaps);
    
        const timelineConflicts = this.findTimelineConflicts(policyA, policyB);
        conflicts.push(...timelineConflicts);
    
        const ambiguities = this.findScopeAmbiguities(policyA, policyB);
        conflicts.push(...ambiguities);
    
        return conflicts;
    }

    /**
 * Find direct contradictions between policies
 */
async findContradictions(policyA, policyB) {
    const contradictions = [];
    
    // Add AI analysis for deeper contradiction detection
    const aiPrompt = `Are there any direct contradictions between these statements?
    Statement 1: ${policyA.content.substring(0, 500)}
    Statement 2: ${policyB.content.substring(0, 500)}
    
    Respond with: YES (explain) or NO`;
    
    try {
        const aiResult = await analyzeWithAI(aiPrompt);
        // Process AI response and add to contradictions if found
    } catch (error) {
        // Fall back to pattern matching
    }
    
    // Simple keyword-based contradiction detection
    const contradictionPatterns = [
        { pattern: /must|required|mandatory/, opposite: /prohibited|forbidden|not allowed/ },
        { pattern: /approve|allow|permit/, opposite: /deny|reject|prohibit/ },
        { pattern: /\d+\s*day/, opposite: /immediate|instant|same\s*day/ }
    ];

    contradictionPatterns.forEach(({ pattern, opposite }) => {
        const aHasPattern = pattern.test(policyA.content);
        const bHasOpposite = opposite.test(policyB.content);
        const bHasPattern = pattern.test(policyB.content);
        const aHasOpposite = opposite.test(policyA.content);

        if ((aHasPattern && bHasOpposite) || (bHasPattern && aHasOpposite)) {
            contradictions.push({
                type: 'direct_contradiction',
                severity: this.conflictTypes.direct_contradiction.severity_weight,
                policies: [policyA.id, policyB.id],
                description: `Direct contradiction found between ${policyA.name} and ${policyB.name}`,
                location: 'content_analysis',
                impact: 'high'
            });
        }
    });

    return contradictions;
}  // This closing brace was missing

    /**
     * Find requirement overlaps
     */
    findRequirementOverlaps(policyA, policyB) {
        const overlaps = [];
        
        // Look for similar requirements with different implementations
        const requirementKeywords = ['approval', 'review', 'authorization', 'consent', 'permission'];
        
        requirementKeywords.forEach(keyword => {
            const aHasRequirement = policyA.content.toLowerCase().includes(keyword);
            const bHasRequirement = policyB.content.toLowerCase().includes(keyword);
            
            if (aHasRequirement && bHasRequirement) {
                overlaps.push({
                    type: 'requirement_overlap',
                    severity: this.conflictTypes.requirement_overlap.severity_weight,
                    policies: [policyA.id, policyB.id],
                    description: `Both policies have ${keyword} requirements that may conflict`,
                    location: 'requirements_section',
                    impact: 'medium'
                });
            }
        });

        return overlaps;
    }

    /**
     * Find timeline conflicts
     */
    findTimelineConflicts(policyA, policyB) {
        const conflicts = [];
        
        // Extract timeline patterns
        const timelinePattern = /(\d+)\s*(day|hour|week|month)/g;
        const aTimelines = [...policyA.content.matchAll(timelinePattern)];
        const bTimelines = [...policyB.content.matchAll(timelinePattern)];
        
        if (aTimelines.length > 0 && bTimelines.length > 0) {
            conflicts.push({
                type: 'timeline_conflict',
                severity: this.conflictTypes.timeline_conflict.severity_weight,
                policies: [policyA.id, policyB.id],
                description: `Conflicting timelines found between policies`,
                location: 'timeline_requirements',
                impact: 'medium'
            });
        }

        return conflicts;
    }

    /**
     * Find scope ambiguities
     */
    findScopeAmbiguities(policyA, policyB) {
        const ambiguities = [];
        
        // Look for overlapping scope keywords
        const scopeKeywords = ['all', 'any', 'every', 'some', 'certain', 'specific'];
        
        const aScopes = scopeKeywords.filter(keyword => 
            policyA.content.toLowerCase().includes(keyword)
        );
        const bScopes = scopeKeywords.filter(keyword => 
            policyB.content.toLowerCase().includes(keyword)
        );
        
        if (aScopes.length > 0 && bScopes.length > 0) {
            ambiguities.push({
                type: 'scope_ambiguity',
                severity: this.conflictTypes.scope_ambiguity.severity_weight,
                policies: [policyA.id, policyB.id],
                description: `Scope ambiguity between policies may cause confusion`,
                location: 'scope_definition',
                impact: 'low'
            });
        }

        return ambiguities;
    }

    /**
     * Determine resolution strategy
     * Borrows from PolicyAgent.determineApprovalLevel()
     */
    determineResolutionStrategy(conflictAssessment) {
        const { averageSeverity, conflictCount } = conflictAssessment;
        
        if (averageSeverity <= this.severityThresholds.auto_resolve) {
            return {
                strategy: 'automated_resolution',
                type: 'low_complexity',
                reasoning: 'Low severity conflicts can be resolved automatically',
                requires_human_review: false,
                estimated_time: '1-2 hours'
            };
        } else if (averageSeverity <= this.severityThresholds.manual_review) {
            return {
                strategy: 'guided_resolution',
                type: 'medium_complexity',
                reasoning: 'Medium severity conflicts require guided human resolution',
                requires_human_review: true,
                estimated_time: '1-2 days'
            };
        } else {
            return {
                strategy: 'expert_mediation',
                type: 'high_complexity',
                reasoning: 'High severity conflicts require expert mediation',
                requires_human_review: true,
                estimated_time: '1-2 weeks'
            };
        }
    }

    /**
     * Generate recommendations
     * Borrows from PolicyAgent.generateGuardrails()
     */
    generateRecommendations(resolutionStrategy, structuredPolicies) {
        const recommendations = {
            immediate_actions: [],
            short_term_solutions: [],
            long_term_improvements: []
        };

        // Immediate actions based on strategy
        if (resolutionStrategy.strategy === 'automated_resolution') {
            recommendations.immediate_actions.push(
                'Apply automated conflict resolution rules',
                'Update policy language for clarity',
                'Merge compatible requirements'
            );
        } else if (resolutionStrategy.strategy === 'guided_resolution') {
            recommendations.immediate_actions.push(
                'Schedule stakeholder review meeting',
                'Prepare conflict analysis documentation',
                'Identify subject matter experts'
            );
        } else {
            recommendations.immediate_actions.push(
                'Escalate to senior management',
                'Engage external mediation resources',
                'Suspend conflicting policies pending resolution'
            );
        }

        // Short-term solutions
        recommendations.short_term_solutions.push(
            'Create interim policy guidelines',
            'Establish conflict resolution process',
            'Train staff on updated procedures'
        );

        // Long-term improvements
        recommendations.long_term_improvements.push(
            'Implement policy versioning system',
            'Create automated conflict detection',
            'Establish regular policy review cycles'
        );

        return recommendations;
    }

    /**
     * Create implementation plan
     * Borrows from PolicyAgent.defineMonitoringRequirements()
     */
    createImplementationPlan(resolutionStrategy, conflictAssessment) {
        return {
            timeline: {
                phase1: '1-3 days: Immediate conflict resolution',
                phase2: '1-2 weeks: Policy updates and training',
                phase3: '1-3 months: Process optimization'
            },
            resources_needed: [
                'Policy review team',
                'Legal consultation',
                'Stakeholder coordination'
            ],
            success_metrics: [
                'Number of conflicts resolved',
                'Policy compliance rate',
                'Stakeholder satisfaction'
            ],
            monitoring: {
                frequency: 'weekly',
                checkpoints: ['conflict_resolution', 'policy_updates', 'training_completion'],
                escalation_triggers: ['unresolved_conflicts', 'stakeholder_objections']
            }
        };
    }

    /**
     * Build final conflict report
     * Borrows from PolicyAgent.buildPolicyDecision()
     */
    buildConflictReport(structuredPolicies, conflictAssessment, resolutionStrategy, recommendations, implementationPlan) {
        return {
            timestamp: new Date().toISOString(),
            analysis_id: this.generateAnalysisId(),
            
            // Executive summary
            summary: {
                policies_analyzed: structuredPolicies.length,
                conflicts_found: conflictAssessment.conflictCount,
                severity_level: conflictAssessment.severityLevel,
                resolution_complexity: resolutionStrategy.type,
                estimated_resolution_time: resolutionStrategy.estimated_time
            },

            // Detailed conflicts
            conflicts: {
                list: conflictAssessment.conflicts,
                severity_breakdown: this.categorizeConflictsBySeverity(conflictAssessment.conflicts),
                impact_analysis: this.analyzeConflictImpact(conflictAssessment.conflicts)
            },

            // Resolution plan
            resolution: {
                strategy: resolutionStrategy,
                recommendations: recommendations,
                implementation_plan: implementationPlan
            },

            // Policies analyzed
            policies: structuredPolicies.map(policy => ({
                id: policy.id,
                name: policy.name,
                complexity: policy.metadata.complexity,
                domain: policy.metadata.domain
            })),

            // Next steps
            next_steps: this.generateNextSteps(resolutionStrategy, conflictAssessment),
            
            // Visualization data for frontend
            visualization: {
                conflict_matrix: this.generateConflictMatrix(structuredPolicies, conflictAssessment.conflicts),
                severity_chart: this.generateSeverityChartData(conflictAssessment.conflicts),
                resolution_timeline: this.generateTimelineData(implementationPlan)
            }
        };
    }

    // Helper methods (abbreviated for space)
    extractPolicySections(content) { return []; }
    assessComplexity(content) { return content?.length > 1000 ? 'high' : 'medium'; }
    identifyDomain(content) { return 'general'; }
    categorizeSeverityLevel(severity) {
        if (severity <= 0.3) return 'low';
        if (severity <= 0.7) return 'medium';
        return 'high';
    }
    generateAnalysisId() { return `CON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
    categorizeConflictsBySeverity(conflicts) { return {}; }
    analyzeConflictImpact(conflicts) { return {}; }
    generateNextSteps(strategy, assessment) { return []; }
    generateConflictMatrix(policies, conflicts) { return {}; }
    generateSeverityChartData(conflicts) { return {}; }
    generateTimelineData(plan) { return {}; }
}

// Export for use in backend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConflictDetectionAgent };
}