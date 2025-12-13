Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  FIX GOOGLE OAUTH REDIRECT URI" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "BUOC 1: Mo Google Cloud Console..." -ForegroundColor Green
Start-Process "https://console.cloud.google.com/apis/credentials"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "BUOC 2: Update Authorized redirect URIs" -ForegroundColor Green
Write-Host ""
Write-Host "  1. Click vao OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "  2. Them hoac update redirect URI thanh:" -ForegroundColor White
Write-Host ""
Write-Host "     http://localhost:8003/api/oauth/google/callback" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Xoa URI cu (neu co):" -ForegroundColor White
Write-Host "     http://localhost:8080/api/auth/google/callback" -ForegroundColor Red
Write-Host ""
Write-Host "  4. Click SAVE" -ForegroundColor White
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
$response = Read-Host "Da update xong? (y/n)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Restarting OAuth service..." -ForegroundColor Green
    
    # Kill existing Python processes
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 1
    
    # Start OAuth service in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend\PythonService; python google_oauth_service.py"
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  DONE! OAuth service restarted." -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test ngay:" -ForegroundColor Yellow
    Write-Host "  1. Mo http://localhost:5173" -ForegroundColor White
    Write-Host "  2. Login va vao Settings" -ForegroundColor White
    Write-Host "  3. Click 'Connect Google'" -ForegroundColor White
    Write-Host "  4. Authorize tren Google" -ForegroundColor White
    Write-Host "  5. Popup se tu dong dong" -ForegroundColor White
    Write-Host ""
    
    # Open frontend
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173"
} else {
    Write-Host ""
    Write-Host "Vui long update Google Cloud Console truoc khi tiep tuc." -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Read-Host "Nhan Enter de thoat"
