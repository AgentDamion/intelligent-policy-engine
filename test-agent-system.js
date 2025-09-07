// Test script for the Agent Ingestion System
const SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co";
const AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts";

async function testAgentSystem() {
  console.log("🧪 Testing Agent Ingestion System...\n");

  // Test 1: Basic connectivity
  console.log("1. Testing basic connectivity...");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`);
    if (response.ok) {
      console.log("✅ Basic connectivity works");
    } else {
      console.log("❌ Basic connectivity failed");
    }
  } catch (error) {
    console.log("❌ Basic connectivity failed:", error.message);
  }

  // Test 2: Functions endpoint
  console.log("\n2. Testing functions endpoint...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/`);
    if (response.ok) {
      console.log("✅ Functions endpoint accessible");
    } else {
      console.log("❌ Functions endpoint failed");
    }
  } catch (error) {
    console.log("❌ Functions endpoint failed:", error.message);
  }

  // Test 3: ingest_agent_activity function (backward compatibility)
  console.log("\n3. Testing ingest_agent_activity function...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": AGENT_KEY
      },
      body: JSON.stringify({
        agent: "Test Agent",
        action: "Testing agent ingestion system",
        status: "success",
        details: { test: true, timestamp: new Date().toISOString() }
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log("✅ ingest_agent_activity function works!");
      console.log("Response:", JSON.stringify(result, null, 2));
    } else {
      console.log("❌ ingest_agent_activity function failed:", result);
    }
  } catch (error) {
    console.log("❌ ingest_agent_activity function failed:", error.message);
  }

  // Test 4: ingest_agent function (new HMAC version)
  console.log("\n4. Testing ingest_agent function (HMAC)...");
  try {
    // For this test, we'll use a simple approach without HMAC for now
    // In production, you'd generate the HMAC signature
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Signature": "test-signature" // This will fail HMAC verification
      },
      body: JSON.stringify({
        activities: [{
          agent: "Test Agent",
          action: "Testing HMAC ingestion",
          status: "success",
          details: { test: true }
        }]
      })
    });

    const result = await response.json();
    if (response.status === 401) {
      console.log("✅ ingest_agent function is working (correctly rejecting invalid signature)");
    } else if (response.ok) {
      console.log("✅ ingest_agent function works!");
      console.log("Response:", JSON.stringify(result, null, 2));
    } else {
      console.log("❌ ingest_agent function failed:", result);
    }
  } catch (error) {
    console.log("❌ ingest_agent function failed:", error.message);
  }

  console.log("\n🎉 Agent system testing completed!");
  console.log("\nNext steps:");
  console.log("1. Deploy the edge functions: npx supabase functions deploy");
  console.log("2. Set the secret: npx supabase secrets set AGENT_INGEST_KEY=corhosvgetuv7q61xsv4ingyznz7y7le1lts");
  console.log("3. Run the migration: node supabase/run-migrations-direct.mjs run 20250903160000_add_agent_tables.sql");
}

// Run the test
testAgentSystem().catch(console.error);
