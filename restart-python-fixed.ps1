# ============================================
# RESTART PYTHON SERVICE WITH GMAIL FIX
# ============================================

Write-Host "RESTARTING PYTHON SERVICE..." -ForegroundColor Cyan
Write-Host ""

# Kill existing Python processes
Write-Host "1. Stopping existing Python services..." -ForegroundColor Yellow
Get-Process -Name "python*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   OK Stopped" -ForegroundColor Green
Write-Host ""

# Start Python service
Write-Host "2. Starting Python AI Service..." -ForegroundColor Yellow
Write-Host "   Port: 8000" -ForegroundColor Gray
Write-Host "   With Gmail retry logic enabled" -ForegroundColor Gray
Write-Host ""

cd backend\PythonService

Start-Process powershell -ArgumentList "-NoExit", "-Command", "py main.py"

Write-Host "   OK Started in new window" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "PYTHON SERVICE RESTARTED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service running on: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test email send in chatbox:" -ForegroundColor White
Write-Host '  "gui email cho test@gmail.com"' -ForegroundColor Cyan

cd ..\..
