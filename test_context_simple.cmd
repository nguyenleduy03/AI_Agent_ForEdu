@echo off
echo ========================================
echo 🧪 Test Chat Context Memory
echo ========================================
echo.

echo 📋 Test 1: Sending first message...
curl -X POST http://localhost:8000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Tên tôi là Minh\", \"session_id\": 999, \"ai_provider\": \"gemini\", \"use_rag\": false}"

echo.
echo.
timeout /t 3 /nobreak >nul

echo 📋 Test 2: Testing memory (should remember name)...
curl -X POST http://localhost:8000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Tên tôi là gì?\", \"session_id\": 999, \"ai_provider\": \"gemini\", \"use_rag\": false}"

echo.
echo.
timeout /t 3 /nobreak >nul

echo 📋 Test 3: New session (should NOT remember)...
curl -X POST http://localhost:8000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Tên tôi là gì?\", \"session_id\": 1000, \"ai_provider\": \"gemini\", \"use_rag\": false}"

echo.
echo.
echo ========================================
echo ✅ Tests completed!
echo.
echo Check the responses above:
echo - Test 2 should mention "Minh" ✅
echo - Test 3 should NOT mention "Minh" ✅
echo ========================================
pause
