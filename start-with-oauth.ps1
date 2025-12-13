# Start all services with OAuth support
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Starting AgentForEdu with Google OAuth Support" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path "backend/PythonService/.env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure it" -ForegroundColor Yellow
    exit 1
}

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "🚀 Starting $Name on port $Port..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; Write-Host '[$Name] Running on port $Port' -ForegroundColor Cyan; $Command"
    Start-Sleep -Seconds 2
}

Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""

# 1. Spring Boot Backend
Start-Service -Name "Spring Boot" -Path "$PSScriptRoot/backend/SpringService/agentforedu" -Command ".\mvnw.cmd spring-boot:run" -Port 8080

# 2. Python AI Service (Main)
Start-Service -Name "Python AI Service" -Path "$PSScriptRoot/backend/PythonService" -Command "python main.py" -Port 8000

# 3. Google OAuth Service
Start-Service -Name "Google OAuth Service" -Path "$PSScriptRoot/backend/PythonService" -Command "python google_oauth_service.py" -Port 8003

# 4. Google Cloud Service with OAuth
Start-Service -Name "Google Cloud OAuth Service" -Path "$PSScriptRoot/backend/PythonService" -Command "python google_cloud_service_oauth.py" -Port 8004

# 5. Frontend
Start-Service -Name "React Frontend" -Path "$PSScriptRoot/fronend_web" -Command "npm run dev" -Port 3000

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Service URLs:" -ForegroundColor Yellow
Write-Host "   Frontend:              http://localhost:3000" -ForegroundColor White
Write-Host "   Spring Boot API:       http://localhost:8080" -ForegroundColor White
Write-Host "   Python AI Service:     http://localhost:8000" -ForegroundColor White
Write-Host "   Google OAuth Service:  http://localhost:8003" -ForegroundColor White
Write-Host "   Google Cloud OAuth:    http://localhost:8004" -ForegroundColor White
Write-Host ""
Write-Host "📚 Swagger UIs:" -ForegroundColor Yellow
Write-Host "   Spring Boot:           http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "   Python AI:             http://localhost:8000/docs" -ForegroundColor White
Write-Host "   OAuth Service:         http://localhost:8003/docs" -ForegroundColor White
Write-Host "   Google Cloud OAuth:    http://localhost:8004/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔐 OAuth Setup:" -ForegroundColor Yellow
Write-Host "   1. Go to Settings page" -ForegroundColor White
Write-Host "   2. Click 'Connect Google Account'" -ForegroundColor White
Write-Host "   3. Authorize permissions" -ForegroundColor White
Write-Host "   4. Start using Google Cloud features!" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

# Keep script running
while ($true) {
    Start-Sleep -Seconds 1
}
}
