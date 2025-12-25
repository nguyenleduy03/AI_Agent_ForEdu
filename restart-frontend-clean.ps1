# 🔄 Restart Frontend with Clean Cache
# This script stops the frontend, clears cache, and restarts

Write-Host "🛑 Stopping frontend processes..." -ForegroundColor Yellow

# Kill any running Next.js processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*fronend_web*"
} | Stop-Process -Force

Write-Host "✅ Frontend processes stopped" -ForegroundColor Green

# Clear Next.js cache
Write-Host "🗑️  Clearing Next.js cache..." -ForegroundColor Yellow

$nextDir = "fronend_web\.next"
if (Test-Path $nextDir) {
    Remove-Item -Recurse -Force $nextDir
    Write-Host "✅ Cache cleared: $nextDir" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No cache found (already clean)" -ForegroundColor Cyan
}

# Clear node_modules/.cache if exists
$cacheDir = "fronend_web\node_modules\.cache"
if (Test-Path $cacheDir) {
    Remove-Item -Recurse -Force $cacheDir
    Write-Host "✅ Node cache cleared" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting frontend..." -ForegroundColor Cyan
Write-Host "📍 Directory: fronend_web" -ForegroundColor Gray
Write-Host "🌐 URL: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  After frontend starts:" -ForegroundColor Yellow
Write-Host "   1. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "   2. Press Ctrl+Shift+R to hard refresh" -ForegroundColor White
Write-Host "   3. Test: 'gửi email cho test@gmail.com hỏi ăn cơm chưa'" -ForegroundColor White
Write-Host ""

# Start frontend
Set-Location fronend_web
npm run dev
