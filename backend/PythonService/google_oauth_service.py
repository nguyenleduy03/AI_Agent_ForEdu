"""
Google OAuth 2.0 Service
Quản lý OAuth flow và token management cho user
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict
import os
from dotenv import load_dotenv
import requests
from datetime import datetime, timedelta
import json
from cryptography.fernet import Fernet
import base64

load_dotenv()

app = FastAPI(
    title="Google OAuth Service",
    description="OAuth 2.0 service for Google Cloud APIs",
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

GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
GOOGLE_OAUTH_REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:8080/api/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080")

# Encryption key for tokens
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

# OAuth scopes
SCOPES = [
    # Google Cloud APIs
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/cloud-vision",
    "https://www.googleapis.com/auth/cloud-translation",
    # Gmail API
    "https://www.googleapis.com/auth/gmail.readonly",     # Read emails
    "https://www.googleapis.com/auth/gmail.send",         # Send emails
    "https://www.googleapis.com/auth/gmail.compose",      # Compose/draft emails
    "https://www.googleapis.com/auth/gmail.modify",       # Modify labels, mark read/unread
    # Calendar API
    "https://www.googleapis.com/auth/calendar",           # Full calendar access
    "https://www.googleapis.com/auth/calendar.events",    # Manage events
    # Google Drive API - Upload files/videos
    "https://www.googleapis.com/auth/drive.file",         # Manage files created by app
    # User info
    "openid",
    "email",
    "profile"
]

# ============================================================================
# MODELS
# ============================================================================

class OAuthInitResponse(BaseModel):
    auth_url: str
    state: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str]
    expires_in: int
    token_type: str
    scope: str

class UserTokenInfo(BaseModel):
    user_id: int
    email: str
    google_connected: bool
    token_expiry: Optional[str]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def encrypt_token(token: str) -> str:
    """Encrypt token for storage"""
    return cipher_suite.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt token from storage"""
    return cipher_suite.decrypt(encrypted_token.encode()).decode()

def is_token_expired(expiry_time: str) -> bool:
    """Check if token is expired"""
    if not expiry_time:
        return True
    expiry = datetime.fromisoformat(expiry_time)
    return datetime.now() >= expiry

def save_user_tokens(user_id: int, access_token: str, refresh_token: str, expires_in: int):
    """Save tokens to Spring Boot backend"""
    try:
        expiry_time = datetime.now() + timedelta(seconds=expires_in)
        
        # Encrypt tokens
        encrypted_access = encrypt_token(access_token)
        encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None
        
        # Save to Spring Boot
        response = requests.post(
            f"{SPRING_BOOT_URL}/api/users/{user_id}/google-tokens",
            json={
                "accessToken": encrypted_access,
                "refreshToken": encrypted_refresh,
                "expiryTime": expiry_time.isoformat(),
                "connected": True
            },
            timeout=5
        )
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error saving tokens: {e}")
        return False

def get_user_tokens(user_id: int) -> Optional[Dict]:
    """Get user tokens from Spring Boot backend"""
    try:
        response = requests.get(
            f"{SPRING_BOOT_URL}/api/users/{user_id}/google-tokens",
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Decrypt tokens
            if data.get('accessToken'):
                data['accessToken'] = decrypt_token(data['accessToken'])
            if data.get('refreshToken'):
                data['refreshToken'] = decrypt_token(data['refreshToken'])
            
            return data
        return None
    except Exception as e:
        print(f"Error getting tokens: {e}")
        return None

def refresh_access_token(refresh_token: str) -> Optional[Dict]:
    """Refresh access token using refresh token"""
    try:
        response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_OAUTH_CLIENT_ID,
                "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
        )
        
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Error refreshing token: {e}")
        return None

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Health check"""
    return {
        "status": "running",
        "service": "Google OAuth Service",
        "oauth_configured": bool(GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET)
    }

@app.get("/api/oauth/google/init", tags=["OAuth"])
async def init_oauth(user_id: int):
    """
    Initialize OAuth flow
    Returns authorization URL for user to visit
    """
    if not GOOGLE_OAUTH_CLIENT_ID:
        raise HTTPException(status_code=503, detail="OAuth not configured")
    
    # Generate state for CSRF protection
    state = base64.urlsafe_b64encode(f"{user_id}:{datetime.now().timestamp()}".encode()).decode()
    
    # Build authorization URL
    scope_string = " ".join(SCOPES)
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_OAUTH_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_OAUTH_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope={scope_string}&"
        f"state={state}&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    
    return OAuthInitResponse(
        auth_url=auth_url,
        state=state
    )

@app.get("/api/oauth/google/callback", tags=["OAuth"])
async def oauth_callback(code: str, state: str):
    """
    OAuth callback endpoint
    Exchanges authorization code for tokens
    """
    try:
        # Decode state to get user_id
        decoded_state = base64.urlsafe_b64decode(state.encode()).decode()
        user_id = int(decoded_state.split(':')[0])
        
        # Exchange code for tokens
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_OAUTH_CLIENT_ID,
                "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
                "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
                "grant_type": "authorization_code"
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")
        
        tokens = token_response.json()
        
        # Save tokens
        success = save_user_tokens(
            user_id=user_id,
            access_token=tokens['access_token'],
            refresh_token=tokens.get('refresh_token'),
            expires_in=tokens['expires_in']
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save tokens")
        
        # Return HTML that sends postMessage and closes
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>OAuth Success</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    backdrop-filter: blur(10px);
                }}
                .checkmark {{
                    font-size: 4rem;
                    animation: scaleIn 0.5s ease-out;
                }}
                @keyframes scaleIn {{
                    from {{ transform: scale(0); }}
                    to {{ transform: scale(1); }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="checkmark">✅</div>
                <h1>Connected Successfully!</h1>
                <p>You can close this window now.</p>
            </div>
            <script>
                // Send success message to parent window
                if (window.opener) {{
                    window.opener.postMessage(
                        {{ type: 'OAUTH_SUCCESS', userId: {user_id} }},
                        '{FRONTEND_URL}'
                    );
                }}
                // Auto-close after 2 seconds
                setTimeout(() => {{
                    window.close();
                }}, 2000);
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    
    except Exception as e:
        print(f"OAuth callback error: {e}")
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>OAuth Error</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    backdrop-filter: blur(10px);
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>❌ Connection Failed</h1>
                <p>{str(e)}</p>
                <p>Please close this window and try again.</p>
            </div>
            <script>
                // Send error message to parent window
                if (window.opener) {{
                    window.opener.postMessage(
                        {{ type: 'OAUTH_ERROR', error: '{str(e)}' }},
                        '{FRONTEND_URL}'
                    );
                }}
                // Auto-close after 3 seconds
                setTimeout(() => {{
                    window.close();
                }}, 3000);
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)

@app.get("/api/oauth/google/status/{user_id}", tags=["OAuth"])
async def get_oauth_status(user_id: int):
    """
    Get user's Google OAuth connection status
    """
    try:
        tokens = get_user_tokens(user_id)
        
        if not tokens:
            return {
                "connected": False,
                "message": "Not connected to Google"
            }
        
        # Check if token is expired
        expired = is_token_expired(tokens.get('expiryTime'))
        
        return {
            "connected": True,
            "expired": expired,
            "expiry_time": tokens.get('expiryTime'),
            "email": tokens.get('email')
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/oauth/google/disconnect/{user_id}", tags=["OAuth"])
async def disconnect_google(user_id: int):
    """
    Disconnect user's Google account
    Revokes tokens and removes from database
    """
    try:
        tokens = get_user_tokens(user_id)
        
        if tokens and tokens.get('accessToken'):
            # Revoke token on Google
            requests.post(
                f"https://oauth2.googleapis.com/revoke?token={tokens['accessToken']}"
            )
        
        # Remove from database
        response = requests.delete(
            f"{SPRING_BOOT_URL}/api/users/{user_id}/google-tokens",
            timeout=5
        )
        
        return {
            "success": True,
            "message": "Google account disconnected"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/oauth/google/token/{user_id}", tags=["OAuth"])
async def get_valid_token(user_id: int):
    """
    Get valid access token for user
    Automatically refreshes if expired
    """
    try:
        tokens = get_user_tokens(user_id)
        
        if not tokens:
            raise HTTPException(status_code=404, detail="User not connected to Google")
        
        # Check if expired
        if is_token_expired(tokens.get('expiryTime')):
            # Refresh token
            if not tokens.get('refreshToken'):
                raise HTTPException(status_code=401, detail="Token expired and no refresh token available")
            
            new_tokens = refresh_access_token(tokens['refreshToken'])
            
            if not new_tokens:
                raise HTTPException(status_code=401, detail="Failed to refresh token")
            
            # Save new tokens
            save_user_tokens(
                user_id=user_id,
                access_token=new_tokens['access_token'],
                refresh_token=tokens['refreshToken'],  # Keep old refresh token
                expires_in=new_tokens['expires_in']
            )
            
            return {
                "access_token": new_tokens['access_token'],
                "refreshed": True
            }
        
        return {
            "access_token": tokens['accessToken'],
            "refreshed": False
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
    port = int(os.getenv("OAUTH_SERVICE_PORT", 8003))
    print("=" * 60)
    print("🔐 Starting Google OAuth Service")
    print("=" * 60)
    print(f"📍 Server: http://localhost:{port}")
    print(f"📚 Swagger UI: http://localhost:{port}/docs")
    print(f"✅ OAuth Configured: {bool(GOOGLE_OAUTH_CLIENT_ID)}")
    print("=" * 60)
    uvicorn.run("google_oauth_service:app", host="0.0.0.0", port=port, reload=True)
