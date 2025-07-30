import OpenAI from 'openai';
import { AIProvider } from './base.js';

export class OpenAIProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyze(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.modelName || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a pharmaceutical compliance expert. Analyze the following for regulatory risks and provide: 1. Risk assessment (HIGH/MEDIUM/LOW) 2. Specific policy concerns 3. Recommended actions 4. Confidence score (0-1) Always include your reasoning.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: options.maxTokens || 1000
      });

      const content = response.choices[0].message.content;
      const confidence = this.extractConfidence(content);
      
      return this.formatResponse({
        content,
        reasoning: this.extractReasoning(content)
      }, confidence);

    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      throw new Error('OpenAI analysis failed: ' + error.message);
    }
  }

  extractConfidence(content) {
    const match = content.match(/confidence[:\s]+([0-9.]+)/i);
    return match ? parseFloat(match[1]) : 0.7;
  }

  extractReasoning(content) {
    const reasoningMatch = content.match(/reasoning[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
    return reasoningMatch ? reasoningMatch[1].trim() : content;
  }
}
