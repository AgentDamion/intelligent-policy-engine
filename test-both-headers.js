// Test with both Authorization and X-Agent-Key headers
const SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co";
const AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts";
const PUBLISHABLE_KEY = "sb_publishable_WIYHN1J6OUXSlNjmeYgsug_2TaP7s3G";

async function testAgentFunctions() {
  console.log("Testing agent functions with both headers...");
  
  // Test agent_activities insertion
  try {
    console.log("\n1. Testing ingest_agent_activity...");
    const activityResponse = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": AGENT_KEY,
        "Authorization": `Bearer ${PUBLISHABLE_KEY}`
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
}

testAgentFunctions();
