/**
 * AI Service - Connects agents to Large Language Models
 * Supports OpenAI, Anthropic Claude, or other AI providers
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'anthropic'

async function analyzeWithAI(prompt, context = {}) {
    if (!OPENAI_API_KEY) {
        console.warn('No AI API key found, returning mock response');
        return {
            response: `Mock AI analysis for: ${prompt.substring(0, 50)}...`,
            confidence: 0.75
        };
    }

    try {
        if (AI_PROVIDER === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo', // or 'gpt-4' for better results
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an AI compliance expert analyzing policies for conflicts.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            return {
                response: data.choices[0].message.content,
                confidence: 0.85,
                model: data.model,
                usage: data.usage
            };
        }
        
        // Add other providers (Anthropic, etc.) here if needed
        
    } catch (error) {
        console.error('AI Service Error:', error);
        // Return a fallback response instead of throwing
        return {
            response: 'AI analysis unavailable, using pattern matching only',
            confidence: 0.5,
            error: error.message
        };
    }
}

// Export the function
module.exports = { analyzeWithAI };