import dotenv from 'dotenv';
import { AIRouter } from './router.js';

dotenv.config({ path: '../../.env' });

async function testGovernanceScenarios() {
  console.log('=== AICOMPLYR.IO GOVERNANCE LAYER TESTS ===');
  console.log('Testing AI tool governance between enterprises and agencies');
  console.log('');
  
  const router = new AIRouter();
  
  // SCENARIO 1: Agency requests to use AI tool
  const toolRequest = 'AGENCY AI TOOL REQUEST: Ogilvy Health requests approval to use OpenAI GPT-4 for creating patient education materials about Type 2 diabetes medication Ozempic. Intended use: Generate easy-to-understand explanations of drug mechanisms, side effects, and usage instructions for patient brochures. Target audience: Adults with Type 2 diabetes. Distribution: Patient education websites and printed materials in clinical settings. Data handling: No patient data will be processed, only general medical information from approved sources.';
  
  console.log('--- SCENARIO 1: AGENCY AI TOOL REQUEST ---');
  await analyzeGovernanceScenario(router, toolRequest, 'Agency Tool Approval');
  
  // SCENARIO 2: AI-generated content submission
  const contentSubmission = 'AI-GENERATED CONTENT SUBMISSION: McCann Health submits social media campaign for Humira (adalimumab) arthritis treatment. Content was created using Anthropic Claude with the following claims: Reduces joint pain by up to 70%, Most prescribed biologic for RA, Proven results in clinical trials. Content includes patient testimonial-style posts, educational infographics about rheumatoid arthritis, and lifestyle tips for arthritis management. Agency used AI to generate initial drafts, then medical review team edited for accuracy. Intended for Facebook, Instagram, and patient portal distribution.';
  
  console.log('--- SCENARIO 2: AI-GENERATED CONTENT REVIEW ---');
  await analyzeGovernanceScenario(router, contentSubmission, 'Content Compliance Review');
  
  // SCENARIO 3: Vendor compliance audit
  const vendorAudit = 'VENDOR AI USAGE AUDIT: Analytics partner ClinData Solutions used Google Bard to analyze 50,000 patient satisfaction surveys for multiple pharmaceutical clients including Pfizer, Merck, and Novartis. AI processing included sentiment analysis, theme extraction, and trend identification. Some surveys contained patient demographics, satisfaction scores, and free-text feedback about medication experiences. Vendor claims all data was anonymized before AI processing. Results were used to generate client reports on drug performance and patient experience insights.';
  
  console.log('--- SCENARIO 3: VENDOR COMPLIANCE AUDIT ---');
  await analyzeGovernanceScenario(router, vendorAudit, 'Vendor Audit Review');
}

async function analyzeGovernanceScenario(router, scenario, scenarioType) {
  try {
    const result = await router.analyzeWithFallback(
      scenario + ' GOVERNANCE ANALYSIS REQUIRED: Evaluate this from the perspective of pharmaceutical regulatory compliance and enterprise AI governance policies. Focus on: 1) Approval recommendation (APPROVE/CONDITIONAL/REJECT) 2) Specific policy concerns 3) Risk mitigation requirements 4) Ongoing monitoring needs', 
      'compliance_analysis', 
      'HIGH'
    );
    
    console.log('Provider:', result.provider);
    console.log('Confidence:', result.confidence);
    console.log('');
    console.log('GOVERNANCE DECISION:');
    console.log(result.analysis.substring(0, 500) + '...');
    console.log('');
    console.log('REASONING:');
    console.log(result.reasoning.substring(0, 300) + '...');
    console.log('');
    console.log('==================================================');
    console.log('');
  } catch (error) {
    console.error('Governance analysis failed:', error.message);
  }
}

testGovernanceScenarios();
