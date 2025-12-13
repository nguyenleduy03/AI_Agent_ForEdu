"""
FastAPI AI Service - Extended APIs
Các API mở rộng cho AI: Generate Quiz, Summarize, Explain, Ingest
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
import requests
import json
import re

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
    raise ValueError("⚠️  GEMINI_API_KEY không được tìm thấy trong file .env")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize FastAPI app
app = FastAPI(
    title="AI Service Extended APIs",
    description="API mở rộng cho AI: Quiz Generation, Summarization, Explain, Ingest",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class GenerateQuizRequest(BaseModel):
    content: str
    num_questions: int = 10
    difficulty: str = "medium"  # easy, medium, hard
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "Python là ngôn ngữ lập trình bậc cao...",
                "num_questions": 10,
                "difficulty": "medium"
            }
        }
    )

class QuizQuestion(BaseModel):
    question: str
    a: str
    b: str
    c: str
    d: str
    correct: str  # 'A', 'B', 'C', 'D'

class GenerateQuizResponse(BaseModel):
    questions: List[QuizQuestion]

class SummarizeRequest(BaseModel):
    content: str
    max_length: Optional[int] = 200
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "Văn bản dài cần tóm tắt...",
                "max_length": 200
            }
        }
    )

class SummarizeResponse(BaseModel):
    summary: str
    original_length: int
    summary_length: int

class ExplainRequest(BaseModel):
    question: str
    context: Optional[str] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "question": "Định lý Pythagoras là gì?",
                "context": "Toán học lớp 9"
            }
        }
    )

class ExplainResponse(BaseModel):
    explanation: str
    examples: Optional[List[str]] = None

class IngestRequest(BaseModel):
    file_url: str
    title: Optional[str] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "file_url": "https://example.com/document.pdf",
                "title": "Tài liệu học tập"
            }
        }
    )

class IngestResponse(BaseModel):
    status: str
    message: str
    documents_added: int

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "AI Service Extended APIs",
        "version": "1.0.0"
    }

@app.post("/api/ai/generate-quiz", response_model=GenerateQuizResponse, tags=["AI - Quiz"])
async def generate_quiz(request: GenerateQuizRequest):
    """
    Tạo câu hỏi trắc nghiệm tự động từ nội dung bài học
    
    - **content**: Nội dung bài học
    - **num_questions**: Số câu hỏi cần tạo (1-50)
    - **difficulty**: Độ khó (easy, medium, hard)
    """
    try:
        if request.num_questions < 1 or request.num_questions > 50:
            raise HTTPException(status_code=400, detail="Số câu hỏi phải từ 1-50")
        
        difficulty_map = {
            "easy": "dễ, cơ bản",
            "medium": "trung bình",
            "hard": "khó, nâng cao"
        }
        
        difficulty_desc = difficulty_map.get(request.difficulty.lower(), "trung bình")
        
        prompt = f"""Dựa trên nội dung sau, hãy tạo {request.num_questions} câu hỏi trắc nghiệm với độ khó {difficulty_desc}.

Nội dung:
{request.content}

Yêu cầu:
- Tạo đúng {request.num_questions} câu hỏi
- Mỗi câu có 4 đáp án A, B, C, D
- Chỉ 1 đáp án đúng
- Câu hỏi phải liên quan trực tiếp đến nội dung
- Trả về JSON array với format:

[
  {{
    "question": "Câu hỏi?",
    "a": "Đáp án A",
    "b": "Đáp án B",
    "c": "Đáp án C",
    "d": "Đáp án D",
    "correct": "A"
  }}
]

CHỈ TRẢ VỀ JSON, KHÔNG THÊM TEXT KHÁC."""

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        # Parse JSON từ response
        json_text = response.text.strip()
        
        # Tìm JSON array trong response
        json_match = re.search(r'\[.*\]', json_text, re.DOTALL)
        if not json_match:
            raise HTTPException(status_code=500, detail="Không thể parse JSON từ AI response")
        
        questions_data = json.loads(json_match.group())
        
        questions = []
        for q in questions_data:
            questions.append(QuizQuestion(
                question=q['question'],
                a=q['a'],
                b=q['b'],
                c=q['c'],
                d=q['d'],
                correct=q['correct'].upper()
            ))
        
        return GenerateQuizResponse(questions=questions)
    
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Lỗi parse JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/ai/summarize", response_model=SummarizeResponse, tags=["AI - Summarization"])
async def summarize(request: SummarizeRequest):
    """
    Tóm tắt văn bản
    
    - **content**: Nội dung cần tóm tắt
    - **max_length**: Độ dài tối đa của bản tóm tắt (số từ)
    """
    try:
        prompt = f"""Hãy tóm tắt văn bản sau trong khoảng {request.max_length} từ:

{request.content}

Yêu cầu:
- Giữ lại ý chính
- Ngắn gọn, súc tích
- Dễ hiểu
- Không thêm thông tin ngoài văn bản gốc"""

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        summary = response.text.strip()
        
        return SummarizeResponse(
            summary=summary,
            original_length=len(request.content.split()),
            summary_length=len(summary.split())
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/ai/explain", response_model=ExplainResponse, tags=["AI - Explain"])
async def explain(request: ExplainRequest):
    """
    Giải thích như một giáo viên
    
    - **question**: Câu hỏi cần giải thích
    - **context**: Ngữ cảnh (tùy chọn)
    """
    try:
        context_text = f"\nNgữ cảnh: {request.context}" if request.context else ""
        
        prompt = f"""Bạn là một giáo viên giỏi. Hãy giải thích câu hỏi sau một cách dễ hiểu, chi tiết:{context_text}

Câu hỏi: {request.question}

Yêu cầu:
- Giải thích rõ ràng, dễ hiểu
- Sử dụng ví dụ cụ thể
- Chia nhỏ thành các bước nếu cần
- Giọng điệu thân thiện, khuyến khích học tập

Sau phần giải thích, hãy đưa ra 2-3 ví dụ minh họa."""

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        explanation = response.text.strip()
        
        # Tách examples nếu có
        examples = []
        if "Ví dụ" in explanation or "Example" in explanation:
            parts = re.split(r'Ví dụ \d+:|Example \d+:', explanation)
            if len(parts) > 1:
                examples = [ex.strip() for ex in parts[1:]]
        
        return ExplainResponse(
            explanation=explanation,
            examples=examples if examples else None
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/ai/ingest", response_model=IngestResponse, tags=["AI - RAG Ingest"])
async def ingest_document(request: IngestRequest):
    """
    Ingest tài liệu vào RAG Vector Database
    
    - **file_url**: URL của file cần ingest
    - **title**: Tiêu đề tài liệu (tùy chọn)
    
    Hỗ trợ: PDF, TXT, HTML, DOC
    """
    try:
        # 1. Download và extract text từ file
        text_content = await extract_text_from_url(request.file_url)
        
        if not text_content:
            raise HTTPException(status_code=400, detail="Không thể extract text từ file")
        
        # 2. Chia nhỏ text thành chunks
        chunks = split_text_into_chunks(text_content, chunk_size=500)
        
        # 3. Gọi RAG endpoint để thêm vào vector DB
        rag_url = "http://localhost:8000/api/documents/add"
        
        metadatas = [{
            "source": request.file_url,
            "title": request.title or "Untitled",
            "type": "document"
        } for _ in chunks]
        
        rag_request = {
            "documents": chunks,
            "metadatas": metadatas
        }
        
        response = requests.post(rag_url, json=rag_request)
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Lỗi khi thêm vào RAG database")
        
        return IngestResponse(
            status="success",
            message=f"Đã ingest {len(chunks)} chunks vào RAG database",
            documents_added=len(chunks)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def extract_text_from_url(url: str) -> str:
    """Extract text từ URL (simplified version)"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Simplified: chỉ xử lý text/plain
        if 'text' in response.headers.get('Content-Type', ''):
            return response.text
        
        # Với PDF, DOC cần thêm libraries như PyPDF2, python-docx
        # Đây là placeholder
        return response.text[:10000]  # Giới hạn 10k chars
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi khi download file: {str(e)}")

def split_text_into_chunks(text: str, chunk_size: int = 500) -> List[str]:
    """Chia text thành các chunks nhỏ"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    
    return chunks

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8001))
    print("=" * 60)
    print("🚀 Starting AI Service Extended APIs")
    print("=" * 60)
    print(f"📍 Server: http://localhost:{port}")
    print(f"📚 Swagger UI: http://localhost:{port}/docs")
    print("=" * 60)
    uvicorn.run("ai_service:app", host="0.0.0.0", port=port, reload=True)
