@echo off
echo ============================================================
echo  Running Google OAuth Migration for MySQL
echo ============================================================
echo.

echo This will add Google OAuth columns to your users table.
echo.
echo Please enter your MySQL connection details:
echo.

set /p DB_HOST="MySQL Host (default: localhost): " || set DB_HOST=localhost
set /p DB_PORT="MySQL Port (default: 3306): " || set DB_PORT=3306
set /p DB_NAME="Database Name (default: agentforedu): " || set DB_NAME=agentforedu
set /p DB_USER="MySQL Username (default: root): " || set DB_USER=root
set /p DB_PASS="MySQL Password: "

echo.
echo ============================================================
echo Running migration...
echo ============================================================
echo.

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < backend\SpringService\agentforedu\database_migration_google_oauth_mysql.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo ✅ Migration completed successfully!
    echo ============================================================
    echo.
    echo New columns added to users table:
    echo   - google_access_token
    echo   - google_refresh_token
    echo   - google_token_expiry
    echo   - google_connected
    echo   - google_email
    echo.
    echo New table created:
    echo   - google_oauth_usage_logs
    echo.
    echo ============================================================
    echo Next step: Start services
    echo ============================================================
    echo.
    echo Run: start-with-oauth.ps1
    echo.
) else (
    echo.
    echo ============================================================
    echo ❌ Migration failed!
    echo ============================================================
    echo.
    echo Please check:
    echo   - MySQL is running
    echo   - Database exists
    echo   - Username and password are correct
    echo   - User has ALTER TABLE permissions
    echo.
)

pause
