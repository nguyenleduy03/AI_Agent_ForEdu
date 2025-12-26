# Restart Spring Boot Only
# Use this after code changes to Spring Boot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Restarting Spring Boot Service" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Kill existing Spring Boot process
Write-Host "[1/2] Stopping existing Spring Boot..." -ForegroundColor Yellow
$javaProcesses = Get-Process -Name java -ErrorAction SilentlyContinue
if ($javaProcesses) {
    $javaProcesses | Stop-Process -Force
    Write-Host "   [OK] Stopped Spring Boot" -ForegroundColor Green
} else {
    Write-Host "   [INFO] No Spring Boot process found" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Start Spring Boot
Write-Host "[2/2] Starting Spring Boot..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\SpringService\agentforedu'; Write-Host '[Spring Boot Server - RESTARTED]' -ForegroundColor Green; .\mvnw.cmd spring-boot:run"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " Spring Boot Restarting..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Wait for Spring Boot to start (30-60 seconds)" -ForegroundColor Yellow
Write-Host "Look for: 'Started AgentforeduApplication' in the new window" -ForegroundColor Gray
Write-Host ""
Write-Host "After startup, test the new endpoint:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:8080/api/chat/internal/sessions/31122/messages" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
