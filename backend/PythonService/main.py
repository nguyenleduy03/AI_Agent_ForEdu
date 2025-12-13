"""
FastAPI AI Chat Service with RAG (Retrieval-Augmented Generation)
Tất cả trong 1 file - Gemini 2.5 Flash + Vector Database
"""
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import math
try:
    from youtube_helper import search_youtube_video, get_youtube_watch_url, get_youtube_embed_url
    YOUTUBE_HELPER_AVAILABLE = True
except ImportError:
    YOUTUBE_HELPER_AVAILABLE = False
    print("⚠️  YouTube helper not available. Video search will use fallback.")

try:
    from agent_features import AgentFeatures
    AGENT_FEATURES_AVAILABLE = True
except ImportError:
    AGENT_FEATURES_AVAILABLE = False
    print("⚠️  Agent features not available.")

try:
    from google_cloud_agent import GoogleCloudAgent
    GOOGLE_CLOUD_AGENT_AVAILABLE = True
except ImportError:
    GOOGLE_CLOUD_AGENT_AVAILABLE = False
    print("⚠️  Google Cloud Agent not available.")

# ============================================================================
# VECTOR DATABASE CLASS
# ============================================================================

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Tính cosine similarity giữa 2 vectors"""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    return dot_product / (magnitude1 * magnitude2)

class SimpleVectorDB:
    def __init__(self, storage_file: str = "vector_db.json"):
        """Khởi tạo Simple Vector Database"""
        self.storage_file = storage_file
        self.documents = []
        self.load()
    
    def load(self):
        """Load data từ file"""
        if os.path.exists(self.storage_file):
            with open(self.storage_file, 'r', encoding='utf-8') as f:
                self.documents = json.load(f)
    
    def save(self):
        """Lưu data vào file"""
        with open(self.storage_file, 'w', encoding='utf-8') as f:
            json.dump(self.documents, f, ensure_ascii=False, indent=2)
    
    def add_documents(self, documents: List[str], metadatas: List[Dict] = None, ids: List[str] = None):
        """Thêm documents vào database"""
        if ids is None:
            start_id = len(self.documents)
            ids = [f"doc_{start_id + i}" for i in range(len(documents))]
        
        if metadatas is None:
            metadatas = [{"source": "manual"} for _ in documents]
        
        # Tạo embeddings
        for doc, metadata, doc_id in zip(documents, metadatas, ids):
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=doc,
                task_type="retrieval_document"
            )
            
            self.documents.append({
                "id": doc_id,
                "document": doc,
                "embedding": result['embedding'],
                "metadata": metadata
            })
        
        self.save()
        return {"status": "success", "count": len(documents)}
    
    def search(self, query: str, n_results: int = 5) -> Dict:
        """Tìm kiếm documents tương tự"""
        if not self.documents:
            return {"documents": [], "distances": [], "metadatas": [], "ids": []}
        
        # Tạo embedding cho query
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=query,
            task_type="retrieval_query"
        )
        query_embedding = result['embedding']
        
        # Tính similarity với tất cả documents
        similarities = []
        for doc in self.documents:
            similarity = cosine_similarity(query_embedding, doc['embedding'])
            similarities.append({
                "document": doc['document'],
                "distance": 1 - similarity,
                "metadata": doc['metadata'],
                "id": doc['id'],
                "similarity": similarity
            })
        
        # Sắp xếp theo similarity
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        top_results = similarities[:n_results]
        
        return {
            "documents": [r['document'] for r in top_results],
            "distances": [r['distance'] for r in top_results],
            "metadatas": [r['metadata'] for r in top_results],
            "ids": [r['id'] for r in top_results]
        }
    
    def delete_all(self):
        """Xóa tất cả documents"""
        self.documents = []
        self.save()
        return {"status": "success", "message": "All documents deleted"}
    
    def get_count(self) -> int:
        """Lấy số lượng documents"""
        return len(self.documents)
    
    def get_all_documents(self) -> Dict:
        """Lấy tất cả documents"""
        return {
            "documents": [doc['document'] for doc in self.documents],
            "metadatas": [doc['metadata'] for doc in self.documents],
            "ids": [doc['id'] for doc in self.documents],
            "count": len(self.documents)
        }

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
    raise ValueError("⚠️  GEMINI_API_KEY không được tìm thấy trong file .env\nLấy API key tại: https://aistudio.google.com/apikey")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize FastAPI app
app = FastAPI(
    title="AI Chat Service with RAG",
    description="API chat với Gemini 2.5 Flash + Vector Database RAG",
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

# Initialize Vector Database
vector_db = SimpleVectorDB(storage_file="knowledge_base.json")

# Initialize Agent Features
if AGENT_FEATURES_AVAILABLE:
    agent_features = AgentFeatures(spring_boot_url="http://localhost:8080")
    print("✅ Agent Features initialized")
else:
    agent_features = None
    print("⚠️  Agent Features not initialized")

# Initialize Google Cloud Agent
if GOOGLE_CLOUD_AGENT_AVAILABLE:
    google_cloud_agent = GoogleCloudAgent(google_cloud_url="http://localhost:8002")
    print("✅ Google Cloud Agent initialized")
else:
    google_cloud_agent = None
    print("⚠️  Google Cloud Agent not initialized")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-flash-latest"  # Use latest flash model (1,500 requests/day)
    use_rag: bool = True
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Giải thích về AI là gì?",
                "model": "gemini-2.5-flash",
                "use_rag": True
            }
        }
    )

class ActionLink(BaseModel):
    type: str  # "youtube", "google", "wikipedia"
    url: str
    title: str
    icon: str

class ToolAction(BaseModel):
    tool: str  # "play_youtube", "search_youtube", "search_google", "open_wikipedia"
    query: str
    url: str
    auto_execute: bool = True
    video_id: Optional[str] = None  # YouTube video ID
    embed_url: Optional[str] = None  # URL để embed video

class ChatResponse(BaseModel):
    response: str
    model: str
    context_used: Optional[List[str]] = None
    rag_enabled: bool = False
    suggested_actions: Optional[List[ActionLink]] = None  # Links gợi ý
    tool_action: Optional[ToolAction] = None  # Action tự động thực thi

class DocumentRequest(BaseModel):
    documents: List[str]
    metadatas: Optional[List[dict]] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "documents": [
                    "AI (Artificial Intelligence) là trí tuệ nhân tạo.",
                    "Machine Learning là một nhánh của AI."
                ]
            }
        }
    )

class PromptRAGRequest(BaseModel):
    prompt: str
    category: Optional[str] = "general"
    tags: Optional[List[str]] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "prompt": "Python là ngôn ngữ lập trình dễ học và mạnh mẽ.",
                    "category": "programming",
                    "tags": ["python", "programming", "ai"]
                },
                {
                    "prompt": "Machine Learning giúp máy tính học từ dữ liệu mà không cần lập trình cụ thể."
                }
            ]
        }
    )

class SimplePromptRequest(BaseModel):
    prompt: str
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "prompt": "FastAPI là framework Python hiện đại để xây dựng API nhanh và dễ sử dụng."
            }
        }
    )

class SearchRequest(BaseModel):
    query: str
    n_results: int = 5

# ============================================================================
# API ENDPOINTS
# ============================================================================

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

def detect_tool_intent(message: str) -> Optional[ToolAction]:
    """Phát hiện intent để tự động thực thi tool"""
    message_lower = message.lower()
    
    # Intent: Phát video YouTube (tự động tìm và phát)
    # Chỉ cần có trigger "phát", "play", "chơi", "bật" là đủ
    play_triggers = ["phát", "play", "chơi", "bật"]
    
    is_play_intent = any(trigger in message_lower for trigger in play_triggers)
    
    if is_play_intent:
        # Extract query - loại bỏ các từ trigger
        query = message_lower
        for trigger in play_triggers + ["mở", "cho tôi", "cho toi", "một", "mot", "bất kỳ", "bat ky", "video", "youtube", "tập"]:
            query = query.replace(trigger, "")
        query = query.strip()
        
        if query and YOUTUBE_HELPER_AVAILABLE:
            # Tìm video trên YouTube
            try:
                video_id = search_youtube_video(query)
                
                if video_id:
                    watch_url = get_youtube_watch_url(video_id, autoplay=True)
                    embed_url = get_youtube_embed_url(video_id, autoplay=True)
                    
                    return ToolAction(
                        tool="play_youtube",
                        query=query,
                        url=watch_url,
                        video_id=video_id,
                        embed_url=embed_url,
                        auto_execute=True
                    )
            except Exception as e:
                print(f"Error searching YouTube: {e}")
                # Fallback to search
                pass
    
    # Intent: Mở YouTube search (không tự động phát)
    youtube_triggers = ["mở video", "xem video", "open video", "show video", "youtube", "tìm video"]
    for trigger in youtube_triggers:
        if trigger in message_lower:
            query = message_lower.replace(trigger, "").replace("về", "").strip()
            if query:
                youtube_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
                return ToolAction(
                    tool="search_youtube",
                    query=query,
                    url=youtube_url,
                    auto_execute=True
                )
    
    # Intent: Search Google
    google_triggers = ["tìm kiếm", "search", "google", "tra google", "tìm trên google"]
    for trigger in google_triggers:
        if trigger in message_lower:
            query = message_lower.replace(trigger, "").strip()
            if query:
                google_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
                return ToolAction(
                    tool="search_google",
                    query=query,
                    url=google_url,
                    auto_execute=True
                )
    
    # Intent: Open Wikipedia
    wiki_triggers = ["wikipedia", "wiki", "tra wikipedia"]
    for trigger in wiki_triggers:
        if trigger in message_lower:
            query = message_lower.replace(trigger, "").strip()
            if query:
                wiki_url = f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}"
                return ToolAction(
                    tool="open_wikipedia",
                    query=query,
                    url=wiki_url,
                    auto_execute=True
                )
    
    return None

@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    """
    Chat với Gemini AI (có hỗ trợ RAG + Agent Features)
    
    - **message**: Tin nhắn của người dùng
    - **model**: Model Gemini sử dụng (mặc định: gemini-2.5-flash)
    - **use_rag**: Sử dụng RAG để tăng cường context (mặc định: true)
    
    Agent Features (tự động):
    - Xem thời khóa biểu (tự động lấy từ trang trường)
    - Xem điểm số
    - Gửi email
    
    Models được khuyến nghị:
    - gemini-2.5-flash (MỚI NHẤT - Nhanh, stable)
    - gemini-2.5-pro (Mạnh nhất)
    - gemini-flash-latest (Luôn dùng version mới nhất)
    """
    try:
        # Extract token from Authorization header
        token = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
        
        # GOOGLE CLOUD AGENT - Check intents FIRST
        if GOOGLE_CLOUD_AGENT_AVAILABLE and google_cloud_agent:
            # Check for Google Cloud intents
            gc_result = google_cloud_agent.handle_google_cloud_request(
                message=request.message,
                token=token or "",
                image_url=None,  # TODO: Extract from message if available
                audio_base64=None  # TODO: Extract from message if available
            )
            
            if gc_result:
                print(f"🌐 Google Cloud intent detected and handled")
                return ChatResponse(
                    response=gc_result['message'],
                    model=request.model,
                    rag_enabled=False
                )
        
        # AGENT FEATURES - Check intents (schedule, grades, email)
        if AGENT_FEATURES_AVAILABLE and agent_features and token:
            # Check for schedule intent
            if agent_features.detect_schedule_intent(request.message):
                print(f"🔍 Detected schedule intent in: {request.message}")
                result = agent_features.get_schedule(token, message=request.message, force_sync=False)
                
                return ChatResponse(
                    response=result['message'],
                    model=request.model,
                    rag_enabled=False
                )
            
            # Check for grade intent
            if agent_features.detect_grade_intent(request.message):
                print(f"🔍 Detected grade intent in: {request.message}")
                result = agent_features.get_grades(token)
                
                return ChatResponse(
                    response=result['message'],
                    model=request.model,
                    rag_enabled=False
                )
            
            # Check for email intent
            if agent_features.detect_email_intent(request.message):
                print(f"🔍 Detected email intent in: {request.message}")
                gemini_model = genai.GenerativeModel(request.model)
                result = agent_features.handle_email_request(request.message, token, gemini_model)
                
                return ChatResponse(
                    response=result['message'],
                    model=request.model,
                    rag_enabled=False
                )
        
        # Detect tool action (YouTube, Google, Wikipedia)
        tool_action = detect_tool_intent(request.message)
        
        if tool_action:
            # AI xác nhận action
            tool_messages = {
                "play_youtube": f"🎬 Đang phát video YouTube về '{tool_action.query}'...\n\nVideo sẽ tự động phát trong giây lát! 🎥",
                "search_youtube": f"🎥 Đang mở YouTube để xem video về '{tool_action.query}'...",
                "search_google": f"🔍 Đang tìm kiếm trên Google về '{tool_action.query}'...",
                "open_wikipedia": f"📖 Đang mở Wikipedia về '{tool_action.query}'..."
            }
            
            confirmation = tool_messages.get(tool_action.tool, "Đang thực hiện...")
            
            return ChatResponse(
                response=confirmation,
                model=request.model,
                tool_action=tool_action,
                rag_enabled=False
            )
        
        # System prompt - Personality của AI
        system_prompt = """🎓 Bạn là AI Learning Assistant - Trợ lý học tập thông minh và thân thiện!

**Vai trò của bạn:**
- Giáo viên ảo kiên nhẫn, nhiệt tình 👨‍🏫
- Giải thích kiến thức rõ ràng, dễ hiểu
- Khuyến khích học sinh tư duy và đặt câu hỏi
- Luôn tích cực và động viên

**Phong cách giao tiếp:**
- Thân thiện, gần gũi như người bạn 😊
- Sử dụng emoji phù hợp để sinh động: 📚 ✨ 💡 🎯 ✅
- Chia nhỏ kiến thức phức tạp thành các phần dễ hiểu
- Đưa ra ví dụ thực tế, gần gũi với cuộc sống

**Cách trả lời:**
1. Tóm tắt ngắn gọn câu hỏi (nếu cần)
2. Giải thích chi tiết với cấu trúc rõ ràng
3. Đưa ra 1-2 ví dụ minh họa
4. Hỏi lại xem còn thắc mắc gì không

**Lưu ý:**
- Nếu không chắc chắn, hãy thừa nhận và đề xuất tìm hiểu thêm
- Khuyến khích học sinh tự suy nghĩ trước khi đưa ra đáp án
- Sử dụng ngôn ngữ phù hợp với trình độ học sinh
"""
        
        context_docs = []
        prompt = request.message
        
        # Nếu bật RAG, tìm kiếm context từ vector DB
        if request.use_rag and vector_db.get_count() > 0:
            search_results = vector_db.search(request.message, n_results=3)
            context_docs = search_results['documents']
            
            if context_docs:
                context_text = "\n\n".join([f"📚 Tài liệu {i+1}: {doc}" for i, doc in enumerate(context_docs)])
                prompt = f"""{system_prompt}

**Tài liệu tham khảo từ khóa học:**
{context_text}

**Câu hỏi của học sinh:**
{request.message}

Hãy trả lời dựa trên tài liệu và kiến thức của bạn. Nếu tài liệu không đủ thông tin, hãy bổ sung từ kiến thức chung."""
            else:
                prompt = f"""{system_prompt}

**Câu hỏi của học sinh:**
{request.message}

Hãy trả lời dựa trên kiến thức của bạn."""
        else:
            prompt = f"""{system_prompt}

**Câu hỏi của học sinh:**
{request.message}"""
        
        # Generate response với Gemini
        model = genai.GenerativeModel(request.model)
        response = model.generate_content(prompt)
        
        # Tạo suggested actions (YouTube, Google Search)
        suggested_actions = []
        
        # Tạo search query từ câu hỏi
        search_query = request.message.replace("?", "").strip()
        
        # YouTube link
        youtube_query = search_query.replace(" ", "+")
        suggested_actions.append(ActionLink(
            type="youtube",
            url=f"https://www.youtube.com/results?search_query={youtube_query}",
            title=f"Xem video về: {search_query[:50]}",
            icon="🎥"
        ))
        
        # Google Search link
        google_query = search_query.replace(" ", "+")
        suggested_actions.append(ActionLink(
            type="google",
            url=f"https://www.google.com/search?q={google_query}",
            title=f"Tìm trên Google: {search_query[:50]}",
            icon="🔍"
        ))
        
        # Wikipedia link (nếu là câu hỏi về khái niệm)
        if any(word in request.message.lower() for word in ["là gì", "what is", "định nghĩa", "khái niệm"]):
            wiki_query = search_query.replace(" ", "_")
            suggested_actions.append(ActionLink(
                type="wikipedia",
                url=f"https://en.wikipedia.org/wiki/{wiki_query}",
                title=f"Wikipedia: {search_query[:50]}",
                icon="📖"
            ))
        
        return ChatResponse(
            response=response.text,
            model=request.model,
            context_used=context_docs if request.use_rag else None,
            rag_enabled=request.use_rag,
            suggested_actions=suggested_actions
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/rag/prompt/auto", tags=["RAG - Knowledge Base"])
async def add_prompt_auto(request: SimplePromptRequest):
    """
    Thêm prompt với AI tự động sinh category và tags
    
    - **prompt**: Nội dung kiến thức cần thêm
    
    AI sẽ tự động phân tích và sinh category + tags phù hợp
    """
    try:
        # Dùng Gemini để phân tích và sinh metadata
        analysis_prompt = f"""Phân tích văn bản sau và trả về JSON:

Văn bản: "{request.prompt}"

Trả về JSON với format:
{{
  "category": "tên_danh_mục",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "tóm tắt ngắn gọn"
}}

Categories: programming, ai, machine-learning, education, science, business, health, technology, math, language, general

Chỉ trả về JSON."""

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(analysis_prompt)
        
        # Parse JSON
        import re
        import json as json_lib
        json_text = response.text.strip()
        json_match = re.search(r'\{[^}]+\}', json_text, re.DOTALL)
        
        if json_match:
            metadata_ai = json_lib.loads(json_match.group())
            category = metadata_ai.get("category", "general")
            tags = metadata_ai.get("tags", [])
            summary = metadata_ai.get("summary", "")
        else:
            category = "general"
            tags = []
            summary = ""
        
        metadata = {
            "category": category,
            "tags": tags,
            "type": "prompt",
            "summary": summary
        }
        
        result = vector_db.add_documents(
            documents=[request.prompt],
            metadatas=[metadata]
        )
        
        return {
            "status": "success",
            "message": "Đã thêm prompt với metadata tự động",
            "prompt": request.prompt,
            "category": category,
            "tags": tags,
            "summary": summary,
            "total_documents": vector_db.get_count()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/rag/prompt", tags=["RAG - Knowledge Base"])
async def add_rag_prompt(request: PromptRAGRequest):
    """
    Thêm prompt/kiến thức vào RAG Knowledge Base
    
    - **prompt**: Nội dung kiến thức cần thêm
    - **category**: Danh mục (tự động sinh nếu để trống)
    - **tags**: Các tag (tự động sinh nếu để trống)
    
    AI sẽ tự động phân tích và sinh category + tags nếu không cung cấp
    """
    try:
        # Nếu không có category hoặc tags, dùng AI để sinh tự động
        category = request.category
        tags = request.tags if request.tags else []
        
        if category == "general" or not tags:
            # Dùng Gemini để phân tích và sinh metadata
            analysis_prompt = f"""Phân tích văn bản sau và trả về JSON với format chính xác:

Văn bản: "{request.prompt}"

Hãy phân tích và trả về JSON với format:
{{
  "category": "tên_danh_mục",
  "tags": ["tag1", "tag2", "tag3"]
}}

Các category phổ biến: programming, ai, machine-learning, education, science, business, health, technology, math, language

Chỉ trả về JSON, không thêm text khác."""

            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(analysis_prompt)
            
            try:
                # Parse JSON từ response
                import re
                json_text = response.text.strip()
                # Tìm JSON trong response
                json_match = re.search(r'\{[^}]+\}', json_text)
                if json_match:
                    import json as json_lib
                    metadata_ai = json_lib.loads(json_match.group())
                    
                    if category == "general":
                        category = metadata_ai.get("category", "general")
                    
                    if not tags:
                        tags = metadata_ai.get("tags", [])
            except:
                # Nếu parse lỗi, giữ nguyên giá trị mặc định
                pass
        
        metadata = {
            "category": category,
            "tags": tags,
            "type": "prompt"
        }
        
        result = vector_db.add_documents(
            documents=[request.prompt],
            metadatas=[metadata]
        )
        
        return {
            "status": "success",
            "message": "Đã thêm prompt vào RAG knowledge base",
            "prompt": request.prompt,
            "category": category,
            "tags": tags,
            "auto_generated": request.category == "general" or not request.tags,
            "total_documents": vector_db.get_count()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/documents/add", tags=["RAG - Knowledge Base"])
async def add_documents(request: DocumentRequest):
    """Thêm nhiều documents vào Vector Database"""
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
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/documents/search", tags=["RAG - Knowledge Base"])
async def search_documents(request: SearchRequest):
    """Tìm kiếm documents tương tự trong Vector Database"""
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
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.get("/api/documents", tags=["RAG - Knowledge Base"])
async def get_all_documents():
    """Lấy tất cả documents trong Vector Database"""
    try:
        return vector_db.get_all_documents()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.delete("/api/documents", tags=["RAG - Knowledge Base"])
async def delete_all_documents():
    """Xóa tất cả documents trong Vector Database"""
    try:
        return vector_db.delete_all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.get("/api/documents/count", tags=["RAG - Knowledge Base"])
async def get_document_count():
    """Lấy số lượng documents trong Vector Database"""
    return {"count": vector_db.get_count()}

@app.get("/api/rag/stats", tags=["RAG - Knowledge Base"])
async def get_rag_stats():
    """Lấy thống kê về RAG Knowledge Base"""
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
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

# ============================================================================
# AI EXTENDED APIS
# ============================================================================

class GenerateQuizRequest(BaseModel):
    content: str
    num_questions: int = 10
    difficulty: str = "medium"
    
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
    correct: str

class GenerateQuizResponse(BaseModel):
    questions: List[QuizQuestion]

class SummarizeRequest(BaseModel):
    content: str
    max_length: Optional[int] = 200

class SummarizeResponse(BaseModel):
    summary: str
    original_length: int
    summary_length: int

class ExplainRequest(BaseModel):
    question: str
    context: Optional[str] = None

class ExplainResponse(BaseModel):
    explanation: str
    examples: Optional[List[str]] = None

class IngestRequest(BaseModel):
    file_url: str
    title: Optional[str] = None

class IngestResponse(BaseModel):
    status: str
    message: str
    documents_added: int

@app.post("/api/ai/generate-quiz", response_model=GenerateQuizResponse, tags=["AI - Extended"])
async def generate_quiz(request: GenerateQuizRequest):
    """Tạo câu hỏi trắc nghiệm tự động từ nội dung bài học"""
    try:
        import re
        import json as json_lib
        
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
        
        json_text = response.text.strip()
        json_match = re.search(r'\[.*\]', json_text, re.DOTALL)
        if not json_match:
            raise HTTPException(status_code=500, detail="Không thể parse JSON từ AI response")
        
        questions_data = json_lib.loads(json_match.group())
        
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
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/ai/summarize", response_model=SummarizeResponse, tags=["AI - Extended"])
async def summarize(request: SummarizeRequest):
    """Tóm tắt văn bản"""
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

@app.post("/api/ai/explain", response_model=ExplainResponse, tags=["AI - Extended"])
async def explain(request: ExplainRequest):
    """Giải thích như một giáo viên"""
    try:
        import re
        
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

@app.post("/api/ai/ingest", response_model=IngestResponse, tags=["AI - Extended"])
async def ingest_document(request: IngestRequest):
    """Ingest tài liệu vào RAG Vector Database"""
    try:
        # Simplified: chỉ xử lý text content
        # Trong production cần thêm PDF, DOC parsing
        
        # Giả lập extract text
        text_content = f"Nội dung từ {request.file_url}"
        
        # Chia nhỏ thành chunks
        words = text_content.split()
        chunk_size = 500
        chunks = []
        
        for i in range(0, len(words), chunk_size):
            chunk = ' '.join(words[i:i + chunk_size])
            chunks.append(chunk)
        
        # Thêm vào vector DB
        metadatas = [{
            "source": request.file_url,
            "title": request.title or "Untitled",
            "type": "document"
        } for _ in chunks]
        
        result = vector_db.add_documents(
            documents=chunks,
            metadatas=metadatas
        )
        
        return IngestResponse(
            status="success",
            message=f"Đã ingest {len(chunks)} chunks vào RAG database",
            documents_added=len(chunks)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

# ============================================================================
# CREDENTIAL MANAGER INTEGRATION
# ============================================================================

# Import credential API router
try:
    from credential_api import router as credential_router
    app.include_router(credential_router)
    CREDENTIAL_API_AVAILABLE = True
    print("✅ Credential Manager API loaded")
except ImportError as e:
    CREDENTIAL_API_AVAILABLE = False
    print(f"⚠️  Credential Manager API not available: {e}")
    print("   System will work without AI semantic search for credentials")
    print("   To enable: pip install chromadb sentence-transformers")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("=" * 60)
    print("🚀 Starting AI Chat Service with RAG")
    print("=" * 60)
    print(f"📍 Server: http://localhost:{port}")
    print(f"📚 Swagger UI: http://localhost:{port}/docs")
    print(f"📊 Vector DB Documents: {vector_db.get_count()}")
    if CREDENTIAL_API_AVAILABLE:
        print(f"🔐 Credential Manager: Enabled")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
