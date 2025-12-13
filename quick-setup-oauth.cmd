@echo off
echo ============================================================
echo  Quick Setup Google OAuth
echo ============================================================
echo.

echo Step 1: Generating encryption key...
cd backend\PythonService
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())" > temp_key.txt

echo.
echo Step 2: Your encryption key has been generated!
echo.
type temp_key.txt
echo.
echo.

echo ============================================================
echo IMPORTANT: Update your .env file
echo ============================================================
echo.
echo 1. Open: backend\PythonService\.env
echo.
echo 2. Replace these values:
echo.
echo    GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
echo    ^(Replace with your actual client secret from Google Console^)
echo.
echo    ENCRYPTION_KEY=WILL_GENERATE_BELOW
echo    ^(Replace with the key shown above^)
echo.
echo ============================================================
echo.

del temp_key.txt

echo Step 3: Run database migration
echo.
echo Open your database client and run:
echo    backend\SpringService\agentforedu\database_migration_google_oauth.sql
echo.
echo ============================================================
echo.

echo Step 4: Start services with OAuth
echo.
echo Run: start-with-oauth.ps1
echo.
echo ============================================================
echo.

pause
