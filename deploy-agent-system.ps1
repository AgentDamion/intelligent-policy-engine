# Deploy Agent Ingestion System
# This script deploys the agent tables and edge functions

Write-Host "🚀 Deploying Agent Ingestion System..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "supabase/functions/ingest_agent/index.ts")) {
    Write-Host "❌ Error: Please run this script from the aicomplyr-intelligence directory" -ForegroundColor Red
    exit 1
}

Write-Host "`n1. Running agent tables migration..." -ForegroundColor Cyan
try {
    node supabase/run-migrations-direct.mjs run 20250903160000_add_agent_tables.sql
    Write-Host "✅ Agent tables migration completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "node supabase/run-migrations-direct.mjs run 20250903160000_add_agent_tables.sql" -ForegroundColor Yellow
}

Write-Host "`n2. Deploying edge functions..." -ForegroundColor Cyan

# Deploy ingest_agent function
Write-Host "Deploying ingest_agent function..." -ForegroundColor Yellow
try {
    npx supabase functions deploy ingest_agent
    Write-Host "✅ ingest_agent function deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ ingest_agent deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "npx supabase functions deploy ingest_agent" -ForegroundColor Yellow
}

# Deploy ingest_agent_activity function
Write-Host "Deploying ingest_agent_activity function..." -ForegroundColor Yellow
try {
    npx supabase functions deploy ingest_agent_activity
    Write-Host "✅ ingest_agent_activity function deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ ingest_agent_activity deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "npx supabase functions deploy ingest_agent_activity" -ForegroundColor Yellow
}

Write-Host "`n3. Setting up environment secrets..." -ForegroundColor Cyan
Write-Host "Setting AGENT_INGEST_KEY secret..." -ForegroundColor Yellow
try {
    npx supabase secrets set AGENT_INGEST_KEY=corhosvgetuv7q61xsv4ingyznz7y7le1lts
    Write-Host "✅ AGENT_INGEST_KEY secret set" -ForegroundColor Green
} catch {
    Write-Host "❌ Secret setting failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "npx supabase secrets set AGENT_INGEST_KEY=corhosvgetuv7q61xsv4ingyznz7y7le1lts" -ForegroundColor Yellow
}

Write-Host "`n4. Testing the implementation..." -ForegroundColor Cyan
Write-Host "Running test scripts..." -ForegroundColor Yellow

# Test the functions
Write-Host "`nTesting with working-test.ps1..." -ForegroundColor Yellow
try {
    pwsh ../working-test.ps1
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You can run the test manually:" -ForegroundColor Yellow
    Write-Host "pwsh ../working-test.ps1" -ForegroundColor Yellow
}

Write-Host "`n🎉 Agent Ingestion System deployment completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Verify the functions are working with your test scripts" -ForegroundColor White
Write-Host "2. Update your frontend hooks to use the new data" -ForegroundColor White
Write-Host "3. Test the HMAC signature verification with Cursor agents" -ForegroundColor White

Write-Host "`nAvailable endpoints:" -ForegroundColor Cyan
Write-Host "- POST /functions/v1/ingest_agent (with HMAC signature)" -ForegroundColor White
Write-Host "- POST /functions/v1/ingest_agent_activity (with X-Agent-Key)" -ForegroundColor White
