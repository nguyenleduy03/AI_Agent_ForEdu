# Quick Test Schedule - Using default admin account

Write-Host "=== QUICK TEST SCHEDULE ===" -ForegroundColor Cyan
Write-Host ""

# Login with default admin
Write-Host "Logging in with admin account..." -ForegroundColor Yellow
$loginUrl = "http://localhost:8080/api/auth/login"
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Admin account may not exist. Create it first:" -ForegroundColor Yellow
    Write-Host "  POST http://localhost:8080/api/auth/register" -ForegroundColor Gray
    Write-Host "  Body: {username: 'admin', password: 'admin123', email: 'admin@test.com', role: 'ADMIN'}" -ForegroundColor Gray
    exit
}

# Check TVU Credential
Write-Host "Checking TVU credential..." -ForegroundColor Yellow
$credUrl = "http://localhost:8000/api/credentials/tvu"
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $credResponse = Invoke-RestMethod -Uri $credUrl -Method Get -Headers $headers
    if ($credResponse.username) {
        Write-Host "✅ TVU Credential exists: $($credResponse.username)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No TVU credential!" -ForegroundColor Yellow
        Write-Host "Adding test credential..." -ForegroundColor Yellow
        
        # Add test credential
        $credData = @{
            username = "110122061"
            password = "Duy@2003"
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri $credUrl -Method Post -Body $credData -ContentType "application/json" -Headers $headers | Out-Null
            Write-Host "✅ Test credential added!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to add credential" -ForegroundColor Red
        }
    }
    Write-Host ""
} catch {
    Write-Host "⚠️ Could not check credential" -ForegroundColor Yellow
    Write-Host ""
}

# Test schedule queries
Write-Host "Testing schedule queries..." -ForegroundColor Yellow
Write-Host ""

$chatUrl = "http://localhost:8000/api/chat"
$queries = @(
    "lịch học hôm nay",
    "xem thời khóa biểu",
    "hôm nay có lớp gì không"
)

foreach ($query in $queries) {
    Write-Host "Query: '$query'" -ForegroundColor Cyan
    
    $chatData = @{
        message = $query
        session_id = 1
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $chatUrl -Method Post -Body $chatData -ContentType "application/json" -Headers $headers
        
        Write-Host "Response:" -ForegroundColor Green
        Write-Host $response.response -ForegroundColor White
        Write-Host ""
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
