# Debug test for Supabase Edge Functions
$SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co"
$AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts"
$PUBLISHABLE_KEY = "sb_publishable_WIYHN1J6OUXSlNjmeYgsug_2TaP7s3G"

Write-Host "Debug test for Edge Functions..." -ForegroundColor Green

# Test 1: Just the X-Agent-Key (as our function should work)
Write-Host "`n1. Testing with X-Agent-Key only..." -ForegroundColor Cyan
$headers1 = @{
    'Content-Type' = 'application/json'
    'X-Agent-Key' = $AGENT_KEY
}

$body = '{"agent": "Test Agent", "action": "Test action", "status": "success"}'

try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/ingest_agent_activity" -Method POST -Headers $headers1 -Body $body
    Write-Host "✅ X-Agent-Key only: SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ X-Agent-Key only: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: With Authorization header
Write-Host "`n2. Testing with Authorization header..." -ForegroundColor Cyan
$headers2 = @{
    'Content-Type' = 'application/json'
    'X-Agent-Key' = $AGENT_KEY
    'Authorization' = "Bearer $PUBLISHABLE_KEY"
}

try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/ingest_agent_activity" -Method POST -Headers $headers2 -Body $body
    Write-Host "✅ With Authorization: SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ With Authorization: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check if the function exists at all
Write-Host "`n3. Testing if function exists..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/ingest_agent_activity" -Method GET
    Write-Host "✅ Function exists (GET): $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Function check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Try the other function
Write-Host "`n4. Testing ingest_ai_decision function..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/ingest_ai_decision" -Method POST -Headers $headers1 -Body '{"agent": "Test Agent", "action": "Test decision", "outcome": "Approved"}'
    Write-Host "✅ AI Decision function: SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ AI Decision function: $($_.Exception.Message)" -ForegroundColor Red
}
