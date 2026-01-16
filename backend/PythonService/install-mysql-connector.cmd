@echo off
echo ============================================
echo Installing MySQL Connector for Python
echo ============================================
echo.

pip install mysql-connector-python==8.2.0

echo.
echo ============================================
echo Installation complete!
echo ============================================
echo.
echo Next steps:
echo 1. Check .env file has MySQL credentials
echo 2. Run: python test_mysql_course.py
echo 3. Start service: python main.py
echo.
pause
