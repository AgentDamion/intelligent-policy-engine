// Save this as test-agent-functions.js in your project

// Replace these values with your actual Supabase URL and anon key
const SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WIYHN1J6OUXSlNjmeYgsug_2TaP7s3G";

async function testAgentFunctions() {
  console.log("Testing agent functions...");
  
  // Test agent_activities insertion
  try {
    console.log("\n1. Testing ingest_agent_activity...");
    const activityResponse = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
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
    
    const activityResult = await activityResponse.json();
    console.log(`Status: ${activityResponse.status}`);
    console.log("Response:", activityResult);
    
    if (activityResponse.ok) {
      console.log("✅ Agent activity successfully recorded!");
    } else {
      console.log("❌ Failed to record agent activity");
    }
  } catch (error) {
    console.error("Error testing agent activity:", error.message);
  }
  
  // Test ai_agent_decisions insertion
  try {
    console.log("\n2. Testing ingest_ai_decision...");
    const decisionResponse = await fetch(`${SUPABASE_URL}/functions/v1/ingest_ai_decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
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
    
    const decisionResult = await decisionResponse.json();
    console.log(`Status: ${decisionResponse.status}`);
    console.log("Response:", decisionResult);
    
    if (decisionResponse.ok) {
      console.log("✅ AI decision successfully recorded!");
    } else {
      console.log("❌ Failed to record AI decision");
    }
  } catch (error) {
    console.error("Error testing AI decision:", error.message);
  }
}

testAgentFunctions();
