# Restart Python AI Service
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "🔄 RESTARTING PYTHON AI SERVICE" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan

# Stop existing Python processes on port 8000
Write-Host "`n🛑 Stopping existing Python service..." -ForegroundColor Yellow
$pythonProcesses = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess -Unique

if ($pythonProcesses) {
    foreach ($pid in $pythonProcesses) {
        Write-Host "   Killing process $pid..." -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "✅ Stopped" -ForegroundColor Green
} else {
    Write-Host "   No existing service found" -ForegroundColor Gray
}

# Start Python service
Write-Host "`n🚀 Starting Python AI Service..." -ForegroundColor Yellow
Write-Host "   Port: 8000" -ForegroundColor Gray
Write-Host "   Location: backend/PythonService" -ForegroundColor Gray

Set-Location backend/PythonService

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "📡 SERVICE STARTING - Press Ctrl+C to stop" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

# Run Python service
py main.py
