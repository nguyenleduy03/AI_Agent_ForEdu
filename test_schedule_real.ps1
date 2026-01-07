# Test Schedule with Real TVU Password

Write-Host "=== TEST SCHEDULE WITH REAL TVU ===" -ForegroundColor Cyan
Write-Host ""

# Get TVU credentials
Write-Host "Enter your TVU credentials:" -ForegroundColor Yellow
$tvuMSSV = Read-Host "MSSV"
$tvuPassword = Read-Host "TVU Password" -AsSecureString
$tvuPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($tvuPassword))

# Config
$testUsername = "testuser_$(Get-Random -Maximum 9999)"
$testEmail = "$testUsername@test.com"
$testPassword = "Test123456"

# Step 1: Register
Write-Host ""
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
    Invoke-RestMethod -Uri $registerUrl -Method Post -Body $registerData -ContentType "application/json" | Out-Null
    Write-Host "Account created!" -ForegroundColor Green
} catch {
    Write-Host "Account may already exist" -ForegroundColor Yellow
}

# Step 2: Login
Write-Host ""
Write-Host "Step 2: Logging in..." -ForegroundColor Yellow

$loginUrl = "http://localhost:8080/api/auth/login"
$loginData = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful!" -ForegroundColor Green
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 3: Add TVU Credential
Write-Host ""
Write-Host "Step 3: Adding TVU credential..." -ForegroundColor Yellow
Write-Host "MSSV: $tvuMSSV" -ForegroundColor Gray

$credUrl = "http://localhost:8080/api/school-credentials"
$headers = @{
    "Authorization" = "Bearer $token"
}

$credData = @{
    username = $tvuMSSV
    password = $tvuPasswordPlain
    schoolUrl = "https://ttsv.tvu.edu.vn"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri $credUrl -Method Post -Body $credData -ContentType "application/json" -Headers $headers | Out-Null
    Write-Host "TVU credential saved!" -ForegroundColor Green
} catch {
    Write-Host "Failed to save credential: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying to continue anyway..." -ForegroundColor Yellow
}

# Step 4: Test Schedule
Write-Host ""
Write-Host "Step 4: Testing schedule..." -ForegroundColor Yellow
Write-Host ""

$chatUrl = "http://localhost:8000/api/chat"

$query = "lich hoc hom nay"
Write-Host "Query: '$query'" -ForegroundColor Cyan

$chatData = @{
    message = $query
    session_id = 1
} | ConvertTo-Json

try {
    $chatResponse = Invoke-RestMethod -Uri $chatUrl -Method Post -Body $chatData -ContentType "application/json" -Headers $headers
    
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $chatResponse.response -ForegroundColor White
    Write-Host ""
    
    if ($chatResponse.response -match "Phong|gio|lop") {
        Write-Host "SUCCESS! Schedule data found!" -ForegroundColor Green
    } elseif ($chatResponse.response -match "khong co lop|Chua cau hinh") {
        Write-Host "No schedule or credential issue" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
