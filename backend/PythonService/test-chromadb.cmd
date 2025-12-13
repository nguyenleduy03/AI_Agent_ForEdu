@echo off
REM Script test ChromaDB sau khi cài VC++ Redistributable

echo ============================================================
echo 🧪 TEST CHROMADB
echo ============================================================

cd backend\PythonService

echo.
echo 📋 Test 1: Import ChromaDB...
py -3.11 -c "import chromadb; print('✅ ChromaDB version:', chromadb.__version__)"

echo.
echo 📋 Test 2: Run ChromaDB service...
py -3.11 chroma_vector_service.py

echo.
echo ============================================================
echo ✅ TEST HOÀN TẤT!
echo ============================================================
echo.
echo 🚀 Nếu không có lỗi, bạn có thể:
echo    - Start server: py -3.11 main_with_rag.py
echo    - Test RAG: py -3.11 test_rag_endpoint.py
echo.
pause
