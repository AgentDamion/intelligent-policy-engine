# Deploy Project Validation for Agent Ingestion
Write-Host "🔍 Deploying Project Validation for Agent Ingestion..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "supabase/functions/ingest_agent/index.ts")) {
    Write-Host "❌ Error: Please run this script from the aicomplyr-intelligence directory" -ForegroundColor Red
    exit 1
}

Write-Host "`n1. Running project_id migration..." -ForegroundColor Cyan
try {
    node supabase/run-migrations-direct.mjs run 20250903180000_add_project_id_to_agent_activities.sql
    Write-Host "✅ Project ID migration completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "node supabase/run-migrations-direct.mjs run 20250903180000_add_project_id_to_agent_activities.sql" -ForegroundColor Yellow
}

Write-Host "`n2. Checking Supabase authentication..." -ForegroundColor Cyan
try {
    npx supabase status
    Write-Host "✅ Supabase CLI is authenticated" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not authenticated" -ForegroundColor Red
    Write-Host "Please run: npx supabase login" -ForegroundColor Yellow
    Write-Host "Then run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n3. Deploying updated edge functions..." -ForegroundColor Cyan

Write-Host "Deploying ingest_agent function..." -ForegroundColor Yellow
try {
    npx supabase functions deploy ingest_agent
    Write-Host "✅ ingest_agent function deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ ingest_agent deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "npx supabase functions deploy ingest_agent" -ForegroundColor Yellow
}

Write-Host "Deploying ingest_agent_activity function..." -ForegroundColor Yellow
try {
    npx supabase functions deploy ingest_agent_activity
    Write-Host "✅ ingest_agent_activity function deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ ingest_agent_activity deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "npx supabase functions deploy ingest_agent_activity" -ForegroundColor Yellow
}

Write-Host "`n4. Testing the functions..." -ForegroundColor Cyan
try {
    node test-project-validation.js
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You can run the test manually:" -ForegroundColor Yellow
    Write-Host "node test-project-validation.js" -ForegroundColor Yellow
}

Write-Host "`n�� Project Validation System deployment completed!" -ForegroundColor Green
Write-Host "`nWhat's new:" -ForegroundColor Cyan
Write-Host "1. agent_activities table now includes project_id column" -ForegroundColor White
Write-Host "2. Both edge functions validate project_id before accepting data" -ForegroundColor White
Write-Host "3. Backward compatibility maintained for existing integrations" -ForegroundColor White
Write-Host "4. Project context is automatically enriched in responses" -ForegroundColor White
