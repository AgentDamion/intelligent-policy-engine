# Test Flow Execution Script
# This script invokes the cursor-agent-adapter Edge Function via HTTP

# ============================================================================
# STEP 1: Get your Supabase credentials
# ============================================================================
# You need to get these from your Supabase Dashboard:
# 1. Go to Settings → API
# 2. Copy your Project URL (e.g., https://your-project-ref.supabase.co)
# 3. Copy your Anon Key (the long JWT token)

# Replace these with your actual values:
$supabaseUrl = "https://dqemokpnzasbeytdbzei.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZW1va3BuemFzYmV5dGRiemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgzODQzNiwiZXhwIjoyMDcwNDE0NDM2fQ.FMhwMhsGGv5mxu8mmskswC2X5lYolcEn2AjJFR73KIY"

# ============================================================================
# STEP 2: Load the test payload
# ============================================================================
$payload = Get-Content -Path "test-flow.json" -Raw | ConvertFrom-Json

# ============================================================================
# STEP 3: Invoke the Edge Function
# ============================================================================
Write-Host "🚀 Invoking cursor-agent-adapter function..." -ForegroundColor Cyan
Write-Host "📋 Flow: $($payload.input.flow_name)" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/cursor-agent-adapter" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $anonKey"
            "Content-Type" = "application/json"
        } `
        -Body ($payload | ConvertTo-Json -Depth 10)

    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    # Extract flow run ID if available
    if ($response.result -and $response.result.flowRunId) {
        Write-Host ""
        Write-Host "📊 Flow Run ID: $($response.result.flowRunId)" -ForegroundColor Cyan
        Write-Host "Status: $($response.result.status)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ Error occurred!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "1. Check that your Supabase URL is correct" -ForegroundColor Gray
    Write-Host "2. Verify your Anon Key is correct" -ForegroundColor Gray
    Write-Host "3. Ensure the cursor-agent-adapter function is deployed" -ForegroundColor Gray
    Write-Host "4. Check Edge Function logs in Supabase Dashboard" -ForegroundColor Gray
}

