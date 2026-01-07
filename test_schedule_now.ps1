# Quick Test Schedule - Hardcoded credentials for testing

Write-Host "=== QUICK TEST SCHEDULE ===" -ForegroundColor Cyan
Write-Host ""

# CHANGE THESE TO YOUR REAL CREDENTIALS
$tvuMSSV = "110122061"
$tvuPassword = "YOUR_REAL_PASSWORD_HERE"  # <-- Change this!

if ($tvuPassword -eq "YOUR_REAL_PASSWORD_HERE") {
    Write-Host "ERROR: Please edit test_schedule_now.ps1 and set your real TVU password!" -ForegroundColor Red
    Write-Host "Line 7: `$tvuPassword = `"YOUR_REAL_PASSWORD_HERE`"" -ForegroundColor Yellow
    exit
}

# Config
$testUsername = "testuser_$(Get-Random -Maximum 9999)"
$testEmail = "$testUsername@test.com"
$testPassword = "Test123456"

# Step 1: Register
Write-Host "Creating test account..." -ForegroundColor Yellow

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
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "OK (may exist)" -ForegroundColor Yellow
}

# Step 2: Login
Write-Host "Logging in..." -ForegroundColor Yellow

$loginUrl = "http://localhost:8080/api/auth/login"
$loginData = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 3: Add TVU Credential
Write-Host "Saving TVU credential..." -ForegroundColor Yellow

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
    Invoke-RestMethod -Uri $credUrl -Method Post -Body $credData -ContentType "application/json" -Headers $headers | Out-Null
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test Schedule
Write-Host ""
Write-Host "Testing schedule queries..." -ForegroundColor Yellow
Write-Host ""

$chatUrl = "http://localhost:8000/api/chat"

$queries = @(
    "lich hoc hom nay",
    "xem thoi khoa bieu"
)

foreach ($query in $queries) {
    Write-Host "Query: '$query'" -ForegroundColor Cyan
    
    $chatData = @{
        message = $query
        session_id = 1
    } | ConvertTo-Json
    
    try {
        $chatResponse = Invoke-RestMethod -Uri $chatUrl -Method Post -Body $chatData -ContentType "application/json" -Headers $headers
        
        Write-Host "Response:" -ForegroundColor Green
        Write-Host $chatResponse.response
        Write-Host ""
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "=== DONE ===" -ForegroundColor Cyan
