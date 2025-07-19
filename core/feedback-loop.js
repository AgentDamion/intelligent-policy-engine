const eventBus = require('./event-bus');
const agentRegistry = require('../agents/agent-registry');

eventBus.on('policy:checked', async ({ input, result }) => {
  if (result && result.feedback) {
    await agentRegistry.policy.learn(result.feedback);
  }
});

eventBus.on('audit:checked', async ({ input, result }) => {
  if (result && result.feedback) {
    await agentRegistry.audit.learn(result.feedback);
  }
});

eventBus.on('negotiation:completed', async ({ input, result }) => {
  if (result && result.feedback) {
    await agentRegistry.negotiation.learn(result.feedback);
  }
}); 