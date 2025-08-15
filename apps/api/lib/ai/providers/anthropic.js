import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './base.js';

export class AnthropicProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async analyze(prompt, options = {}) {
    try {
      const response = await this.client.messages.create({
        model: this.config.modelName || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 1000,
        messages: [
          {
            role: 'user',
            content: 'As a regulatory compliance expert, analyze this for pharmaceutical compliance risks. Be extra cautious about patient safety and regulatory requirements. ' + prompt + ' Provide: 1. Risk level (HIGH/MEDIUM/LOW) 2. Specific concerns 3. Recommendations 4. Your confidence in this assessment (0-1) 5. Detailed reasoning for your assessment'
          }
        ]
      });

      const content = response.content[0].text;
      const confidence = this.extractConfidence(content);

      return this.formatResponse({
        content,
        reasoning: this.extractReasoning(content)
      }, confidence);

    } catch (error) {
      console.error('Anthropic analysis failed:', error);
      throw new Error('Anthropic analysis failed: ' + error.message);
    }
  }

  extractConfidence(content) {
    const match = content.match(/confidence[:\s]+([0-9.]+)/i);
    return match ? parseFloat(match[1]) : 0.8;
  }

  extractReasoning(content) {
    const reasoningMatch = content.match(/reasoning[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
    return reasoningMatch ? reasoningMatch[1].trim() : content;
  }
}
