# Test Google OAuth Integration
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "🧪 TESTING GOOGLE OAUTH INTEGRATION" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Spring Boot is running
Write-Host "1️⃣  Checking Spring Boot (Port 8080)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Spring Boot is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Spring Boot is NOT running" -ForegroundColor Red
    Write-Host "   Run: cd backend/SpringService/agentforedu && mvn spring-boot:run" -ForegroundColor Yellow
}

# Test 2: Check if OAuth Service is running
Write-Host ""
Write-Host "2️⃣  Checking OAuth Service (Port 8003)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8003/" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ OAuth Service is running" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ OAuth Service is NOT running" -ForegroundColor Red
    Write-Host "   Run: cd backend/PythonService && python google_oauth_service.py" -ForegroundColor Yellow
}

# Test 3: Check if Google Cloud Service is running
Write-Host ""
Write-Host "3️⃣  Checking Google Cloud Service (Port 8004)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8004/" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Google Cloud Service is running" -ForegroundColor Green
    Write-Host "   OAuth Enabled: $($response.oauth_enabled)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Google Cloud Service is NOT running" -ForegroundColor Red
    Write-Host "   Run: cd backend/PythonService && python google_cloud_service_oauth.py" -ForegroundColor Yellow
}

# Test 4: Check if AI Service is running
Write-Host ""
Write-Host "4️⃣  Checking AI Service (Port 8000)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ AI Service is running" -ForegroundColor Green
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ AI Service is NOT running" -ForegroundColor Red
    Write-Host "   Run: cd backend/PythonService && python main.py" -ForegroundColor Yellow
}

# Test 5: Check if Frontend is running
Write-Host ""
Write-Host "5️⃣  Checking Frontend (Port 3000)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Frontend is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend is NOT running" -ForegroundColor Red
    Write-Host "   Run: cd fronend_web && npm run dev" -ForegroundColor Yellow
}

# Test 6: Check Database
Write-Host ""
Write-Host "6️⃣  Checking Database..." -ForegroundColor Cyan
try {
    $query = "SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME LIKE 'google%'"
    $result = mysql -u root -p1111 Agent_Db -e $query -s -N 2>$null
    
    if ($result -ge 5) {
        Write-Host "   ✅ Database has Google OAuth columns ($result columns)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database missing Google OAuth columns" -ForegroundColor Yellow
        Write-Host "   Run migration: Get-Content backend/SpringService/agentforedu/database_migration_google_oauth_mysql.sql | mysql -u root -p1111 Agent_Db" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Cannot connect to database" -ForegroundColor Red
}

# Test 7: Check .env configuration
Write-Host ""
Write-Host "7️⃣  Checking .env Configuration..." -ForegroundColor Cyan
$envPath = "backend/PythonService/.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    if ($envContent -match "GOOGLE_OAUTH_CLIENT_ID=.+") {
        Write-Host "   ✅ GOOGLE_OAUTH_CLIENT_ID configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ GOOGLE_OAUTH_CLIENT_ID not configured" -ForegroundColor Red
    }
    
    if ($envContent -match "GOOGLE_OAUTH_CLIENT_SECRET=.+") {
        Write-Host "   ✅ GOOGLE_OAUTH_CLIENT_SECRET configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ GOOGLE_OAUTH_CLIENT_SECRET not configured" -ForegroundColor Red
    }
    
    if ($envContent -match "ENCRYPTION_KEY=.+") {
        Write-Host "   ✅ ENCRYPTION_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ENCRYPTION_KEY not configured" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
}

# Test 8: Test Spring Boot OAuth API
Write-Host ""
Write-Host "8️⃣  Testing Spring Boot OAuth API..." -ForegroundColor Cyan
try {
    # Test with user ID 1
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/users/1/google-status" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ OAuth API is working" -ForegroundColor Green
    Write-Host "   User 1 Connected: $($response.connected)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ⚠️  User not found (normal if no users yet)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ OAuth API error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start all services: .\start-with-oauth.ps1" -ForegroundColor White
Write-Host "2. Open frontend: http://localhost:3000" -ForegroundColor White
Write-Host "3. Login and go to Settings" -ForegroundColor White
Write-Host "4. Click 'Connect Google' button" -ForegroundColor White
Write-Host "5. Test in Chat: 'Dịch sang tiếng Anh: Xin chào'" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: TEST_GOOGLE_OAUTH_COMPLETE.md" -ForegroundColor Gray
Write-Host ""
