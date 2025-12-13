@echo off
REM Script cài ChromaDB sau khi đã có Python 3.11

echo ============================================================
echo 📦 CAI DAT CHROMADB + DEPENDENCIES
echo ============================================================

REM Kiểm tra Python version
echo.
echo 📋 Kiem tra Python version...
python --version
echo.

REM Hỏi xác nhận
echo ⚠️  Ban da cai Python 3.11 chua?
echo    Neu chua, chay: setup-python311-auto.ps1
echo.
set /p confirm="Tiep tuc cai ChromaDB? (Y/N): "
if /i not "%confirm%"=="Y" exit /b

REM Navigate to PythonService
cd backend\PythonService

REM Backup pip list
echo.
echo 💾 Backup pip list...
pip list > installed_packages_backup.txt
echo    ✅ Saved to: installed_packages_backup.txt

REM Reinstall requirements
echo.
echo 📦 Reinstall requirements.txt...
pip install -r requirements.txt

REM Install ChromaDB
echo.
echo 🎯 Installing ChromaDB...
pip install chromadb==0.4.22 sentence-transformers==2.2.2

REM Verify
echo.
echo ✅ Verify ChromaDB...
python -c "import chromadb; print('✅ ChromaDB version:', chromadb.__version__)"

echo.
echo ============================================================
echo ✅ HOAN TAT CAI DAT!
echo ============================================================
echo.
echo 🧪 Test ChromaDB:
echo    python test-chromadb.py
echo.
echo 🚀 Start server:
echo    python main_with_rag.py
echo.
pause
