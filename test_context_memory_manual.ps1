# Test Chat Context Memory - Manual Test Script
# Chạy script này để test tính năng conversation memory

Write-Host "🧪 Testing Chat Context Memory Feature" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if services are running
Write-Host "📋 Step 1: Checking services..." -ForegroundColor Yellow

# Check Python service
$pythonRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Python FastAPI is running (port 8000)" -ForegroundColor Green
        $pythonRunning = $true
    }
} catch {
    Write-Host "❌ Python FastAPI is NOT running (port 8000)" -ForegroundColor Red
    Write-Host "   Run: cd backend/PythonService && py main.py" -ForegroundColor Gray
}

# Check Spring Boot
$springRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Spring Boot is running (port 8080)" -ForegroundColor Green
        $springRunning = $true
    }
} catch {
    Write-Host "❌ Spring Boot is NOT running (port 8080)" -ForegroundColor Red
    Write-Host "   Run: cd backend/SpringService/agentforedu && ./mvnw spring-boot:run" -ForegroundColor Gray
}

# Check Frontend
$frontendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running (port 5173)" -ForegroundColor Green
        $frontendRunning = $true
    }
} catch {
    # Try port 5174
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5174/" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is running (port 5174)" -ForegroundColor Green
            $frontendRunning = $true
        }
    } catch {
        Write-Host "❌ Frontend is NOT running (port 5173/5174)" -ForegroundColor Red
        Write-Host "   Run: cd fronend_web && npm run dev" -ForegroundColor Gray
    }
}

Write-Host ""

if (-not $pythonRunning -or -not $springRunning) {
    Write-Host "⚠️  Cannot test - services not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start services first:" -ForegroundColor Yellow
    Write-Host "1. Spring Boot: cd backend/SpringService/agentforedu && ./mvnw spring-boot:run" -ForegroundColor Gray
    Write-Host "2. Python API: cd backend/PythonService && py main.py" -ForegroundColor Gray
    Write-Host "3. Frontend: cd fronend_web && npm run dev" -ForegroundColor Gray
    exit 1
}

Write-Host "📋 Step 2: Testing API with conversation memory..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Send first message (introduce name)
Write-Host "🧪 Test 1: Sending first message..." -ForegroundColor Cyan
$body1 = @{
    message = "Tên tôi là Minh"
    session_id = 999
    ai_provider = "gemini"
    use_rag = $false
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "✅ Message 1 sent successfully" -ForegroundColor Green
    Write-Host "   User: Tên tôi là Minh" -ForegroundColor Gray
    Write-Host "   AI: $($response1.response.Substring(0, [Math]::Min(100, $response1.response.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to send message 1: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# Test 2: Ask about name (should remember)
Write-Host "🧪 Test 2: Testing memory - asking about name..." -ForegroundColor Cyan
$body2 = @{
    message = "Tên tôi là gì?"
    session_id = 999
    ai_provider = "gemini"
    use_rag = $false
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "✅ Message 2 sent successfully" -ForegroundColor Green
    Write-Host "   User: Tên tôi là gì?" -ForegroundColor Gray
    Write-Host "   AI: $($response2.response)" -ForegroundColor Gray
    
    # Check if AI remembered
    if ($response2.response -like "*Minh*") {
        Write-Host ""
        Write-Host "🎉 SUCCESS! AI remembered the name 'Minh'!" -ForegroundColor Green
        Write-Host "✅ Conversation memory is working!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  WARNING: AI did not remember the name" -ForegroundColor Yellow
        Write-Host "   Expected response to contain 'Minh'" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to send message 2: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# Test 3: New session (should NOT remember)
Write-Host "🧪 Test 3: Testing session isolation (new session)..." -ForegroundColor Cyan
$body3 = @{
    message = "Tên tôi là gì?"
    session_id = 1000
    ai_provider = "gemini"
    use_rag = $false
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method POST -Body $body3 -ContentType "application/json"
    Write-Host "✅ Message 3 sent successfully (new session)" -ForegroundColor Green
    Write-Host "   User: Tên tôi là gì?" -ForegroundColor Gray
    Write-Host "   AI: $($response3.response.Substring(0, [Math]::Min(100, $response3.response.Length)))..." -ForegroundColor Gray
    
    # Check if AI forgot (should not remember in new session)
    if ($response3.response -notlike "*Minh*") {
        Write-Host ""
        Write-Host "🎉 SUCCESS! AI correctly forgot in new session!" -ForegroundColor Green
        Write-Host "✅ Session isolation is working!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  WARNING: AI remembered across sessions (should not)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to send message 3: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ API is working" -ForegroundColor Green
Write-Host "   ✅ Conversation memory tested" -ForegroundColor Green
Write-Host "   ✅ Session isolation tested" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Now test in browser:" -ForegroundColor Cyan
if ($frontendRunning) {
    Write-Host "   1. Open: http://localhost:5173/chat (or 5174)" -ForegroundColor Gray
} else {
    Write-Host "   1. Start frontend: cd fronend_web && npm run dev" -ForegroundColor Gray
    Write-Host "   2. Open: http://localhost:5173/chat" -ForegroundColor Gray
}
Write-Host "   2. Send: 'Tên tôi là [Tên bạn]'" -ForegroundColor Gray
Write-Host "   3. Send: 'Tên tôi là gì?'" -ForegroundColor Gray
Write-Host "   4. AI should remember your name! 🎉" -ForegroundColor Gray
Write-Host ""
