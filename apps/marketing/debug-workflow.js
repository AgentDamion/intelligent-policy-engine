// Debug Workflow: Identify and fix the issues
// Save this as: debug-workflow.js

async function debugWorkflow() {
  console.log("🔍 Debugging Workflow Issues...\n");
  
  const API_URL = "http://localhost:3000/api";
  const organizationId = "123e4567-e89b-12d3-a456-426614174000";

  // Test 1: Check what context analysis expects vs receives
  console.log("1️⃣ Testing Context Analysis Input Format:");
  
  const testContextInput = {
    organizationId,
    request: "We need to use ChatGPT for content generation",
    toolName: "ChatGPT",
    vendor: "OpenAI",
    urgency: "normal",
    // Try different input formats
    userMessage: "We need to use ChatGPT for content generation",
    message: "We need to use ChatGPT for content generation",
    content: "We need to use ChatGPT for content generation"
  };

  try {
    const contextResponse = await fetch(`${API_URL}/process/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testContextInput)
    });
    const contextResult = await contextResponse.json();
    
    console.log("📥 Input sent:", JSON.stringify(testContextInput, null, 2));
    console.log("📤 Context result structure:");
    console.log("  - urgency:", contextResult.urgency);
    console.log("  - originalContent:", contextResult.originalContent);
    console.log("  - rawContent:", contextResult.rawContent);
    
    // Test 2: Check what policy agent expects
    console.log("\n2️⃣ Testing Policy Agent Input:");
    
    const testPolicyInput = {
      organizationId,
      // Try different ways to pass context
      contextOutput: contextResult,
      contextAnalysis: contextResult,
      context: contextResult,
      urgency: contextResult.urgency,
      // Tool data
      tool: "ChatGPT",
      vendor: "OpenAI", 
      usage: "Content generation",
      dataHandling: "No customer data"
    };

    console.log("📥 Policy input structure:");
    console.log("  - contextOutput.urgency:", testPolicyInput.contextOutput?.urgency);
    console.log("  - urgency direct:", testPolicyInput.urgency);

    const policyResponse = await fetch(`${API_URL}/process/policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPolicyInput)
    });
    const policyResult = await policyResponse.json();
    
    console.log("📤 Policy result:");
    console.log("  - workflow:", policyResult.workflow);
    console.log("  - policy status:", policyResult.results?.policy?.status);
    console.log("  - policy error:", policyResult.results?.policy?.error);

  } catch (error) {
    console.error("❌ Debug error:", error.message);
  }

  // Test 3: Check available agents
  console.log("\n3️⃣ Checking Available Agents:");
  try {
    // This endpoint might not exist, but let's try
    const agentsResponse = await fetch(`${API_URL}/agents`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (agentsResponse.ok) {
      const agents = await agentsResponse.json();
      console.log("📋 Available agents:", agents);
    } else {
      console.log("ℹ️ No /api/agents endpoint found");
    }
  } catch (error) {
    console.log("ℹ️ Could not check agents endpoint");
  }

  // Test 4: Check if we can hit individual agent endpoints
  console.log("\n4️⃣ Testing Individual Endpoints:");
  const endpoints = [
    '/process/context',
    '/process/policy', 
    '/process/brand',
    '/process/audit',
    '/process/negotiation'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, test: true })
      });
      
      const result = await response.json();
      console.log(`  ${endpoint}: ${response.status} - ${result.error || 'OK'}`);
    } catch (error) {
      console.log(`  ${endpoint}: ERROR - ${error.message}`);
    }
  }
}

// Add fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

debugWorkflow().catch(console.error);