@echo off
echo Killing Java processes...
taskkill /F /IM java.exe 2>nul
timeout /t 3 /nobreak >nul

echo Starting Spring Boot in new window...
cd backend\SpringService\agentforedu
start "Spring Boot Server" cmd /k "mvnw.cmd spring-boot:run"

echo.
echo Spring Boot is starting...