// Test script for project validation in agent ingestion
const SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co";
const AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts";

async function testProjectValidation() {
  console.log("🧪 Testing Project Validation in Agent Ingestion...\n");

  // Test 1: Valid project_id
  console.log("1. Testing with valid project_id...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": AGENT_KEY
      },
      body: JSON.stringify({
        agent: "Test Agent",
        action: "Testing project validation",
        status: "success",
        project_id: "550e8400-e29b-41d4-a716-446655440000", // Sample UUID
        details: { test: true }
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log("✅ Valid project_id test passed");
      console.log("Response:", JSON.stringify(result, null, 2));
    } else {
      console.log("❌ Valid project_id test failed:", result);
    }
  } catch (error) {
    console.log("❌ Valid project_id test failed:", error.message);
  }

  // Test 2: Invalid project_id
  console.log("\n2. Testing with invalid project_id...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": AGENT_KEY
      },
      body: JSON.stringify({
        agent: "Test Agent",
        action: "Testing invalid project",
        status: "success",
        project_id: "00000000-0000-0000-0000-000000000000", // Invalid UUID
        details: { test: true }
      })
    });

    const result = await response.json();
    if (response.status === 400) {
      console.log("✅ Invalid project_id correctly rejected");
      console.log("Error:", result.error);
    } else {
      console.log("❌ Invalid project_id should have been rejected");
      console.log("Response:", result);
    }
  } catch (error) {
    console.log("❌ Invalid project_id test failed:", error.message);
  }

  // Test 3: No project_id (backward compatibility)
  console.log("\n3. Testing without project_id (backward compatibility)...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest_agent_activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": AGENT_KEY
      },
      body: JSON.stringify({
        agent: "Test Agent",
        action: "Testing without project_id",
        status: "success",
        details: { test: true }
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log("✅ Backward compatibility test passed");
      console.log("Response:", JSON.stringify(result, null, 2));
    } else {
      console.log("❌ Backward compatibility test failed:", result);
    }
  } catch (error) {
    console.log("❌ Backward compatibility test failed:", error.message);
  }

  console.log("\n�� Project validation testing completed!");
  console.log("\nNext steps:");
  console.log("1. Run the migration: node supabase/run-migrations-direct.mjs run 20250903180000_add_project_id_to_agent_activities.sql");
  console.log("2. Deploy the updated functions: npx supabase functions deploy ingest_agent ingest_agent_activity");
  console.log("3. Test with real project IDs from your database");
}

// Run the test
testProjectValidation().catch(console.error);
