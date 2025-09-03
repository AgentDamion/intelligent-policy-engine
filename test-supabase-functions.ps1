# Test script for Supabase Edge Functions
# Replace the values below with your actual values

# Your Supabase project details
$SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co"  # Replace with your actual project URL
$AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts"  # Replace with your actual agent key
$ANON_KEY = "sb_publishable_WIYHN1J6OUXSlNjmeYgsug_2TaP7s3G"  # Replace with your anon key from Settings > API

Write-Host "Testing Supabase Edge Functions..." -ForegroundColor Green
Write-Host "URL: $SUPABASE_URL" -ForegroundColor Yellow

# Test 1: Basic connectivity
Write-Host "`n1. Testing basic connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/" -Method GET
    Write-Host "✅ Basic connectivity works" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Functions endpoint
Write-Host "`n2. Testing functions endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/" -Method GET
    Write-Host "✅ Functions endpoint accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Functions endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Agent activity function with X-Agent-Key only
Write-Host "`n3. Testing agent activity function (X-Agent-Key only)..." -ForegroundColor Cyan
$headers1 = @{
    'Content-Type' = 'application/json'
    'X-Agent-Key' = $AGENT_KEY
}

$body = @{
    agent = "Test Agent"
    action = "Test action"
    status = "success"
    details = @{test = $true}
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/ingest_agent_activity" -Method POST -Headers $headers1 -Body $body
    Write-Host "✅ Agent activity function works!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
} catch {
    Write-Host "❌ Agent activity function failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.Content.ReadAsStringAsync().Result
        Write-Host "Response body: $responseBody" -ForegroundColor Yellow
    }
}

# Test 4: Agent activity function with Authorization header
Write-Host "`n4. Testing agent activity function (with Authorization)..." -ForegroundColor Cyan
$headers2 = @{
    'Content-Type' = 'application/json'
    'X-Agent-Key' = $AGENT_KEY
    'Authorization' = "Bearer $ANON_KEY"
}

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/ingest_agent_activity" -Method POST -Headers $headers2 -Body $body
    Write-Host "✅ Agent activity function works with Authorization!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
} catch {
    Write-Host "❌ Agent activity function failed with Authorization: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.Content.ReadAsStringAsync().Result
        Write-Host "Response body: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host "`nTest completed!" -ForegroundColor Green
