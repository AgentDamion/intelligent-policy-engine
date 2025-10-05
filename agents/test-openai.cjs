const { analyzeWithAI } = require('./agents/ai-services.cjs');

async function testOpenAI() {
    console.log('Testing OpenAI connection...');
    
    const result = await analyzeWithAI(
        'Analyze this pharmaceutical claim: "Drug X cures diabetes in 100% of patients"'
    );
    
    console.log('AI Response:', result);
    
    if (result.error) {
        console.error('❌ OpenAI connection failed:', result.error);
    } else if (result.response.includes('Mock')) {
        console.warn('⚠️ Using mock responses - check your OPENAI_API_KEY');
    } else {
        console.log('✅ OpenAI is working!');
    }
}

testOpenAI();