# AI Chat Service - FastAPI + Gemini + ChromaDB

API chat với Google Gemini AI và RAG (Retrieval-Augmented Generation) sử dụng ChromaDB

## 🚀 Quick Start

### Option 1: Chạy với ChromaDB (Khuyến nghị)
```cmd
quick-setup-chromadb.cmd
```

### Option 2: Chạy thông thường
```cmd
start.ps1
```

## 📋 Cài đặt Chi tiết

### 1. Python 3.11 (Bắt buộc cho ChromaDB)

ChromaDB yêu cầu Python 3.11. Kiểm tra version:
```cmd
verify-python311.cmd
```

Nếu chưa có Python 3.11, cài đặt tự động:
```powershell
setup-python311-auto.ps1
```

### 2. Cài đặt Dependencies

**Với Python 3.11 (cho ChromaDB):**
```cmd
install-chromadb.cmd
```

**Hoặc cài thủ công:**
```cmd
py -3.11 -m pip install -r requirements.txt
```

### 3. Visual C++ Redistributable (Cho ChromaDB)

ChromaDB cần Visual C++ Runtime. Cài đặt tự động:
```powershell
install-vc-redist.ps1
```

### 4. Cấu hình API Key

Copy file `.env.example` thành `.env` và thêm:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

Lấy API key tại: https://makersuite.google.com/app/apikey

## 🎯 Chạy Ứng Dụng

### Chạy với RAG + ChromaDB (Port 8001)
```cmd
py -3.11 main_with_rag.py
```

### Chạy thông thường (Port 8000)
```cmd
python main.py
```

### Hoặc dùng uvicorn:
```cmd
uvicorn main:app --reload --port 8000
```

## 🧪 Test ChromaDB

Sau khi cài đặt, test ChromaDB:
```cmd
test-chromadb.cmd
```

Hoặc test thủ công:
```cmd
py -3.11 -c "import chromadb; print('✅ ChromaDB OK')"
py -3.11 chroma_vector_service.py
```

## API Documentation

Sau khi chạy, truy cập:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📡 API Endpoints

### Main Service (Port 8000)

**POST /api/chat** - Chat với Gemini AI
```json
{
  "message": "Xin chào, bạn là ai?",
  "model": "gemini-2.0-flash-exp"
}
```

**GET /api/models** - Liệt kê models

**GET /** - Health check

### RAG Service (Port 8001)

**POST /api/rag/chat** - Chat với RAG (ChromaDB)
```json
{
  "message": "Làm sao học lập trình?",
  "model": "gemini-2.0-flash-exp"
}
```

**POST /api/rag/add** - Thêm documents vào ChromaDB
```json
{
  "documents": ["Python là ngôn ngữ..."],
  "metadatas": [{"category": "programming"}]
}
```

**GET /api/rag/documents** - Lấy tất cả documents

**DELETE /api/rag/documents** - Xóa tất cả documents

## 📁 Cấu trúc Files

```
PythonService/
├── main.py                          # Main API server (port 8000)
├── main_with_rag.py                 # RAG API server (port 8001)
├── ai_service.py                    # Gemini AI service
├── chroma_vector_service.py         # ChromaDB vector service
├── chroma_db/                       # ChromaDB storage
├── requirements.txt                 # Python dependencies
├── .env                            # API keys
│
├── setup-python311-auto.ps1        # Cài Python 3.11
├── install-chromadb.cmd            # Cài ChromaDB
├── install-vc-redist.ps1           # Cài Visual C++
├── verify-python311.cmd            # Kiểm tra Python 3.11
├── test-chromadb.cmd               # Test ChromaDB
└── quick-setup-chromadb.cmd        # Setup nhanh
```

## 🔧 Troubleshooting

### ChromaDB DLL Error
Nếu gặp lỗi `c10.dll`, cài Visual C++ Redistributable:
```powershell
install-vc-redist.ps1
```

### Python Version
ChromaDB chỉ hoạt động với Python 3.11:
```cmd
py -3.11 --version
```

### Test Import
```cmd
py -3.11 -c "import chromadb; import torch; print('✅ OK')"
```

## 📊 Performance

- **ChromaDB**: Nhanh, production-ready, HNSW index
- **Storage**: Persistent SQLite database
- **Embeddings**: Sentence Transformers (multilingual)
- **Search**: Cosine similarity với HNSW
