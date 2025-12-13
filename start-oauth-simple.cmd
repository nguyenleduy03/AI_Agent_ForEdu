@echo off
echo ============================================================
echo  Starting All Services with OAuth
echo ============================================================
echo.

echo Starting Spring Boot...
start "Spring Boot" cmd /k "cd backend\SpringService\agentforedu && mvnw.cmd spring-boot:run"
timeout /t 3 /nobreak > nul

echo Starting Python AI Service...
start "Python AI" cmd /k "cd backend\PythonService && python main.py"
timeout /t 2 /nobreak > nul

echo Starting OAuth Service...
start "OAuth Service" cmd /k "cd backend\PythonService && python google_oauth_service.py"
timeout /t 2 /nobreak > nul

echo Starting Google Cloud OAuth Service...
start "Google Cloud OAuth" cmd /k "cd backend\PythonService && python google_cloud_service_oauth.py"
timeout /t 2 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "cd fronend_web && npm run dev"

echo.
echo ============================================================
echo All services started!
echo ============================================================
echo.
echo Services:
echo   - Spring Boot:        http://localhost:8080
echo   - Python AI:          http://localhost:8000
echo   - OAuth Service:      http://localhost:8003
echo   - Google Cloud OAuth: http://localhost:8004
echo   - Frontend:           http://localhost:3000
echo.
echo Wait 30-60 seconds for all services to start...
echo.
echo Then open: http://localhost:3000
echo.
pause
