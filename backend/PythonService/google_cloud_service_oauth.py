"""
Google Cloud Services with OAuth Support
Sử dụng user's OAuth token thay vì server API key
"""
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
import requests
import base64

load_dotenv()

app = FastAPI(
    title="Google Cloud Services with OAuth",
    description="Google Cloud APIs using user's OAuth tokens",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# CONFIGURATION
# ============================================================================

OAUTH_SERVICE_URL = os.getenv("OAUTH_SERVICE_URL", "http://localhost:8003")
FALLBACK_API_KEY = os.getenv("GOOGLE_CLOUD_API_KEY")  # Fallback nếu user chưa connect

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_user_token(user_id: int) -> Optional[str]:
    """Get valid OAuth token for user"""
    try:
        response = requests.get(
            f"{OAUTH_SERVICE_URL}/api/oauth/google/token/{user_id}",
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['access_token']
        return None
    except Exception as e:
        print(f"Error getting user token: {e}")
        return None

def get_auth_header(token: str) -> Dict[str, str]:
    """Build authorization header"""
    return {"Authorization": f"Bearer {token}"}

# ============================================================================
# MODELS
# ============================================================================

class VisionAnalyzeRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    features: List[str] = ["labels", "text"]
    user_id: int

class TranslateRequest(BaseModel):
    text: str
    target_language: str = "vi"
    source_language: Optional[str] = None
    user_id: int

class SpeechToTextRequest(BaseModel):
    audio_base64: str
    language_code: str = "vi-VN"
    user_id: int

class TextToSpeechRequest(BaseModel):
    text: str
    language_code: str = "vi-VN"
    user_id: int

class AnalyzeSentimentRequest(BaseModel):
    text: str
    language: str = "vi"
    user_id: int

class CalendarEventRequest(BaseModel):
    summary: str
    description: Optional[str] = None
    start_time: str  # ISO 8601 format: "2025-12-25T10:00:00+07:00"
    end_time: str
    location: Optional[str] = None
    attendees: Optional[List[str]] = None
    user_id: int
    # Reminder settings
    reminder_email: Optional[int] = None  # Minutes before event to send email reminder (e.g., 30, 60, 1440 for 1 day)
    reminder_popup: Optional[int] = None  # Minutes before event for popup notification

class CalendarListRequest(BaseModel):
    time_min: Optional[str] = None  # ISO 8601
    time_max: Optional[str] = None
    max_results: int = 10
    user_id: int

# Gmail Models
class GmailReadRequest(BaseModel):
    user_id: int
    max_results: int = 5
    only_unread: bool = False

class GmailSendRequest(BaseModel):
    user_id: int
    to: str
    subject: str
    body: str
    html: bool = False

class GmailSearchRequest(BaseModel):
    user_id: int
    query: str
    max_results: int = 10

class GmailDraftRequest(BaseModel):
    subject_keyword: str
    recipient_name: Optional[str] = None

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Health check"""
    return {
        "status": "running",
        "service": "Google Cloud Services with OAuth",
        "oauth_enabled": True,
        "fallback_available": bool(FALLBACK_API_KEY),
        "apis": {
            "vision": "Image analysis",
            "translate": "Text translation",
            "speech": "Speech-to-text & Text-to-speech",
            "language": "Sentiment analysis",
            "calendar": "Google Calendar events",
            "gmail": "Gmail read/send/search"
        }
    }

@app.post("/api/google-cloud/vision/analyze", tags=["Vision"])
async def analyze_image(request: VisionAnalyzeRequest):
    """
    Analyze image using user's OAuth token
    Falls back to server API key if user not connected
    """
    try:
        # Get user's token
        token = await get_user_token(request.user_id)
        
        if not token and not FALLBACK_API_KEY:
            raise HTTPException(
                status_code=401,
                detail="Please connect your Google account in Settings"
            )
        
        # Prepare request
        if request.image_url:
            image_data = {"source": {"imageUri": request.image_url}}
        elif request.image_base64:
            image_data = {"content": request.image_base64}
        else:
            raise HTTPException(status_code=400, detail="Provide image_url or image_base64")
        
        # Build features
        features = [{"type": f.upper()} for f in request.features]
        
        # Call Vision API
        api_url = "https://vision.googleapis.com/v1/images:annotate"
        
        if token:
            # Use user's OAuth token
            headers = get_auth_header(token)
            response = requests.post(
                api_url,
                json={
                    "requests": [{
                        "image": image_data,
                        "features": features
                    }]
                },
                headers=headers
            )
        else:
            # Fallback to API key
            response = requests.post(
                f"{api_url}?key={FALLBACK_API_KEY}",
                json={
                    "requests": [{
                        "image": image_data,
                        "features": features
                    }]
                }
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        data = response.json()
        result = data['responses'][0]
        
        # Format results
        formatted = {}
        
        if 'labelAnnotations' in result:
            formatted['labels'] = [
                {"description": label['description'], "score": label['score']}
                for label in result['labelAnnotations']
            ]
        
        if 'textAnnotations' in result:
            formatted['text'] = result['textAnnotations'][0]['description'] if result['textAnnotations'] else ""
        
        if 'faceAnnotations' in result:
            formatted['faces'] = [
                {
                    "joy": face.get('joyLikelihood', 'UNKNOWN'),
                    "sorrow": face.get('sorrowLikelihood', 'UNKNOWN')
                }
                for face in result['faceAnnotations']
            ]
        
        return {
            "success": True,
            "results": formatted,
            "used_oauth": bool(token)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/google-cloud/translate", tags=["Translation"])
async def translate_text(request: TranslateRequest):
    """
    Translate text using user's OAuth token
    """
    try:
        # Get user's token
        token = await get_user_token(request.user_id)
        
        if not token and not FALLBACK_API_KEY:
            raise HTTPException(
                status_code=401,
                detail="Please connect your Google account in Settings"
            )
        
        # Call Translation API
        api_url = "https://translation.googleapis.com/language/translate/v2"
        
        params = {
            "q": request.text,
            "target": request.target_language
        }
        
        if request.source_language:
            params["source"] = request.source_language
        
        if token:
            # Use OAuth token
            headers = get_auth_header(token)
            response = requests.post(api_url, json=params, headers=headers)
        else:
            # Fallback to API key
            params["key"] = FALLBACK_API_KEY
            response = requests.post(api_url, params=params)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        data = response.json()
        translation = data['data']['translations'][0]
        
        return {
            "success": True,
            "original_text": request.text,
            "translated_text": translation['translatedText'],
            "detected_source_language": translation.get('detectedSourceLanguage'),
            "target_language": request.target_language,
            "used_oauth": bool(token)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/google-cloud/speech/synthesize", tags=["Speech"])
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech using user's OAuth token
    """
    try:
        # Get user's token
        token = await get_user_token(request.user_id)
        
        if not token and not FALLBACK_API_KEY:
            raise HTTPException(
                status_code=401,
                detail="Please connect your Google account in Settings"
            )
        
        # Call Text-to-Speech API
        api_url = "https://texttospeech.googleapis.com/v1/text:synthesize"
        
        payload = {
            "input": {"text": request.text},
            "voice": {
                "languageCode": request.language_code,
                "ssmlGender": "NEUTRAL"
            },
            "audioConfig": {
                "audioEncoding": "MP3"
            }
        }
        
        if token:
            headers = get_auth_header(token)
            response = requests.post(api_url, json=payload, headers=headers)
        else:
            response = requests.post(f"{api_url}?key={FALLBACK_API_KEY}", json=payload)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        data = response.json()
        
        return {
            "success": True,
            "audio_base64": data['audioContent'],
            "audio_format": "mp3",
            "text": request.text,
            "used_oauth": bool(token)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/google-cloud/language/analyze-sentiment", tags=["Natural Language"])
async def analyze_sentiment(request: AnalyzeSentimentRequest):
    """
    Analyze sentiment using user's OAuth token
    """
    try:
        # Get user's token
        token = await get_user_token(request.user_id)
        
        if not token and not FALLBACK_API_KEY:
            raise HTTPException(
                status_code=401,
                detail="Please connect your Google account in Settings"
            )
        
        # Call Natural Language API
        api_url = "https://language.googleapis.com/v1/documents:analyzeSentiment"
        
        payload = {
            "document": {
                "type": "PLAIN_TEXT",
                "content": request.text,
                "language": request.language
            }
        }
        
        if token:
            headers = get_auth_header(token)
            response = requests.post(api_url, json=payload, headers=headers)
        else:
            response = requests.post(f"{api_url}?key={FALLBACK_API_KEY}", json=payload)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        data = response.json()
        sentiment = data['documentSentiment']
        
        # Classify
        score = sentiment['score']
        if score > 0.25:
            label = "Positive 😊"
        elif score < -0.25:
            label = "Negative 😞"
        else:
            label = "Neutral 😐"
        
        return {
            "success": True,
            "sentiment": {
                "score": score,
                "magnitude": sentiment['magnitude'],
                "label": label
            },
            "text": request.text,
            "used_oauth": bool(token)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============================================================================
# GOOGLE CALENDAR API
# ============================================================================

@app.post("/api/google-cloud/calendar/create-event", tags=["Calendar"])
async def create_calendar_event(request: CalendarEventRequest):
    """
    Tạo event mới trên Google Calendar
    """
    try:
        # Validate required fields
        if not request.summary or not request.summary.strip():
            raise HTTPException(status_code=400, detail="Summary is required")
        
        if not request.start_time or not request.end_time:
            raise HTTPException(status_code=400, detail="Start time and end time are required")
        
        # Validate datetime format (should be ISO 8601 with timezone)
        if '+' not in request.start_time and 'Z' not in request.start_time:
            raise HTTPException(
                status_code=400, 
                detail="Invalid start_time format. Use ISO 8601 with timezone (e.g., 2025-12-23T10:00:00+07:00)"
            )
        
        if '+' not in request.end_time and 'Z' not in request.end_time:
            raise HTTPException(
                status_code=400, 
                detail="Invalid end_time format. Use ISO 8601 with timezone (e.g., 2025-12-23T11:00:00+07:00)"
            )
        
        # Get user's OAuth token
        token = await get_user_token(request.user_id)
        
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Please connect your Google account to use Calendar"
            )
        
        # Prepare event data
        event_data = {
            "summary": request.summary,
            "description": request.description,
            "start": {
                "dateTime": request.start_time,
                "timeZone": "Asia/Ho_Chi_Minh"
            },
            "end": {
                "dateTime": request.end_time,
                "timeZone": "Asia/Ho_Chi_Minh"
            }
        }
        
        if request.location:
            event_data["location"] = request.location
        
        if request.attendees:
            event_data["attendees"] = [{"email": email} for email in request.attendees]
        
        # Add reminders if specified
        if request.reminder_email is not None or request.reminder_popup is not None:
            reminders = []
            if request.reminder_email is not None:
                reminders.append({
                    "method": "email",
                    "minutes": request.reminder_email
                })
            if request.reminder_popup is not None:
                reminders.append({
                    "method": "popup", 
                    "minutes": request.reminder_popup
                })
            
            event_data["reminders"] = {
                "useDefault": False,
                "overrides": reminders
            }
        
        # Call Calendar API
        api_url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        headers = get_auth_header(token)
        
        print(f"\n🔍 DEBUG - Creating calendar event for user {request.user_id}")
        print(f"📍 API URL: {api_url}")
        print(f"📝 Event data: {event_data}")
        print(f"🔑 Token (first 20 chars): {token[:20]}...")
        
        response = requests.post(
            api_url,
            json=event_data,
            headers=headers
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📄 Response body: {response.text[:500]}")
        
        if response.status_code not in [200, 201]:
            error_detail = response.text
            try:
                error_json = response.json()
                if 'error' in error_json:
                    error_detail = error_json['error'].get('message', response.text)
            except:
                pass
            
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Calendar API error: {error_detail}"
            )
        
        event = response.json()
        
        return {
            "success": True,
            "message": f"✅ Đã tạo sự kiện: {event['summary']}",
            "event": {
                "id": event['id'],
                "summary": event['summary'],
                "start": event['start'].get('dateTime', event['start'].get('date')),
                "end": event['end'].get('dateTime', event['end'].get('date')),
                "html_link": event['htmlLink']
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/google-cloud/calendar/list-events", tags=["Calendar"])
async def list_calendar_events(request: CalendarListRequest):
    """
    Lấy danh sách events từ Google Calendar
    """
    try:
        # Get user's OAuth token
        token = await get_user_token(request.user_id)
        
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Please connect your Google account to use Calendar"
            )
        
        # Build query parameters
        params = {
            "maxResults": request.max_results,
            "singleEvents": True,
            "orderBy": "startTime"
        }
        
        if request.time_min:
            params["timeMin"] = request.time_min
        if request.time_max:
            params["timeMax"] = request.time_max
        
        # Call Calendar API
        api_url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        headers = get_auth_header(token)
        
        response = requests.get(
            api_url,
            params=params,
            headers=headers
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Calendar API error: {response.text}"
            )
        
        data = response.json()
        events = data.get('items', [])
        
        # Format events
        formatted_events = []
        for event in events:
            formatted_events.append({
                "id": event['id'],
                "summary": event.get('summary', '(No title)'),
                "description": event.get('description', ''),
                "start": event['start'].get('dateTime', event['start'].get('date')),
                "end": event['end'].get('dateTime', event['end'].get('date')),
                "location": event.get('location', ''),
                "html_link": event.get('htmlLink', '')
            })
        
        return {
            "success": True,
            "count": len(formatted_events),
            "events": formatted_events
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/google-cloud/calendar/today-events/{user_id}", tags=["Calendar"])
async def get_today_events(user_id: int):
    """
    Lấy events hôm nay
    """
    try:
        from datetime import datetime, timedelta
        
        # Get today's date range
        now = datetime.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        # Create request
        request = CalendarListRequest(
            user_id=user_id,
            time_min=start_of_day.isoformat() + "+07:00",
            time_max=end_of_day.isoformat() + "+07:00",
            max_results=20
        )
        
        return await list_calendar_events(request)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.delete("/api/google-cloud/calendar/delete-event/{event_id}", tags=["Calendar"])
async def delete_calendar_event(event_id: str, user_id: int):
    """
    Xóa event khỏi Google Calendar
    """
    try:
        # Get user's OAuth token
        token = await get_user_token(user_id)
        
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Please connect your Google account to use Calendar"
            )
        
        # Call Calendar API
        api_url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}"
        headers = get_auth_header(token)
        
        response = requests.delete(api_url, headers=headers)
        
        if response.status_code != 204:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Calendar API error: {response.text}"
            )
        
        return {
            "success": True,
            "message": "✅ Đã xóa sự kiện khỏi Calendar"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============================================================================
# GMAIL API
# ============================================================================

@app.post("/api/google-cloud/gmail/read", tags=["Gmail"])
async def read_emails(request: GmailReadRequest):
    """
    📧 Đọc emails từ Gmail inbox
    
    Yêu cầu: User đã kết nối Google Account
    """
    try:
        from gmail_service import ai_read_emails
        
        result = ai_read_emails(
            user_id=request.user_id,
            max_results=request.max_results,
            only_unread=request.only_unread
        )
        
        if not result.get("success"):
            if result.get("need_auth"):
                raise HTTPException(
                    status_code=401,
                    detail="Please connect Google Account in Settings"
                )
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to read emails")
            )
        
        return {
            "success": True,
            "emails": result.get("emails", []),
            "count": len(result.get("emails", []))
        }
    
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=500, detail="Gmail service not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/google-cloud/gmail/send", tags=["Gmail"])
async def send_email(request: GmailSendRequest):
    """
    📤 Gửi email qua Gmail
    
    Example:
    ```json
    {
      "user_id": 1,
      "to": "teacher@tvu.edu.vn",
      "subject": "Xin nghỉ học",
      "body": "Kính gửi thầy..."
    }
    ```
    """
    try:
        from gmail_service import ai_send_email
        
        result = ai_send_email(
            user_id=request.user_id,
            to=request.to,
            subject=request.subject,
            body=request.body
        )
        
        if not result.get("success"):
            if result.get("need_auth"):
                raise HTTPException(status_code=401, detail="Need Google OAuth")
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to send email")
            )
        
        return {
            "success": True,
            "message": f"✅ Email sent to {request.to}"
        }
    
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=500, detail="Gmail service not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/google-cloud/gmail/search", tags=["Gmail"])
async def search_emails(request: GmailSearchRequest):
    """
    🔍 Tìm kiếm emails trong Gmail
    
    Query examples:
    - "from:teacher@tvu.edu.vn"
    - "subject:thời khóa biểu"
    - "has:attachment"
    """
    try:
        from gmail_service import ai_search_emails
        
        result = ai_search_emails(
            user_id=request.user_id,
            query=request.query,
            max_results=request.max_results
        )
        
        if not result.get("success"):
            if result.get("need_auth"):
                raise HTTPException(status_code=401, detail="Need Google OAuth")
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Search failed")
            )
        
        return {
            "success": True,
            "emails": result.get("emails", []),
            "query": request.query,
            "count": len(result.get("emails", []))
        }
    
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=500, detail="Gmail service not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/google-cloud/gmail/contacts/{user_id}", tags=["Gmail"])
async def get_contacts(user_id: int, max_results: int = 20):
    """
    👥 Lấy danh sách contacts từ sent emails
    
    Returns: List contacts với name, email, và số lần gửi
    """
    try:
        from gmail_service import ai_get_contacts
        
        result = ai_get_contacts(user_id=user_id, max_results=max_results)
        
        if not result.get("success"):
            if result.get("need_auth"):
                raise HTTPException(status_code=401, detail="Need Google OAuth")
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to get contacts")
            )
        
        return {
            "success": True,
            "contacts": result.get("contacts", []),
            "total": len(result.get("contacts", []))
        }
    
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=500, detail="Gmail service not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/google-cloud/gmail/draft", tags=["Gmail"])
async def create_draft(request: GmailDraftRequest):
    """
    ✏️ Tạo draft email bằng AI (Groq)
    
    Example:
    ```json
    {
      "subject_keyword": "xin nghỉ học",
      "recipient_name": "thầy Nguyễn Văn A"
    }
    ```
    
    AI sẽ generate subject và body phù hợp với context
    """
    try:
        from gmail_service import ai_create_draft_email
        
        result = ai_create_draft_email(
            subject_keyword=request.subject_keyword,
            recipient_name=request.recipient_name
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to create draft")
            )
        
        return {
            "success": True,
            "subject": result.get("subject", ""),
            "body": result.get("body", ""),
            "recipient_name": request.recipient_name
        }
    
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=500, detail="Gmail service not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============================================================================
# DEBUG / DIAGNOSTIC ENDPOINTS
# ============================================================================

@app.get("/api/google-cloud/debug/token-info/{user_id}", tags=["Debug"])
async def get_token_info(user_id: int):
    """
    🔍 Kiểm tra thông tin OAuth token của user
    """
    try:
        token = await get_user_token(user_id)
        
        if not token:
            return {
                "has_token": False,
                "message": "User chưa kết nối Google account"
            }
        
        # Test token bằng cách gọi userinfo endpoint
        userinfo_response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers=get_auth_header(token),
            timeout=5
        )
        
        # Test calendar API access
        calendar_response = requests.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary",
            headers=get_auth_header(token),
            timeout=5
        )
        
        return {
            "has_token": True,
            "token_length": len(token),
            "token_prefix": token[:20] + "...",
            "userinfo_status": userinfo_response.status_code,
            "userinfo_success": userinfo_response.status_code == 200,
            "calendar_access_status": calendar_response.status_code,
            "calendar_access_success": calendar_response.status_code == 200,
            "calendar_error": calendar_response.text if calendar_response.status_code != 200 else None,
            "message": "✅ Token valid" if userinfo_response.status_code == 200 else "❌ Token invalid or expired"
        }
    
    except Exception as e:
        return {
            "has_token": False,
            "error": str(e)
        }

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("GOOGLE_CLOUD_OAUTH_PORT", 8004))
    print("=" * 60)
    print("🌐 Starting Google Cloud Services with OAuth")
    print("=" * 60)
    print(f"📍 Server: http://localhost:{port}")
    print(f"📚 Swagger UI: http://localhost:{port}/docs")
    print(f"🔐 OAuth Service: {OAUTH_SERVICE_URL}")
    print("")
    print("📦 Available APIs:")
    print("   🖼️  Vision API - Image analysis")
    print("   🌍 Translate API - Text translation")
    print("   🎤 Speech API - Speech-to-text & TTS")
    print("   📊 Language API - Sentiment analysis")
    print("   📅 Calendar API - Google Calendar")
    print("   📧 Gmail API - Read/Send/Search emails")
    print("=" * 60)
    uvicorn.run("google_cloud_service_oauth:app", host="0.0.0.0", port=port, reload=True)
