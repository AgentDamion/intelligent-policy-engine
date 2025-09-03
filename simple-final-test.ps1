# Simple final test
$SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co"
$AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts"

Write-Host "Testing agent activity..." -ForegroundColor Green

$headers = @{
    "Content-Type" = "application/json"
    "X-Agent-Key" = $AGENT_KEY
}

$body = @{
    agent = "Test Agent"
    action = "Test action"
    status = "success"
    details = @{test = $true}
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/ingest_agent_activity" -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
