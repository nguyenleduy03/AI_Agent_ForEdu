@echo off
echo ========================================
echo   VERIFY PYTHON 3.11 INSTALLATION
echo ========================================
echo.

echo 1. Checking Python version...
python --version
echo.

echo 2. Checking pip version...
pip --version
echo.

echo 3. Checking Python 3.11 with py launcher...
py -3.11 --version 2>nul
if errorlevel 1 (
    echo ❌ Python 3.11 NOT found with py launcher
) else (
    echo ✅ Python 3.11 found with py launcher
)
echo.

echo 4. Listing all Python installations...
where python
echo.

echo 5. Checking installed packages...
pip list | findstr -i "chromadb sentence-transformers fastapi uvicorn google-generativeai"
echo.

echo 6. Testing ChromaDB import...
python -c "import chromadb; print('✅ ChromaDB OK')" 2>nul
if errorlevel 1 (
    echo ❌ ChromaDB NOT installed
) else (
    echo ✅ ChromaDB installed
)
echo.

echo 7. Testing Sentence Transformers import...
python -c "import sentence_transformers; print('✅ Sentence Transformers OK')" 2>nul
if errorlevel 1 (
    echo ❌ Sentence Transformers NOT installed
) else (
    echo ✅ Sentence Transformers installed
)
echo.

echo ========================================
echo   VERIFICATION COMPLETE
echo ========================================
echo.
echo If you see any ❌, please:
echo   1. Check HUONG_DAN_DOWNGRADE_PYTHON.md
echo   2. Run: setup-python311-chromadb.cmd
echo.
pause
