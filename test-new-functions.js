// Test the new Supabase-provided functions
const SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co";

async function testNewFunctions() {
  console.log("Testing new Supabase-provided functions...");
  
  // 1. Test the basic test function first
  try {
    console.log("\n1. Testing basic test-function...");
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/test-function?name=Tester`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    console.log(`Status: ${testResponse.status}`);
    const testData = await testResponse.json();
    console.log("Response:", testData);
    
    if (testResponse.ok) {
      console.log("✅ Basic function execution works!");
    } else {
      console.log("❌ Basic function execution failed");
      return;
    }
  } catch (error) {
    console.error("Error testing basic function:", error.message);
    return;
  }
  
  // 2. Test agent activity function
  try {
    console.log("\n2. Testing ingest_agent_activity...");
    const activityResponse = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        agent: "SecurityAgent",
        action: "scan_system",
        status: "success",
        details: {
          scan_id: "12345",
          duration: "2.5s",
          findings: 0
        }
      })
    });
    
    console.log(`Status: ${activityResponse.status}`);
    const activityData = await activityResponse.json();
    console.log("Response:", activityData);
    
    if (activityResponse.ok) {
      console.log("✅ Agent activity successfully recorded!");
    } else {
      console.log("❌ Failed to record agent activity");
    }
  } catch (error) {
    console.error("Error testing agent activity:", error.message);
  }
  
  // 3. Test AI decision function
  try {
    console.log("\n3. Testing ingest_ai_decision...");
    const decisionResponse = await fetch(`${SUPABASE_URL}/functions/v1/ingest_ai_decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        agent: "RiskAnalyzer",
        action: "evaluate_threat",
        outcome: "mitigated",
        risk: "medium",
        details: {
          threat_type: "suspicious_login",
          confidence: 0.89,
          actions_taken: ["blocked_ip", "notified_admin"]
        }
      })
    });
    
    console.log(`Status: ${decisionResponse.status}`);
    const decisionData = await decisionResponse.json();
    console.log("Response:", decisionData);
    
    if (decisionResponse.ok) {
      console.log("✅ AI decision successfully recorded!");
    } else {
      console.log("❌ Failed to record AI decision");
    }
  } catch (error) {
    console.error("Error testing AI decision:", error.message);
  }
}

testNewFunctions().catch(console.error);
