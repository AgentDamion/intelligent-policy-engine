# Working test for Supabase Edge Functions
$SUPABASE_URL = "https://dqemokpnzasbeytdbzei.supabase.co"
$AGENT_KEY = "corhosvgetuv7q61xsv4ingyznz7y7le1lts"
$PUBLISHABLE_KEY = "sb_publishable_WIYHN1J6OUXSlNjmeYgsug_2TaP7s3G"

Write-Host "Testing Edge Function with correct headers..." -ForegroundColor Green

$headers = @{
    'Content-Type' = 'application/json'
    'X-Agent-Key' = $AGENT_KEY
    'Authorization' = "Bearer $PUBLISHABLE_KEY"
}

$body = @{
    agent = "Test Agent"
    action = "Test action"
    status = "success"
    details = @{test = $true}
} | ConvertTo-Json

Write-Host "Headers:" -ForegroundColor Yellow
$headers | Format-Table

Write-Host "Body:" -ForegroundColor Yellow
Write-Host $body

Write-Host "`nTesting agent activity function..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/ingest_agent_activity" -Method POST -Headers $headers -Body $body
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Yellow
        
        # Try to read the response content
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseContent = $reader.ReadToEnd()
            Write-Host "Response Content: $responseContent" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not read response content" -ForegroundColor Yellow
        }
    }
}
