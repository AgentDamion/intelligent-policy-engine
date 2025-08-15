// Base class for all AI providers
export class AIProvider {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    this.costPerToken = config.costPerToken;
  }

  async analyze(prompt, options = {}) {
    throw new Error('analyze method must be implemented');
  }

  calculateCost(inputTokens, outputTokens) {
    return (inputTokens + outputTokens) * this.costPerToken;
  }

  // For audit trails - always include reasoning
  formatResponse(rawResponse, confidence) {
    return {
      analysis: rawResponse.content,
      confidence: confidence,
      reasoning: rawResponse.reasoning || 'No specific reasoning provided',
      provider: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
