@echo off
REM Quick setup ChromaDB - All in one

echo ============================================================
echo 🚀 QUICK SETUP CHROMADB
echo ============================================================

echo.
echo 📋 HUONG DAN:
echo    1. Cai Python 3.11: chay setup-python311-auto.ps1
echo    2. Dong va mo lai PowerShell
echo    3. Chay lai script nay
echo.

REM Kiểm tra Python version
python --version 2>nul | findstr "3.11" >nul
if errorlevel 1 (
    echo ❌ Python 3.11 chua duoc cai!
    echo.
    echo 📥 Chay lenh sau de cai Python 3.11:
    echo    powershell -ExecutionPolicy Bypass -File setup-python311-auto.ps1
    echo.
    pause
    exit /b 1
)

echo ✅ Python 3.11 detected!
echo.

REM Cài ChromaDB
cd backend\PythonService

echo 📦 Installing ChromaDB...
pip install chromadb==0.4.22 sentence-transformers==2.2.2

echo.
echo ✅ Verify...
python -c "import chromadb; print('✅ ChromaDB OK')"

echo.
echo ============================================================
echo ✅ SETUP HOAN TAT!
echo ============================================================
echo.
echo 🧪 Test: python chroma_vector_service.py
echo.
pause
