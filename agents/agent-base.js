class AgentBase {
  constructor(name) {
    this.name = name;
  }
  // Main processing method (to be overridden)
  async process(input, context) {
    throw new Error('process() not implemented');
  }
  // Optional: learning from feedback
  async learn(feedback) {}
  // Optional: agent metadata
  getInfo() {
    return { name: this.name, type: this.constructor.name };
  }
}
module.exports = AgentBase;
// Backwards-compatible named export for modules doing `const { AgentBase } = require('./agent-base')`
module.exports.AgentBase = AgentBase;
