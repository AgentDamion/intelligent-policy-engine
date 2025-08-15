import dotenv from 'dotenv';
import { AIRouter } from './router.js';

// Load environment variables from .env file (2 levels up from lib/ai)
dotenv.config({ path: '../../.env' });

// Simple test to make sure everything works
async function testAI() {
  console.log('Testing AI Router...');
  console.log('Current directory:', process.cwd());
  
  // Verify API keys are loaded
  console.log('OpenAI key loaded:', process.env.OPENAI_API_KEY ? 'Yes (' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : 'No');
  console.log('Anthropic key loaded:', process.env.ANTHROPIC_API_KEY ? 'Yes (' + process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...)' : 'No');
  
  const router = new AIRouter();
  
  const testPrompt = 'This is a test pharmaceutical document about a new diabetes medication that needs regulatory review.';
  
  try {
    const result = await router.analyzeWithFallback(
      testPrompt, 
      'compliance_analysis', 
      'HIGH'
    );
    
    console.log('? Test successful!');
    console.log('Provider used:', result.provider);
    console.log('Confidence:', result.confidence);
    console.log('Analysis:', result.analysis.substring(0, 200) + '...');
    console.log('Reasoning:', result.reasoning.substring(0, 100) + '...');
  } catch (error) {
    console.error('? Test failed:', error.message);
    console.log('Full error:', error);
  }
}

// Run the test
testAI();
