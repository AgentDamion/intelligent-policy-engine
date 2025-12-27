import EventBus from './event-bus.js';
import agentRegistry from '../agents/agent-registry.js';

class WorkflowEngine {
  constructor(registry = agentRegistry) {
    this.registry = registry;
    this.workflows = {
      'express-lane': {
        agents: ['policy', 'audit'],
        parallel: true,
        sla: 15 * 60 * 1000,
        description: 'Fast track for simple, low-risk content'
      },
      'standard-review': {
        agents: ['pre-flight', 'policy', 'brand', 'audit'],
        parallel: false,
        sla: 60 * 60 * 1000,
        description: 'Standard review for typical content'
      },
      'medical-content-review': {
        agents: ['pre-flight', 'policy', 'claim-verification', 'medical-accuracy', 'brand', 'audit'],
        parallel: false,
        sla: 2 * 60 * 60 * 1000,
        description: 'Comprehensive review for medical content'
      },
      'high-risk-review': {
        agents: ['pre-flight', 'policy', 'legal-review', 'claim-verification', 'brand', 'negotiation', 'audit'],
        parallel: false,
        requiresHuman: true,
        sla: 4 * 60 * 60 * 1000,
        description: 'Full review with human oversight for high-risk content'
      }
    };
  }

  async executeWorkflow(workflowName, input, context) {
    const stateManager = this.registry.getAgent('submission-state');
    // Create submission record
    const { submissionId } = await stateManager.process({
      action: 'create',
      data: {
        content: input.content,
        contentType: input.contentType,
        priority: input.priority || 'normal',
        metadata: input.metadata,
        source: input.source || 'api'
      }
    }, context);

    try {
      // INTELLIGENT ROUTING: Run context analysis first
      const contextAgent = this.registry.getAgent('context');
      const contextAnalysis = await contextAgent.process(input, { ...context, submissionId });
      EventBus.emit('context-analysis-complete', { input: { ...input, submissionId }, result: contextAnalysis });
      // Log the routing decision
      const recommendedWorkflow = contextAnalysis.workflow?.name || 'standard-review';
      const workflowConfig = this.workflows[recommendedWorkflow] || this.workflows['standard-review'];
      EventBus.emit('workflow-started', {
        submissionId,
        workflow: {
          name: recommendedWorkflow,
          ...workflowConfig,
          contextAnalysis: contextAnalysis.analysis
        },
        timestamp: new Date()
      });
      // Execute the smart-routed workflow
      const result = await this.executeSmartWorkflow(
        recommendedWorkflow,
        input,
        contextAnalysis,
        submissionId
      );
      EventBus.emit('workflow-completed', {
        submissionId,
        status: 'completed',
        summary: result,
        workflow: recommendedWorkflow,
        timestamp: new Date()
      });
      return {
        ...result,
        submissionId,
        workflow: recommendedWorkflow,
        contextAnalysis: contextAnalysis.analysis
      };
    } catch (error) {
      EventBus.emit('workflow-completed', {
        submissionId,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  async executeSmartWorkflow(workflowName, input, contextAnalysis, submissionId) {
    const workflow = this.workflows[workflowName];
    const enrichedContext = contextAnalysis.enrichedContext || {};
    const results = {};
    if (workflow.parallel) {
      const agentPromises = workflow.agents.map(agentName =>
        this.runAgent(agentName, input, enrichedContext, submissionId)
      );
      const agentResults = await Promise.all(agentPromises);
      workflow.agents.forEach((agentName, index) => {
        results[agentName] = agentResults[index];
      });
    } else {
      for (const agentName of workflow.agents) {
        if (this.shouldSkipAgent(agentName, results, contextAnalysis)) {
          results[agentName] = { skipped: true, reason: 'Not applicable' };
          continue;
        }
        results[agentName] = await this.runAgent(
          agentName,
          input,
          enrichedContext,
          submissionId
        );
        if (results[agentName].blockers?.length > 0) {
          break;
        }
      }
    }
    if (workflow.requiresHuman || this.needsHumanReview(results)) {
      results.humanReviewRequired = true;
      results.humanReviewReasons = this.getHumanReviewReasons(results);
    }
    return {
      workflow: workflowName,
      results,
      summary: this.generateSummary(results),
      confidence: this.calculateOverallConfidence(results, contextAnalysis)
    };
  }

  async runAgent(agentName, input, context, submissionId) {
    const startTime = Date.now();
    try {
      EventBus.emit('agent-started', {
        submissionId,
        agentName,
        timestamp: new Date()
      });
      const agent = this.registry.getAgent(agentName);
      if (!agent) {
        return { skipped: true, reason: 'Agent not found' };
      }
      const result = await agent.process(input, context);
      const duration = Date.now() - startTime;
      EventBus.emit('agent-completed', {
        submissionId,
        agentName,
        result,
        duration,
        timestamp: new Date()
      });
      return result;
    } catch (error) {
      EventBus.emit('agent-failed', {
        submissionId,
        agentName,
        error: error.message,
        timestamp: new Date()
      });
      return {
        error: error.message,
        status: 'failed',
        duration: Date.now() - startTime
      };
    }
  }

  shouldSkipAgent(agentName, previousResults, contextAnalysis) {
    const { analysis } = contextAnalysis;
    if (!analysis) return false;
    if (agentName === 'brand' && analysis.type?.primary === 'internal') return true;
    if (agentName === 'medical-accuracy' && analysis.type?.primary !== 'medical') return true;
    if (agentName === 'claim-verification' && !(analysis.requirements || []).includes('claims')) return true;
    return false;
  }

  needsHumanReview(results) {
    for (const result of Object.values(results)) {
      if (result.requiresHuman || result.confidence < 70) {
        return true;
      }
    }
    return false;
  }

  getHumanReviewReasons(results) {
    const reasons = [];
    for (const [agentName, result] of Object.entries(results)) {
      if (result.requiresHuman) reasons.push(`${agentName}: flagged for human review`);
      if (result.confidence !== undefined && result.confidence < 70) reasons.push(`${agentName}: low confidence`);
    }
    return reasons;
  }

  generateSummary(results) {
    const summary = {
      totalAgents: Object.keys(results).length,
      completed: 0,
      warnings: 0,
      blockers: 0,
      issues: []
    };
    for (const [agentName, result] of Object.entries(results)) {
      if (!result.skipped && !result.error) summary.completed++;
      if (result.warnings) summary.warnings += result.warnings.length;
      if (result.blockers) {
        summary.blockers += result.blockers.length;
        summary.issues.push(...result.blockers.map(b => ({ agent: agentName, type: 'blocker', message: b })));
      }
    }
    return summary;
  }

  calculateOverallConfidence(results, contextAnalysis) {
    let totalConfidence = contextAnalysis.confidence || 100;
    let agentCount = 1;
    for (const result of Object.values(results)) {
      if (result.confidence !== undefined) {
        totalConfidence += result.confidence;
        agentCount++;
      }
    }
    return Math.round(totalConfidence / agentCount);
  }
}

export default new WorkflowEngine(agentRegistry); 