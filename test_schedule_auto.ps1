# Auto Test Schedule - No manual input needed

Write-Host "=== AUTO TEST SCHEDULE ===" -ForegroundColor Cyan
Write-Host ""

# Config
$testUsername = "testuser_$(Get-Random -Maximum 9999)"
$testEmail = "$testUsername@test.com"
$testPassword = "Test123456"
$tvuMSSV = "110122061"
$tvuPassword = "Duy@2003"

# Step 1: Register
Write-Host "Step 1: Creating test account..." -ForegroundColor Yellow
Write-Host "Username: $testUsername" -ForegroundColor Gray

$registerUrl = "http://localhost:8080/api/auth/register"
$registerData = @{
    username = $testUsername
    email = $testEmail
    password = $testPassword
    fullName = "Test User"
    role = "STUDENT"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -Body $registerData -ContentType "application/json"
    Write-Host "✅ Account created!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️ Registration failed (account may exist): $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Login
Write-Host "Step 2: Logging in..." -ForegroundColor Yellow

$loginUrl = "http://localhost:8080/api/auth/login"
$loginData = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure Spring Boot is running on port 8080" -ForegroundColor Yellow
    exit
}

# Step 3: Add TVU Credential
Write-Host "Step 3: Adding TVU credential..." -ForegroundColor Yellow
Write-Host "MSSV: $tvuMSSV" -ForegroundColor Gray

$credUrl = "http://localhost:8080/api/school-credentials"
$headers = @{
    "Authorization" = "Bearer $token"
}

$credData = @{
    username = $tvuMSSV
    password = $tvuPassword
    schoolUrl = "https://ttsv.tvu.edu.vn"
} | ConvertTo-Json

try {
    $credResponse = Invoke-RestMethod -Uri $credUrl -Method Post -Body $credData -ContentType "application/json" -Headers $headers
    Write-Host "✅ TVU credential saved!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️ Credential save failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 4: Verify credential
Write-Host "Step 4: Verifying credential..." -ForegroundColor Yellow

try {
    $getCredResponse = Invoke-RestMethod -Uri $credUrl -Method Get -Headers $headers
    if ($getCredResponse.encryptedUsername) {
        Write-Host "✅ Credential verified!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No credential found" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "⚠️ Could not verify credential" -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Test Schedule Queries
Write-Host "Step 5: Testing schedule queries..." -ForegroundColor Yellow
Write-Host ""

$chatUrl = "http://localhost:8000/api/chat"
$queries = @(
    "lịch học hôm nay",
    "xem thời khóa biểu",
    "hôm nay có lớp gì không",
    "tkb"
)

foreach ($query in $queries) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "Query: '$query'" -ForegroundColor Cyan
    Write-Host ""
    
    $chatData = @{
        message = $query
        session_id = 1
    } | ConvertTo-Json
    
    try {
        $startTime = Get-Date
        $chatResponse = Invoke-RestMethod -Uri $chatUrl -Method Post -Body $chatData -ContentType "application/json" -Headers $headers
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Host "Response (took $([math]::Round($duration, 2))s):" -ForegroundColor Green
        Write-Host $chatResponse.response -ForegroundColor White
        Write-Host ""
        
        # Check if response contains schedule info
        if ($chatResponse.response -match "không có lớp|chưa cấu hình|thất bại|lỗi") {
            Write-Host "⚠️ Warning: Response indicates no schedule or error" -ForegroundColor Yellow
        } elseif ($chatResponse.response -match "lịch học|Phòng|giờ") {
            Write-Host "✅ Schedule data found!" -ForegroundColor Green
        }
        Write-Host ""
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "Details: $responseBody" -ForegroundColor Red
            } catch {}
        }
        Write-Host ""
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "Account created: $testUsername" -ForegroundColor Gray
Write-Host "TVU credential: $tvuMSSV" -ForegroundColor Gray
Write-Host "Tested $($queries.Count) queries" -ForegroundColor Gray
Write-Host ""
Write-Host "If you see 'khong co lop nao', possible reasons:" -ForegroundColor Yellow
Write-Host "1. TVU login failed (wrong MSSV/password)" -ForegroundColor Gray
Write-Host "2. No classes scheduled for today" -ForegroundColor Gray
Write-Host "3. TVU API is down" -ForegroundColor Gray
Write-Host "4. Schedule detection not working" -ForegroundColor Gray
