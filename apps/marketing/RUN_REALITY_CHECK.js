/**
 * Quick Reality Check Execution Script
 * 
 * Run this to validate the platform readiness with actual tests
 */

const RealityCheckValidator = require('./REALITY_CHECK_VALIDATION.js');

async function runRealityCheck() {
  console.log('🚀 Starting AICOMPLYR.io Reality Check...\n');
  
  // Check if API is running
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  console.log(`📍 Testing against: ${baseUrl}`);
  
  try {
    // Test API connectivity first
    const axios = require('axios');
    const healthCheck = await axios.get(`${baseUrl}/api/health`);
    
    if (healthCheck.status === 200) {
      console.log('✅ API is running and accessible\n');
    } else {
      console.log('❌ API is not responding properly\n');
      process.exit(1);
    }
    
    // Run the reality check
    const validator = new RealityCheckValidator();
    await validator.runRealityChecks();
    
  } catch (error) {
    console.error('❌ Reality check failed to start:', error.message);
    console.log('\n💡 Make sure your API server is running on port 3000');
    console.log('💡 Or set API_URL environment variable to point to your server');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runRealityCheck();
}

module.exports = { runRealityCheck };
