// Fixed Test Workflow: Address the identified issues

const testScenarios = [
    {
      name: "Low Risk Tool Approval",
      contextData: {
        // Try multiple input formats to see what works
        organizationId: "123e4567-e89b-12d3-a456-426614174000",
        request: "We need to use ChatGPT for content generation",
        userMessage: "We need to use ChatGPT for content generation", 
        message: "We need to use ChatGPT for content generation",
        content: "We need to use ChatGPT for content generation",
        toolName: "ChatGPT",
        vendor: "OpenAI",
        urgency: "normal"
      },
      policyData: {
        tool: "ChatGPT",
        vendor: "OpenAI",
        usage: "Content generation",
        dataHandling: "No customer data"
      }
    }
  ];
  
  async function runFixedWorkflowTest() {
    console.log("🚀 Starting Fixed Meta-Loop Workflow Test...\n");
    
    const API_URL = "http://localhost:3000/api";
    const organizationId = "123e4567-e89b-12d3-a456-426614174000";
    
    for (const scenario of testScenarios) {
      console.log(`\n📋 Testing: ${scenario.name}`);
      console.log(`   Tool: ${scenario.contextData.toolName}`);
      
      try {
        // Step 1: Context Analysis with better input format
        console.log("   → Running context analysis...");
        const contextResponse = await fetch(`${API_URL}/process/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scenario.contextData)
        });
        
        if (!contextResponse.ok) {
          throw new Error(`Context API returned ${contextResponse.status}`);
        }
        
        const contextResult = await contextResponse.json();
        console.log(`     Context: ${contextResult.urgency?.level ? 'success' : 'partial'}`);
        console.log(`     Urgency Level: ${contextResult.urgency?.level || 'N/A'}`);
        console.log(`     Original Content: ${contextResult.originalContent?.substring(0, 50) || 'N/A'}...`);
      
        // Step 2: Policy Evaluation with corrected input format
        console.log("   → Running policy evaluation...");
        
        // Try different input formats for the policy agent
        const policyInputs = [
          // Format 1: Direct context embedding
          {
            organizationId,
            contextOutput: contextResult,
            urgency: contextResult.urgency,
            ...scenario.policyData
          },
          // Format 2: Flattened structure
          {
            organizationId,
            ...contextResult,
            ...scenario.policyData
          },
          // Format 3: Nested structure
          {
            organizationId,
            context: contextResult,
            policyData: scenario.policyData
          }
        ];
  
        let policyResult = null;
        let successfulFormat = null;
  
        for (let i = 0; i < policyInputs.length; i++) {
          try {
            console.log(`     Trying policy input format ${i + 1}...`);
            const policyResponse = await fetch(`${API_URL}/process/policy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(policyInputs[i])
            });
            
            if (!policyResponse.ok) {
              console.log(`     Format ${i + 1}: HTTP ${policyResponse.status}`);
              continue;
            }
            
            policyResult = await policyResponse.json();
            
            // Check if policy agent succeeded
            if (policyResult.results?.policy?.status !== 'failed') {
              successfulFormat = i + 1;
              console.log(`     ✅ Format ${i + 1} worked!`);
              break;
            } else {
              console.log(`     Format ${i + 1}: Policy failed - ${policyResult.results.policy.error}`);
            }
            
          } catch (formatError) {
            console.log(`     Format ${i + 1}: Error - ${formatError.message}`);
          }
        }
  
        if (!policyResult) {
          console.log("     ❌ All policy formats failed");
          continue;
        }
  
        console.log(`     Decision: ${policyResult.decision || policyResult.status || 'N/A'}`);
        console.log(`     Risk Score: ${policyResult.riskScore || 'N/A'}`);
        console.log(`     Successful Format: ${successfulFormat}`);
        
        // Show detailed results
        console.log(`     Policy Status: ${policyResult.results?.policy?.status}`);
        console.log(`     Audit Status: ${policyResult.results?.audit?.status}`);
        console.log(`     Brand Status: ${policyResult.results?.brand?.skipped ? 'Skipped' : policyResult.results?.brand?.status}`);
  
        // Step 3: Negotiation (if conditional)
        if (policyResult.decision === 'conditional' || policyResult.status === 'conditional') {
          console.log("   → Running negotiation...");
          try {
            const negotiationResponse = await fetch(`${API_URL}/process/negotiation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organizationId,
                policyResult,
                context: contextResult,
                proposedConditions: ["Will not process customer data", "Monthly audit reviews"]
              })
            });
            
            if (negotiationResponse.ok) {
              const negotiationResult = await negotiationResponse.json();
              console.log(`     Negotiation: ${negotiationResult.status || 'complete'}`);
            } else {
              console.log(`     Negotiation: HTTP ${negotiationResponse.status}`);
            }
          } catch (negError) {
            console.log(`     Negotiation: Error - ${negError.message}`);
          }
        }
      
        console.log("   ✅ Workflow complete");
        
        // Wait between scenarios
        await new Promise(resolve => setTimeout(resolve, 1000));
      
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        if (error.stack) {
          console.error(`     Stack: ${error.stack.split('\n')[1]}`);
        }
      }
    }
    
    console.log("\n✨ Fixed test workflow complete!");
    console.log("\n🔧 Key Findings:");
    console.log("   - Check which input format worked for policy evaluation");
    console.log("   - Verify context analysis extracts user message correctly");
    console.log("   - Note any missing or unimplemented agents");
  }
  
  // Add fetch for Node.js if needed
  if (typeof fetch === 'undefined') {
    try {
      global.fetch = require('node-fetch');
    } catch (error) {
      console.error("Please install node-fetch: npm install node-fetch@2");
      process.exit(1);
    }
  }
  
  runFixedWorkflowTest().catch(console.error);