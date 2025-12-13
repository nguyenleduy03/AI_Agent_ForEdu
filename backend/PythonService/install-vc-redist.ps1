# Script cai Visual C++ Redistributable de fix loi PyTorch DLL

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "CAI VISUAL C++ REDISTRIBUTABLE" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan

Write-Host "`nMuc dich: Fix loi PyTorch DLL cho ChromaDB" -ForegroundColor Green

# Download URL
$vcRedistUrl = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
$installerPath = "$env:TEMP\vc_redist.x64.exe"

Write-Host "`nBUOC 1: Download Visual C++ Redistributable..." -ForegroundColor Green
Write-Host "URL: $vcRedistUrl" -ForegroundColor White

if (Test-Path $installerPath) {
    Write-Host "File da ton tai, xoa va download lai..." -ForegroundColor Yellow
    Remove-Item $installerPath -Force
}

Write-Host "Dang download... (~25 MB)" -ForegroundColor White
try {
    Invoke-WebRequest -Uri $vcRedistUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "Download hoan tat!" -ForegroundColor Green
} catch {
    Write-Host "Loi download: $_" -ForegroundColor Red
    Write-Host "`nVui long download thu cong:" -ForegroundColor Yellow
    Write-Host "1. Mo: $vcRedistUrl" -ForegroundColor White
    Write-Host "2. Chay file da download" -ForegroundColor White
    exit 1
}

Write-Host "`nBUOC 2: Cai dat..." -ForegroundColor Green
Write-Host "Dang cai dat Visual C++ Redistributable..." -ForegroundColor Yellow

# Chay installer
try {
    Start-Process -FilePath $installerPath -ArgumentList "/install", "/quiet", "/norestart" -Wait
    Write-Host "Cai dat hoan tat!" -ForegroundColor Green
} catch {
    Write-Host "Loi cai dat, thu chay thu cong..." -ForegroundColor Yellow
    Start-Process -FilePath $installerPath -Wait
}

Write-Host "`nBUOC 3: Test ChromaDB..." -ForegroundColor Green
Write-Host "Dang test ChromaDB voi Python 3.11..." -ForegroundColor White

try {
    Set-Location "backend\PythonService"
    py -3.11 -c "import chromadb; print('ChromaDB OK')"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ChromaDB import thanh cong!" -ForegroundColor Green
        Write-Host "`nDang test service..." -ForegroundColor White
        
        $output = py -3.11 chroma_vector_service.py 2>&1 | Out-String
        if ($output -match "Test completed") {
            Write-Host "ChromaDB service hoat dong tot!" -ForegroundColor Green
        } else {
            Write-Host "Van con loi. Can RESTART may." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Khong test duoc. Can RESTART may." -ForegroundColor Yellow
}

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "HOAN TAT CAI DAT!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan

Write-Host "`nBUOC TIEP THEO:" -ForegroundColor Yellow
Write-Host "1. Neu van loi: RESTART may (quan trong!)" -ForegroundColor White
Write-Host "2. Sau do chay: test-chromadb.cmd" -ForegroundColor White
Write-Host "3. Neu OK: Start server: cd backend\PythonService && py -3.11 main_with_rag.py" -ForegroundColor White

Write-Host ""
