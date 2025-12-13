# 🚀 Script Tự Động Cài Python 3.11 + ChromaDB
# Chạy với quyền Administrator

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "🔽 DOWNGRADE PYTHON 3.14 → 3.11 + CHROMADB" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan

# BƯỚC 1: Kiểm tra Python hiện tại
Write-Host "`n📋 BƯỚC 1: Kiểm tra Python hiện tại..." -ForegroundColor Green
$currentPython = python --version 2>&1
Write-Host "   Hiện tại: $currentPython" -ForegroundColor White

# BƯỚC 2: Download Python 3.11.9
Write-Host "`n📥 BƯỚC 2: Download Python 3.11.9..." -ForegroundColor Green
$pythonUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
$installerPath = "$env:TEMP\python-3.11.9-amd64.exe"

if (Test-Path $installerPath) {
    Write-Host "   ✅ File đã tồn tại: $installerPath" -ForegroundColor Yellow
} else {
    Write-Host "   Đang download từ: $pythonUrl" -ForegroundColor White
    Write-Host "   Vui lòng đợi... (~27 MB)" -ForegroundColor White
    
    try {
        Invoke-WebRequest -Uri $pythonUrl -OutFile $installerPath -UseBasicParsing
        Write-Host "   ✅ Download hoàn tất!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Lỗi download: $_" -ForegroundColor Red
        Write-Host "`n   Vui lòng download thủ công:" -ForegroundColor Yellow
        Write-Host "   URL: $pythonUrl" -ForegroundColor White
        exit 1
    }
}

# BƯỚC 3: Cài đặt Python 3.11
Write-Host "`n🔧 BƯỚC 3: Cài đặt Python 3.11..." -ForegroundColor Green
Write-Host "   ⚠️  Sẽ mở installer - Nhớ CHECK 'Add Python to PATH'!" -ForegroundColor Yellow
Write-Host "   Nhấn Enter để tiếp tục..." -ForegroundColor White
Read-Host

# Chạy installer
Start-Process -FilePath $installerPath -ArgumentList "/passive", "InstallAllUsers=1", "PrependPath=1" -Wait

Write-Host "   ✅ Cài đặt hoàn tất!" -ForegroundColor Green
Write-Host "   ⚠️  Vui lòng ĐÓNG và MỞ LẠI PowerShell!" -ForegroundColor Yellow

# BƯỚC 4: Hướng dẫn tiếp theo
Write-Host "`n📝 BƯỚC 4: Sau khi mở lại PowerShell, chạy:" -ForegroundColor Green
Write-Host "   cd D:\DACN" -ForegroundColor White
Write-Host "   .\verify-python311.cmd" -ForegroundColor White

Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
Write-Host "✅ HOÀN TẤT BƯỚC CÀI ĐẶT!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`n⚠️  QUAN TRỌNG:" -ForegroundColor Yellow
Write-Host "   1. ĐÓNG PowerShell này" -ForegroundColor White
Write-Host "   2. MỞ PowerShell MỚI (Administrator)" -ForegroundColor White
Write-Host "   3. Chạy: .\verify-python311.cmd" -ForegroundColor White
Write-Host ""
