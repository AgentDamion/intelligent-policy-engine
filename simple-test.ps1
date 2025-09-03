# Simple test for Supabase Edge Functions
$SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co"
$AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts"

Write-Host "Testing Edge Function with simple curl-like approach..." -ForegroundColor Green

# Test with curl (if available)
Write-Host "`nTrying with curl..." -ForegroundColor Cyan
$curlCommand = @"
curl -X POST "$SUPABASE_URL/functions/v1/ingest_agent_activity" -H "Content-Type: application/json" -H "X-Agent-Key: $AGENT_KEY" -d '{\"agent\": \"Test Agent\", \"action\": \"Test action\", \"status\": \"success\"}'
"@

Write-Host "Command: $curlCommand" -ForegroundColor Yellow

try {
    $result = Invoke-Expression $curlCommand
    Write-Host "✅ Curl result: $result" -ForegroundColor Green
} catch {
    Write-Host "❌ Curl failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test with Invoke-WebRequest (more reliable than Invoke-RestMethod)
Write-Host "`nTrying with Invoke-WebRequest..." -ForegroundColor Cyan
$headers = @{
    'Content-Type' = 'application/json'
    'X-Agent-Key' = $AGENT_KEY
}

$body = '{"agent": "Test Agent", "action": "Test action", "status": "success"}'

try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/ingest_agent_activity" -Method POST -Headers $headers -Body $body
    Write-Host "✅ WebRequest success!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ WebRequest failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Yellow
    }
}
