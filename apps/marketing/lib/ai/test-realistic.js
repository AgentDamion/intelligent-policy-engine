import dotenv from 'dotenv';
import { AIRouter } from './router.js';

dotenv.config({ path: '../../.env' });

async function testRealisticContent() {
  console.log('Testing AI Router with Realistic Pharmaceutical Content...');
  
  const router = new AIRouter();
  
  // More realistic pharmaceutical document content
  const testDocument = 'PRODUCT INFORMATION: Brand Name: DiabetEase XR, Generic Name: Metformin Extended Release 750mg, Indication: Type 2 Diabetes Mellitus, Target Population: Adults aged 18-65. CLINICAL CLAIMS: Reduces HbA1c by up to 2.1% compared to placebo, Once-daily dosing improves patient compliance, Lower GI side effects than immediate-release formulation. MARKETING COPY DRAFT: Revolutionary diabetes management made simple. DiabetEase XR delivers powerful glucose control with the convenience of once-daily dosing. Clinical studies show significant HbA1c reduction while minimizing side effects. REGULATORY STATUS: FDA Phase III trials completed, Pending FDA approval, Intended for US market launch Q3 2025';
  
  try {
    console.log('Analyzing pharmaceutical document...');
    console.log('');
    
    const result = await router.analyzeWithFallback(
      testDocument, 
      'compliance_analysis', 
      'HIGH'
    );
    
    console.log('=== ANALYSIS RESULTS ===');
    console.log('Provider used:', result.provider);
    console.log('Confidence:', result.confidence);
    console.log('');
    console.log('=== COMPLIANCE ANALYSIS ===');
    console.log(result.analysis);
    console.log('');
    console.log('=== AI REASONING ===');
    console.log(result.reasoning);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRealisticContent();
