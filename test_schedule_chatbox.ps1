# Test Schedule in Chatbox

Write-Host "=== TEST SCHEDULE IN CHATBOX ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Login..." -ForegroundColor Yellow
$loginUrl = "http://localhost:8080/api/auth/login"
$loginData = @{
    username = "student1"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 2: Check TVU Credential
Write-Host "Step 2: Check TVU Credential..." -ForegroundColor Yellow
$credUrl = "http://localhost:8000/api/credentials/tvu"
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $credResponse = Invoke-RestMethod -Uri $credUrl -Method Get -Headers $headers
    if ($credResponse.username) {
        Write-Host "✅ TVU Credential found!" -ForegroundColor Green
        Write-Host "Username: $($credResponse.username)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ No TVU credential configured!" -ForegroundColor Yellow
        Write-Host "Please add TVU credential first:" -ForegroundColor Yellow
        Write-Host "  POST http://localhost:8000/api/credentials/tvu" -ForegroundColor Gray
        Write-Host "  Body: {username: 'your_mssv', password: 'your_password'}" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "⚠️ Could not check credential: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Test Schedule Intent Detection
Write-Host "Step 3: Test Schedule Intent..." -ForegroundColor Yellow
$chatUrl = "http://localhost:8000/api/chat"
$messages = @(
    "lịch học hôm nay",
    "xem thời khóa biểu",
    "hôm nay có lớp gì",
    "tkb tuần này"
)

foreach ($msg in $messages) {
    Write-Host ""
    Write-Host "Testing: '$msg'" -ForegroundColor Cyan
    
    $chatData = @{
        message = $msg
        session_id = 1
    } | ConvertTo-Json
    
    try {
        $chatResponse = Invoke-RestMethod -Uri $chatUrl -Method Post -Body $chatData -ContentType "application/json" -Headers $headers
        
        Write-Host "Response:" -ForegroundColor Green
        Write-Host $chatResponse.response -ForegroundColor White
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you see 'Chưa cấu hình tài khoản TVU', you need to:" -ForegroundColor Yellow
Write-Host "1. Go to Settings → Credentials in the web app" -ForegroundColor Gray
Write-Host "2. Add your TVU MSSV and password" -ForegroundColor Gray
Write-Host "3. Try again" -ForegroundColor Gray
