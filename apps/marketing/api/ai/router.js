import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';

export class AIRouter {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize OpenAI provider
    this.providers.set('openai', new OpenAIProvider({
      name: 'openai',
      modelName: 'gpt-4',
      costPerToken: 0.00003,
      specialization: ['policy_analysis', 'document_parsing', 'general']
    }));

    // Initialize Anthropic provider with current model
    this.providers.set('anthropic', new AnthropicProvider({
      name: 'anthropic',
      modelName: 'claude-3-5-sonnet-20241022',
      costPerToken: 0.000015,
      specialization: ['safety_analysis', 'risk_assessment', 'regulatory']
    }));
  }

  selectProvider(taskType, riskLevel, clientPreference = null) {
    if (clientPreference && this.providers.has(clientPreference)) {
      return this.providers.get(clientPreference);
    }

    if (riskLevel === 'HIGH' && taskType === 'compliance_analysis') {
      return this.providers.get('anthropic') || this.providers.get('openai');
    }

    if (taskType === 'document_parsing') {
      return this.providers.get('openai') || this.providers.get('anthropic');
    }

    return this.providers.get('openai');
  }

  async analyzeWithFallback(prompt, taskType, riskLevel, options = {}) {
    const primaryProvider = this.selectProvider(taskType, riskLevel);
    
    try {
      const result = await primaryProvider.analyze(prompt, options);
      console.log('Analysis completed by: ' + primaryProvider.name);
      return result;
    } catch (error) {
      console.error('Primary provider ' + primaryProvider.name + ' failed:', error.message);
      
      const fallbackProvider = this.getFallbackProvider(primaryProvider.name);
      if (fallbackProvider) {
        try {
          const result = await fallbackProvider.analyze(prompt, options);
          console.log('Fallback analysis completed by: ' + fallbackProvider.name);
          return result;
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError.message);
        }
      }
      
      return {
        analysis: 'AI analysis unavailable - manual review required',
        confidence: 0,
        reasoning: 'All AI providers failed',
        provider: 'manual',
        requiresHumanReview: true
      };
    }
  }

  getFallbackProvider(failedProviderName) {
    const available = Array.from(this.providers.values())
      .filter(p => p.name !== failedProviderName);
    return available[0] || null;
  }
}
