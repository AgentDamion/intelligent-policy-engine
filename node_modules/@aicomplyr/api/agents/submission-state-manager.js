const AgentBase = require('./agent-base');
const EventBus = require('../core/event-bus');
const { v4: uuidv4 } = require('uuid');

class SubmissionStateManager extends AgentBase {
  constructor() {
    super('submission-state', 'orchestration');
    this.submissions = new Map();
    this.activeWorkflows = new Map();
    this.slaTracking = new Map();
    this.agentPerformance = new Map();
    this.subscribeToEvents();
    setInterval(() => this.cleanupOldSubmissions(), 60 * 60 * 1000); // Every hour
  }

  async process(input, context) {
    const { action, submissionId, data } = input;
    try {
      switch (action) {
        case 'create':
          return await this.createSubmission(data, context);
        case 'status':
          return await this.getStatus(submissionId);
        case 'update':
          return await this.updateSubmission(submissionId, data);
        case 'timeline':
          return await this.getTimeline(submissionId);
        case 'cancel':
          return await this.cancelSubmission(submissionId);
        case 'analytics':
          return await this.getAnalytics(data);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      if (this.logger) this.logger.error('State management error:', error);
      throw error;
    }
  }

  async createSubmission(data, context) {
    const submissionId = data.id || uuidv4();
    const submission = {
      id: submissionId,
      status: 'created',
      priority: data.priority || 'normal',
      createdAt: new Date(),
      createdBy: context.user?.id,
      client: context.client,
      content: data.content,
      contentType: data.contentType,
      metadata: data.metadata || {},
      workflow: null,
      currentStage: null,
      stages: [],
      agentResults: {},
      timeline: [{
        timestamp: new Date(),
        event: 'submission_created',
        actor: 'system',
        details: { source: data.source || 'api' }
      }],
      progress: {
        percentage: 0,
        completedSteps: 0,
        totalSteps: 0,
        currentStep: 'initialization'
      },
      sla: {
        target: this.calculateSLA(data, context),
        startTime: new Date(),
        deadline: null,
        breached: false
      },
      issues: [],
      warnings: []
    };
    submission.sla.deadline = new Date(submission.sla.startTime.getTime() + submission.sla.target);
    this.submissions.set(submissionId, submission);
    EventBus.emit('submission-created', {
      submissionId,
      submission,
      timestamp: new Date()
    });
    return {
      submissionId,
      status: 'created',
      sla: submission.sla,
      trackingUrl: `/submissions/${submissionId}`
    };
  }

  async getStatus(submissionId) {
    const submission = this.submissions.get(submissionId);
    if (!submission) throw new Error(`Submission ${submissionId} not found`);
    const elapsedTime = Date.now() - submission.createdAt.getTime();
    const remainingTime = submission.sla.deadline.getTime() - Date.now();
    const isOverdue = remainingTime < 0;
    return {
      id: submissionId,
      status: submission.status,
      progress: submission.progress,
      currentStage: submission.currentStage,
      activeAgents: this.getActiveAgents(submissionId),
      elapsedTime: this.formatDuration(elapsedTime),
      remainingTime: isOverdue ? 'Overdue' : this.formatDuration(remainingTime),
      slaStatus: isOverdue ? 'breached' : 'on-track',
      completedChecks: Object.keys(submission.agentResults).length,
      issues: submission.issues.length,
      warnings: submission.warnings.length,
      nextSteps: this.getNextSteps(submission),
      estimatedCompletion: this.estimateCompletion ? this.estimateCompletion(submission) : null
    };
  }

  async getTimeline(submissionId) {
    const submission = this.submissions.get(submissionId);
    if (!submission) throw new Error(`Submission ${submissionId} not found`);
    const enrichedTimeline = submission.timeline.map(event => ({
      ...event,
      duration: this.calculateEventDuration ? this.calculateEventDuration(event, submission.timeline) : null,
      impact: this.assessEventImpact ? this.assessEventImpact(event) : null,
      icon: this.getEventIcon ? this.getEventIcon(event.event) : null
    }));
    return {
      submissionId,
      timeline: enrichedTimeline,
      summary: {
        totalEvents: enrichedTimeline.length,
        totalDuration: this.calculateTotalDuration ? this.calculateTotalDuration(submission) : null,
        criticalEvents: enrichedTimeline.filter(e => e.impact === 'critical').length
      }
    };
  }

  subscribeToEvents() {
    EventBus.on('workflow-started', this.onWorkflowStarted.bind(this));
    EventBus.on('workflow-stage-completed', this.onStageCompleted ? this.onStageCompleted.bind(this) : () => {});
    EventBus.on('workflow-completed', this.onWorkflowCompleted.bind(this));
    EventBus.on('agent-started', this.onAgentStarted ? this.onAgentStarted.bind(this) : () => {});
    EventBus.on('agent-completed', this.onAgentCompleted.bind(this));
    EventBus.on('agent-failed', this.onAgentFailed ? this.onAgentFailed.bind(this) : () => {});
    EventBus.on('compliance-issue-detected', this.onIssueDetected ? this.onIssueDetected.bind(this) : () => {});
    EventBus.on('compliance-warning-raised', this.onWarningRaised ? this.onWarningRaised.bind(this) : () => {});
    EventBus.on('pre-flight-check-complete', this.onPreFlightComplete.bind(this));
  }

  onWorkflowStarted(event) {
    const { submissionId, workflow, timestamp } = event;
    const submission = this.submissions.get(submissionId);
    if (!submission) return;
    submission.workflow = workflow;
    submission.status = 'processing';
    submission.currentStage = workflow.stages?.[0] || 'analysis';
    submission.progress.totalSteps = workflow.agents?.length || 1;
    submission.timeline.push({
      timestamp,
      event: 'workflow_started',
      actor: 'system',
      details: {
        workflow: workflow.name,
        expectedDuration: workflow.sla
      }
    });
    this.activeWorkflows.set(submissionId, { startTime: timestamp, workflow });
    this.emitStateChange(submissionId, 'workflow_started');
  }

  onAgentCompleted(event) {
    const { submissionId, agentName, result, duration, timestamp } = event;
    const submission = this.submissions.get(submissionId);
    if (!submission) return;
    submission.agentResults[agentName] = { result, duration, timestamp, status: 'completed' };
    submission.progress.completedSteps++;
    submission.progress.percentage = Math.round((submission.progress.completedSteps / submission.progress.totalSteps) * 100);
    submission.timeline.push({
      timestamp,
      event: 'agent_completed',
      actor: agentName,
      details: { duration, findings: this.summarizeFindings ? this.summarizeFindings(result) : undefined }
    });
    this.trackAgentPerformance(agentName, duration);
    if (result.issues?.length > 0) submission.issues.push(...result.issues);
    if (result.warnings?.length > 0) submission.warnings.push(...result.warnings);
    this.emitStateChange(submissionId, 'agent_completed', { agentName });
  }

  onWorkflowCompleted(event) {
    const { submissionId, status, summary, timestamp } = event;
    const submission = this.submissions.get(submissionId);
    if (!submission) return;
    submission.status = status || 'completed';
    submission.progress.percentage = 100;
    submission.currentStage = 'completed';
    const totalDuration = timestamp - submission.createdAt;
    const slaMet = timestamp <= submission.sla.deadline;
    submission.timeline.push({
      timestamp,
      event: 'workflow_completed',
      actor: 'system',
      details: { finalStatus: status, totalDuration, slaMet, summary }
    });
    submission.sla.breached = !slaMet;
    submission.completedAt = timestamp;
    this.activeWorkflows.delete(submissionId);
    EventBus.emit('submission-completed', {
      submissionId,
      submission,
      metrics: {
        duration: totalDuration,
        slaMet,
        issueCount: submission.issues.length,
        warningCount: submission.warnings.length
      }
    });
    this.emitStateChange(submissionId, 'completed');
  }

  onPreFlightComplete(event) {
    const { input, result, timestamp } = event;
    if (input.submissionId) {
      const submission = this.submissions.get(input.submissionId);
      if (submission) {
        submission.timeline.push({
          timestamp,
          event: 'pre_flight_feedback',
          actor: 'pre-flight',
          details: { feedbackCount: result.feedback?.length || 0, severity: result.severity }
        });
      }
    }
  }

  calculateSLA(data, context) {
    const baseSLA = {
      urgent: 30 * 60 * 1000,
      high: 2 * 60 * 60 * 1000,
      normal: 4 * 60 * 60 * 1000,
      low: 24 * 60 * 60 * 1000
    };
    let sla = baseSLA[data.priority] || baseSLA.normal;
    if (context.client?.tier === 'premium') sla *= 0.5;
    return sla;
  }

  formatDuration(ms) {
    if (ms < 0) return 'Overdue';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getActiveAgents(submissionId) {
    const submission = this.submissions.get(submissionId);
    if (!submission) return [];
    const activeAgents = [];
    for (const [agentName, result] of Object.entries(submission.agentResults)) {
      if (result.status === 'processing') {
        activeAgents.push({ name: agentName, startTime: result.timestamp, elapsed: Date.now() - result.timestamp });
      }
    }
    return activeAgents;
  }

  getNextSteps(submission) {
    const steps = [];
    if (submission.status === 'processing') {
      const remainingAgents = submission.workflow?.agents?.filter(agent => !submission.agentResults[agent]) || [];
      if (remainingAgents.length > 0) steps.push(`Waiting for ${remainingAgents.join(', ')} to complete`);
    }
    if (submission.issues.length > 0) steps.push('Address compliance issues before resubmission');
    if (submission.warnings.length > 0) steps.push('Review warnings and consider adjustments');
    return steps;
  }

  emitStateChange(submissionId, eventType, additionalData = {}) {
    const submission = this.submissions.get(submissionId);
    if (!submission) return;
    EventBus.emit('submission-state-changed', {
      submissionId,
      eventType,
      currentState: {
        status: submission.status,
        progress: submission.progress,
        stage: submission.currentStage
      },
      ...additionalData,
      timestamp: new Date()
    });
  }

  trackAgentPerformance(agentName, duration) {
    if (!this.agentPerformance.has(agentName)) {
      this.agentPerformance.set(agentName, { totalRuns: 0, totalDuration: 0, avgDuration: 0, minDuration: Infinity, maxDuration: 0 });
    }
    const perf = this.agentPerformance.get(agentName);
    perf.totalRuns++;
    perf.totalDuration += duration;
    perf.avgDuration = perf.totalDuration / perf.totalRuns;
    perf.minDuration = Math.min(perf.minDuration, duration);
    perf.maxDuration = Math.max(perf.maxDuration, duration);
  }

  async getAnalytics(filters = {}) {
    const { timeRange = '24h', clientId, status } = filters;
    const submissions = Array.from(this.submissions.values());
    const filtered = submissions.filter(sub => {
      if (clientId && sub.client?.id !== clientId) return false;
      if (status && sub.status !== status) return false;
      return true;
    });
    return {
      summary: {
        total: filtered.length,
        completed: filtered.filter(s => s.status === 'completed').length,
        processing: filtered.filter(s => s.status === 'processing').length,
        failed: filtered.filter(s => s.status === 'failed').length
      },
      slaMetrics: {
        met: filtered.filter(s => !s.sla.breached).length,
        breached: filtered.filter(s => s.sla.breached).length,
        averageCompletionTime: this.calculateAverageCompletionTime ? this.calculateAverageCompletionTime(filtered) : null
      },
      agentPerformance: Object.fromEntries(this.agentPerformance),
      issueBreakdown: this.analyzeIssues ? this.analyzeIssues(filtered) : null
    };
  }

  cleanupOldSubmissions() {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    for (const [id, submission] of this.submissions) {
      if (submission.createdAt.getTime() < cutoffTime && submission.status === 'completed') {
        this.submissions.delete(id);
      }
    }
  }
}

module.exports = SubmissionStateManager; 