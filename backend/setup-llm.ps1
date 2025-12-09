# LLM Setup Helper
# Run this to configure your OpenAI API key

Write-Host "🤖 LLM Controller Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
    $content = Get-Content $envFile -Raw
    if ($content -match "OPENAI_API_KEY=sk-") {
        Write-Host "✅ OpenAI API key is configured" -ForegroundColor Green
        Write-Host ""
        Write-Host "To change it, edit .env file or run:" -ForegroundColor Yellow
        Write-Host "`$env:OPENAI_API_KEY='sk-your-new-key'" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  OpenAI API key not set in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating .env from template..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Please edit .env and add your OpenAI API key:" -ForegroundColor Yellow
    Write-Host "   OPENAI_API_KEY=sk-your-actual-key-here" -ForegroundColor White
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Quick Setup:" -ForegroundColor Cyan
Write-Host "   1. Get API key: https://platform.openai.com/api-keys" -ForegroundColor White
Write-Host "   2. Edit .env file and paste your key" -ForegroundColor White
Write-Host "   3. Restart backend: python -m uvicorn main:app --reload" -ForegroundColor White
Write-Host ""
Write-Host "💰 Cost: ~$0.003 per conversation (0.3 cents)" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Without API key: System falls back to rule-based patterns" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Check if OpenAI package is installed
Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Cyan
try {
    $installed = pip show openai 2>$null
    if ($installed) {
        Write-Host "✅ openai package installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  openai package not found" -ForegroundColor Red
        Write-Host "   Run: pip install openai" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not check openai package" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ready to start! 🚀" -ForegroundColor Green
