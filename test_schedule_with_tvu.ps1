# Test Schedule with Your TVU Account

Write-Host "=== TEST SCHEDULE WITH TVU ACCOUNT ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Register or Login
Write-Host "Step 1: Account Setup" -ForegroundColor Yellow
Write-Host "Do you have an account in the system? (y/n)" -ForegroundColor Cyan
$hasAccount = Read-Host ">"

$registerUrl = "http://localhost:8080/api/auth/register"
$loginUrl = "http://localhost:8080/api/auth/login"

if ($hasAccount -ne "y") {
    Write-Host ""
    Write-Host "Creating new account..." -ForegroundColor Yellow
    $username = Read-Host "Enter username (any name you want)"
    $email = Read-Host "Enter email"
    $password = Read-Host "Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    $registerData = @{
        username = $username
        email = $email
        password = $passwordPlain
        fullName = $username
        role = "STUDENT"
    } | ConvertTo-Json
    
    try {
        $registerResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -Body $registerData -ContentType "application/json"
        Write-Host "✅ Account created successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Auto login after register
        $loginData = @{
            username = $username
            password = $passwordPlain
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
        $token = $loginResponse.token
        
    } catch {
        Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        exit
    }
} else {
    Write-Host ""
    Write-Host "Login to existing account..." -ForegroundColor Yellow
    $username = Read-Host "Enter username"
    $password = Read-Host "Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    $loginData = @{
        username = $username
        password = $passwordPlain
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
        $token = $loginResponse.token
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
        exit
    }
}

# Step 2: Add TVU Credential
Write-Host "Step 2: Add TVU Credential" -ForegroundColor Yellow
$credUrl = "http://localhost:8000/api/credentials/tvu"
$headers = @{
    "Authorization" = "Bearer $token"
}

# Check existing credential
try {
    $credResponse = Invoke-RestMethod -Uri $credUrl -Method Get -Headers $headers
    if ($credResponse.username) {
        Write-Host "✅ TVU Credential already exists: $($credResponse.username)" -ForegroundColor Green
        Write-Host "Do you want to update it? (y/n)" -ForegroundColor Cyan
        $update = Read-Host ">"
        if ($update -ne "y") {
            Write-Host "Using existing credential..." -ForegroundColor Gray
            Write-Host ""
        } else {
            $addNew = $true
        }
    } else {
        $addNew = $true
    }
} catch {
    $addNew = $true
}

if ($addNew) {
    Write-Host ""
    Write-Host "Enter your TVU credentials:" -ForegroundColor Yellow
    $mssv = Read-Host "MSSV (Student ID)"
    $tvuPass = Read-Host "TVU Password" -AsSecureString
    $tvuPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($tvuPass))
    
    $credData = @{
        username = $mssv
        password = $tvuPassPlain
    } | ConvertTo-Json
    
    try {
        $addResponse = Invoke-RestMethod -Uri $credUrl -Method Post -Body $credData -ContentType "application/json" -Headers $headers
        Write-Host "✅ TVU credential saved!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to save credential: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 3: Test Schedule Queries
Write-Host "Step 3: Test Schedule Queries" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now ask about your schedule!" -ForegroundColor Cyan
Write-Host "Examples:" -ForegroundColor Gray
Write-Host "  - lịch học hôm nay" -ForegroundColor Gray
Write-Host "  - xem thời khóa biểu" -ForegroundColor Gray
Write-Host "  - hôm nay có lớp gì" -ForegroundColor Gray
Write-Host "  - lịch học thứ 2" -ForegroundColor Gray
Write-Host "  - tkb tuần này" -ForegroundColor Gray
Write-Host ""

$chatUrl = "http://localhost:8000/api/chat"

while ($true) {
    Write-Host "Enter your question (or 'quit' to exit):" -ForegroundColor Cyan
    $msg = Read-Host ">"
    
    if ($msg -eq "quit") {
        break
    }
    
    if ([string]::IsNullOrWhiteSpace($msg)) {
        continue
    }
    
    $chatData = @{
        message = $msg
        session_id = 1
    } | ConvertTo-Json
    
    Write-Host ""
    Write-Host "🤖 AI is thinking..." -ForegroundColor Gray
    
    try {
        $chatResponse = Invoke-RestMethod -Uri $chatUrl -Method Post -Body $chatData -ContentType "application/json" -Headers $headers
        
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Green
        Write-Host $chatResponse.response -ForegroundColor White
        Write-Host ""
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Details: $responseBody" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "Thank you for testing!" -ForegroundColor Green
