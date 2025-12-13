Write-Host "Starting FastAPI AI Chat Service..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure you have added your Gemini API Key to .env file" -ForegroundColor Yellow
Write-Host "Get your key at: https://aistudio.google.com/apikey" -ForegroundColor Cyan
Write-Host ""

# Check if API key is configured
$envFile = ".env"
if (Test-Path $envFile) {
    $apiKey = Get-Content $envFile | Select-String "GEMINI_API_KEY" | ForEach-Object { $_.ToString().Split('=')[1] }
    if ($apiKey -eq "your_gemini_api_key_here") {
        Write-Host "WARNING: Please update your Gemini API Key in .env file!" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "All features in one file: main.py" -ForegroundColor Cyan
python main.py
