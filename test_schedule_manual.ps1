# Test Schedule in Chatbox - Manual Input

Write-Host "=== TEST SCHEDULE IN CHATBOX ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Login to system" -ForegroundColor Yellow
$username = Read-Host "Enter username"
$password = Read-Host "Enter password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$loginUrl = "http://localhost:8080/api/auth/login"
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
    Write-Host "Make sure Spring Boot is running on port 8080" -ForegroundColor Yellow
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
        Write-Host ""
    } else {
        Write-Host "⚠️ No TVU credential configured!" -ForegroundColor Yellow
        Write-Host ""
        
        $addCred = Read-Host "Do you want to add TVU credential now? (y/n)"
        if ($addCred -eq "y") {
            $mssv = Read-Host "Enter your MSSV (TVU student ID)"
            $tvuPass = Read-Host "Enter your TVU password" -AsSecureString
            $tvuPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($tvuPass))
            
            $credData = @{
                username = $mssv
                password = $tvuPassPlain
            } | ConvertTo-Json
            
            try {
                $addResponse = Invoke-RestMethod -Uri $credUrl -Method Post -Body $credData -ContentType "application/json" -Headers $headers
                Write-Host "✅ TVU credential added!" -ForegroundColor Green
                Write-Host ""
            } catch {
                Write-Host "❌ Failed to add credential: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host ""
            }
        }
    }
} catch {
    Write-Host "⚠️ Could not check credential: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Test Schedule Intent
Write-Host "Step 3: Test Schedule in Chatbox" -ForegroundColor Yellow
Write-Host ""

$chatUrl = "http://localhost:8000/api/chat"

while ($true) {
    Write-Host "Enter message (or 'quit' to exit):" -ForegroundColor Cyan
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
    Write-Host "Sending..." -ForegroundColor Gray
    
    try {
        $chatResponse = Invoke-RestMethod -Uri $chatUrl -Method Post -Body $chatData -ContentType "application/json" -Headers $headers
        
        Write-Host "Response:" -ForegroundColor Green
        Write-Host $chatResponse.response -ForegroundColor White
        Write-Host ""
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
