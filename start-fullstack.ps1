# Start Fullstack Application with Google OAuth
# Version: 2.0.0

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Starting Full Stack Application with Google OAuth" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Java
Write-Host "[1/5] Checking Java..." -ForegroundColor Yellow
$javaExists = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaExists) {
    Write-Host "   [ERROR] Java not found!" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] Java found" -ForegroundColor Green

# Check Python
Write-Host "[2/5] Checking Python..." -ForegroundColor Yellow
$pythonExists = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonExists) {
    Write-Host "   [ERROR] Python not found!" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] Python found" -ForegroundColor Green

# Check Node.js
Write-Host "[3/5] Checking Node.js..." -ForegroundColor Yellow
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host "   [ERROR] Node.js not found!" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] Node.js found" -ForegroundColor Green

# Check .env file
Write-Host "[4/5] Checking .env configuration..." -ForegroundColor Yellow
$envPath = "$PSScriptRoot\backend\PythonService\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "   [WARNING] .env file not found! OAuth may not work." -ForegroundColor Yellow
} else {
    Write-Host "   [OK] .env file found" -ForegroundColor Green
}

Write-Host ""
Write-Host "[5/5] Starting all services..." -ForegroundColor Yellow
Write-Host ""

# Start Spring Boot
Write-Host "[*] Starting Spring Boot (Port 8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\SpringService\agentforedu'; Write-Host '[Spring Boot Server]' -ForegroundColor Green; .\mvnw.cmd spring-boot:run"

# Wait a bit
Start-Sleep -Seconds 3

# Start OAuth Service
Write-Host "[*] Starting OAuth Service (Port 8003)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\PythonService'; Write-Host '[OAuth Service]' -ForegroundColor Green; python google_oauth_service.py"

# Wait a bit
Start-Sleep -Seconds 2

# Start Google Cloud Service
Write-Host "[*] Starting Google Cloud Service (Port 8004)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\PythonService'; Write-Host '[Google Cloud Service]' -ForegroundColor Green; python google_cloud_service_oauth.py"

# Wait a bit
Start-Sleep -Seconds 2

# Start FastAPI AI Service
Write-Host "[*] Starting AI Service (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\PythonService'; Write-Host '[AI Service]' -ForegroundColor Green; python main.py"

# Wait a bit
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[*] Starting Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\fronend_web'; Write-Host '[Frontend Server]' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " All Services Started Successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Frontend:           http://localhost:5173" -ForegroundColor White
Write-Host "   Spring Boot:        http://localhost:8080" -ForegroundColor White
Write-Host "     - Swagger UI:     http://localhost:8080/swagger-ui/index.html" -ForegroundColor Gray
Write-Host "   AI Service:         http://localhost:8000" -ForegroundColor White
Write-Host "     - Docs:           http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "   OAuth Service:      http://localhost:8003" -ForegroundColor White
Write-Host "     - Docs:           http://localhost:8003/docs" -ForegroundColor Gray
Write-Host "   Google Cloud:       http://localhost:8004" -ForegroundColor White
Write-Host "     - Docs:           http://localhost:8004/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "Quick Actions:" -ForegroundColor Yellow
Write-Host "   1. Open Frontend:   http://localhost:5173" -ForegroundColor Cyan
Write-Host "   2. Login -> Settings -> Connect Google" -ForegroundColor Cyan
Write-Host "   3. Test in Chat:    'Dich sang tieng Anh: Xin chao'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "   - Close PowerShell windows to stop services" -ForegroundColor Gray
Write-Host "   - Check logs in each window for errors" -ForegroundColor Gray
Write-Host "   - Run .\test-google-oauth.ps1 to verify setup" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
