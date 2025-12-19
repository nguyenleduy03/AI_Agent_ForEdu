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

## 🧪 Testing

### Test ChatBot
Use the `/api/chat` endpoint with a message:
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Xin chào! Bạn là ai?", "model": "gemini-2.0-flash-exp"}'
```

### Test Password Reset
```bash
cd backend/PythonService
python password_reset.py
# Follow prompts to reset user password
```

### Test ChromaDB
```cmd
py -3.11 -c "import chromadb; import torch; print('✅ OK')"
```

## 📧 Email Configuration

Gmail SMTP setup for password reset emails:

1. Enable 2-Step Verification on your Gmail account
2. Create App Password (Mail app)
3. Add to `.env`:
```env
GMAIL_SMTP_USER=your-email@gmail.com
GMAIL_SMTP_PASSWORD=your-app-password-16-char
```

## 🔐 Google OAuth Configuration

For OAuth authentication:

1. Get credentials from Google Cloud Console
2. Add to `.env`:
```env
GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8003/api/oauth/google/callback
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

### Port Already in Use
Change the port in the relevant file:
```bash
# For main.py (default 8000)
python main.py --port 8001

# For main_with_rag.py (default 8001)
py -3.11 main_with_rag.py --port 8002
```

### Memory Issues with ChromaDB
If you experience memory issues:
1. Reduce batch size in `chroma_vector_service.py`
2. Clear ChromaDB cache: `rm -rf chroma_db/`
3. Restart the service

### GEMINI_API_KEY not recognized
Make sure `.env` file:
1. Exists in the PythonService directory
2. Contains: `GEMINI_API_KEY=your_actual_key`
3. Is not in .gitignore (but don't commit it!)

## 📊 Performance

- **ChromaDB**: Nhanh, production-ready, HNSW index
- **Storage**: Persistent SQLite database
- **Embeddings**: Sentence Transformers (multilingual)
- **Search**: Cosine similarity với HNSW
