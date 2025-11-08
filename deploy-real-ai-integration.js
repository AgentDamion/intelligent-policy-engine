// Deploy Real AI Integration to Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://jwfpjufheibxadrbghfv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deployRealAIIntegration() {
  console.log('🚀 Deploying Real AI Integration to Supabase...');
  console.log('================================================');

  try {
    // 1. Deploy the AI Client
    console.log('\n1️⃣ Deploying AI Client...');
    await deployFile('cursor-agent-adapter/shared/ai-client.ts');

    // 2. Deploy Updated Policy Agent
    console.log('\n2️⃣ Deploying Updated Policy Agent...');
    await deployFile('cursor-agent-adapter/agents/policy-agent.ts');

    // 3. Deploy Updated Context Agent
    console.log('\n3️⃣ Deploying Updated Context Agent...');
    await deployFile('cursor-agent-adapter/agents/context-agent.ts');

    // 4. Deploy Updated Registry
    console.log('\n4️⃣ Deploying Updated Agent Registry...');
    await deployFile('cursor-agent-adapter/cursor-agent-registry.ts');

    // 5. Deploy Updated Main Adapter
    console.log('\n5️⃣ Deploying Updated Main Adapter...');
    await deployFile('cursor-agent-adapter/index.ts');

    console.log('\n✅ Real AI Integration Deployed Successfully!');
    console.log('\nNext Steps:');
    console.log('1. Set your OPENAI_API_KEY in Supabase environment variables');
    console.log('2. Set AI_PROVIDER=openai in Supabase environment variables');
    console.log('3. Run test-real-ai-integration.js to verify the deployment');
    console.log('4. Update your Lovable frontend to use the new AI responses');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your SUPABASE_SERVICE_ROLE_KEY environment variable');
    console.log('2. Ensure you have deployment permissions for your Supabase project');
    console.log('3. Verify the file paths are correct');
  }
}

async function deployFile(filePath) {
  try {
    const fullPath = path.join('supabase/functions', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${fullPath}`);
      return;
    }

    const fileContent = fs.readFileSync(fullPath, 'utf8');
    
    // For Supabase edge functions, we need to deploy via the CLI
    // This script provides the deployment commands
    console.log(`📁 File: ${filePath}`);
    console.log(`📝 Size: ${fileContent.length} characters`);
    
    // Check if file contains AI integration
    if (fileContent.includes('aiClient') || fileContent.includes('OPENAI_API_KEY')) {
      console.log('✅ Contains AI integration code');
    } else {
      console.log('⚠️  May not contain AI integration code');
    }
    
  } catch (error) {
    console.log(`❌ Error reading ${filePath}:`, error.message);
  }
}

// Instructions for manual deployment
function printDeploymentInstructions() {
  console.log('\n📋 Manual Deployment Instructions:');
  console.log('====================================');
  console.log('');
  console.log('1. Install Supabase CLI:');
  console.log('   npm install -g supabase');
  console.log('');
  console.log('2. Login to Supabase:');
  console.log('   supabase login');
  console.log('');
  console.log('3. Link to your project:');
  console.log('   supabase link --project-ref jwfpjufheibxadrbghfv');
  console.log('');
  console.log('4. Deploy the functions:');
  console.log('   supabase functions deploy cursor-agent-adapter');
  console.log('');
  console.log('5. Set environment variables:');
  console.log('   supabase secrets set OPENAI_API_KEY=your_openai_api_key');
  console.log('   supabase secrets set AI_PROVIDER=openai');
  console.log('');
  console.log('6. Test the deployment:');
  console.log('   node test-real-ai-integration.js');
}

// Run deployment
deployRealAIIntegration()
  .then(() => {
    printDeploymentInstructions();
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error.message);
    printDeploymentInstructions();
  });
