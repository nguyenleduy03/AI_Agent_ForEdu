# 🔄 Restart Frontend (Vite) with Clean Cache
# Port: 5173 (Vite default)

Write-Host "🛑 Stopping frontend processes..." -ForegroundColor Yellow

# Kill any running Node.js processes on port 5173
$port = 5173
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($proc in $processes) {
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Stopped process on port $port (PID: $proc)" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️  No process running on port $port" -ForegroundColor Cyan
}

# Also kill any node processes in fronend_web directory
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*fronend_web*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ Frontend processes stopped" -ForegroundColor Green

# Clear Vite cache
Write-Host "🗑️  Clearing Vite cache..." -ForegroundColor Yellow

$viteCache = "fronend_web\node_modules\.vite"
if (Test-Path $viteCache) {
    Remove-Item -Recurse -Force $viteCache
    Write-Host "✅ Vite cache cleared: $viteCache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Vite cache found (already clean)" -ForegroundColor Cyan
}

# Clear dist folder
$distDir = "fronend_web\dist"
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
    Write-Host "✅ Dist folder cleared: $distDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting frontend (Vite)..." -ForegroundColor Cyan
Write-Host "📍 Directory: fronend_web" -ForegroundColor Gray
Write-Host "🌐 Port: 5173 (Vite default)" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  QUAN TRỌNG:" -ForegroundColor Yellow
Write-Host "   Sau khi frontend khởi động, mở browser tại:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "   KHÔNG PHẢI: http://localhost:3000 ❌" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  Sau khi mở browser:" -ForegroundColor Yellow
Write-Host "   1. Nhấn Ctrl+Shift+R để hard refresh" -ForegroundColor White
Write-Host "   2. Test: 'gửi email cho test@gmail.com hỏi ăn cơm chưa'" -ForegroundColor White
Write-Host "   3. Mở Console (F12) để xem debug logs" -ForegroundColor White
Write-Host ""

# Start frontend
Set-Location fronend_web
npm run dev
