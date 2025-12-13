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
        "fallback_available": bool(FALLBACK_API_KEY)
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
    print("=" * 60)
    uvicorn.run("google_cloud_service_oauth:app", host="0.0.0.0", port=port, reload=True)
