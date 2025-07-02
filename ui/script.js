// aicomplyr.io UI Script - Connects to Backend API

class AIComplyrUI {
    constructor() {
        this.currentRequest = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadDemoData();
    }

    initializeElements() {
        // Input elements
        this.userInput = document.getElementById('userInput');
        this.submitBtn = document.getElementById('submitBtn');
        
        // Sections
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        
        // Context analysis elements
        this.urgencyBar = document.getElementById('urgencyBar');
        this.urgencyLevel = document.getElementById('urgencyLevel');
        this.emotionalState = document.getElementById('emotionalState');
        this.contextType = document.getElementById('contextType');
        this.confidenceFill = document.getElementById('confidenceFill');
        this.confidenceValue = document.getElementById('confidenceValue');
        this.clarificationQuestion = document.getElementById('clarificationQuestion');
        
        // Policy decision elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.decisionStatus = document.getElementById('decisionStatus');
        this.decisionType = document.getElementById('decisionType');
        this.riskFill = document.getElementById('riskFill');
        this.riskLevel = document.getElementById('riskLevel');
        this.riskScore = document.getElementById('riskScore');
        this.guardrailsGrid = document.getElementById('guardrailsGrid');
        this.monitoringGrid = document.getElementById('monitoringGrid');
        this.nextStepsList = document.getElementById('nextStepsList');
    }

    bindEvents() {
        this.submitBtn.addEventListener('click', () => this.handleSubmit());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleSubmit();
            }
        });
    }

    async handleSubmit() {
        const userMessage = this.userInput.value.trim();
        
        if (!userMessage) {
            this.showError('Please enter a request to analyze.');
            return;
        }

        this.showLoading();
        
        try {
            // Process with Context Agent (Real API Call)
            const contextOutput = await this.processWithContextAgent(userMessage);
            
            // Process with Policy Agent (Real API Call)
            const policyDecision = await this.processWithPolicyAgent(contextOutput);
            
            // Process with Negotiation Agent (Real API Call)
            const negotiationResult = await this.processWithNegotiationAgent(contextOutput, policyDecision);
            
            // Display results
            this.displayResults(contextOutput, policyDecision, negotiationResult);
            
        } catch (error) {
            this.showError('An error occurred while processing your request: ' + error.message);
            console.error('Error:', error);
        }
    }

    // Real API Calls to Backend
    async processWithContextAgent(userMessage) {
        console.log('Sending message to context agent:', userMessage);
        
        const response = await fetch('/api/process/context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userMessage: userMessage,
                organizationId: 'demo-org',
                userId: 'demo-user'
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Context processing failed:', errorText);
            throw new Error('Context processing failed: ' + errorText);
        }
        
        const result = await response.json();
        console.log('Context agent response:', result);
        return result;
    }

    async processWithPolicyAgent(contextOutput) {
        const response = await fetch('/api/process/policy', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contextOutput: contextOutput,
                organizationId: 'demo-org',
                userId: 'demo-user'
            })
        });
        
        if (!response.ok) {
            throw new Error('Policy processing failed');
        }
        
        return await response.json();
    }

    async processWithNegotiationAgent(contextOutput, policyDecision) {
        const response = await fetch('/api/process/negotiation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contextOutput: contextOutput,
                policyDecision: policyDecision,
                organizationId: 'demo-org',
                userId: 'demo-user'
            })
        });
        
        if (!response.ok) {
            throw new Error('Negotiation processing failed');
        }
        
        return await response.json();
    }

    // UI Display Methods
    displayResults(contextOutput, policyDecision, negotiationResult) {
        this.hideLoading();
        this.showResults();
        
        // Display context analysis
        this.displayContextAnalysis(contextOutput);
        
        // Display policy decision
        this.displayPolicyDecision(policyDecision);
        
        // Display negotiation outcome
        this.displayNegotiationOutcome(negotiationResult);
        
        // Animate elements
        this.animateResults();
    }

    displayContextAnalysis(contextOutput) {
        // Handle different response formats from real API
        const urgency = contextOutput.urgency || { level: 0.5, emotionalState: 'unknown' };
        const context = contextOutput.context || { inferredType: 'unknown', confidence: 0.5 };
        const clarification = contextOutput.clarification || { question: 'No clarification needed' };

        // Urgency
        this.urgencyBar.style.width = `${urgency.level * 100}%`;
        this.urgencyLevel.textContent = this.capitalizeFirst(this.getUrgencyLevel(urgency.level));
        this.emotionalState.textContent = urgency.emotionalState;
        
        // Context inference
        this.contextType.textContent = this.formatContextType(context.inferredType);
        this.confidenceFill.style.width = `${context.confidence * 100}%`;
        this.confidenceValue.textContent = `${Math.round(context.confidence * 100)}%`;
        
        // Clarification question
        this.clarificationQuestion.textContent = clarification.question;
    }

    displayPolicyDecision(policyDecision) {
        // Handle different response formats from real API
        const decision = policyDecision.decision || { status: 'pending', type: 'unknown' };
        const risk = policyDecision.risk || { score: 0.5, level: 'medium' };
        const conditions = policyDecision.conditions || { guardrails: {}, compliance_requirements: [] };
        const monitoring = policyDecision.monitoring || { requirements: {} };
        const nextSteps = policyDecision.next_steps || [];

        // Decision status
        const status = decision.status.toUpperCase();
        this.decisionStatus.textContent = status;
        this.decisionType.textContent = this.formatDecisionType(decision.type);
        
        // Update status indicator
        this.statusIndicator.className = `status-indicator status-${decision.status}`;
        this.statusIndicator.innerHTML = `
            <i class="fas fa-${this.getStatusIcon(decision.status)}"></i>
            <span>${status}</span>
        `;
        
        // Risk assessment
        this.riskFill.style.width = `${risk.score * 100}%`;
        this.riskLevel.textContent = this.capitalizeFirst(risk.level);
        this.riskScore.textContent = `${Math.round(risk.score * 100)}%`;
        
        // Guardrails
        this.displayGuardrails(conditions.guardrails);
        
        // Monitoring
        this.displayMonitoring(monitoring.requirements);
        
        // Next steps
        this.displayNextSteps(nextSteps);
    }

    displayGuardrails(guardrails) {
        this.guardrailsGrid.innerHTML = '';
        
        if (!guardrails || Object.keys(guardrails).length === 0) {
            this.guardrailsGrid.innerHTML = '<div class="guardrail-item">No specific guardrails required</div>';
            return;
        }

        Object.entries(guardrails).forEach(([key, guardrail]) => {
            const item = document.createElement('div');
            const isRequired = guardrail.required !== false; // Default to required if not specified
            item.className = `guardrail-item ${isRequired ? 'required' : 'optional'}`;
            item.innerHTML = `
                <i class="fas fa-${this.getGuardrailIcon(key)}"></i>
                <span>${this.formatGuardrailName(key)}</span>
            `;
            this.guardrailsGrid.appendChild(item);
        });
    }

    displayMonitoring(monitoring) {
        this.monitoringGrid.innerHTML = '';
        
        if (!monitoring || Object.keys(monitoring).length === 0) {
            this.monitoringGrid.innerHTML = '<div class="monitoring-item">Standard monitoring applies</div>';
            return;
        }

        Object.entries(monitoring).forEach(([key, monitor]) => {
            const item = document.createElement('div');
            const isEnabled = monitor.enabled !== false; // Default to enabled if not specified
            item.className = `monitoring-item ${isEnabled ? 'enabled' : 'disabled'}`;
            item.innerHTML = `
                <i class="fas fa-${this.getMonitoringIcon(key)}"></i>
                <span>${this.formatMonitoringName(key)}</span>
            `;
            this.monitoringGrid.appendChild(item);
        });
    }

    displayNextSteps(nextSteps) {
        if (!this.nextStepsList) return;
        
        this.nextStepsList.innerHTML = '';
        
        if (!nextSteps || nextSteps.length === 0) {
            this.nextStepsList.innerHTML = '<li>No specific next steps required</li>';
            return;
        }

        nextSteps.forEach(step => {
            const item = document.createElement('li');
            item.textContent = step;
            this.nextStepsList.appendChild(item);
        });
    }

    displayNegotiationOutcome(negotiationResult) {
        // Handle the case where negotiation result might be minimal
        if (!negotiationResult) {
            negotiationResult = {
                competitors: [],
                conflicts: [],
                solution: { requirements: [] },
                escalation: { required: false },
                client_requirements: {}
            };
        }

        // Competitive Relationships
        const competitorsDiv = document.getElementById('negotiationCompetitors');
        if (competitorsDiv) {
            competitorsDiv.innerHTML = '';
            if (negotiationResult.competitors && negotiationResult.competitors.length > 0) {
                negotiationResult.competitors.forEach(pair => {
                    const el = document.createElement('div');
                    el.className = 'negotiation-item';
                    el.innerHTML = `<strong>${pair.client1}</strong> ↔ <strong>${pair.client2}</strong> (${pair.industry || 'industry'})`;
                    competitorsDiv.appendChild(el);
                });
            } else {
                competitorsDiv.innerHTML = '<span>No direct competitors detected.</span>';
            }
        }

        // Policy Conflicts
        const conflictsDiv = document.getElementById('negotiationConflicts');
        if (conflictsDiv) {
            conflictsDiv.innerHTML = '';
            if (negotiationResult.conflicts && negotiationResult.conflicts.length > 0) {
                negotiationResult.conflicts.forEach(conflict => {
                    const el = document.createElement('div');
                    el.className = 'negotiation-item';
                    el.innerHTML = `<strong>${this.capitalizeFirst(conflict.type.replace('_', ' '))}:</strong> ${conflict.description}`;
                    conflictsDiv.appendChild(el);
                });
            } else {
                conflictsDiv.innerHTML = '<span>No major policy conflicts detected.</span>';
            }
        }

        // Compromise Solution
        const solutionDiv = document.getElementById('negotiationSolution');
        if (solutionDiv) {
            solutionDiv.innerHTML = '';
            if (negotiationResult.solution && negotiationResult.solution.requirements && negotiationResult.solution.requirements.length > 0) {
                negotiationResult.solution.requirements.forEach(req => {
                    const el = document.createElement('div');
                    el.className = 'negotiation-item';
                    el.innerHTML = `<i class="fas fa-check"></i> ${req}`;
                    solutionDiv.appendChild(el);
                });
            } else {
                solutionDiv.innerHTML = '<span>No compromise solution required.</span>';
            }
        }

        // Escalation
        const escalationDiv = document.getElementById('negotiationEscalation');
        if (escalationDiv) {
            escalationDiv.innerHTML = '';
            if (negotiationResult.escalation && negotiationResult.escalation.required) {
                const nextSteps = negotiationResult.escalation.next_steps || [];
                escalationDiv.innerHTML = `<span class="escalation-required"><i class="fas fa-arrow-up"></i> Escalation required: ${negotiationResult.escalation.reason || 'See next steps.'}</span><ul>${nextSteps.map(step=>`<li>${step}</li>`).join('')}</ul>`;
            } else {
                escalationDiv.innerHTML = '<span>No escalation required.</span>';
            }
        }

        // Client-Specific Requirements
        const clientReqDiv = document.getElementById('negotiationClientRequirements');
        if (clientReqDiv) {
            clientReqDiv.innerHTML = '';
            if (negotiationResult.client_requirements && Object.keys(negotiationResult.client_requirements).length > 0) {
                Object.entries(negotiationResult.client_requirements).forEach(([client, reqs]) => {
                    const el = document.createElement('div');
                    el.className = 'negotiation-item';
                    el.innerHTML = `<strong>${this.capitalizeFirst(client)}:</strong><ul>` +
                        (reqs.requirements || []).map(r=>`<li>${r}</li>`).join('') +
                        (reqs.guardrails || []).map(g=>`<li><em>Guardrail:</em> ${g}</li>`).join('') +
                        (reqs.monitoring || []).map(m=>`<li><em>Monitoring:</em> ${m}</li>`).join('') +
                        '</ul>';
                    clientReqDiv.appendChild(el);
                });
            } else {
                clientReqDiv.innerHTML = '<span>No client-specific requirements.</span>';
            }
        }
    }

    // Utility methods
    showLoading() {
        this.loadingSection.classList.remove('hidden');
        this.resultsSection.classList.add('hidden');
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    }

    hideLoading() {
        this.loadingSection.classList.add('hidden');
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = '<i class="fas fa-play"></i> Analyze Request';
    }

    showResults() {
        this.resultsSection.classList.remove('hidden');
    }

    showError(message) {
        this.hideLoading();
        alert(message); // In a real app, this would be a proper toast notification
    }

    // Formatting helpers
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatContextType(type) {
        if (!type) return 'Unknown';
        return type.split('_').map(word => this.capitalizeFirst(word)).join(' ');
    }

    formatDecisionType(type) {
        if (!type) return 'Unknown';
        return type.split('_').map(word => this.capitalizeFirst(word)).join(' ');
    }

    formatGuardrailName(key) {
        return key.split('_').map(word => this.capitalizeFirst(word)).join(' ');
    }

    formatMonitoringName(key) {
        return key.split('_').map(word => this.capitalizeFirst(word)).join(' ');
    }

    getUrgencyLevel(level) {
        if (level > 0.8) return 'critical';
        if (level > 0.6) return 'high';
        if (level > 0.4) return 'medium';
        return 'low';
    }

    getStatusIcon(status) {
        switch (status) {
            case 'approved': return 'check-circle';
            case 'denied': return 'times-circle';
            case 'pending': return 'clock';
            default: return 'question-circle';
        }
    }

    getGuardrailIcon(key) {
        const icons = {
            content_review: 'eye',
            time_limits: 'clock',
            quality_checks: 'check-double',
            client_approval: 'user-check',
            weekend_monitoring: 'calendar-check'
        };
        return icons[key] || 'shield-alt';
    }

    getMonitoringIcon(key) {
        const icons = {
            usage_tracking: 'chart-line',
            quality_monitoring: 'eye',
            client_feedback: 'comments',
            enhanced_tracking: 'video'
        };
        return icons[key] || 'eye';
    }

    animateResults() {
        // Add animation classes to elements
        const elements = document.querySelectorAll('.analysis-item, .decision-status, .risk-assessment, .guardrails-section, .monitoring-section, .next-step-item');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 100);
            }, index * 100);
        });
    }

    loadDemoData() {
        // Pre-populate with demo data
        this.userInput.value = "Need to use Midjourney for campaign images serving Pfizer, Novartis, and Roche";
    }
}

// Initialize the UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AIComplyrUI();
});