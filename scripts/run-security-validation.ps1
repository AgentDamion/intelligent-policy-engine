# Security Validation Test Runner
# Runs the adversarial security test suite

Write-Host "🔒 Security Validation Test Runner" -ForegroundColor Cyan
Write-Host ""

# Check if Deno is installed
$denoInstalled = Get-Command deno -ErrorAction SilentlyContinue

if (-not $denoInstalled) {
    Write-Host "❌ Deno is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Deno is required to run the security tests." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Installation options:" -ForegroundColor Yellow
    Write-Host "  1. Install via PowerShell (recommended):" -ForegroundColor White
    Write-Host "     irm https://deno.land/install.ps1 | iex" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Install via Chocolatey:" -ForegroundColor White
    Write-Host "     choco install deno" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Install via Scoop:" -ForegroundColor White
    Write-Host "     scoop install deno" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  4. Download from: https://deno.land" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing Deno, close and reopen your terminal, then run this script again." -ForegroundColor Yellow
    Write-Host ""
    
    $installNow = Read-Host "Would you like to install Deno now? (Y/N)"
    if ($installNow -eq "Y" -or $installNow -eq "y") {
        Write-Host ""
        Write-Host "Installing Deno..." -ForegroundColor Cyan
        irm https://deno.land/install.ps1 | iex
        
        Write-Host ""
        Write-Host "✅ Deno installed! Please close and reopen your terminal, then run this script again." -ForegroundColor Green
        Write-Host "   (This is required to refresh the PATH environment variable)" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host ""
        Write-Host "Exiting. Please install Deno and run this script again." -ForegroundColor Yellow
        exit 1
    }
}

# Deno is installed, proceed with tests
Write-Host "✅ Deno found: $($denoInstalled.Version)" -ForegroundColor Green
Write-Host ""

# Change to the tests directory
$testDir = Join-Path $PSScriptRoot "..\apps\marketing\supabase\functions\cursor-agent-adapter\tests"
$testRunner = Join-Path $testDir "run-security-tests.ts"

if (-not (Test-Path $testRunner)) {
    Write-Host "❌ Test runner not found at: $testRunner" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Test directory: $testDir" -ForegroundColor Gray
Write-Host "🚀 Running security tests..." -ForegroundColor Cyan
Write-Host ""

# Change to test directory and run
Push-Location $testDir
try {
    deno run --allow-read --allow-write run-security-tests.ts
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "✅ All security tests passed!" -ForegroundColor Green
} elseif ($exitCode -eq 1) {
    Write-Host "❌ CRITICAL SECURITY TESTS FAILED - DO NOT DEPLOY" -ForegroundColor Red
} elseif ($exitCode -eq 2) {
    Write-Host "⚠️  Some tests failed - review before deployment" -ForegroundColor Yellow
} else {
    Write-Host "❌ Test execution encountered an error" -ForegroundColor Red
}

exit $exitCode

