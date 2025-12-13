@echo off
echo ============================================================
echo FIX GOOGLE OAUTH REDIRECT URI
echo ============================================================
echo.
echo BUOC 1: Mo Google Cloud Console
echo.
start https://console.cloud.google.com/apis/credentials
echo.
echo BUOC 2: Update Authorized redirect URIs
echo.
echo   Click vao OAuth 2.0 Client ID
echo   Them hoac update redirect URI thanh:
echo.
echo   http://localhost:8003/api/oauth/google/callback
echo.
echo   (Xoa URI cu: http://localhost:8080/api/auth/google/callback)
echo.
echo BUOC 3: Click SAVE
echo.
echo ============================================================
echo.
echo Sau khi update xong, nhan phim bat ky de tiep tuc...
pause > nul
echo.
echo Restarting OAuth service...
echo.

REM Kill existing Python OAuth service
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Google OAuth Service*" 2>nul

REM Start OAuth service in new window
start "Google OAuth Service" cmd /k "cd backend\PythonService && python google_oauth_service.py"

echo.
echo ============================================================
echo DONE! OAuth service restarted.
echo.
echo Test ngay:
echo   1. Mo http://localhost:5173
echo   2. Login va vao Settings
echo   3. Click "Connect Google"
echo   4. Authorize tren Google
echo   5. Popup se tu dong dong
echo ============================================================
echo.
pause
