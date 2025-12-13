@echo off
echo ============================================================
echo OPENING GOOGLE CLOUD CONSOLE - OAUTH SETTINGS
echo ============================================================
echo.
echo Client ID: 477173705324-j441dqvann275pkv6tnv8omt2kdg0rsu.apps.googleusercontent.com
echo.
echo Opening browser...
echo.

REM Open Google Cloud Console Credentials page
start https://console.cloud.google.com/apis/credentials

echo.
echo ============================================================
echo HUONG DAN:
echo ============================================================
echo.
echo 1. Tim OAuth 2.0 Client ID voi ID:
echo    477173705324-j441dqvann275pkv6tnv8omt2kdg0rsu
echo.
echo 2. Click vao ten client do
echo.
echo 3. Trong phan "Authorized redirect URIs":
echo    - Click [+ ADD URI]
echo    - Nhap: http://localhost:8003/api/oauth/google/callback
echo    - Click SAVE
echo.
echo 4. Doi vai giay de Google apply changes
echo.
echo 5. Test lai OAuth flow
echo.
echo ============================================================
echo.
echo Nhan phim bat ky sau khi da update xong...
pause > nul
echo.
echo Testing OAuth config...
python verify-oauth-config.py
echo.
echo ============================================================
echo.
echo Gio ban co the test lai:
echo   http://localhost:5173 -^> Settings -^> Connect Google
echo.
echo ============================================================
pause
