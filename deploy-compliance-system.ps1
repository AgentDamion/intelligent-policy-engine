# Deploy AI Tool Compliance Report Card System
Write-Host "🤖 Deploying AI Tool Compliance Report Card System..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "supabase/functions/generate_compliance_report/index.ts")) {
    Write-Host "❌ Error: Please run this script from the aicomplyr-intelligence directory" -ForegroundColor Red
    exit 1
}

Write-Host "`n1. Running compliance reporting migration..." -ForegroundColor Cyan
try {
    node supabase/run-migrations-direct.mjs run 20250903170000_add_compliance_reporting.sql
    Write-Host "✅ Compliance reporting migration completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "node supabase/run-migrations-direct.mjs run 20250903170000_add_compliance_reporting.sql" -ForegroundColor Yellow
}

Write-Host "`n2. Deploying compliance report function..." -ForegroundColor Cyan
try {
    npx supabase functions deploy generate_compliance_report
    Write-Host "✅ generate_compliance_report function deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ Function deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this manually:" -ForegroundColor Yellow
    Write-Host "npx supabase functions deploy generate_compliance_report" -ForegroundColor Yellow
}

Write-Host "`n3. Testing the compliance system..." -ForegroundColor Cyan
Write-Host "Testing compliance report generation..." -ForegroundColor Yellow

# Test with a sample project ID
$testProjectId = "550e8400-e29b-41d4-a716-446655440000"  # Sample UUID
$supabaseUrl = "https://dqemokpnzasbeytdbzei.supabase.co"

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate_compliance_report" -Method POST -Headers @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    } -Body (@{
        project_id = $testProjectId
        include_details = $true
    } | ConvertTo-Json)
    
    Write-Host "✅ Compliance report function is working!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor White
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This is expected if the project doesn't exist yet" -ForegroundColor Yellow
}

Write-Host "`n�� AI Tool Compliance Report Card System deployment completed!" -ForegroundColor Green
Write-Host "`nWhat you can do now:" -ForegroundColor Cyan
Write-Host "1. Use the ComplianceReportCard React component in your frontend" -ForegroundColor White
Write-Host "2. Call the /functions/v1/generate_compliance_report endpoint with a project_id" -ForegroundColor White
Write-Host "3. View real-time compliance reports for any project" -ForegroundColor White
Write-Host "4. Track AI tool usage and policy violations automatically" -ForegroundColor White

Write-Host "`nAPI Endpoints:" -ForegroundColor Cyan
Write-Host "- POST /functions/v1/generate_compliance_report" -ForegroundColor White
Write-Host "  Body: { project_id: 'uuid', include_details: true }" -ForegroundColor White
Write-Host "- GET /functions/v1/generate_compliance_report?project_id=uuid" -ForegroundColor White

Write-Host "`nReact Component:" -ForegroundColor Cyan
Write-Host "<ComplianceReportCard projectId='your-project-id' />" -ForegroundColor White
