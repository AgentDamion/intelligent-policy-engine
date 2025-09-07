const EventBus = require('../core/event-bus');

class HumanEscalationAgent {
  constructor() {
    this.name = 'human-escalation';
  }

  async process(input, context = {}) {
    const { reason = 'threshold_exceeded', confidence = 0.0 } = input || {};

    const request = {
      sessionId: context.sessionId || `session-${Date.now()}`,
      agentName: input?.agentName || 'unknown',
      reason,
      confidence,
      result: input?.result || {},
      context,
      timestamp: new Date().toISOString()
    };

    EventBus.emit('human-override-requested', request);

    return {
      escalated: true,
      request,
      nextSteps: ['assigned_to_queue', 'notify_owner'],
      confidence: 0.99
    };
  }
}

module.exports = HumanEscalationAgent;
