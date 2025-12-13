@echo off
echo ========================================
echo   SETUP PYTHON 3.11 + CHROMADB
echo ========================================
echo.

echo Step 1: Checking Python version...
python --version
echo.

echo Step 2: Checking if Python 3.11 is installed...
py -3.11 --version 2>nul
if errorlevel 1 (
    echo.
    echo ❌ Python 3.11 NOT found!
    echo.
    echo Please install Python 3.11 first:
    echo   1. Download: https://www.python.org/downloads/release/python-3119/
    echo   2. Run installer
    echo   3. ✅ Check "Add Python 3.11 to PATH"
    echo   4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Python 3.11 found!
echo.

echo Step 3: Checking current directory...
cd
echo.

echo Step 4: Installing dependencies from requirements.txt...
echo This may take 2-3 minutes...
echo.
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 5: Installing ChromaDB...
echo This may take 5-10 minutes...
echo.
pip install chromadb==0.4.22 sentence-transformers==2.2.2
if errorlevel 1 (
    echo ❌ Failed to install ChromaDB
    pause
    exit /b 1
)
echo.

echo Step 6: Verifying ChromaDB installation...
python -c "import chromadb; print('✅ ChromaDB version:', chromadb.__version__)"
if errorlevel 1 (
    echo ❌ ChromaDB verification failed
    pause
    exit /b 1
)
echo.

python -c "import sentence_transformers; print('✅ Sentence Transformers OK')"
if errorlevel 1 (
    echo ❌ Sentence Transformers verification failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo   ✅ SETUP COMPLETE!
echo ========================================
echo.
echo ChromaDB has been installed successfully!
echo.
echo Next steps:
echo   1. Test ChromaDB: python test-chromadb.py
echo   2. Benchmark: python benchmark-vector-db.py
echo   3. Start server: python main_with_rag.py
echo.
echo Enjoy 15x faster vector search! 🚀
echo.
pause
