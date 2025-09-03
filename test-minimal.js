// Test with absolute minimum fields
const SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co";
const AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts";

async function testMinimal() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": AGENT_KEY
      },
      body: JSON.stringify({
        agent: "Test",
        action: "Test",
        status: "success"
      })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testMinimal();
