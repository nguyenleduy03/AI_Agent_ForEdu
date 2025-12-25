"""
FastAPI AI Chat Service with RAG (Retrieval-Augmented Generation)
Tất cả trong 1 file - Gemini 2.5 Flash + Vector Database
"""
import sys
import io
import os

# Fix Unicode encoding for Windows console - MUST BE FIRST!
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    # Also set console code page to UTF-8
    os.system('chcp 65001 >nul 2>&1')

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import math
import requests
from datetime import datetime, timedelta
try:
    from youtube_helper import search_youtube_video, get_youtube_watch_url, get_youtube_embed_url
    YOUTUBE_HELPER_AVAILABLE = True
except ImportError:
    YOUTUBE_HELPER_AVAILABLE = False
    print("⚠️  YouTube helper not available. Video search will use fallback.")

try:
    from groq_helper import GroqClient
    GROQ_HELPER_AVAILABLE = True
except ImportError:
    GROQ_HELPER_AVAILABLE = False
    print("⚠️  Groq helper not available.")

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

try:
    from document_intelligence_service import DocumentIntelligence, create_document_intelligence_service
    DOCUMENT_INTELLIGENCE_AVAILABLE = True
except ImportError:
    DOCUMENT_INTELLIGENCE_AVAILABLE = False
    print("⚠️  Document Intelligence not available.")

# LangChain Agent
try:
    from langchain_agent_simple import create_simple_langchain_agent, SimpleLangChainAgent
    LANGCHAIN_AGENT_AVAILABLE = True
except ImportError:
    LANGCHAIN_AGENT_AVAILABLE = False
    print("⚠️  LangChain Agent not available. Install: pip install langchain langchain-google-genai")

# Image analysis tools for non-vision models (Groq)
# Using OCR.space free API (25,000 requests/month)
IMAGE_OCR_AVAILABLE = True  # Always available via API
IMAGE_CAPTION_AVAILABLE = False
print("✅ OCR.space API available for Groq image reading")

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
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DEFAULT_AI_MODEL = os.getenv("DEFAULT_AI_MODEL", "gemini")

# Validate API keys
if DEFAULT_AI_MODEL == "gemini":
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        raise ValueError("⚠️  GEMINI_API_KEY không được tìm thấy trong file .env\nLấy API key tại: https://aistudio.google.com/apikey")
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"✅ Using Gemini AI")
elif DEFAULT_AI_MODEL == "groq":
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        raise ValueError("⚠️  GROQ_API_KEY không được tìm thấy trong file .env\nLấy API key tại: https://console.groq.com/")
    print(f"✅ Using Groq AI")
else:
    # Fallback to Gemini if not specified
    if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
        genai.configure(api_key=GEMINI_API_KEY)
        print(f"⚠️  Invalid DEFAULT_AI_MODEL, falling back to Gemini")
    else:
        raise ValueError(f"⚠️  No valid API key found")

# Initialize AI clients
groq_client = None
if GROQ_HELPER_AVAILABLE and GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
    groq_client = GroqClient(GROQ_API_KEY)
    print("✅ Groq client initialized")

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
    google_cloud_agent = GoogleCloudAgent(google_cloud_url="http://localhost:8004")
    print("✅ Google Cloud Agent initialized")
else:
    google_cloud_agent = None
    print("⚠️  Google Cloud Agent not initialized")

# Initialize LangChain Agent - DISABLED (không cần thiết cho dự án này)
# Kết luận: LangChain phức tạp 8/10, giá trị thực tế thấp
langchain_agent = None
print("ℹ️  LangChain Agent disabled - using direct Gemini API instead")

# Initialize Image Analysis models (lazy loading)
# No longer using EasyOCR or BLIP - using pytesseract instead

def extract_image_content(image_base64: str, image_mime_type: str) -> Dict[str, str]:
    """
    Extract text from image using OCR.space API
    Also provides basic image description for non-text images
    Returns: {
        "description": "Basic image info",
        "text_content": "Extracted text from image",
        "success": True/False
    }
    """
    try:
        import base64
        from PIL import Image
        import io
        
        # Decode image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Get image info
        width, height = image.size
        img_format = image.format or "Unknown"
        mode = image.mode  # RGB, RGBA, L (grayscale), etc.
        
        result = {
            "description": f"Ảnh {img_format}, kích thước {width}x{height} pixels, mode: {mode}",
            "text_content": "",
            "success": False
        }
        
        # Use OCR.space free API with Vietnamese support
        try:
            print("🔍 Using OCR.space API for text extraction...")
            import requests
            
            ocr_url = "https://api.ocr.space/parse/image"
            
            # Try Vietnamese first, then English
            for lang in ['vie', 'eng']:
                print(f"   Trying language: {lang}")
                payload = {
                    'base64Image': f'data:{image_mime_type};base64,{image_base64}',
                    'language': lang,
                    'isOverlayRequired': False,
                    'detectOrientation': True,
                    'scale': True,
                    'OCREngine': 2  # Engine 2 for better accuracy
                }
                
                response = requests.post(ocr_url, data=payload, timeout=30)
                ocr_result = response.json()
                
                # Check for processing error
                is_error = ocr_result.get('IsErroredOnProcessing', False)
                if is_error:
                    error_msg = ocr_result.get('ErrorMessage', 'Unknown error')
                    # ErrorMessage can be string or list
                    if isinstance(error_msg, list):
                        error_msg = error_msg[0] if error_msg else 'Unknown error'
                    elif not isinstance(error_msg, str):
                        error_msg = str(error_msg)
                    print(f"   ⚠️ OCR error ({lang}): {error_msg}")
                    continue
                
                # Extract text from all parsed results
                text_parts = []
                parsed_results = ocr_result.get('ParsedResults', [])
                
                # Ensure parsed_results is a list
                if not isinstance(parsed_results, list):
                    print(f"   ⚠️ ParsedResults is not a list: {type(parsed_results)}")
                    continue
                
                for parsed_result in parsed_results:
                    # Ensure parsed_result is a dict
                    if not isinstance(parsed_result, dict):
                        continue
                    text = parsed_result.get('ParsedText', '').strip()
                    if text:
                        text_parts.append(text)
                
                full_text = '\n'.join(text_parts)
                
                if full_text and len(full_text) > 5:  # At least some meaningful text
                    result["text_content"] = full_text
                    result["success"] = True
                    print(f"✅ OCR extracted {len(full_text)} characters ({lang})")
                    break  # Found text, stop trying other languages
            
            # If no text found, provide helpful context
            if not result["success"] or not result["text_content"]:
                result["text_content"] = f"""[Không tìm thấy text trong ảnh]

Thông tin ảnh:
- Định dạng: {img_format}
- Kích thước: {width}x{height} pixels
- Chế độ màu: {mode}

Lưu ý: Groq không thể phân tích nội dung hình ảnh (chỉ đọc được text).
Nếu bạn cần phân tích ảnh chi tiết, vui lòng chuyển sang Gemini."""
                result["success"] = True  # Still return success so we can respond
                print(f"ℹ️ No text found in image, returning image info")
                
        except requests.exceptions.Timeout:
            print(f"⚠️ OCR timeout")
            result["text_content"] = "[OCR timeout - vui lòng thử lại]"
        except Exception as e:
            print(f"⚠️ OCR error: {e}")
            result["text_content"] = f"[OCR error: {str(e)[:100]}]"
        
        return result
        
    except Exception as e:
        print(f"❌ Image extraction error: {e}")
        return {
            "description": "Error processing image",
            "text_content": f"[Error: {str(e)[:100]}]",
            "success": False,
            "error": str(e)
        }

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_user_id_from_token(token: str) -> Optional[int]:
    """
    Get user_id from JWT token by calling Spring Boot API
    
    Args:
        token: JWT token string
    
    Returns:
        user_id (int) or None if failed
    """
    if not token:
        return None
    
    try:
        # Call Spring Boot API to get user profile
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            "http://localhost:8080/api/auth/profile",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            user_data = response.json()
            user_id = user_data.get('id')
            print(f"✅ Got user_id from token: {user_id}")
            return user_id
        else:
            print(f"⚠️  Failed to get user from token: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting user_id from token: {e}")
        return None

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-flash-latest"  # Use latest flash model (1,500 requests/day)
    ai_provider: str = "gemini"  # "gemini" or "groq"
    use_rag: bool = True
    image_base64: Optional[str] = None  # Base64 encoded image for vision analysis
    image_mime_type: Optional[str] = None  # e.g., "image/jpeg", "image/png"
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Giải thích về AI là gì?",
                "model": "gemini-2.5-flash",
                "ai_provider": "gemini",
                "use_rag": True,
                "image_base64": None,
                "image_mime_type": None
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

class SendEmailRequest(BaseModel):
    """Request model for sending email after user confirmation"""
    to: str
    subject: str
    body: str
    user_id: Optional[int] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "to": "teacher@tvu.edu.vn",
                "subject": "Xin nghỉ học",
                "body": "Kính gửi thầy, em xin phép nghỉ học...",
                "user_id": 1
            }
        }
    )

class EmailDraft(BaseModel):
    """Email draft for preview"""
    to: str
    subject: str
    body: str
    user_id: Optional[int] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        # Ensure snake_case in JSON output
    )

class ChatResponse(BaseModel):
    response: str
    model: str
    context_used: Optional[List[str]] = None
    rag_enabled: bool = False
    suggested_actions: Optional[List[ActionLink]] = None  # Links gợi ý
    tool_action: Optional[ToolAction] = None  # Action tự động thực thi
    email_draft: Optional[EmailDraft] = None  # Email draft for preview
    
    model_config = ConfigDict(
        populate_by_name=True,
        # Ensure snake_case in JSON output
    )

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


# ============================================================================
# TEST ENDPOINT - TVU Schedule Direct
# ============================================================================
class TVUTestRequest(BaseModel):
    mssv: str
    password: str
    message: str = "Hôm nay tôi học gì?"

@app.post("/api/test/tvu-schedule", tags=["Test"])
async def test_tvu_schedule(request: TVUTestRequest):
    """
    Test endpoint - Lấy TKB trực tiếp từ TVU (không cần đăng nhập hệ thống)
    """
    try:
        from tvu_scraper import TVUScraper
        from datetime import datetime, timedelta
        import re
        
        scraper = TVUScraper()
        
        # Login
        if not scraper.login(request.mssv, request.password):
            return {"success": False, "message": "❌ Đăng nhập TVU thất bại!"}
        
        # Get schedule
        schedules = scraper.get_schedule()
        
        if not schedules:
            return {"success": False, "message": "📅 Không tìm thấy lịch học tuần này."}
        
        # Filter by day if message mentions specific day
        message_lower = request.message.lower()
        today = datetime.now()
        day_map = {
            'thứ 2': 'MONDAY', 'thứ hai': 'MONDAY', 't2': 'MONDAY',
            'thứ 3': 'TUESDAY', 'thứ ba': 'TUESDAY', 't3': 'TUESDAY',
            'thứ 4': 'WEDNESDAY', 'thứ tư': 'WEDNESDAY', 't4': 'WEDNESDAY',
            'thứ 5': 'THURSDAY', 'thứ năm': 'THURSDAY', 't5': 'THURSDAY',
            'thứ 6': 'FRIDAY', 'thứ sáu': 'FRIDAY', 't6': 'FRIDAY',
            'thứ 7': 'SATURDAY', 'thứ bảy': 'SATURDAY', 't7': 'SATURDAY',
            'chủ nhật': 'SUNDAY', 'cn': 'SUNDAY'
        }
        
        # Check for relative dates
        target_day = None
        day_label = "tuần này"
        
        # Try to extract specific date first (DD/MM/YYYY or DD-MM-YYYY)
        date_pattern = r'(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})[/-](\d{4})'
        date_match = re.search(date_pattern, message_lower)
        if date_match:
            try:
                day, month, year = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
                target_date = datetime(year, month, day)
                target_day = target_date.strftime('%A').upper()
                date_str = target_date.strftime('%d/%m/%Y')
                day_name = target_date.strftime('%A')
                
                # Map to Vietnamese day name
                day_names = {
                    'Monday': 'Thứ 2',
                    'Tuesday': 'Thứ 3',
                    'Wednesday': 'Thứ 4',
                    'Thursday': 'Thứ 5',
                    'Friday': 'Thứ 6',
                    'Saturday': 'Thứ 7',
                    'Sunday': 'Chủ nhật'
                }
                vn_day = day_names.get(day_name, day_name)
                day_label = f"{vn_day} ({date_str})"
            except (ValueError, OverflowError):
                pass
        
        # Hôm qua
        if target_day is None and ('hôm qua' in message_lower or 'hom qua' in message_lower):
            yesterday = today - timedelta(days=1)
            target_day = yesterday.strftime('%A').upper()
            date_str = yesterday.strftime('%d/%m/%Y')
            day_label = f"hôm qua ({date_str})"
        # Mai
        elif target_day is None and 'mai' in message_lower:
            tomorrow = today + timedelta(days=1)
            target_day = tomorrow.strftime('%A').upper()
            date_str = tomorrow.strftime('%d/%m/%Y')
            day_label = f"mai ({date_str})"
        # Mốt (2 ngày sau)
        elif target_day is None and ('mốt' in message_lower or 'mot' in message_lower):
            two_days = today + timedelta(days=2)
            target_day = two_days.strftime('%A').upper()
            date_str = two_days.strftime('%d/%m/%Y')
            day_label = f"mốt ({date_str})"
        # Kia (3 ngày sau)
        elif target_day is None and 'kia' in message_lower:
            three_days = today + timedelta(days=3)
            target_day = three_days.strftime('%A').upper()
            date_str = three_days.strftime('%d/%m/%Y')
            day_label = f"kia ({date_str})"
        # Hôm nay
        elif target_day is None and ('hôm nay' in message_lower or 'hom nay' in message_lower or 'today' in message_lower or 'hnay' in message_lower):
            target_day = today.strftime('%A').upper()
            date_str = today.strftime('%d/%m/%Y')
            day_label = f"hôm nay ({date_str})"
        elif target_day is None:
            # Check for specific day name
            for keyword, day in day_map.items():
                if keyword in message_lower:
                    target_day = day
                    day_label = keyword
                    break
        
        # Filter schedules by target day
        if target_day:
            schedules = [s for s in schedules if s.get('day_of_week') == target_day]
        
        if not schedules:
            return {
                "success": True,
                "message": f"📅 {day_label.capitalize()} bạn không có lớp nào.",
                "schedules": []
            }
        
        # Format response
        message_text = f"📅 **Lịch học {day_label}:**\n\n"
        for schedule in schedules:
            day_vn = {
                'MONDAY': 'Thứ 2', 'TUESDAY': 'Thứ 3', 'WEDNESDAY': 'Thứ 4',
                'THURSDAY': 'Thứ 5', 'FRIDAY': 'Thứ 6', 'SATURDAY': 'Thứ 7', 'SUNDAY': 'CN'
            }.get(schedule.get('day_of_week', ''), '')
            
            start_time = schedule.get('start_time', '')[:5]
            end_time = schedule.get('end_time', '')[:5]
            
            message_text += f"🕐 **{start_time} - {end_time}** ({day_vn})\n"
            message_text += f"   📚 {schedule.get('subject', 'N/A')}\n"
            message_text += f"   🏫 Phòng {schedule.get('room', 'N/A')}\n"
            if schedule.get('teacher'):
                message_text += f"   👨‍🏫 {schedule['teacher']}\n"
            message_text += "\n"
        
        return {
            "success": True,
            "message": message_text,
            "schedules": schedules
        }
        
    except Exception as e:
        return {"success": False, "message": f"❌ Lỗi: {str(e)}"}


@app.post("/api/chat", tags=["Chat"])
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
        user_id = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            # Get user_id from token
            user_id = get_user_id_from_token(token)
        
        print(f"\n{'='*60}")
        print(f"📨 NEW CHAT REQUEST")
        print(f"Message: {request.message}")
        print(f"AI Provider: {request.ai_provider}")
        print(f"Has token: {token is not None}")
        print(f"User ID: {user_id}")
        print(f"AGENT_FEATURES_AVAILABLE: {AGENT_FEATURES_AVAILABLE}")
        print(f"agent_features: {agent_features is not None if 'agent_features' in globals() else 'NOT DEFINED'}")
        
        # Debug email intent detection
        if AGENT_FEATURES_AVAILABLE and agent_features:
            email_intent = agent_features.detect_email_intent(request.message)
            gmail_send_intent = agent_features.detect_gmail_send_intent(request.message)
            print(f"🔍 Email Intent: {email_intent}")
            print(f"🔍 Gmail Send Intent: {gmail_send_intent}")
        
        print(f"{'='*60}\n")
        
        # ===== DECISION TREE: IMAGE vs AGENTS vs TOOLS =====
        # Priority: Image > Google Cloud Agent > Agent Features > Tools > Normal chat
        
        has_image_input = bool(request.image_base64 and request.image_mime_type)
        
        if has_image_input:
            # ===== HIGHEST PRIORITY: IMAGE VISION =====
            print(f"🖼️ IMAGE DETECTED - Skipping ALL agent features!")
            print(f"   MIME type: {request.image_mime_type}")
            print(f"   Base64 length: {len(request.image_base64)}")
            print(f"   Jumping directly to Vision AI processing...")
            # Skip everything, go to vision processing at ~line 900
            
        elif GOOGLE_CLOUD_AGENT_AVAILABLE and google_cloud_agent:
            # Check for Google Cloud intents
            gc_result = google_cloud_agent.handle_google_cloud_request(
                message=request.message,
                token=token or "",
                image_url=None,  # TODO: Extract from message if available
                audio_base64=None  # TODO: Extract from message if available
            )
            
            if gc_result:
                print(f"🌐 Google Cloud intent detected and handled")
                # Safely convert to string
                response_text = gc_result.get('message', '')
                if not isinstance(response_text, str):
                    response_text = str(response_text) if not isinstance(response_text, list) else '\n'.join(str(x) for x in response_text)
                
                return ChatResponse(
                    response=response_text,
                    model=request.model,
                    rag_enabled=False
                ).model_dump()
        
        # AGENT FEATURES - Check intents (schedule, grades, email)
        # ONLY run if we haven't returned yet (no Google Cloud intent) AND no image
        if not has_image_input and AGENT_FEATURES_AVAILABLE and agent_features:
            # ===== CHECK EMAIL INTENT FIRST (cao nhất) =====
            # Email patterns rất cụ thể nên ưu tiên trước
            # Email draft generation KHÔNG cần token
            if agent_features.detect_email_intent(request.message):
                print(f"✅ 📧 Detected email intent in: {request.message}")
                print(f"Token: {token is not None}, User ID: {user_id}")
                
                # Always use handle_gmail_send for send intent - it handles both auth and no-auth cases
                if agent_features.detect_gmail_send_intent(request.message):
                    print(f"📧 Detected SEND intent - calling handle_gmail_send with user_id: {user_id}")
                    result = agent_features.handle_gmail_send(request.message, token or "", user_id=user_id)
                elif token and user_id:
                    # For read/search - need authentication
                    if agent_features.detect_gmail_read_intent(request.message):
                        print(f"📧 Using Gmail OAuth API for READ - User ID: {user_id}")
                        result = agent_features.handle_gmail_read(request.message, token, user_id=user_id)
                    elif agent_features.detect_gmail_search_intent(request.message):
                        print(f"📧 Using Gmail OAuth API for SEARCH - User ID: {user_id}")
                        result = agent_features.handle_gmail_search(request.message, token, user_id=user_id)
                    else:
                        result = agent_features.handle_gmail_request(request.message, token, user_id=user_id)
                else:
                    result = {
                        "success": False,
                        "message": "📧 Vui lòng cung cấp địa chỉ email người nhận trong câu lệnh.\n\nVí dụ: 'gửi mail xin nghỉ học đến teacher@tvu.edu.vn'"
                    }
                
                # Safely convert result['message'] to string
                response_text = result.get('message', '')
                if not isinstance(response_text, str):
                    if isinstance(response_text, list):
                        response_text = '\n'.join(str(item) for item in response_text)
                    else:
                        response_text = str(response_text)
                
                # Extract email_draft if present
                email_draft_data = result.get('email_draft')
                email_draft = None
                if email_draft_data:
                    print(f"✅ Email draft found: {email_draft_data}")
                    email_draft = EmailDraft(**email_draft_data)
                    print(f"✅ EmailDraft object created: {email_draft}")
                    print(f"✅ EmailDraft dict: {email_draft.model_dump()}")
                else:
                    print(f"⚠️ No email_draft in result. Result keys: {result.keys()}")
                
                chat_response = ChatResponse(
                    response=response_text,
                    model=request.model,
                    rag_enabled=False,
                    email_draft=email_draft
                )
                print(f"📧 ChatResponse created with email_draft: {chat_response.email_draft is not None}")
                
                # Serialize to dict to ensure email_draft is included
                response_dict = chat_response.model_dump()
                print(f"📧 ChatResponse dict: {response_dict}")
                print(f"📧 email_draft in dict: {response_dict.get('email_draft')}")
                
                # Ensure email_draft is in response even if None
                if 'email_draft' not in response_dict:
                    response_dict['email_draft'] = None
                    print(f"⚠️ Added email_draft=None to response_dict")
                
                return response_dict
            
            # ===== CHECK SCHEDULE INTENT ===== (CẦN token)
            # Check for schedule intent
            if token and agent_features.detect_schedule_intent(request.message):
                print(f"📅 Detected schedule intent in: {request.message}")
                result = agent_features.get_schedule(token, message=request.message, force_sync=False)
                
                # Safely convert to string
                response_text = result.get('message', '')
                if not isinstance(response_text, str):
                    response_text = str(response_text) if not isinstance(response_text, list) else '\n'.join(str(x) for x in response_text)
                
                return ChatResponse(
                    response=response_text,
                    model=request.model,
                    rag_enabled=False
                ).model_dump()
            
            # ===== CHECK CALENDAR SYNC INTENT ===== (CẦN token + user_id)
            # Check for calendar sync intent
            if token and user_id and agent_features.detect_calendar_sync_intent(request.message):
                print(f"🔄 Detected calendar sync intent in: {request.message}")
                result = agent_features.sync_schedule_to_calendar(
                    token=token,
                    user_id=user_id,
                    week=None,  # Use current week
                    hoc_ky=None  # Use current semester
                )
                
                # Safely convert to string
                response_text = result.get('message', '')
                if not isinstance(response_text, str):
                    response_text = str(response_text) if not isinstance(response_text, list) else '\n'.join(str(x) for x in response_text)
                
                return ChatResponse(
                    response=response_text,
                    model=request.model,
                    rag_enabled=False
                ).model_dump()
            
            # ===== CHECK GRADE INTENT ===== (CẦN token)
            # Check for grade intent
            if token and agent_features.detect_grade_intent(request.message):
                print(f"📊 Detected grade intent in: {request.message}")
                result = agent_features.get_grades(token)
                
                # Safely convert to string
                response_text = result.get('message', '')
                if not isinstance(response_text, str):
                    response_text = str(response_text) if not isinstance(response_text, list) else '\n'.join(str(x) for x in response_text)
                
                return ChatResponse(
                    response=response_text,
                    model=request.model,
                    rag_enabled=False
                ).model_dump()
        
        # Detect tool action (YouTube, Google, Wikipedia) - ONLY if NO image
        tool_action = None
        if not has_image_input:
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
            ).model_dump()
        
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
        
        # Check if image is provided for vision analysis
        content_parts = []
        has_image = request.image_base64 and request.image_mime_type
        
        if has_image:
            # Use Gemini Vision API for image analysis
            print(f"🖼️ Image detected - using Gemini Vision API")
            print(f"   MIME type: {request.image_mime_type}")
            print(f"   Base64 length: {len(request.image_base64)}")
            
            import base64
            from PIL import Image
            import io
            
            # Decode base64 image
            image_data = base64.b64decode(request.image_base64)
            print(f"   Decoded image size: {len(image_data)} bytes")
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))
            print(f"   Image format: {image.format}, Size: {image.size}")
            
            # Validate image
            if image is None or image.size[0] == 0 or image.size[1] == 0:
                raise ValueError("Invalid image: size is zero")
            
            # Create VISION-SPECIFIC prompt
            vision_prompt = f"""BẠN LÀ GEMINI - AI VISION MODEL VỚI KHẢ NĂNG NHÌN THẤY HÌNH ẢNH!

🖼️ **THỰC TRẠNG:** 
- Học sinh ĐÃ GỬI CHO BẠN MỘT HÌNH ẢNH
- Hình ảnh đang ở ngay phía sau tin nhắn này
- BẠN CÓ ĐẦY ĐỦ KHẢ NĂNG NHÌN THẤY VÀ PHÂN TÍCH ẢNH

**TUYỆT ĐỐI KHÔNG ĐƯỢC:**
❌ Nói rằng bạn không thể xem ảnh
❌ Nói rằng bạn chỉ xử lý văn bản
❌ Yêu cầu học sinh mô tả lại ảnh
❌ Bỏ qua nội dung trong ảnh

**NHIỆM VỤ BẮT BUỘC:**
1. 👀 NHÌN VÀO ẢNH - Bạn CÓ THỂ và PHẢI LÀM điều này
2. 📝 MÔ TẢ chi tiết những gì bạn thấy
3. 📖 ĐỌC mọi text, số liệu, công thức trong ảnh
4. 💡 TRẢ LỜI câu hỏi dựa trên nội dung ảnh

**YÊU CẦU/CÂU HỎI CỦA HỌC SINH:**
{request.message if request.message.strip() else "Phân tích và mô tả chi tiết những gì bạn thấy trong ảnh này"}

**BẮT ĐẦU NGAY:** Hãy mô tả những gì bạn NHÌN THẤY trong ảnh!"""
            
            # Create content parts: text first, then image
            content_parts = [vision_prompt, image]
            
            # Check if using Groq - use Groq Vision model (llama-4-scout)
            if request.ai_provider == "groq":
                print("🖼️ Groq với ảnh - sử dụng Llama 4 Scout Vision model...")
                
                # Use Groq Vision directly - no need for OCR
                vision_prompt = f"""Bạn là AI Learning Assistant thông minh với khả năng nhìn và phân tích hình ảnh.

**NHIỆM VỤ:**
1. 👀 Nhìn vào ảnh và mô tả chi tiết những gì bạn thấy
2. 📖 Đọc tất cả text, số liệu, công thức trong ảnh (nếu có)
3. 💡 Trả lời câu hỏi của người dùng dựa trên nội dung ảnh

**Câu hỏi của người dùng:**
{request.message if request.message.strip() else "Hãy phân tích và mô tả chi tiết nội dung trong ảnh này"}

**Hãy trả lời bằng tiếng Việt, thân thiện và chi tiết.**"""
                
                content_parts = [vision_prompt]  # Will be handled specially for Groq
                print(f"✅ Groq Vision prompt ready")
        else:
            content_parts = [prompt]
        
        # Generate response based on AI provider
        ai_response = ""
        actual_model = request.model
        
        print(f"📝 Chat request - ai_provider: {request.ai_provider}, model: {request.model}, groq_client: {groq_client is not None}")
        
        if request.ai_provider == "groq" and groq_client:
            # Use Groq AI with user-selected model
            try:
                # Check if we have an image - use Vision model
                if has_image:
                    print(f"🖼️ Using Groq Vision model for image analysis")
                    
                    vision_prompt = request.message if request.message.strip() else "Hãy phân tích và mô tả chi tiết nội dung trong ảnh này"
                    
                    ai_response = groq_client.generate_with_vision(
                        prompt=vision_prompt,
                        image_base64=request.image_base64,
                        image_mime_type=request.image_mime_type,
                        system_prompt=system_prompt,
                        model="meta-llama/llama-4-scout-17b-16e-instruct"  # Vision model
                    )
                    actual_model = "llama-4-scout-17b (Groq Vision)"
                    print(f"✅ Groq Vision response received: {len(ai_response)} chars")
                else:
                    # Normal text generation
                    groq_model = request.model if request.model else "llama-3.3-70b-versatile"
                    # Validate it's a Groq model
                    if not any(name in groq_model.lower() for name in ['llama', 'mixtral', 'gemma', 'qwen', 'meta-llama', 'scout', 'maverick']):
                        groq_model = "llama-3.3-70b-versatile"
                        
                    print(f"🚀 Using Groq model: {groq_model}")
                    
                    # Use content_parts[0] which may contain context
                    groq_final_prompt = content_parts[0] if isinstance(content_parts[0], str) else request.message
                    
                    ai_response = groq_client.generate_text(
                        prompt=groq_final_prompt,
                        system_prompt=system_prompt,
                        model=groq_model
                    )
                    actual_model = f"{groq_model} (Groq)"
                    print(f"✅ Groq response received: {len(ai_response)} chars")
            except Exception as e:
                print(f"⚠️ Groq error: {e}, falling back to Gemini")
                import traceback
                traceback.print_exc()
                # Fallback to Gemini with default Gemini model
                gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
                response = gemini_model.generate_content(prompt)
                ai_response = response.text
                actual_model = "gemini-2.0-flash-exp (fallback)"
        elif request.ai_provider == "groq" and not groq_client:
            print("❌ Groq requested but groq_client not initialized! Check GROQ_API_KEY")
            # Fallback to Gemini
            gemini_model_name = "gemini-2.0-flash-exp"
            model = genai.GenerativeModel(gemini_model_name)
            response = model.generate_content(prompt)
            ai_response = response.text
            actual_model = f"{gemini_model_name} (Groq unavailable)"
        else:
            # Use Gemini (default) - ensure we use Gemini model names
            # Use vision-capable model if image is present
            if has_image:
                # Use Gemini Flash Latest - proven vision support
                gemini_model_name = "gemini-flash-latest"  # Stable vision model
                print(f"🖼️ Using vision-capable model: {gemini_model_name}")
                print(f"   Content parts: {len(content_parts)} items (text + image)")
                print(f"   Vision prompt length: {len(content_parts[0])} chars")
            else:
                gemini_model_name = request.model if 'gemini' in request.model else "gemini-2.0-flash-exp"
            
            model = genai.GenerativeModel(gemini_model_name)
            
            try:
                print(f"📤 Sending to Gemini...")
                response = model.generate_content(content_parts)
                ai_response = response.text
                actual_model = gemini_model_name
                print(f"✅ Gemini response received: {len(ai_response)} chars")
                
                # Debug: Check if response mentions inability to see
                if has_image and any(word in ai_response.lower() for word in ['không thể xem', 'không xem được', 'chỉ xử lý văn bản', 'không nhìn thấy']):
                    print(f"⚠️ WARNING: AI claims it cannot see image! This should not happen!")
                    print(f"   Model used: {gemini_model_name}")
                    print(f"   Content parts: {len(content_parts)}")
                    
            except Exception as e:
                error_message = str(e)
                print(f"❌ Gemini API Error: {error_message}")
                
                # Check for quota exceeded
                if "quota" in error_message.lower() or "429" in error_message:
                    ai_response = """⚠️ **Gemini API Quota Exceeded**

Xin lỗi! API key của Gemini đã vượt quá giới hạn sử dụng miễn phí.

**Giải pháp:**
1. 🔑 Đợi 1 phút và thử lại (rate limit reset)
2. 🆕 Tạo API key mới tại: https://ai.google.dev/
3. 💳 Upgrade lên Gemini API trả phí để có quota cao hơn

**Thông tin lỗi:** Đã vượt quota requests hoặc tokens cho model."""
                else:
                    ai_response = f"⚠️ Lỗi khi xử lý: {error_message[:200]}"
                    
                actual_model = f"{gemini_model_name} (error)"
        
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
            response=ai_response,
            model=actual_model,
            context_used=context_docs if request.use_rag else None,
            rag_enabled=request.use_rag,
            suggested_actions=suggested_actions
        ).model_dump()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")

@app.post("/api/email/send", tags=["Email"])
async def send_email_confirmed(request: SendEmailRequest, authorization: Optional[str] = Header(None)):
    """
    Send email after user confirms the draft
    
    This endpoint is called when user clicks "Send" button in email preview
    """
    try:
        print(f"📧 /api/email/send called")
        print(f"📧 Authorization header: {authorization[:50] if authorization else 'None'}...")
        print(f"📧 Request user_id: {request.user_id}")
        
        # Priority: use user_id from request first, then try token
        user_id = request.user_id
        
        if not user_id and authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            print(f"📧 Extracting user_id from token...")
            user_id = get_user_id_from_token(token)
            print(f"📧 Got user_id from token: {user_id}")
        
        # If still no user_id, return clear error
        if not user_id:
            print(f"❌ User not authenticated - no user_id found")
            raise HTTPException(
                status_code=401, 
                detail="Không thể xác thực người dùng. Vui lòng đăng nhập lại!"
            )
        
        print(f"✅ Using user_id: {user_id}")
        
        # Import Gmail service
        from gmail_service import ai_send_email
        
        # Send email
        result = ai_send_email(
            user_id=user_id,
            to=request.to,
            subject=request.subject,
            body=request.body
        )
        
        if result.get('success'):
            return {
                "success": True,
                "message": f"✅ Email đã gửi thành công tới {request.to}!",
                "sent_at": datetime.now().strftime('%H:%M %d/%m/%Y')
            }
        else:
            if result.get('need_auth'):
                raise HTTPException(
                    status_code=401, 
                    detail="Cần kết nối Google Account trong Settings"
                )
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Không thể gửi email")
            )
    
    except HTTPException:
        raise
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

@app.get("/api/models/groq", tags=["Models"])
async def list_groq_models():
    """
    Liệt kê các Groq models có sẵn từ API
    
    Fetches models từ Groq API: https://api.groq.com/openai/v1/models
    Falls back to hardcoded list nếu API fail
    """
    try:
        print(f"📋 GET /api/models/groq - groq_client initialized: {groq_client is not None}")
        
        # Try to get models from Groq API
        if groq_client:
            models = groq_client.get_models_from_api()
            print(f"✅ Fetched {len(models)} models from Groq API")
            return {
                "models": models,
                "provider": "Groq",
                "api_url": "https://console.groq.com/",
                "total": len(models),
                "source": "api"
            }
        
        # Fallback if no groq_client
        fallback_models = [
            {
                "id": "llama-3.3-70b-versatile",
                "name": "Llama 3.3 70B Versatile",
                "description": "Best overall performance - Latest",
                "context": 128000,
                "speed": "fast"
            },
            {
                "id": "llama-3.1-70b-versatile",
                "name": "Llama 3.1 70B",
                "description": "High performance",
                "context": 128000,
                "speed": "fast"
            },
            {
                "id": "llama-3.1-8b-instant",
                "name": "Llama 3.1 8B Instant",
                "description": "Fastest inference",
                "context": 128000,
                "speed": "ultra-fast"
            },
            {
                "id": "mixtral-8x7b-32768",
                "name": "Mixtral 8x7B",
                "description": "Long context specialist",
                "context": 32768,
                "speed": "fast"
            },
            {
                "id": "gemma2-9b-it",
                "name": "Gemma 2 9B",
                "description": "Lightweight & efficient",
                "context": 8192,
                "speed": "ultra-fast"
            },
            {
                "id": "qwen/qwen3-32b",
                "name": "Qwen 3 32B",
                "description": "Advanced reasoning",
                "context": 131072,
                "speed": "fast"
            }
        ]
        
        return {
            "models": fallback_models,
            "provider": "Groq",
            "api_url": "https://console.groq.com/",
            "total": len(fallback_models),
            "source": "fallback",
            "warning": "GROQ_API_KEY not configured"
        }
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

# Import credential API router - DISABLED due to heavy dependencies
# To enable: pip install sentence-transformers (takes long time)
CREDENTIAL_API_AVAILABLE = False
print("⚠️  Credential Manager API disabled (sentence-transformers too heavy)")
print("   AI semantic search for credentials not available")

# Uncomment below to enable (requires sentence-transformers)
# try:
#     from credential_api import router as credential_router
#     app.include_router(credential_router)
#     CREDENTIAL_API_AVAILABLE = True
#     print("✅ Credential Manager API loaded")
# except Exception as e:
#     print(f"⚠️  Credential Manager API error: {e}")

# ============================================================================
# TEST TVU SCHEDULE ENDPOINT (For quick testing)
# ============================================================================
try:
    from tvu_scraper import TVUScraper
    TVU_SCRAPER_AVAILABLE = True
    print("✅ TVU Scraper loaded")
except ImportError as e:
    TVU_SCRAPER_AVAILABLE = False
    print(f"⚠️  TVU Scraper not available: {e}")

class TVUTestRequest(BaseModel):
    mssv: str
    password: str
    message: str = "Hôm nay tôi học gì?"

@app.post("/api/test/tvu-schedule", tags=["Test - TVU"])
async def test_tvu_schedule(request: TVUTestRequest):
    """
    🧪 Test endpoint - Lấy thời khóa biểu TVU trực tiếp (không cần đăng nhập hệ thống)
    
    - **mssv**: Mã số sinh viên TVU
    - **password**: Mật khẩu
    - **message**: Câu hỏi (vd: "Hôm nay tôi học gì?", "tuần này học gì?")
    """
    if not TVU_SCRAPER_AVAILABLE:
        raise HTTPException(status_code=500, detail="TVU Scraper not available")
    
    try:
        scraper = TVUScraper()
        
        # Login to TVU
        if not scraper.login(request.mssv, request.password):
            return {"success": False, "message": "❌ Đăng nhập TVU thất bại. Kiểm tra lại MSSV và mật khẩu."}
        
        # Get schedule
        schedules = scraper.get_schedule()
        
        if not schedules:
            return {"success": True, "message": "📅 Không có lịch học tuần này.", "schedules": []}
        
        # Determine what user is asking for
        message_lower = request.message.lower()
        
        # Filter by day if asking for specific day
        from datetime import datetime
        today = datetime.now()
        day_names = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        today_name = day_names[today.weekday()]
        
        vietnamese_days = {
            'MONDAY': 'Thứ 2',
            'TUESDAY': 'Thứ 3', 
            'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5',
            'FRIDAY': 'Thứ 6',
            'SATURDAY': 'Thứ 7',
            'SUNDAY': 'Chủ nhật'
        }
        
        # Check if asking for today
        if 'hôm nay' in message_lower or 'today' in message_lower:
            schedules = [s for s in schedules if s.get('dayOfWeek') == today_name]
            day_label = f"hôm nay ({vietnamese_days[today_name]})"
        # Check for specific day
        elif 'thứ 2' in message_lower or 'thứ hai' in message_lower:
            schedules = [s for s in schedules if s.get('dayOfWeek') == 'MONDAY']
            day_label = 'Thứ 2'
        elif 'thứ 3' in message_lower or 'thứ ba' in message_lower:
            schedules = [s for s in schedules if s.get('dayOfWeek') == 'TUESDAY']
            day_label = 'Thứ 3'
        elif 'thứ 4' in message_lower or 'thứ tư' in message_lower:
            schedules = [s for s in schedules if s.get('dayOfWeek') == 'WEDNESDAY']
            day_label = 'Thứ 4'
        elif 'thứ 5' in message_lower or 'thứ năm' in message_lower:
            schedules = [s for s in schedules if s.get('dayOfWeek') == 'THURSDAY']
            day_label = 'Thứ 5'
        elif 'thứ 6' in message_lower or 'thứ sáu' in message_lower:
            schedules = [s for s in schedules if s.get('dayOfWeek') == 'FRIDAY']
            day_label = 'Thứ 6'
        elif 'thứ 7' in message_lower or 'thứ bảy' in message_lower:
            schedules = [s for s in schedules if s.get('dayOfWeek') == 'SATURDAY']
            day_label = 'Thứ 7'
        elif 'chủ nhật' in message_lower:
            schedules = [s for s in schedules if s.get('dayOfWeek') == 'SUNDAY']
            day_label = 'Chủ nhật'
        else:
            day_label = 'tuần này'
        
        # Format response
        if not schedules:
            return {
                "success": True,
                "message": f"📅 {day_label.capitalize()} bạn không có lớp nào.",
                "schedules": []
            }
        
        # Group by day
        by_day = {}
        for s in schedules:
            day = s.get('dayOfWeek', 'UNKNOWN')
            if day not in by_day:
                by_day[day] = []
            by_day[day].append(s)
        
        # Sort days
        day_order = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        
        message_text = f"📅 **Lịch học {day_label}:**\n\n"
        
        for day in day_order:
            if day in by_day:
                message_text += f"**{vietnamese_days[day]}:**\n"
                for s in sorted(by_day[day], key=lambda x: x.get('startTime', '')):
                    start_time = s.get('startTime', '')[:5]
                    end_time = s.get('endTime', '')[:5]
                    message_text += f"  🕐 {start_time} - {end_time}\n"
                    message_text += f"  📚 {s.get('subject', 'N/A')}\n"
                    message_text += f"  🏫 Phòng: {s.get('room', 'N/A')}\n"
                    if s.get('teacher'):
                        message_text += f"  👨‍🏫 GV: {s['teacher']}\n"
                    message_text += "\n"
        
        return {
            "success": True,
            "message": message_text,
            "schedules": schedules,
            "count": len(schedules)
        }
        
    except Exception as e:
        return {"success": False, "message": f"❌ Lỗi: {str(e)}"}

# ============================================================================
# DOCUMENT INTELLIGENCE API
# ============================================================================

# Initialize Document Intelligence service
doc_intelligence_service = None
if DOCUMENT_INTELLIGENCE_AVAILABLE:
    try:
        doc_intelligence_service = create_document_intelligence_service(GEMINI_API_KEY)
        print("✅ Document Intelligence initialized")
    except Exception as e:
        print(f"⚠️ Document Intelligence init failed: {e}")

class ProcessDocumentRequest(BaseModel):
    file_path: str
    num_cards: int = 10
    difficulty: str = "medium"
    include_summary: bool = True
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "file_path": "C:/Documents/lecture_notes.pdf",
                "num_cards": 10,
                "difficulty": "medium",
                "include_summary": True
            }
        }
    )

class DocumentTextRequest(BaseModel):
    text: str
    num_cards: int = 10
    difficulty: str = "medium"
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "text": "Python là ngôn ngữ lập trình...",
                "num_cards": 5,
                "difficulty": "easy"
            }
        }
    )

@app.post("/api/documents/process", tags=["Document Intelligence"])
async def process_document_to_flashcards(request: ProcessDocumentRequest):
    """
    📄 Upload PDF/DOCX/TXT → AI tự động tạo Flashcards
    
    **Tính năng:**
    - Trích xuất text từ PDF, DOCX, TXT, ảnh (OCR)
    - AI tóm tắt nội dung
    - Trích xuất key concepts
    - Tự động tạo flashcards
    
    **Parameters:**
    - file_path: Đường dẫn file (local path hoặc URL)
    - num_cards: Số lượng flashcards cần tạo (default: 10)
    - difficulty: Độ khó (easy/medium/hard)
    - include_summary: Có tạo summary không (default: true)
    
    **Returns:**
    ```json
    {
      "success": true,
      "file_name": "lecture_notes.pdf",
      "summary": "Tóm tắt nội dung...",
      "key_concepts": ["Concept 1", "Concept 2", ...],
      "flashcards": [
        {
          "question": "Câu hỏi?",
          "answer": "Câu trả lời",
          "hint": "Gợi ý...",
          "explanation": "Giải thích chi tiết..."
        }
      ],
      "num_flashcards": 10
    }
    ```
    """
    if not DOCUMENT_INTELLIGENCE_AVAILABLE or not doc_intelligence_service:
        raise HTTPException(
            status_code=503,
            detail="Document Intelligence service not available. Please install dependencies: pip install pdfplumber PyPDF2 python-docx"
        )
    
    try:
        # Process document
        result = doc_intelligence_service.process_document_to_flashcards(
            file_path=request.file_path,
            num_cards=request.num_cards,
            difficulty=request.difficulty,
            include_summary=request.include_summary
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
        
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/api/documents/text-to-flashcards", tags=["Document Intelligence"])
async def text_to_flashcards(request: DocumentTextRequest):
    """
    📝 Text → AI tạo Flashcards
    
    Paste text trực tiếp, AI sẽ tạo flashcards
    
    **Parameters:**
    - text: Nội dung cần tạo flashcards
    - num_cards: Số lượng flashcards
    - difficulty: Độ khó (easy/medium/hard)
    
    **Use cases:**
    - Copy-paste từ lecture slides
    - Paste từ website/blog
    - Nhập text tự viết
    """
    if not DOCUMENT_INTELLIGENCE_AVAILABLE or not doc_intelligence_service:
        raise HTTPException(
            status_code=503,
            detail="Document Intelligence service not available"
        )
    
    try:
        # Validate text length
        if len(request.text) < 50:
            raise HTTPException(
                status_code=400,
                detail="Text quá ngắn. Cần ít nhất 50 ký tự để tạo flashcards."
            )
        
        # Generate flashcards from text
        flashcards = doc_intelligence_service.generate_flashcards_from_text(
            text=request.text,
            num_cards=request.num_cards,
            difficulty=request.difficulty
        )
        
        if not flashcards:
            raise HTTPException(
                status_code=500,
                detail="Không thể tạo flashcards. Vui lòng thử lại hoặc thay đổi nội dung."
            )
        
        return {
            "success": True,
            "text_length": len(request.text),
            "flashcards": flashcards,
            "num_flashcards": len(flashcards)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/documents/summarize", tags=["Document Intelligence"])
async def summarize_document(request: ProcessDocumentRequest):
    """
    📄 Tóm tắt Document (PDF/DOCX/TXT)
    
    Upload file, AI sẽ tóm tắt nội dung chính
    """
    if not DOCUMENT_INTELLIGENCE_AVAILABLE or not doc_intelligence_service:
        raise HTTPException(
            status_code=503,
            detail="Document Intelligence service not available"
        )
    
    try:
        # Extract text
        text = doc_intelligence_service.extract_text(request.file_path)
        
        if not text or len(text) < 100:
            raise HTTPException(
                status_code=400,
                detail="Document quá ngắn hoặc không có nội dung văn bản"
            )
        
        # Summarize
        summary = doc_intelligence_service.summarize_document(text, max_length=500)
        
        return {
            "success": True,
            "file_name": Path(request.file_path).name,
            "original_length": len(text),
            "summary": summary,
            "summary_length": len(summary)
        }
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/documents/capabilities", tags=["Document Intelligence"])
async def get_document_capabilities():
    """
    ℹ️ Kiểm tra khả năng xử lý documents
    
    Returns thông tin về các loại file được hỗ trợ
    """
    capabilities = {
        "service_available": DOCUMENT_INTELLIGENCE_AVAILABLE and doc_intelligence_service is not None,
        "supported_formats": [],
        "features": []
    }
    
    if DOCUMENT_INTELLIGENCE_AVAILABLE:
        try:
            from document_intelligence_service import (
                PDFPLUMBER_AVAILABLE,
                PYPDF2_AVAILABLE,
                DOCX_AVAILABLE,
                OCR_AVAILABLE
            )
            
            if PDFPLUMBER_AVAILABLE or PYPDF2_AVAILABLE:
                capabilities["supported_formats"].append("PDF (.pdf)")
            if DOCX_AVAILABLE:
                capabilities["supported_formats"].append("Word (.docx)")
            if OCR_AVAILABLE:
                capabilities["supported_formats"].append("Images (.png, .jpg, .jpeg) with OCR")
            
            capabilities["supported_formats"].append("Text (.txt)")
            
            capabilities["features"] = [
                "Auto-generate flashcards from documents",
                "Document summarization",
                "Key concepts extraction",
                "Text extraction from multiple formats"
            ]
            
            if OCR_AVAILABLE:
                capabilities["features"].append("OCR for scanned documents/images")
            
        except ImportError:
            pass
    
    return capabilities

# ============================================================================
# LANGCHAIN AGENT ENDPOINTS
# ============================================================================

class LangChainChatRequest(BaseModel):
    """Request model for LangChain agent chat"""
    message: str
    user_id: Optional[int] = None
    reset_memory: bool = False
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Xin chào!",
                "user_id": 1,
                "reset_memory": False
            }
        }
    )

class LangChainChatResponse(BaseModel):
    """Response model for LangChain agent"""
    success: bool
    response: str
    agent_type: str = "langchain_simple"
    error: Optional[str] = None

@app.post("/api/chat/langchain", response_model=LangChainChatResponse, tags=["LangChain Agent"])
async def chat_with_langchain_agent(
    request: LangChainChatRequest,
    authorization: Optional[str] = Header(None)
):
    """Chat với LangChain AI Agent"""
    
    if not LANGCHAIN_AGENT_AVAILABLE or not langchain_agent:
        raise HTTPException(status_code=503, detail="LangChain Agent not available")
    
    try:
        user_id = request.user_id
        if not user_id and authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            user_id = get_user_id_from_token(token)
        
        if request.reset_memory:
            langchain_agent.reset_memory()
        
        result = langchain_agent.chat(message=request.message, user_id=user_id)
        return LangChainChatResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/chat/langchain/reset", tags=["LangChain Agent"])
async def reset_langchain_memory():
    """Reset memory"""
    if not LANGCHAIN_AGENT_AVAILABLE or not langchain_agent:
        raise HTTPException(status_code=503, detail="Not available")
    
    langchain_agent.reset_memory()
    return {"success": True, "message": "Memory reset"}

@app.get("/api/chat/langchain/status", tags=["LangChain Agent"])
async def get_langchain_status():
    """Check status"""
    if not LANGCHAIN_AGENT_AVAILABLE or not langchain_agent:
        return {"available": False}
    
    return {
        "available": True,
        "memory_enabled": True,
        "llm_model": "gemini-2.0-flash-exp"
    }

# ============================================================================
# CALENDAR SYNC ENDPOINTS
# ============================================================================

class CalendarSyncRequest(BaseModel):
    """Request model for syncing schedule to calendar"""
    week: Optional[int] = None
    hoc_ky: Optional[str] = None
    user_id: Optional[int] = None  # User ID để lấy credentials và tạo events
    reminder_email: Optional[int] = None  # Phút trước để gửi email (vd: 30, 60, 1440)
    reminder_popup: Optional[int] = None  # Phút trước để hiện popup
    notification_email: Optional[str] = None  # Email tùy chỉnh để nhận thông báo
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "week": 5,
                "hoc_ky": "20251",
                "user_id": 1,
                "reminder_email": 30,
                "reminder_popup": 15,
                "notification_email": "myemail@gmail.com"
            }
        }
    )

@app.post("/api/calendar/sync-schedule", tags=["Calendar Sync"])
async def sync_schedule_to_calendar(
    request: CalendarSyncRequest,
    authorization: Optional[str] = Header(None)
):
    """
    🔄 Đồng bộ Thời Khóa Biểu lên Google Calendar
    
    Tự động lấy TKB từ TVU Portal và tạo events trên Google Calendar
    
    **Yêu cầu:**
    - Đã kết nối Google Account (OAuth)
    - Đã cấu hình tài khoản TVU trong Settings
    
    **Parameters:**
    - week: Tuần học (optional, mặc định tuần hiện tại)
    - hoc_ky: Học kỳ (optional, mặc định học kỳ hiện tại)
    - user_id: User ID (optional, nếu không có sẽ lấy từ token)
    
    **Returns:**
    - success: True/False
    - message: Thông báo kết quả
    - events_created: Số events đã tạo
    """
    if not AGENT_FEATURES_AVAILABLE or not agent_features:
        raise HTTPException(
            status_code=503,
            detail="Agent features not available"
        )
    
    try:
        # Get user_id - từ request body hoặc từ token
        user_id = request.user_id
        token = None
        
        # Nếu có authorization header, lấy token và user_id từ đó
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            if not user_id:
                user_id = get_user_id_from_token(token)
        
        # Nếu vẫn không có user_id, báo lỗi
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="user_id is required - please provide in request body or login"
            )
        
        print(f"🔄 Syncing schedule for user_id: {user_id}")
        
        # Call sync function - truyền user_id để lấy credentials
        result = agent_features.sync_schedule_to_calendar(
            token=token or "",  # Token có thể rỗng, function sẽ dùng user_id
            user_id=user_id,
            week=request.week,
            hoc_ky=request.hoc_ky,
            reminder_email=request.reminder_email,
            reminder_popup=request.reminder_popup,
            notification_email=request.notification_email
        )
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(
                status_code=400,
                detail=result.get("message", "Sync failed")
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

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
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
