@echo off
echo ========================================
echo   INSERT DEMO DATA TO DATABASE
echo ========================================
echo.

echo [INFO] Database: Agent_Db
echo [INFO] User: root
echo.

set /p password="Enter MySQL password: "

echo.
echo [1/2] Connecting to MySQL...
mysql -u root -p%password% -e "USE Agent_Db; SELECT 'Connected successfully!' as Status;"

if errorlevel 1 (
    echo.
    echo [ERROR] Cannot connect to MySQL!
    echo Please check:
    echo   - MySQL is running
    echo   - Username/password is correct
    echo   - Database Agent_Db exists
    pause
    exit /b 1
)

echo.
echo [2/2] Inserting demo data...
mysql -u root -p%password% Agent_Db < insert_demo_data.sql

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to insert data!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Demo data inserted
echo ========================================
echo.
echo Summary:
mysql -u root -p%password% Agent_Db -e "SELECT c.title as 'Course', COUNT(l.id) as 'Lessons' FROM courses c LEFT JOIN lessons l ON c.id = l.course_id WHERE c.created_by = 1 GROUP BY c.id, c.title;"

echo.
echo Access your app at: http://localhost:3000
echo.
pause
