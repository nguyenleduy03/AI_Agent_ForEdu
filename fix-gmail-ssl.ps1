# ============================================
# FIX GMAIL SSL ERROR
# ============================================

Write-Host "FIX GMAIL SSL ERROR..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. UPDATE CERTIFICATES
# ============================================
Write-Host "1. Updating SSL certificates..." -ForegroundColor Yellow

cd backend\PythonService

Write-Host "   Updating pip..." -ForegroundColor Gray
python -m pip install --upgrade pip --quiet

Write-Host "   Updating certifi (SSL certificates)..." -ForegroundColor Gray
python -m pip install --upgrade certifi --quiet

Write-Host "   Updating requests and urllib3..." -ForegroundColor Gray
python -m pip install --upgrade requests urllib3 --quiet

Write-Host "   OK SSL packages updated!" -ForegroundColor Green
Write-Host ""

# ============================================
# 2. VERIFY INSTALLATION
# ============================================
Write-Host "2. Verifying SSL setup..." -ForegroundColor Yellow

$verifyScript = @"
import ssl
import certifi
import requests

print(f'SSL Version: {ssl.OPENSSL_VERSION}')
print(f'Certifi path: {certifi.where()}')
print(f'Requests version: {requests.__version__}')
"@

$verifyScript | python

Write-Host ""

# ============================================
# 3. TEST GMAIL API CONNECTION
# ============================================
Write-Host "3. Testing Gmail API connection..." -ForegroundColor Yellow

$testScript = @"
import requests
import sys

try:
    # Test basic HTTPS connection to Gmail API
    response = requests.get(
        'https://gmail.googleapis.com',
        timeout=10
    )
    print(f'   OK Gmail API reachable (Status: {response.status_code})')
    sys.exit(0)
except Exception as e:
    print(f'   X Error: {e}')
    sys.exit(1)
"@

$testScript | python

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SSL FIX COMPLETED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Restart Python service: python main.py" -ForegroundColor Cyan
    Write-Host "2. Test email send in chatbox" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "SSL UPDATE COMPLETED BUT CONNECTION FAILED" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor White
    Write-Host "- Firewall blocking Gmail API" -ForegroundColor Gray
    Write-Host "- Antivirus blocking SSL" -ForegroundColor Gray
    Write-Host "- Proxy settings" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try:" -ForegroundColor White
    Write-Host "1. Disable antivirus temporarily" -ForegroundColor Cyan
    Write-Host "2. Check firewall settings" -ForegroundColor Cyan
    Write-Host "3. Restart computer" -ForegroundColor Cyan
}

cd ..\..
