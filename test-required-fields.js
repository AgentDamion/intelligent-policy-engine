// Test with all required fields
const SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co";
const AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts";

async function testWithRequiredFields() {
  console.log("Testing with all required fields...");
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": AGENT_KEY
      },
      body: JSON.stringify({
        agent: "Test Agent",
        action: "Test Action",
        status: "success"
      })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log("✅ SUCCESS! Data should be in your database now.");
    } else {
      console.log("❌ Still having issues");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testWithRequiredFields();
