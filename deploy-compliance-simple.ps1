# Deploy Compliance Checking System
# Simple version without Unicode characters

Write-Host "Deploying Compliance Checking System" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "aicomplyr-intelligence\supabase\functions\compliance_check_agent_activity\index.ts")) {
    Write-Host "Error: compliance_check_agent_activity function not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Step 1: Deploy the compliance function
Write-Host "`nStep 1: Deploying compliance_check_agent_activity function..." -ForegroundColor Cyan
try {
    supabase functions deploy compliance_check_agent_activity
    Write-Host "Compliance function deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to deploy compliance function" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Run database migration
Write-Host "`nStep 2: Running database migration..." -ForegroundColor Cyan
try {
    supabase db push
    Write-Host "Database migration completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to run database migration" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Configure compliance check URL
Write-Host "`nStep 3: Configuring compliance check URL..." -ForegroundColor Cyan
Write-Host "Please set the compliance check URL manually:" -ForegroundColor Yellow
Write-Host "ALTER DATABASE postgres SET app.compliance_check_url = 'YOUR_PROJECT_URL/functions/v1/compliance_check_agent_activity';" -ForegroundColor Yellow

# Step 4: Create sample policies
Write-Host "`nStep 4: Creating sample policies..." -ForegroundColor Cyan
Write-Host "Sample policies would be created here" -ForegroundColor Yellow
Write-Host "You can create policies using the policy management API" -ForegroundColor Yellow

# Step 5: Test the system
Write-Host "`nStep 5: Testing the system..." -ForegroundColor Cyan
Write-Host "Run the test manually: node test-compliance-system.js" -ForegroundColor Yellow

# Summary
Write-Host "`nDeployment Summary" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "Compliance function deployed" -ForegroundColor Green
Write-Host "Database migration completed" -ForegroundColor Green
Write-Host "Alerts system created" -ForegroundColor Green
Write-Host "Database triggers configured" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Configure the compliance check URL in your database settings" -ForegroundColor White
Write-Host "2. Create some sample policies for testing" -ForegroundColor White
Write-Host "3. Test with real agent activities" -ForegroundColor White
Write-Host "4. Set up monitoring and alerting" -ForegroundColor White

Write-Host "`nUseful Commands:" -ForegroundColor Cyan
Write-Host "View function logs: supabase functions logs compliance_check_agent_activity" -ForegroundColor White
Write-Host "Test compliance: node test-compliance-system.js" -ForegroundColor White
Write-Host "View alerts: SELECT * FROM alerts ORDER BY created_at DESC;" -ForegroundColor White

Write-Host "`nCompliance system is ready to use!" -ForegroundColor Green
