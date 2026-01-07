# Test TKB in Chatbox - Full Flow

Write-Host "=== TEST TKB CHATBOX ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to system
Write-Host "STEP 1: Login to system" -ForegroundColor Yellow
$sysUsername = Read-Host "System Username"
$sysPassword = Read-Host "System Password" -AsSecureString
$sysPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sysPassword))

$loginUrl = "http://localhost:8080/api/auth/login"
$loginData = @{
    username = $sysUsername
    password = $sysPasswordPlain
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login OK!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Login FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 2: Add TVU Credential
Write-Host "STEP 2: Add TVU Credential" -ForegroundColor Yellow
$tvuMssv = Read-Host "TVU MSSV"
$tvuPassword = Read-Host "TVU Password" -AsSecureString
$tvuPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($tvuPassword))

$credUrl = "http://localhost:8080/api/school-credentials"
$headers = @{ "Authorization" = "Bearer $token" }

$credData = @{
    username = $tvuMssv
    password = $tvuPasswordPlain
    schoolUrl = "https://ttsv.tvu.edu.vn"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri $credUrl -Method Post -Body $credData -ContentType "application/json" -Headers $headers | Out-Null
    Write-Host "Credential saved!" -ForegroundColor Green
} catch {
    Write-Host "Credential save failed (may already exist)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Test TKB queries
Write-Host "STEP 3: Test TKB in Chatbox" -ForegroundColor Yellow
Write-Host ""

$chatUrl = "http://localhost:8000/api/chat"

$queries = @(
    "lich hoc hom nay",
    "xem thoi khoa bieu",
    "tkb tuan nay"
)

foreach ($query in $queries) {
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    Write-Host "Query: $query" -ForegroundColor Cyan
    Write-Host ""
    
    $chatData = @{
        message = $query
        session_id = 1
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $chatUrl -Method Post -Body $chatData -ContentType "application/json" -Headers $headers
        
        Write-Host "Response:" -ForegroundColor Green
        Write-Host $response.response
        Write-Host ""
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
