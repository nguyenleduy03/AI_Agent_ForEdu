"""
FastAPI với RAG (Retrieval-Augmented Generation)
Sử dụng Vector Database để tăng cường khả năng trả lời của AI
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
from chroma_vector_service import get_chroma_service

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY không được tìm thấy trong file .env")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize FastAPI app
app = FastAPI(
    title="AI Chat Service with RAG + ChromaDB",
    description="API chat với Gemini AI + ChromaDB Vector Database RAG",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB Vector Database
vector_db = get_chroma_service()

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-2.5-flash"
    use_rag: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Giải thích về AI là gì?",
                "model": "gemini-2.5-flash",
                "use_rag": True
            }
        }

class ChatResponse(BaseModel):
    response: str
    model: str
    context_used: Optional[List[str]] = None
    rag_enabled: bool = False

class DocumentRequest(BaseModel):
    documents: List[str]
    metadatas: Optional[List[dict]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "documents": [
                    "AI (Artificial Intelligence) là trí tuệ nhân tạo, khả năng của máy tính để thực hiện các nhiệm vụ thông minh.",
                    "Machine Learning là một nhánh của AI, cho phép máy tính học từ dữ liệu mà không cần lập trình cụ thể."
                ]
            }
        }

class PromptRAGRequest(BaseModel):
    prompt: str
    category: Optional[str] = "general"
    tags: Optional[List[str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Python là ngôn ngữ lập trình phổ biến, dễ học và có nhiều thư viện mạnh mẽ cho AI/ML.",
                "category": "programming",
                "tags": ["python", "programming", "ai"]
            }
        }

class SearchRequest(BaseModel):
    query: str
    n_results: int = 5

# Root endpoint
@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    doc_count = vector_db.get_count()
    return {
        "status": "running",
        "service": "AI Chat Service with RAG",
        "version": "2.0.0",
        "vector_db_documents": doc_count
    }

# Chat endpoint with RAG
@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Chat với Gemini AI (có hỗ trợ RAG)
    
    - **message**: Tin nhắn của người dùng
    - **model**: Model Gemini sử dụng
    - **use_rag**: Sử dụng RAG để tăng cường context (mặc định: true)
    
    **Auto-save:** Tất cả Q&A sẽ tự động lưu vào ChromaDB để cải thiện RAG
    """
    try:
        context_docs = []
        prompt = request.message
        
        # Nếu bật RAG, tìm kiếm context từ vector DB
        if request.use_rag and vector_db.get_count() > 0:
            search_results = vector_db.search(request.message, n_results=3)
            context_docs = search_results['documents']
            
            if context_docs:
                # Thêm context vào prompt
                context_text = "\n\n".join([f"Context {i+1}: {doc}" for i, doc in enumerate(context_docs)])
                prompt = f"""Dựa trên các thông tin sau đây:

{context_text}

Câu hỏi: {request.message}

Hãy trả lời câu hỏi dựa trên context được cung cấp. Nếu context không đủ thông tin, hãy nói rõ và trả lời dựa trên kiến thức của bạn."""
        
        # Generate response với Gemini
        model = genai.GenerativeModel(request.model)
        response = model.generate_content(prompt)
        
        # AUTO-SAVE: Lưu Q&A vào ChromaDB để cải thiện RAG
        try:
            qa_text = f"Q: {request.message}\nA: {response.text}"
            vector_db.add_documents(
                documents=[qa_text],
                metadatas=[{
                    "type": "qa",
                    "category": "chat_history",
                    "question": request.message[:100],  # Lưu 100 ký tự đầu
                    "model": request.model
                }]
            )
        except Exception as save_error:
            # Không fail request nếu lưu lỗi
            print(f"Warning: Failed to save Q&A to ChromaDB: {save_error}")
        
        return ChatResponse(
            response=response.text,
            model=request.model,
            context_used=context_docs if request.use_rag else None,
            rag_enabled=request.use_rag
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi gọi Gemini API: {str(e)}"
        )

# Vector DB endpoints
@app.post("/api/rag/prompt", tags=["RAG - Knowledge Base"])
@app.post("/api/rag/prompt/auto", tags=["RAG - Knowledge Base"])
async def add_rag_prompt(request: PromptRAGRequest):
    """
    Thêm prompt/kiến thức vào RAG Knowledge Base
    
    Endpoint này cho phép bạn thêm kiến thức mới vào hệ thống RAG.
    Kiến thức sẽ được chuyển thành embeddings và sử dụng để trả lời câu hỏi.
    
    - **prompt**: Nội dung kiến thức cần thêm
    - **category**: Danh mục (vd: programming, ai, education)
    - **tags**: Các tag để phân loại
    
    Available at both:
    - POST /api/rag/prompt
    - POST /api/rag/prompt/auto
    """
    try:
        # Tạo metadata
        metadata = {
            "category": request.category,
            "tags": request.tags if request.tags else [],
            "type": "prompt"
        }
        
        # Thêm vào vector DB
        result = vector_db.add_documents(
            documents=[request.prompt],
            metadatas=[metadata]
        )
        
        return {
            "status": "success",
            "message": "Đã thêm prompt vào RAG knowledge base",
            "prompt": request.prompt,
            "category": request.category,
            "tags": request.tags,
            "total_documents": vector_db.get_count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi thêm prompt: {str(e)}"
        )

@app.post("/api/documents/add", tags=["RAG - Knowledge Base"])
async def add_documents(request: DocumentRequest):
    """
    Thêm nhiều documents vào Vector Database
    
    Documents sẽ được chuyển thành embeddings và lưu trữ để sử dụng cho RAG
    """
    try:
        result = vector_db.add_documents(
            documents=request.documents,
            metadatas=request.metadatas
        )
        return {
            "status": "success",
            "message": f"Đã thêm {result['count']} documents",
            "total_documents": vector_db.get_count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi thêm documents: {str(e)}"
        )

@app.post("/api/documents/search", tags=["RAG - Knowledge Base"])
async def search_documents(request: SearchRequest):
    """
    Tìm kiếm documents tương tự trong Vector Database
    """
    try:
        results = vector_db.search(request.query, request.n_results)
        return {
            "query": request.query,
            "results": [
                {
                    "document": doc,
                    "distance": dist,
                    "metadata": meta,
                    "id": doc_id
                }
                for doc, dist, meta, doc_id in zip(
                    results['documents'],
                    results['distances'],
                    results['metadatas'],
                    results['ids']
                )
            ],
            "count": len(results['documents'])
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi tìm kiếm: {str(e)}"
        )

@app.get("/api/documents", tags=["RAG - Knowledge Base"])
async def get_all_documents():
    """Lấy tất cả documents trong Vector Database"""
    try:
        results = vector_db.get_all_documents()
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy documents: {str(e)}"
        )

@app.delete("/api/documents", tags=["RAG - Knowledge Base"])
async def delete_all_documents():
    """Xóa tất cả documents trong Vector Database"""
    try:
        result = vector_db.delete_all()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi xóa documents: {str(e)}"
        )

@app.get("/api/documents/count", tags=["RAG - Knowledge Base"])
async def get_document_count():
    """Lấy số lượng documents trong Vector Database"""
    count = vector_db.get_count()
    return {"count": count}

@app.get("/api/rag/stats", tags=["RAG - Knowledge Base"])
async def get_rag_stats():
    """
    Lấy thống kê về RAG Knowledge Base
    """
    try:
        all_docs = vector_db.get_all_documents()
        
        # Thống kê theo category
        categories = {}
        for meta in all_docs['metadatas']:
            cat = meta.get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1
        
        return {
            "total_documents": all_docs['count'],
            "categories": categories,
            "status": "active"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy thống kê: {str(e)}"
        )

# List available models
@app.get("/api/models", tags=["Models"])
async def list_models():
    """Liệt kê các model Gemini có sẵn"""
    try:
        models = []
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                models.append({
                    "name": model.name,
                    "display_name": model.display_name,
                    "description": model.description
                })
        return {"models": models}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy danh sách models: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main_with_rag:app", host="0.0.0.0", port=port, reload=True)
